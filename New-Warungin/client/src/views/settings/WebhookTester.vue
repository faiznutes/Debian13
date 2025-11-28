<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Webhook Tester</h1>
        <p class="text-gray-600">Test, preview, dan replay webhook deliveries</p>
      </div>
      <router-link
        to="/app/settings/webhooks"
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
      >
        ← Kembali ke Webhooks
      </router-link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Webhook Selection & Testing -->
      <div class="space-y-6">
        <!-- Webhook Selection -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Pilih Webhook</h2>
          <select
            v-model="selectedWebhookId"
            @change="loadWebhookDetails"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Pilih Webhook</option>
            <option v-for="webhook in webhooks" :key="webhook.id" :value="webhook.id">
              {{ webhook.url }} ({{ webhook.events.length }} events)
            </option>
          </select>

          <div v-if="selectedWebhook" class="mt-4 space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">URL:</span>
              <span class="font-medium text-gray-900">{{ selectedWebhook.url }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Status:</span>
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  selectedWebhook.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ selectedWebhook.isActive ? 'Aktif' : 'Tidak Aktif' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Events:</span>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="event in selectedWebhook.events"
                  :key="event"
                  class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                >
                  {{ event }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Test Webhook -->
        <div v-if="selectedWebhook" class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Test Webhook</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                v-model="testForm.event"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="test.event">Test Event</option>
                <option
                  v-for="event in selectedWebhook.events"
                  :key="event"
                  :value="event"
                >
                  {{ event }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Custom Payload (JSON)</label>
              <textarea
                v-model="testForm.payload"
                rows="8"
                placeholder='{"test": true, "message": "Custom test payload"}'
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">Kosongkan untuk menggunakan default test payload</p>
            </div>

            <button
              @click="testWebhook"
              :disabled="testing"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ testing ? 'Testing...' : 'Test Webhook' }}
            </button>
          </div>
        </div>

        <!-- Preview Payload -->
        <div v-if="selectedWebhook" class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Preview Payload</h2>
          <div class="bg-gray-50 rounded-lg p-4">
            <pre class="text-xs overflow-x-auto">{{ previewPayload }}</pre>
          </div>
          <button
            @click="copyPayload"
            class="mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
          >
            Copy Payload
          </button>
        </div>
      </div>

      <!-- Right: Delivery History -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">Delivery History</h2>
            <button
              v-if="selectedWebhookId"
              @click="loadDeliveries"
              class="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              Refresh
            </button>
          </div>

          <div v-if="!selectedWebhookId" class="text-center py-12 text-gray-500">
            <p>Pilih webhook untuk melihat delivery history</p>
          </div>

          <div v-else>
            <!-- Filters -->
            <div class="mb-4 flex gap-2">
              <select
                v-model="deliveryFilter.status"
                @change="loadDeliveries"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <!-- Loading State -->
            <div v-if="loadingDeliveries" class="flex items-center justify-center py-12">
              <div class="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <!-- Deliveries List -->
            <div v-else class="space-y-3">
              <div
                v-for="delivery in deliveries"
                :key="delivery.id"
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-gray-900">{{ delivery.event }}</span>
                      <span
                        :class="[
                          'px-2 py-1 rounded text-xs font-semibold',
                          delivery.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : delivery.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        ]"
                      >
                        {{ delivery.status }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500">
                      {{ formatDateTime(delivery.createdAt) }}
                    </p>
                    <p v-if="delivery.responseCode" class="text-xs text-gray-600 mt-1">
                      Response: {{ delivery.responseCode }}
                    </p>
                    <p v-if="delivery.attempts > 0" class="text-xs text-gray-600">
                      Attempts: {{ delivery.attempts }}
                    </p>
                  </div>
                  <button
                    v-if="delivery.status === 'FAILED'"
                    @click="replayDelivery(delivery.id)"
                    :disabled="replaying"
                    class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
                    title="Replay"
                  >
                    Replay
                  </button>
                </div>

                <!-- Payload Preview -->
                <details class="mt-2">
                  <summary class="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                    View Payload
                  </summary>
                  <div class="mt-2 bg-gray-50 rounded p-2">
                    <pre class="text-xs overflow-x-auto">{{ JSON.stringify(delivery.payload, null, 2) }}</pre>
                  </div>
                </details>

                <!-- Response Preview -->
                <details v-if="delivery.responseBody" class="mt-2">
                  <summary class="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                    View Response
                  </summary>
                  <div class="mt-2 bg-gray-50 rounded p-2">
                    <pre class="text-xs overflow-x-auto">{{ delivery.responseBody }}</pre>
                  </div>
                </details>
              </div>

              <div v-if="deliveries.length === 0" class="text-center py-8 text-gray-500">
                <p>Belum ada delivery history</p>
              </div>
            </div>

            <!-- Pagination -->
            <div
              v-if="deliveryPagination.totalPages > 1"
              class="mt-4 flex items-center justify-between border-t pt-4"
            >
              <div class="text-sm text-gray-700">
                Page {{ deliveryPagination.page }} of {{ deliveryPagination.totalPages }}
              </div>
              <div class="flex gap-2">
                <button
                  @click="loadDeliveries(deliveryPagination.page - 1)"
                  :disabled="deliveryPagination.page === 1"
                  class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  @click="loadDeliveries(deliveryPagination.page + 1)"
                  :disabled="deliveryPagination.page === deliveryPagination.totalPages"
                  class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import api from '../../api';
import { formatDateTime } from '../../utils/formatters';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError } = useNotification();

