# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frontend template for building applications with the Plyaz ecosystem. Provides a pre-configured Next.js application with `@plyaz/core`, `@plyaz/store`, and other Plyaz packages integrated out of the box.

**Architecture Note:** In development, this app uses Next.js API routes for backend operations. In production, all Plyaz apps connect to a NestJS backend microservice - the frontend configuration simply points to the external API URL instead of `/api`.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix linting issues
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm format       # Format code with Prettier
pnpm type:check   # TypeScript type checking
```

---

## Core Architecture

This app uses `@plyaz/core` as the central orchestrator for all services.

### Core Initialization

```typescript
import { Core } from '@plyaz/core';

const core = await Core.initialize(config);

// Access core services after initialization
Core.db           // Database service
Core.api          // API client service
Core.cache        // Cache service
Core.storage      // Storage service
Core.notifications // Notification service
Core.observability // Observability adapter
Core.isInitialized // Boolean flag
```

### Core Entry Points

| Entry Point | Purpose | Use Case |
|-------------|---------|----------|
| `@plyaz/core` | Full universal access | Most cases |
| `@plyaz/core/backend` | Backend-only (DB, Cache, Storage) | Node.js, API routes |
| `@plyaz/core/frontend` | Frontend-only (no DB) | React, browser |
| `@plyaz/core/server` | Server utilities | Next.js API routes |
| `@plyaz/core/utils` | Utility functions | Common operations |

---

## Domain Services

### Base Domain Service Classes

Domain services extend base classes that provide common functionality:

**BaseDomainService** (Universal - Frontend + Backend):
```typescript
import { BaseDomainService } from '@plyaz/core';

class MyService extends BaseDomainService<TConfig, TMapper, TValidator> {
  // Inherited properties
  config          // Service configuration
  logger          // PackageLogger instance
  apiClient       // Lazy-loaded API client
  cacheManager    // Injected cache (if available)
  dbService       // Injected database (if available)

  // Inherited methods
  isAvailable(): boolean
  getConfig(): TConfig
  ensureApiClientInitialized(): Promise<void>
  assertAvailable(), assertEnabled(), assertReady()

  // Observability
  recordMetric(name, value, tags)
  incrementCounter(name, value, tags)
  startSpan(name, attributes)
  withSpan(name, fn, attributes)
}
```

**BaseBackendDomainService** (Server-side):
```typescript
import { BaseBackendDomainService } from '@plyaz/core/backend';

class MyBackendService extends BaseBackendDomainService<
  TConfig, TEntity, TResponseDTO, TCreateDTO, TUpdateDTO,
  TPatchDTO, TQueryDTO, TDeleteOptions, TRepository,
  TDatabaseRow, TMapper, TValidator
> {
  protected abstract repository: TRepository;
  protected abstract eventPrefix: string;

  // CRUD Methods (all with hooks, events, caching)
  create(data, options?)
  patch(id, data, options?)
  delete(id, deleteOptions?, crudOptions?)
  getById(id, options?)
  getAll(query?, options?)
  exists(id, options?)
  bulkCreate(dataArray, options?)
  bulkDelete(ids, deleteOptions?, crudOptions?)

  // Transaction Support
  withTransaction(fn, options?)
  supportsTransactions: boolean

  // Cache Methods
  cacheGet<T>(key)
  cacheSet<T>(key, value, ttl?)
  cacheDelete(key)
  cacheClear()
  hasCacheManager: boolean

  // Event Methods
  emitEvent<T>(event, payload)
  emitStreamEvent(channel, event, data)
  emitEntityStreamEvent(type, id, event, data)

  // File Operations (if StorageService injected)
  uploadFile(params)
  uploadFiles(files, options?)
  generateFile(params)
  hasStorage: boolean

  // Email Operations (if NotificationService injected)
  sendEmail(params)
  hasNotifications: boolean

  // Lifecycle Hooks (override in subclass)
  beforeCreate(data), afterCreate(entity)
  beforePatch(id, data), afterPatch(id, entity)
  beforeDelete(id, options), afterDelete(id, options)
  beforeGetAll(query), afterGetAll(entities, query)
  beforeUploadFile(params), afterUploadFile(result)
  beforeSendEmail(params), afterSendEmail(result)
}
```

**BaseFrontendDomainService** (Client-side):
```typescript
import { BaseFrontendDomainService } from '@plyaz/core/frontend';

