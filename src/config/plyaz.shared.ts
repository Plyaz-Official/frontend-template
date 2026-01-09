/**
 * Shared Plyaz Core Configuration
 *
 * Centralized config for both frontend (PlyazProvider) and backend (Core.initialize).
 *
 * Configuration categories:
 * - BOTH: environment, appContext, verbose, api, featureFlags, errorHandler, observability
 * - BACKEND ONLY: db, cache (redis), storage, notifications
 * - FRONTEND ONLY: store (Zustand integration)
 *
 * @see ./plyaz.frontend.ts - Client-only config with React services
 * @see ./plyaz.backend.ts - Server-only config exports
 * @see ./env.ts - Environment variables and service checks
 */

import type { CorePlyazConfig } from '@plyaz/types/core';
import type {
  ClientEventHandlers,
  CacheEventHandlers,
  PerformanceEventHandlers,
  HeaderEventHandlers,
  ConfigEventHandlers,
  NetworkEventHandlers,
} from '@plyaz/types/api';
import type { ErrorEventHandlers } from '@plyaz/types/errors';

import {
  env,
  log,
  getEnv,
  hasEncryption,
  hasRedis,
  hasDatabase,
  hasSupabaseStorage,
  hasCloudflareR2,
  hasInfobip,
  hasSendGrid,
  hasDatadog,
} from './env';

// =============================================================================
// Event Handlers (for observability and debugging)
// =============================================================================

// API Client Events
const clientEvents: ClientEventHandlers = {
  onClientCreated: event => {
    log.info('[API:Client] Created', { clientId: event.data.clientId });
  },
  onRequestStart: event => {
    log.debug('[API:Client] Request start', {
      url: event.data.url,
      method: event.data.method,
    });
  },
  onResponseReceived: event => {
    log.debug('[API:Client] Response received', {
      url: event.data.url,
      status: event.data.status,
    });
  },
  onRetryAttempt: event => {
    log.warn('[API:Client] Retry attempt', {
      url: event.data.url,
      attempt: event.data.attempt,
      maxAttempts: event.data.maxAttempts,
      error: event.data.error.message,
    });
  },
  onClientConflict: event => {
    log.warn('[API:Client] Config conflict', { conflict: event.data });
  },
  onClientDebug: event => {
    log.debug('[API:Client] Debug', { info: event.data });
  },
};

// Cache Events
const cacheEvents: CacheEventHandlers = {
  onCacheHit: event => {
    log.debug('[API:Cache] Hit', { key: event.data.key, age: event.data.age });
  },
  onCacheMiss: event => {
    log.debug('[API:Cache] Miss', { key: event.data.key, reason: event.data.reason });
  },
  onCacheInvalidate: event => {
    log.debug('[API:Cache] Invalidate', {
      key: event.data.key,
      pattern: event.data.pattern,
      count: event.data.count,
    });
  },
};

// Performance Events
const performanceEvents: PerformanceEventHandlers = {
  onRequestStart: event => {
    log.debug('[API:Perf] Request start', {
      requestId: event.data.requestId,
      url: event.data.url,
      method: event.data.method,
    });
  },
  onRequestComplete: event => {
    log.debug('[API:Perf] Request complete', {
      requestId: event.data.requestId,
      duration: event.data.duration,
      status: event.data.status,
    });
  },
  onRetry: event => {
    log.warn('[API:Perf] Retry', {
      requestId: event.data.requestId,
      attempt: event.data.attempt,
      maxAttempts: event.data.maxAttempts,
      reason: event.data.reason,
    });
  },
  onThresholdExceeded: event => {
    log.warn('[API:Perf] Threshold exceeded', {
      type: event.data.type,
      actual: event.data.actual,
      threshold: event.data.threshold,
    });
  },
  onOptimizationApplied: event => {
    log.info('[API:Perf] Optimization applied', {
      type: event.data.type,
      reason: event.data.reason,
      impact: event.data.impact,
    });
  },
};

