import createNextIntlPlugin from 'next-intl/plugin';
import { withPlyazNextConfig } from '@plyaz/core/frameworks/nextjs/config';

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(
  withPlyazNextConfig({
    // Increase body size limit for large file uploads
    experimental: {
      serverActions: {
        bodySizeLimit: '100mb',
      },
    },
  })
);
