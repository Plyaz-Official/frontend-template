/**
 * Core Module
 *
 * Re-exports for convenient importing.
 */

// Server-side Core initialization
export {
  getServerCore,
  resetServerCore,
  isServerCoreInitialized,
  getExampleService,
  ServiceRegistry,
  BackendExampleDomainService,
} from './server';