// Header Events
const headerEvents: HeaderEventHandlers = {
  onHeadersChanged: event => {
    log.debug('[API:Headers] Changed', {
      source: event.data.source,
      reason: event.data.reason,
      added: Object.keys(event.data.changes.added).length,
      modified: Object.keys(event.data.changes.modified).length,
      removed: event.data.changes.removed.length,
    });
  },
  onHeadersEnriched: event => {
    log.debug('[API:Headers] Enriched', {
      source: event.data.source,
      addedHeaders: event.data.addedHeaders,
    });
  },
  onHeadersConflict: event => {
    log.warn('[API:Headers] Conflict', {
      header: event.data.header,
      conflictCount: event.data.conflicts.length,
      resolution: event.data.resolution,
      strategy: event.data.strategy,
    });
  },
};

// Config Events
const configEvents: ConfigEventHandlers = {
  onGlobalUpdated: event => {
    log.info('[API:Config] Global updated', {
      source: event.data.source,
      changes: event.data.changes,
    });
  },
  onGlobalReset: event => {
    log.info('[API:Config] Global reset', { source: event.data.source });
  },
  onEnvironmentConfigured: event => {
    log.info('[API:Config] Environment configured', {
      environment: event.data.environment,
      source: event.data.source,
    });
  },
  onPresetApplied: event => {
    log.info('[API:Config] Preset applied', {
      presetName: event.data.presetName,
      source: event.data.source,
    });
  },
};

// Network Events
const networkEvents: NetworkEventHandlers = {
  onNetworkQualityChange: event => {
    log.info('[API:Network] Quality changed', {
      previous: event.data.previous,
      current: event.data.current,
      recommendation: event.data.recommendation,
    });
  },
  onNetworkInfoUpdate: event => {
    log.debug('[API:Network] Info updated', { changes: event.data.changes });
  },
  onAutoDetection: event => {
    log.debug('[API:Network] Auto detection', {
      detected: event.data.detected,
      applied: event.data.applied,
      confidence: event.data.confidence,
    });
  },
};

// Error Event Handlers
const errorHandlers: ErrorEventHandlers = {
  onError: error => {
    log.error('[API:Error] Generic error', { code: error.code, message: error.message });
  },
  onValidationError: error => {
    log.warn('[API:Error] Validation error', { code: error.code, message: error.message });
  },
  onAuthenticationError: error => {
    log.warn('[API:Error] Authentication error', { code: error.code, message: error.message });
  },
  onAuthorizationError: error => {
    log.warn('[API:Error] Authorization error', { code: error.code, message: error.message });
  },
  onNetworkError: error => {
    log.error('[API:Error] Network error', { code: error.code, message: error.message });
  },
  onTimeoutError: error => {
    log.error('[API:Error] Timeout error', { code: error.code, message: error.message });
  },
  onRateLimitError: error => {
    log.warn('[API:Error] Rate limit error', { code: error.code, message: error.message });
  },
  onCacheError: error => {
    log.error('[API:Error] Cache error', { code: error.code, message: error.message });
  },
  onRetryError: error => {
    log.warn('[API:Error] Retry exhausted', { code: error.code, message: error.message });
  },
};

// =============================================================================
// Shared Base Config (Frontend & Backend)
// =============================================================================

