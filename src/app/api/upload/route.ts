/**
 * File Upload API Route
 * POST /api/upload
 *
 * Uploads a file to storage using BackendFilesDomainService.
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';
import type { UploadFileRequest } from '@plyaz/types/api';
import type { UploadParams } from '@plyaz/types/storage';

import { getServerCore } from '@/core/server';

// Next.js App Router config
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Extended upload body - adds file buffer support to API type.
 * Note: UploadFileRequest has base64, but we also accept direct Buffer.
 */
interface UploadBody extends UploadFileRequest {
  file?: Buffer | NodeJS.ReadableStream;
}

export const { POST } = createNextApiRoute<
  BackendFilesDomainService,
  { POST: { body: UploadBody } }
>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'upload-api',
  successMessage: 'File uploaded successfully',
  handlers: {
    POST: async (service, { body }) => {
      const { base64, ...uploadBody } = body;

      // Convert base64 to Buffer if provided, pass rest as-is
      // Types are validated by Zod schema (z.nativeEnum) before reaching here
      const uploadParams: Partial<UploadParams> = {
        ...uploadBody,
        file: base64 ? Buffer.from(base64, 'base64') : body.file,
      };

      const result = await service.uploadFile(uploadParams as UploadParams);

      // Get DB record for UUID
      const dbRecord = await service.getByStoragePath(result.metadata.path);

      return {
        id: dbRecord?.id ?? result.metadata.fileId,
        key: result.metadata.path,
        filename: result.metadata.filename,
        mimeType: result.metadata.mimeType,
        size: result.metadata.size,
        url: result.metadata.url,
        publicUrl: result.metadata.url,
        bucket: result.metadata.bucket,
        adapter: result.metadata.adapter,
        entityType: result.metadata.entityType,
        entityId: result.metadata.entityId,
        category: result.metadata.category,
        uploadedAt: result.metadata.uploadedAt,
        variants: result.variants,
      };
    },
  },
});
