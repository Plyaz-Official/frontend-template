/**
 * Validated Create API Route
 * POST /api/examples/validated
 *
 * Demonstrates validator throwing validation errors.
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';
import type { CreateExampleDTO } from '@plyaz/types/examples';

import { getServerCore } from '@/core/server';

export const { POST } = createNextApiRoute<
  BackendExampleDomainService,
  { POST: { body: CreateExampleDTO } }
>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  handlers: {
    POST: async (service, { body }) => service.create(body),
  },
});
