<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Data Retention Management</h1>
      <p class="text-gray-600">Kelola kebijakan retensi data untuk menghapus data lama secara otomatis</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Retention Statistics -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Statistik Data yang Akan Dihapus</h2>
        <p class="text-sm text-gray-600 mb-4">
          Berdasarkan kebijakan retensi saat ini, berikut adalah jumlah data yang akan dihapus:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="bg-red-50 rounded-lg p-4">
            <div class="text-sm text-red-600 font-medium">Orders</div>
            <div class="text-2xl font-bold text-red-900">{{ stats.ordersToDelete || 0 }}</div>
          </div>
          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Transactions</div>
            <div class="text-2xl font-bold text-orange-900">{{ stats.transactionsToDelete || 0 }}</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4">
            <div class="text-sm text-yellow-600 font-medium">Reports</div>
            <div class="text-2xl font-bold text-yellow-900">{{ stats.reportsToDelete || 0 }}</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Audit Logs</div>
            <div class="text-2xl font-bold text-purple-900">{{ stats.auditLogsToDelete || 0 }}</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Contact Submissions</div>
            <div class="text-2xl font-bold text-blue-900">{{ stats.contactSubmissionsToDelete || 0 }}</div>
          </div>
          <div class="bg-indigo-50 rounded-lg p-4">
            <div class="text-sm text-indigo-600 font-medium">Demo Requests</div>
            <div class="text-2xl font-bold text-indigo-900">{{ stats.demoRequestsToDelete || 0 }}</div>
          </div>
        </div>
        <div class="mt-4">
          <button
            @click="loadStats"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
          >
            Refresh Stats
          </button>
        </div>
      </div>

      <!-- Retention Policy Configuration -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Kebijakan Retensi (Hari)</h2>
        <p class="text-gray-600 mb-6">
          Konfigurasi jumlah hari data akan disimpan sebelum dihapus secara otomatis.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Orders (Default: 365 hari)
            </label>
            <input
              v-model.number="retentionPolicy.orders"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="365"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Transactions (Default: 365 hari)
            </label>
            <input
              v-model.number="retentionPolicy.transactions"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="365"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reports (Default: 180 hari)
            </label>
            <input
              v-model.number="retentionPolicy.reports"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="180"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Audit Logs (Default: 90 hari)
            </label>
            <input
              v-model.number="retentionPolicy.auditLogs"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="90"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Contact Submissions (Default: 90 hari)
            </label>
            <input
              v-model.number="retentionPolicy.contactSubmissions"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="90"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Demo Requests (Default: 90 hari)
            </label>
            <input
              v-model.number="retentionPolicy.demoRequests"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="90"
            />
          </div>
        </div>
      </div>

      <!-- Apply Retention Actions -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Terapkan Kebijakan Retensi</h2>
        <p class="text-gray-600 mb-6">
          <strong class="text-red-600">Peringatan:</strong> Tindakan ini akan menghapus data secara permanen dan tidak dapat dibatalkan. Pastikan Anda sudah membuat backup data penting.
        </p>

        <div class="space-y-4">
          <!-- Apply Orders Retention -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Hapus Orders Lama</h3>
                <p class="text-sm text-gray-600">Hapus orders yang sudah selesai atau dibatalkan berdasarkan kebijakan retensi</p>
              </div>
              <button
                @click="showApplyOrdersModal = true"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Apply Retention
              </button>
            </div>
          </div>

          <!-- Apply Transactions Retention -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Hapus Transactions Lama</h3>
                <p class="text-sm text-gray-600">Hapus transactions yang sudah selesai atau gagal berdasarkan kebijakan retensi</p>
              </div>
              <button
                @click="showApplyTransactionsModal = true"
                class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Apply Retention
              </button>
            </div>
          </div>

          <!-- Apply Reports Retention -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Hapus Reports Lama</h3>
                <p class="text-sm text-gray-600">Hapus reports lama berdasarkan kebijakan retensi</p>
              </div>
              <button
                @click="showApplyReportsModal = true"
                class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                Apply Retention
              </button>
            </div>
          </div>

          <!-- Apply Audit Logs Retention -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Hapus Audit Logs Lama</h3>
                <p class="text-sm text-gray-600">Hapus audit logs lama berdasarkan kebijakan retensi</p>
              </div>
              <button
                @click="showApplyAuditLogsModal = true"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Apply Retention
              </button>
            </div>
          </div>

          <!-- Apply Contact Submissions Retention -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Hapus Contact Submissions Lama</h3>
                <p class="text-sm text-gray-600">Hapus contact submissions lama berdasarkan kebijakan retensi</p>
              </div>
              <button
                @click="showApplyContactSubmissionsModal = true"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Retention
              </button>
            </div>
          </div>

          <!-- Apply Demo Requests Retention -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">Hapus Demo Requests Lama</h3>
                <p class="text-sm text-gray-600">Hapus demo requests lama berdasarkan kebijakan retensi</p>
              </div>
              <button
                @click="showApplyDemoRequestsModal = true"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Apply Retention
              </button>
            </div>
          </div>

          <!-- Apply All Retention -->
          <div class="border-2 border-red-200 bg-red-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-red-900">Terapkan Semua Kebijakan Retensi</h3>
                <p class="text-sm text-red-700">Hapus semua data lama sekaligus berdasarkan kebijakan retensi yang dikonfigurasi</p>
              </div>
              <button
                @click="showApplyAllModal = true"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Apply All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Orders Modal -->
    <div
      v-if="showApplyOrdersModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showApplyOrdersModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Hapus Orders Lama</h3>
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Peringatan:</strong> Tindakan ini akan menghapus {{ stats.ordersToDelete || 0 }} orders secara permanen dan tidak dapat dibatalkan.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Hapus orders lebih lama dari (hari)
            </label>
            <input
              v-model.number="applyOrdersDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              :placeholder="retentionPolicy.orders?.toString() || '365'"
            />
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showApplyOrdersModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="applyOrdersRetention"
              :disabled="applying"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ applying ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Transactions Modal -->
    <div
      v-if="showApplyTransactionsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showApplyTransactionsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Hapus Transactions Lama</h3>
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Peringatan:</strong> Tindakan ini akan menghapus {{ stats.transactionsToDelete || 0 }} transactions secara permanen dan tidak dapat dibatalkan.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Hapus transactions lebih lama dari (hari)
            </label>
            <input
              v-model.number="applyTransactionsDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              :placeholder="retentionPolicy.transactions?.toString() || '365'"
            />
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showApplyTransactionsModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="applyTransactionsRetention"
              :disabled="applying"
              class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ applying ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Reports Modal -->
    <div
      v-if="showApplyReportsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showApplyReportsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Hapus Reports Lama</h3>
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Peringatan:</strong> Tindakan ini akan menghapus {{ stats.reportsToDelete || 0 }} reports secara permanen dan tidak dapat dibatalkan.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Hapus reports lebih lama dari (hari)
            </label>
            <input
              v-model.number="applyReportsDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              :placeholder="retentionPolicy.reports?.toString() || '180'"
            />
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showApplyReportsModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="applyReportsRetention"
              :disabled="applying"
              class="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ applying ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Audit Logs Modal -->
    <div
      v-if="showApplyAuditLogsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showApplyAuditLogsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Hapus Audit Logs Lama</h3>
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Peringatan:</strong> Tindakan ini akan menghapus {{ stats.auditLogsToDelete || 0 }} audit logs secara permanen dan tidak dapat dibatalkan.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Hapus audit logs lebih lama dari (hari)
            </label>
            <input
              v-model.number="applyAuditLogsDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              :placeholder="retentionPolicy.auditLogs?.toString() || '90'"
            />
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showApplyAuditLogsModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="applyAuditLogsRetention"
              :disabled="applying"
              class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ applying ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Contact Submissions Modal -->
    <div
      v-if="showApplyContactSubmissionsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showApplyContactSubmissionsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Hapus Contact Submissions Lama</h3>
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Peringatan:</strong> Tindakan ini akan menghapus {{ stats.contactSubmissionsToDelete || 0 }} contact submissions secara permanen dan tidak dapat dibatalkan.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Hapus contact submissions lebih lama dari (hari)
            </label>
            <input
              v-model.number="applyContactSubmissionsDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              :placeholder="retentionPolicy.contactSubmissions?.toString() || '90'"
            />
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showApplyContactSubmissionsModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="applyContactSubmissionsRetention"
              :disabled="applying"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ applying ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Demo Requests Modal -->
    <div
      v-if="showApplyDemoRequestsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showApplyDemoRequestsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Hapus Demo Requests Lama</h3>
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Peringatan:</strong> Tindakan ini akan menghapus {{ stats.demoRequestsToDelete || 0 }} demo requests secara permanen dan tidak dapat dibatalkan.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Hapus demo requests lebih lama dari (hari)
            </label>
            <input
              v-model.number="applyDemoRequestsDays"
              type="number"
              min="30"
              max="3650"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              :placeholder="retentionPolicy.demoRequests?.toString() || '90'"
            />
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showApplyDemoRequestsModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="applyDemoRequestsRetention"
              :disabled="applying"
              class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ applying ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply All Modal -->
    <div
      v-if="showApplyAllModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showApplyAllModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Terapkan Semua Kebijakan Retensi</h3>
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Peringatan Kritis:</strong> Tindakan ini akan menghapus semua data lama secara permanen berdasarkan kebijakan retensi yang dikonfigurasi. Tindakan ini tidak dapat dibatalkan.
            </p>
            <p class="text-sm text-red-800 mt-2">
              Total data yang akan dihapus:
            </p>
            <ul class="text-sm text-red-800 mt-2 list-disc list-inside">
              <li>{{ stats.ordersToDelete || 0 }} orders</li>
              <li>{{ stats.transactionsToDelete || 0 }} transactions</li>
              <li>{{ stats.reportsToDelete || 0 }} reports</li>
              <li>{{ stats.auditLogsToDelete || 0 }} audit logs</li>
              <li>{{ stats.contactSubmissionsToDelete || 0 }} contact submissions</li>
              <li>{{ stats.demoRequestsToDelete || 0 }} demo requests</li>
            </ul>
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              @click="showApplyAllModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              @click="applyAllRetention"
              :disabled="applying"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ applying ? 'Menghapus...' : 'Hapus Semua' }}
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
import { useNotification } from '../../composables/useNotification';
import { useTenantCheck } from '../../composables/useTenantCheck';

