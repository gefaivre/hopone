import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import vercel from "@astrojs/vercel";
import type { CodedPageDeclaration, CodedPageInfo, Image, Manifest, SiteConfig, SiteInfo, TemplateName } from "@publisher/client";
import type { AstroIntegration } from "astro";
import { delivery, loadDotEnv, publisherEnv } from "./env.ts";

// @publisher/astro: how every site plugs into Publisher (docs/site-contract.md). The site gives
// its templates (src/publisher/) and its coded pages (publisher.config.ts); this package does
// the rest: the catch-all route, the head, the sitemap, the feeds, the manifest, ISR.

export type * from "@publisher/client";
export { inlineHtml } from "@publisher/client";

const VERSION: string = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

/** Safety expiration of the ISR cache: pages are revalidated by Publisher, this only catches a miss. */
const ISR_EXPIRATION = 60 * 60 * 24;

/** Declares the coded pages of the site, in publisher.config.ts. */
export function defineConfig(config: SiteConfig): SiteConfig {
  return config;
}

/** The Vercel adapter, in ISR, with Publisher's token as bypass token. The only adapter of a site. */
export function publisherAdapter() {
  return vercel({ isr: { bypassToken: process.env.PUBLISHER_TOKEN, expiration: ISR_EXPIRATION } });
}

const VIRTUAL_TYPES = `declare module "virtual:publisher/site" {
  export const site: import("@publisher/client").SiteInfo;
  export const pages: import("@publisher/client").CodedPageInfo[];
}
declare module "virtual:publisher/templates" {
  type Component = (props: Record<string, unknown>) => unknown;
  export const Layout: Component;
  export const templates: Record<string, Component>;
}
`;

type ToolImage = { status: string; image: Image | null };
type ManifestCheck =
  | { ok: true; toolImages?: Record<string, ToolImage> }
  | { ok: false; errors: { path: string; message: string }[] };

/** How long a build waits for the images of new tool pages before going on without them. */
const TOOL_IMAGES_WAIT_MS = 180_000;

