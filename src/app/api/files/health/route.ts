/**
 * Files Service Health Check
 * GET /api/files/health
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { GET } = createNextApiRoute<BackendFilesDomainService>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'files-api',
  successMessage: 'Files service health check',
  handlers: {
    GET: async service => ({
      service: 'files',
      available: service.isAvailable(),
      enabled: service.isServiceEnabled,
      initialized: service.isInitialized,
      timestamp: new Date().toISOString(),
    }),
  },
});
