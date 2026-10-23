import type { Alternate, Head } from "./delivery.ts";

// The head of a page (docs/site-contract.md#head). One function for every page: Publisher uses it
// for the pages of the CMS, @publisher/astro for the coded pages. The rules live here only.

export type HeadInput = {
  site: { name: string; url: string; defaultLocale: string; homes: Record<string, string> };
  locale: string;
  path: string;
  title: string;
  description: string;
  /** The home keeps its title as is; every other title is followed by the site name. */
  isHome?: boolean;
  noindex?: boolean;
  /** The page in every language it exists in, itself included. */
  alternates: Alternate[];
  type?: "website" | "article";
  image?: string | null;
  jsonLd?: Record<string, unknown>[];
};

export function absoluteUrl(siteUrl: string, path: string): string {
  return path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`;
}

/** Feed of a language, from its home: `/rss.xml`, `/fr/rss.xml`. */
export function feedPathOf(home: string): string {
  return home === "/" ? "/rss.xml" : `${home}/rss.xml`;
}

/**
 * hreflang of a page: every language it exists in, plus x-default (the default language, when the
 * page exists in it). A page in a single language has no hreflang.
 */
export function hreflangLinks(siteUrl: string, defaultLocale: string, alternates: Alternate[]) {
  if (alternates.length < 2) return [];
  const links = alternates.map((a) => ({ hreflang: a.locale, href: absoluteUrl(siteUrl, a.path) }));
  const fallback = alternates.find((a) => a.locale === defaultLocale);
  if (fallback) links.push({ hreflang: "x-default", href: absoluteUrl(siteUrl, fallback.path) });
  return links;
}

export function buildHead(input: HeadInput): Head {
  const { site } = input;
  const title = input.isHome ? input.title : `${input.title} | ${site.name}`;
  const canonical = absoluteUrl(site.url, input.path);
  return {
    title,
    description: input.description,
    canonical,
    robots: input.noindex ? "noindex, follow" : "index, follow",
    // A page that is not indexed has no hreflang (pages 2+ of the lists, search, errors).
    hreflang: input.noindex ? [] : hreflangLinks(site.url, site.defaultLocale, input.alternates),
    openGraph: {
      type: input.type ?? "website",
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: site.name,
      locale: input.locale.replace("-", "_"),
      image: input.image ?? null,
    },
    jsonLd: input.jsonLd ?? [],
    feed: absoluteUrl(site.url, feedPathOf(site.homes[input.locale] ?? "/")),
  };
}
