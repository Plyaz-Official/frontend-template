/**
 * Environment Configuration
 *
 * Centralized environment variable handling for the editor.
 * Works in both browser and Node.js environments.
 */

// =============================================================================
// Environment Variable Getter
// =============================================================================

/**
 * Get an environment variable with optional default value.
 * Works in both browser (NEXT_PUBLIC_*) and server environments.
 */
// =============================================================================
// Logger (using @plyaz/logger)
// =============================================================================

import { PackageLogger } from '@plyaz/logger';

export const getEnv = (key: string, defaultValue?: string): string | undefined =>
  globalThis.process?.env?.[key] ?? defaultValue;

// =============================================================================
// Environment Variables
// =============================================================================

export const env = {
  // Public (available in browser)
  // Default to empty string for same-origin API calls (Next.js API routes)
  apiUrl: getEnv('NEXT_PUBLIC_API_URL', ''),
  apiKey: getEnv('NEXT_PUBLIC_API_KEY'),
  appUrl: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),

  // Environment
  nodeEnv: getEnv('NODE_ENV', 'development') as 'development' | 'staging' | 'production',
  isDev: getEnv('NODE_ENV') !== 'production',
  isProd: getEnv('NODE_ENV') === 'production',

  // Backend only (not available in browser)
  encryptionKey: getEnv('ENCRYPTION_KEY'),
  redisUrl: getEnv('REDIS_URL'),
  redisHost: getEnv('REDIS_HOST'),
  redisPort: getEnv('REDIS_PORT'),
  redisPassword: getEnv('REDIS_PASSWORD'),
  databaseUrl: getEnv('DATABASE_URL'),

  // Storage - Cloudflare R2
  cloudflareAccountId: getEnv('CLOUDFLARE_ACCOUNT_ID') ?? getEnv('R2_ACCOUNT_ID'),
  r2AccessKeyId: getEnv('R2_ACCESS_KEY_ID'),
  r2SecretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
  r2BucketName: getEnv('R2_BUCKET_NAME', 'plyaz-compliance'),
  r2Region: getEnv('R2_REGION', 'auto'),
  r2Endpoint: getEnv('R2_ENDPOINT'),
  r2PublicDomain: getEnv('R2_PUBLIC_DOMAIN'),
  r2WebhookSecret: getEnv('R2_WEBHOOK_SECRET'),

  // Storage - Supabase
  supabaseUrl: getEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseAnonKey: getEnv('SUPABASE_ANON_PUBLIC_KEY'),
  supabaseStorageBucket: getEnv('SUPABASE_STORAGE_BUCKET', 'media'),
  supabasePublicUrl: getEnv('SUPABASE_PUBLIC_URL'),
  supabaseWebhookSecret: getEnv('SUPABASE_WEBHOOK_SECRET'),

  // Notifications - Infobip
  infobipApiKey: getEnv('INFOBIP_API_KEY'),
  infobipBaseUrl: getEnv('INFOBIP_BASE_URL', 'https://api.infobip.com'),
  infobipFromEmail: getEnv('INFOBIP_FROM_EMAIL'),
  infobipWebhookSecret: getEnv('INFOBIP_WEBHOOK_SECRET'),

  // Notifications - SendGrid
  sendgridApiKey: getEnv('SENDGRID_API_KEY'),
  sendgridFromEmail: getEnv('SENDGRID_FROM_EMAIL'),
  sendgridFromName: getEnv('SENDGRID_FROM_NAME'),
  sendgridWebhookSecret: getEnv('SENDGRID_WEBHOOK_SECRET'),
  sendgridWebhookPublicKey: getEnv('SENDGRID_WEBHOOK_PUBLIC_KEY'),

  // Notifications - Common
  fromEmail: getEnv('FROM_EMAIL', 'noreply@plyaz.com'),
  fromName: getEnv('FROM_NAME', 'Plyaz'),
  tokenSecret: getEnv('TOKEN_SECRET'),
  baseUrl: getEnv('BASE_URL') ?? getEnv('APP_URL'),

  // Security - Virus Scanning
  virusTotalApiKey: getEnv('VIRUSTOTAL_API_KEY'),
  clamavHost: getEnv('CLAMAV_HOST'),
  clamavPort: getEnv('CLAMAV_PORT'),

  // CDN - Cloudflare
  cloudflareZoneId: getEnv('CLOUDFLARE_ZONE_ID'),
  cloudflareApiToken: getEnv('CLOUDFLARE_API_TOKEN'),

  // CDN - CloudFront
  cloudfrontDistributionId: getEnv('CLOUDFRONT_DISTRIBUTION_ID'),
  awsAccessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),

  // CDN - Fastly
  fastlyServiceId: getEnv('FASTLY_SERVICE_ID'),
  fastlyApiToken: getEnv('FASTLY_API_TOKEN'),

  // Observability
  datadogApiKey: getEnv('DD_API_KEY'),
  datadogSite: getEnv('DD_SITE', 'datadoghq.com'),

  // Testing
  testEmailTo: getEnv('TEST_EMAIL_TO'),
  testLocale: getEnv('TEST_LOCALE', 'en'),

  // Debug Flags
  // Set to 'true' to enable comprehensive API debug reports
  apiDebugReport: getEnv('API_DEBUG_REPORT', 'false') === 'true',
  // Set to 'true' to enable verbose API logging
  apiVerbose: getEnv('API_VERBOSE', 'false') === 'true',
} as const;

// =============================================================================
// Service Availability Checks
// =============================================================================

/** Check if encryption key is configured */
export const hasEncryption = (): boolean => !!env.encryptionKey;

/** Check if Redis is configured */
export const hasRedis = (): boolean => !!env.redisUrl;

/** Check if database is configured */
export const hasDatabase = (): boolean => !!env.databaseUrl;

/** Check if Supabase storage is configured */
export const hasSupabaseStorage = (): boolean => !!env.supabaseUrl && !!env.supabaseServiceRoleKey;

/** Check if Cloudflare R2 is configured */
export const hasCloudflareR2 = (): boolean =>
  !!env.cloudflareAccountId && !!env.r2AccessKeyId && !!env.r2SecretAccessKey;

/** Check if Infobip is configured */
export const hasInfobip = (): boolean => !!env.infobipApiKey;

/** Check if SendGrid is configured */
export const hasSendGrid = (): boolean => !!env.sendgridApiKey;

/** Check if VirusTotal is configured */
export const hasVirusTotal = (): boolean => !!env.virusTotalApiKey;

/** Check if ClamAV is configured */
export const hasClamAV = (): boolean => !!env.clamavHost;

/** Check if Datadog is configured */
export const hasDatadog = (): boolean => !!env.datadogApiKey;

/** Check if any storage provider is configured */
export const hasStorage = (): boolean => hasSupabaseStorage() || hasCloudflareR2();

/** Check if any notification provider is configured */
export const hasNotifications = (): boolean => hasInfobip() || hasSendGrid();

export const log = new PackageLogger({ packageName: 'editor' });
