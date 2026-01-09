/**
 * Demo: Multiple Validation Errors
 * GET /api/examples/errors/array
 *
 * Demonstrates validator throwing MULTIPLE validation errors.
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
      service.demoMultipleValidationErrors();
      return { unreachable: true };
    },
  },
});
