<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Webhooks</h1>
        <p class="text-gray-600">Kelola webhook untuk integrasi dengan sistem eksternal</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
      >
        + Buat Webhook
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Webhooks List -->
    <div v-else class="space-y-4">
      <div v-if="webhooks.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p class="text-gray-600 mb-4">Belum ada webhook yang dibuat</p>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Buat Webhook Pertama
        </button>
      </div>

      <div
        v-for="webhook in webhooks"
        :key="webhook.id"
        class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ webhook.url }}</h3>
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  webhook.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ webhook.isActive ? 'Aktif' : 'Tidak Aktif' }}
              </span>
            </div>

            <div class="space-y-2 text-sm text-gray-600">
              <div>
                <strong>Events:</strong>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span
                    v-for="event in webhook.events"
                    :key="event"
                    class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                  >
                    {{ event }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <strong>Retry Count:</strong> {{ webhook.retryCount || 3 }}
                </div>
                <div>
                  <strong>Timeout:</strong> {{ webhook.timeout || 5000 }}ms
                </div>
              </div>

              <div v-if="webhook.lastDeliveryAt" class="text-xs text-gray-500 mt-2">
                Last delivery: {{ formatDate(webhook.lastDeliveryAt) }}
              </div>
            </div>
          </div>

          <div class="flex space-x-2 ml-4">
            <router-link
              :to="`/app/settings/webhooks/tester?webhookId=${webhook.id}`"
              class="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
            >
              Tester
            </router-link>
            <button
              @click="testWebhook(webhook.id)"
              class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
            >
              Test
            </button>
            <button
              @click="editWebhook(webhook)"
              class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm"
            >
              Edit
            </button>
            <button
              @click="deleteWebhook(webhook.id)"
              class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || editingWebhook"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            {{ editingWebhook ? 'Edit Webhook' : 'Buat Webhook Baru' }}
          </h3>

          <form @submit.prevent="saveWebhook" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">URL *</label>
              <input
                v-model="webhookForm.url"
                type="url"
                required
                placeholder="https://example.com/webhook"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Events *</label>
              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="event in availableEvents"
                  :key="event"
                  class="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="event"
                    v-model="webhookForm.events"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">{{ event }}</span>
                </label>
              </div>
              <p v-if="webhookForm.events.length === 0" class="text-sm text-red-600 mt-1">
                Minimal pilih 1 event
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Retry Count</label>
                <input
                  v-model.number="webhookForm.retryCount"
                  type="number"
                  min="1"
                  max="10"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Timeout (ms)</label>
                <input
                  v-model.number="webhookForm.timeout"
                  type="number"
                  min="1000"
                  max="30000"
                  step="1000"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  v-model="webhookForm.isActive"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700">Aktif</span>
              </label>
            </div>

            <div class="flex space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || webhookForm.events.length === 0"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';

const loading = ref(true);
const webhooks = ref<any[]>([]);

const showCreateModal = ref(false);
const editingWebhook = ref<any>(null);
const saving = ref(false);

const availableEvents = [
  'order.created',
  'order.updated',
  'order.completed',
  'order.cancelled',
  'payment.completed',
  'payment.failed',
  'product.created',
  'product.updated',
  'product.deleted',
  'customer.created',
  'customer.updated',
  'subscription.created',
  'subscription.updated',
  'subscription.expired',
];

const webhookForm = ref({
  url: '',
  events: [] as string[],
  isActive: true,
  retryCount: 3,
  timeout: 5000,
});

const loadWebhooks = async () => {
  try {
    const response = await api.get('/webhooks?includeInactive=true');
    webhooks.value = response.data.webhooks || [];
  } catch (error: any) {
    console.error('Error loading webhooks:', error);
  } finally {
    loading.value = false;
  }
};

const saveWebhook = async () => {
  if (webhookForm.value.events.length === 0) {
    return;
  }

  saving.value = true;

  try {
    if (editingWebhook.value) {
      await api.put(`/webhooks/${editingWebhook.value.id}`, webhookForm.value);
    } else {
      await api.post('/webhooks', webhookForm.value);
    }

    await loadWebhooks();
    closeModal();
  } catch (error: any) {
    console.error('Error saving webhook:', error);
    alert(error.response?.data?.message || 'Gagal menyimpan webhook');
  } finally {
    saving.value = false;
  }
};

const editWebhook = (webhook: any) => {
  editingWebhook.value = webhook;
  webhookForm.value = {
    url: webhook.url,
    events: [...webhook.events],
    isActive: webhook.isActive,
    retryCount: webhook.retryCount || 3,
    timeout: webhook.timeout || 5000,
  };
  showCreateModal.value = true;
};

const deleteWebhook = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus webhook ini?')) {
    return;
  }

  try {
    await api.delete(`/webhooks/${id}`);
    await loadWebhooks();
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    alert(error.response?.data?.message || 'Gagal menghapus webhook');
  }
};

const testWebhook = async (id: string) => {
  try {
    await api.post(`/webhooks/${id}/test`);
    alert('Test webhook berhasil dikirim!');
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    alert(error.response?.data?.message || 'Gagal mengirim test webhook');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingWebhook.value = null;
  webhookForm.value = {
    url: '',
    events: [],
    isActive: true,
    retryCount: 3,
    timeout: 5000,
  };
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  loadWebhooks();
});
</script>

