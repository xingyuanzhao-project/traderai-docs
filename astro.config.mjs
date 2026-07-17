// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// The public landing + documentation site for Price Monitor Agent.
//
// `site` is the apex domain GitHub Pages serves (traderai.tech). The running
// application lives on the app. subdomain and is linked from the hero, never
// embedded here — this repository holds only public docs and example schemas,
// not the application source.
export default defineConfig({
  site: "https://traderai.tech",
  // Astro 6.4+ changed `markdown.gfm` from default-true to optional. Starlight
  // pulls in @astrojs/mdx 5.x, which relied on that value being populated, so GFM
  // ends up disabled in .mdx files and tables render as raw pipe text. Setting it
  // explicitly restores tables, strikethrough, and task lists.
  markdown: {
    gfm: true,
  },
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
            { label: "Set up your keys and data sources", slug: "guides/configure-providers" },
            { label: "Use an example", slug: "guides/use-an-example" },
            { label: "Design your own workflow", slug: "guides/author-a-schema" },
            { label: "Example gallery", slug: "guides/patterns" },
          ],
        },
        {
          label: "Building blocks",
          items: [
            { label: "Workflow anatomy", slug: "reference/data-model" },
            { label: "Nodes, connections, and loops", slug: "reference/nodes-edges-loops" },
            { label: "Success rules", slug: "reference/completion-contracts" },
            { label: "Tools you can use", slug: "reference/tool-catalog" },
            { label: "Build checks", slug: "reference/validation" },
          ],
        },
        {
          label: "How it works",
          items: [
            { label: "System design", slug: "explanation/architecture" },
            { label: "Design principles", slug: "explanation/design-principles" },
          ],
        },
      ],
    }),
  ],
});
