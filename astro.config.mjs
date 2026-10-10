// @ts-check
import { existsSync } from 'node:fs';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

// Local builds: read `.env` so the ISR token below is set (Vercel injects it in CI).
if (existsSync('.env')) process.loadEnvFile('.env');

// Articles come from the AutoEdit CMS and are rendered with ISR: generated on the
// first visit, cached on Vercel's CDN, regenerated when the CMS publishes.
export default defineConfig({
  site: 'https://www.hopone.run',
  output: 'server',
  trailingSlash: 'never',
  adapter: vercel({
    isr: {
      // Safety net: the CMS invalidates pages on demand when it publishes.
      expiration: 60 * 60 * 24 * 7,
      bypassToken: process.env.ISR_BYPASS_TOKEN,
      // Forwards the query string (?email=), which ISR ignores.
      exclude: ['/merci'],
    },
  }),
  build: { inlineStylesheets: 'auto' },
});
