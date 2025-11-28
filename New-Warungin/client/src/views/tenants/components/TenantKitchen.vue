<template>
  <div class="flex flex-col h-full">
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1">
          <h4 class="font-semibold text-yellow-900">Mode Support Kitchen</h4>
          <p class="text-sm text-yellow-700">Anda sedang melihat Kitchen Orders untuk tenant yang dipilih. Fitur ini memungkinkan Anda membantu tenant saat mereka mengalami masalah.</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <KitchenComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import { useSocket } from '../../../composables/useSocket';
import KitchenComponent from '../../../views/kitchen/KitchenOrders.vue';

interface Props {
  tenantId: string;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const { socket } = useSocket();

watch(() => props.tenantId, (newTenantId) => {
  if (newTenantId) {
    localStorage.setItem('selectedTenantId', newTenantId);
    authStore.setSelectedTenant(newTenantId);
    
    // Join tenant room for socket updates
    if (socket?.connected) {
      socket.emit('join-tenant', newTenantId);
    }
  }
}, { immediate: true });

onMounted(() => {
  if (props.tenantId && socket?.connected) {
    socket.emit('join-tenant', props.tenantId);
  }
});
</script>

