<template>
  <div class="flex flex-col h-full">
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1">
          <h4 class="font-semibold text-yellow-900">Mode Support POS</h4>
          <p class="text-sm text-yellow-700">Anda sedang melihat POS untuk tenant yang dipilih. Fitur ini memungkinkan Anda membantu tenant saat mereka mengalami masalah.</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <POSComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, nextTick } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import { useSocket } from '../../../composables/useSocket';
import POSComponent from '../../../views/pos/POS.vue';

interface Props {
  tenantId: string;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const { socket } = useSocket();

// Set tenantId immediately when component is created
if (props.tenantId) {
  localStorage.setItem('selectedTenantId', props.tenantId);
  authStore.setSelectedTenant(props.tenantId);
}

watch(() => props.tenantId, (newTenantId) => {
  if (newTenantId) {
    // Set immediately to ensure it's available before POS component mounts
    localStorage.setItem('selectedTenantId', newTenantId);
    authStore.setSelectedTenant(newTenantId);
    
    // Join tenant room for socket updates
    if (socket?.connected) {
      socket.emit('join-tenant', newTenantId);
    }
  } else {
    localStorage.removeItem('selectedTenantId');
    authStore.setSelectedTenant(null);
  }
}, { immediate: true });

onMounted(async () => {
  // Ensure tenantId is set before POS component tries to load products
  if (props.tenantId) {
    localStorage.setItem('selectedTenantId', props.tenantId);
    authStore.setSelectedTenant(props.tenantId);
    
    // Wait for next tick to ensure localStorage is updated
    await nextTick();
    
    if (socket?.connected) {
      socket.emit('join-tenant', props.tenantId);
    }
  }
});
</script>