const baseConfig = {
  environment: env.nodeEnv,
  appContext: 'backoffice' as const,
  verbose: env.isDev,

  // Logger Configuration
  // Use 'console' in development for readable output (works with API debugger tables)
  // Use 'pino' in production for JSON structured logs
  logger: {
    transport: env.isDev ? ('console' as const) : ('pino' as const),
  },

  // API Client Configuration
  api: {
    // Use /api for Next.js API routes (same-origin calls)
    // External URL can be configured via NEXT_PUBLIC_API_URL
    // Use || instead of ?? since env.apiUrl defaults to '' (empty string, which is falsy)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    baseURL: env.apiUrl || '/api',
    timeout: 120000, // 2 minutes - increased for file upload/download operations
    networkAware: {
      enabled: false,
      temporaryOverride: {
        enabled: false,
      },
    },
    tracking: {
      enabled: false,
      operations: false,
      // Auto-adjust based on environment
      performanceMode: 'off',
      events: false,
      telemetry: false,
      // Privacy
      skipHistory: false, // Don't skip history
    },

    // Unified strategy for all API behaviors (cache, retry, polling, performance)
    // 'interactive' is appropriate for backoffice/editor apps with user interaction
    strategy: 'interactive',

    // Retry configuration
    retry: {
      attempts: env.isProd ? 3 : 1,
      delay: 1000,
    },

    // Default headers
    headers: {
      'X-Service': 'plyaz-editor',
      'X-App-Context': 'backoffice',
    },

    // Event Handlers
    clientEvents,
    cacheEvents,
    performanceEvents,
    headerEvents,
    configEvents,
    errorHandlers,

    // Network configuration with events
    network: {
      autoDetect: true,
      events: networkEvents,
    },
  },

  // Feature Flags Configuration - using 'memory' provider for local editor
  // No external API needed - flags are stored in memory with static defaults
  featureFlags: {
    enabled: true,
    provider: 'memory' as const, // Use memory provider instead of API for local editor
    defaults: {
      MAINTENANCE_MODE: false,
      DARK_MODE: true,
      BETA_FEATURES: env.isDev,
      EDITOR_PREVIEW: true,
      TEMPLATE_SYNC: true,
    },
    // Feature flag callbacks
    onFlagChange: (key: string, _prev: unknown, value: unknown) => {
      log.info(`Feature flag changed: ${key} = ${String(value)}`);
    },
    onError: (error: Error) => {
      log.error('Feature flag error', { message: error.message });
    },
  },

  // Error Handler Configuration
  errorHandler: {
    enabled: true,
    maxErrors: 100,
    includeStack: env.isDev,
    logToConsole: env.isDev,
    source: 'editor',
    localization: {
      defaultLocale: 'en',
      fallbackLocale: 'en',
    },
  },

  // Observability Configuration
  observability: {
    enabled: true,
    serviceName: getEnv('SERVICE_NAME', 'plyaz-editor'),
    environment: env.nodeEnv,
    samplingRate: env.isProd ? 0.1 : 1.0,
    defaultTags: {
      service: 'plyaz-editor',
      appContext: 'backoffice',
      environment: env.nodeEnv,
    },
    flushInterval: 10000, // 10 seconds
    bufferSize: 100,
  },
};

// =============================================================================
// Frontend Base Config (for PlyazProvider)
// Services are added in plyaz.frontend.ts to avoid React imports in server code
// =============================================================================

export const frontendBaseConfig: CorePlyazConfig = {
  ...baseConfig,

  // Services are configured in plyaz.frontend.ts
  services: [],

  // Store Integration (Frontend only)
  // autoInitFeatureFlags disabled - using memory provider with static defaults
  store: {
    autoInitFeatureFlags: false,
  },
};

// =============================================================================
// Backend-Only Event Handlers (for db, storage, notifications)
// =============================================================================

// Database Events (uncomment when db is enabled)
// import type { AuditEvent, BeforeWriteEvent, AfterWriteEvent, BeforeReadEvent, AfterReadEvent } from '@plyaz/types/db';
const dbEvents = {
  onBeforeWrite: (event: { table: string; operation: string }) => {
    log.debug('[DB] Before write', { table: event.table, operation: event.operation });
  },
  onAfterWrite: (event: { table: string; operation: string; duration: number }) => {
    log.debug('[DB] After write', {
      table: event.table,
      operation: event.operation,
      duration: event.duration,
    });
  },
  onWriteFailed: (event: {
    table: string;
    operation: string;
    error: unknown;
    duration: number;
  }) => {
    log.error('[DB] Write failed', {
      table: event.table,
      operation: event.operation,
      error: event.error instanceof Error ? event.error.message : String(event.error),
      duration: event.duration,
    });
  },
  onBeforeRead: (event: { table: string }) => {
    log.debug('[DB] Before read', { table: event.table });
  },
  onAfterRead: (event: { table: string; duration: number }) => {
    log.debug('[DB] After read', { table: event.table, duration: event.duration });
  },
  onReadFailed: (event: { table: string; error: unknown; duration: number }) => {
    log.error('[DB] Read failed', {
      table: event.table,
      error: event.error instanceof Error ? event.error.message : String(event.error),
      duration: event.duration,
    });
  },
  onError: (event: { error: unknown; operation?: string; table?: string }) => {
    log.error('[DB] Error', {
      operation: event.operation,
      table: event.table,
      error: event.error instanceof Error ? event.error.message : String(event.error),
    });
  },
};

