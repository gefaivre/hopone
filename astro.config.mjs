// @ts-check
import react from '@astrojs/react';
import publisher, { publisherAdapter } from '@publisher/astro';
import { defineConfig } from 'astro/config';

// The same three lines on every Publisher site (Publisher docs/site-contract.md#installation),
// plus React for the search page. Articles, lists, sitemap, RSS and redirects come from Publisher.
export default defineConfig({
  output: 'server',
  adapter: publisherAdapter(),
  integrations: [publisher(), react()],
});
