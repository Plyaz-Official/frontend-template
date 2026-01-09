/**
 * Backend Plyaz Configuration
 *
 * Configuration for server-side Core initialization.
 * Used in API routes, Server Components, and Server Actions.
 *
 * Configures storage adapters and notification providers (backend-only)
 * to avoid importing Playwright/Puppeteer on the client-side.
 */

import { join } from 'path';

import { STORAGE_ADAPTER_TYPE, STORAGE_ENVIRONMENT } from '@plyaz/types/storage';
import { SupabaseStorageAdapter, CloudflareR2Adapter } from '@plyaz/storage';
import {
  InfobipEmailAdapter,
  SendGridAdapter,
  FileSystemTranslationService,
} from '@plyaz/notifications';

import {
  backendConfig as sharedBackendConfig,
  env,
  hasSupabaseStorage,
  hasCloudflareR2,
  hasInfobip,
  hasSendGrid,
} from './plyaz.shared';

// Get storage templates path from @plyaz/storage package
// pnpm creates symlinks in node_modules/@plyaz/storage -> actual package location
function getStorageTemplatesPath(): string {
  // Use join from path import at top of file
  return join(process.cwd(), 'node_modules', '@plyaz', 'storage', 'templates');
}

// Get notification templates path from @plyaz/notifications package
function getNotificationTemplatesPath(): string {
  return join(process.cwd(), 'node_modules', '@plyaz', 'notifications', 'templates');
}

// =============================================================================
// Build Storage Adapters (Backend-only - avoid Playwright on client)
// =============================================================================

function getStorageAdapters() {
  const adapters: unknown[] = [];

  // Supabase Storage Adapter
  if (hasSupabaseStorage()) {
    adapters.push(
      new SupabaseStorageAdapter({
        name: 'supabase-primary',
        type: STORAGE_ADAPTER_TYPE.SupabaseStorage,
        enabled: true,
        priority: 100,
        supabaseUrl: env.supabaseUrl!,
        serviceRoleKey: env.supabaseServiceRoleKey!,
        bucket: env.supabaseStorageBucket,
        autoCreateBuckets: true,
        defaultEnvironment: STORAGE_ENVIRONMENT.DEVELOPMENT,
      })
    );
  }

  // Cloudflare R2 Adapter
  if (hasCloudflareR2()) {
    adapters.push(
      new CloudflareR2Adapter({
        name: 'cloudflare-r2-primary',
        type: STORAGE_ADAPTER_TYPE.CloudflareR2,
        enabled: true,
        priority: 90,
        credentials: {
          accountId: env.cloudflareAccountId!,
          accessKeyId: env.r2AccessKeyId!,
          secretAccessKey: env.r2SecretAccessKey!,
        },
        bucket: env.r2BucketName,
        autoCreateBuckets: true,
        defaultEnvironment: STORAGE_ENVIRONMENT.DEVELOPMENT,
      })
    );
  }

  return adapters;
}

// =============================================================================
// Build Notification Providers (Backend-only)
// =============================================================================

function getNotificationProviders() {
  const emailProviders: unknown[] = [];

  // Infobip Email Provider (Primary)
  if (hasInfobip()) {
    emailProviders.push(
      new InfobipEmailAdapter({
        name: 'infobip-primary',
        enabled: true,
        priority: 100,
        apiKey: env.infobipApiKey!,
        baseUrl: env.infobipBaseUrl!,
        fromEmail: env.fromEmail!,
        fromName: env.fromName,
      })
    );
  }

  // SendGrid Email Provider (Fallback)
  if (hasSendGrid()) {
    emailProviders.push(
      new SendGridAdapter({
        name: 'sendgrid-fallback',
        enabled: true,
        priority: 50,
        apiKey: env.sendgridApiKey!,
        fromEmail: env.fromEmail!,
        fromName: env.fromName,
      })
    );
  }

  return { email: emailProviders, sms: [], push: [] };
}

// =============================================================================
// Build Backend Config with Adapters
// =============================================================================

const storageAdapters = getStorageAdapters();

const backendConfig = {
  ...sharedBackendConfig,
  ...(sharedBackendConfig.storage && (hasSupabaseStorage() || hasCloudflareR2())
    ? {
        storage: {
          ...sharedBackendConfig.storage,
          adapters: storageAdapters,
          // Template engine configuration for document generation
          template: {
            // Base path to templates directory (auto-detected from @plyaz/storage package)
            templateBasePath: getStorageTemplatesPath(),
            // Use Puppeteer for PDF/image rendering (requires puppeteer package)
            renderer: {
              use: 'puppeteer',
              options: {
                headless: true,
              },
            },
            // Default locale for templates
            defaultLocale: 'en',
            // Enable template caching
            cacheEnabled: true,
            cacheTTL: 300000, // 5 minutes
          },
        },
      }
    : {}),
  ...(sharedBackendConfig.notifications && (hasInfobip() || hasSendGrid())
    ? {
        notifications: {
          ...sharedBackendConfig.notifications,
          providers: getNotificationProviders(),
          // Provide translation service with correct templates path
          // Default FileSystemTranslationService looks at process.cwd()/templates which doesn't exist
          translationService: new FileSystemTranslationService(getNotificationTemplatesPath()),
        },
      }
    : {}),
};

export { backendConfig };

// Re-export backend event handlers and utilities
export {
  dbEvents,
  dbAuditEvents,
  storageEvents,
  notificationEvents,
  notificationDebugEvents,
  notificationErrorHandlers,
  env,
  hasSupabaseStorage,
  hasCloudflareR2,
  hasInfobip,
  hasSendGrid,
} from './plyaz.shared';
