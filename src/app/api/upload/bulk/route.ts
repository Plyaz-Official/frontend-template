/**
 * Bulk File Upload API Route
 * POST /api/upload/bulk
 */

import { ValidationError } from '@plyaz/errors';
import { API_ERROR_CODES, HTTP_STATUS } from '@plyaz/types';
import type { UploadResult } from '@plyaz/types/storage';
import type { UploadFilesRequest } from '@plyaz/types/api';
import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

/** File item in bulk upload with base64 support */
interface BulkUploadFile {
  base64?: string;
  file?: Buffer | NodeJS.ReadableStream;
  [key: string]: unknown;
}

/** Extended bulk upload body with base64 support */
interface BulkUploadBody extends Omit<UploadFilesRequest, 'files'> {
  files?: BulkUploadFile[];
}

export const { POST } = createNextApiRoute<
  BackendFilesDomainService,
  { POST: { body: BulkUploadBody } }
>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'upload-api',
  successMessage: 'Files uploaded successfully',
  handlers: {
    POST: async (service, { body }) => {
      const { files } = body;

      if (!files || !Array.isArray(files)) {
        throw new ValidationError(
          API_ERROR_CODES.REQUEST_INVALID_PARAMS,
          HTTP_STATUS.BAD_REQUEST,
          'Request body must have a "files" array',
          { field: 'files' }
        );
      }

      // Convert base64 to Buffer for each file
      const processedFiles = files.map(fileParams => {
        const { base64, ...rest } = fileParams;
        return {
          ...rest,
          file: base64 ? Buffer.from(base64, 'base64') : fileParams.file,
        };
      });

      const uploadResults = await service.uploadFiles(processedFiles);

      const results = uploadResults.map((result: UploadResult, index: number) => ({
        index,
        success: true,
        data: {
          id: result.metadata.fileId,
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
          uploadedAt: result.metadata.uploadedAt.toISOString(),
          variants: result.variants,
        },
      }));

      return {
        results,
        summary: {
          total: files.length,
          succeeded: uploadResults.length,
          failed: files.length - uploadResults.length,
        },
        allSucceeded: uploadResults.length === files.length,
      };
    },
  },
});
