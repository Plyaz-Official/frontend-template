/**
 * SSE Stream Endpoint
 *
 * Server-Sent Events endpoint for real-time progress updates.
 * Uses StreamServer from Core.initialize() which sets up StreamRegistry.
 *
 * GET /api/events/stream?channels=uploads,upload:abc123
 *
 * Channels available:
 * - `uploads` - All upload progress broadcast
 * - `upload:{fileId}` - Per-file upload progress
 * - `downloads` - All download progress broadcast
 * - `download:{fileId}` - Per-file download progress
 * - `generations` - All generation progress broadcast
 * - `generate:{templateId}` - Per-template generation progress
 * - `system` - System events (heartbeat, connection)
 *
 * NOTE: Streaming is initialized during Core.initialize() in server.ts.
 * This ensures event listeners are registered before any uploads occur.
 */

import { Core } from '@plyaz/core/backend';

import { getServerCore } from '@/core/server';

/**
 * SSE endpoint handler
 *
 * Uses the StreamServer from Core which is initialized with:
 * - FilesStreamEndpoint (uploads, downloads, generations channels)
 * - SystemStreamEndpoint (system channel)
 *
 * The CoreEventManager listeners are registered during Core.initialize(),
 * ensuring upload progress events are captured even if uploads happen
 * before this route is accessed.
 */
export async function GET(request: Request): Promise<Response> {
  // Ensure Core is initialized (this also initializes streaming)
  await getServerCore();

  // Get stream server from Core
  const streamServer = Core.streamServer;
  if (!streamServer) {
    return new Response(JSON.stringify({ error: 'Streaming not initialized' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the handler and invoke it
  const handler = streamServer.getHandler('nextjs') as (req: Request) => Promise<Response>;
  return handler(request);
}

/**
 * Get stream server from Core
 *
 * Note: To emit progress events from upload/download/generate handlers,
 * use CoreEventManager directly. FilesChannelController will automatically
 * broadcast these events to SSE clients.
 *
 * @example
 * ```ts
 * import { CoreEventManager } from '@plyaz/core/events';
 *
 * // In upload handler
 * CoreEventManager.emit('upload:progress', {
 *   fileId: 'abc123',
 *   filename: 'file.pdf',
 *   loaded: 50000,
 *   total: 100000,
 *   percentage: 50,
 *   status: 'uploading',
 * });
 *
 * // FilesStreamEndpoint automatically broadcasts to:
 * // - Channel 'upload:abc123' (file-specific)
 * // - Channel 'uploads' (broadcast to all)
 * ```
 */
export async function getStreamServer() {
  await getServerCore();
  return Core.streamServer;
}
