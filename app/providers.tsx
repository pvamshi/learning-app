'use client';

import { useEffect, useState } from 'react';
import { initialSync, startBackgroundSync } from '@/lib/sync';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      try {
        // Initial sync once per session
        await initialSync();
        setSynced(true);

        // Start background sync
        cleanup = startBackgroundSync(10000);
      } catch (err) {
        console.error('Sync initialization failed:', err);
      }
    }

    init();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  if (!synced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading...</div>
          <div className="text-gray-600">Syncing questions</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
