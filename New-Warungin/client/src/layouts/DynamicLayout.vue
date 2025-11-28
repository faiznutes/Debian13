<template>
  <component v-if="layoutComponent" :is="layoutComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import SuperAdminLayout from './SuperAdminLayout.vue';
import TenantLayout from './TenantLayout.vue';
import KasirLayout from './KasirLayout.vue';
import KitchenLayout from './KitchenLayout.vue';
import AppLayout from './AppLayout.vue';

const authStore = useAuthStore();

const layoutComponent = computed(() => {
  // If no user or not authenticated, return null to avoid flash
  // Router guard will handle redirect to login
  if (!authStore.user || !authStore.isAuthenticated) {
    return null;
  }
  
  const role = authStore.user.role;
  
  switch (role) {
    case 'SUPER_ADMIN':
      return SuperAdminLayout;
    case 'ADMIN_TENANT':
    case 'SUPERVISOR':
      return TenantLayout;
    case 'CASHIER':
      return KasirLayout;
    case 'KITCHEN':
      return KitchenLayout;
    default:
      return AppLayout;
  }
});
</script>

