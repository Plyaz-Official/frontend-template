/**
 * Bulk Files API Route
 * DELETE /api/files/bulk - Delete multiple files
 *
 * For bulk uploads use POST /api/upload/bulk
 */

import { ValidationError } from '@plyaz/errors';
import { API_ERROR_CODES, HTTP_STATUS } from '@plyaz/types';
import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

export const { DELETE } = createNextApiRoute<BackendFilesDomainService>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'files-api',
  successMessage: 'Bulk delete completed',
  handlers: {
    DELETE: async (service, { body }) => {
      const { ids, soft = true } = body as { ids?: string[]; soft?: boolean };

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError(
          API_ERROR_CODES.INVALID_INPUT,
          HTTP_STATUS.BAD_REQUEST,
          'ids array is required and cannot be empty',
          { field: 'ids' }
        );
      }

      const results: { id: string; deleted: boolean }[] = [];
      const errors: { id: string; error: string }[] = [];

      for (const id of ids) {
        try {
          await service.delete(id, { hard: !soft });
          results.push({ id, deleted: true });
        } catch (error) {
          errors.push({
            id,
            error: error instanceof Error ? error.message : 'Delete failed',
          });
        }
      }

      return {
        deleted: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
  },
});
