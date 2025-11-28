/**
 * Enhanced Offline Storage with IndexedDB
 * Provides robust offline data storage and sync capabilities
 */

interface OfflineAction {
  id: string;
  type: string;
  endpoint: string;
  method: string;
  payload: any;
  timestamp: number;
  synced: boolean;
  retries: number;
  error?: string;
}

interface StoredData {
  key: string;
  value: any;
  timestamp: number;
  expiresAt?: number;
}

class OfflineStorageEnhanced {
  private dbName = 'WarunginOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private actionsStore = 'offlineActions';
  private dataStore = 'offlineData';
  private maxRetries = 3;
  private syncInterval: number | null = null;

  async init(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported, offline features will be limited');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        this.startBackgroundSync();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create offline actions store
        if (!db.objectStoreNames.contains(this.actionsStore)) {
          const actionsStore = db.createObjectStore(this.actionsStore, { keyPath: 'id' });
          actionsStore.createIndex('synced', 'synced', { unique: false });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionsStore.createIndex('type', 'type', { unique: false });
        }

        // Create offline data store
        if (!db.objectStoreNames.contains(this.dataStore)) {
          const dataStore = db.createObjectStore(this.dataStore, { keyPath: 'key' });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
          dataStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  /**
   * Store an action to be synced when online
   */
  async storeAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    const actionData: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...action,
      timestamp: Date.now(),
      synced: false,
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.actionsStore], 'readwrite');
      const store = transaction.objectStore(this.actionsStore);
      const request = store.add(actionData);

      request.onsuccess = () => {
        console.log('Action stored offline:', actionData.id);
        resolve(actionData.id);
        // Try to sync immediately if online
        if (navigator.onLine) {
          this.syncActions();
        }
      };

      request.onerror = () => {
        console.error('Failed to store action:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([this.actionsStore], 'readonly');
      const store = transaction.objectStore(this.actionsStore);
      const index = store.index('synced');
      
      // Use openCursor to filter by synced = false
      const request = index.openCursor(IDBKeyRange.only(false));

      const pendingActions: OfflineAction[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          pendingActions.push(cursor.value as OfflineAction);
          cursor.continue();
        } else {
          resolve(pendingActions);
        }
      };

      request.onerror = () => {
        console.error('Failed to get pending actions:', request.error);
        // Return empty array instead of rejecting to prevent app crash
        resolve([]);
      };
    });
  }

  /**
   * Mark action as synced
   */
  async markActionSynced(actionId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.actionsStore], 'readwrite');
      const store = transaction.objectStore(this.actionsStore);
      const request = store.get(actionId);

      request.onsuccess = () => {
        const action = request.result;
        if (action) {
          action.synced = true;
          const updateRequest = store.put(action);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store data for offline access
   */
  async storeData(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const data: StoredData = {
      key,
      value,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.dataStore], 'readwrite');
      const store = transaction.objectStore(this.dataStore);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get stored data
   */
  async getData<T = any>(key: string): Promise<T | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.dataStore], 'readonly');
      const store = transaction.objectStore(this.dataStore);
      const request = store.get(key);

      request.onsuccess = () => {
        const data = request.result as StoredData | undefined;
        if (!data) {
          resolve(null);
          return;
        }

        // Check if expired
        if (data.expiresAt && data.expiresAt < Date.now()) {
          // Delete expired data
          this.deleteData(key);
          resolve(null);
          return;
        }

        resolve(data.value as T);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete stored data
   */
  async deleteData(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.dataStore], 'readwrite');
      const store = transaction.objectStore(this.dataStore);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending actions with server
   */
  async syncActions(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Offline, skipping sync');
      return;
    }

    const pendingActions = await this.getPendingActions();
    if (pendingActions.length === 0) {
      return;
    }

    console.log(`Syncing ${pendingActions.length} pending actions...`);

    // Import API dynamically to avoid circular dependencies
    const { default: api } = await import('../api');

    for (const action of pendingActions) {
      if (action.retries >= this.maxRetries) {
        console.warn(`Action ${action.id} exceeded max retries, marking as failed`);
        await this.markActionSynced(action.id);
        continue;
      }

      try {
        let response;
        switch (action.method.toUpperCase()) {
          case 'POST':
            response = await api.post(action.endpoint, action.payload);
            break;
          case 'PUT':
            response = await api.put(action.endpoint, action.payload);
            break;
          case 'PATCH':
            response = await api.patch(action.endpoint, action.payload);
            break;
          case 'DELETE':
            response = await api.delete(action.endpoint);
            break;
          default:
            console.warn(`Unsupported method: ${action.method}`);
            continue;
        }

        // Success, mark as synced
        await this.markActionSynced(action.id);
        console.log(`Action ${action.id} synced successfully`);
      } catch (error: any) {
        // Increment retry count
        action.retries += 1;
        action.error = error.message;

        // Update action in database
        if (this.db) {
          const transaction = this.db.transaction([this.actionsStore], 'readwrite');
          const store = transaction.objectStore(this.actionsStore);
          store.put(action);
        }

        console.error(`Failed to sync action ${action.id}:`, error);
      }
    }
  }

  /**
   * Start background sync
   */
  private startBackgroundSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.syncActions();
      }
    }, 30000);

    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('Back online, syncing actions...');
      this.syncActions();
    });

    // Register background sync (if supported)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration: ServiceWorkerRegistration) => {
          // Check if sync is available in registration
          if (registration && 'sync' in registration) {
            (registration as any).sync
              .register('sync-actions')
              .catch((err: Error) => {
                console.warn('Background sync registration failed:', err);
              });
          }
        })
        .catch((err: Error) => {
          console.warn('Service worker not ready:', err);
        });
    }
  }

  /**
   * Clean up expired data
   */
  async cleanup(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.dataStore], 'readwrite');
    const store = transaction.objectStore(this.dataStore);
    const index = store.index('expiresAt');
    const request = index.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const data = cursor.value as StoredData;
        if (data.expiresAt && data.expiresAt < Date.now()) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{ pendingActions: number; storedData: number }> {
    const pendingActions = await this.getPendingActions();
    
    let storedDataCount = 0;
    if (this.db) {
      const transaction = this.db.transaction([this.dataStore], 'readonly');
      const store = transaction.objectStore(this.dataStore);
      const countRequest = store.count();
      storedDataCount = await new Promise((resolve) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => resolve(0);
      });
    }

    return {
      pendingActions: pendingActions.length,
      storedData: storedDataCount,
    };
  }
}

// Singleton instance
export const offlineStorageEnhanced = new OfflineStorageEnhanced();

// Initialize on import
if (typeof window !== 'undefined') {
  offlineStorageEnhanced.init().catch((error) => {
    console.error('Failed to initialize offline storage:', error);
  });
}