class MyFrontendService extends BaseFrontendDomainService<
  TConfig, TStore, TStoreData, TEntity,
  TResponseDTO, TCreateDTO, TPatchDTO, TQueryDTO,
  TStoreState, TMapper, TValidator
> {
  protected eventPrefix = 'myDomain';

  // CRUD Methods (via HTTP API)
  fetchAll(query?)
  fetchById(id)
  create(data)
  update(id, data)
  delete(id)

  // Store Management
  primaryStore
  getReadStore(key)
  syncToStores(data, options?)
  setStoresLoading(loading)
}
```

### Service Registration

**Backend (server.ts):**
```typescript
import { Core } from '@plyaz/core';
import { BackendExampleDomainService, BackendFilesDomainService } from '@plyaz/core';

await Core.initialize({
  services: [
    { service: BackendExampleDomainService, config: { enabled: true } },
    { service: BackendFilesDomainService, config: { enabled: true } },
    { service: MyCustomBackendService, config: { enabled: true, customOption: 'value' } },
  ],
  // ... other config
});
```

**Frontend (plyaz.frontend.ts):**
```typescript
import { FrontendExampleDomainService, FrontendFilesDomainService } from '@plyaz/core/frontend';

const frontendConfig = {
  services: [
    { service: FrontendExampleDomainService, config: { enabled: true } },
    { service: FrontendFilesDomainService, config: { enabled: true } },
    { service: MyCustomFrontendService, config: { enabled: true } },
  ],
  // ... other config
};
```

### Service Resolution

```typescript
import { ServiceRegistry } from '@plyaz/core';

// Get service by key (auto-registered with lowercase class name prefix)
const exampleService = ServiceRegistry.get<BackendExampleDomainService>('example');
const filesService = ServiceRegistry.get<BackendFilesDomainService>('files');
const myService = ServiceRegistry.get<MyCustomService>('mycustom');

// Check if service exists
ServiceRegistry.has('example');

// Get all services
ServiceRegistry.getAll();
```

### Domain Services in This Codebase

| Service | Backend | Frontend |
|---------|---------|----------|
| Example | `BackendExampleDomainService` | `FrontendExampleDomainService` |
| Files | `BackendFilesDomainService` | `FrontendFilesDomainService` |
| Notifications | `BackendNotificationsDomainService` | `FrontendNotificationsDomainService` |

---

## Configuration

### Three-Layer Configuration Pattern

**1. `plyaz.shared.ts`** - Shared by both frontend and backend:
```typescript
export const sharedConfig = {
  environment: env.nodeEnv,
  appContext: 'editor',
  verbose: !env.isProd,

  api: {
    baseUrl: '/api',
    timeout: 120000,
    retry: { maxRetries: 3 },
  },

  featureFlags: {
    provider: 'memory',
    defaults: { DARK_MODE: false, BETA_FEATURES: false },
  },

  errorHandler: {
    maxErrors: 100,
    includeStackTrace: !env.isProd,
  },

  logger: {
    level: env.isProd ? 'info' : 'debug',
    transport: env.isProd ? 'pino' : 'console',
  },

  // Event handlers
  events: {
    api: { onRequest, onResponse, onError },
    cache: { onHit, onMiss, onSet },
    storage: { onFileUploaded, onUploadProgress },
    notifications: { onSent, onFailed },
  },
};
```

**2. `plyaz.frontend.ts`** - Client-only:
```typescript
import { sharedConfig } from './plyaz.shared';