const dbAuditEvents = {
  onAuditAfterWrite: (event: { table: string; operation: string; recordId?: string }) => {
    log.debug('[DB:Audit] Entry written', {
      table: event.table,
      operation: event.operation,
      recordId: event.recordId,
    });
  },
};

// Storage Events (uncomment when storage is enabled)
// import type { StorageEventPayload } from '@plyaz/types/storage';
const storageEvents = {
  // Upload Events
  onFileUploaded: (payload: {
    metadata?: { fileId?: string; category?: string; adapter?: string };
  }) => {
    log.info('[Storage] File uploaded', payload.metadata);
  },
  onFileUploadFailed: (payload: { data?: unknown; metadata?: { filename?: string } }) => {
    log.error('[Storage] Upload failed', {
      error: payload.data,
      filename: payload.metadata?.filename,
    });
  },
  onUploadProgress: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.debug('[Storage] Upload progress', {
      fileId: payload.metadata?.fileId,
      progress: payload.data,
    });
  },
  onUploadAborted: (payload: { metadata?: { fileId?: string } }) => {
    log.warn('[Storage] Upload aborted', { fileId: payload.metadata?.fileId });
  },
  // Delete Events
  onFileDeleted: (payload: { metadata?: { fileId?: string } }) => {
    log.info('[Storage] File deleted', { fileId: payload.metadata?.fileId });
  },
  onFileDeleteFailed: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.error('[Storage] Delete failed', { fileId: payload.metadata?.fileId, error: payload.data });
  },
  // Access Events
  onFileAccessed: (payload: { metadata?: { fileId?: string } }) => {
    log.debug('[Storage] File accessed', { fileId: payload.metadata?.fileId });
  },
  onSignedUrlGenerated: (payload: { metadata?: { fileId?: string } }) => {
    log.debug('[Storage] Signed URL generated', { fileId: payload.metadata?.fileId });
  },
  // Media Processing Events
  onMetadataExtracted: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.debug('[Storage] Metadata extracted', {
      fileId: payload.metadata?.fileId,
      metadata: payload.data,
    });
  },
  onMediaProcessingStarted: (payload: { metadata?: { fileId?: string } }) => {
    log.info('[Storage] Media processing started', { fileId: payload.metadata?.fileId });
  },
  onMediaProcessingCompleted: (payload: { metadata?: { fileId?: string } }) => {
    log.info('[Storage] Media processing completed', { fileId: payload.metadata?.fileId });
  },
  onMediaProcessingFailed: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.error('[Storage] Media processing failed', {
      fileId: payload.metadata?.fileId,
      error: payload.data,
    });
  },
  // Security Events
  onVirusDetected: (payload: {
    metadata?: { fileId?: string; filename?: string };
    data?: unknown;
  }) => {
    log.warn('[Storage] VIRUS DETECTED!', {
      fileId: payload.metadata?.fileId,
      filename: payload.metadata?.filename,
      threat: payload.data,
    });
  },
  onVirusScanCompleted: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.debug('[Storage] Virus scan completed', {
      fileId: payload.metadata?.fileId,
      clean: payload.data,
    });
  },
  // Adapter Events
  onAdapterHealthCheck: (payload: { metadata?: { adapter?: string }; data?: unknown }) => {
    log.debug('[Storage] Adapter health check', {
      adapter: payload.metadata?.adapter,
      healthy: payload.data,
    });
  },
  onAdapterFailed: (payload: { metadata?: { adapter?: string }; data?: unknown }) => {
    log.error('[Storage] Adapter failed', {
      adapter: payload.metadata?.adapter,
      error: payload.data,
    });
  },
  // Compliance Events
  onRetentionPolicyApplied: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.info('[Storage] Retention policy applied', {
      fileId: payload.metadata?.fileId,
      policyId: payload.data,
    });
  },
  onFileMarkedForDeletion: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.info('[Storage] File marked for deletion', {
      fileId: payload.metadata?.fileId,
      scheduledAt: payload.data,
    });
  },
  // File Operations Events
  onFileReplaced: (payload: { metadata?: { fileId?: string } }) => {
    log.info('[Storage] File replaced', { fileId: payload.metadata?.fileId });
  },
  onFileReplaceFailed: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.error('[Storage] File replace failed', {
      fileId: payload.metadata?.fileId,
      error: payload.data,
    });
  },
  onFileMoved: (payload: { metadata?: { fileId?: string } }) => {
    log.info('[Storage] File moved', { fileId: payload.metadata?.fileId });
  },
  onFileMoveFailed: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.error('[Storage] File move failed', {
      fileId: payload.metadata?.fileId,
      error: payload.data,
    });
  },
  onFileCopied: (payload: { metadata?: { fileId?: string } }) => {
    log.info('[Storage] File copied', { fileId: payload.metadata?.fileId });
  },
  onFileCopyFailed: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.error('[Storage] File copy failed', {
      fileId: payload.metadata?.fileId,
      error: payload.data,
    });
  },
  // Queue Events
  onQueueStarted: () => {
    log.info('[Storage] Queue started');
  },
  onQueueStopped: () => {
    log.info('[Storage] Queue stopped');
  },
  onOperationProcessing: (payload: { data?: unknown }) => {
    log.debug('[Storage] Operation processing', { operation: payload.data });
  },
  onOperationCompleted: (payload: { data?: unknown }) => {
    log.debug('[Storage] Operation completed', { operation: payload.data });
  },
  onOperationRetry: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.warn('[Storage] Operation retry', {
      operation: payload.data,
      fileId: payload.metadata?.fileId,
    });
  },
  onOperationFailed: (payload: { metadata?: { fileId?: string }; data?: unknown }) => {
    log.error('[Storage] Operation failed', {
      operation: payload.data,
      fileId: payload.metadata?.fileId,
    });
  },
  // Error Events
  onStorageError: (payload: { data?: unknown }) => {
    log.error('[Storage] General error', { error: payload.data });
  },
  onAuditLogCreated: (payload: { data?: unknown }) => {
    log.debug('[Storage] Audit log created', { entry: payload.data });
  },
};

