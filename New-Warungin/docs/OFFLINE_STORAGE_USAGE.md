# Offline Storage Usage Guide

## Overview

The enhanced offline storage system provides robust offline data storage and synchronization using IndexedDB.

## Basic Usage

```typescript
import { offlineStorageEnhanced } from '@/utils/offline-storage-enhanced';

// Store data for offline access
await offlineStorageEnhanced.storeData('products', products, 3600000); // 1 hour TTL

// Retrieve data
const products = await offlineStorageEnhanced.getData('products');

// Store action to sync when online
await offlineStorageEnhanced.storeAction({
  type: 'CREATE_ORDER',
  endpoint: '/api/orders',
  method: 'POST',
  payload: orderData,
});
```

## API Reference

### storeData(key, value, ttl?)

Store data for offline access.

- `key`: Unique identifier
- `value`: Data to store (any serializable value)
- `ttl`: Optional time-to-live in milliseconds

### getData(key)

Retrieve stored data.

- Returns: `Promise<T | null>`

### deleteData(key)

Delete stored data.

### storeAction(action)

Store an action to be synced when online.

```typescript
interface OfflineAction {
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
}
```

### getPendingActions()

Get all pending actions that need to be synced.

### syncActions()

Manually trigger sync of pending actions.

### getStats()

Get storage statistics.

```typescript
const stats = await offlineStorageEnhanced.getStats();
// { pendingActions: 5, storedData: 10 }
```

## Integration Example

```typescript
// In your component
import { offlineStorageEnhanced } from '@/utils/offline-storage-enhanced';
import api from '@/api';

async function createOrder(orderData: any) {
  try {
    // Try to create order online
    const response = await api.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    // If offline, store for later sync
    if (!navigator.onLine) {
      await offlineStorageEnhanced.storeAction({
        type: 'CREATE_ORDER',
        endpoint: '/api/orders',
        method: 'POST',
        payload: orderData,
      });
      
      // Show success message to user
      showNotification('Order akan dibuat saat koneksi tersedia');
      return { id: 'pending', ...orderData };
    }
    throw error;
  }
}
```

## Automatic Sync

The system automatically syncs when:
- Coming back online
- Every 30 seconds (when online)
- Background sync (if supported by browser)

## Best Practices

1. **Store critical data**: Store data that users need offline
2. **Set appropriate TTL**: Don't store data forever
3. **Handle conflicts**: Implement conflict resolution for critical operations
4. **User feedback**: Inform users when actions are queued for sync
5. **Error handling**: Handle sync failures gracefully

