# ResponsiveTable Component Usage Guide

## Overview

The `ResponsiveTable` component provides a responsive table that automatically switches between mobile card view and desktop table view based on screen size.

## Basic Usage

```vue
<template>
  <ResponsiveTable
    :data="orders"
    :columns="columns"
    :mobile-fields="mobileFields"
    empty-message="Tidak ada pesanan"
    aria-label="Daftar Pesanan"
  >
    <!-- Custom cell content -->
    <template #cell-status="{ row }">
      <span :class="getStatusClass(row.status)">
        {{ row.status }}
      </span>
    </template>

    <!-- Custom mobile view -->
    <template #mobile-status="{ row }">
      <Badge :type="row.status">{{ row.status }}</Badge>
    </template>

    <!-- Custom actions -->
    <template #mobile-actions="{ row }">
      <button @click="viewOrder(row)">Lihat</button>
    </template>
  </ResponsiveTable>
</template>

<script setup lang="ts">
import ResponsiveTable from '@/components/ResponsiveTable.vue';

const orders = ref([...]);

const columns = [
  { key: 'orderNumber', label: 'Order Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total', align: 'right', formatter: (val) => formatCurrency(val) },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date', formatter: (val) => formatDate(val) },
];

const mobileFields = [
  { key: 'orderNumber', label: 'Order' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
];
</script>
```

## Props

- `data` (required): Array of data objects
- `columns` (required): Array of column definitions
- `mobileFields` (optional): Array of fields to show in mobile view
- `rowClass` (optional): Function to add custom classes to rows
- `getRowKey` (optional): Function to get unique key for each row
- `emptyMessage` (optional): Message to show when data is empty
- `ariaLabel` (optional): ARIA label for accessibility

## Column Definition

```typescript
interface Column {
  key: string;              // Data key
  label: string;            // Column header
  align?: 'left' | 'right' | 'center';
  class?: string;           // Custom header class
  cellClass?: string;       // Custom cell class
  formatter?: (value: any) => string;
  mobile?: boolean;         // Show in mobile view (default: true)
}
```

## Slots

- `header-{key}`: Custom header content
- `cell-{key}`: Custom cell content
- `mobile-{key}`: Custom mobile field content
- `mobile-actions`: Actions for mobile view
- `empty`: Custom empty state

## Examples

### With Actions

```vue
<ResponsiveTable :data="products" :columns="columns">
  <template #cell-actions="{ row }">
    <button @click="edit(row)">Edit</button>
    <button @click="delete(row)">Delete</button>
  </template>
</ResponsiveTable>
```

### With Custom Styling

```vue
<ResponsiveTable
  :data="orders"
  :columns="columns"
  :row-class="(row) => row.status === 'urgent' ? 'bg-red-50' : ''"
/>
```

