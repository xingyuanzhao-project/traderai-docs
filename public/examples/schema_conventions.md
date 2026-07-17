# Schema Authoring Conventions

How to write a workflow schema for this system. Every rule below is enforced or
consumed by named code; the file references are the source of truth, not this
document. This system is a **price / economic monitor that produces trading
insight** — every schema must collect real market/macro/news/social evidence and
reason over it, never run abstract or topology-only exercises.

## 0. Where schemas live and how they load

- One file per schema: `schemas/<schema_id>.yaml`. The filename stem **is** the
  `schema_id` (`backend/schema/persistence.py` `_schema_file_path`).
- The running app reads `schemas/` at runtime (`backend/main.py`), loads via
  `WorkflowSchema.model_validate`, and exposes them at `GET /api/schemas`.
- Validate before shipping (see §9). Runs are triggered by `POST /api/runs`
  with `{"schema_id": ...}` and write a JSONL log when `config.save_log` is true.

## 1. Data model (the only legal fields)

Source of truth: `backend/schema/models.py`.

| Object | Required keys | Notes |
|---|---|---|
| `WorkflowSchema` | `schema_id`, `name`, `description`, `nodes`, `edges`, `config` | top-level container |
| `NodeDefinition` | `node_id`, `node_type`, `label`, `config`, `position` | `group_config` required only for `agent_group` |
| `node_type` | `agent` \| `agent_group` \| `tool` | |
| `EdgeDefinition` | `edge_id`, `edge_type`, `source_node_id`, `target_node_id` | `loop_rounds` only on loop-closing edges |
| `edge_type` | `data_flow` \| `tool_call` \| `synchronization` | |
| `WorkflowConfig` | `total_timeout`, `logging_level`, `max_loop_rounds`, `max_iterations`, `iteration_sleep`, `save_log`, `on_node_failure` | |

Removed fields that will now **hard-fail** validation (do not reintroduce):
`NodeConfig.termination_conditions`, `completion_contract.criteria`,
`completion_contract.missing_input_policy` (`models.py` `reject_removed_*`).

## 2. How a node's prompt is actually assembled at runtime

Source of truth: `backend/harness/context.py` `assemble_messages` +
`backend/orchestration/executor.py` (`user_task = node.label`).

Message order sent to the LLM:
1. system prompt (empty for normal nodes)
2. `config.instruction` bullets → one **user** message (the procedure)
3. few-shot examples (windowed)
4. `[Upstream data from <source_node_id>]` blocks from incoming `data_flow`
5. tool results
6. `node.label` → the final **user** message (the anchoring task; never truncated)

Consequences you must design around:
- `label` is the task anchor, **not** just a display name. Keep it a short role
  (§3); put the actual procedure in `instruction`.
- Upstream data is truncated largest-first under `token_budget`; `label`,
  system prompt, and tool results are never truncated.

## 3. Node naming (`label`)

- `label` = a **tight functionary role**: `Data Collector`, `Risk Critic`,
  `Briefing Synthesizer`, `Memo Reviewer`.
