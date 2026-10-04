// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.hopone.run',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
