/**
 * Example Server Component using Server-side Core
 *
 * Demonstrates how to use getServerCore() in Server Components.
 * This component runs on the server and can access Core services directly.
 */

import { getServerCore } from '@/core/server';

import ExampleClientComponent from './client';

// Server Component - runs on server, no 'use client' directive
export default async function ExamplePage() {
  // Initialize Core on server
  const core = await getServerCore();

  // Emit event for page view tracking
  core.events.emit('page:view', { page: '/example' });

  // Fetch data server-side (example)
  // const data = await core.db.list('examples');
  // const cachedData = await core.cache.get('examples:featured');

  // Mock data for demonstration
  const serverData = {
    timestamp: new Date().toISOString(),
    appContext: core.appContext,
    message: 'Data fetched on server using Core',
  };

  // JSON serialization spacing for readability
  const JSON_INDENT = 2;

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6 text-gray-900'>Server Component Example</h1>

        <section className='mb-8 bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-semibold mb-3 text-gray-800'>Server-side Data</h2>
          <pre className='bg-gray-100 text-gray-800 p-4 rounded-md text-sm overflow-auto border border-gray-200'>
            {JSON.stringify(serverData, null, JSON_INDENT)}
          </pre>
        </section>

        <section className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-semibold mb-3 text-gray-800'>
            Client Component (uses PlyazProvider)
          </h2>
          {/* Client component receives server data as props */}
          <ExampleClientComponent initialData={serverData} />
        </section>
      </div>
    </div>
  );
}
