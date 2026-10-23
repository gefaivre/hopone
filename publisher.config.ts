import { defineConfig } from '@publisher/astro';

// The coded pages of the site (Publisher docs/site-contract.md#coded-pages): their path, title and
// description. A page that is not here does not exist for Publisher, and the build fails.
export default defineConfig({
  pages: [
    {
      key: 'about',
      locales: {
        'en-US': {
          path: '/about',
          title: 'About Hopone',
          description:
            'Hopone covers the business and finance of running: brand earnings, race economics, sponsorship, startups and retail.',
        },
      },
    },
    {
      key: 'legal',
      locales: {
        'en-US': {
          path: '/legal',
          title: 'Legal notice',
          description: 'Legal notice of Hopone: the publisher and the host of www.hopone.run, content and personal data.',
        },
      },
    },
    {
      key: 'newsletter-thank-you',
      index: false,
      locales: {
        'en-US': {
          path: '/newsletter/thank-you',
          title: 'Your subscription is confirmed',
          description: 'Thank you for subscribing to the Hopone newsletter: every Monday, the business of running.',
        },
      },
    },
    {
      key: 'merci',
      index: false,
      locales: { 'en-US': { path: '/merci' } },
    },
  ],
});
