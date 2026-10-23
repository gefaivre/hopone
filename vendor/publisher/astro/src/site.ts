import { pages, site } from "virtual:publisher/site";
import { codedPage as resolveCodedPage, type CodedPage } from "./runtime.ts";

// The site as Publisher described it at build time (languages, routes, categories), and the coded
// pages of publisher.config.ts. For the navigation of the templates and for the coded pages.
export { pages, site };
export type { CodedPage };

/** The coded page at `pathname` (`Astro.url.pathname`): its language, its other languages, its head. */
export function codedPage(pathname: string): CodedPage {
  return resolveCodedPage(site, pages, pathname);
}
