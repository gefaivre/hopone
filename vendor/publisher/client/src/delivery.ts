// The contract between Publisher and the sites (docs/site-contract.md): what the delivery API
// returns, what the templates receive, what the site declares. Shared by the server
// (@publisher/core) and the sites (@publisher/astro). Types only.

// ---------------------------------------------------------------- blocks

/**
 * Inline text of a block: plain text with three marks, `**bold**`, `*italic*` and `[label](url)`.
 * Nothing else (no HTML): the sites render it with `inlineHtml()`.
 */
export type InlineText = string;

export type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: InlineText }
  | { type: "list"; ordered: boolean; items: InlineText[] }
  | { type: "image"; image: Image; caption?: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; tone: "info" | "tip" | "warning"; title?: string; text: InlineText }
  | { type: "table"; caption?: string; header: string[]; rows: InlineText[][] }
  | { type: "faq"; items: { question: string; answer: InlineText }[] }
  | { type: "keyTakeaways"; items: InlineText[] };

export type BlockType = Block["type"];

export const BLOCK_TYPES = ["heading", "paragraph", "list", "image", "quote", "callout", "table", "faq", "keyTakeaways"] as const;

// ---------------------------------------------------------------- shared shapes

/** An image served by Publisher. `src(width, format)` URLs: `${url}/${width}.${format}`. */
export type Image = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/** Widths available for every image (`<Picture>` picks among them). */
export const IMAGE_WIDTHS = [480, 768, 1024, 1536] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export type Locale = string;

/** The same page in another language. */
export type Alternate = { locale: Locale; path: string };

export type CategoryRef = { key: string; name: string; path: string };
export type AuthorRef = { key: string; name: string; path: string };

/** A content in a list or a zone. */
export type Card = {
  type: "news" | "evergreen";
  title: string;
  description: string;
  /** News only. */
  headline: string | null;
  path: string;
  image: Image | null;
  category: CategoryRef;
  author: AuthorRef | null;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
};

// ---------------------------------------------------------------- head

export type Head = {
  title: string;
  description: string;
  /** Absolute URL. */
  canonical: string;
  robots: "index, follow" | "noindex, follow";
  /** hreflang links, x-default included, absolute URLs. Empty when the page has one language. */
  hreflang: { hreflang: string; href: string }[];
  openGraph: {
    type: "website" | "article";
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    image: string | null;
  };
  /** JSON-LD objects, rendered as-is. */
  jsonLd: Record<string, unknown>[];
  /** RSS feed of the language. */
  feed: string;
};

// ---------------------------------------------------------------- zones

export type HeadlinesZone = { type: "headlines"; items: { text: string; path: string }[] };
export type LatestZone = { type: "latest"; items: Card[] };
export type CoverLinesZone = { type: "coverLines"; items: { text: string; path: string }[] };
export type TaxonomyZone = {
  type: "taxonomy";
  items: (CategoryRef & { description: string; image: Image | null; count: number })[];
};
export type Zone = HeadlinesZone | LatestZone | CoverLinesZone | TaxonomyZone;
export type ZoneType = Zone["type"];

// ---------------------------------------------------------------- site

/** `GET /site`: the public configuration of the site. */
export type SiteInfo = {
  slug: string;
  name: string;
  url: string;
  defaultLocale: Locale;
  locales: Locale[];
  routes: Record<Locale, Record<string, string>>;
  categories: { key: string; translations: Record<Locale, { slug: string; name: string; path: string }> }[];
  authors: { key: string; translations: Record<Locale, { slug: string; name: string; path: string }> }[];
  zones: Record<string, ZoneType>;
  /** Items per page of the lists. */
  listPageSize: number;
  /** Templates the site must provide in `src/publisher/`. */
  templates: TemplateName[];
  profileVersion: number;
};

// ---------------------------------------------------------------- templates

export const TEMPLATE_NAMES = [
  "Layout",
  "Home",
  "NewsIndex",
  "EvergreenIndex",
  "Category",
  "Author",
  "Article",
  "Search",
  "NotFound",
] as const;
export type TemplateName = (typeof TEMPLATE_NAMES)[number];

/** A paginated list. Page 1 is `path`; page n is `${path}/${n}`. */
export type List = {
  items: Card[];
  page: number;
  pageCount: number;
  /** Items per page: `listPageSize` of the profile. */
  pageSize: number;
  total: number;
  /** Path of the first page. */
  path: string;
  prev: string | null;
  next: string | null;
};

type PageBase = { locale: Locale; head: Head; alternates: Alternate[] };

/** What `GET /resolve` returns for a page rendered by a template. */
export type PageData =
  | (PageBase & { template: "Home"; zones: Record<string, Zone> })
  | (PageBase & { template: "NewsIndex"; list: List; zones: Record<string, Zone> })
  | (PageBase & { template: "EvergreenIndex"; list: List; zones: Record<string, Zone> })
  | (PageBase & {
      template: "Category";
      category: CategoryRef & { description: string; image: Image | null };
      list: List;
      zones: Record<string, Zone>;
    })
  | (PageBase & { template: "Author"; author: AuthorRef & { bio: string }; list: List; zones: Record<string, Zone> })
  | (PageBase & { template: "Article"; content: ArticleContent })
  | (PageBase & { template: "Search" })
  | (PageBase & { template: "NotFound"; status: 404 | 410 });

export type ArticleContent = Omit<Card, "image"> & {
  hero: Image | null;
  blocks: Block[];
};

export type Resolved =
  | { kind: "page"; status: 200 | 404 | 410; page: PageData }
  | { kind: "redirect"; status: 301; location: string }
  /** sitemap.xml, robots.txt, rss.xml */
  | { kind: "file"; status: 200; contentType: string; body: string };

/** Props of each template. */
export type TemplateProps<T extends TemplateName> = T extends "Layout"
  ? { locale: Locale; alternates: Alternate[] }
  : Omit<Extract<PageData, { template: T }>, "template" | "head">;

// ---------------------------------------------------------------- coded pages and manifest

/** One coded page, as declared in the site's `publisher.config.ts`. */
export type CodedPageDeclaration = {
  /** Stable identifier (a-z, 0-9, -). */
  key: string;
  /** `tool` for a tool page; `page` (default) for any other coded page. */
  kind?: "page" | "tool";
  /** Tool pages: `key` of a category of the site (for the search filters). */
  category?: string;
  /** Tool pages: the subject of their image, drawn in the family `defaultImageFamilies.tool`. */
  imageSubject?: string;
  /**
   * `false`: the page is noindex, out of the sitemap, the hreflang and the search, and writes its
   * own head (no <PublisherHead />, no title or description required). Not for tool pages.
   */
  index?: boolean;
  /** The page in each of its languages. */
  locales: Record<Locale, { path: string; title?: string; description?: string }>;
};

/** A coded page as the site sees it at build time: its declaration, and its image for a tool. */
export type CodedPageInfo = CodedPageDeclaration & {
  /** Tool pages: their image once Publisher has made it, `null` before. `alt` is empty: the image goes with the title. */
  image: Image | null;
};

export type SiteConfig = { pages: CodedPageDeclaration[] };

/** `POST /manifest`: sent by the site at each production build. */
export type Manifest = {
  deploymentId: string;
  packageVersion: string;
  templates: TemplateName[];
  pages: CodedPageDeclaration[];
};
