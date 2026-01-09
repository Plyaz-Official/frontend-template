/**
 * Demo: Single Validation Error
 * GET /api/examples/errors/single
 *
 * Demonstrates validator throwing a SINGLE validation error.
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { GET } = createNextApiRoute<BackendExampleDomainService>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  handlers: {
    GET: async service => {
      service.demoSingleValidationError();
      return { unreachable: true };
    },
  },
});
