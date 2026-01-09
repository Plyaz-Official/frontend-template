/**
 * Notifications API Route
 * GET /api/notifications - List all notifications
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendNotificationsDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { GET } = createNextApiRoute<BackendNotificationsDomainService>({
  service: 'notifications',
  getCore: getServerCore,
  errorSource: 'notifications-api',
  handlers: {
    GET: async (service, { query }) => {
      const filters: Record<string, unknown> = {};
      if (query.channel) filters.channel = query.channel;
      if (query.status) filters.status = query.status;
      if (query.category) filters.category = query.category;
      if (query.templateId) filters.templateId = query.templateId;
      if (query.recipientId) filters.recipientId = query.recipientId;
      if (query.limit) filters.limit = Number.parseInt(query.limit, 10);
      if (query.offset) filters.offset = Number.parseInt(query.offset, 10);
      return service.getAll(filters);
    },
  },
});
