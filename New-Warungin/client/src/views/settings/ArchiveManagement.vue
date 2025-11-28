<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Archive Management</h1>
      <p class="text-gray-600">Kelola arsip data lama untuk mengoptimalkan performa database</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Archive Statistics -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Statistik Archive</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Orders Archived</div>
            <div class="text-2xl font-bold text-blue-900">{{ stats.ordersCount || 0 }}</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Transactions Archived</div>
            <div class="text-2xl font-bold text-green-900">{{ stats.transactionsCount || 0 }}</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Reports Archived</div>
            <div class="text-2xl font-bold text-purple-900">{{ stats.reportsCount || 0 }}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600 font-medium">Total Size</div>
            <div class="text-2xl font-bold text-gray-900">{{ formatFileSize(stats.totalSize || 0) }}</div>
          </div>
        </div>
      </div>

      <!-- Archive Actions -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Archive Data</h2>
        <p class="text-gray-600 mb-6">
          Archive data lama untuk mengurangi ukuran database dan meningkatkan performa. Data yang di-archive akan disimpan dalam file JSON dan dihapus dari database.
        </p>

        <div class="space-y-4">
          <!-- Archive Orders -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Archive Orders</h3>
                <p class="text-sm text-gray-600">Archive orders yang sudah selesai atau dibatalkan</p>
              </div>
              <button
                @click="showArchiveOrdersModal = true"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Archive Orders
              </button>
            </div>
          </div>

          <!-- Archive Transactions -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Archive Transactions</h3>
                <p class="text-sm text-gray-600">Archive transactions yang sudah selesai atau gagal</p>
              </div>
              <button
                @click="showArchiveTransactionsModal = true"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Archive Transactions
              </button>
            </div>
          </div>

          <!-- Archive Reports -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Archive Reports</h3>
                <p class="text-sm text-gray-600">Archive reports lama</p>
              </div>
              <button
                @click="showArchiveReportsModal = true"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Archive Reports
              </button>
            </div>
          </div>

          <!-- Archive All -->
          <div class="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-orange-900">Archive All Data</h3>
                <p class="text-sm text-orange-700">Archive semua data lama sekaligus (Orders, Transactions, Reports)</p>
              </div>
              <button
                @click="showArchiveAllModal = true"
                class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Archive All
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Archive Files List -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Archive Files</h2>
          <button
            @click="loadArchiveFiles"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
          >
            Refresh
          </button>
        </div>

        <div v-if="archiveFiles.length === 0" class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Belum ada file archive</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="file in archiveFiles" :key="file.path" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ file.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      file.type === 'orders' ? 'bg-blue-100 text-blue-800' :
                      file.type === 'transactions' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    ]"
                  >
                    {{ file.type }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatFileSize(file.size) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(file.createdAt) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    @click="restoreArchive(file.path)"
                    class="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Restore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Archive Orders Modal -->
    <div
      v-if="showArchiveOrdersModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showArchiveOrdersModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Archive Orders</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Archive orders older than (days)
            </label>
            <input
              v-model.number="archiveOrdersDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="365"
            />
            <p class="text-xs text-gray-500 mt-1">Default: 365 days (1 year)</p>
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showArchiveOrdersModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="archiveOrders"
              :disabled="archiving"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ archiving ? 'Archiving...' : 'Archive' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Archive Transactions Modal -->
    <div
      v-if="showArchiveTransactionsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showArchiveTransactionsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Archive Transactions</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Archive transactions older than (days)
            </label>
            <input
              v-model.number="archiveTransactionsDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="365"
            />
            <p class="text-xs text-gray-500 mt-1">Default: 365 days (1 year)</p>
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showArchiveTransactionsModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="archiveTransactions"
              :disabled="archiving"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ archiving ? 'Archiving...' : 'Archive' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Archive Reports Modal -->
    <div
      v-if="showArchiveReportsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showArchiveReportsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Archive Reports</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Archive reports older than (days)
            </label>
            <input
              v-model.number="archiveReportsDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="180"
            />
            <p class="text-xs text-gray-500 mt-1">Default: 180 days (6 months)</p>
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showArchiveReportsModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="archiveReports"
              :disabled="archiving"
              class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ archiving ? 'Archiving...' : 'Archive' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Archive All Modal -->
    <div
      v-if="showArchiveAllModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showArchiveAllModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Archive All Data</h3>
        <div class="space-y-4">
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p class="text-sm text-orange-800">
              <strong>Warning:</strong> This will archive all old data (orders, transactions, and reports) based on the configured days below.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Archive orders older than (days)
            </label>
            <input
              v-model.number="archiveAllConfig.ordersOlderThanDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="365"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Archive transactions older than (days)
            </label>
            <input
              v-model.number="archiveAllConfig.transactionsOlderThanDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="365"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Archive reports older than (days)
            </label>
            <input
              v-model.number="archiveAllConfig.reportsOlderThanDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="180"
            />
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showArchiveAllModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="archiveAll"
              :disabled="archiving"
              class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ archiving ? 'Archiving...' : 'Archive All' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { formatDateTime } from '../../utils/formatters';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

const loading = ref(true);
const archiving = ref(false);
const stats = ref({
  ordersCount: 0,
  transactionsCount: 0,
  reportsCount: 0,
  totalSize: 0,
});
const archiveFiles = ref<any[]>([]);

const showArchiveOrdersModal = ref(false);
const showArchiveTransactionsModal = ref(false);
const showArchiveReportsModal = ref(false);
const showArchiveAllModal = ref(false);

const archiveOrdersDays = ref(365);
const archiveTransactionsDays = ref(365);
const archiveReportsDays = ref(180);
const archiveAllConfig = ref({
  ordersOlderThanDays: 365,
  transactionsOlderThanDays: 365,
  reportsOlderThanDays: 180,
});

const loadStats = async () => {
  try {
    const response = await api.get('/archives/stats');
    stats.value = response.data;
  } catch (error: any) {
    console.error('Error loading archive stats:', error);
  }
};

const loadArchiveFiles = async () => {
  try {
    const response = await api.get('/archives/files');
    archiveFiles.value = response.data.files || [];
  } catch (error: any) {
    console.error('Error loading archive files:', error);
    showError('Gagal memuat daftar file archive');
  }
};

const archiveOrders = async () => {
  archiving.value = true;
  try {
    const response = await api.post('/archives/orders', {
      olderThanDays: archiveOrdersDays.value || 365,
    });
    showSuccess(`Berhasil meng-archive ${response.data.count} orders`);
    showArchiveOrdersModal.value = false;
    await Promise.all([loadStats(), loadArchiveFiles()]);
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal meng-archive orders');
  } finally {
    archiving.value = false;
  }
};

const archiveTransactions = async () => {
  archiving.value = true;
  try {
    const response = await api.post('/archives/transactions', {
      olderThanDays: archiveTransactionsDays.value || 365,
    });
    showSuccess(`Berhasil meng-archive ${response.data.count} transactions`);
    showArchiveTransactionsModal.value = false;
    await Promise.all([loadStats(), loadArchiveFiles()]);
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal meng-archive transactions');
  } finally {
    archiving.value = false;
  }
};

const archiveReports = async () => {
  archiving.value = true;
  try {
    const response = await api.post('/archives/reports', {
      olderThanDays: archiveReportsDays.value || 180,
    });
    showSuccess(`Berhasil meng-archive ${response.data.count} reports`);
    showArchiveReportsModal.value = false;
    await Promise.all([loadStats(), loadArchiveFiles()]);
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal meng-archive reports');
  } finally {
    archiving.value = false;
  }
};

const archiveAll = async () => {
  const confirmed = await showConfirm(
    'Archive All Data',
    'Apakah Anda yakin ingin meng-archive semua data lama? Tindakan ini tidak dapat dibatalkan.',
    'Archive',
    'Cancel'
  );
  
  if (!confirmed) return;

  archiving.value = true;
  try {
    const response = await api.post('/archives/all', archiveAllConfig.value);
    showSuccess(
      `Berhasil meng-archive: ${response.data.orders} orders, ${response.data.transactions} transactions, ${response.data.reports} reports`
    );
    showArchiveAllModal.value = false;
    await Promise.all([loadStats(), loadArchiveFiles()]);
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal meng-archive data');
  } finally {
    archiving.value = false;
  }
};

const restoreArchive = async (archiveFile: string) => {
  const confirmed = await showConfirm(
    'Restore Archive',
    'Apakah Anda yakin ingin restore data dari archive ini?',
    'Restore',
    'Cancel'
  );
  
  if (!confirmed) return;

  try {
    await api.post('/archives/restore', { archiveFile });
    showSuccess('Berhasil restore data dari archive');
    await Promise.all([loadStats(), loadArchiveFiles()]);
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal restore archive');
  }
};

const formatDate = (date: string | Date) => {
  if (!date) return '-';
  return formatDateTime(date);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([loadStats(), loadArchiveFiles()]);
  loading.value = false;
});
</script>

