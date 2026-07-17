// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// The public landing + documentation site for Price Monitor Agent.
//
// `site` is the apex domain the Cloudflare Pages project serves (traderai.tech
// + www). The running application lives on the app. subdomain and is linked
// from the hero, never embedded here — this repository holds only public docs
// and example schemas, not the application source.
export default defineConfig({
  site: "https://traderai.tech",
  integrations: [
    starlight({
      title: "Price Monitor Agent",
      description:
        "A no-code canvas for building agentic workflows that collect market, " +
        "macro, news, and social evidence and reason over it to produce trading insight.",
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/xingyuanzhao-project/traderai-docs",
        },
      ],
      customCss: ["./src/styles/custom.css"],
      // Diátaxis: Tutorials (learning), How-to guides (goals), Reference
      // (information), Explanation (understanding). Each group maps to one of
      // the four modes so a reader always knows which kind of page they are on.
      sidebar: [
        { label: "Overview", slug: "" },
        {
          label: "Tutorial",
          items: [{ label: "Build and run your first workflow", slug: "tutorials/first-workflow" }],
        },
        {
          label: "How-to guides",
          items: [
            { label: "Use an example schema", slug: "guides/use-an-example" },
            { label: "Author a schema", slug: "guides/author-a-schema" },
            { label: "Configure providers and data sources", slug: "guides/configure-providers" },
            { label: "Workflow pattern gallery", slug: "guides/patterns" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Schema data model", slug: "reference/data-model" },
            { label: "Nodes, edges, and loops", slug: "reference/nodes-edges-loops" },
            { label: "Completion contracts", slug: "reference/completion-contracts" },
            { label: "Tool catalog", slug: "reference/tool-catalog" },
            { label: "Validation", slug: "reference/validation" },
          ],
        },
        {
          label: "Explanation",
          items: [
            { label: "Architecture", slug: "explanation/architecture" },
            { label: "Design principles", slug: "explanation/design-principles" },
          ],
        },
      ],
    }),
  ],
});