const { needsTenantSelection } = useTenantCheck();
const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

const loading = ref(true);
const applying = ref(false);
const stats = ref({
  ordersToDelete: 0,
  transactionsToDelete: 0,
  reportsToDelete: 0,
  auditLogsToDelete: 0,
  contactSubmissionsToDelete: 0,
  demoRequestsToDelete: 0,
});

const retentionPolicy = ref({
  orders: 365,
  transactions: 365,
  reports: 180,
  auditLogs: 90,
  contactSubmissions: 90,
  demoRequests: 90,
});

const showApplyOrdersModal = ref(false);
const showApplyTransactionsModal = ref(false);
const showApplyReportsModal = ref(false);
const showApplyAuditLogsModal = ref(false);
const showApplyContactSubmissionsModal = ref(false);
const showApplyDemoRequestsModal = ref(false);
const showApplyAllModal = ref(false);

const applyOrdersDays = ref(365);
const applyTransactionsDays = ref(365);
const applyReportsDays = ref(180);
const applyAuditLogsDays = ref(90);
const applyContactSubmissionsDays = ref(90);
const applyDemoRequestsDays = ref(90);

const loadStats = async () => {
  if (needsTenantSelection.value) return;

  try {
    const policy = {
      orders: retentionPolicy.value.orders,
      transactions: retentionPolicy.value.transactions,
      reports: retentionPolicy.value.reports,
      auditLogs: retentionPolicy.value.auditLogs,
      contactSubmissions: retentionPolicy.value.contactSubmissions,
      demoRequests: retentionPolicy.value.demoRequests,
    };
    const response = await api.get('/retention/stats', {
      params: { policy: JSON.stringify(policy) },
    });
    stats.value = response.data;
  } catch (error: any) {
    console.error('Error loading retention stats:', error);
    showError('Gagal memuat statistik retensi');
  }
};