// Notification Events (uncomment when notifications is enabled)
const notificationEvents = {
  // Lifecycle Events
  onQueued: (payload: { notificationId?: string; channel?: string; templateId?: string }) => {
    log.debug('[Notification] Queued', payload);
  },
  onProcessing: (payload: { notificationId?: string; channel?: string }) => {
    log.debug('[Notification] Processing', payload);
  },
  onSent: (payload: {
    notificationId?: string;
    provider?: string;
    channel?: string;
    fallbackUsed?: boolean;
    attemptedProviders?: string[];
  }) => {
    log.info('[Notification] Sent', payload);
  },
  onFailed: (payload: {
    notificationId?: string;
    error?: unknown;
    attemptedProviders?: string[];
    retryCount?: number;
    nextRetryAt?: Date;
  }) => {
    log.error('[Notification] Failed', {
      ...payload,
      nextRetryAt: payload.nextRetryAt?.toISOString(),
    });
  },
  // Delivery Events
  onDelivered: (payload: { notificationId?: string; provider?: string; deliveredAt?: Date }) => {
    log.info('[Notification] Delivered', {
      ...payload,
      deliveredAt: payload.deliveredAt?.toISOString(),
    });
  },
  onBounced: (payload: { notificationId?: string; channel?: string }) => {
    log.warn('[Notification] Bounced', payload);
  },
  onComplained: (payload: { notificationId?: string; channel?: string }) => {
    log.warn('[Notification] Spam complaint', payload);
  },
  // Engagement Events
  onOpened: (payload: { notificationId?: string; provider?: string }) => {
    log.info('[Notification] Opened', payload);
  },
  onClicked: (payload: {
    notificationId?: string;
    provider?: string;
    metadata?: { url?: string };
  }) => {
    log.info('[Notification] Link clicked', { ...payload, url: payload.metadata?.url });
  },
  // URL Shortening
  onUrlShortened: (payload: {
    originalUrl?: string;
    shortUrl?: string;
    charactersSaved?: number;
  }) => {
    log.debug('[Notification] URL shortened', payload);
  },
};