export const frontendConfig = {
  ...sharedConfig,

  services: [
    { service: FrontendExampleDomainService, config: { enabled: true } },
    { service: FrontendFilesDomainService, config: { enabled: true } },
    { service: FrontendNotificationsDomainService, config: { enabled: true } },
  ],

  streaming: {
    enabled: true,
    endpoint: '/api/events/stream',
    channels: ['uploads', 'downloads', 'generations', 'system', 'notifications'],
    reconnect: { enabled: true, maxAttempts: 10, delay: 1000 },
  },

  store: {
    persist: false,
    devtools: !env.isProd,
  },
};
```

**3. `plyaz.backend.ts`** - Server-only (Next.js API routes):
```typescript
import { sharedConfig } from './plyaz.shared';

export const backendConfig = {
  ...sharedConfig,

  services: [
    { service: BackendExampleDomainService, config: { enabled: true } },
    { service: BackendFilesDomainService, config: { enabled: true } },
    { service: BackendNotificationsDomainService, config: { enabled: true } },
  ],

  db: hasDatabase() ? {
    adapter: 'drizzle',
    connectionString: env.databaseUrl,
  } : undefined,

  cache: {
    strategy: hasRedis() ? 'redis' : 'memory',
    redis: hasRedis() ? { url: env.redisUrl } : undefined,
  },

  storage: {
    adapters: [
      hasSupabaseStorage() && new SupabaseStorageAdapter({ ... }),
      hasCloudflareR2() && new CloudflareR2Adapter({ ... }),
    ].filter(Boolean),
  },

  notifications: {
    adapters: [
      hasInfobip() && new InfobipEmailAdapter({ ... }),
      hasSendGrid() && new SendGridAdapter({ ... }),
    ].filter(Boolean),
  },

  streaming: {
    enabled: true,
    server: { heartbeatInterval: 15000 },
    endpoints: [
      { endpoint: FilesStreamEndpoint, config: { channels: ['uploads', 'downloads'] } },
      { endpoint: NotificationsStreamEndpoint, config: { channels: ['notifications'] } },
      { endpoint: SystemStreamEndpoint, config: { channels: ['system'] } },
    ],
  },
};
```

### Environment Variables (`src/config/env.ts`)

```typescript
import { env, hasSupabaseStorage, hasInfobip } from '@/config/env';

// Service availability checks
hasDatabase()        // DATABASE_URL set
hasRedis()           // REDIS_URL set
hasEncryption()      // ENCRYPTION_KEY set
hasSupabaseStorage() // SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
hasCloudflareR2()    // CLOUDFLARE_ACCOUNT_ID + R2 keys
hasInfobip()         // INFOBIP_API_KEY + INFOBIP_BASE_URL
hasSendGrid()        // SENDGRID_API_KEY
hasDatadog()         // DATADOG_API_KEY
hasVirusTotal()      // VIRUSTOTAL_API_KEY
hasClamAV()          // CLAMAV_HOST
```

---

## Core Utilities

### HMR-Safe Singleton (for Next.js)

```typescript
import { createHmrSafeSingleton } from '@plyaz/core/utils';

const coreAccessor = createHmrSafeSingleton('editor-core', async () => {
  return await Core.initialize(backendConfig);
});

// Usage
const core = await coreAccessor();
const isInit = coreAccessor.isInitialized();
await coreAccessor.reset();
```

### Event System

```typescript
import { CoreEventManager, CORE_EVENTS } from '@plyaz/core';

// Emit events
CoreEventManager.emit(CORE_EVENTS.SYSTEM.INITIALIZED, { });
CoreEventManager.emit('custom:event', { data: 'value' });

// Subscribe to events
const unsubscribe = CoreEventManager.on(CORE_EVENTS.API.REQUEST_START, (event) => {
  console.log(event.data);
});

