import type { APIRoute } from 'astro';
import { sitemapResponse } from '@autoedit/astro-cms';
import { cms } from '../lib/cms';

/** Home, article index, sections, authors and every published article, from the CMS. */
export const GET: APIRoute = async () => sitemapResponse(await cms.sitemap());