const notificationDebugEvents = {
  onQueued: (payload: { correlationId?: string }) => {
    log.debug('[Notification:Debug] Queued', payload);
  },
  onProviderSelected: (payload: { correlationId?: string; data?: unknown }) => {
    log.debug('[Notification:Debug] Provider selected', payload);
  },
  onRateLimitChecked: (payload: { correlationId?: string }) => {
    log.debug('[Notification:Debug] Rate limit checked', payload);
  },
  onTemplateRendered: (payload: { correlationId?: string }) => {
    log.debug('[Notification:Debug] Template rendered', payload);
  },
  onSendingToProvider: (payload: { correlationId?: string; data?: unknown }) => {
    log.debug('[Notification:Debug] Sending to provider', payload);
  },
  onProviderSuccess: (payload: { correlationId?: string }) => {
    log.debug('[Notification:Debug] Provider success', payload);
  },
  onProviderFailure: (payload: { correlationId?: string; data?: unknown }) => {
    log.warn('[Notification:Debug] Provider failure', payload);
  },
  onWebhookReceived: (payload: { correlationId?: string }) => {
    log.debug('[Notification:Debug] Webhook received', payload);
  },
  onDelivered: (payload: { correlationId?: string }) => {
    log.debug('[Notification:Debug] Delivered', payload);
  },
  onCircuitBreakerOpened: (payload: { correlationId?: string; data?: unknown }) => {
    log.warn('[Notification:Debug] Circuit breaker opened', payload);
  },
  onFallbackTriggered: (payload: { correlationId?: string; data?: unknown }) => {
    log.info('[Notification:Debug] Fallback triggered', payload);
  },
};

const notificationErrorHandlers = {
  onProviderError: (error: { code?: string; message?: string }) => {
    log.error('[Notification] Provider error', error);
  },
  onQueueError: (error: { code?: string; message?: string }) => {
    log.error('[Notification] Queue error', error);
  },
  onWebhookError: (error: { code?: string; message?: string }) => {
    log.error('[Notification] Webhook error', error);
  },
  onAnyError: (error: unknown) => {
    log.error('[Notification] General error', { error });
  },
};

// =============================================================================
// Backend Config (for Core.initialize in API routes / Server Components)
// =============================================================================

