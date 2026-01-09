/**
 * Example API Route using BackendExampleDomainService
 *
 * GET  /api/examples       - List all examples (with optional status filter)
 * POST /api/examples       - Create a new example
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { GET, POST } = createNextApiRoute<BackendExampleDomainService>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  handlers: {
    GET: async (service, { query }) => {
      const status = query.status as 'active' | 'draft' | 'archived' | undefined;

      if (status === 'active') return service.getActiveExamples();
      if (status === 'draft') return service.getDraftExamples();
      if (status === 'archived') return service.getArchivedExamples();
      return service.getAll();
    },
    POST: async (service, { body }) => service.create(body),
  },
});
