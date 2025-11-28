/**
 * Offline Storage Utility
 * Uses IndexedDB for offline data storage and sync
 */

interface OfflineAction {
  id: string;
  type: 'order' | 'transaction' | 'product' | 'customer';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private dbName = 'warungin-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for offline actions
        if (!db.objectStoreNames.contains('actions')) {
          const actionStore = db.createObjectStore('actions', { keyPath: 'id' });
          actionStore.createIndex('type', 'type', { unique: false });
          actionStore.createIndex('synced', 'synced', { unique: false });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create object store for cached data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Store offline action
   */
  async storeAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineAction: OfflineAction = {
      id,
      ...action,
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.add(offlineAction);

      request.onsuccess = () => {
        console.log('Offline action stored:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to store offline action:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all unsynced actions
   */
  async getUnsyncedActions(): Promise<OfflineAction[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get unsynced actions:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark action as synced
   */
  async markAsSynced(actionId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const getRequest = store.get(actionId);

      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.synced = true;
          const updateRequest = store.put(action);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Cache API response
   */
  async cacheResponse(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cacheEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached response
   */
  async getCachedResponse(key: string): Promise<any | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
          // Delete expired cache
          const deleteTransaction = this.db!.transaction(['cache'], 'readwrite');
          deleteTransaction.objectStore('cache').delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

