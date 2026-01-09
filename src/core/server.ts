/**
 * Server-side Core Initialization
 *
 * Use this in API routes, Server Components, and Server Actions.
 * Uses createHmrSafeSingleton to handle HMR persistence automatically.
 *
 * @example
 * ```typescript
 * // app/api/users/route.ts
 * import { getServerCore } from '@/core/server';
 *
 * export async function GET() {
 *   const core = await getServerCore();
 *   // Use core.db, core.cache, etc.
 * }
 * ```
 *
 * @example
 * ```typescript
 * // app/users/page.tsx (Server Component)
 * import { getServerCore } from '@/core/server';
 *
 * export default async function UsersPage() {
 *   const core = await getServerCore();
 *   const data = await fetchData(core);
 *   return <UserList data={data} />;
 * }
 * ```
 */

import type { NextRequest } from 'next/server';
import {
  Core,
  BackendExampleDomainService,
  BackendFilesDomainService,
  BackendNotificationsDomainService,
  ServiceRegistry,
} from '@plyaz/core/backend';
import {
  FilesStreamEndpoint,
  NotificationsStreamEndpoint,
  SystemStreamEndpoint,
} from '@plyaz/core/events/streaming';
import { createHmrSafeSingleton } from '@plyaz/core/utils';
import * as ServerErrorMiddleware from '@plyaz/errors/middleware/backend';

import { backendConfig } from '@/config/plyaz.backend';

/**
 * HMR-safe Core singleton.
 * Persists across Next.js Hot Module Replacement in development.
 */
const coreAccessor = createHmrSafeSingleton('editor-core', async () => {
  const config = {
    ...backendConfig,
    services: [
      { service: BackendExampleDomainService, config: { enabled: true } },
      { service: BackendFilesDomainService, config: { enabled: true } },
      { service: BackendNotificationsDomainService, config: { enabled: true } },
    ],
    // Streaming configuration for real-time progress events
    // Registers CoreEventManager listeners during Core.initialize()
    // so upload progress events are captured before stream route loads
    streaming: {
      enabled: true,
      server: {
        heartbeatInterval: 15000,
        defaultChannels: ['uploads', 'system', 'downloads', 'generations', 'notifications'],
      },
      endpoints: [
        {
          endpoint: FilesStreamEndpoint,
          config: {
            enabled: true,
            name: 'files',
            channels: ['uploads', 'downloads', 'generations'],
          },
        },
        {
          endpoint: NotificationsStreamEndpoint,
          config: {
            enabled: true,
            name: 'notifications',
            channels: ['notifications', 'user:notifications:'],
          },
        },
        {
          endpoint: SystemStreamEndpoint,
          config: { enabled: true, name: 'system', channels: ['system'] },
        },
      ],
    },
  };

  await Core.initialize(config);
  return Core;
});

/**
 * Get initialized Core instance for server-side use.
 * Safe to call multiple times - initializes only once.
 * Uses globalThis to persist state across Next.js HMR.
 *
 * @returns Initialized Core instance
 */
export async function getServerCore(): Promise<typeof Core> {
  // Check if Core's actual state is initialized (not just the HMR singleton)
  // Module reloads can reset Core's internal state while HMR singleton thinks it's ready
  if (coreAccessor.isInitialized() && !Core.isInitialized) {
    await coreAccessor.reset();
  }

  return coreAccessor();
}

/**
 * Reset Core (for testing or hot reloading).
 * Use sparingly - mainly for test cleanup.
 */
export async function resetServerCore(): Promise<void> {
  await coreAccessor.reset();
}

/**
 * Check if Core is initialized
 */
export function isServerCoreInitialized(): boolean {
  return coreAccessor.isInitialized();
}

/**
 * Get the BackendExampleDomainService instance.
 * Ensures Core is initialized first.
 */
export async function getExampleService(): Promise<BackendExampleDomainService> {
  await getServerCore();
  return ServiceRegistry.get<BackendExampleDomainService>('example');
}

/**
 * Get the BackendFilesDomainService instance.
 * Ensures Core is initialized first.
 */
export async function getFilesService(): Promise<BackendFilesDomainService> {
  await getServerCore();
  return ServiceRegistry.get<BackendFilesDomainService>('files');
}

/**
 * Get the BackendNotificationsDomainService instance.
 * Ensures Core is initialized first.
 */
export async function getNotificationsService(): Promise<BackendNotificationsDomainService> {
  await getServerCore();
  return ServiceRegistry.get<BackendNotificationsDomainService>('notifications');
}

/**
 * Wrap an API route handler with Core's error handler.
 * Ensures Core is initialized and uses configured error handling.
 *
 * @example
 * ```typescript
 * // app/api/users/route.ts
 * import { withCoreErrorHandler } from '@/core/server';
 *
 * export const GET = withCoreErrorHandler(async (request) => {
 *   const users = await fetchUsers();
 *   return Response.json({ data: users });
 * });
 * ```
 */
export function withCoreErrorHandler(
  handler: (request: NextRequest, context?: unknown) => Promise<Response>
): (request: NextRequest, context?: unknown) => Promise<Response> {
  // Use ServerErrorMiddleware.withErrorHandler directly for Next.js App Router
  // This ensures proper error handling regardless of runtime detection
  return ServerErrorMiddleware.withErrorHandler(
    async (request: NextRequest, context?: unknown): Promise<Response> => {
      await getServerCore();
      return handler(request, context);
    },
    {
      source: 'editor-api',
      includeStack: process.env.NODE_ENV !== 'production',
      logErrors: true,
    }
  );
}

// Re-export for convenience
export {
  ServiceRegistry,
  BackendExampleDomainService,
  BackendFilesDomainService,
  BackendNotificationsDomainService,
};
