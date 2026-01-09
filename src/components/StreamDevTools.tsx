'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Flex, Heading, Button } from '@plyaz/ui';
import {
  useStreamConnected,
  useStreamConnectionError,
  useStreamConnectionId,
  useStreamTransport,
  useStreamMessages,
  useStreamSubscribedChannels,
  useStreamActions,
} from '@plyaz/store';

// Filter option type
interface FilterOption {
  value: string;
  label: string;
  count: number;
}

// Constants
const MAX_MESSAGES = 50;
const CONNECTION_ID_DISPLAY_LENGTH = 16;
const JSON_STRINGIFY_SPACING = 2;

/**
 * Stream Events DevTools Panel
 *
 * Displays real-time stream connection status, messages, and errors
 * for debugging purposes with filtering capabilities.
 */
export function StreamDevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [maxMessages, setMaxMessages] = useState(MAX_MESSAGES);
  const [mounted, setMounted] = useState(false);

  // Filter state
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [hideHeartbeats, setHideHeartbeats] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Stream state - only access after mount
  const connected = useStreamConnected();
  const connectionId = useStreamConnectionId();
  const transport = useStreamTransport();
  const error = useStreamConnectionError();
  const messages = useStreamMessages();
  const channels = useStreamSubscribedChannels();
  const actions = useStreamActions();

  // Memoize clearMessages to prevent infinite loops
  const clearMessages = useCallback(() => {
    actions.clearMessages();
  }, [actions]);

  // Extract unique filter options from messages
  const filterOptions = useMemo(() => {
    const events = new Map<string, number>();
    const channelSet = new Map<string, number>();
    const types = new Map<string, number>();
    const scopes = new Map<string, number>();

    for (const msg of messages) {
      // Count events
      if (msg.event) {
        events.set(msg.event, (events.get(msg.event) ?? 0) + 1);
      }
      // Count channels
      if (msg.channel) {
        channelSet.set(msg.channel, (channelSet.get(msg.channel) ?? 0) + 1);
      }
      // Count types
      if (msg.type) {
        types.set(msg.type, (types.get(msg.type) ?? 0) + 1);
      }
      // Count scopes
      if (msg.scope) {
        scopes.set(msg.scope, (scopes.get(msg.scope) ?? 0) + 1);
      }
    }

    const toOptions = (map: Map<string, number>): FilterOption[] =>
      Array.from(map.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count);

    return {
      events: toOptions(events),
      channels: toOptions(channelSet),
      types: toOptions(types),
      scopes: toOptions(scopes),
    };
  }, [messages]);

  // Apply filters and get recent messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Hide heartbeats if enabled
    if (hideHeartbeats) {
      filtered = filtered.filter(msg => msg.event !== 'heartbeat');
    }

    // Filter by event
    if (filterEvent !== 'all') {
      filtered = filtered.filter(msg => msg.event === filterEvent);
    }

    // Filter by channel
    if (filterChannel !== 'all') {
      filtered = filtered.filter(msg => msg.channel === filterChannel);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(msg => msg.type === filterType);
    }

    // Filter by scope
    if (filterScope !== 'all') {
      filtered = filtered.filter(msg => msg.scope === filterScope);
    }

    // Apply max messages limit
    return filtered.slice(-maxMessages);
  }, [messages, maxMessages, filterEvent, filterChannel, filterType, filterScope, hideHeartbeats]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterEvent('all');
    setFilterChannel('all');
    setFilterType('all');
    setFilterScope('all');
    setHideHeartbeats(false);
  }, []);

  // Check if any filter is active
  const hasActiveFilters =
    filterEvent !== 'all' ||
    filterChannel !== 'all' ||
    filterType !== 'all' ||
    filterScope !== 'all' ||
    hideHeartbeats;

  // Don't render until mounted (prevents SSR hydration issues)
  if (!mounted) {
    return null;
  }

  return (
    <Box
      className={`
        fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ height: isOpen ? '50vh' : 'auto' }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          absolute -top-10 right-4 bg-gray-800 text-white px-4 py-2
          rounded-t-lg shadow-lg hover:bg-gray-700 transition-colors
          font-mono text-sm
        `}
      >
        {isOpen ? '▼' : '▲'} Stream DevTools
      </button>

      {/* DevTools Content */}
      {isOpen && (
        <Box className='h-full flex flex-col'>
          {/* Header */}
          <Flex
            justify='between'
            align='center'
            className='p-4 border-b border-gray-700 bg-gray-800'
          >
            <Heading element='h2' size='base' className='font-mono text-green-400'>
              Stream Events Monitor
            </Heading>
            <Flex gap='2' align='center'>
              <Button
                onClick={() => clearMessages()}
                className='px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-mono'
              >
                Clear
              </Button>
              <select
                value={maxMessages}
                onChange={e => setMaxMessages(Number(e.target.value))}
                className='px-2 py-1 bg-gray-700 rounded text-xs font-mono'
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </Flex>
          </Flex>

          {/* Filter Bar */}
          <Flex
            align='center'
            gap='3'
            className='px-4 py-2 border-b border-gray-700 bg-gray-800 flex-wrap'
          >
            {/* Hide Heartbeats Toggle */}
            <label className='flex items-center gap-1.5 text-xs font-mono cursor-pointer'>
              <input
                type='checkbox'
                checked={hideHeartbeats}
                onChange={e => setHideHeartbeats(e.target.checked)}
                className='w-3.5 h-3.5 rounded bg-gray-700 border-gray-600'
              />
              <span className='text-gray-400'>Hide heartbeats</span>
            </label>

            <span className='text-gray-600'>|</span>

            {/* Event Filter */}
            <Flex align='center' gap='2'>
              <span className='text-gray-500 text-xs font-mono'>Event:</span>
              <select
                value={filterEvent}
                onChange={e => setFilterEvent(e.target.value)}
                className='px-2 py-1 bg-gray-700 rounded text-xs font-mono min-w-24'
              >
                <option value='all'>
                  All ({filterOptions.events.reduce((sum, o) => sum + o.count, 0)})
                </option>
                {filterOptions.events.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.count})
                  </option>
                ))}
              </select>
            </Flex>

            {/* Channel Filter */}
            {filterOptions.channels.length > 0 && (
              <Flex align='center' gap='2'>
                <span className='text-gray-500 text-xs font-mono'>Channel:</span>
                <select
                  value={filterChannel}
                  onChange={e => setFilterChannel(e.target.value)}
                  className='px-2 py-1 bg-gray-700 rounded text-xs font-mono min-w-24'
                >
                  <option value='all'>All</option>
                  {filterOptions.channels.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count})
                    </option>
                  ))}
                </select>
              </Flex>
            )}

            {/* Type Filter */}
            {filterOptions.types.length > 0 && (
              <Flex align='center' gap='2'>
                <span className='text-gray-500 text-xs font-mono'>Type:</span>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className='px-2 py-1 bg-gray-700 rounded text-xs font-mono min-w-24'
                >
                  <option value='all'>All</option>
                  {filterOptions.types.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count})
                    </option>
                  ))}
                </select>
              </Flex>
            )}

            {/* Scope Filter */}
            {filterOptions.scopes.length > 0 && (
              <Flex align='center' gap='2'>
                <span className='text-gray-500 text-xs font-mono'>Scope:</span>
                <select
                  value={filterScope}
                  onChange={e => setFilterScope(e.target.value)}
                  className='px-2 py-1 bg-gray-700 rounded text-xs font-mono min-w-24'
                >
                  <option value='all'>All</option>
                  {filterOptions.scopes.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count})
                    </option>
                  ))}
                </select>
              </Flex>
            )}

            {/* Reset Filters */}
            {hasActiveFilters && (
              <>
                <span className='text-gray-600'>|</span>
                <Button
                  onClick={resetFilters}
                  className='px-2 py-1 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-xs font-mono'
                >
                  Reset Filters
                </Button>
              </>
            )}

            {/* Active filter indicator */}
            {hasActiveFilters && (
              <span className='text-yellow-500 text-xs font-mono ml-auto'>
                Showing {filteredMessages.length} of {messages.length} messages
              </span>
            )}
          </Flex>

          <Box className='flex flex-1 overflow-hidden'>
            {/* Status Panel */}
            <Box className='w-80 border-r border-gray-700 bg-gray-800 p-4 overflow-y-auto'>
              <Heading element='h3' size='sm' className='mb-3 font-mono text-blue-400'>
                Connection Status
              </Heading>

              <div className='space-y-2 font-mono text-xs'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Status:</span>
                  <span className={connected ? 'text-green-400' : 'text-red-400'}>
                    {connected ? '● Connected' : '○ Disconnected'}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-400'>Transport:</span>
                  <span className='text-blue-400'>{transport ?? 'N/A'}</span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-400'>Connection ID:</span>
                  <span className='text-gray-300 truncate max-w-40' title={connectionId ?? 'None'}>
                    {connectionId
                      ? connectionId.slice(0, CONNECTION_ID_DISPLAY_LENGTH) + '...'
                      : 'None'}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-400'>Messages:</span>
                  <span className='text-purple-400'>{messages.length}</span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className='mt-4 p-3 bg-red-900/30 border border-red-700 rounded'>
                  <Heading element='h4' size='xs' className='text-red-400 font-mono mb-1'>
                    Error
                  </Heading>
                  <p className='text-xs font-mono text-red-300'>{error.message}</p>
                  {error.code && (
                    <p className='text-xs font-mono text-red-400 mt-1'>Code: {error.code}</p>
                  )}
                </div>
              )}

              {/* Subscribed Channels */}
              <div className='mt-4'>
                <Heading element='h4' size='sm' className='mb-2 font-mono text-blue-400'>
                  Subscribed Channels ({channels.length})
                </Heading>
                {channels.length === 0 ? (
                  <p className='text-xs text-gray-500 font-mono'>No channels subscribed</p>
                ) : (
                  <div className='space-y-1'>
                    {channels.map(channel => (
                      <div
                        key={channel}
                        className='px-2 py-1 bg-gray-700 rounded text-xs font-mono text-green-400'
                      >
                        {channel}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Box>

            {/* Messages Panel */}
            <div className='flex-1 overflow-y-auto p-4 font-mono text-xs'>
              <Heading
                element='h3'
                size='sm'
                className='mb-3 text-purple-400 font-mono sticky top-0 bg-gray-900 pb-2'
              >
                Messages ({filteredMessages.length}
                {hasActiveFilters ? ` / ${messages.length}` : ''})
              </Heading>

              {filteredMessages.length === 0 ? (
                <p className='text-gray-500'>
                  {hasActiveFilters
                    ? 'No messages match the current filters.'
                    : 'No messages yet. Stream messages will appear here.'}
                </p>
              ) : (
                <div className='space-y-2'>
                  {filteredMessages.map((msg, idx) => (
                    <div
                      key={msg.id ?? idx}
                      className='p-3 bg-gray-800 border border-gray-700 rounded hover:border-gray-600 transition-colors'
                    >
                      <div className='flex justify-between mb-2'>
                        <span className='text-yellow-400 font-semibold'>{msg.event}</span>
                        <span className='text-gray-500'>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>

                      {msg.channel && <p className='text-blue-400 mb-1'>Channel: {msg.channel}</p>}

                      {msg.type && (
                        <p className='text-green-400 mb-1'>
                          Type: {msg.type}
                          {msg.subtype && ` / ${msg.subtype}`}
                        </p>
                      )}

                      {msg.scope && <p className='text-purple-400 mb-1'>Scope: {msg.scope}</p>}

                      {msg.data !== undefined && msg.data !== null ? (
                        <div className='mt-2 p-2 bg-gray-900 rounded overflow-x-auto'>
                          <pre className='text-gray-300 text-xs'>
                            {JSON.stringify(msg.data, null, JSON_STRINGIFY_SPACING)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Box>
        </Box>
      )}
    </Box>
  );
}