- Forbidden: a full task sentence as the label (e.g. "Collect current Bitcoin
  news headlines and community posts"). That buries the task in the anchor
  string and duplicates `instruction`. Matches `docs/coding rules.md` §2
  (descriptive, not vague/over-long/overlapping).
- Tool-node labels name the capability: `Exchange Data`, `Market and Macro Data`.

## 4. Prompt engineering rules (`config.instruction`)

Each agent node: 3–5 imperative bullets. A bullet must earn its place.

| Do | Don't |
|---|---|
| Name the exact op + args: `fetch_exchange_data source_id='okx', source_type='ticker', symbol='BTC-USDT', limit=1` | Vague verbs: "analyze the market", "provide insights" |
| Fix the output shape: "three parts: setup, one level, invalidation" | Leave output open-ended |
| Require grounding: "cite the returned evidence ID in square brackets" | Allow ungrounded claims |
| Encode the node's failure guardrail: "if no reviewer feedback is present, do not fabricate it"; terminal tokens like `ADEQUATE`/`APPROVED` | Ignore the round-1 / empty-upstream trap |
| Imperative machine register, named fields | Persona filler, politeness, hedging |

Abstraction level: **pin the interface** (tool, args, output parts, citation),
**leave the judgment** (direction, level, verdict) to the model. Too abstract →
drift; too specific → parroting and local traps.

## 5. Edges and tool authorization

Source of truth: `backend/schema/validation.py`.

- `tool_call`: `agent`/`agent_group` → `tool`. This is the **only** way a node is
  authorized to call a tool. The **tool node** lists the callable tools in
  `config.tools`; the calling agent keeps `config.tools: []`.
- `data_flow`: producer → consumer; the consumer must be `agent`/`agent_group`
  (tools receive input only through calls). Carries output **and evidence**
  downstream.
- `synchronization`: co-stages two executable nodes.
- Every edge endpoint must exist; `node_id`s unique.

## 6. Completion contracts (when a node may succeed)

Source of truth: `backend/schema/models.py` (`CompletionContract`,
`EvidenceRequirement`) + `backend/schema/validation.py` `_check_completion_contracts`.

- `mode: explicit` requires ≥1 `requirement`; `mode: disabled` sets no
  workflow-level requirements. **Prefer `explicit`** on every agent node — a
  disabled contract with only a char-minimum means any text passes.
- Machine-checkable evidence keys: `tool_names`, `source_ids`, `source_types`,
  `data_types`, `required_fields` (dotted JSON paths, e.g. `0.value`),
  `minimum_items`, `minimum_records`.
- `data_type` string convention = `f"{source_id}_{source_type}"`
  (`backend/tools/data_acquisition.py`). Proven combos:
  `okx_ticker` (fields `last`,`high24h`,`low24h`,`vol24h`),
  `ecb_interest_rates` (field `0.value`), `guardian_search`, `lemmy_search`,
  `mastodon_hashtag`.
- Set `requires_evidence_citations: true` on nodes that must ground claims.
- **Reachability rule (enforced):** a requirement's `tool_names` must be reachable
  from the node via a `tool_call` edge, **or** propagated over `data_flow` from an
  upstream collector (needs `expose_downstream_state` on the source and
  `read_upstream_state` on the target). A downstream analyst may therefore contract
  against evidence an upstream node collected without owning the tool-call edge.
- Non-collecting roles (planner, critic, reviewer): use `explicit` with
  `evidence: null` — a semantic-only requirement, still enforced by the judge.
- `judge_authority: advisory | binding` (default `advisory`). When the
  semantic judge fails to produce a valid verdict (truncated JSON, provider
  error), `advisory` accepts the candidate if all deterministic evidence
  checks passed; `binding` forces `inconclusive`/`failed`. Prefer `advisory`
  unless the domain requires an explicit semantic gate.

## 6a. Run-level failure policy (`on_node_failure`)

Source of truth: `backend/schema/models.py` (`NodeFailurePolicy`) +
`backend/orchestration/executor.py` (`_apply_node_result`).

- `on_node_failure: continue` (default): a non-completed node (failed,
  inconclusive, blocked, partial) is recorded and the run keeps scheduling
  remaining nodes. The final run status becomes `partial` if any node was
  non-completed.
- `on_node_failure: fail_fast`: the run halts on the first non-completed
  node, matching the legacy behavior.
- `AgentExecutionError` (e.g. LLM retries exhausted) is caught inside the
  executor and converted to a clean `failed` node result — it no longer
  crashes the entire workflow as a `workflow_execution_error`.

## 7. Loops and iteration budget

Source of truth: `backend/schema/validation.py` `_check_loop_constraints` +
`backend/orchestration/loops.py`.

- `agent_loop_default: true` → the node's single-node loop budget comes from
  `WorkflowConfig.max_iterations`; no self-loop edge needed.
- `agent_loop_default: false` → the node **must** have a self-loop `data_flow`
  edge, whose `loop_rounds` is the budget (validation error otherwise).
- Multi-node cycles are **schema-level loops**: the back edge carries
  `loop_rounds` (≤ `config.max_loop_rounds`). Nested loops = an inner cycle inside
  an outer cycle.
- The dependency graph must be **reducible** (single-entry loops); an irreducible
  graph is a validation error (`build_region_tree`).

## 8. Tool catalog

Source of truth: `backend/tools/registry.py` `TOOL_HIERARCHY`.

| Category | Tools |
|---|---|
| Fetch Data | `fetch_exchange_data`, `fetch_macro_data`, `fetch_news_data`, `fetch_social_media_data` |
| Data Analysis | `technical_analysis`, `quantitative_analysis`, `signal_analysis`, `diagnostic_analysis`, `detect_regime`, `estimate_parameters`, `simulate_process`, `run_monte_carlo` |
| Text Analysis | `chunk_text`, `semantic_search`, `extract_entities`, `classify_text`, `score_text`, `summarize_text`, `cross_modal_alignment` |
| Output | `send_webhook`, `send_email`, `send_telegram`, `write_output` |

Split fetch and analysis into separate tool nodes when different agents call them
(e.g. a `fetch_*` node for the collector and a text-analysis node for the analyst).

## 9. Validation before shipping

- Load through `SchemaPersistence.load_schema` (Pydantic) **and**
  `SchemaValidator.validate` (structure + reachability + loop reducibility).
- YAML gotcha: an `instruction` bullet containing a colon-space (`: `) must be
  single-quoted, or the YAML scanner reads it as a mapping key.

## 10. Layout (`position.x` / `position.y`)

There is **no auto-layout** — you set coordinates; the editor renders them as-is
(`frontend/src/store/workflowStore.ts`). Renderer facts
(`frontend/src/components/canvas/edges.tsx`, `AgentNode.tsx`, node `min-width: 180px`):

- `data_flow` edges route orthogonally (`getSmoothStepPath`) from a node's
  **bottom** port to the target's **top** port.
- A self-loop arc bulges **~80px to the right** of the node.
- A `tool_call` edge is a short double-arc between an agent's **right** port and a
  tool's **left** port.

Rules that keep a graph readable:
1. Flow top→down: producers above consumers, ~180–200px between rows.
2. Put a tool on the **same row as its calling agent**, offset ~300px to the side
   — never stacked directly below it (that forces the tool-call arc diagonally
   across the agent).
3. Space parallel/sibling agents ~320–360px apart horizontally.
4. If an agent has a self-loop, keep ~100px clear to its right.
5. For a schema-level loop, keep the back-edge lane (the column between the spine
   and the loop partner) clear of other nodes.
