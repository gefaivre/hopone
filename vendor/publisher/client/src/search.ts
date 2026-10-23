// Site search, from the visitor's browser (docs/search.md).
// Framework-agnostic: `searchQueryOptions()` works with every TanStack Query adapter
// (React, Preact, Vue, Svelte, Solid) and with `@tanstack/query-core`.

export const SEARCH_TYPES = ["news", "evergreen", "tool"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export type SearchParams = {
  locale: string;
  /** Free text. Every word must match; the last one may be partial ("plan" finds "planets"). */
  q?: string;
  type?: SearchType | "all";
  /** `key` of a category of the site. */
  category?: string;
  page?: number;
};

export type SearchResult = {
  type: SearchType;
  title: string;
  description: string;
  /** Path on the site, in the requested language. */
  url: string;
  image: { url: string } | null;
  category: { key: string; name: string; url: string };
  publishedAt: string | null;
  /** Null for tool pages. */
  readingMinutes: number | null;
};

export type SearchResponse = {
  query: { locale: string; q: string; type: SearchType | "all"; category: string | null; page: number };
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  results: SearchResult[];
  facets: {
    /** Results per type, with the category filter applied. */
    types: Record<SearchType | "all", number>;
    /** Results per category, with the type filter applied. Every category of the site, in order. */
    categories: { key: string; name: string; count: number }[];
  };
};

export type PublisherConfig = {
  /** Publisher's public URL, e.g. https://publisher.publiseo.agency */
  url: string;
  /** Slug of the site in Publisher. */
  site: string;
};

export class SearchError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Canonical form: defaults removed, text trimmed. Two equivalent searches give the same key. */
function normalize(params: SearchParams) {
  return {
    locale: params.locale,
    q: (params.q ?? "").trim(),
    type: params.type ?? "all",
    category: params.category ?? "",
    page: params.page ?? 1,
  };
}

export function searchUrl(config: PublisherConfig, params: SearchParams): string {
  const p = normalize(params);
  const url = new URL(`/api/search/v1/sites/${encodeURIComponent(config.site)}`, config.url);
  url.searchParams.set("locale", p.locale);
  if (p.q) url.searchParams.set("q", p.q);
  if (p.type !== "all") url.searchParams.set("type", p.type);
  if (p.category) url.searchParams.set("category", p.category);
  if (p.page !== 1) url.searchParams.set("page", String(p.page));
  return url.toString();
}

export async function fetchSearch(config: PublisherConfig, params: SearchParams, signal?: AbortSignal): Promise<SearchResponse> {
  const response = await fetch(searchUrl(config, params), { signal });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new SearchError(body?.error ?? `Recherche indisponible (${response.status})`, response.status);
  }
  return (await response.json()) as SearchResponse;
}

/**
 * TanStack Query options of a search: `useQuery(searchQueryOptions(config, params))`.
 * - the key changes with every parameter, so each search is cached on its own;
 * - TanStack cancels the request of a search the visitor has already replaced (`signal`);
 * - the previous results stay on screen while the next ones load (`placeholderData`).
 */
export function searchQueryOptions(config: PublisherConfig, params: SearchParams) {
  const p = normalize(params);
  return {
    queryKey: ["publisher", "search", config.site, p.locale, p.q, p.type, p.category, p.page] as const,
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchSearch(config, p, signal),
    staleTime: 60_000,
    placeholderData: <T>(previous: T | undefined) => previous,
  };
}

/**
 * How a site writes the search in the address of its search page (docs/search.md#adresse).
 * Only the page address changes: the search API keeps its own names.
 * Default: `?q=…&type=news|evergreen|tool&category=<key>&page=…`.
 */
export type SearchUrlNames = {
  /** Names of the parameters. */
  params?: Partial<Record<"q" | "type" | "category" | "page", string>>;
  /** Values of `type` in the address, e.g. `{ evergreen: "guides", tool: "tools" }`. */
  types?: Partial<Record<SearchType, string>>;
};

function namesOf(names: SearchUrlNames = {}) {
  const p = { q: "q", type: "type", category: "category", page: "page", ...names.params };
  const types = Object.fromEntries(SEARCH_TYPES.map((t) => [t, names.types?.[t] ?? t])) as Record<SearchType, string>;
  return { p, types };
}

/** Reads the search from the page address (`?q=…&type=…&category=…&page=…`, or the site's own names). */
export function searchParamsFromUrl(url: URL | string, locale: string, names?: SearchUrlNames): SearchParams {
  const { p, types } = namesOf(names);
  const s = new URL(url).searchParams;
  const value = s.get(p.type);
  const type = SEARCH_TYPES.find((t) => types[t] === value);
  const page = Number(s.get(p.page));
  return {
    locale,
    q: s.get(p.q) ?? "",
    type: type ?? "all",
    category: s.get(p.category) ?? "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** Writes the search into the page address, so it can be shared and survives a reload. */
export function searchParamsToUrl(url: URL | string, params: SearchParams, names?: SearchUrlNames): URL {
  const { p: n, types } = namesOf(names);
  const p = normalize(params);
  const next = new URL(url);
  next.search = "";
  if (p.q) next.searchParams.set(n.q, p.q);
  if (p.type !== "all") next.searchParams.set(n.type, types[p.type]);
  if (p.category) next.searchParams.set(n.category, p.category);
  if (p.page !== 1) next.searchParams.set(n.page, String(p.page));
  return next;
}