const applyOrdersRetention = async () => {
  const confirmed = await showConfirm(
    'Hapus Orders Lama',
    `Apakah Anda yakin ingin menghapus ${stats.value.ordersToDelete || 0} orders? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus',
    'Cancel'
  );
  
  if (!confirmed) {
    showApplyOrdersModal.value = false;
    return;
  }

  applying.value = true;
  try {
    const response = await api.post('/retention/orders', {
      days: applyOrdersDays.value || retentionPolicy.value.orders || 365,
    });
    showSuccess(`Berhasil menghapus ${response.data.deletedCount} orders`);
    showApplyOrdersModal.value = false;
    await loadStats();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal menghapus orders');
  } finally {
    applying.value = false;
  }
};

const applyTransactionsRetention = async () => {
  const confirmed = await showConfirm(
    'Hapus Transactions Lama',
    `Apakah Anda yakin ingin menghapus ${stats.value.transactionsToDelete || 0} transactions? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus',
    'Cancel'
  );
  
  if (!confirmed) {
    showApplyTransactionsModal.value = false;
    return;
  }

  applying.value = true;
  try {
    const response = await api.post('/retention/transactions', {
      days: applyTransactionsDays.value || retentionPolicy.value.transactions || 365,
    });
    showSuccess(`Berhasil menghapus ${response.data.deletedCount} transactions`);
    showApplyTransactionsModal.value = false;
    await loadStats();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal menghapus transactions');
  } finally {
    applying.value = false;
  }
};

