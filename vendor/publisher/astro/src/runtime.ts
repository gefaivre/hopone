import {
  buildHead,
  type Alternate,
  type CodedPageInfo,
  type Head,
  type Resolved,
  type SiteInfo,
} from "@publisher/client";
import { delivery } from "./env.ts";

// What runs when a page is rendered: the catch-all route asks Publisher what a path is, the coded
// pages build their head from publisher.config.ts.

export async function resolve(path: string): Promise<Resolved> {
  const { body } = await delivery<Resolved>(`/resolve?path=${encodeURIComponent(path)}`);
  return body;
}

export type CodedPage = {
  key: string;
  locale: string;
  /** The page in each of its languages. */
  alternates: Alternate[];
  head: Head;
};

const trim = (path: string) => (path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path);

/** The coded page at `pathname`, as declared in publisher.config.ts, with its head. */
export function codedPage(site: SiteInfo, pages: CodedPageInfo[], pathname: string): CodedPage {
  const path = trim(pathname);
  for (const page of pages) {
    for (const [locale, entry] of Object.entries(page.locales)) {
      if (entry.path !== path) continue;
      const alternates = site.locales.flatMap((l) => (page.locales[l] ? [{ locale: l, path: page.locales[l]!.path }] : []));
      // `index: false`: noindex, no hreflang. Such a page usually writes its own head.
      const indexed = page.index !== false;
      const head = buildHead({
        site: { name: site.name, url: site.url, defaultLocale: site.defaultLocale, homes: homesOf(site) },
        locale,
        path,
        title: entry.title ?? site.name,
        description: entry.description ?? "",
        isHome: !entry.title,
        noindex: !indexed,
        alternates,
        image: page.image ? `${page.image.url}/1536.webp` : null,
      });
      return { key: page.key, locale, alternates, head };
    }
  }
  throw new Error(`[publisher] ${path} n'est pas déclarée dans publisher.config.ts : une page codée doit l'être (docs/site-contract.md#coded-pages)`);
}

export function homesOf(site: SiteInfo): Record<string, string> {
  return Object.fromEntries(site.locales.map((l) => [l, site.routes[l]!.home!]));
}
