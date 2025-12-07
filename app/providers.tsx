'use client';

import { useEffect } from 'react';
import { initialSync, startBackgroundSync } from '@/lib/sync';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      try {
        // Initial sync in background (non-blocking)
        initialSync().catch(err => console.error('Initial sync failed:', err));

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

  return <>{children}</>;
}
