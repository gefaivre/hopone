import type { APIRoute } from 'astro';
import { getArticles, toArticle, categories, categorySlug } from '../data/articles';

export const GET: APIRoute = async () => {
  const articles = (await getArticles()).map(toArticle);
  const site = 'https://www.hopone.run';

  const pages = [
    { url: `${site}/`, priority: '1.0', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
    { url: `${site}/articles/`, priority: '0.9', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
    ...categories.map((c) => ({
      url: `${site}/section/${categorySlug(c.name)}/`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: new Date().toISOString().split('T')[0],
    })),
    ...articles.map((a) => ({
      url: `${site}/articles/${a.slug}/`,
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: a.date,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
