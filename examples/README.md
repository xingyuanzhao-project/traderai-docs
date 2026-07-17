# Example workflow schemas

Seven complete, structurally validated `WorkflowSchema` files for Price Monitor
Agent, plus the authoring companion `schema_conventions.md`. Each YAML is one
workflow; the filename stem is its `schema_id`.

Every schema here passes the project's shipping gate — Pydantic load through
`SchemaPersistence.load_schema` **and** `SchemaValidator.validate` (structure,
tool-authorization reachability, and loop reducibility).

| File | Pattern | Nodes / edges |
|---|---|---|
| `simple_price_check.yaml` | Single agent with one tool node and a self-loop | 2 / 2 |
| `sequential_analysis.yaml` | Two-stage linear pipeline (collect → analyze) | 3 / 4 |
| `signal_memo_cycle.yaml` | Linear pipeline with one schema-level revision loop | 5 / 6 |
| `dual_track_briefing.yaml` | Fork-join across a market track and a macro track | 6 / 6 |
| `news_sentiment_digest.yaml` | Collector + text-analysis tools for sentiment | 4 / 5 |
| `multi_agent_research.yaml` | Planner → parallel analyst group → synthesizer | 4 / 6 |
| `iterative_risk_review.yaml` | Nested schema-level loops (draft-critique + data refinement) | 5 / 6 |

## How to run these

Two paths, documented in full at
<https://traderai.tech/guides/use-an-example/>:

1. **In the hosted app** — open <https://app.traderai.tech>, click
   **Import YAML** on the Schemas panel, choose a file, review it on the canvas,
   then **Save** and **Run**.
2. **Self-hosted** — drop a `<schema_id>.yaml` file into the application's
   `schemas/` directory and restart; the app loads it at startup and exposes it
   at `GET /api/schemas`.

## Authoring your own

`schema_conventions.md` is the authoring companion: it documents the data model,
node/edge rules, completion contracts, loops, the tool catalog, and the
validation gate — each rule cross-referenced to the backend module that enforces
it. The rendered version is the site's [Reference](https://traderai.tech/reference/data-model/)
section.