// Event categories
CORE_EVENTS.SYSTEM.*      // system:initialized, system:ready, system:error
CORE_EVENTS.API.*         // api:request_start, api:request_success, api:request_error
CORE_EVENTS.CACHE.*       // cache:hit, cache:miss, cache:set
CORE_EVENTS.AUTH.*        // auth:login, auth:logout
CORE_EVENTS.ENTITY.*      // entity:created, entity:updated, entity:deleted
CORE_EVENTS.FEATURE_FLAG.* // featureFlag:evaluated, featureFlag:changed
```

### API Route Helper

```typescript
import { createNextApiRoute } from '@plyaz/core/server';

export const { GET, POST, PATCH, DELETE } = createNextApiRoute<MyService>({
  service: 'myservice',
  getCore: getServerCore,
  errorSource: 'myservice-api',
  successMessage: 'Operation successful',
  handlers: {
    GET: async (service, { query, params }) => service.getAll(query),
    POST: async (service, { body }) => service.create(body),
    PATCH: async (service, { params, body }) => service.patch(params.id, body),
    DELETE: async (service, { params }) => service.delete(params.id),
  },
});
```

### Mapper & Validator Base Classes

```typescript
import { BaseMapper, BaseValidator } from '@plyaz/core';

class MyMapper extends BaseMapper<TEntity, TDTO, TCreate, TUpdate, TPatch> {
  toDomain(dto: TDTO): TEntity { }
  toDTO(entity: TEntity): TDTO { }
  toCreateDTO(entity: Partial<TEntity>): TCreate { }
  toResponseDTO(row: DatabaseRow): TDTO { }
}

class MyValidator extends BaseValidator<TCreate, TUpdate, TPatch, TDelete> {
  validateCreateOrThrow(data: unknown): TCreate { }
  validatePatchOrThrow(data: unknown): TPatch { }
}
```

### Common Utilities

```typescript
import { generateId, mapArray, mapPaginated } from '@plyaz/core/utils';

const id = generateId();
const mapped = mapArray(items, (item) => transform(item));
const paginated = mapPaginated(result, (item) => transform(item));
```

---

## Streaming Architecture

### Stream Endpoints

```typescript
streaming: {
  enabled: true,
  server: { heartbeatInterval: 15000 },
  endpoints: [
    { endpoint: FilesStreamEndpoint, config: { channels: ['uploads', 'downloads', 'generations'] } },
    { endpoint: NotificationsStreamEndpoint, config: { channels: ['notifications'] } },
    { endpoint: SystemStreamEndpoint, config: { channels: ['system'] } },
  ],
}
```

### Channel Patterns

| Channel | Description |
|---------|-------------|
| `uploads` | All upload progress |
| `upload:{fileId}` | Per-file upload |
| `downloads` | All download progress |
| `download:{fileId}` | Per-file download |
| `generations` | Document generation |
| `notifications` | All notifications |
| `system` | System events |

### Event Emission

```typescript
// From domain service
this.emitStreamEvent('uploads', 'progress', {
  fileId: 'abc123',
  percentage: 50,
  status: 'uploading',
});

// Or via CoreEventManager
CoreEventManager.emit('upload:progress', { fileId, percentage });
```

### Client-Side Streaming Hooks

```typescript
import {
  useStreamConnected,
  useStreamMessages,
  useStreamConnectionId,
  useStreamSubscribedChannels,
} from '@plyaz/store';

const isConnected = useStreamConnected();
const messages = useStreamMessages();
```

---

## Store Integration

### Available Hooks

```typescript
// File operations
import { useFileUpload, useFileDownload, useAllFileProgress } from '@plyaz/store';
import { useUploadProgress, useDownloadProgress } from '@plyaz/store';
import { useHasActiveUploads, useActiveUploadCount } from '@plyaz/store';