export default function publisher(): AstroIntegration {
  let root: URL;
  let site: SiteInfo;
  let pages: CodedPageDeclaration[] = [];
  let templates: TemplateName[] = [];

  const manifest = (): Manifest => ({
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`,
    packageVersion: VERSION,
    templates,
    pages,
  });
  const explain = (errors: { path: string; message: string }[]) => errors.map((e) => `  - ${e.path} : ${e.message}`).join("\n");

  return {
    name: "@publisher/astro",
    hooks: {
      "astro:config:setup": async ({ config, command, injectRoute, updateConfig, addWatchFile, logger }) => {
        root = config.root;
        loadDotEnv(root);
        // `astro sync` (and `astro check`) only generate types: no call to Publisher.
        if (command === "sync") return;
        const env = publisherEnv();

        site = (await delivery<SiteInfo>("/site")).body;
        logger.info(`site ${site.slug} (${site.locales.join(", ")}), fiche v${site.profileVersion}, ${env.url}`);

        // Templates: every one the site needs, nothing else in src/publisher/.
        const dir = new URL("src/publisher/", root);
        templates = site.templates.filter((t) => existsSync(new URL(`${t}.astro`, dir)));
        const missing = site.templates.filter((t) => !templates.includes(t));
        if (missing.length) {
          throw new Error(`[publisher] gabarits manquants : ${missing.map((t) => `src/publisher/${t}.astro`).join(", ")}`);
        }

        // Coded pages, checked by Publisher against the profile before anything is built.
        const configFile = new URL("publisher.config.ts", root);
        if (!existsSync(configFile)) throw new Error("[publisher] publisher.config.ts manquant à la racine du site");
        addWatchFile(configFile);
        pages = ((await import(`${pathToFileURL(fileURLToPath(configFile)).href}?t=${Date.now()}`)).default as SiteConfig).pages;
        const checkManifest = async () => {
          const check = await delivery<ManifestCheck>("/manifest?dryRun=1", { method: "POST", body: JSON.stringify(manifest()) });
          if (!check.body.ok) throw new Error(`[publisher] publisher.config.ts ou gabarits refusés par Publisher :\n${explain(check.body.errors)}`);
          return check.body.toolImages ?? {};
        };
        // The check also asks Publisher for the images of the tool pages. A build waits for the
        // new ones (a few tens of seconds), so that a new tool has its image from its first deploy.
        let toolImages = await checkManifest();
        const pendingImages = () => Object.entries(toolImages).filter(([, i]) => i.status === "pending").map(([key]) => key);
        if (command === "build" && pendingImages().length) {
          logger.info(`images d'outils en cours : ${pendingImages().join(", ")}`);
          const until = Date.now() + TOOL_IMAGES_WAIT_MS;
          while (pendingImages().length && Date.now() < until) {
            await new Promise((r) => setTimeout(r, 5_000));
            toolImages = await checkManifest();
          }
          if (pendingImages().length) logger.warn(`images d'outils pas prêtes, build sans elles : ${pendingImages().join(", ")}`);
        }
        const pagesInfo: CodedPageInfo[] = pages.map((page) => ({ ...page, image: toolImages[page.key]?.image ?? null }));

        injectRoute({ pattern: "/[...path]", entrypoint: new URL("./routes/catch-all.astro", import.meta.url), prerender: false });

        const imports = templates.map((t) => `import ${t} from ${JSON.stringify(fileURLToPath(new URL(`${t}.astro`, dir)))};`);
        const modules: Record<string, string> = {
          "virtual:publisher/templates": `${imports.join("\n")}\nexport { Layout };\nexport const templates = { ${templates.filter((t) => t !== "Layout").join(", ")} };\n`,
          "virtual:publisher/site": `export const site = ${JSON.stringify(site)};\nexport const pages = ${JSON.stringify(pagesInfo)};\n`,
        };
        updateConfig({
          vite: {
            plugins: [
              {
                name: "publisher:virtual",
                resolveId: (id: string) => (id in modules ? `\0${id}` : undefined),
                load: (id: string) => (id.startsWith("\0") ? modules[id.slice(1)] : undefined),
              },
            ],
            ssr: { noExternal: ["@publisher/astro", "@publisher/client"] },
          },
        });
        if (command === "dev") logger.info("pages du CMS servies par la route catch-all, contenus lus en direct");
      },

      "astro:config:done": ({ config, buildOutput, injectTypes }) => {
        // Types of the generated modules, for `astro check` in the site.
        injectTypes({ filename: "publisher.d.ts", content: VIRTUAL_TYPES });
        if (config.output !== "server" || buildOutput !== "server") throw new Error('[publisher] output: "server" obligatoire (ISR)');
        if (config.adapter?.name !== "@astrojs/vercel") throw new Error("[publisher] adapter: publisherAdapter() obligatoire");
      },

      "astro:build:done": async ({ pages: built, logger }) => {
        // Every declared page must be built, and every built page must be declared.
        const generated = new Set(built.map((p) => `/${p.pathname}`.replace(/\/+$/, "") || "/"));
        const declared = new Set(pages.flatMap((p) => Object.values(p.locales).map((l) => l.path)));
        const notBuilt = [...declared].filter((p) => !generated.has(p));
        const undeclared = [...generated].filter((p) => !declared.has(p));
        if (notBuilt.length) throw new Error(`[publisher] pages déclarées mais pas générées (prerender ?) : ${notBuilt.join(", ")}`);
        if (undeclared.length) throw new Error(`[publisher] pages générées mais absentes de publisher.config.ts : ${undeclared.join(", ")}`);

        // The manifest goes to Publisher with production builds only: a preview is not the site.
        const production = process.env.VERCEL_ENV === "production" || process.env.PUBLISHER_SEND_MANIFEST === "1";
        if (!production) {
          logger.info("manifeste non envoyé (pas un build de production)");
          return;
        }
        const sent = await delivery<ManifestCheck>("/manifest", { method: "POST", body: JSON.stringify(manifest()) });
        if (!sent.body.ok) throw new Error(`[publisher] manifeste refusé :\n${explain(sent.body.errors)}`);
        logger.info(`manifeste envoyé : ${pages.length} page(s) codée(s)`);
      },
    },
  };
}
