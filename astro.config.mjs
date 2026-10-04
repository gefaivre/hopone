// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hopone.fr',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