// Stores
import { useFilesStore, useNotificationsStore } from '@plyaz/store';
import { useErrors, useErrorCount, useHasErrors } from '@plyaz/store';
import { useFeatureFlags, useFeatureFlagsInitialized } from '@plyaz/store';

// Events
import { useEvents } from '@plyaz/store';

// Core
import { usePlyaz, usePlyazReady, useService } from '@plyaz/core/frontend';
```

### Provider Stack

```typescript
<NextIntlClientProvider messages={messages} locale={locale}>
  <TranslationProvider config={translationConfig}>
    <PlyazProvider
      store={useRootStore}
      config={frontendConfig}
      onReady={(services) => console.info('Ready:', services.getServiceKeys())}
    >
      {children}
    </PlyazProvider>
  </TranslationProvider>
</NextIntlClientProvider>
```

---

## Next.js API Routes (Development)

In development, Next.js API routes serve as the backend. In production, these are replaced by the NestJS microservice.

### API Route Reference

| Method | Path | Service | Description |
|--------|------|---------|-------------|
| GET/POST | `/api/examples` | Example | List / Create |
| GET/PATCH/DELETE | `/api/examples/:id` | Example | Get / Update / Delete |
| POST/DELETE | `/api/examples/bulk` | Example | Bulk operations |
| POST | `/api/upload` | Files | Single upload |
| POST | `/api/upload/bulk` | Files | Bulk upload |
| GET | `/api/files` | Files | List files |
| GET/DELETE | `/api/files/:id` | Files | Get / Delete |
| GET | `/api/files/:id/download` | Files | Download |
| GET | `/api/files/:id/signed-url` | Files | Signed URL |
| POST | `/api/generate-document` | Files | Generate without upload |
| GET | `/api/notifications` | Notifications | List |
| DELETE | `/api/notifications/:id` | Notifications | Delete |
| GET | `/api/events/stream` | Streaming | SSE endpoint |

---

## Production Architecture

In production, Plyaz apps connect to a **NestJS backend microservice**.

### Configuration Difference

**Development:**
```typescript
api: { baseUrl: '/api' }
streaming: { endpoint: '/api/events/stream' }
```

**Production:**
```typescript
api: { baseUrl: env.apiBaseUrl }  // e.g., 'https://api.plyaz.com'
streaming: { endpoint: env.streamingUrl }
```

### What Changes

| Aspect | Development | Production |
|--------|-------------|------------|
| API Routes | Next.js `/api/*` | NestJS microservice |
| Streaming | Local SSE | External SSE endpoint |
| Backend Services | Local (same process) | Remote (HTTP) |
| Database | Direct connection | Via microservice |

---

## Path Aliases

```
@/*           → ./src/*
@/components  → ./src/components
@/types       → ./src/types
@/constants   → ./src/constants
@/actions     → ./src/app/actions
@/utils       → ./src/utils
@/providers   → ./src/providers
@/icons       → ./src/components/icons
```

## Key Files Reference

| Category | Files |
|----------|-------|
| Core initialization | `src/core/server.ts` |
| Configuration | `src/config/plyaz.*.ts`, `src/config/env.ts` |
| API routes | `src/app/api/**/*.ts` |
| Streaming | `src/app/api/events/stream/route.ts` |
| Providers | `src/components/Providers.tsx` |
| Example usage | `src/app/[locale]/example/client.tsx` |

## Plyaz Package Dependencies

- `@plyaz/core` - Core provider, services, streaming
- `@plyaz/store` - Zustand state management and hooks
- `@plyaz/storage` - (linked) Document generation
- `@plyaz/notifications` - (linked) Email, SMS, push
- `@plyaz/translations` - i18n utilities
- `@plyaz/types` - Shared TypeScript types
- `@plyaz/ui` - Component library
- `@plyaz/errors` - Error handling
- `@plyaz/logger` - Logging utilities
- `@plyaz/devtools` - Shared configs

## Requirements

- Node.js ≥22.4.0
- pnpm ≥8.0.0
