# Price Monitor Agent — landing page & documentation

Public landing page and documentation for **Price Monitor Agent**, a no-code
canvas for building agentic workflows that collect market, macro, news, and
social evidence and reason over it to produce trading insight.

- **Live docs:** https://traderai.tech
- **Application:** https://app.traderai.tech

This repository contains only the public site (built with
[Astro](https://astro.build) + [Starlight](https://starlight.astro.build)) and
the published [example schemas](./public/examples). The application source code
lives in a separate, private repository.

## Documentation structure

The docs follow the [Diátaxis](https://diataxis.fr) framework, so every page has
one clear purpose:

| Section | Purpose |
|---|---|
| **Tutorial** | One guaranteed-success path: import an example, add a key, run it. |
| **How-to guides** | Goal-oriented recipes: use an example, author a schema, configure providers, and a pattern gallery. |
| **Reference** | The schema data model, node/edge/loop rules, completion contracts, tool catalog, and validation — mirrored from the backend source of truth. |
| **Explanation** | The five-layer architecture and the design principles behind it. |

## Example schemas

[`public/examples/`](./public/examples) holds the seven runnable workflow
schemas featured in the docs, plus `schema_conventions.md` (the authoring
companion). They are committed here and also served for download at
`https://traderai.tech/examples/<schema_id>.yaml`. Each file is a complete
`WorkflowSchema`; the filename stem is its `schema_id`. See
[Use an example schema](https://traderai.tech/guides/use-an-example/) for the
two ways to run them (import in the app, or drop into a self-hosted `schemas/`).

## Local development

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # production build into ./dist
npm run preview  # serve the built ./dist locally
```

Node 22 is pinned via [`.nvmrc`](./.nvmrc) to match the Node version used by the
deploy workflow.

## Deployment

The site is built and published by **GitHub Actions → GitHub Pages** on every
push to `main` ([`.github/workflows/deploy-docs.yml`](./.github/workflows/deploy-docs.yml)).
The workflow runs `npm ci && npm run build` on Node 22 and publishes `dist/` to
the `gh-pages` branch with [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages);
GitHub Pages serves that branch at the apex domain `traderai.tech`, pinned by
[`public/CNAME`](./public/CNAME).

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `22` (from `.nvmrc`)
- **Custom domain:** `traderai.tech` (apex; Cloudflare DNS `A` records point to GitHub Pages, DNS-only)

## License

The documentation and example schemas in this repository are released under the
[MIT License](./LICENSE).
