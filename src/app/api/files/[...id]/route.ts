/**
 * Single File API Route (Catch-all)
 *
 * GET /api/files/:id - Get file by ID
 * GET /api/files/:id/download - Download file content
 * GET /api/files/:id/signed-url - Get signed URL
 * DELETE /api/files/:id - Delete file
 */

import { StoragePackageError } from '@plyaz/errors';
import { STORAGE_ERROR_CODES } from '@plyaz/types';
import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 3600;

// Allow large file downloads
export const maxDuration = 300;

export const { GET, DELETE } = createNextApiRoute<BackendFilesDomainService>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'files-api',
  handlers: {
    GET: async (service, { params, query }) => {
      // Catch-all params come as array - ensure it's always an array
      const rawId = params.id as string | string[];
      const idSegments: string[] = Array.isArray(rawId) ? rawId : [rawId];
      const lastSegment = idSegments[idSegments.length - 1];
      const isDownloadAction = lastSegment === 'download';
      const isSignedUrlAction = lastSegment === 'signed-url';

      const fileIdSegments =
        isDownloadAction || isSignedUrlAction ? idSegments.slice(0, -1) : idSegments;
      const fileId = fileIdSegments.join('/');

      // Handle download action
      if (isDownloadAction) {
        const result = await service.downloadFile({ fileId });
        return {
          buffer: result.buffer,
          filename: result.filename,
          mimeType: result.mimeType,
        };
      }

      // Handle signed-url action
      if (isSignedUrlAction) {
        const expiresIn = query.expiresIn
          ? Number.parseInt(query.expiresIn, 10)
          : DEFAULT_SIGNED_URL_EXPIRY_SECONDS;
        return service.getSignedUrl({ fileId, expiresIn });
      }

      // Default: Get file metadata
      const file = await service.getById(fileId);
      if (!file) {
        throw new StoragePackageError(
          `File with ID ${fileId} not found`,
          STORAGE_ERROR_CODES.FILE_NOT_FOUND
        );
      }
      return file;
    },
    DELETE: async (service, { params, query }) => {
      const rawId = params.id as string | string[];
      const idSegments: string[] = Array.isArray(rawId) ? rawId : [rawId];
      const fileId = idSegments.join('/');
      const hardDelete = query.hard === 'true';

      await service.delete(fileId, { hard: hardDelete });
      return { id: fileId };
    },
  },
});
