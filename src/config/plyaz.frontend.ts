'use client';

/**
 * Frontend Plyaz Configuration
 *
 * Configuration for client-side PlyazProvider.
 * Contains React-dependent services that cannot be imported in server components.
 */

import type { CorePlyazConfig } from '@plyaz/types/core';
import {
  FrontendExampleDomainService,
  FrontendFilesDomainService,
  FrontendNotificationsDomainService,
} from '@plyaz/core/frontend';

import { frontendBaseConfig } from './plyaz.shared';

/**
 * Frontend config for PlyazProvider
 * Extends base config with React-dependent domain services
 */
export const frontendConfig: CorePlyazConfig = {
  ...frontendBaseConfig,

  // Domain Services (React-dependent, client-only)
  // Note: apiBasePath must be explicitly set because api.baseURL defaults to '' for same-origin
  // Store key is auto-resolved from service.defaultStoreKey
  services: [
    { service: FrontendExampleDomainService, config: { enabled: true } },
    { service: FrontendFilesDomainService, config: { enabled: true } },
    { service: FrontendNotificationsDomainService, config: { enabled: true } },
  ],

  // Streaming (SSE real-time events)
  // Enables upload progress, generation progress, and system events
  streaming: {
    enabled: true,
    endpoint: '/api/events/stream',
    channels: ['uploads', 'downloads', 'generations', 'system', 'notifications'],
    reconnect: {
      enabled: true,
      maxAttempts: 10,
      delay: 1000,
    },
  },
};
