import { createCmsClient } from '@autoedit/astro-cms';

const env = (name: string): string => process.env[name] ?? import.meta.env[name] ?? '';

/**
 * AutoEdit CMS delivery API. It throws when the CMS is down: the page then fails
 * and Vercel keeps serving the previous cached version.
 */
export const cms = createCmsClient({ url: env('CMS_URL'), token: env('CMS_TOKEN') });
