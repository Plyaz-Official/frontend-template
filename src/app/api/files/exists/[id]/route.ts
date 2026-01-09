/**
 * File Exists Check API Route
 * GET /api/files/exists/:id
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { GET } = createNextApiRoute<BackendFilesDomainService>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'files-api',
  successMessage: 'File existence check completed',
  handlers: {
    GET: async (service, { params }) => ({
      id: params.id,
      exists: await service.exists(params.id as string),
    }),
  },
});
