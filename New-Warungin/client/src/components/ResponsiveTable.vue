<template>
  <div class="w-full">
    <!-- Mobile Card View -->
    <div class="block sm:hidden space-y-3">
      <div
        v-for="(row, index) in mobileData"
        :key="index"
        class="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
        :class="rowClass?.(row, index)"
      >
        <div class="space-y-2">
          <div
            v-for="(field, fieldIndex) in mobileFields"
            :key="fieldIndex"
            class="flex justify-between items-start"
          >
            <span class="text-xs font-medium text-gray-500 uppercase">{{ field.label }}</span>
            <div class="text-right flex-1 ml-4">
              <slot :name="`mobile-${field.key}`" :row="row" :field="field">
                <span class="text-sm font-medium text-gray-900">{{ formatValue(row[field.key], field) }}</span>
              </slot>
            </div>
          </div>
        </div>
        <div v-if="$slots['mobile-actions']" class="mt-4 pt-4 border-t border-gray-200">
          <slot name="mobile-actions" :row="row" :index="index"></slot>
        </div>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div class="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200" :aria-label="ariaLabel">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.class
                ]"
                :scope="'col'"
              >
                <slot :name="`header-${column.key}`" :column="column">
                  {{ column.label }}
                </slot>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(row, index) in data"
              :key="getRowKey(row, index)"
              class="hover:bg-gray-50 transition-colors"
              :class="rowClass?.(row, index)"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-4 lg:px-6 py-3 whitespace-nowrap text-sm text-gray-900',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.cellClass
                ]"
              >
                <slot :name="`cell-${column.key}`" :row="row" :column="column" :index="index">
                  {{ formatValue(row[column.key], column) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="data.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <slot name="empty">
        <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-gray-500">{{ emptyMessage || 'Tidak ada data' }}</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  class?: string;
  cellClass?: string;
  formatter?: (value: any) => string;
  mobile?: boolean; // Show in mobile view
}

interface Props {
  data: any[];
  columns: Column[];
  mobileFields?: Array<{ key: string; label: string }>;
  rowClass?: (row: any, index: number) => string;
  getRowKey?: (row: any, index: number) => string | number;
  emptyMessage?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mobileFields: undefined,
  rowClass: undefined,
  getRowKey: (row: any, index: number) => row.id || index,
  emptyMessage: 'Tidak ada data',
  ariaLabel: 'Data table',
});

const mobileData = computed(() => props.data);

const mobileFields = computed(() => {
  if (props.mobileFields) {
    return props.mobileFields;
  }
  // Auto-generate from columns (first 3 columns)
  return props.columns
    .filter(col => col.mobile !== false)
    .slice(0, 3)
    .map(col => ({ key: col.key, label: col.label }));
});

const formatValue = (value: any, column: Column) => {
  if (column.formatter) {
    return column.formatter(value);
  }
  if (value === null || value === undefined) {
    return '-';
  }
  return value;
};
</script>

<style scoped>
/* Smooth scrolling for horizontal tables */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background-color: #a0aec0;
}
</style>

