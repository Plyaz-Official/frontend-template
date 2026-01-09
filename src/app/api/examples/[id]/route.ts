/**
 * Example Entity API Routes
 * GET    /api/examples/:id - Get entity by ID
 * PATCH  /api/examples/:id - Update entity
 * DELETE /api/examples/:id - Delete entity
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

/** Params for single entity routes */
interface IdParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

export const { GET, PATCH, DELETE } = createNextApiRoute<
  BackendExampleDomainService,
  {
    GET: { params: IdParams };
    PATCH: { params: IdParams };
    DELETE: { params: IdParams };
  }
>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  handlers: {
    GET: async (service, { params }) => service.getById(params.id),
    PATCH: async (service, { params, body }) => service.patch(params.id, body),
    DELETE: async (service, { params }) => {
      await service.delete(params.id);
      return { id: params.id };
    },
  },
});
