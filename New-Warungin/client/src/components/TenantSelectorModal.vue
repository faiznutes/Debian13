<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="handleCancel"
  >
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Pilih Tenant</h2>
        <button
          @click="handleCancel"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="text-gray-600 mb-6">
        Sebagai Super Admin, Anda perlu memilih tenant untuk melihat data mereka.
      </p>

      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Memuat daftar tenant...</p>
      </div>

      <div v-else-if="tenants.length === 0" class="text-center py-8">
        <p class="text-gray-600">Tidak ada tenant tersedia.</p>
      </div>

      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <button
          v-for="tenant in tenants"
          :key="tenant.id"
          @click="handleSelect(tenant.id)"
          class="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
        >
          <div class="font-semibold text-gray-900">{{ tenant.name }}</div>
          <div class="text-sm text-gray-500 mt-1">{{ tenant.email || tenant.slug }}</div>
        </button>
      </div>

      <div class="mt-6 flex justify-end space-x-3">
        <button
          @click="handleCancel"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Batal
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', tenantId: string): void;
}>();

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const tenants = ref<any[]>([]);

const loadTenants = async () => {
  loading.value = true;
  try {
    // Use tenants from store if available, otherwise fetch
    if (authStore.tenants.length === 0) {
      await authStore.fetchTenants();
    }
    tenants.value = authStore.tenants;
  } catch (error) {
    console.error('Error loading tenants:', error);
  } finally {
    loading.value = false;
  }
};

const handleSelect = (tenantId: string) => {
  authStore.setSelectedTenant(tenantId);
  emit('select', tenantId);
  emit('close');
};

const handleCancel = () => {
  emit('close');
  // Redirect to dashboard if no tenant selected
  if (!authStore.selectedTenantId) {
    router.push('/app/dashboard');
  }
};

watch(() => props.show, (newValue) => {
  if (newValue && tenants.value.length === 0) {
    loadTenants();
  }
});

onMounted(() => {
  if (props.show) {
    loadTenants();
  }
});
</script>

