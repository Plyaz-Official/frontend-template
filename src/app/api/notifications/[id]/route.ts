/**
 * Single Notification API Route
 *
 * DELETE /api/notifications/:id - Delete notification
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendNotificationsDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { DELETE } = createNextApiRoute<BackendNotificationsDomainService>({
  service: 'notifications',
  getCore: getServerCore,
  errorSource: 'notifications-api',
  handlers: {
    DELETE: async (service, { params }) => {
      const id = params.id as string;
      await service.delete(id);
      return { id };
    },
  },
});