export const backendConfig = {
  ...baseConfig,

  // HTTP error handler for Next.js API routes
  errorHandler: {
    ...baseConfig.errorHandler,
    httpHandler: true, // Auto-create HTTP error handler for Next.js
    source: 'editor-api',
  },
  skipDb: !hasDatabase(),
  skipStorage: !(hasSupabaseStorage() || hasCloudflareR2()),
  skipNotifications: !(hasInfobip() || hasSendGrid()),
  skipCache: false, // Always enable cache (memory fallback)

  // ─────────────────────────────────────────────────────────────────────────
  // Cache Configuration
  // ─────────────────────────────────────────────────────────────────────────
  cache: {
    strategy: (hasRedis() ? 'redis' : 'memory') as 'redis' | 'memory',
    isEnabled: true,
    ttl: 300, // 5 minutes
    prefix: 'editor',
    ...(hasRedis() && {
      redis: {
        url: env.redisUrl,
        keyPrefix: 'editor:',
        connectTimeout: 5000,
      },
    }),
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Database Configuration (when DATABASE_URL is set)
  // ─────────────────────────────────────────────────────────────────────────
  ...(hasDatabase() && {
    db: {
      adapter: 'sql' as const,
      sql: {
        connectionString: env.databaseUrl!,
        dialect: 'postgresql' as const,
      },

      // Query result caching
      cache: {
        enabled: true,
        provider: hasRedis() ? 'redis' : 'memory',
        ttl: 300,
      },

      // Soft delete (records marked as deleted, not removed)
      softDelete: {
        enabled: true,
        field: 'deleted_at',
        excludeTables: ['audit_logs', 'sessions'],
      },

      // Audit trail for compliance
      audit: {
        enabled: true,
        retentionDays: 180, // 6 months
        schema: 'audit',
        ...dbAuditEvents,
      },

      // Database event hooks (development only)
      ...(env.isDev && dbEvents),

      // Field-level encryption for sensitive data
      ...(hasEncryption() && {
        encryption: {
          enabled: true,
          key: env.encryptionKey!,
          algorithm: 'aes-256-gcm' as const,
          // Fields to encrypt: { tableName: ['field1', 'field2'] }
          fields: {
            users: ['email', 'phone', 'ssn'],
            payments: ['card_number', 'cvv'],
            api_keys: ['key', 'secret'],
          },
        },
      }),
    },
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Storage Configuration (when storage credentials are available)
  // ─────────────────────────────────────────────────────────────────────────
  // NOTE: Adapters are configured in plyaz.backend.ts to avoid importing
  // Playwright/Puppeteer on the client-side
  ...((hasSupabaseStorage() || hasCloudflareR2()) && {
    storage: {
      // Adapters will be populated by backend config
      adapters: [],

      // Queue configuration for bulk uploads
      queue: {
        enabled: true,
        concurrency: env.isProd ? 10 : 5,
        maxRetries: 3,
        interval: 100,
        autoStart: true,
      },

      // Adapter registry configuration
      adapterRegistryConfig: {
        healthCheckInterval: env.isProd ? 60000 : 30000,
        enableAutoHealthCheck: true,
      },

      // Compliance configuration
      compliance: {
        enabled: true,
        strictMode: env.isProd,
        defaultRetentionPolicy: {
          type: 'time-based' as const,
          retentionYears: 1,
          immutable: false,
          softDelete: true,
          gracePeriodDays: env.isProd ? 30 : 7,
          name: 'Default Retention',
          description: 'Default 1-year retention with soft delete',
        },
      },

      // Event handlers
      handlers: storageEvents,
    },
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications Configuration (when notification credentials are available)
  // ─────────────────────────────────────────────────────────────────────────
  // NOTE: Providers are configured in plyaz.backend.ts to avoid client-side imports
  ...((hasInfobip() || hasSendGrid()) && {
    notifications: {
      // Providers will be populated by backend config
      providers: {
        email: [],
        sms: [],
        push: [],
      },

      // Locale configuration
      locale: {
        default: 'en',
        fallback: 'en',
      },

      // Event handlers
      events: notificationEvents,
      debugEvents: notificationDebugEvents,
      errorHandlers: notificationErrorHandlers,
    },
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Observability Configuration (enhanced for backend)
  // ─────────────────────────────────────────────────────────────────────────
  observability: {
    ...baseConfig.observability,
    mode: 'parallel' as const,

    // Datadog configuration (when available)
    ...(hasDatadog() && {
      provider: 'datadog' as const,
      datadog: {
        apiKey: env.datadogApiKey,
        site: getEnv('DD_SITE', 'datadoghq.com'),
        apmEnabled: true,
      },
    }),
  },
};

// Export backend event handlers for use when enabling services
export {
  dbEvents,
  dbAuditEvents,
  storageEvents,
  notificationEvents,
  notificationDebugEvents,
  notificationErrorHandlers,
};

// =============================================================================
// Re-export from env.ts for convenience
// =============================================================================

export * from './env';
