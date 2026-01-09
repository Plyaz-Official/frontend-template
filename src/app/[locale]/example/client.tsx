'use client';

/**
 * Example Client Component using FrontendExampleDomainService
 *
 * Demonstrates how to use domain services and hooks from PlyazProvider.
 * Tests ALL API endpoints via the frontend service.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  usePlyaz,
  usePlyazReady,
  useService,
  useEvents,
  // New file hooks from core
  useFileUpload,
  useFileDownload,
  useFile,
  useFileDelete,
  useAllFileProgress,
  type FrontendExampleDomainService,
  type FrontendFilesDomainService,
  type FrontendNotificationsDomainService,
} from '@plyaz/core/frontend';
import {
  // Files hooks
  useFilesStore,
  useFilesUploading,
  useFilesGenerating,
  useUploadProgress,
  useOverallUploadProgress,
  useHasActiveUploads,
  useActiveUploadCount,
  // Download progress hooks
  useDownloadProgress,
  useOverallDownloadProgress,
  useHasActiveDownloads,
  useActiveDownloadCount,
  // Errors hooks
  useErrors,
  useErrorCount,
  useActiveErrorCount,
  useHasErrors,
  useLastError,
  // Feature flags hooks
  useFeatureFlags,
  useFeatureFlagsInitialized,
  useFeatureFlagsLoading,
  // Example hooks
  useExampleItems,
  useExamplesLoading,
  useSelectedExampleId,
  // Stream hooks
  useStreamConnected,
  useStreamConnectionId,
  useStreamTransport,
  useStreamSubscribedChannels,
  useStreamMessages,
  useStreamReconnectAttempts,
  useStreamConnectionError,
  // Notifications hooks
  useNotificationsStore,
  useNotifications,
} from '@plyaz/store';
import type { ExampleEntity } from '@plyaz/types/examples';
import {
  DOCUMENT_TYPE,
  FILE_CATEGORY,
  ENTITY_TYPE,
  FILE_ACCESS_LEVEL,
  OUTPUT_FORMAT,
  STORAGE_ADAPTER_TYPE,
  STORAGE_DEVICE_TYPE,
  STORAGE_QUEUE_PRIORITY,
  STORAGE_ENVIRONMENT,
  BUSINESS_MODEL,
  ORGANIZATION_TIER,
  MEDIA_ENTITY,
  STORAGE_VISIBILITY,
  STORAGE_VARIANT_NAME,
} from '@plyaz/types/storage';
import {
  base64ToBlob,
  downloadBlob,
  generateUniqueFilename,
  inferExtensionFromMimeType,
} from '@plyaz/core/utils';
import { GenericError } from '@plyaz/errors';
import { ERROR_CODES } from '@plyaz/types/errors';

import { log } from '@/config/env';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const JSON_INDENT = 2;
const ID_TRUNCATE_LENGTH = 8;
const ISO_DATE_LENGTH = 19;
const PERCENTAGE_FULL = 100;
const BYTES_PER_KB = 1024;
const MS_PER_SECOND = 1000;
const TIMEOUT_MS_2S = 2000;
const TIMEOUT_MS_5S = 5000;
const DAYS_PER_MONTH = 30;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const SCALE_PDF_MIN = 0.1;
const SCALE_PDF_MAX = 1.1;
const SCALE_PDF_DEFAULT = 0.3;
const RECENT_MESSAGES_SLICE = 5;
const MAX_DISPLAY_CHARS = 12;
const TRUNCATE_START = 20;
const TRUNCATE_END = 17;
const DEFAULT_PAGE_LIMIT = 10;
const BATCH_SIZE_2 = 2;
const BATCH_SIZE_3 = 3;
const CHART_DIMENSION = 50;
const RECENT_EVENTS_LIMIT = 19;
const EVENT_LOG_LIMIT = 49;
const KB_10 = DEFAULT_PAGE_LIMIT * BYTES_PER_KB;
const FILE_SIZE_10_MB = DEFAULT_PAGE_LIMIT * BYTES_PER_KB * BYTES_PER_KB;
const FILE_SIZE_25_MB = (TRUNCATE_START + RECENT_MESSAGES_SLICE) * BYTES_PER_KB * BYTES_PER_KB;
const FILE_SIZE_50_MB = CHART_DIMENSION * BYTES_PER_KB * BYTES_PER_KB;

interface ExampleClientComponentProps {
  initialData: {
    timestamp: string;
    appContext: string;
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DataViewer Component - Toggle between JSON and Table views
// ─────────────────────────────────────────────────────────────────────────────

type ViewMode = 'json' | 'table';

interface DataViewerProps {
  data: unknown;
  title?: string;
  defaultView?: ViewMode;
  maxHeight?: string;
  className?: string;
}

function DataViewer({
  data,
  title,
  defaultView = 'json',
  maxHeight = '300px',
  className = '',
}: DataViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Get columns from first object if data is an array of objects
  const columns = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const firstItem = data[0];
    if (typeof firstItem !== 'object' || firstItem === null) return [];
    return Object.keys(firstItem);
  }, [data]);

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Check if data can be displayed as a table
  const canShowTable = Array.isArray(data) && columns.length > 0;

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header with title and view toggle */}
      <div className='flex items-center justify-between bg-gray-50 px-3 py-2 border-b'>
        {title && <span className='text-xs font-medium text-gray-700'>{title}</span>}
        <div className='flex gap-1 ml-auto'>
          <button
            onClick={() => setViewMode('json')}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              viewMode === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            JSON
          </button>
          {canShowTable && (
            <button
              onClick={() => setViewMode('table')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Table
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='overflow-auto' style={{ maxHeight }}>
        {viewMode === 'json' || !canShowTable ? (
          <pre className='text-xs p-3 bg-gray-900 text-gray-100 m-0'>
            {JSON.stringify(data, null, JSON_INDENT)}
          </pre>
        ) : (
          <table className='w-full text-xs'>
            <thead className='bg-gray-100 sticky top-0'>
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    className='px-2 py-1.5 text-left font-medium text-gray-700 border-b'
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data as Record<string, unknown>[]).map((row, idx) => (
                <tr key={idx} className='hover:bg-gray-50 border-b last:border-b-0'>
                  {columns.map(col => (
                    <td key={col} className='px-2 py-1.5 text-gray-600 truncate max-w-[200px]'>
                      {formatCellValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FileActionButton - Button with inline progress and download
// Uses useFileDownload and useAllFileProgress from @plyaz/core
// ─────────────────────────────────────────────────────────────────────────────

interface UploadResult {
  // API returns 'key' or 'id', not 'fileId'
  fileId?: string;
  id?: string;
  key?: string;
  filename?: string;
  path?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  // For generate-only results
  buffer?: ArrayBuffer;
  base64?: string;
}

interface FileActionButtonProps {
  label: string;
  color?: 'purple' | 'pink' | 'indigo' | 'emerald' | 'blue' | 'green';
  disabled?: boolean;
  /** onAction receives an operationId that should be used as entityId for progress tracking */
  onAction: (operationId: string) => Promise<UploadResult | UploadResult[] | unknown>;
  actionType?: 'upload' | 'generate' | 'bulk';
}

/**
 * FileActionButton - A button that shows upload/generate progress inline
 * and provides download functionality for completed files.
 *
 * Uses useFileDownload hook from @plyaz/core for download operations.
 * Uses useAllFileProgress hook for unified progress tracking.
 */
function FileActionButton({
  label,
  color = 'purple',
  disabled,
  onAction,
  actionType = 'upload',
}: FileActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [trackingIds, setTrackingIds] = useState<string[]>([]);

  // Use useFileDownload hook for download operations
  const { download, currentFileId: downloadingId } = useFileDownload();

  // Use useAllFileProgress for unified progress tracking with filtering
  // Always filter by trackingIds - never show all progress items
  const { items: progressItems } = useAllFileProgress({
    filterByIds: trackingIds.length > 0 ? trackingIds : ['__no_match__'],
    includeCompleted: false,
    includeFailed: true,
    types:
      actionType === 'generate'
        ? ['generate']
        : actionType === 'bulk'
          ? ['upload']
          : ['upload', 'generate'],
  });

  const handleClick = useCallback(async () => {
    // Generate operationId FIRST so we can filter progress by it immediately
    const operationId = crypto.randomUUID();
    setTrackingIds([operationId]);
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const result = await onAction(operationId);

      // Helper to check if an object is a valid upload result
      const isUploadResult = (r: unknown): r is UploadResult => {
        if (!r || typeof r !== 'object') return false;
        const obj = r as Record<string, unknown>;
        return 'key' in obj || 'id' in obj || 'fileId' in obj || 'buffer' in obj || 'base64' in obj;
      };

      // Helper to normalize a single result (API uses 'key' not 'fileId')
      const normalizeResult = (r: unknown): UploadResult | null => {
        if (!r || typeof r !== 'object') return null;
        const obj = r as Record<string, unknown>;
        // Normalize key/id to fileId for consistent handling
        return {
          fileId: (obj.key as string) ?? (obj.id as string) ?? (obj.fileId as string),
          id: obj.id as string,
          key: obj.key as string,
          filename: obj.filename as string,
          mimeType: obj.mimeType as string,
          size: obj.size as number,
          url: obj.url as string,
          buffer: obj.buffer as ArrayBuffer,
          base64: obj.base64 as string,
        };
      };

      // Normalize result to array
      let uploadResults: UploadResult[] = [];
      // Unwrap if result is wrapped in { data: ... }
      const unwrappedResult =
        result &&
        typeof result === 'object' &&
        'data' in result &&
        !('key' in result) &&
        !('id' in result)
          ? (result as { data: unknown }).data
          : result;

      if (Array.isArray(unwrappedResult)) {
        uploadResults = unwrappedResult
          .map(normalizeResult)
          .filter((r): r is UploadResult => r !== null && isUploadResult(r));
      } else if (isUploadResult(unwrappedResult)) {
        const normalized = normalizeResult(unwrappedResult);
        if (normalized) uploadResults = [normalized];
      } else if (
        unwrappedResult &&
        typeof unwrappedResult === 'object' &&
        'results' in unwrappedResult
      ) {
        // Bulk upload returns { results: [{ index, success, data: UploadFileResponse }, ...] }
        const bulkResults = (
          unwrappedResult as { results: Array<{ success?: boolean; data?: unknown }> }
        ).results;
        uploadResults = bulkResults
          .filter(r => r.success !== false && r.data)
          .map(r => normalizeResult(r.data))
          .filter((r): r is UploadResult => r !== null && isUploadResult(r));
      }

      // Extract tracking IDs from results (only for storage uploads)
      const ids = uploadResults
        .filter(r => r.fileId ?? r.key)
        .map(r => {
          // Extract entityId from key pattern: entityType/entityId/category/filename
          const fileKey = r.key ?? r.fileId ?? '';
          const parts = fileKey.split('/');
          return parts.length >= BATCH_SIZE_2 ? parts[1] : fileKey;
        });
      setTrackingIds(ids);
      setResults(uploadResults);
    } catch (err) {
      log.error('[FileActionButton] Error in handleClick', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [onAction]);

  // Download handler using useFileDownload hook for stored files,
  // with fallback for generate-only results (buffer/base64)
  const handleDownload = useCallback(
    async (result: UploadResult) => {
      const fileKey = result.id ?? result.key ?? result.fileId;
      const mimeType = result.mimeType ?? 'application/octet-stream';

      try {
        if (fileKey) {
          // Use useFileDownload hook for stored files
          // Progress tracked via store, errors propagate to global handling
          await download(fileKey, { filename: result.filename });
        } else if (result.buffer) {
          // Direct buffer download (generate-only results not stored in backend)
          const blob = new Blob([result.buffer], { type: mimeType });
          const filename =
            result.filename ??
            generateUniqueFilename('generated', inferExtensionFromMimeType(mimeType));
          downloadBlob(blob, filename);
        } else if (result.base64) {
          // Base64 download (generate-only results not stored in backend)
          const blob = base64ToBlob(result.base64, mimeType);
          const filename =
            result.filename ??
            generateUniqueFilename('generated', inferExtensionFromMimeType(mimeType));
          downloadBlob(blob, filename);
        } else {
          throw new GenericError('No downloadable content', ERROR_CODES.STORAGE_FILE_NOT_FOUND);
        }
      } catch (err) {
        log.error('Download error', { error: err instanceof Error ? err.message : String(err) });
      }
    },
    [download]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setTrackingIds([]);
    setError(null);
  }, []);

  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    pink: 'bg-pink-600 hover:bg-pink-700 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <div className='space-y-2'>
      {/* Action Button */}
      <button
        onClick={handleClick}
        disabled={(disabled ?? false) || isLoading}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[color]}`}
      >
        {isLoading ? (
          <span className='flex items-center gap-2'>
            <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
                fill='none'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
            {actionType === 'generate' ? 'Generating...' : 'Uploading...'}
          </span>
        ) : (
          label
        )}
      </button>

      {/* Progress Bars - using useAllFileProgress */}
      {progressItems.length > 0 && (
        <div className='space-y-1'>
          {progressItems.map(item => (
            <div key={item.id} className='bg-gray-100 rounded p-2'>
              <div className='flex items-center justify-between text-xs mb-1'>
                <span className='text-gray-600 truncate max-w-[180px]' title={item.id}>
                  {item.filename ?? item.id.split('/').pop()}
                </span>
                <span
                  className={`font-medium ${item.percentage === PERCENTAGE_FULL ? 'text-green-600' : 'text-blue-600'}`}
                >
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
              <div className='h-1.5 bg-gray-300 rounded-full overflow-hidden'>
                <div
                  className={`h-full transition-all duration-200 ${
                    item.percentage === PERCENTAGE_FULL
                      ? 'bg-green-500'
                      : item.type === 'generate'
                        ? 'bg-pink-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700'>
          {error}
        </div>
      )}

      {/* Results with Download Buttons */}
      {results.length > 0 && (
        <div className='bg-green-50 border border-green-200 rounded p-2 space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-green-800'>
              {results.length} file{results.length > 1 ? 's' : ''} completed
            </span>
            <button onClick={clearResults} className='text-xs text-gray-500 hover:text-gray-700'>
              Clear
            </button>
          </div>
          {results.map((result, idx) => {
            const fileKey = result.key ?? result.fileId;
            const displayName =
              result.filename ??
              (fileKey ? fileKey.split('/').pop() : null) ??
              `generated-${idx + 1}`;
            const isGenerated = !fileKey && (result.buffer ?? result.base64);

            return (
              <div
                key={fileKey ?? idx}
                className='flex items-center justify-between bg-white rounded px-2 py-1.5'
              >
                <div className='flex items-center gap-1'>
                  {isGenerated && (
                    <span className='text-[10px] bg-pink-100 text-pink-700 px-1 rounded'>GEN</span>
                  )}
                  <span
                    className='text-xs text-gray-700 truncate max-w-[130px]'
                    title={fileKey ?? displayName}
                  >
                    {displayName}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  {result.size && (
                    <span className='text-[10px] text-gray-500'>
                      {(result.size / BYTES_PER_KB).toFixed(1)}KB
                    </span>
                  )}
                  {(() => {
                    const resultKey = result.id ?? result.key ?? result.fileId;
                    const isDownloading = downloadingId === resultKey;
                    return (
                      <button
                        onClick={() => handleDownload(result)}
                        disabled={isDownloading}
                        className={`text-xs text-white px-2 py-0.5 rounded flex items-center gap-1 ${
                          isDownloading
                            ? 'bg-blue-400 cursor-wait'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        {isDownloading ? (
                          <svg className='w-3 h-3 animate-spin' fill='none' viewBox='0 0 24 24'>
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            />
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            />
                          </svg>
                        ) : (
                          <svg
                            className='w-3 h-3'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                            />
                          </svg>
                        )}
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExampleClientComponent({ initialData }: ExampleClientComponentProps) {
  const { isReady, error: providerError } = usePlyaz();
  const isProviderReady = usePlyazReady();

  if (!isProviderReady) {
    return (
      <div className='bg-gray-100 border border-gray-300 rounded p-4 text-gray-700'>
        Loading Plyaz services...
      </div>
    );
  }

  if (providerError) {
    return (
      <div className='bg-red-50 border border-red-300 rounded p-4 text-red-700'>
        Error: {providerError.message}
      </div>
    );
  }

  return (
    <div className='bg-white border border-gray-300 rounded-lg p-6 shadow-sm'>
      <p className='mb-4 text-gray-800'>
        <strong className='text-gray-900'>Provider Ready:</strong>{' '}
        <span className={isReady ? 'text-green-600' : 'text-yellow-600'}>
          {isReady ? 'Yes' : 'No'}
        </span>
      </p>

      <div className='mb-4'>
        <DataViewer data={initialData} title='Initial Data from Server' maxHeight='120px' />
      </div>

      {/* All API Tests */}
      <ApiTestSuite />

      {/* Files API Tests */}
      <FilesApiTestSuite />

      {/* Notifications API Tests */}
      <NotificationsApiTestSuite />

      {/* Event System Demo */}
      <EventEmitterDemo />
    </div>
  );
}

/**
 * Comprehensive API Test Suite
 */
function ApiTestSuite() {
  const exampleService = useService<FrontendExampleDomainService>('example-frontend');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>('');

  // Form state for create/update
  const [formData, setFormData] = useState({
    name: 'Test Example',
    description: 'Created via UI test',
    amount: 100,
    is_visible: true,
  });
  const [targetId, setTargetId] = useState('');

  // Access example items from store for selection dropdown
  const exampleItems = useExampleItems();

  const runAction = useCallback(async (actionName: string, action: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    setLastAction(actionName);
    try {
      const res = await action();
      setResult(res);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err));
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  if (!exampleService) {
    return (
      <div className='bg-yellow-50 border border-yellow-300 rounded p-4 text-yellow-800'>
        Example service not available. Check PlyazProvider configuration.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Health Check */}
      <Section title='Health Check' color='emerald'>
        <p className='text-sm text-gray-600 mb-3'>
          GET /api/examples/health - Check if the service is running.
        </p>
        <Button
          onClick={() =>
            runAction('Health Check', async () => {
              const res = await fetch('/api/examples/health');
              return res.json();
            })
          }
          disabled={loading}
          color='emerald'
        >
          Check Health
        </Button>
      </Section>

      {/* Fetch Operations */}
      <Section title='Fetch Operations' color='blue'>
        <p className='text-sm text-gray-600 mb-3'>
          Uses FrontendExampleDomainService to fetch data via API. Returns mock data.
        </p>
        <div className='flex gap-2 flex-wrap'>
          <Button
            onClick={() => runAction('Fetch All', () => exampleService.fetchAll())}
            disabled={loading}
            color='blue'
          >
            Fetch All
          </Button>
          <Button
            onClick={() => runAction('Fetch Active', () => exampleService.getActiveExamples())}
            disabled={loading}
            color='green'
          >
            Fetch Active
          </Button>
          <Button
            onClick={() => runAction('Fetch Drafts', () => exampleService.getDraftExamples())}
            disabled={loading}
            color='yellow'
          >
            Fetch Drafts
          </Button>
          <Button
            onClick={() => runAction('Fetch Archived', () => exampleService.getArchivedExamples())}
            disabled={loading}
            color='gray'
          >
            Fetch Archived
          </Button>
        </div>
      </Section>

      {/* Single Entity Operations */}
      <Section title='Single Entity Operations' color='indigo'>
        <p className='text-sm text-gray-600 mb-3'>
          Operations on a single entity by ID. Uses service methods and direct API calls.
        </p>
        <div className='mb-3'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Target ID:</label>
          <div className='flex gap-2 items-center'>
            <input
              type='text'
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className='border border-gray-300 rounded px-3 py-2 w-80 font-mono text-sm text-gray-900 bg-white'
              placeholder='Enter UUID or select from list below'
            />
          </div>
          {/* Clickable list of examples from store */}
          {exampleItems.length > 0 ? (
            <div className='mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded bg-gray-50 p-2'>
              <div className='text-xs text-gray-500 mb-1'>
                Select from store ({exampleItems.length} items):
              </div>
              <div className='flex flex-wrap gap-1'>
                {exampleItems.map((item: ExampleEntity) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => setTargetId(item.id)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      targetId === item.id
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}
                    title={item.id}
                  >
                    {item.name || item.id.slice(0, ID_TRUNCATE_LENGTH)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className='mt-2 text-xs text-gray-400'>No examples in store. Fetch All first.</div>
          )}
        </div>
        <div className='flex gap-2 flex-wrap'>
          <Button
            onClick={() => runAction('Fetch by ID', () => exampleService.fetchById(targetId))}
            disabled={loading || !targetId}
            color='indigo'
          >
            Fetch by ID
          </Button>
          <Button
            onClick={() =>
              runAction('Check Exists', async () => {
                const res = await fetch(`/api/examples/exists/${targetId}`);
                return res.json();
              })
            }
            disabled={loading || !targetId}
            color='cyan'
          >
            Check Exists
          </Button>
          <Button
            onClick={() => runAction('Delete', () => exampleService.delete(targetId))}
            disabled={loading || !targetId}
            color='red'
          >
            Delete
          </Button>
        </div>
      </Section>

      {/* Create/Update Form */}
      <Section title='Create / Update' color='purple'>
        <p className='text-sm text-gray-600 mb-3'>
          Create new or update existing entities. Fill the form and click the action button.
        </p>
        <div className='grid grid-cols-2 gap-3 mb-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Name:</label>
            <input
              type='text'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className='border border-gray-300 rounded px-3 py-2 w-full text-gray-900 bg-white'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Amount:</label>
            <input
              type='number'
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              className='border border-gray-300 rounded px-3 py-2 w-full text-gray-900 bg-white'
            />
          </div>
          <div className='col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Description:</label>
            <input
              type='text'
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className='border border-gray-300 rounded px-3 py-2 w-full text-gray-900 bg-white'
            />
          </div>
          <div>
            <label className='flex items-center gap-2 text-sm font-medium text-gray-700'>
              <input
                type='checkbox'
                checked={formData.is_visible}
                onChange={e => setFormData({ ...formData, is_visible: e.target.checked })}
                className='rounded'
              />
              Visible
            </label>
          </div>
        </div>
        <div className='flex gap-2 flex-wrap'>
          <Button
            onClick={async () => {
              const result = await runAction('Create', () => exampleService.create(formData));
              // Auto-update targetId with newly created record's ID for easy follow-up operations
              if (result && typeof result === 'object' && 'id' in result) {
                setTargetId(result.id as string);
              }
            }}
            disabled={loading}
            color='purple'
          >
            Create New
          </Button>
          <Button
            onClick={() => runAction('Update', () => exampleService.update(targetId, formData))}
            disabled={loading || !targetId}
            color='orange'
          >
            Update{' '}
            {targetId ? `(ID: ${targetId.slice(0, ID_TRUNCATE_LENGTH)}...)` : '(select ID above)'}
          </Button>
        </div>
      </Section>

      {/* Bulk Operations */}
      <Section title='Bulk Operations' color='teal'>
        <p className='text-sm text-gray-600 mb-3'>
          POST/DELETE /api/examples/bulk - Create or delete multiple entities at once.
        </p>
        <div className='flex gap-2 flex-wrap'>
          <Button
            onClick={() =>
              runAction('Bulk Create', async () => {
                const items = [
                  { name: 'Bulk 1', description: 'First bulk item', amount: 10, is_visible: true },
                  { name: 'Bulk 2', description: 'Second bulk item', amount: 20, is_visible: true },
                  { name: 'Bulk 3', description: 'Third bulk item', amount: 30, is_visible: false },
                ];
                const res = await fetch('/api/examples/bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ items }),
                });
                return res.json();
              })
            }
            disabled={loading}
            color='teal'
          >
            Bulk Create (3 items)
          </Button>
          <Button
            onClick={() =>
              runAction('Bulk Delete', async () => {
                const res = await fetch('/api/examples/bulk', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: ['1', '2', '3'], soft: true }),
                });
                return res.json();
              })
            }
            disabled={loading}
            color='rose'
          >
            Bulk Delete (IDs: 1,2,3)
          </Button>
        </div>
      </Section>

      {/* Polling Demo */}
      <PollingDemoSection exampleService={exampleService} />

      {/* Service Lifecycle */}
      <ServiceLifecycleSection exampleService={exampleService} />

      {/* Query Builder */}
      <QueryBuilderSection
        exampleService={exampleService}
        runAction={runAction}
        loading={loading}
      />

      {/* Feature Flag Gating */}
      <FeatureFlagGatingSection />

      {/* Service Event Subscription */}
      <ServiceEventSubscriptionSection exampleService={exampleService} />

      {/* Error Demos */}
      <Section title='Error Handling Demos' color='red'>
        <p className='text-sm text-gray-600 mb-3'>
          Test error handling. These endpoints intentionally throw validation errors.
        </p>

        <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-3 text-sm text-blue-800'>
          <strong>Note:</strong> Errors sync to the store ONLY when called through the service
          (apiClient), not direct fetch(). The service&apos;s apiClient has error interceptors that
          emit events and sync to the error store.
        </div>

        <div className='space-y-3'>
          <div className='flex gap-2 flex-wrap items-center'>
            <Button
              onClick={() =>
                runAction('Invalid Create (via Service)', () =>
                  // Call through service - errors will sync to store
                  exampleService.create({ name: '', amount: -100, description: '' })
                )
              }
              disabled={loading}
              color='red'
            >
              Invalid Create (via Service)
            </Button>
            <span className='text-xs text-gray-500'>
              Uses service.create() - errors sync to store via apiClient interceptors
            </span>
          </div>
          <div className='flex gap-2 flex-wrap items-center'>
            <Button
              onClick={() =>
                runAction('Single Error (direct fetch)', async () => {
                  const res = await fetch('/api/examples/errors/single');
                  return res.json();
                })
              }
              disabled={loading}
              color='orange'
            >
              Single Error (direct fetch)
            </Button>
            <span className='text-xs text-gray-500'>
              Direct fetch() - errors NOT synced to store (bypasses apiClient)
            </span>
          </div>
          <div className='flex gap-2 flex-wrap items-center'>
            <Button
              onClick={() =>
                runAction('Multiple Errors (direct fetch)', async () => {
                  const res = await fetch('/api/examples/errors/array');
                  return res.json();
                })
              }
              disabled={loading}
              color='orange'
            >
              Multiple Errors (direct fetch)
            </Button>
            <span className='text-xs text-gray-500'>
              Direct fetch() - errors NOT synced to store (bypasses apiClient)
            </span>
          </div>
        </div>
      </Section>

      {/* Result Display */}
      <Section title='Result' color='gray'>
        {loading && (
          <div className='flex items-center gap-2 text-blue-600 mb-3'>
            <Spinner />
            <span>Running: {lastAction}...</span>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-3 text-red-700 mb-3'>
            <strong>Error ({lastAction}):</strong>
            <pre className='mt-1 text-sm whitespace-pre-wrap'>{error}</pre>
          </div>
        )}

        {result !== null && !error && (
          <div>
            <DataViewer
              data={result}
              title={`Result: ${lastAction}`}
              defaultView={Array.isArray(result) ? 'table' : 'json'}
              maxHeight='350px'
            />
          </div>
        )}
      </Section>
    </div>
  );
}

/**
 * Files API Test Suite
 *
 * Demonstrates how to use FrontendFilesDomainService for file operations.
 * Tests file endpoints: health, list, upload, exists, signed URL, bulk operations.
 */
// ─────────────────────────────────────────────────────────────────────────────
// Storage Config Options (matches full UploadParams from @plyaz/storage)
// ─────────────────────────────────────────────────────────────────────────────

/** FILE_CATEGORY enum values - from @plyaz/types/storage */
const FILE_CATEGORIES = Object.values(FILE_CATEGORY);

/** ENTITY_TYPE enum values - from @plyaz/types/storage */
const ENTITY_TYPES = Object.values(ENTITY_TYPE);

/** FILE_ACCESS_LEVEL enum values - from @plyaz/types/storage */
const ACCESS_LEVELS = Object.values(FILE_ACCESS_LEVEL);

/** OUTPUT_FORMAT enum values - from @plyaz/types/storage */
const OUTPUT_FORMATS = Object.values(OUTPUT_FORMAT);

/** Output format to recommended category mapping (for auto-selection in template mode) */
const OUTPUT_FORMAT_CATEGORIES: Record<
  string,
  { category: string; mimeType: string; reason: string }
> = {
  pdf: {
    category: 'document',
    mimeType: 'application/pdf',
    reason: 'PDF documents require "document" category',
  },
  html: {
    category: 'document',
    mimeType: 'text/html',
    reason: 'HTML output uses "document" category',
  },
  png: { category: 'post_image', mimeType: 'image/png', reason: 'PNG images use image category' },
  jpeg: {
    category: 'post_image',
    mimeType: 'image/jpeg',
    reason: 'JPEG images use image category',
  },
  excel: {
    category: 'document',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    reason: 'Excel files require "document" category',
  },
  word: {
    category: 'document',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    reason: 'Word files require "document" category',
  },
  csv: { category: 'document', mimeType: 'text/csv', reason: 'CSV files use "document" category' },
  json: {
    category: 'attachment',
    mimeType: 'application/json',
    reason: 'JSON files use "attachment" category',
  },
};

/**
 * Template category prefix to DOCUMENT_TYPE mapping
 * Used for routing to COMPLIANCE bucket (which allows PDF)
 */
const TEMPLATE_DOCUMENT_TYPES: Record<string, DOCUMENT_TYPE> = {
  invoices: DOCUMENT_TYPE.INVOICE,
  receipts: DOCUMENT_TYPE.RECEIPT,
  reports: DOCUMENT_TYPE.REPORT,
  tax: DOCUMENT_TYPE.TAX,
  contracts: DOCUMENT_TYPE.CONTRACT,
  certificates: DOCUMENT_TYPE.CERTIFICATE,
  test: DOCUMENT_TYPE.COMPLIANCE, // Fallback for test templates
};

/**
 * Get document type from template ID
 * @param templateId - e.g., "invoices/standard-invoice"
 * @returns DOCUMENT_TYPE for storage routing
 */
function getDocumentTypeFromTemplate(templateId: string): DOCUMENT_TYPE | undefined {
  const category = templateId.split('/')[0];
  return TEMPLATE_DOCUMENT_TYPES[category];
}

/**
 * Output format to file extension mapping
 */
const OUTPUT_FORMAT_EXTENSIONS: Record<string, string> = {
  pdf: '.pdf',
  html: '.html',
  png: '.png',
  jpeg: '.jpg',
  excel: '.xlsx',
  word: '.docx',
  csv: '.csv',
  json: '.json',
};

/** PDF page formats */
const PDF_FORMATS = ['A4', 'Letter', 'Legal'] as const;

/** Available renderers with descriptions */
const RENDERERS: {
  id: string;
  name: string;
  description: string;
  formats: string[];
  recommended?: string;
}[] = [
  {
    id: '',
    name: '(auto)',
    description:
      'Auto-select based on output format. Uses the default renderer configured on the server.',
    formats: ['all'],
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description:
      'Best for PDF & images. Uses headless Chrome. Fast, reliable, great for invoices/reports.',
    formats: ['pdf', 'png', 'jpeg'],
    recommended: 'PDF, images',
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description:
      'Similar to Puppeteer but with multi-browser support. Good for cross-browser testing.',
    formats: ['pdf', 'png', 'jpeg'],
  },
  {
    id: 'pdfkit',
    name: 'PDFKit',
    description:
      'Native PDF generation without browser. Faster but less CSS support. Good for simple documents.',
    formats: ['pdf'],
    recommended: 'Simple PDFs',
  },
  {
    id: 'excel',
    name: 'ExcelJS',
    description: 'For Excel/spreadsheet generation. Use with .xlsx templates.',
    formats: ['excel', 'xlsx'],
    recommended: 'Spreadsheets',
  },
  {
    id: 'docx',
    name: 'DocxTemplater',
    description: 'For Word document generation. Use with .docx templates.',
    formats: ['word', 'docx'],
    recommended: 'Word docs',
  },
];

/** Available Template IDs (actual templates from @plyaz/storage/templates) */
const TEMPLATE_IDS = [
  // Invoices (en, es, fr)
  'invoices/standard-invoice',
  // Receipts (en, es, fr)
  'receipts/purchase-receipt',
  // Reports (en only)
  'reports/monthly-statement',
  // Tax Documents - DISABLED: requires unimplemented helpers (taxInvoiceTotal, calcTaxFromSubtotal)
  // 'tax/tax-invoice',
  // Test (en only)
  'test/template-test',
] as const;

/** Available locales for layout templates */
const LAYOUT_LOCALES = ['en', 'es', 'fr'] as const;

/** Available Header Templates for PDF generation (locale-independent paths) */
const HEADER_TEMPLATES = [
  { id: '', name: '(none)', description: 'No header template' },
  {
    id: 'headers/default',
    name: 'Default Header',
    description: 'Standard header with company logo and title',
  },
] as const;

/** Available Footer Templates for PDF generation (locale-independent paths) */
const FOOTER_TEMPLATES = [
  { id: '', name: '(none)', description: 'No footer template' },
  {
    id: 'footers/default',
    name: 'Default Footer',
    description: 'Standard footer with page numbers',
  },
  {
    id: 'footers/invoice',
    name: 'Invoice Footer',
    description: 'Footer with payment terms and contact info',
  },
] as const;

/**
 * File Category to MIME Type Mapping
 * Documents which MIME types are allowed for each category/bucket purpose
 */
const CATEGORY_MIME_TYPES: Record<string, { allowed: string[]; description: string }> = {
  // Image categories - only image MIME types allowed
  profile_image: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only (JPEG, PNG, GIF, WebP, SVG)',
  },
  profile_banner: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },
  post_image: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },
  gallery_image: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },
  product_image: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },
  merchandise_image: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },
  nft_image: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },
  brand_logo: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },
  avatar: {
    allowed: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    description: 'Images only',
  },

  // Video categories - only video MIME types allowed
  post_video: {
    allowed: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    description: 'Videos only (MP4, WebM, OGG, QuickTime)',
  },
  gallery_video: {
    allowed: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    description: 'Videos only',
  },
  highlight_video: {
    allowed: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    description: 'Videos only',
  },
  training_video: {
    allowed: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    description: 'Videos only',
  },
  product_video: {
    allowed: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    description: 'Videos only',
  },

  // Document categories - PDF, Office docs, CSV
  document: {
    allowed: [
      'application/pdf',
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
    description: 'Documents (PDF, JSON, CSV, Excel, Word)',
  },
  contract_document: {
    allowed: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
    description: 'Documents (PDF, Word)',
  },
  invoice_document: {
    allowed: [
      'application/pdf',
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    description: 'Documents (PDF, JSON, CSV, Excel)',
  },
  receipt_document: {
    allowed: ['application/pdf', 'application/json', 'text/csv'],
    description: 'Documents (PDF, JSON, CSV)',
  },
  tax_document: {
    allowed: [
      'application/pdf',
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    description: 'Documents (PDF, JSON, CSV, Excel)',
  },
  legal_document: {
    allowed: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    description: 'Documents (PDF, Word)',
  },
  financial_document: {
    allowed: [
      'application/pdf',
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    description: 'Documents (PDF, JSON, CSV, Excel)',
  },
  id_document: {
    allowed: ['image/jpeg', 'image/png', 'application/pdf'],
    description: 'Images or PDF',
  },

  // Archive categories
  post_archive: {
    allowed: [
      'application/zip',
      'application/x-tar',
      'application/gzip',
      'application/x-7z-compressed',
      'application/x-rar-compressed',
    ],
    description: 'Archives only (ZIP, TAR, GZ, 7z, RAR)',
  },

  // Flexible categories - most MIME types allowed
  temp_file: { allowed: [], description: 'All file types allowed (no MIME restrictions)' },
  attachment: { allowed: [], description: 'All file types allowed (no MIME restrictions)' },
  other: { allowed: [], description: 'All file types allowed (no MIME restrictions)' },
  profile_data: { allowed: [], description: 'All file types allowed' },
  post_document: { allowed: [], description: 'All file types allowed' },
  post_audio: {
    allowed: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    description: 'Audio files (MP3, WAV, OGG, M4A)',
  },
  nft_metadata: { allowed: ['application/json'], description: 'JSON only' },
  brand_asset: { allowed: [], description: 'All file types allowed' },
  marketing_asset: { allowed: [], description: 'All file types allowed' },
};

/** STORAGE_ENVIRONMENT enum values - from @plyaz/types/storage */
const ENVIRONMENTS = Object.values(STORAGE_ENVIRONMENT);

/** BUSINESS_MODEL enum values - from @plyaz/types/storage */
const BUSINESS_MODELS = Object.values(BUSINESS_MODEL);

/** ORGANIZATION_TIER enum values - from @plyaz/types/storage */
const ORGANIZATION_TIERS = Object.values(ORGANIZATION_TIER);

/** DOCUMENT_TYPE enum values (for compliance) - from @plyaz/types/storage */
const DOCUMENT_TYPES = Object.values(DOCUMENT_TYPE);

/** MEDIA_ENTITY enum values (for Supabase) - from @plyaz/types/storage */
const MEDIA_ENTITIES = Object.values(MEDIA_ENTITY);

/** STORAGE_VISIBILITY enum values - from @plyaz/types/storage */
const VISIBILITIES = Object.values(STORAGE_VISIBILITY);

/** STORAGE_ADAPTER_TYPE enum values - from @plyaz/types/storage */
const ADAPTER_TYPES = Object.values(STORAGE_ADAPTER_TYPE);

/** STORAGE_DEVICE_TYPE enum values - from @plyaz/types/storage */
const DEVICE_TYPES = Object.values(STORAGE_DEVICE_TYPE);

/** STORAGE_QUEUE_PRIORITY enum values - from @plyaz/types/storage */
const QUEUE_PRIORITIES = Object.values(STORAGE_QUEUE_PRIORITY);

/** Built-in presets from @plyaz/config/storage (app-specific) */
const PRESETS = [
  '', // none
  'profile-picture',
  'post-image',
  'hero-banner',
  'video-streaming',
  'social-share',
  'product-image',
] as const;

/** Standard variant names - from @plyaz/types/storage */
const VARIANT_NAMES = Object.values(STORAGE_VARIANT_NAME);

function FilesApiTestSuite() {
  const filesService = useService<FrontendFilesDomainService>('files-frontend');
  const events = useEvents();

  // Use file hooks from @plyaz/core for simplified operations
  const { upload, uploadMultiple, uploadFromTemplate, uploadMultipleFromTemplate, generate } =
    useFileUpload();
  const { download } = useFileDownload();
  const { fetchById, getSignedUrl } = useFile();
  const { deleteFile } = useFileDelete();
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>('');
  const [targetId, setTargetId] = useState('');

  // Access files list from store for selection dropdown
  const filesStore = useFilesStore();
  const filesList = filesStore.filesList;

  // ─────────────────────────────────────────────────────────────────────────────
  // Config Mode: Simple vs Advanced
  // ─────────────────────────────────────────────────────────────────────────────
  const [configMode, setConfigMode] = useState<'simple' | 'advanced'>('simple');

  // ─────────────────────────────────────────────────────────────────────────────
  // Upload Configuration (matches FULL UploadParams from @plyaz/storage)
  // ─────────────────────────────────────────────────────────────────────────────

  // Required fields (default to temp_file which allows all MIME types)
  const [uploadCategory, setUploadCategory] = useState<string>('temp_file');
  const [uploadEntityType, setUploadEntityType] = useState<string>('system');
  // entityId must be a valid UUID for DB persistence - generate one by default
  const [uploadEntityId, setUploadEntityId] = useState(() => crypto.randomUUID());

  // Optional metadata
  const [uploadFilename, setUploadFilename] = useState('test-file.txt');
  const [uploadAccessLevel, setUploadAccessLevel] = useState<string>('private');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadCustomPath, setUploadCustomPath] = useState('');
  const [uploadTtl, setUploadTtl] = useState<string>('');
  const [uploadImmutable, setUploadImmutable] = useState(false);
  const [uploadRetentionPolicyId, setUploadRetentionPolicyId] = useState('');

  // Processing options
  const [uploadExtractMetadata, setUploadExtractMetadata] = useState(true);
  const [uploadVirusScan, setUploadVirusScan] = useState(false);
  const [uploadProcessMedia, setUploadProcessMedia] = useState(false);

  // Multi-tenancy & routing
  const [uploadTenant, setUploadTenant] = useState('');
  const [uploadOrganizationId, setUploadOrganizationId] = useState('');
  const [uploadOrganizationTier, setUploadOrganizationTier] = useState<string>('');
  const [uploadBusinessModel, setUploadBusinessModel] = useState<string>('');
  const [uploadEnvironment, setUploadEnvironment] = useState<string>('dev');
  const [uploadRegion, setUploadRegion] = useState('');

  // Storage overrides
  const [uploadBucketOverride, setUploadBucketOverride] = useState('');
  const [uploadAdapterOverride, setUploadAdapterOverride] = useState<string>('');

  // Compliance (R2 documents)
  const [uploadDocumentType, setUploadDocumentType] = useState<string>('');
  const [uploadDocumentId, setUploadDocumentId] = useState('');
  const [uploadDocumentSlug, setUploadDocumentSlug] = useState('');

  // Media (Supabase)
  const [uploadMediaEntity, setUploadMediaEntity] = useState<string>('');
  const [uploadVisibility, setUploadVisibility] = useState<string>('private');
  const [uploadVariantName, setUploadVariantName] = useState('');

  // Presets & Variants
  const [uploadPreset, setUploadPreset] = useState<string>('');
  const [uploadDevice, setUploadDevice] = useState<string>('auto');
  const [uploadAllDevices, setUploadAllDevices] = useState(false);

  // Queue options
  const [uploadUseQueue, setUploadUseQueue] = useState(false);
  const [uploadQueuePriority, setUploadQueuePriority] = useState<string>('normal');

  // Template-based generation (alternative to direct upload)
  const [uploadTemplateId, setUploadTemplateId] = useState('');
  const [uploadOutputFormat, setUploadOutputFormat] = useState<string>('pdf');
  const [uploadLocale, setUploadLocale] = useState('en');
  const [uploadRendererName, setUploadRendererName] = useState<string>('');

  // PDF options (full options matching PDFRenderOptions)
  const [uploadPdfFormat, setUploadPdfFormat] = useState<string>('A4');
  const [uploadPdfLandscape, setUploadPdfLandscape] = useState(false);
  const [uploadPdfHeaderTemplate, setUploadPdfHeaderTemplate] = useState('');
  const [uploadPdfFooterTemplate, setUploadPdfFooterTemplate] = useState('');
  const [uploadPdfDisplayHeaderFooter, setUploadPdfDisplayHeaderFooter] = useState(false);
  const [uploadPdfLayoutLocale, setUploadPdfLayoutLocale] = useState('en');
  const [uploadPdfPrintBackground, setUploadPdfPrintBackground] = useState(true);
  const [uploadPdfScale, setUploadPdfScale] = useState('1');
  const [uploadPdfMarginTop, setUploadPdfMarginTop] = useState('');
  const [uploadPdfMarginRight, setUploadPdfMarginRight] = useState('');
  const [uploadPdfMarginBottom, setUploadPdfMarginBottom] = useState('');
  const [uploadPdfMarginLeft, setUploadPdfMarginLeft] = useState('');

  // ─────────────────────────────────────────────────────────────────────────────
  // Generate Document Configuration (matches GenerateFileParams)
  // ─────────────────────────────────────────────────────────────────────────────

  const [generateTemplateId, setGenerateTemplateId] = useState('invoices/standard-invoice');
  const [generateOutputFormat, setGenerateOutputFormat] = useState<string>('pdf');
  const [generateLocale, setGenerateLocale] = useState('en');
  const [generateRendererName, setGenerateRendererName] = useState<string>('');

  // PDF options (full PDFRenderOptions)
  const [generatePdfFormat, setGeneratePdfFormat] = useState<string>('A4');
  const [generatePdfLandscape, setGeneratePdfLandscape] = useState(false);
  const [generatePdfMarginTop, setGeneratePdfMarginTop] = useState('');
  const [generatePdfMarginRight, setGeneratePdfMarginRight] = useState('');
  const [generatePdfMarginBottom, setGeneratePdfMarginBottom] = useState('');
  const [generatePdfMarginLeft, setGeneratePdfMarginLeft] = useState('');
  const [generatePdfHeaderTemplate, setGeneratePdfHeaderTemplate] = useState('');
  const [generatePdfFooterTemplate, setGeneratePdfFooterTemplate] = useState('');
  const [generatePdfDisplayHeaderFooter, setGeneratePdfDisplayHeaderFooter] = useState(false);
  const [generatePdfLayoutLocale, setGeneratePdfLayoutLocale] = useState('en');
  const [generatePdfPrintBackground, setGeneratePdfPrintBackground] = useState(true);
  const [generatePdfScale, setGeneratePdfScale] = useState('1');
  const [generatePdfMetaAuthor, setGeneratePdfMetaAuthor] = useState('');
  const [generatePdfMetaSubject, setGeneratePdfMetaSubject] = useState('');
  const [generatePdfMetaKeywords, setGeneratePdfMetaKeywords] = useState('');
  const [generatePdfMetaTitle, setGeneratePdfMetaTitle] = useState('');
  const [generatePdfCss, setGeneratePdfCss] = useState('');
  const [generatePdfWatermarkEnabled, setGeneratePdfWatermarkEnabled] = useState(false);
  const [generatePdfWatermarkText, setGeneratePdfWatermarkText] = useState('');
  const [generatePdfWatermarkOpacity, setGeneratePdfWatermarkOpacity] = useState('0.3');

  // Validation options
  const [generateValidationEnabled, setGenerateValidationEnabled] = useState(true);
  const [generateValidationStrict, setGenerateValidationStrict] = useState(false);

  // Auto-category selection message (shows when category is auto-changed in template mode)
  const [autoCategoryMessage, setAutoCategoryMessage] = useState<string | null>(null);

  // Auto-select category based on output format when in template mode
  useEffect(() => {
    if (uploadTemplateId && uploadOutputFormat) {
      const formatConfig = OUTPUT_FORMAT_CATEGORIES[uploadOutputFormat];
      const docType = getDocumentTypeFromTemplate(uploadTemplateId);
      if (formatConfig && uploadCategory !== formatConfig.category) {
        setUploadCategory(formatConfig.category);
        const docTypeInfo = docType
          ? ` DocumentType: ${docType} (routes to COMPLIANCE bucket)`
          : '';
        setAutoCategoryMessage(
          `Category auto-changed to "${formatConfig.category}" - ${formatConfig.reason}${docTypeInfo}`
        );
        // Clear message after 5 seconds
        const timer = setTimeout(() => setAutoCategoryMessage(null), TIMEOUT_MS_5S);
        return () => clearTimeout(timer);
      } else if (docType && !autoCategoryMessage) {
        // Show document type info even if category didn't change
        setAutoCategoryMessage(
          `DocumentType: ${docType} (routes to COMPLIANCE bucket which allows ${formatConfig?.mimeType ?? uploadOutputFormat})`
        );
        const timer = setTimeout(() => setAutoCategoryMessage(null), TIMEOUT_MS_5S);
        return () => clearTimeout(timer);
      }
    } else if (!uploadTemplateId) {
      // Clear message when exiting template mode
      setAutoCategoryMessage(null);
    }
  }, [uploadTemplateId, uploadOutputFormat, uploadCategory, autoCategoryMessage]);

  /**
   * Build upload params from state (matches FULL UploadParams)
   */
  const getUploadParams = () => {
    const params: Record<string, unknown> = {
      // Required
      category: uploadCategory,
      entityType: uploadEntityType,
      entityId: uploadEntityId,
    };

    // Optional metadata
    if (uploadFilename) params.filename = uploadFilename;
    if (uploadAccessLevel) params.accessLevel = uploadAccessLevel;
    if (uploadTags)
      params.tags = uploadTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    if (uploadCustomPath) params.customPath = uploadCustomPath;
    if (uploadTtl) params.ttl = Number(uploadTtl);
    if (uploadImmutable) params.immutable = true;
    if (uploadRetentionPolicyId) params.retentionPolicyId = uploadRetentionPolicyId;

    // Processing options
    if (uploadExtractMetadata) params.extractMetadata = true;
    if (uploadVirusScan) params.virusScan = true;
    if (uploadProcessMedia) params.processMedia = true;

    // Multi-tenancy & routing
    if (uploadTenant) params.tenant = uploadTenant;
    if (uploadOrganizationId) params.organizationId = uploadOrganizationId;
    if (uploadOrganizationTier) params.organizationTier = uploadOrganizationTier;
    if (uploadBusinessModel) params.businessModel = uploadBusinessModel;
    if (uploadEnvironment) params.environment = uploadEnvironment;
    if (uploadRegion) params.region = uploadRegion;

    // Storage overrides
    if (uploadBucketOverride) params.bucketOverride = uploadBucketOverride;
    if (uploadAdapterOverride) params.adapterOverride = uploadAdapterOverride;

    // Compliance (R2 documents)
    if (uploadDocumentType) params.documentType = uploadDocumentType;
    if (uploadDocumentId) params.documentId = uploadDocumentId;
    if (uploadDocumentSlug) params.documentSlug = uploadDocumentSlug;

    // Media (Supabase)
    if (uploadMediaEntity) params.mediaEntity = uploadMediaEntity;
    if (uploadVisibility) params.visibility = uploadVisibility;
    if (uploadVariantName) params.variantName = uploadVariantName;

    // Presets & Variants
    if (uploadPreset) params.presets = [uploadPreset];
    if (uploadDevice && uploadDevice !== 'auto') params.device = uploadDevice;
    if (uploadAllDevices) params.allDevices = true;

    // Queue options
    if (uploadUseQueue) {
      params.useQueue = true;
      params.queuePriority = uploadQueuePriority;
    }

    // Template-based generation
    if (uploadTemplateId) {
      params.templateId = uploadTemplateId;
      params.outputFormat = uploadOutputFormat;
      // Set documentType for proper bucket routing (COMPLIANCE bucket allows PDF)
      const docType = getDocumentTypeFromTemplate(uploadTemplateId);
      if (docType) params.documentType = docType;
      // Always set filename with correct extension in template mode
      // This ensures the extension matches the output format
      // Add timestamp to avoid "resource already exists" conflicts
      const correctExtension =
        OUTPUT_FORMAT_EXTENSIONS[uploadOutputFormat] ?? `.${uploadOutputFormat}`;
      const timestamp = Date.now();
      if (params.filename) {
        // Replace existing extension with correct one and add timestamp
        const baseFilename = String(params.filename).replace(/\.[^.]+$/, '');
        params.filename = `${baseFilename}-${timestamp}${correctExtension}`;
      } else {
        const templateName = uploadTemplateId.split('/').pop() ?? 'document';
        params.filename = `${templateName}-${timestamp}${correctExtension}`;
      }
      // Auto-set mimeType based on output format
      const formatConfig = OUTPUT_FORMAT_CATEGORIES[uploadOutputFormat];
      if (formatConfig?.mimeType) {
        params.mimeType = formatConfig.mimeType;
      }
      if (uploadLocale) params.locale = uploadLocale;
      if (uploadRendererName) params.rendererName = uploadRendererName;
      if (uploadOutputFormat === 'pdf') {
        const pdfOptions: Record<string, unknown> = {
          format: uploadPdfFormat,
          landscape: uploadPdfLandscape,
          printBackground: uploadPdfPrintBackground,
          displayHeaderFooter: uploadPdfDisplayHeaderFooter,
        };
        // Optional PDF options
        if (uploadPdfHeaderTemplate) pdfOptions.headerTemplate = uploadPdfHeaderTemplate;
        if (uploadPdfFooterTemplate) pdfOptions.footerTemplate = uploadPdfFooterTemplate;
        if (uploadPdfScale && uploadPdfScale !== '1') pdfOptions.scale = Number(uploadPdfScale);
        // Margins
        if (
          uploadPdfMarginTop ||
          uploadPdfMarginRight ||
          uploadPdfMarginBottom ||
          uploadPdfMarginLeft
        ) {
          pdfOptions.margin = {
            ...(uploadPdfMarginTop && { top: uploadPdfMarginTop }),
            ...(uploadPdfMarginRight && { right: uploadPdfMarginRight }),
            ...(uploadPdfMarginBottom && { bottom: uploadPdfMarginBottom }),
            ...(uploadPdfMarginLeft && { left: uploadPdfMarginLeft }),
          };
        }
        params.pdfOptions = pdfOptions;
      }
    }

    return params;
  };

  // Files service events
  const [filesEvents, setFilesEvents] = useState<{ event: string; data: unknown; time: string }[]>(
    []
  );

  // Subscribe to files service events
  useEffect(() => {
    const handleFilesEvent = (eventName: string) => (data: unknown) => {
      setFilesEvents(prev => [
        { event: eventName, data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, ISO_DATE_LENGTH), // Keep last 20 events
      ]);
    };

    const filesUnsubscribers = [
      // Fetch events (use correct format: domain:operation:state)
      events.on('files:fetching', handleFilesEvent('files:fetching')),
      events.on('files:fetched', handleFilesEvent('files:fetched')),
      events.on('files:fetch:error', handleFilesEvent('files:fetch:error')),
      // Upload events - NOTE: format is files:upload:state (not files:uploading)
      events.on('files:upload:uploading', handleFilesEvent('files:upload:uploading')),
      events.on('files:upload:uploaded', (data: unknown) => {
        handleFilesEvent('files:upload:uploaded')(data);
      }),
      events.on('files:upload:error', handleFilesEvent('files:upload:error')),
      // Bulk upload events (same as single but check for bulk flag)
      events.on('files:upload:bulk:uploading', handleFilesEvent('files:upload:bulk:uploading')),
      events.on('files:upload:bulk:uploaded', handleFilesEvent('files:upload:bulk:uploaded')),
      events.on('files:upload:bulk:error', handleFilesEvent('files:upload:bulk:error')),
      // Delete events
      events.on('files:deleting', handleFilesEvent('files:deleting')),
      events.on('files:deleted', handleFilesEvent('files:deleted')),
      events.on('files:delete:error', handleFilesEvent('files:delete:error')),
      // Download events
      events.on('files:download:downloading', handleFilesEvent('files:download:downloading')),
      events.on('files:download:downloaded', handleFilesEvent('files:download:downloaded')),
      events.on('files:download:error', handleFilesEvent('files:download:error')),
      // Signed URL events
      events.on('files:signedUrl:requesting', handleFilesEvent('files:signedUrl:requesting')),
      events.on('files:signedUrl:received', handleFilesEvent('files:signedUrl:received')),
      events.on('files:signedUrl:error', handleFilesEvent('files:signedUrl:error')),
      // Store events
      events.on('files:store:synced', handleFilesEvent('files:store:synced')),
      events.on('files:error', handleFilesEvent('files:error')),
      // Document generation events
      events.on('files:document:generating', handleFilesEvent('files:document:generating')),
      events.on('files:document:generated', handleFilesEvent('files:document:generated')),
      events.on('files:document:error', handleFilesEvent('files:document:error')),
    ];

    return () => {
      filesUnsubscribers.forEach(unsub => unsub());
    };
  }, [events]);

  const runAction = useCallback(async (actionName: string, action: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    setLastAction(actionName);
    try {
      const res = await action();
      setResult(res);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err));
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  if (!filesService) {
    return (
      <div className='mt-6 bg-yellow-50 border border-yellow-300 rounded p-4 text-yellow-800'>
        <strong>Files API Test Suite</strong>
        <p className='mt-2'>Files service not available. Check PlyazProvider configuration.</p>
      </div>
    );
  }

  return (
    <div className='mt-6 pt-6 border-t border-gray-200'>
      <h3 className='font-semibold mb-4 text-gray-900 text-lg'>Files API Test Suite</h3>

      <div className='space-y-6'>
        {/* Health Check */}
        <Section title='Files Health Check' color='emerald'>
          <p className='text-sm text-gray-600 mb-3'>
            GET /api/files/health - Check if the files service is running.
          </p>
          <Button
            onClick={() =>
              runAction('Files Health Check', async () => {
                const res = await fetch('/api/files/health');
                return res.json();
              })
            }
            disabled={loading}
            color='emerald'
          >
            Check Health
          </Button>
        </Section>

        {/* Fetch Operations */}
        <Section title='Files Fetch Operations' color='blue'>
          <p className='text-sm text-gray-600 mb-3'>
            Uses FrontendFilesDomainService to fetch file data via API.
          </p>
          <div className='mb-3'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>File ID:</label>
            {filesList.length > 0 ? (
              <div className='max-h-40 overflow-y-auto border border-gray-200 rounded bg-gray-50'>
                {filesList.map(
                  (file: { id: string; filename?: string; original_filename?: string }) => (
                    <button
                      key={file.id}
                      type='button'
                      onClick={() => setTargetId(file.id)}
                      className={`w-full text-left px-3 py-2 text-sm border-b border-gray-200 last:border-b-0 transition-colors ${
                        targetId === file.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      <span className='font-mono text-xs'>{file.id}</span>
                      {(file.original_filename ?? file.filename) && (
                        <span className='ml-2 text-gray-500'>
                          ({file.original_filename ?? file.filename})
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className='text-sm text-gray-400 py-2'>
                No files in store. Upload a file first.
              </div>
            )}
            <input
              type='text'
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className='mt-2 border border-gray-300 rounded px-3 py-2 w-full font-mono text-sm text-gray-900 bg-white'
              placeholder='Or enter UUID manually'
            />
          </div>
          <div className='flex gap-2 flex-wrap'>
            <Button
              onClick={() => runAction('Fetch by ID', () => fetchById(targetId))}
              disabled={loading || !targetId}
              color='blue'
            >
              Fetch by ID
            </Button>
            <Button
              onClick={() =>
                runAction('Check Exists', async () => {
                  const res = await fetch(`/api/files/exists/${targetId}`);
                  return res.json();
                })
              }
              disabled={loading || !targetId}
              color='cyan'
            >
              Check Exists
            </Button>
            <Button
              onClick={() => runAction('Get Signed URL', () => getSignedUrl(targetId))}
              disabled={loading || !targetId}
              color='indigo'
            >
              Get Signed URL
            </Button>
            <Button
              onClick={() => runAction('Download', () => download(targetId))}
              disabled={loading || !targetId}
              color='violet'
            >
              Download
            </Button>
            <Button
              onClick={() => runAction('Delete', () => deleteFile(targetId))}
              disabled={loading || !targetId}
              color='red'
            >
              Delete
            </Button>
          </div>
        </Section>

        {/* Upload Operations */}
        <Section title='File Upload to Storage' color='purple'>
          {/* Upload/Download Progress Sections */}
          <UploadProgressSection />
          <DownloadProgressSection />

          {/* Mode Toggle */}
          <div className='flex items-center gap-4 mb-4'>
            <span className='text-sm font-medium text-gray-700'>Config Mode:</span>
            <div className='flex rounded-lg border border-gray-300 overflow-hidden'>
              <button
                onClick={() => setConfigMode('simple')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  configMode === 'simple'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setConfigMode('advanced')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  configMode === 'advanced'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          {/* Backend Defaults Info */}
          <div className='bg-purple-50 border border-purple-200 rounded-md p-3 mb-4'>
            <h4 className='text-xs font-semibold text-purple-800 mb-2'>
              Backend Defaults (from plyaz.backend.ts)
            </h4>
            <div className='text-xs text-purple-700 space-y-1'>
              <p>
                <strong>category:</strong> document (FILE_CATEGORY.DOCUMENT)
              </p>
              <p>
                <strong>entityType:</strong> system (ENTITY_TYPE.SYSTEM)
              </p>
              <p>
                <strong>entityId:</strong> must be a valid UUID (for DB persistence)
              </p>
              <p>
                <strong>filename:</strong> auto-generated from templateId or file
              </p>
              <p className='mt-2 text-purple-600 italic'>
                These defaults are applied when values are not provided.
              </p>
            </div>
          </div>

          <p className='text-sm text-gray-600 mb-3'>
            Upload files to storage bucket. Supports direct upload (base64) or template-based
            generation.
            <strong className='text-purple-700'>
              {' '}
              Template mode generates AND uploads the file to storage.
            </strong>
          </p>

          {/* Simple Mode - Minimal Configuration */}
          {configMode === 'simple' && (
            <div className='bg-white border border-gray-200 rounded-md p-4 mb-4'>
              <h4 className='text-sm font-semibold text-gray-800 mb-3'>
                Simple Upload (Minimal Params)
              </h4>
              <p className='text-xs text-gray-600 mb-4'>
                In simple mode, only provide what is needed. Backend defaults handle the rest.
              </p>

              <div className='space-y-4'>
                {/* Direct Upload - Just file content */}
                <div className='bg-gray-50 rounded p-3'>
                  <h5 className='text-xs font-semibold text-gray-700 mb-2'>
                    Direct Upload (File object)
                  </h5>
                  <pre className='text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-800'>
                    {`// Using useFileUpload hook
const { upload } = useFileUpload();
const file = new File([content], 'name.txt', { type: 'text/plain' });
await upload(file, { category, entityType, entityId });`}
                  </pre>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    <FileActionButton
                      label='Upload Small (51B)'
                      color='purple'
                      disabled={loading}
                      actionType='upload'
                      onAction={async operationId => {
                        // Use useFileUpload hook with File object
                        const content = 'Simple test file content - ' + new Date().toISOString();
                        const file = new File([content], `small-${Date.now()}.txt`, {
                          type: 'text/plain',
                        });
                        return upload(file, {
                          category: FILE_CATEGORY.OTHER,
                          entityType: ENTITY_TYPE.SYSTEM,
                          entityId: operationId,
                        });
                      }}
                    />
                    <FileActionButton
                      label='Upload 10MB'
                      color='indigo'
                      disabled={loading}
                      actionType='upload'
                      onAction={async operationId => {
                        // Generate 10MB of data for progress testing
                        const size = FILE_SIZE_10_MB; // 10MB
                        const chunk = 'ABCDEFGHIJ'.repeat(BYTES_PER_KB); // 10KB chunk
                        let content = `10MB file test - ${new Date().toISOString()}\n`;
                        while (content.length < size) {
                          content += chunk;
                        }
                        const file = new File(
                          [content.slice(0, size)],
                          `test-10mb-${Date.now()}.txt`,
                          { type: 'text/plain' }
                        );
                        return upload(file, {
                          category: FILE_CATEGORY.OTHER,
                          entityType: ENTITY_TYPE.SYSTEM,
                          entityId: operationId,
                        });
                      }}
                    />
                    <FileActionButton
                      label='Upload 25MB'
                      color='emerald'
                      disabled={loading}
                      actionType='upload'
                      onAction={async operationId => {
                        // Generate 25MB of data for slower progress
                        const size = FILE_SIZE_25_MB; // 25MB
                        const chunk = 'X'.repeat(KB_10); // 10KB chunk
                        let content = `25MB file test - ${new Date().toISOString()}\n`;
                        while (content.length < size) {
                          content += chunk;
                        }
                        const file = new File(
                          [content.slice(0, size)],
                          `test-25mb-${Date.now()}.txt`,
                          { type: 'text/plain' }
                        );
                        return upload(file, {
                          category: FILE_CATEGORY.OTHER,
                          entityType: ENTITY_TYPE.SYSTEM,
                          entityId: operationId,
                        });
                      }}
                    />
                    <FileActionButton
                      label='Upload 50MB'
                      color='blue'
                      disabled={loading}
                      actionType='upload'
                      onAction={async operationId => {
                        // Generate 50MB of data for very visible progress
                        const size = FILE_SIZE_50_MB; // 50MB
                        const chunk = 'Y'.repeat(KB_10); // 10KB chunk
                        let content = `50MB file test - ${new Date().toISOString()}\n`;
                        while (content.length < size) {
                          content += chunk;
                        }
                        const file = new File(
                          [content.slice(0, size)],
                          `test-50mb-${Date.now()}.txt`,
                          { type: 'text/plain' }
                        );
                        return upload(file, {
                          category: FILE_CATEGORY.OTHER,
                          entityType: ENTITY_TYPE.SYSTEM,
                          entityId: operationId,
                        });
                      }}
                    />
                  </div>
                  <div className='mt-3'>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Or upload a real file:
                    </label>
                    <input
                      type='file'
                      className='block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100'
                      onChange={async e => {
                        const selectedFile = e.target.files?.[0];
                        if (!selectedFile) return;
                        try {
                          await upload(selectedFile, {
                            category: FILE_CATEGORY.OTHER,
                            entityType: ENTITY_TYPE.SYSTEM,
                            entityId: crypto.randomUUID(),
                          });
                        } catch (err) {
                          log.error('Upload failed', {
                            error: err instanceof Error ? err.message : String(err),
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Template Upload - Just template + data */}
                <div className='bg-gray-50 rounded p-3'>
                  <h5 className='text-xs font-semibold text-gray-700 mb-2'>
                    Template Upload (templateId + data)
                  </h5>
                  <pre className='text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-800'>
                    {`// Using useFileUpload hook
const { uploadFromTemplate } = useFileUpload();
await uploadFromTemplate({
  templateId: 'invoices/standard-invoice',
  templateData: { invoiceNumber, items, total },
  outputFormat: 'pdf',  // optional, defaults to pdf
  category, entityType, entityId,
});`}
                  </pre>
                  <div className='mt-2'>
                    <FileActionButton
                      label='Generate & Upload Invoice'
                      color='pink'
                      disabled={loading}
                      actionType='generate'
                      onAction={async operationId => {
                        // Use uploadFromTemplate hook for template-based upload
                        return uploadFromTemplate({
                          templateId: 'invoices/standard-invoice',
                          templateData: {
                            invoiceNumber: 'INV-' + Date.now(),
                            date: new Date().toISOString().split('T')[0],
                            customerName: 'Simple Test Customer',
                            items: [{ description: 'Service', quantity: 1, price: 100 }],
                            subtotal: 100,
                            tax: 10,
                            total: 110,
                          },
                          outputFormat: 'pdf',
                          category: FILE_CATEGORY.InvoiceDocument,
                          entityType: ENTITY_TYPE.SYSTEM,
                          entityId: operationId,
                        });
                      }}
                    />
                  </div>
                </div>

                {/* Bulk Upload */}
                <div className='bg-gray-50 rounded p-3'>
                  <h5 className='text-xs font-semibold text-gray-700 mb-2'>
                    Bulk Upload (array of Files)
                  </h5>
                  <pre className='text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-800'>
                    {`// Using useFileUpload hook
const { uploadMultiple } = useFileUpload();
const files = [file1, file2, file3]; // File objects
await uploadMultiple(files, { category, entityType, entityId });`}
                  </pre>
                  <div className='mt-2'>
                    <FileActionButton
                      label='Upload 3 Files'
                      color='indigo'
                      disabled={loading}
                      actionType='bulk'
                      onAction={async operationId => {
                        // Use uploadMultiple hook with File objects
                        const files = Array.from({ length: BATCH_SIZE_3 }, (_, i) => i + 1).map(
                          n =>
                            new File(
                              [`Bulk file ${n} - ` + new Date().toISOString()],
                              `bulk-${n}-${Date.now()}.txt`,
                              { type: 'text/plain' }
                            )
                        );
                        return uploadMultiple(files, {
                          category: FILE_CATEGORY.OTHER,
                          entityType: ENTITY_TYPE.SYSTEM,
                          entityId: operationId,
                        });
                      }}
                    />
                  </div>
                </div>

                {/* Generate Only (no upload) */}
                <div className='bg-gray-50 rounded p-3'>
                  <h5 className='text-xs font-semibold text-gray-700 mb-2'>
                    Generate Only (returns buffer, no upload)
                  </h5>
                  <pre className='text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-800'>
                    {`// Using useFileUpload hook
const { generate } = useFileUpload();
const { buffer, size } = await generate({
  templateId: 'receipts/purchase-receipt',
  templateData: { receiptNumber, items, total },
});
// buffer is base64, use for client-side download`}
                  </pre>
                  <div className='mt-2'>
                    <FileActionButton
                      label='Generate Document'
                      color='emerald'
                      disabled={loading}
                      actionType='generate'
                      onAction={async () => {
                        // Use generate hook for generate-only (returns buffer, no upload)
                        return generate({
                          templateId: 'invoices/standard-invoice',
                          templateData: {
                            invoiceNumber: 'GEN-' + Date.now(),
                            date: new Date().toISOString().split('T')[0],
                            customerName: 'Generate Test',
                            items: [{ description: 'Item', quantity: 1, price: 50 }],
                            subtotal: 50,
                            tax: 5,
                            total: 55,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Mode - Full Configuration */}
          {configMode === 'advanced' && (
            <>
              {/* Help Notes - Category & MIME Types */}
              <div className='bg-amber-50 border border-amber-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-amber-800 mb-2'>
                  Important: File Categories & Allowed MIME Types
                </h4>
                <div className='text-xs text-gray-700 space-y-1'>
                  <p>
                    <strong>Each category restricts which file types can be uploaded.</strong> If
                    you get &quot;file type not allowed&quot; error, check the MIME type matches the
                    category.
                  </p>
                  <div className='mt-2 p-2 bg-white rounded border border-amber-100'>
                    <p className='font-medium text-amber-900'>
                      Current Category:{' '}
                      <code className='bg-amber-100 px-1 rounded'>{uploadCategory}</code>
                    </p>
                    <p className='text-gray-600 mt-1'>
                      {CATEGORY_MIME_TYPES[uploadCategory]?.description || 'Unknown category'}
                      {CATEGORY_MIME_TYPES[uploadCategory]?.allowed.length > 0 && (
                        <span className='block mt-1 text-gray-500'>
                          Allowed:{' '}
                          {CATEGORY_MIME_TYPES[uploadCategory].allowed
                            .slice(0, BATCH_SIZE_3)
                            .join(', ')}
                          {CATEGORY_MIME_TYPES[uploadCategory].allowed.length > BATCH_SIZE_3 &&
                            '...'}
                        </span>
                      )}
                    </p>
                    {autoCategoryMessage && (
                      <p className='mt-2 text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 text-xs'>
                        ✓ {autoCategoryMessage}
                      </p>
                    )}
                  </div>
                  <p className='mt-2 text-gray-500'>
                    <strong>Tip:</strong> Use{' '}
                    <code className='bg-gray-100 px-1 rounded'>temp_file</code>,{' '}
                    <code className='bg-gray-100 px-1 rounded'>attachment</code>, or{' '}
                    <code className='bg-gray-100 px-1 rounded'>other</code> categories for
                    unrestricted file types.
                  </p>
                </div>
              </div>

              {/* Required Fields */}
              <div className='bg-purple-50 border border-purple-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-purple-800 mb-2'>Required Fields</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Category *</label>
                    <select
                      value={uploadCategory}
                      onChange={e => setUploadCategory(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {FILE_CATEGORIES.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Entity Type *</label>
                    <select
                      value={uploadEntityType}
                      onChange={e => setUploadEntityType(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {ENTITY_TYPES.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Entity ID * (UUID)</label>
                    <div className='flex gap-1'>
                      <input
                        type='text'
                        value={uploadEntityId}
                        onChange={e => setUploadEntityId(e.target.value)}
                        className='flex-1 border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white font-mono'
                        placeholder='uuid'
                      />
                      <button
                        type='button'
                        onClick={() => setUploadEntityId(crypto.randomUUID())}
                        className='px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700'
                        title='Generate new UUID'
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Filename</label>
                    <input
                      type='text'
                      value={uploadFilename}
                      onChange={e => setUploadFilename(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='file.txt'
                    />
                  </div>
                </div>
              </div>

              {/* Optional Metadata */}
              <div className='bg-violet-50 border border-violet-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-violet-800 mb-2'>Metadata & Retention</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Access Level</label>
                    <select
                      value={uploadAccessLevel}
                      onChange={e => setUploadAccessLevel(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {ACCESS_LEVELS.map(a => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Tags (comma-sep)</label>
                    <input
                      type='text'
                      value={uploadTags}
                      onChange={e => setUploadTags(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='tag1, tag2'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Custom Path</label>
                    <input
                      type='text'
                      value={uploadCustomPath}
                      onChange={e => setUploadCustomPath(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='/custom/path'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>TTL (seconds)</label>
                    <input
                      type='number'
                      value={uploadTtl}
                      onChange={e => setUploadTtl(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='3600'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Retention Policy ID</label>
                    <input
                      type='text'
                      value={uploadRetentionPolicyId}
                      onChange={e => setUploadRetentionPolicyId(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='policy-id'
                    />
                  </div>
                  <div className='flex items-end'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={uploadImmutable}
                        onChange={e => setUploadImmutable(e.target.checked)}
                      />
                      Immutable
                    </label>
                  </div>
                </div>
              </div>

              {/* Multi-tenancy & Routing */}
              <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-blue-800 mb-2'>
                  Multi-tenancy & Routing
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Tenant</label>
                    <input
                      type='text'
                      value={uploadTenant}
                      onChange={e => setUploadTenant(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='tenant-slug'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Organization ID</label>
                    <input
                      type='text'
                      value={uploadOrganizationId}
                      onChange={e => setUploadOrganizationId(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='org-id'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Organization Tier</label>
                    <select
                      value={uploadOrganizationTier}
                      onChange={e => setUploadOrganizationTier(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      <option value=''>(none)</option>
                      {ORGANIZATION_TIERS.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Business Model</label>
                    <select
                      value={uploadBusinessModel}
                      onChange={e => setUploadBusinessModel(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      <option value=''>(none)</option>
                      {BUSINESS_MODELS.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Environment</label>
                    <select
                      value={uploadEnvironment}
                      onChange={e => setUploadEnvironment(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {ENVIRONMENTS.map(e => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Region</label>
                    <input
                      type='text'
                      value={uploadRegion}
                      onChange={e => setUploadRegion(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='weur, use1'
                    />
                  </div>
                </div>
              </div>

              {/* Storage Overrides */}
              <div className='bg-cyan-50 border border-cyan-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-cyan-800 mb-2'>Storage Overrides</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Bucket Override</label>
                    <input
                      type='text'
                      value={uploadBucketOverride}
                      onChange={e => setUploadBucketOverride(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='bucket-name'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Adapter Override</label>
                    <select
                      value={uploadAdapterOverride}
                      onChange={e => setUploadAdapterOverride(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      <option value=''>(auto)</option>
                      {ADAPTER_TYPES.map(a => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Compliance (R2) */}
              <div className='bg-rose-50 border border-rose-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-rose-800 mb-2'>
                  Compliance Documents (R2)
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Document Type</label>
                    <select
                      value={uploadDocumentType}
                      onChange={e => setUploadDocumentType(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      <option value=''>(none)</option>
                      {DOCUMENT_TYPES.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Document ID</label>
                    <input
                      type='text'
                      value={uploadDocumentId}
                      onChange={e => setUploadDocumentId(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='doc-id'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Document Slug</label>
                    <input
                      type='text'
                      value={uploadDocumentSlug}
                      onChange={e => setUploadDocumentSlug(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='human-readable-name'
                    />
                  </div>
                </div>
              </div>

              {/* Media (Supabase) */}
              <div className='bg-emerald-50 border border-emerald-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-emerald-800 mb-2'>
                  Media Files (Supabase)
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Media Entity</label>
                    <select
                      value={uploadMediaEntity}
                      onChange={e => setUploadMediaEntity(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      <option value=''>(none)</option>
                      {MEDIA_ENTITIES.map(m => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Visibility</label>
                    <select
                      value={uploadVisibility}
                      onChange={e => setUploadVisibility(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {VISIBILITIES.map(v => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Variant Name</label>
                    <select
                      value={uploadVariantName}
                      onChange={e => setUploadVariantName(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      <option value=''>(none)</option>
                      {VARIANT_NAMES.map(v => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Presets & Variants */}
              <div className='bg-amber-50 border border-amber-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-amber-800 mb-2'>
                  Presets & Device Optimization
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Preset</label>
                    <select
                      value={uploadPreset}
                      onChange={e => setUploadPreset(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {PRESETS.map(p => (
                        <option key={p} value={p}>
                          {p || '(none)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Target Device</label>
                    <select
                      value={uploadDevice}
                      onChange={e => setUploadDevice(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {DEVICE_TYPES.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='flex items-end'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={uploadAllDevices}
                        onChange={e => setUploadAllDevices(e.target.checked)}
                      />
                      Generate All Devices
                    </label>
                  </div>
                </div>
              </div>

              {/* Processing & Queue */}
              <div className='bg-fuchsia-50 border border-fuchsia-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-fuchsia-800 mb-2'>Processing & Queue</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div className='flex items-center gap-4'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={uploadExtractMetadata}
                        onChange={e => setUploadExtractMetadata(e.target.checked)}
                      />
                      Extract Metadata
                    </label>
                  </div>
                  <div className='flex items-center gap-4'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={uploadVirusScan}
                        onChange={e => setUploadVirusScan(e.target.checked)}
                      />
                      Virus Scan
                    </label>
                  </div>
                  <div className='flex items-center gap-4'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={uploadProcessMedia}
                        onChange={e => setUploadProcessMedia(e.target.checked)}
                      />
                      Process Media
                    </label>
                  </div>
                  <div className='flex items-center gap-4'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={uploadUseQueue}
                        onChange={e => setUploadUseQueue(e.target.checked)}
                      />
                      Use Queue
                    </label>
                  </div>
                  {uploadUseQueue && (
                    <div>
                      <label className='block text-gray-700 mb-1 text-xs'>Queue Priority</label>
                      <select
                        value={uploadQueuePriority}
                        onChange={e => setUploadQueuePriority(e.target.value)}
                        className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      >
                        {QUEUE_PRIORITIES.map(p => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Template-Based Generation */}
              <div className='bg-indigo-50 border border-indigo-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-indigo-800 mb-2'>
                  Template Generation (generates + uploads)
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div className='col-span-2'>
                    <label className='block text-gray-700 mb-1 text-xs'>Template ID</label>
                    <select
                      value={uploadTemplateId}
                      onChange={e => setUploadTemplateId(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      <option value=''>(none - direct upload)</option>
                      {TEMPLATE_IDS.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Output Format</label>
                    <select
                      value={uploadOutputFormat}
                      onChange={e => setUploadOutputFormat(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {OUTPUT_FORMATS.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Locale</label>
                    <input
                      type='text'
                      value={uploadLocale}
                      onChange={e => setUploadLocale(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='en'
                    />
                  </div>
                  <div className='col-span-2'>
                    <label className='block text-gray-700 mb-1 text-xs'>Renderer</label>
                    <select
                      value={uploadRendererName}
                      onChange={e => setUploadRendererName(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {RENDERERS.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                          {r.recommended ? ` - ${r.recommended}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className='text-xs text-gray-500 mt-1'>
                      {RENDERERS.find(r => r.id === uploadRendererName)?.description ??
                        RENDERERS[0].description}
                    </p>
                  </div>
                  {uploadOutputFormat === 'pdf' && (
                    <>
                      <div>
                        <label className='block text-gray-700 mb-1 text-xs'>PDF Format</label>
                        <select
                          value={uploadPdfFormat}
                          onChange={e => setUploadPdfFormat(e.target.value)}
                          className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                        >
                          {PDF_FORMATS.map(f => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='flex items-end gap-4'>
                        <label className='flex items-center gap-2 text-xs text-gray-700'>
                          <input
                            type='checkbox'
                            checked={uploadPdfLandscape}
                            onChange={e => setUploadPdfLandscape(e.target.checked)}
                          />
                          Landscape
                        </label>
                        <label className='flex items-center gap-2 text-xs text-gray-700'>
                          <input
                            type='checkbox'
                            checked={uploadPdfPrintBackground}
                            onChange={e => setUploadPdfPrintBackground(e.target.checked)}
                          />
                          Print Background
                        </label>
                        <label className='flex items-center gap-2 text-xs text-gray-700'>
                          <input
                            type='checkbox'
                            checked={uploadPdfDisplayHeaderFooter}
                            onChange={e => setUploadPdfDisplayHeaderFooter(e.target.checked)}
                          />
                          Header/Footer
                        </label>
                      </div>
                    </>
                  )}
                </div>
                {/* PDF Advanced Options (shown when PDF format and header/footer enabled) */}
                {uploadOutputFormat === 'pdf' && uploadPdfDisplayHeaderFooter && (
                  <div className='mt-3 bg-indigo-100/50 rounded p-2'>
                    <h5 className='text-xs font-medium text-indigo-800 mb-2'>
                      Header/Footer Templates
                    </h5>
                    <div className='grid grid-cols-3 gap-3 mb-3'>
                      <div>
                        <label className='block text-gray-600 mb-1 text-xs'>Layout Locale</label>
                        <select
                          value={uploadPdfLayoutLocale}
                          onChange={e => setUploadPdfLayoutLocale(e.target.value)}
                          className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                        >
                          {LAYOUT_LOCALES.map(l => (
                            <option key={l} value={l}>
                              {l.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <p className='text-xs text-gray-500 mt-1'>Language for layout templates</p>
                      </div>
                      <div>
                        <label className='block text-gray-600 mb-1 text-xs'>Header Template</label>
                        <select
                          value={uploadPdfHeaderTemplate}
                          onChange={e => setUploadPdfHeaderTemplate(e.target.value)}
                          className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                        >
                          {HEADER_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <p className='text-xs text-gray-500 mt-1'>
                          {HEADER_TEMPLATES.find(t => t.id === uploadPdfHeaderTemplate)
                            ?.description ?? HEADER_TEMPLATES[0].description}
                        </p>
                      </div>
                      <div>
                        <label className='block text-gray-600 mb-1 text-xs'>Footer Template</label>
                        <select
                          value={uploadPdfFooterTemplate}
                          onChange={e => setUploadPdfFooterTemplate(e.target.value)}
                          className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                        >
                          {FOOTER_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <p className='text-xs text-gray-500 mt-1'>
                          {FOOTER_TEMPLATES.find(t => t.id === uploadPdfFooterTemplate)
                            ?.description ?? FOOTER_TEMPLATES[0].description}
                        </p>
                      </div>
                    </div>
                    <p className='text-xs text-gray-500'>
                      Templates are loaded from{' '}
                      <code className='bg-gray-100 px-1'>layouts/{uploadPdfLayoutLocale}/</code>.
                      Use <code className='bg-gray-100 px-1'>pageNumber</code>,{' '}
                      <code className='bg-gray-100 px-1'>totalPages</code>,{' '}
                      <code className='bg-gray-100 px-1'>date</code> as class names.
                    </p>
                  </div>
                )}
                {/* PDF Margins (optional) */}
                {uploadOutputFormat === 'pdf' && (
                  <div className='mt-3'>
                    <details className='bg-indigo-100/30 rounded p-2'>
                      <summary className='text-xs font-medium text-indigo-800 cursor-pointer'>
                        PDF Margins & Scale (optional)
                      </summary>
                      <div className='grid grid-cols-5 gap-2 mt-2'>
                        <div>
                          <label className='block text-gray-600 mb-1 text-xs'>Top</label>
                          <input
                            type='text'
                            value={uploadPdfMarginTop}
                            onChange={e => setUploadPdfMarginTop(e.target.value)}
                            className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                            placeholder='0.5in'
                          />
                        </div>
                        <div>
                          <label className='block text-gray-600 mb-1 text-xs'>Right</label>
                          <input
                            type='text'
                            value={uploadPdfMarginRight}
                            onChange={e => setUploadPdfMarginRight(e.target.value)}
                            className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                            placeholder='0.5in'
                          />
                        </div>
                        <div>
                          <label className='block text-gray-600 mb-1 text-xs'>Bottom</label>
                          <input
                            type='text'
                            value={uploadPdfMarginBottom}
                            onChange={e => setUploadPdfMarginBottom(e.target.value)}
                            className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                            placeholder='0.5in'
                          />
                        </div>
                        <div>
                          <label className='block text-gray-600 mb-1 text-xs'>Left</label>
                          <input
                            type='text'
                            value={uploadPdfMarginLeft}
                            onChange={e => setUploadPdfMarginLeft(e.target.value)}
                            className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                            placeholder='0.5in'
                          />
                        </div>
                        <div>
                          <label className='block text-gray-600 mb-1 text-xs'>Scale</label>
                          <input
                            type='number'
                            value={uploadPdfScale}
                            onChange={e => setUploadPdfScale(e.target.value)}
                            className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                            placeholder='1'
                            step='0.1'
                            min='0.1'
                            max='2'
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* Upload Mode Indicator */}
              <div
                className={`rounded-md p-3 mb-3 ${uploadTemplateId ? 'bg-indigo-50 border border-indigo-200' : 'bg-green-50 border border-green-200'}`}
              >
                <div className='flex items-center gap-2'>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${uploadTemplateId ? 'bg-indigo-500' : 'bg-green-500'}`}
                  />
                  <span
                    className={`text-sm font-medium ${uploadTemplateId ? 'text-indigo-800' : 'text-green-800'}`}
                  >
                    {uploadTemplateId ? 'Template Generation Mode' : 'Direct Upload Mode'}
                  </span>
                </div>
                <p className='text-xs text-gray-600 mt-1'>
                  {uploadTemplateId ? (
                    <>
                      Will generate a <strong>{uploadOutputFormat.toUpperCase()}</strong> document
                      using template{' '}
                      <code className='bg-indigo-100 px-1 rounded'>{uploadTemplateId}</code>.
                      {uploadRendererName ? (
                        <>
                          {' '}
                          Using{' '}
                          <strong>
                            {RENDERERS.find(r => r.id === uploadRendererName)?.name ??
                              uploadRendererName}
                          </strong>{' '}
                          renderer.
                        </>
                      ) : (
                        <>
                          {' '}
                          Renderer: <strong>auto</strong> (server default).
                        </>
                      )}
                      {uploadOutputFormat === 'pdf' &&
                        ` PDF: ${uploadPdfFormat}${uploadPdfLandscape ? ' (Landscape)' : ''}.`}
                    </>
                  ) : (
                    <>
                      Will upload files directly with <strong>text/plain</strong> content. Set a
                      Template ID above to switch to template generation mode.
                    </>
                  )}
                </p>
              </div>

              {/* Upload Buttons */}
              <div className='flex gap-2 flex-wrap'>
                <FileActionButton
                  label={
                    uploadTemplateId
                      ? `Generate & Upload ${uploadOutputFormat.toUpperCase()}`
                      : 'Upload Single File'
                  }
                  color={uploadTemplateId ? 'indigo' : 'purple'}
                  disabled={loading}
                  actionType={uploadTemplateId ? 'generate' : 'upload'}
                  onAction={async operationId => {
                    const params = getUploadParams();

                    if (uploadTemplateId) {
                      // Template generation mode - use uploadFromTemplate hook
                      return uploadFromTemplate({
                        templateId: params.templateId as string,
                        templateData: {
                          invoiceNumber: 'INV-' + Date.now(),
                          date: new Date().toISOString().split('T')[0],
                          dueDate: new Date(
                            Date.now() +
                              DAYS_PER_MONTH *
                                HOURS_PER_DAY *
                                MINUTES_PER_HOUR *
                                SECONDS_PER_MINUTE *
                                MS_PER_SECOND
                          )
                            .toISOString()
                            .split('T')[0],
                          customer: {
                            name: 'John Doe',
                            email: 'john@example.com',
                            address: '123 Main St',
                          },
                          items: [
                            { description: 'Service A', quantity: 2, unitPrice: 100, total: 200 },
                            { description: 'Service B', quantity: 1, unitPrice: 150, total: 150 },
                          ],
                          subtotal: 350,
                          tax: 35,
                          total: 385,
                        },
                        outputFormat: params.outputFormat as 'html' | 'pdf' | 'xlsx' | 'docx',
                        locale: params.locale as string,
                        category: params.category as FILE_CATEGORY,
                        entityType: params.entityType as ENTITY_TYPE,
                        entityId: operationId,
                      });
                    } else {
                      // Direct upload mode - use upload() from useFileUpload hook
                      const mockContent = 'Hello, World! Generated at ' + new Date().toISOString();
                      const file = new File([mockContent], `test-upload-${Date.now()}.txt`, {
                        type: 'text/plain',
                      });
                      return upload(file, {
                        category: params.category as FILE_CATEGORY,
                        entityType: params.entityType as ENTITY_TYPE,
                        entityId: operationId,
                      });
                    }
                  }}
                />
                <FileActionButton
                  label={
                    uploadTemplateId
                      ? `Generate & Upload 3 ${uploadOutputFormat.toUpperCase()}s`
                      : 'Upload Multiple Files'
                  }
                  color={uploadTemplateId ? 'indigo' : 'blue'}
                  disabled={loading}
                  actionType='bulk'
                  onAction={async operationId => {
                    const params = getUploadParams();

                    if (uploadTemplateId) {
                      // Template generation mode - use uploadMultipleFromTemplate hook
                      const invoices = [
                        {
                          invoiceNumber: 'INV-' + Date.now() + '-1',
                          customer: { name: 'Alice Smith', email: 'alice@example.com' },
                          total: 150,
                        },
                        {
                          invoiceNumber: 'INV-' + Date.now() + '-2',
                          customer: { name: 'Bob Jones', email: 'bob@example.com' },
                          total: 275,
                        },
                        {
                          invoiceNumber: 'INV-' + Date.now() + '-3',
                          customer: { name: 'Carol White', email: 'carol@example.com' },
                          total: 420,
                        },
                      ];
                      const ext =
                        OUTPUT_FORMAT_EXTENSIONS[uploadOutputFormat] || `.${uploadOutputFormat}`;
                      const formatConfig = OUTPUT_FORMAT_CATEGORIES[uploadOutputFormat];
                      const bulkTimestamp = Date.now();
                      return uploadMultipleFromTemplate({
                        files: invoices.map((invoice, i) => ({
                          templateId: params.templateId as string,
                          templateData: {
                            ...invoice,
                            date: new Date().toISOString().split('T')[0],
                            dueDate: new Date(
                              Date.now() +
                                DAYS_PER_MONTH *
                                  HOURS_PER_DAY *
                                  MINUTES_PER_HOUR *
                                  SECONDS_PER_MINUTE *
                                  MS_PER_SECOND
                            )
                              .toISOString()
                              .split('T')[0],
                            items: [
                              {
                                description: 'Service',
                                quantity: 1,
                                unitPrice: invoice.total,
                                total: invoice.total,
                              },
                            ],
                            subtotal: invoice.total,
                            tax: invoice.total * SCALE_PDF_MIN,
                            total: invoice.total * SCALE_PDF_MAX,
                          },
                          outputFormat: params.outputFormat as 'html' | 'pdf' | 'xlsx' | 'docx',
                          locale: params.locale as string,
                          category: params.category as FILE_CATEGORY,
                          entityType: params.entityType as ENTITY_TYPE,
                          entityId: `${operationId}-${i + 1}`,
                          filename: `invoice-${bulkTimestamp}-${i + 1}${ext}`,
                          mimeType: formatConfig?.mimeType || 'application/pdf',
                        })),
                        options: { concurrency: 2, continueOnError: true },
                      });
                    } else {
                      // Direct upload mode - use uploadMultiple hook with File objects
                      const bulkDirectTimestamp = Date.now();
                      const mockFiles = [
                        new File(
                          ['File 1: ' + new Date().toISOString()],
                          `file1-${bulkDirectTimestamp}.txt`,
                          { type: 'text/plain' }
                        ),
                        new File(
                          ['File 2: ' + new Date().toISOString()],
                          `file2-${bulkDirectTimestamp}.txt`,
                          { type: 'text/plain' }
                        ),
                        new File(
                          ['File 3: ' + new Date().toISOString()],
                          `file3-${bulkDirectTimestamp}.txt`,
                          { type: 'text/plain' }
                        ),
                      ];
                      return uploadMultiple(mockFiles, {
                        category: params.category as FILE_CATEGORY,
                        entityType: params.entityType as ENTITY_TYPE,
                        entityId: operationId,
                      });
                    }
                  }}
                />
              </div>

              {/* Current Config Preview */}
              <details className='mt-4 bg-gray-50 border border-gray-200 rounded-md p-2'>
                <summary className='text-sm text-gray-700 cursor-pointer font-medium'>
                  View Current Upload Config
                </summary>
                <pre className='mt-2 text-xs text-gray-800 bg-gray-100 p-2 rounded overflow-auto max-h-48'>
                  {JSON.stringify(getUploadParams(), null, JSON_INDENT)}
                </pre>
              </details>
            </>
          )}
        </Section>

        {/* Document Generation */}
        <Section title='Document Generation (Download Only)' color='pink'>
          <p className='text-sm text-gray-600 mb-3'>
            Generate documents from templates for download only.
            <strong className='text-pink-700'>
              {' '}
              No upload to storage - returns base64 buffer for client-side download.
            </strong>
          </p>

          {/* Required Fields */}
          <div className='bg-pink-50 border border-pink-200 rounded-md p-3 mb-3'>
            <h4 className='text-xs font-semibold text-pink-800 mb-2'>Required Fields</h4>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-3 text-sm'>
              <div className='col-span-2'>
                <label className='block text-gray-700 mb-1 text-xs'>Template ID *</label>
                <select
                  value={generateTemplateId}
                  onChange={e => setGenerateTemplateId(e.target.value)}
                  className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                >
                  {TEMPLATE_IDS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-gray-700 mb-1 text-xs'>Output Format</label>
                <select
                  value={generateOutputFormat}
                  onChange={e => setGenerateOutputFormat(e.target.value)}
                  className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                >
                  {OUTPUT_FORMATS.map(f => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-gray-700 mb-1 text-xs'>Locale</label>
                <input
                  type='text'
                  value={generateLocale}
                  onChange={e => setGenerateLocale(e.target.value)}
                  className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                  placeholder='en'
                />
              </div>
              <div className='col-span-2'>
                <label className='block text-gray-700 mb-1 text-xs'>Renderer</label>
                <select
                  value={generateRendererName}
                  onChange={e => setGenerateRendererName(e.target.value)}
                  className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                >
                  {RENDERERS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.recommended ? ` - ${r.recommended}` : ''}
                    </option>
                  ))}
                </select>
                <p className='text-xs text-gray-500 mt-1'>
                  {RENDERERS.find(r => r.id === generateRendererName)?.description ??
                    RENDERERS[0].description}
                </p>
              </div>
            </div>
          </div>

          {/* Validation Options */}
          <div className='bg-fuchsia-50 border border-fuchsia-200 rounded-md p-3 mb-3'>
            <h4 className='text-xs font-semibold text-fuchsia-800 mb-2'>Validation Options</h4>
            <div className='flex gap-6 text-sm'>
              <label className='flex items-center gap-2 text-xs text-gray-700'>
                <input
                  type='checkbox'
                  checked={generateValidationEnabled}
                  onChange={e => setGenerateValidationEnabled(e.target.checked)}
                />
                Enable Validation
              </label>
              <label className='flex items-center gap-2 text-xs text-gray-700'>
                <input
                  type='checkbox'
                  checked={generateValidationStrict}
                  onChange={e => setGenerateValidationStrict(e.target.checked)}
                  disabled={!generateValidationEnabled}
                />
                Strict Mode (throw on error)
              </label>
            </div>
          </div>

          {/* PDF Options (shown when outputFormat is pdf) */}
          {generateOutputFormat === 'pdf' && (
            <>
              {/* Page & Layout */}
              <div className='bg-rose-50 border border-rose-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-rose-800 mb-2'>PDF Page & Layout</h4>
                <div className='grid grid-cols-2 md:grid-cols-6 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Page Format</label>
                    <select
                      value={generatePdfFormat}
                      onChange={e => setGeneratePdfFormat(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    >
                      {PDF_FORMATS.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Scale (0.1-2)</label>
                    <input
                      type='number'
                      step='0.1'
                      min='0.1'
                      max='2'
                      value={generatePdfScale}
                      onChange={e => setGeneratePdfScale(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                    />
                  </div>
                  <div className='flex items-end'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={generatePdfLandscape}
                        onChange={e => setGeneratePdfLandscape(e.target.checked)}
                      />
                      Landscape
                    </label>
                  </div>
                  <div className='flex items-end'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={generatePdfPrintBackground}
                        onChange={e => setGeneratePdfPrintBackground(e.target.checked)}
                      />
                      Print Background
                    </label>
                  </div>
                  <div className='flex items-end'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={generatePdfDisplayHeaderFooter}
                        onChange={e => setGeneratePdfDisplayHeaderFooter(e.target.checked)}
                      />
                      Header/Footer
                    </label>
                  </div>
                </div>
              </div>

              {/* Margins */}
              <div className='bg-red-50 border border-red-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-red-800 mb-2'>
                  PDF Margins (e.g., 10mm, 0.5in)
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Top</label>
                    <input
                      type='text'
                      value={generatePdfMarginTop}
                      onChange={e => setGeneratePdfMarginTop(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='10mm'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Right</label>
                    <input
                      type='text'
                      value={generatePdfMarginRight}
                      onChange={e => setGeneratePdfMarginRight(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='10mm'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Bottom</label>
                    <input
                      type='text'
                      value={generatePdfMarginBottom}
                      onChange={e => setGeneratePdfMarginBottom(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='10mm'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Left</label>
                    <input
                      type='text'
                      value={generatePdfMarginLeft}
                      onChange={e => setGeneratePdfMarginLeft(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='10mm'
                    />
                  </div>
                </div>
              </div>

              {/* Header & Footer Templates (conditional) */}
              {generatePdfDisplayHeaderFooter && (
                <div className='bg-orange-50 border border-orange-200 rounded-md p-3 mb-3'>
                  <h4 className='text-xs font-semibold text-orange-800 mb-2'>
                    Header & Footer Templates
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3'>
                    <div>
                      <label className='block text-gray-700 mb-1 text-xs'>Layout Locale</label>
                      <select
                        value={generatePdfLayoutLocale}
                        onChange={e => setGeneratePdfLayoutLocale(e.target.value)}
                        className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      >
                        {LAYOUT_LOCALES.map(l => (
                          <option key={l} value={l}>
                            {l.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <p className='text-xs text-gray-500 mt-1'>Language for layout templates</p>
                    </div>
                    <div>
                      <label className='block text-gray-700 mb-1 text-xs'>Header Template</label>
                      <select
                        value={generatePdfHeaderTemplate}
                        onChange={e => setGeneratePdfHeaderTemplate(e.target.value)}
                        className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      >
                        {HEADER_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <p className='text-xs text-gray-500 mt-1'>
                        {HEADER_TEMPLATES.find(t => t.id === generatePdfHeaderTemplate)
                          ?.description ?? HEADER_TEMPLATES[0].description}
                      </p>
                    </div>
                    <div>
                      <label className='block text-gray-700 mb-1 text-xs'>Footer Template</label>
                      <select
                        value={generatePdfFooterTemplate}
                        onChange={e => setGeneratePdfFooterTemplate(e.target.value)}
                        className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      >
                        {FOOTER_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <p className='text-xs text-gray-500 mt-1'>
                        {FOOTER_TEMPLATES.find(t => t.id === generatePdfFooterTemplate)
                          ?.description ?? FOOTER_TEMPLATES[0].description}
                      </p>
                    </div>
                  </div>
                  <p className='text-xs text-gray-500'>
                    Templates are loaded from{' '}
                    <code className='bg-gray-100 px-1'>layouts/{generatePdfLayoutLocale}/</code>
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className='bg-amber-50 border border-amber-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-amber-800 mb-2'>PDF Metadata</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Title</label>
                    <input
                      type='text'
                      value={generatePdfMetaTitle}
                      onChange={e => setGeneratePdfMetaTitle(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='Document Title'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Author</label>
                    <input
                      type='text'
                      value={generatePdfMetaAuthor}
                      onChange={e => setGeneratePdfMetaAuthor(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='Author Name'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Subject</label>
                    <input
                      type='text'
                      value={generatePdfMetaSubject}
                      onChange={e => setGeneratePdfMetaSubject(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='Subject'
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>
                      Keywords (comma-separated)
                    </label>
                    <input
                      type='text'
                      value={generatePdfMetaKeywords}
                      onChange={e => setGeneratePdfMetaKeywords(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='invoice, finance, report'
                    />
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div className='bg-cyan-50 border border-cyan-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-cyan-800 mb-2'>Watermark</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  <div className='flex items-end'>
                    <label className='flex items-center gap-2 text-xs text-gray-700'>
                      <input
                        type='checkbox'
                        checked={generatePdfWatermarkEnabled}
                        onChange={e => setGeneratePdfWatermarkEnabled(e.target.checked)}
                      />
                      Enable Watermark
                    </label>
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Text</label>
                    <input
                      type='text'
                      value={generatePdfWatermarkText}
                      onChange={e => setGeneratePdfWatermarkText(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      placeholder='CONFIDENTIAL'
                      disabled={!generatePdfWatermarkEnabled}
                    />
                  </div>
                  <div>
                    <label className='block text-gray-700 mb-1 text-xs'>Opacity (0-1)</label>
                    <input
                      type='number'
                      step='0.1'
                      min='0'
                      max='1'
                      value={generatePdfWatermarkOpacity}
                      onChange={e => setGeneratePdfWatermarkOpacity(e.target.value)}
                      className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white'
                      disabled={!generatePdfWatermarkEnabled}
                    />
                  </div>
                </div>
              </div>

              {/* Custom CSS */}
              <div className='bg-violet-50 border border-violet-200 rounded-md p-3 mb-3'>
                <h4 className='text-xs font-semibold text-violet-800 mb-2'>Custom CSS</h4>
                <textarea
                  value={generatePdfCss}
                  onChange={e => setGeneratePdfCss(e.target.value)}
                  className='w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs bg-white h-20'
                  placeholder='body { font-family: Arial; } .invoice-header { background: #f0f0f0; }'
                />
              </div>
            </>
          )}

          {/* Template Data Info */}
          <div className='bg-gray-50 border border-gray-200 rounded-md p-3 mb-3'>
            <h4 className='text-xs font-semibold text-gray-700 mb-2'>Template Data (sample)</h4>
            <pre className='text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-24'>
              {`{
  invoiceNumber: "INV-${Date.now()}",
  date: "${new Date().toISOString().split('T')[0]}",
  customerName: "Test Customer",
  items: [...],
  total: 200
}`}
            </pre>
          </div>

          {/* Config Preview */}
          <details className='mb-3 bg-gray-50 border border-gray-200 rounded-md p-2'>
            <summary className='text-sm text-gray-700 cursor-pointer font-medium'>
              View Current Generate Config
            </summary>
            <pre className='mt-2 text-xs text-gray-800 bg-gray-100 p-2 rounded overflow-auto max-h-48'>
              {JSON.stringify(
                {
                  templateId: generateTemplateId,
                  outputFormat: generateOutputFormat,
                  locale: generateLocale,
                  ...(generateRendererName ? { rendererName: generateRendererName } : {}),
                  validation: {
                    enabled: generateValidationEnabled,
                    strict: generateValidationStrict,
                  },
                  ...(generateOutputFormat === 'pdf'
                    ? {
                        pdfOptions: {
                          format: generatePdfFormat,
                          orientation: generatePdfLandscape ? 'landscape' : 'portrait',
                          scale: Number(generatePdfScale) || 1,
                          printBackground: generatePdfPrintBackground,
                          displayHeaderFooter: generatePdfDisplayHeaderFooter,
                          ...(generatePdfMarginTop ||
                          generatePdfMarginRight ||
                          generatePdfMarginBottom ||
                          generatePdfMarginLeft
                            ? {
                                margins: {
                                  ...(generatePdfMarginTop ? { top: generatePdfMarginTop } : {}),
                                  ...(generatePdfMarginRight
                                    ? { right: generatePdfMarginRight }
                                    : {}),
                                  ...(generatePdfMarginBottom
                                    ? { bottom: generatePdfMarginBottom }
                                    : {}),
                                  ...(generatePdfMarginLeft ? { left: generatePdfMarginLeft } : {}),
                                },
                              }
                            : {}),
                          ...(generatePdfDisplayHeaderFooter
                            ? {
                                ...(generatePdfHeaderTemplate
                                  ? { headerTemplate: generatePdfHeaderTemplate }
                                  : {}),
                                ...(generatePdfFooterTemplate
                                  ? { footerTemplate: generatePdfFooterTemplate }
                                  : {}),
                              }
                            : {}),
                          ...(generatePdfMetaTitle ||
                          generatePdfMetaAuthor ||
                          generatePdfMetaSubject ||
                          generatePdfMetaKeywords
                            ? {
                                metadata: {
                                  ...(generatePdfMetaTitle ? { title: generatePdfMetaTitle } : {}),
                                  ...(generatePdfMetaAuthor
                                    ? { author: generatePdfMetaAuthor }
                                    : {}),
                                  ...(generatePdfMetaSubject
                                    ? { subject: generatePdfMetaSubject }
                                    : {}),
                                  ...(generatePdfMetaKeywords
                                    ? { keywords: generatePdfMetaKeywords }
                                    : {}),
                                },
                              }
                            : {}),
                          ...(generatePdfCss ? { css: generatePdfCss } : {}),
                          ...(generatePdfWatermarkEnabled
                            ? {
                                watermark: {
                                  enabled: true,
                                  text: generatePdfWatermarkText,
                                  opacity: Number(generatePdfWatermarkOpacity) || SCALE_PDF_DEFAULT,
                                },
                              }
                            : {}),
                        },
                      }
                    : {}),
                },
                null,
                JSON_INDENT
              )}
            </pre>
          </details>

          <div className='flex gap-2 flex-wrap'>
            <FileActionButton
              label={`Generate ${generateOutputFormat.toUpperCase()} Document`}
              color='pink'
              disabled={loading}
              actionType='generate'
              onAction={async () => {
                // Generate-only (no storage upload)
                // Build PDF options
                const pdfOptions: Record<string, unknown> = {
                  format: generatePdfFormat,
                  orientation: generatePdfLandscape ? 'landscape' : 'portrait',
                  scale: Number(generatePdfScale) || 1,
                  printBackground: generatePdfPrintBackground,
                  displayHeaderFooter: generatePdfDisplayHeaderFooter,
                };

                // Add margins if any are set
                if (
                  generatePdfMarginTop ||
                  generatePdfMarginRight ||
                  generatePdfMarginBottom ||
                  generatePdfMarginLeft
                ) {
                  pdfOptions.margins = {
                    ...(generatePdfMarginTop ? { top: generatePdfMarginTop } : {}),
                    ...(generatePdfMarginRight ? { right: generatePdfMarginRight } : {}),
                    ...(generatePdfMarginBottom ? { bottom: generatePdfMarginBottom } : {}),
                    ...(generatePdfMarginLeft ? { left: generatePdfMarginLeft } : {}),
                  };
                }

                // Add header/footer templates if enabled
                if (generatePdfDisplayHeaderFooter) {
                  if (generatePdfHeaderTemplate)
                    pdfOptions.headerTemplate = generatePdfHeaderTemplate;
                  if (generatePdfFooterTemplate)
                    pdfOptions.footerTemplate = generatePdfFooterTemplate;
                }

                // Add metadata if any are set
                if (
                  generatePdfMetaTitle ||
                  generatePdfMetaAuthor ||
                  generatePdfMetaSubject ||
                  generatePdfMetaKeywords
                ) {
                  pdfOptions.metadata = {
                    ...(generatePdfMetaTitle ? { title: generatePdfMetaTitle } : {}),
                    ...(generatePdfMetaAuthor ? { author: generatePdfMetaAuthor } : {}),
                    ...(generatePdfMetaSubject ? { subject: generatePdfMetaSubject } : {}),
                    ...(generatePdfMetaKeywords ? { keywords: generatePdfMetaKeywords } : {}),
                  };
                }

                // Add CSS if set
                if (generatePdfCss) pdfOptions.css = generatePdfCss;

                // Add watermark if enabled
                if (generatePdfWatermarkEnabled) {
                  pdfOptions.watermark = {
                    enabled: true,
                    text: generatePdfWatermarkText,
                    opacity: Number(generatePdfWatermarkOpacity) || SCALE_PDF_DEFAULT,
                  };
                }

                // Use generate hook with all advanced options
                return generate({
                  templateId: generateTemplateId,
                  templateData: {
                    invoiceNumber: 'INV-' + Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    customerName: 'Test Customer',
                    items: [
                      { description: 'Service A', quantity: 1, price: 100 },
                      { description: 'Service B', quantity: 2, price: 50 },
                    ],
                    total: 200,
                  },
                  outputFormat: generateOutputFormat as 'pdf' | 'html' | 'docx' | 'xlsx',
                  locale: generateLocale,
                  rendererName: generateRendererName || undefined,
                  validation: {
                    enabled: generateValidationEnabled,
                    strict: generateValidationStrict,
                  },
                  pdfOptions: generateOutputFormat === 'pdf' ? pdfOptions : undefined,
                });
              }}
            />
          </div>
        </Section>

        {/* Bulk Operations */}
        <Section title='Files Bulk Operations' color='teal'>
          <p className='text-sm text-gray-600 mb-3'>
            POST/DELETE /api/files/bulk - Bulk operations on multiple files.
          </p>
          <div className='flex gap-2 flex-wrap'>
            <Button
              onClick={() =>
                runAction('Bulk Delete', async () => {
                  const res = await fetch('/api/files/bulk', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: ['file-1', 'file-2', 'file-3'], soft: true }),
                  });
                  return res.json();
                })
              }
              disabled={loading}
              color='rose'
            >
              Bulk Delete (IDs: file-1,2,3)
            </Button>
          </div>
        </Section>

        {/* Files Events Log */}
        <Section title='Files Events Log' color='orange'>
          <p className='text-sm text-gray-600 mb-3'>
            Live events from the files service. Events fire during file operations.
          </p>
          <Button onClick={() => setFilesEvents([])} color='gray'>
            Clear Events
          </Button>
          <div className='mt-3'>
            {filesEvents.length === 0 ? (
              <p className='text-sm text-gray-500 italic'>
                No events yet. Try the file operations above to see events.
              </p>
            ) : (
              <DataViewer
                data={filesEvents.map(log => ({
                  time: log.time,
                  event: log.event,
                  data: typeof log.data === 'object' ? JSON.stringify(log.data) : String(log.data),
                }))}
                title={`Files Events (${filesEvents.length})`}
                defaultView='table'
                maxHeight='200px'
              />
            )}
          </div>
        </Section>

        {/* Result Display */}
        <Section title='Files Result' color='gray'>
          {loading && (
            <div className='flex items-center gap-2 text-blue-600 mb-3'>
              <Spinner />
              <span>Running: {lastAction}...</span>
            </div>
          )}

          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-3 text-red-700 mb-3'>
              <strong>Error ({lastAction}):</strong>
              <pre className='mt-1 text-sm whitespace-pre-wrap'>{error}</pre>
            </div>
          )}

          {result !== null && !error && (
            <div>
              <DataViewer
                data={result}
                title={`Result: ${lastAction}`}
                defaultView={Array.isArray(result) ? 'table' : 'json'}
                maxHeight='350px'
              />
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

/**
 * Notifications API Test Suite
 *
 * Tests the notifications API endpoints:
 * - GET /api/notifications - List all notifications
 * - DELETE /api/notifications/:id - Delete a notification
 *
 * NOTE: Notifications are created via backend only (e.g., when sending emails).
 * Frontend only has read (list) and delete operations.
 */
function NotificationsApiTestSuite() {
  const notificationsService =
    useService<FrontendNotificationsDomainService>('notifications-frontend');
  const exampleService = useService<FrontendExampleDomainService>('example-frontend');
  const notificationsList = useNotifications();
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>('');
  const [selectedId, setSelectedId] = useState('');
  // Query filters for notifications
  const [queryChannel, setQueryChannel] = useState<string>('IN_APP');
  const [queryStatus, setQueryStatus] = useState<string>('');
  const [emailTo, setEmailTo] = useState('test@example.com');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTemplateId, setEmailTemplateId] = useState('order-completed');
  const [emailLocale, setEmailLocale] = useState('en');
  const [createInAppNotification, setCreateInAppNotification] = useState(true);
  // Template variable defaults - maps template ID to its expected variables
  // Template ID is just the template name (e.g., 'order-completed')
  const templateDefaults: Record<string, object> = useMemo(
    () => ({
      // Order completed template (same variables work for all locales)
      'order-completed': {
        customerName: 'John Doe',
        orderNumber: 'ORD-12345',
        orderDate: new Date().toISOString().split('T')[0],
        totalAmount: '99.99',
        items: [
          { name: 'Product A', quantity: 2, price: '29.99' },
          { name: 'Product B', quantity: 1, price: '40.01' },
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'USA',
        },
        estimatedDelivery: '3-5 business days',
        trackingUrl: 'https://example.com/track/ORD-12345',
      },
      // Transactional receipt
      'transactional-receipt': {
        orderNumber: 'ORD-12345',
        orderDate: new Date().toISOString().split('T')[0],
        totalAmount: '$99.99',
        items: [
          { name: 'Product A', quantity: 2, price: '$29.99', subtotal: '$59.98' },
          { name: 'Product B', quantity: 1, price: '$40.01', subtotal: '$40.01' },
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
      },
      // Welcome HTML
      'welcome-html': {
        userName: 'John Doe',
        activationUrl: 'https://example.com/activate/abc123',
        supportEmail: 'support@example.com',
      },
      // Marketing newsletter
      'marketing-newsletter': {
        recipientName: 'Valued Customer',
        featuredProduct: {
          name: 'New Product',
          description: 'Amazing new features',
          price: '$49.99',
          imageUrl: 'https://via.placeholder.com/300',
        },
        promotionCode: 'SAVE20',
        promotionExpiry: '2024-12-31',
      },
      // Minimal notification
      'minimal-notification': {
        title: 'New Notification',
        summary: 'You have a new notification',
        message: 'This is the notification message content.',
        actionUrl: 'https://example.com/notifications',
      },
      // Styled newsletter
      'styled-newsletter': {
        recipientName: 'Subscriber',
        headline: 'Weekly Newsletter',
        articles: [
          {
            title: 'Article 1',
            summary: 'First article summary',
            url: 'https://example.com/article1',
          },
          {
            title: 'Article 2',
            summary: 'Second article summary',
            url: 'https://example.com/article2',
          },
        ],
      },
    }),
    []
  );

  const [emailTemplateData, setEmailTemplateData] = useState(
    JSON.stringify(templateDefaults['order-completed'], null, JSON_INDENT)
  );

  // Header/footer selection
  const [emailHeader, setEmailHeader] = useState('transactional');
  const [emailFooter, setEmailFooter] = useState('transactional');

  // Notification type for IN_APP notification
  const [notificationType, setNotificationType] = useState('SYSTEM');

  // Available notification types (matching DB enum from migration 006)
  const notificationTypes = [
    { id: 'SYSTEM', name: 'System' },
    { id: 'CAMPAIGN_BACKED', name: 'Campaign Backed' },
    { id: 'NEW_FOLLOWER', name: 'New Follower' },
    { id: 'POST_LIKED', name: 'Post Liked' },
    { id: 'POST_COMMENTED', name: 'Post Commented' },
    { id: 'COMMENT_REPLY', name: 'Comment Reply' },
    { id: 'CAMPAIGN_UPDATE', name: 'Campaign Update' },
    { id: 'PAYMENT_RECEIVED', name: 'Payment Received' },
    { id: 'PAYMENT_FAILED', name: 'Payment Failed' },
    { id: 'ACHIEVEMENT_UNLOCKED', name: 'Achievement Unlocked' },
    { id: 'MILESTONE_REACHED', name: 'Milestone Reached' },
    { id: 'CAMPAIGN_FUNDED', name: 'Campaign Funded' },
    { id: 'SUBSCRIPTION_RENEWED', name: 'Subscription Renewed' },
    { id: 'SUBSCRIPTION_CANCELED', name: 'Subscription Canceled' },
  ];

  // Available headers/footers by layout type
  const emailHeaders = [
    { id: 'transactional', name: 'Transactional' },
    { id: 'branded', name: 'Branded' },
    { id: 'minimal', name: 'Minimal' },
    { id: '', name: 'None' },
  ];
  const emailFooters = [
    { id: 'transactional', name: 'Transactional' },
    { id: 'branded', name: 'Branded' },
    { id: 'minimal', name: 'Minimal' },
    { id: '', name: 'None' },
  ];

  // Update template data when template changes
  const handleTemplateChange = useCallback(
    (templateId: string) => {
      setEmailTemplateId(templateId);
      const defaults = templateDefaults[templateId];
      if (defaults) {
        setEmailTemplateData(JSON.stringify(defaults, null, JSON_INDENT));
      }
    },
    [templateDefaults]
  );

  // Email templates by locale
  // Template ID is just the template name - locale is passed separately
  // Path: templates/{locale}/email/{templateId}.md
  const emailTemplates: Record<string, { id: string; name: string }[]> = {
    en: [
      { id: 'order-completed', name: 'Order Completed' },
      { id: 'transactional-receipt', name: 'Transactional Receipt' },
      { id: 'welcome-html', name: 'Welcome (HTML)' },
      { id: 'marketing-newsletter', name: 'Marketing Newsletter' },
      { id: 'minimal-notification', name: 'Minimal Notification' },
      { id: 'styled-newsletter', name: 'Styled Newsletter' },
    ],
    es: [{ id: 'order-completed', name: 'Order Completed (ES)' }],
    it: [{ id: 'order-completed', name: 'Order Completed (IT)' }],
  };

  const runAction = useCallback(async (actionName: string, action: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    setLastAction(actionName);
    try {
      const res = await action();
      setResult(res);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err));
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  if (!notificationsService) {
    return (
      <div className='bg-yellow-50 border border-yellow-300 rounded p-4 text-yellow-800 mt-6'>
        <h3 className='font-semibold mb-2'>Notifications Service</h3>
        <p>Notifications service not available. Check PlyazProvider configuration.</p>
      </div>
    );
  }

  return (
    <div className='mt-8 pt-8 border-t-2 border-amber-200'>
      <h3 className='text-xl font-bold text-amber-800 mb-6 flex items-center gap-2'>
        Notifications API Tests
        <span className='bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded'>IN_APP Only</span>
      </h3>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Fetch Operations */}
        <Section title='Notifications Fetch Operations' color='amber'>
          <p className='text-sm text-gray-600 mb-3'>
            GET /api/notifications - Fetch all in-app notifications for the current user.
          </p>
          {/* Query Filters */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-4'>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>Channel:</label>
              <select
                value={queryChannel}
                onChange={e => setQueryChannel(e.target.value)}
                className='w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white'
              >
                <option value=''>All Channels</option>
                <option value='IN_APP'>IN_APP</option>
                <option value='EMAIL'>EMAIL</option>
                <option value='SMS'>SMS</option>
                <option value='PUSH'>PUSH</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>Status:</label>
              <select
                value={queryStatus}
                onChange={e => setQueryStatus(e.target.value)}
                className='w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white'
              >
                <option value=''>All Statuses</option>
                <option value='queued'>Queued</option>
                <option value='processing'>Processing</option>
                <option value='sent'>Sent</option>
                <option value='delivered'>Delivered</option>
                <option value='failed'>Failed</option>
                <option value='bounced'>Bounced</option>
              </select>
            </div>
          </div>
          <div className='flex gap-2 flex-wrap'>
            <Button
              onClick={() =>
                runAction(
                  `Fetch Notifications${queryChannel ? ` (${queryChannel})` : ''}${queryStatus ? ` [${queryStatus}]` : ''}`,
                  () =>
                    notificationsService.fetchAll({
                      ...(queryChannel && {
                        channel: queryChannel as 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH',
                      }),
                      ...(queryStatus && {
                        status: queryStatus as
                          | 'queued'
                          | 'processing'
                          | 'sent'
                          | 'delivered'
                          | 'failed'
                          | 'bounced',
                      }),
                    })
                )
              }
              disabled={loading}
              color='amber'
            >
              Fetch {queryChannel || 'All'} {queryStatus && `(${queryStatus})`}
            </Button>
            <Button
              onClick={() => {
                setQueryChannel('IN_APP');
                setQueryStatus('');
              }}
              disabled={loading}
              color='gray'
            >
              Reset Filters
            </Button>
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            Store has {notificationsList.length} notification(s)
          </p>
        </Section>

        {/* Delete Operations */}
        <Section title='Notifications Delete Operations' color='red'>
          <p className='text-sm text-gray-600 mb-3'>
            DELETE /api/notifications/:id - Delete a notification by ID.
          </p>
          <div className='space-y-3'>
            <div className='flex gap-2 items-center'>
              <label className='text-sm text-gray-700 w-24'>Select ID:</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className='flex-1 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white'
              >
                <option value=''>-- Select a notification --</option>
                {notificationsList.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.type}: {n.title} ({n.id.slice(0, ID_TRUNCATE_LENGTH)}...)
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() =>
                runAction('Delete Notification', () => notificationsService.delete(selectedId))
              }
              disabled={loading || !selectedId}
              color='red'
            >
              Delete Selected
            </Button>
          </div>
        </Section>

        {/* Email Section - Send Email + Create IN_APP Notification */}
        <Section
          title='Send Email (+ IN_APP Notification)'
          color='purple'
          className='lg:col-span-2'
        >
          <p className='text-sm text-gray-600 mb-3'>
            POST /api/examples/email - Sends an email using notification templates AND creates an
            in-app notification.
          </p>
          <div className='bg-purple-50 border border-purple-200 rounded-md p-3 mb-4'>
            <p className='text-xs text-purple-700'>
              <strong>Flow:</strong> Select Template → Fill Data → Send Email → Create IN_APP
              Notification → Stream to Store
            </p>
          </div>

          {/* Template Selection Row */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
            <div>
              <label className='block text-sm text-gray-700 mb-1'>Locale:</label>
              <select
                value={emailLocale}
                onChange={e => {
                  setEmailLocale(e.target.value);
                  const templates = emailTemplates[e.target.value];
                  if (templates?.length) handleTemplateChange(templates[0].id);
                }}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white'
              >
                <option value='en'>English (en)</option>
                <option value='es'>Spanish (es)</option>
                <option value='it'>Italian (it)</option>
              </select>
            </div>
            <div className='md:col-span-2'>
              <label className='block text-sm text-gray-700 mb-1'>Email Template:</label>
              <select
                value={emailTemplateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white'
              >
                {(emailTemplates[emailLocale] || []).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Header/Footer Selection */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm text-gray-700 mb-1'>Header Layout:</label>
              <select
                value={emailHeader}
                onChange={e => setEmailHeader(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white'
              >
                {emailHeaders.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm text-gray-700 mb-1'>Footer Layout:</label>
              <select
                value={emailFooter}
                onChange={e => setEmailFooter(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white'
              >
                {emailFooters.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipient Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm text-gray-700 mb-1'>To Email:</label>
              <input
                type='email'
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white'
                placeholder='recipient@example.com'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-700 mb-1'>
                Subject Override (optional):
              </label>
              <input
                type='text'
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white'
                placeholder='Leave empty to use template subject'
              />
            </div>
          </div>

          {/* Template Data */}
          <div className='mb-4'>
            <label className='block text-sm text-gray-700 mb-1'>Template Data (JSON):</label>
            <textarea
              value={emailTemplateData}
              onChange={e => setEmailTemplateData(e.target.value)}
              className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white font-mono h-48'
              placeholder='{"key": "value"}'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Variables like {'{{customerName}}'}, {'{{orderNumber}}'} will be replaced with values
              from this data.
            </p>
          </div>

          {/* Options */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm text-gray-700 mb-1'>Notification Type:</label>
              <select
                value={notificationType}
                onChange={e => setNotificationType(e.target.value)}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white'
                disabled={!createInAppNotification}
              >
                {notificationTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center'>
              <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={createInAppNotification}
                  onChange={e => setCreateInAppNotification(e.target.checked)}
                  className='rounded border-gray-300'
                />
                Create IN_APP notification (streams to frontend)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3'>
            <Button
              onClick={() =>
                runAction('Send Email', async () => {
                  if (!exampleService)
                    throw new GenericError(
                      'Example service not available',
                      ERROR_CODES.ERROR_SYSTEM_NOT_INITIALIZED
                    );
                  let templateData = {};
                  try {
                    templateData = JSON.parse(emailTemplateData);
                  } catch {
                    throw new GenericError(
                      'Invalid JSON in template data',
                      ERROR_CODES.VALIDATION_ERROR
                    );
                  }
                  return exampleService.sendEmail(
                    {
                      to: emailTo,
                      subject: emailSubject || undefined,
                      templateId: emailTemplateId,
                      locale: emailLocale,
                      templateData,
                      createInAppNotification,
                      notificationType,
                      header: emailHeader || undefined,
                      footer: emailFooter || undefined,
                    },
                    { endpoint: '/examples/email' }
                  );
                })
              }
              disabled={loading || !emailTo}
              color='purple'
            >
              Send Email
            </Button>
          </div>
          <p className='text-xs text-gray-500 mt-3'>
            Check the Notifications Store section above to see the IN_APP notification appear in
            real-time via streaming.
          </p>
        </Section>

        {/* Result Display */}
        <Section title='Notifications Result' color='gray' className='lg:col-span-2'>
          {loading && (
            <div className='flex items-center gap-2 text-amber-600 mb-3'>
              <Spinner />
              <span>Running: {lastAction}...</span>
            </div>
          )}

          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-3 text-red-700 mb-3'>
              <strong>Error ({lastAction}):</strong>
              <pre className='mt-1 text-sm whitespace-pre-wrap'>{error}</pre>
            </div>
          )}

          {result !== null && !error && (
            <div>
              <DataViewer
                data={result}
                title={`Result: ${lastAction}`}
                defaultView={Array.isArray(result) ? 'table' : 'json'}
                maxHeight='300px'
              />
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

/**
 * Event System Demo
 *
 * Demonstrates the event system in @plyaz/core using CORE_EVENTS.
 *
 * ## Event Naming Convention
 * Events follow the format: `{scope}:{action}`
 * - `system:error` - System errors (CORE_EVENTS.SYSTEM.ERROR)
 * - `system:initialized` - Core initialized
 * - `api:request_error` - API request failed
 * - `entity:creating` - Entity being created
 * - `entity:created` - Entity created successfully
 * - `featureFlag:evaluated` - Feature flag evaluated
 */
function EventEmitterDemo() {
  const events = useEvents();
  const [serviceEvents, setServiceEvents] = useState<
    { event: string; data: unknown; time: string }[]
  >([]);
  const [globalEvents, setGlobalEvents] = useState<
    { event: string; data: unknown; time: string }[]
  >([]);

  useEffect(() => {
    const handleServiceEvent = (eventName: string) => (data: unknown) => {
      setServiceEvents(prev => [
        { event: eventName, data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, RECENT_EVENTS_LIMIT), // Keep last 20 events
      ]);
    };

    const handleGlobalEvent = (eventName: string) => (data: unknown) => {
      setGlobalEvents(prev => [
        { event: eventName, data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, RECENT_EVENTS_LIMIT),
      ]);
    };

    // Subscribe to service-specific events (example domain)
    const serviceUnsubscribers = [
      // Custom test event
      events.on('example:test', handleServiceEvent('example:test')),
      // Domain service events
      events.on('example:fetching', handleServiceEvent('example:fetching')),
      events.on('example:fetched', handleServiceEvent('example:fetched')),
      events.on('example:fetch:error', handleServiceEvent('example:fetch:error')),
      events.on('example:creating', handleServiceEvent('example:creating')),
      events.on('example:created', handleServiceEvent('example:created')),
      events.on('example:create:error', handleServiceEvent('example:create:error')),
      events.on('example:updating', handleServiceEvent('example:updating')),
      events.on('example:updated', handleServiceEvent('example:updated')),
      events.on('example:update:error', handleServiceEvent('example:update:error')),
      events.on('example:deleting', handleServiceEvent('example:deleting')),
      events.on('example:deleted', handleServiceEvent('example:deleted')),
      events.on('example:delete:error', handleServiceEvent('example:delete:error')),
      events.on('example:store:synced', handleServiceEvent('example:store:synced')),
      events.on('example:error', handleServiceEvent('example:error')),
    ];

    // Subscribe to global events (CORE_EVENTS format: {scope}:{action})
    const globalUnsubscribers = [
      // System events
      events.on('system:error', handleGlobalEvent('system:error')),
      events.on('system:initialized', handleGlobalEvent('system:initialized')),
      events.on('system:ready', handleGlobalEvent('system:ready')),
      events.on('system:warning', handleGlobalEvent('system:warning')),
      // API events
      events.on('api:request_start', handleGlobalEvent('api:request_start')),
      events.on('api:request_success', handleGlobalEvent('api:request_success')),
      events.on('api:request_error', handleGlobalEvent('api:request_error')),
      events.on('api:retry', handleGlobalEvent('api:retry')),
      // Entity events (generic CRUD)
      events.on('entity:creating', handleGlobalEvent('entity:creating')),
      events.on('entity:created', handleGlobalEvent('entity:created')),
      events.on('entity:updating', handleGlobalEvent('entity:updating')),
      events.on('entity:updated', handleGlobalEvent('entity:updated')),
      events.on('entity:deleting', handleGlobalEvent('entity:deleting')),
      events.on('entity:deleted', handleGlobalEvent('entity:deleted')),
      events.on('entity:error', handleGlobalEvent('entity:error')),
      // Validation events
      events.on('validation:failed', handleGlobalEvent('validation:failed')),
      // Feature flag events
      events.on('featureFlag:evaluated', handleGlobalEvent('featureFlag:evaluated')),
      events.on('featureFlag:changed', handleGlobalEvent('featureFlag:changed')),
    ];

    return () => {
      serviceUnsubscribers.forEach(unsub => unsub());
      globalUnsubscribers.forEach(unsub => unsub());
    };
  }, [events]);

  const emitTestEvent = () => {
    const eventData = { timestamp: new Date().toISOString(), source: 'client', action: 'test' };
    events.emit('example:test', eventData);
  };

  // Test throwing a global unhandled exception
  const throwGlobalException = () => {
    // This will be caught by the global error handler and emit system:error
    setTimeout(() => {
      throw new Error('Test unhandled exception - this should appear in global events!');
    }, 0);
  };

  return (
    <div className='mt-6 pt-6 border-t border-gray-200'>
      <h3 className='font-semibold mb-3 text-gray-900'>Event System</h3>

      <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm text-blue-800'>
        <strong>Event Naming:</strong> Events use format{' '}
        <code className='bg-blue-100 px-1 rounded'>{'{scope}:{action}'}</code>
        <ul className='list-disc list-inside mt-1 space-y-1'>
          <li>
            <code className='bg-blue-100 px-1 rounded'>system:error</code> - Global errors
          </li>
          <li>
            <code className='bg-blue-100 px-1 rounded'>api:request_error</code> - API errors
          </li>
          <li>
            <code className='bg-blue-100 px-1 rounded'>example:created</code> - Service events
          </li>
        </ul>
      </div>

      <div className='flex gap-2 flex-wrap mb-4'>
        <Button onClick={emitTestEvent} color='purple'>
          Emit Test Event
        </Button>
        <Button onClick={throwGlobalException} color='red'>
          Throw Global Exception
        </Button>
        <Button
          onClick={() => {
            setServiceEvents([]);
            setGlobalEvents([]);
          }}
          color='gray'
        >
          Clear Events
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Service Events */}
        <div>
          {serviceEvents.length === 0 ? (
            <>
              <strong className='text-sm text-gray-700 block mb-2'>Service Events (0):</strong>
              <p className='text-sm text-gray-500 italic'>
                No events yet. Try &quot;Fetch All&quot; or &quot;Create New&quot;
              </p>
            </>
          ) : (
            <DataViewer
              data={serviceEvents.map(log => ({
                time: log.time,
                event: log.event,
                data: typeof log.data === 'object' ? JSON.stringify(log.data) : log.data,
              }))}
              title={`Service Events (${serviceEvents.length})`}
              defaultView='table'
              maxHeight='280px'
            />
          )}
        </div>

        {/* Global Events */}
        <div>
          {globalEvents.length === 0 ? (
            <>
              <strong className='text-sm text-gray-700 block mb-2'>Global Events (0):</strong>
              <p className='text-sm text-gray-500 italic'>
                No global events yet. Try &quot;Throw Global Exception&quot;
              </p>
            </>
          ) : (
            <DataViewer
              data={globalEvents.map(log => ({
                time: log.time,
                event: log.event,
                data: typeof log.data === 'object' ? JSON.stringify(log.data) : log.data,
              }))}
              title={`Global Events (${globalEvents.length})`}
              defaultView='table'
              maxHeight='280px'
            />
          )}
        </div>
      </div>

      {/* Store State Sections */}
      <StoreStateSections />

      {/* Registered Services Section */}
      <RegisteredServicesSection />
    </div>
  );
}

/**
 * Store State Sections
 * Shows live state from all stores: errors, feature flags, example data, and files
 * Uses dedicated hooks from @plyaz/store for reactivity
 */
function StoreStateSections() {
  return (
    <div className='mt-6 pt-6 border-t border-gray-100'>
      <h4 className='font-semibold mb-4 text-gray-900'>Store States (Live - @plyaz/store hooks)</h4>

      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-6 gap-4'>
        {/* Error Store with Filter Tabs */}
        <ErrorStoreSection />

        {/* Feature Flags Store */}
        <FeatureFlagsStoreSection />

        {/* Example Store */}
        <ExampleStoreSection />

        {/* Files Store */}
        <FilesStoreSection />

        {/* Notifications Store */}
        <NotificationsStoreSection />

        {/* Stream Store */}
        <StreamStoreSection />
      </div>
    </div>
  );
}

/**
 * Upload Progress Section
 * Shows live upload progress bars for active uploads
 * Uses useUploadProgress, useOverallUploadProgress, useHasActiveUploads from @plyaz/store
 */
function UploadProgressSection() {
  const uploadProgress = useUploadProgress();
  const overallProgress = useOverallUploadProgress();
  const hasActiveUploads = useHasActiveUploads();
  const activeCount = useActiveUploadCount();

  // Convert progress map to array for display
  const progressEntries = useMemo(() => {
    return Object.entries(uploadProgress).map(([id, progress]) => ({
      ...progress,
      fileId: id,
    }));
  }, [uploadProgress]);

  if (!hasActiveUploads && progressEntries.length === 0) {
    return null; // Don't show section when no uploads
  }

  return (
    <div className='bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4'>
      <div className='flex items-center justify-between mb-3'>
        <h5 className='font-medium text-blue-800 flex items-center gap-2'>
          Upload Progress
          {hasActiveUploads && (
            <span className='bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse'>
              {activeCount} active
            </span>
          )}
        </h5>
        {hasActiveUploads && (
          <div className='text-sm text-blue-700'>
            Overall: <span className='font-semibold'>{overallProgress.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      {hasActiveUploads && (
        <div className='mb-4'>
          <div className='h-3 bg-blue-100 rounded-full overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out'
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Individual Upload Progress */}
      {progressEntries.length > 0 && (
        <div className='space-y-2 max-h-48 overflow-y-auto'>
          {progressEntries.map(entry => (
            <div key={entry.fileId} className='bg-white/50 rounded p-2'>
              <div className='flex items-center justify-between text-xs mb-1'>
                <span className='text-gray-700 truncate max-w-[200px]' title={entry.fileId}>
                  {entry.filename || entry.fileId.split('/').pop()}
                </span>
                <span
                  className={`font-medium ${
                    entry.percentage === PERCENTAGE_FULL ? 'text-green-600' : 'text-blue-600'
                  }`}
                >
                  {entry.percentage?.toFixed(0) ?? 0}%
                </span>
              </div>
              <div className='h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className={`h-full transition-all duration-200 ${
                    entry.percentage === PERCENTAGE_FULL
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`}
                  style={{ width: `${entry.percentage ?? 0}%` }}
                />
              </div>
              {entry.speed && (
                <div className='text-[10px] text-gray-500 mt-0.5'>
                  {(entry.speed / BYTES_PER_KB).toFixed(1)} KB/s
                  {entry.estimatedTimeRemaining && entry.estimatedTimeRemaining > 0 && (
                    <span className='ml-2'>
                      ~{Math.ceil(entry.estimatedTimeRemaining / MS_PER_SECOND)}s remaining
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed message when all done */}
      {!hasActiveUploads && progressEntries.length > 0 && (
        <div className='text-sm text-green-600 text-center py-2'>All uploads completed!</div>
      )}
    </div>
  );
}

/**
 * Download Progress Section
 * Shows live download progress bars for active downloads
 * Uses useDownloadProgress, useOverallDownloadProgress, useHasActiveDownloads from @plyaz/store
 */
function DownloadProgressSection() {
  const downloadProgress = useDownloadProgress();
  const overallProgress = useOverallDownloadProgress();
  const hasActiveDownloads = useHasActiveDownloads();
  const activeCount = useActiveDownloadCount();

  // Convert progress map to array for display
  const progressEntries = useMemo(() => {
    return Object.entries(downloadProgress).map(([id, progress]) => ({
      ...progress,
      fileId: id,
    }));
  }, [downloadProgress]);

  if (!hasActiveDownloads && progressEntries.length === 0) {
    return null; // Don't show section when no downloads
  }

  return (
    <div className='bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4 mb-4'>
      <div className='flex items-center justify-between mb-3'>
        <h5 className='font-medium text-green-800 flex items-center gap-2'>
          Download Progress
          {hasActiveDownloads && (
            <span className='bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse'>
              {activeCount} active
            </span>
          )}
        </h5>
        {hasActiveDownloads && (
          <div className='text-sm text-green-700'>
            Overall: <span className='font-semibold'>{overallProgress.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      {hasActiveDownloads && (
        <div className='mb-4'>
          <div className='h-3 bg-green-100 rounded-full overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-300 ease-out'
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Individual Download Progress */}
      {progressEntries.length > 0 && (
        <div className='space-y-2 max-h-48 overflow-y-auto'>
          {progressEntries.map(entry => (
            <div key={entry.fileId} className='bg-white/50 rounded p-2'>
              <div className='flex items-center justify-between text-xs mb-1'>
                <span className='text-gray-700 truncate max-w-[200px]' title={entry.fileId}>
                  {entry.filename || entry.fileId.split('/').pop()}
                </span>
                <span
                  className={`font-medium ${
                    entry.percentage === PERCENTAGE_FULL ? 'text-green-600' : 'text-teal-600'
                  }`}
                >
                  {entry.percentage?.toFixed(0) ?? 0}%
                </span>
              </div>
              <div className='h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className={`h-full transition-all duration-200 ${
                    entry.percentage === PERCENTAGE_FULL
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-green-400 to-teal-600'
                  }`}
                  style={{ width: `${entry.percentage ?? 0}%` }}
                />
              </div>
              {entry.speed && (
                <div className='text-[10px] text-gray-500 mt-0.5'>
                  {(entry.speed / BYTES_PER_KB).toFixed(1)} KB/s
                  {entry.estimatedTimeRemaining && entry.estimatedTimeRemaining > 0 && (
                    <span className='ml-2'>
                      ~{Math.ceil(entry.estimatedTimeRemaining / MS_PER_SECOND)}s remaining
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed message when all done */}
      {!hasActiveDownloads && progressEntries.length > 0 && (
        <div className='text-sm text-green-600 text-center py-2'>All downloads completed!</div>
      )}
    </div>
  );
}

/**
 * Stream Store Section
 * Shows live stream connection state and recent messages
 * Uses useStreamConnected, useStreamMessages, etc. from @plyaz/store
 */
function StreamStoreSection() {
  const isConnected = useStreamConnected();
  const connectionId = useStreamConnectionId();
  const transport = useStreamTransport();
  const channels = useStreamSubscribedChannels();
  const messages = useStreamMessages();
  const reconnectAttempts = useStreamReconnectAttempts();
  const connectionError = useStreamConnectionError();

  // Get last 5 messages for preview
  const recentMessages = useMemo(
    () => messages.slice(-RECENT_MESSAGES_SLICE).reverse(),
    [messages]
  );

  return (
    <div className='bg-cyan-50 border border-cyan-200 rounded-lg p-4'>
      <h5 className='font-medium text-cyan-800 mb-2 flex items-center gap-2'>
        Stream Store
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
          }`}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </h5>

      <div className='text-xs space-y-1'>
        <div>
          <span className='text-gray-600'>Transport:</span>{' '}
          <span className='text-cyan-700'>{transport ?? 'N/A'}</span>
        </div>
        <div>
          <span className='text-gray-600'>Connection ID:</span>{' '}
          <span className='text-cyan-700 truncate' title={connectionId ?? 'None'}>
            {connectionId ? connectionId.slice(0, MAX_DISPLAY_CHARS) + '...' : 'None'}
          </span>
        </div>
        <div>
          <span className='text-gray-600'>Channels:</span>{' '}
          <span className='text-cyan-700'>{channels.length}</span>
        </div>
        <div>
          <span className='text-gray-600'>Messages:</span>{' '}
          <span className='text-cyan-700'>{messages.length}</span>
        </div>
        {reconnectAttempts > 0 && (
          <div>
            <span className='text-gray-600'>Reconnects:</span>{' '}
            <span className='text-yellow-600'>{reconnectAttempts}</span>
          </div>
        )}
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className='mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700'>
          {connectionError.message}
        </div>
      )}

      {/* Subscribed Channels */}
      {channels.length > 0 && (
        <div className='mt-3'>
          <div className='text-xs text-gray-600 mb-1'>Subscribed Channels:</div>
          <div className='flex flex-wrap gap-1'>
            {channels.map(ch => (
              <span
                key={ch}
                className='bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded text-[10px]'
              >
                {ch}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Messages Preview */}
      {recentMessages.length > 0 && (
        <div className='mt-3'>
          <div className='text-xs text-gray-600 mb-1'>Recent Messages:</div>
          <div className='space-y-1 max-h-24 overflow-y-auto'>
            {recentMessages.map((msg, idx) => (
              <div key={msg.id ?? idx} className='bg-white/50 rounded px-2 py-1 text-[10px]'>
                <span className='text-yellow-600 font-medium'>{msg.event}</span>
                {msg.channel && <span className='text-gray-500 ml-1'>@ {msg.channel}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Feature Flags Store Section
 * Uses useFeatureFlags, useFeatureFlagsInitialized, useFeatureFlagsLoading from @plyaz/store
 */
function FeatureFlagsStoreSection() {
  const flags = useFeatureFlags();
  const isInitialized = useFeatureFlagsInitialized();
  const isLoading = useFeatureFlagsLoading();

  const flagEntries = useMemo(
    () => Object.entries(flags).map(([key, value]) => ({ key, value: String(value) })),
    [flags]
  );

  return (
    <div className='bg-indigo-50 border border-indigo-200 rounded-lg p-4'>
      <h5 className='font-medium text-indigo-800 mb-2 flex items-center gap-2'>
        Feature Flags
        <span className='bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full'>
          {isInitialized ? 'Ready' : 'Loading'}
        </span>
      </h5>
      <div className='text-xs space-y-1'>
        <div>
          <span className='text-gray-600'>Loading:</span>{' '}
          <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
            {isLoading ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className='text-gray-600'>Count:</span>{' '}
          <span className='text-indigo-700'>{Object.keys(flags).length}</span>
        </div>
      </div>
      {flagEntries.length > 0 && (
        <div className='mt-3'>
          <DataViewer
            data={flagEntries}
            title={`Flags (${flagEntries.length})`}
            defaultView='table'
            maxHeight='150px'
          />
        </div>
      )}
    </div>
  );
}

/**
 * Error Store Section with Filter Tabs
 * Uses useErrors, useErrorCount, useActiveErrorCount, useLastError, useHasErrors from @plyaz/store
 */
function ErrorStoreSection() {
  // Use dedicated hooks from @plyaz/store
  const allErrors = useErrors();
  const errorCount = useErrorCount();
  const activeErrorCount = useActiveErrorCount();
  const lastError = useLastError();
  const hasErrors = useHasErrors();

  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Extract unique error codes for tabs
  const errorCodes = useMemo(() => {
    const codes = new Map<string, number>();
    allErrors.forEach(err => {
      const code = err.code ?? 'UNKNOWN';
      codes.set(code, (codes.get(code) ?? 0) + 1);
    });
    return codes;
  }, [allErrors]);

  // Filtered errors based on active tab
  const filteredErrors = useMemo(() => {
    if (activeFilter === 'all') return allErrors;
    return allErrors.filter(err => err.code === activeFilter);
  }, [allErrors, activeFilter]);

  return (
    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
      <h5 className='font-medium text-red-800 mb-2 flex items-center gap-2'>
        Error Store
        <span className='bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full'>
          {errorCount} errors
        </span>
      </h5>

      {/* Filter Tabs */}
      {errorCodes.size > 0 && (
        <div className='mb-3 flex flex-wrap gap-1'>
          <button
            onClick={() => setActiveFilter('all')}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              activeFilter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            All ({allErrors.length})
          </button>
          {Array.from(errorCodes.entries()).map(([code, count]) => (
            <button
              key={code}
              onClick={() => setActiveFilter(code)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                activeFilter === code
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              title={code}
            >
              {code.length > TRUNCATE_START ? `${code.slice(0, TRUNCATE_END)}...` : code} ({count})
            </button>
          ))}
        </div>
      )}

      <div className='text-xs space-y-1'>
        <div>
          <span className='text-gray-600'>Active:</span>{' '}
          <span className='text-red-700'>{activeErrorCount}</span>
        </div>
        <div>
          <span className='text-gray-600'>Has Errors:</span>{' '}
          <span className={hasErrors ? 'text-red-600' : 'text-green-600'}>
            {hasErrors ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {lastError && (
        <div className='mt-2 pt-2 border-t border-red-200'>
          <DataViewer data={lastError} title='Last Error' maxHeight='120px' />
        </div>
      )}

      {filteredErrors.length > 0 && (
        <div className='mt-3'>
          <DataViewer
            data={filteredErrors}
            title={
              activeFilter === 'all'
                ? `All Errors (${filteredErrors.length})`
                : `Filtered: ${activeFilter} (${filteredErrors.length})`
            }
            defaultView='table'
            maxHeight='200px'
          />
        </div>
      )}
    </div>
  );
}

/**
 * Example Store Section - Accesses the example domain store
 * Uses useExampleItems, useExamplesLoading from @plyaz/store
 */
function ExampleStoreSection() {
  // Use dedicated hooks from @plyaz/store
  const items = useExampleItems();
  const isLoading = useExamplesLoading();
  const selectedId = useSelectedExampleId();

  return (
    <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-4'>
      <h5 className='font-medium text-emerald-800 mb-2 flex items-center gap-2'>
        Example Store
        <span className='bg-emerald-200 text-emerald-800 text-xs px-2 py-0.5 rounded-full'>
          {items.length} items
        </span>
      </h5>
      <div className='text-xs space-y-1'>
        <div>
          <span className='text-gray-600'>Loading:</span>{' '}
          <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
            {isLoading ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className='text-gray-600'>Selected ID:</span>{' '}
          <span className='text-emerald-700'>{selectedId ?? 'None'}</span>
        </div>
      </div>
      {items.length > 0 && (
        <div className='mt-3'>
          <DataViewer
            data={items}
            title={`Items (${items.length})`}
            defaultView='table'
            maxHeight='200px'
          />
        </div>
      )}
    </div>
  );
}

/**
 * Files Store Section - Displays files store state
 * Uses useFilesStore, useFilesUploading, useFilesGenerating from @plyaz/store
 */
function FilesStoreSection() {
  // Use dedicated hooks from @plyaz/store
  const filesStore = useFilesStore();
  const isUploading = useFilesUploading();
  const isGenerating = useFilesGenerating();

  // Get lists and counts from the store
  const filesList = filesStore.filesList;
  const uploadsList = filesStore.uploadsList;
  const generatedFilesList = filesStore.generatedFilesList;
  const filesCount = filesStore.filesCount;
  const uploadsCount = filesStore.uploadsCount;
  const generatedCount = generatedFilesList.length;
  const totalItems = filesCount + uploadsCount + generatedCount;

  // Build store state as array for table display
  const storeStateAsTable = useMemo(
    () => [
      { property: 'filesCount', value: filesCount },
      { property: 'uploadsCount', value: uploadsCount },
      { property: 'generatedCount', value: generatedCount },
      { property: 'isLoading', value: filesStore.isLoading },
      { property: 'isUploading', value: isUploading },
      { property: 'isGenerating', value: isGenerating },
      {
        property: 'lastUpload',
        value: filesStore.lastUpload
          ? JSON.stringify(filesStore.lastUpload).slice(0, CHART_DIMENSION) + '...'
          : 'null',
      },
      {
        property: 'lastGenerated',
        value: filesStore.lastGenerated
          ? JSON.stringify(filesStore.lastGenerated).slice(0, CHART_DIMENSION) + '...'
          : 'null',
      },
    ],
    [
      filesCount,
      uploadsCount,
      generatedCount,
      filesStore.isLoading,
      isUploading,
      isGenerating,
      filesStore.lastUpload,
      filesStore.lastGenerated,
    ]
  );

  return (
    <div className='bg-sky-50 border border-sky-200 rounded-lg p-4'>
      <h5 className='font-medium text-sky-800 mb-2 flex items-center gap-2'>
        Files Store
        <span className='bg-sky-200 text-sky-800 text-xs px-2 py-0.5 rounded-full'>
          {totalItems} items
        </span>
      </h5>

      {/* Store State Table - always visible */}
      <div className='mt-2'>
        <DataViewer
          data={storeStateAsTable}
          title='Store State'
          defaultView='table'
          maxHeight='200px'
        />
      </div>

      {/* Files List Table */}
      <div className='mt-3'>
        <DataViewer
          data={filesList}
          title={`Files (${filesCount})`}
          defaultView='table'
          maxHeight='150px'
        />
      </div>

      {/* Uploads List Table */}
      <div className='mt-3'>
        <DataViewer
          data={uploadsList}
          title={`Uploads (${uploadsCount})`}
          defaultView='table'
          maxHeight='150px'
        />
      </div>

      {/* Generated Files Table */}
      <div className='mt-3'>
        <DataViewer
          data={generatedFilesList}
          title={`Generated (${generatedCount})`}
          defaultView='table'
          maxHeight='150px'
        />
      </div>
    </div>
  );
}

/**
 * Notifications Store Section - Displays notifications store state
 * Uses useNotificationsStore, useNotifications from @plyaz/store
 */
function NotificationsStoreSection() {
  // Use dedicated hooks from @plyaz/store
  const notificationsStore = useNotificationsStore();
  const notificationsList = useNotifications();

  // Get counts from the store
  const notificationsCount = notificationsStore.notificationsCount;
  const lastNotification = notificationsStore.lastNotification;

  // Build store state as array for table display
  const storeStateAsTable = useMemo(
    () => [
      { property: 'notificationsCount', value: notificationsCount },
      { property: 'isLoading', value: notificationsStore.isLoading },
      {
        property: 'lastNotification',
        value: lastNotification ? `${lastNotification.type}: ${lastNotification.title}` : 'null',
      },
    ],
    [notificationsCount, notificationsStore.isLoading, lastNotification]
  );

  return (
    <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
      <h5 className='font-medium text-amber-800 mb-2 flex items-center gap-2'>
        Notifications Store
        <span className='bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full'>
          {notificationsCount} items
        </span>
      </h5>

      {/* Store State Table - always visible */}
      <div className='mt-2'>
        <DataViewer
          data={storeStateAsTable}
          title='Store State'
          defaultView='table'
          maxHeight='150px'
        />
      </div>

      {/* Notifications List Table */}
      <div className='mt-3'>
        <DataViewer
          data={notificationsList}
          title={`Notifications (${notificationsCount})`}
          defaultView='table'
          maxHeight='200px'
        />
      </div>
    </div>
  );
}

/**
 * Registered Services Section
 * Shows all registered services with reactive updates
 */
function RegisteredServicesSection() {
  const events = useEvents();
  const [services, setServices] = useState<{
    initialized: string[];
    pending: string[];
    nonSingleton: string[];
    lastUpdate: string;
  }>({
    initialized: [],
    pending: [],
    nonSingleton: [],
    lastUpdate: new Date().toLocaleTimeString(),
  });

  // Refresh services list from ServiceRegistry
  const refreshServices = useCallback(async () => {
    try {
      // Use frontend entry point to avoid pulling in backend-only modules
      const { ServiceRegistry } = await import('@plyaz/core/frontend');
      setServices({
        initialized: ServiceRegistry.getInitializedKeys(),
        pending: ServiceRegistry.getPendingKeys(),
        nonSingleton: ServiceRegistry.getNonSingletonKeys(),
        lastUpdate: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      log.error('Failed to access ServiceRegistry', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  // Initial load and subscribe to service-related events
  useEffect(() => {
    void refreshServices();

    // Subscribe to events that might indicate service changes
    const unsubscribers = [
      events.on('system:initialized', refreshServices),
      events.on('system:ready', refreshServices),
    ];

    // Poll every 2 seconds for changes (ServiceRegistry doesn't emit events)
    const interval = setInterval(refreshServices, TIMEOUT_MS_2S);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(interval);
    };
  }, [events, refreshServices]);

  const totalServices =
    services.initialized.length + services.pending.length + services.nonSingleton.length;

  return (
    <div className='mt-6 pt-6 border-t border-gray-100'>
      <div className='flex items-center justify-between mb-4'>
        <h4 className='font-semibold text-gray-900'>Registered Services ({totalServices})</h4>
        <button onClick={refreshServices} className='text-xs text-blue-600 hover:text-blue-800'>
          Refresh
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {/* Initialized Services */}
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <h5 className='font-medium text-green-800 mb-2 flex items-center gap-2'>
            <span className='w-2 h-2 bg-green-500 rounded-full'></span>
            Initialized
            <span className='bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full'>
              {services.initialized.length}
            </span>
          </h5>
          {services.initialized.length === 0 ? (
            <p className='text-xs text-gray-500 italic'>No services initialized yet</p>
          ) : (
            <div className='space-y-1'>
              {services.initialized.map(key => (
                <div
                  key={key}
                  className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-mono'
                >
                  {key}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Services */}
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h5 className='font-medium text-yellow-800 mb-2 flex items-center gap-2'>
            <span className='w-2 h-2 bg-yellow-500 rounded-full'></span>
            Pending (Lazy)
            <span className='bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full'>
              {services.pending.length}
            </span>
          </h5>
          {services.pending.length === 0 ? (
            <p className='text-xs text-gray-500 italic'>No pending services</p>
          ) : (
            <div className='space-y-1'>
              {services.pending.map(key => (
                <div
                  key={key}
                  className='text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono'
                >
                  {key}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Non-Singleton Services */}
        <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
          <h5 className='font-medium text-purple-800 mb-2 flex items-center gap-2'>
            <span className='w-2 h-2 bg-purple-500 rounded-full animate-pulse'></span>
            Non-Singleton
            <span className='bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full'>
              {services.nonSingleton.length}
            </span>
          </h5>
          {services.nonSingleton.length === 0 ? (
            <p className='text-xs text-gray-500 italic'>No non-singleton services</p>
          ) : (
            <div className='space-y-1'>
              {services.nonSingleton.map(key => (
                <div
                  key={key}
                  className='text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono'
                >
                  {key}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className='text-xs text-gray-400 mt-2'>
        Last updated: {services.lastUpdate} (auto-refreshes every 2s)
      </p>
    </div>
  );
}

// =============================================================================
// Feature Demo Sections
// =============================================================================

/**
 * Polling Demo Section
 * Demonstrates startPolling() / stopPolling() from the service
 */
function PollingDemoSection({
  exampleService,
}: {
  exampleService: FrontendExampleDomainService | null;
}) {
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState(TIMEOUT_MS_5S); // 5 seconds default

  // Track polling fetches via events
  const events = useEvents();

  useEffect(() => {
    const handleFetched = () => {
      if (isPolling) {
        setPollCount(prev => prev + 1);
        setLastPollTime(new Date().toLocaleTimeString());
      }
    };

    const unsub = events.on('example:fetched', handleFetched);
    return () => unsub();
  }, [events, isPolling]);

  const handleStartPolling = () => {
    if (!exampleService) return;
    exampleService.startPolling(pollingInterval); // Pass the UI-configured interval
    setIsPolling(true);
    setPollCount(0);
    setLastPollTime(new Date().toLocaleTimeString());
  };

  const handleStopPolling = () => {
    if (!exampleService) return;
    exampleService.stopPolling();
    setIsPolling(false);
  };

  if (!exampleService) return null;

  return (
    <Section title='Polling Demo' color='cyan'>
      <p className='text-sm text-gray-600 mb-3'>
        Auto-refresh data at intervals using startPolling() / stopPolling() from the service.
      </p>

      <div className='bg-cyan-50 border border-cyan-200 rounded-md p-3 mb-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
          <div>
            <span className='text-gray-600'>Status:</span>{' '}
            <span className={isPolling ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {isPolling ? 'Active' : 'Stopped'}
            </span>
            {isPolling && (
              <span className='ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse' />
            )}
          </div>
          <div>
            <span className='text-gray-600'>Interval:</span>{' '}
            <span className='text-cyan-700'>{pollingInterval / MS_PER_SECOND}s</span>
          </div>
          <div>
            <span className='text-gray-600'>Poll Count:</span>{' '}
            <span className='text-cyan-700 font-medium'>{pollCount}</span>
          </div>
          <div>
            <span className='text-gray-600'>Last Poll:</span>{' '}
            <span className='text-cyan-700'>{lastPollTime ?? 'Never'}</span>
          </div>
        </div>
      </div>

      <div className='flex gap-2 flex-wrap items-center'>
        <div className='flex items-center gap-2 mr-4'>
          <label className='text-sm text-gray-600'>Interval (ms):</label>
          <input
            type='number'
            value={pollingInterval}
            onChange={e => setPollingInterval(Number(e.target.value))}
            min={1000}
            step={1000}
            disabled={isPolling}
            className='border border-gray-300 rounded px-2 py-1 w-24 text-gray-900 text-sm bg-white disabled:bg-gray-100'
          />
        </div>
        <Button onClick={handleStartPolling} disabled={isPolling} color='cyan'>
          Start Polling
        </Button>
        <Button onClick={handleStopPolling} disabled={!isPolling} color='gray'>
          Stop Polling
        </Button>
      </div>

      <p className='text-xs text-gray-500 mt-3'>
        Note: Set the interval above before clicking Start. The interval is passed to
        startPolling(intervalMs). Default is 30 seconds if not specified.
      </p>
    </Section>
  );
}

/**
 * Service Lifecycle Section
 * Demonstrates dispose() / isAvailable() and store connection info
 */
function ServiceLifecycleSection({
  exampleService,
}: {
  exampleService: FrontendExampleDomainService | null;
}) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [connectedStores, setConnectedStores] = useState<number | null>(null);
  const [hasStores, setHasStores] = useState<boolean | null>(null);
  const [isDisposed, setIsDisposed] = useState(false);

  const refreshStatus = useCallback(() => {
    if (!exampleService) return;
    setIsAvailable(exampleService.isAvailable());
    setIsEnabled(exampleService.isServiceEnabled);
    setIsInitialized(exampleService.isInitialized);
    // Access store connection info (if available via service)
    try {
      // These getters may exist on BaseFrontendDomainService
      setConnectedStores(
        (exampleService as unknown as { connectedStoreCount?: number }).connectedStoreCount ?? 0
      );
      setHasStores(
        (exampleService as unknown as { hasConnectedStores?: boolean }).hasConnectedStores ?? false
      );
    } catch {
      setConnectedStores(0);
      setHasStores(false);
    }
  }, [exampleService]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleDispose = () => {
    if (!exampleService) return;
    exampleService.dispose();
    setIsDisposed(true);
    refreshStatus();
  };

  const handleReinitialize = async () => {
    try {
      // Re-fetch the service from registry (creates new instance if disposed)
      const { ServiceRegistry } = await import('@plyaz/core/frontend');
      await ServiceRegistry.getAsync('example-frontend');
      setIsDisposed(false);
      refreshStatus();
    } catch (err) {
      log.error('Failed to reinitialize service', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (!exampleService && !isDisposed) return null;

  return (
    <Section title='Service Lifecycle' color='amber'>
      <p className='text-sm text-gray-600 mb-3'>
        Manage service lifecycle with dispose() / isAvailable() and view store connection info.
      </p>

      <div className='bg-amber-50 border border-amber-200 rounded-md p-3 mb-4'>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
          <div>
            <span className='text-gray-600'>Available:</span>{' '}
            <span className={isAvailable ? 'text-green-600' : 'text-red-600'}>
              {isAvailable === null ? 'Unknown' : isAvailable ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className='text-gray-600'>Enabled:</span>{' '}
            <span className={isEnabled ? 'text-green-600' : 'text-gray-500'}>
              {isEnabled === null ? 'Unknown' : isEnabled ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className='text-gray-600'>Initialized:</span>{' '}
            <span className={isInitialized ? 'text-green-600' : 'text-yellow-600'}>
              {isInitialized === null ? 'Unknown' : isInitialized ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className='text-gray-600'>Connected Stores:</span>{' '}
            <span className='text-amber-700'>{connectedStores ?? 0}</span>
          </div>
          <div>
            <span className='text-gray-600'>Has Stores:</span>{' '}
            <span className={hasStores ? 'text-green-600' : 'text-gray-500'}>
              {hasStores === null ? 'Unknown' : hasStores ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className='text-gray-600'>Disposed:</span>{' '}
            <span className={isDisposed ? 'text-red-600' : 'text-green-600'}>
              {isDisposed ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <div className='flex gap-2 flex-wrap'>
        <Button onClick={handleDispose} disabled={isDisposed} color='red'>
          Dispose Service
        </Button>
        <Button onClick={handleReinitialize} disabled={!isDisposed} color='green'>
          Reinitialize
        </Button>
        <Button onClick={refreshStatus} color='gray'>
          Refresh Status
        </Button>
      </div>

      {isDisposed && (
        <div className='mt-3 bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-700'>
          Service has been disposed. Click &quot;Reinitialize&quot; to get a new instance from
          ServiceRegistry.
        </div>
      )}
    </Section>
  );
}

/**
 * Query Builder Section
 * Demonstrates advanced query filters: pagination, sorting, and filters
 */
function QueryBuilderSection({
  exampleService,
  runAction,
  loading,
}: {
  exampleService: FrontendExampleDomainService | null;
  runAction: (actionName: string, action: () => Promise<unknown>) => void;
  loading: boolean;
}) {
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc' as 'asc' | 'desc',
    status: '' as '' | 'active' | 'draft' | 'archived',
    min_amount: '',
    max_amount: '',
    search: '',
  });

  if (!exampleService) return null;

  const handleExecuteQuery = () => {
    // Build query object, omitting empty values
    const query: Record<string, unknown> = {};
    if (queryParams.page > 1) query.page = queryParams.page;
    if (queryParams.limit !== DEFAULT_PAGE_LIMIT) query.limit = queryParams.limit;
    if (queryParams.sort_by) query.sort_by = queryParams.sort_by;
    if (queryParams.sort_order) query.sort_order = queryParams.sort_order;
    if (queryParams.status) query.status = queryParams.status;
    if (queryParams.min_amount) query.min_amount = Number(queryParams.min_amount);
    if (queryParams.max_amount) query.max_amount = Number(queryParams.max_amount);
    if (queryParams.search) query.search = queryParams.search;

    runAction(`Query (${Object.keys(query).length} params)`, () => exampleService.fetchAll(query));
  };

  const handleReset = () => {
    setQueryParams({
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
      status: '',
      min_amount: '',
      max_amount: '',
      search: '',
    });
  };

  return (
    <Section title='Query Builder' color='violet'>
      <p className='text-sm text-gray-600 mb-3'>
        Build advanced queries with pagination, sorting, and filters using fetchAll(query).
      </p>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
        {/* Pagination */}
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Page</label>
          <input
            type='number'
            value={queryParams.page}
            onChange={e => setQueryParams({ ...queryParams, page: Number(e.target.value) })}
            min={1}
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          />
        </div>
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Limit</label>
          <input
            type='number'
            value={queryParams.limit}
            onChange={e => setQueryParams({ ...queryParams, limit: Number(e.target.value) })}
            min={1}
            max={100}
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          />
        </div>

        {/* Sorting */}
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Sort By</label>
          <select
            value={queryParams.sort_by}
            onChange={e => setQueryParams({ ...queryParams, sort_by: e.target.value })}
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          >
            <option value='created_at'>Created At</option>
            <option value='updated_at'>Updated At</option>
            <option value='name'>Name</option>
            <option value='amount'>Amount</option>
            <option value='status'>Status</option>
          </select>
        </div>
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Sort Order</label>
          <select
            value={queryParams.sort_order}
            onChange={e =>
              setQueryParams({ ...queryParams, sort_order: e.target.value as 'asc' | 'desc' })
            }
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          >
            <option value='desc'>Descending</option>
            <option value='asc'>Ascending</option>
          </select>
        </div>

        {/* Filters */}
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Status</label>
          <select
            value={queryParams.status}
            onChange={e =>
              setQueryParams({
                ...queryParams,
                status: e.target.value as '' | 'active' | 'draft' | 'archived',
              })
            }
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          >
            <option value=''>All</option>
            <option value='active'>Active</option>
            <option value='draft'>Draft</option>
            <option value='archived'>Archived</option>
          </select>
        </div>
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Min Amount</label>
          <input
            type='number'
            value={queryParams.min_amount}
            onChange={e => setQueryParams({ ...queryParams, min_amount: e.target.value })}
            placeholder='0'
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          />
        </div>
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Max Amount</label>
          <input
            type='number'
            value={queryParams.max_amount}
            onChange={e => setQueryParams({ ...queryParams, max_amount: e.target.value })}
            placeholder='∞'
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          />
        </div>
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>Search</label>
          <input
            type='text'
            value={queryParams.search}
            onChange={e => setQueryParams({ ...queryParams, search: e.target.value })}
            placeholder='Search term...'
            className='border border-gray-300 rounded px-2 py-1.5 w-full text-gray-900 text-sm bg-white'
          />
        </div>
      </div>

      {/* Query Preview */}
      <div className='bg-violet-50 border border-violet-200 rounded-md p-2 mb-4'>
        <span className='text-xs text-gray-600'>Query Preview:</span>
        <code className='block text-xs text-violet-800 mt-1 font-mono'>
          fetchAll(
          {JSON.stringify(
            Object.fromEntries(
              Object.entries({
                page: queryParams.page > 1 ? queryParams.page : undefined,
                limit: queryParams.limit !== DEFAULT_PAGE_LIMIT ? queryParams.limit : undefined,
                sort_by: queryParams.sort_by || undefined,
                sort_order: queryParams.sort_order || undefined,
                status: queryParams.status || undefined,
                min_amount: queryParams.min_amount ? Number(queryParams.min_amount) : undefined,
                max_amount: queryParams.max_amount ? Number(queryParams.max_amount) : undefined,
                search: queryParams.search || undefined,
              }).filter(([, v]) => v !== undefined)
            )
          )}
          )
        </code>
      </div>

      <div className='flex gap-2 flex-wrap'>
        <Button onClick={handleExecuteQuery} disabled={loading} color='violet'>
          Execute Query
        </Button>
        <Button onClick={handleReset} color='gray'>
          Reset
        </Button>
      </div>
    </Section>
  );
}

/**
 * Feature Flag Gating Section
 * Demonstrates using useFeatureFlags hook from @plyaz/store
 */
function FeatureFlagGatingSection() {
  // Use dedicated hook from @plyaz/store
  const flags = useFeatureFlags();
  const [demoFlag, setDemoFlag] = useState<string>('example_enabled');
  const [flagValue, setFlagValue] = useState<unknown>(null);

  const checkFlag = useCallback(() => {
    setFlagValue(flags[demoFlag] ?? 'Not set');
  }, [flags, demoFlag]);

  useEffect(() => {
    checkFlag();
  }, [checkFlag]);

  // Get all available flags
  const availableFlags = useMemo(() => {
    return Object.keys(flags);
  }, [flags]);

  return (
    <Section title='Feature Flag Gating' color='pink'>
      <p className='text-sm text-gray-600 mb-3'>
        Show/hide UI based on feature flags. Uses flags from the store.
      </p>

      <div className='bg-pink-50 border border-pink-200 rounded-md p-3 mb-4'>
        <div className='flex gap-4 items-center flex-wrap'>
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>Flag Name</label>
            <select
              value={demoFlag}
              onChange={e => setDemoFlag(e.target.value)}
              className='border border-gray-300 rounded px-2 py-1.5 text-gray-900 text-sm min-w-[200px] bg-white'
            >
              {availableFlags.length === 0 ? (
                <option value='example_enabled'>example_enabled (default)</option>
              ) : (
                availableFlags.map(flag => (
                  <option key={flag} value={flag}>
                    {flag}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>Value</label>
            <div className='text-sm font-mono bg-white border border-gray-200 rounded px-3 py-1.5'>
              {String(flagValue)}
            </div>
          </div>
          <div className='flex-1'>
            <Button onClick={checkFlag} color='pink'>
              Check Flag
            </Button>
          </div>
        </div>
      </div>

      {/* Conditional UI based on flags */}
      <div className='space-y-2'>
        <p className='text-xs font-medium text-gray-700'>Conditional UI Examples:</p>

        {flagValue === true && (
          <div className='bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700'>
            This section is shown because{' '}
            <code className='bg-green-100 px-1 rounded'>{demoFlag}</code> is <strong>true</strong>
          </div>
        )}

        {flagValue === false && (
          <div className='bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700'>
            The feature is disabled because{' '}
            <code className='bg-red-100 px-1 rounded'>{demoFlag}</code> is <strong>false</strong>
          </div>
        )}

        {flagValue !== true && flagValue !== false && (
          <div className='bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-600'>
            Flag <code className='bg-gray-100 px-1 rounded'>{demoFlag}</code> has non-boolean value:{' '}
            <strong>{String(flagValue)}</strong>
          </div>
        )}
      </div>
    </Section>
  );
}

/**
 * Service Event Subscription Section
 * Demonstrates service.on() pattern for event subscription
 */
function ServiceEventSubscriptionSection({
  exampleService,
}: {
  exampleService: FrontendExampleDomainService | null;
}) {
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [eventLog, setEventLog] = useState<{ event: string; data: unknown; time: string }[]>([]);
  const [unsubscribers, setUnsubscribers] = useState<Map<string, () => void>>(new Map());

  const availableEvents = [
    'example:fetching',
    'example:fetched',
    'example:fetch:error',
    'example:creating',
    'example:created',
    'example:create:error',
    'example:updating',
    'example:updated',
    'example:update:error',
    'example:deleting',
    'example:deleted',
    'example:delete:error',
    'example:store:synced',
    'example:error',
  ];

  const handleSubscribe = (event: string) => {
    if (!exampleService || subscriptions.includes(event)) return;

    // Cast to event type - these are known valid event names from availableEvents
    const unsub = exampleService.on(
      event as Parameters<typeof exampleService.on>[0],
      (data: unknown) => {
        setEventLog(prev => [
          { event, data, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, EVENT_LOG_LIMIT), // Keep last 50 events
        ]);
      }
    );

    setUnsubscribers(prev => new Map(prev).set(event, unsub));
    setSubscriptions(prev => [...prev, event]);
  };

  const handleUnsubscribe = (event: string) => {
    const unsub = unsubscribers.get(event);
    if (unsub) {
      unsub();
      setUnsubscribers(prev => {
        const next = new Map(prev);
        next.delete(event);
        return next;
      });
      setSubscriptions(prev => prev.filter(e => e !== event));
    }
  };

  const handleSubscribeAll = () => {
    availableEvents.forEach(event => {
      if (!subscriptions.includes(event)) {
        handleSubscribe(event);
      }
    });
  };

  const handleUnsubscribeAll = () => {
    subscriptions.forEach(event => handleUnsubscribe(event));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [unsubscribers]);

  if (!exampleService) return null;

  return (
    <Section title='Service Event Subscription' color='rose'>
      <p className='text-sm text-gray-600 mb-3'>
        Subscribe to service events using service.on() pattern. Events fire during CRUD operations.
      </p>

      <div className='bg-rose-50 border border-rose-200 rounded-md p-3 mb-4'>
        <p className='text-xs font-medium text-gray-700 mb-2'>
          Available Events (click to subscribe):
        </p>
        <div className='flex flex-wrap gap-1'>
          {availableEvents.map(event => {
            const isSubscribed = subscriptions.includes(event);
            return (
              <button
                key={event}
                onClick={() => (isSubscribed ? handleUnsubscribe(event) : handleSubscribe(event))}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isSubscribed
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                }`}
              >
                {event.replace('example:', '')}
              </button>
            );
          })}
        </div>
      </div>

      <div className='flex gap-2 flex-wrap mb-4'>
        <Button onClick={handleSubscribeAll} color='rose'>
          Subscribe All
        </Button>
        <Button onClick={handleUnsubscribeAll} color='gray'>
          Unsubscribe All
        </Button>
        <Button onClick={() => setEventLog([])} color='gray'>
          Clear Log
        </Button>
      </div>

      <div className='text-xs text-gray-600 mb-2'>
        Active Subscriptions: {subscriptions.length} / {availableEvents.length}
      </div>

      {eventLog.length > 0 && (
        <DataViewer
          data={eventLog.map(log => ({
            time: log.time,
            event: log.event,
            data: typeof log.data === 'object' ? JSON.stringify(log.data) : String(log.data),
          }))}
          title={`Event Log (${eventLog.length})`}
          defaultView='table'
          maxHeight='200px'
        />
      )}

      {eventLog.length === 0 && subscriptions.length > 0 && (
        <p className='text-sm text-gray-500 italic'>
          No events received yet. Try using the API operations above to trigger events.
        </p>
      )}
    </Section>
  );
}

// =============================================================================
// UI Components
// =============================================================================

function Section({
  title,
  color,
  children,
  className,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  const borderColors: Record<string, string> = {
    blue: 'border-blue-200',
    green: 'border-green-200',
    yellow: 'border-yellow-200',
    red: 'border-red-200',
    purple: 'border-purple-200',
    indigo: 'border-indigo-200',
    teal: 'border-teal-200',
    emerald: 'border-emerald-200',
    gray: 'border-gray-200',
    cyan: 'border-cyan-200',
    orange: 'border-orange-200',
    rose: 'border-rose-200',
    amber: 'border-amber-200',
    violet: 'border-violet-200',
    pink: 'border-pink-200',
    sky: 'border-sky-200',
  };

  return (
    <div
      className={`bg-gray-50 rounded-lg p-4 border ${borderColors[color] ?? 'border-gray-200'}${className ?? ''}`}
    >
      <h3 className='font-semibold mb-3 text-gray-900'>{title}</h3>
      {children}
    </div>
  );
}

function Button({
  onClick,
  disabled,
  color,
  children,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    red: 'bg-red-600 hover:bg-red-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
    cyan: 'bg-cyan-600 hover:bg-cyan-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    rose: 'bg-rose-600 hover:bg-rose-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    violet: 'bg-violet-600 hover:bg-violet-700',
    pink: 'bg-pink-600 hover:bg-pink-700',
    sky: 'bg-sky-600 hover:bg-sky-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${colorClasses[color] ?? 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
      />
    </svg>
  );
}
