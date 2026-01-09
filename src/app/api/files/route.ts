/**
 * Files API Route
 * GET /api/files - List all files
 *
 * For uploads use POST /api/upload or POST /api/upload/bulk
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { GET } = createNextApiRoute<BackendFilesDomainService>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'files-api',
  handlers: {
    GET: async (service, { query }) => {
      const filters: Record<string, unknown> = {};
      if (query.entityType) filters.entityType = query.entityType;
      if (query.entityId) filters.entityId = query.entityId;
      if (query.userId) filters.userId = query.userId;
      if (query.type) filters.type = query.type;
      if (query.limit) filters.limit = Number.parseInt(query.limit, 10);
      if (query.offset) filters.offset = Number.parseInt(query.offset, 10);
      return service.getAll(filters);
    },
  },
});
