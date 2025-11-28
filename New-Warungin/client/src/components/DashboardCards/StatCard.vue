<template>
  <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 mb-1">{{ label }}</p>
        <p class="text-3xl font-bold text-gray-900">{{ formattedValue }}</p>
        <p v-if="subtitle" class="text-sm text-gray-600 mt-2">{{ subtitle }}</p>
      </div>
      <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', iconBgClass]">
        <slot name="icon">
          <svg class="w-6 h-6" :class="iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  label: string;
  value: number | string;
  type?: 'currency' | 'number' | 'text';
  subtitle?: string;
  iconBgClass?: string;
  iconClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'number',
  iconBgClass: 'bg-primary-100',
  iconClass: 'text-primary-600',
});

const formattedValue = computed(() => {
  if (props.type === 'currency') {
    return formatCurrency(Number(props.value));
  }
  return props.value;
});
</script>

