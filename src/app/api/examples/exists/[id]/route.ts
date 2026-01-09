/**
 * Existence Check API Route
 * GET /api/examples/exists/:id
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

/** Params for single entity routes */
interface IdParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

export const { GET } = createNextApiRoute<
  BackendExampleDomainService,
  { GET: { params: IdParams } }
>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  successMessage: 'Existence check completed',
  handlers: {
    GET: async (service, { params }) => ({
      exists: await service.exists(params.id),
      id: params.id,
    }),
  },
});
