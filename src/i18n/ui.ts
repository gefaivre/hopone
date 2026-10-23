import { pages, site } from '@publisher/astro/site';

// Interface texts of the site. They live in the code, never in the CMS (Publisher docs/capabilities.md).

const ui = {
  'en-US': {
    newsletterLink: 'Free newsletter →',
    search: 'Search',
    subscribe: 'Subscribe',
    homeLabel: 'Hopone home',
    sections: 'Sections',
    skip: 'Skip to content',
    briefing: 'Briefing',
    eyebrow: 'The business of running',
    topStories: 'Top stories',
    latestAnalysis: 'Latest analysis',
    allAnalysis: 'All analysis →',
    explainers: 'Explainers',
    allExplainers: 'All explainers →',
    ourSections: 'Our sections',
    newsIndexHeading: 'All analysis',
    newsIndexIntro:
      'Every Hopone story on the business and finance of running: markets, brands, races, sponsorship, startups and retail.',
    evergreenIndexHeading: 'Explainers',
    evergreenIndexIntro:
      'How the running business works: how marathons make money, what brands earn on a pair of shoes, who owns whom.',
    empty: 'No stories yet. Check back soon.',
    minRead: 'min read',
    newer: '← Newer',
    older: 'Older →',
    pageOf: (page: number, count: number) => `Page ${page} of ${count}`,
    disclosure:
      'This article was written with AI by the Hopone Newsroom, from the sources it cites. Figures marked “Hopone calculation” are our own arithmetic from those sources. Nothing here is investment advice.',
    notFound: 'Page not found',
    gone: 'This story has been removed',
    browseAll: 'Browse all analysis →',
    searchPlaceholder: 'Search Hopone: Nike, marathon entry fees, Strava…',
    noResults: 'No stories match this search.',
    all: 'All',
    news: 'Analysis',
    tool: 'Tools',
    results: 'stories',
    footerTagline: 'The business and finance of running.',
    footerLegal:
      'Hopone articles are produced with AI from cited sources. Nothing on this site is investment advice.',
    rss: 'RSS',
  },
} as const;

type Texts = (typeof ui)['en-US'];

export function t(locale: string): Texts {
  return ui[locale as keyof typeof ui] ?? ui['en-US'];
}

/** Paths of the navigation: the routes of the profile, its categories, and the coded pages. */
export function navOf(locale: string) {
  const routes = site.routes[locale] ?? site.routes[site.defaultLocale]!;
  const page = (key: string) => pages.find((p) => p.key === key)?.locales[locale]?.path;
  return {
    home: routes.home!,
    news: routes.newsIndex!,
    explainers: routes.evergreenIndex!,
    search: routes.search!,
    categories: site.categories.map((c) => ({ key: c.key, ...c.translations[locale]! })),
    about: page('about'),
    contact: page('contact'),
    legal: page('legal'),
    feed: locale === site.defaultLocale ? '/rss.xml' : `${routes.home}/rss.xml`,
  };
}

export const formatDate = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso),
  );
