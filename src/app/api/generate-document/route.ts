/**
 * Document Generation API Route
 * POST /api/generate-document
 *
 * Generates a document from template without uploading to storage.
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendFilesDomainService } from '@plyaz/core/backend';
import type { GenerateDocumentRequest } from '@plyaz/types/api';

import { getServerCore } from '@/core/server';

export const { POST } = createNextApiRoute<
  BackendFilesDomainService,
  { POST: { body: GenerateDocumentRequest } }
>({
  service: 'files',
  getCore: getServerCore,
  errorSource: 'generate-api',
  successMessage: 'Document generated successfully',
  handlers: {
    POST: async (service, { body }) => service.generateFile(body),
  },
});