const webhooks = ref<any[]>([]);
const selectedWebhookId = ref('');
const selectedWebhook = ref<any>(null);
const deliveries = ref<any[]>([]);
const loadingDeliveries = ref(false);
const testing = ref(false);
const replaying = ref(false);

const testForm = ref({
  event: 'test.event',
  payload: '',
});

const deliveryFilter = ref({
  status: '',
});

const deliveryPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

const previewPayload = computed(() => {
  try {
    const payload = testForm.value.payload
      ? JSON.parse(testForm.value.payload)
      : {
          test: true,
          message: 'This is a test webhook',
          timestamp: new Date().toISOString(),
          webhookId: selectedWebhookId.value,
        };

    return JSON.stringify(
      {
        event: testForm.value.event,
        payload,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  } catch (e) {
    return 'Invalid JSON';
  }
});

const loadWebhooks = async () => {
  try {
    const response = await api.get('/webhooks?includeInactive=true');
    webhooks.value = response.data.webhooks || [];
  } catch (error: any) {
    console.error('Error loading webhooks:', error);
    await showError('Gagal memuat webhooks');
  }
};

const loadWebhookDetails = async () => {
  if (!selectedWebhookId.value) {
    selectedWebhook.value = null;
    deliveries.value = [];
    return;
  }

  selectedWebhook.value = webhooks.value.find((w) => w.id === selectedWebhookId.value);
  await loadDeliveries();
};

const loadDeliveries = async (page = 1) => {
  if (!selectedWebhookId.value) return;

  loadingDeliveries.value = true;
  try {
    const params: any = {
      page,
      limit: deliveryPagination.value.limit,
    };

    if (deliveryFilter.value.status) {
      params.status = deliveryFilter.value.status;
    }

    const response = await api.get(`/webhooks/${selectedWebhookId.value}/deliveries`, { params });
    deliveries.value = response.data.data || [];
    deliveryPagination.value = response.data.pagination || deliveryPagination.value;
    deliveryPagination.value.page = page;
  } catch (error: any) {
    console.error('Error loading deliveries:', error);
    await showError('Gagal memuat delivery history');
  } finally {
    loadingDeliveries.value = false;
  }
};

const testWebhook = async () => {
  if (!selectedWebhookId.value) {
    await showError('Pilih webhook terlebih dahulu');
    return;
  }

  testing.value = true;
  try {
    const payload: any = {
      event: testForm.value.event,
    };

    if (testForm.value.payload) {
      try {
        payload.payload = JSON.parse(testForm.value.payload);
      } catch (e) {
        await showError('Invalid JSON payload');
        testing.value = false;
        return;
      }
    }

    await api.post(`/webhooks/${selectedWebhookId.value}/test`, payload);
    await showSuccess('Test webhook berhasil dikirim!');
    await loadDeliveries(deliveryPagination.value.page);
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    await showError(error.response?.data?.message || 'Gagal mengirim test webhook');
  } finally {
    testing.value = false;
  }
};

const replayDelivery = async (deliveryId: string) => {
  if (!selectedWebhookId.value) return;

  replaying.value = true;
  try {
    await api.post(`/webhooks/${selectedWebhookId.value}/replay/${deliveryId}`);
    await showSuccess('Webhook delivery berhasil di-replay!');
    await loadDeliveries(deliveryPagination.value.page);
  } catch (error: any) {
    console.error('Error replaying delivery:', error);
    await showError(error.response?.data?.message || 'Gagal replay delivery');
  } finally {
    replaying.value = false;
  }
};

const copyPayload = async () => {
  try {
    await navigator.clipboard.writeText(previewPayload.value);
    await showSuccess('Payload berhasil di-copy!');
  } catch (error) {
    await showError('Gagal copy payload');
  }
};

watch(selectedWebhookId, () => {
  loadWebhookDetails();
});

onMounted(async () => {
  await loadWebhooks();
  
  // If webhookId is provided in query, select it
  const webhookId = route.query.webhookId as string;
  if (webhookId) {
    selectedWebhookId.value = webhookId;
    await loadWebhookDetails();
  }
});
</script>