const applyReportsRetention = async () => {
  const confirmed = await showConfirm(
    'Hapus Reports Lama',
    `Apakah Anda yakin ingin menghapus ${stats.value.reportsToDelete || 0} reports? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus',
    'Cancel'
  );
  
  if (!confirmed) {
    showApplyReportsModal.value = false;
    return;
  }

  applying.value = true;
  try {
    const response = await api.post('/retention/reports', {
      days: applyReportsDays.value || retentionPolicy.value.reports || 180,
    });
    showSuccess(`Berhasil menghapus ${response.data.deletedCount} reports`);
    showApplyReportsModal.value = false;
    await loadStats();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal menghapus reports');
  } finally {
    applying.value = false;
  }
};

const applyAuditLogsRetention = async () => {
  const confirmed = await showConfirm(
    'Hapus Audit Logs Lama',
    `Apakah Anda yakin ingin menghapus ${stats.value.auditLogsToDelete || 0} audit logs? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus',
    'Cancel'
  );
  
  if (!confirmed) {
    showApplyAuditLogsModal.value = false;
    return;
  }

  applying.value = true;
  try {
    const response = await api.post('/retention/audit-logs', {
      days: applyAuditLogsDays.value || retentionPolicy.value.auditLogs || 90,
    });
    showSuccess(`Berhasil menghapus ${response.data.deletedCount} audit logs`);
    showApplyAuditLogsModal.value = false;
    await loadStats();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal menghapus audit logs');
  } finally {
    applying.value = false;
  }
};

const applyContactSubmissionsRetention = async () => {
  const confirmed = await showConfirm(
    'Hapus Contact Submissions Lama',
    `Apakah Anda yakin ingin menghapus ${stats.value.contactSubmissionsToDelete || 0} contact submissions? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus',
    'Cancel'
  );
  
  if (!confirmed) {
    showApplyContactSubmissionsModal.value = false;
    return;
  }

  applying.value = true;
  try {
    const response = await api.post('/retention/contact-submissions', {
      days: applyContactSubmissionsDays.value || retentionPolicy.value.contactSubmissions || 90,
    });
    showSuccess(`Berhasil menghapus ${response.data.deletedCount} contact submissions`);
    showApplyContactSubmissionsModal.value = false;
    await loadStats();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal menghapus contact submissions');
  } finally {
    applying.value = false;
  }
};

const applyDemoRequestsRetention = async () => {
  const confirmed = await showConfirm(
    'Hapus Demo Requests Lama',
    `Apakah Anda yakin ingin menghapus ${stats.value.demoRequestsToDelete || 0} demo requests? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus',
    'Cancel'
  );
  
  if (!confirmed) {
    showApplyDemoRequestsModal.value = false;
    return;
  }

  applying.value = true;
  try {
    const response = await api.post('/retention/demo-requests', {
      days: applyDemoRequestsDays.value || retentionPolicy.value.demoRequests || 90,
    });
    showSuccess(`Berhasil menghapus ${response.data.deletedCount} demo requests`);
    showApplyDemoRequestsModal.value = false;
    await loadStats();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal menghapus demo requests');
  } finally {
    applying.value = false;
  }
};

const applyAllRetention = async () => {
  const totalToDelete = 
    (stats.value.ordersToDelete || 0) +
    (stats.value.transactionsToDelete || 0) +
    (stats.value.reportsToDelete || 0) +
    (stats.value.auditLogsToDelete || 0) +
    (stats.value.contactSubmissionsToDelete || 0) +
    (stats.value.demoRequestsToDelete || 0);

  const confirmed = await showConfirm(
    'Terapkan Semua Kebijakan Retensi',
    `Apakah Anda yakin ingin menghapus ${totalToDelete} data secara permanen? Tindakan ini tidak dapat dibatalkan. Pastikan Anda sudah membuat backup data penting.`,
    'Hapus Semua',
    'Cancel'
  );
  
  if (!confirmed) {
    showApplyAllModal.value = false;
    return;
  }

  applying.value = true;
  try {
    const response = await api.post('/retention/all', {
      policy: retentionPolicy.value,
    });
    showSuccess(
      `Berhasil menghapus: ${response.data.orders} orders, ${response.data.transactions} transactions, ${response.data.reports} reports, ${response.data.auditLogs} audit logs, ${response.data.contactSubmissions} contact submissions, ${response.data.demoRequests} demo requests`
    );
    showApplyAllModal.value = false;
    await loadStats();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Gagal menghapus data');
  } finally {
    applying.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  await loadStats();
  loading.value = false;
});
</script>

