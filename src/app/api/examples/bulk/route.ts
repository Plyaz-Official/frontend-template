/**
 * Bulk Operations API Routes
 * POST   /api/examples/bulk - Create multiple entities
 * DELETE /api/examples/bulk - Delete multiple entities
 */

import { ValidationError } from '@plyaz/errors';
import { API_ERROR_CODES, HTTP_STATUS } from '@plyaz/types';
import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

/** POST request body for bulk create */
interface BulkCreateBody {
  items?: unknown[];
}

/** DELETE request body for bulk delete */
interface BulkDeleteBody {
  ids?: string[];
  soft?: boolean;
}

export const { POST, DELETE } = createNextApiRoute<
  BackendExampleDomainService,
  {
    POST: { body: BulkCreateBody };
    DELETE: { body: BulkDeleteBody };
  }
>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  handlers: {
    POST: async (service, { body }) => {
      const items = body.items ?? (body as unknown as unknown[]);
      if (!Array.isArray(items)) {
        throw new ValidationError(
          API_ERROR_CODES.REQUEST_INVALID_PARAMS,
          HTTP_STATUS.BAD_REQUEST,
          'Expected array of items in body.items or body',
          { field: 'items' }
        );
      }
      return service.bulkCreate(items, { transaction: { useTransaction: false } });
    },
    DELETE: async (service, { body }) => {
      const { ids, soft = true } = body;
      if (!Array.isArray(ids)) {
        throw new ValidationError(
          API_ERROR_CODES.REQUEST_INVALID_PARAMS,
          HTTP_STATUS.BAD_REQUEST,
          'Expected array of ids in body.ids',
          { field: 'ids' }
        );
      }
      await service.bulkDelete(ids, { soft }, { transaction: { useTransaction: false } });
      return { ids };
    },
  },
});
