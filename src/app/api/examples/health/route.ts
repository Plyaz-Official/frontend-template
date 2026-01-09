/**
 * Health Check API Route
 * GET /api/examples/health
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { GET } = createNextApiRoute<BackendExampleDomainService>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  successMessage: 'Service is healthy',
  handlers: {
    GET: async service => ({
      service: service.isAvailable(),
      timestamp: new Date().toISOString(),
    }),
  },
});
