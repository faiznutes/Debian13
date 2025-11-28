<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Laporan Global</h2>
        <p class="text-gray-600">Analisis keseluruhan semua tenant</p>
      </div>
      <div class="flex space-x-2">
        <button
          @click="showExportModal = true"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Laporan</span>
        </button>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
          <input
            v-model="dateRange.from"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
          <input
            v-model="dateRange.to"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="shouldLoadReport = true; loadReport()"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {{ reportData ? 'Refresh' : 'Generate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Report Content -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="reportData" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <p class="text-sm text-gray-600 mb-2">Total Pendapatan Global</p>
          <p class="text-3xl font-bold text-gray-900">{{ formatCurrency(reportData.summary?.totalGlobalRevenue || 0) }}</p>
          <p class="text-xs text-gray-500 mt-1">Subscription + Addons</p>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <p class="text-sm text-gray-600 mb-2">Pendapatan Subscription</p>
          <p class="text-3xl font-bold text-green-600">{{ formatCurrency(reportData.summary?.totalSubscriptionRevenue || 0) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <p class="text-sm text-gray-600 mb-2">Pendapatan Addons</p>
          <p class="text-3xl font-bold text-blue-600">{{ formatCurrency(reportData.summary?.totalAddonRevenue || 0) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <p class="text-sm text-gray-600 mb-2">Total Tenant Aktif</p>
          <p class="text-3xl font-bold text-gray-900">{{ reportData.summary?.activeTenants || 0 }}</p>
        </div>
      </div>

      <!-- Subscription Data -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Penjualan Subscription</h3>
          <div class="flex items-center gap-3">
            <select
              v-model="subscriptionFilter"
              @change="subscriptionPage = 1"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    :checked="selectedSubscriptions.length === paginatedSubscriptions.length && paginatedSubscriptions.length > 0"
                    @change="toggleSelectAllSubscriptions"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paket</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="!reportData || !reportData.subscriptions || filteredSubscriptions.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data subscription</td>
              </tr>
              <tr v-else v-for="sub in paginatedSubscriptions" :key="sub.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    :value="sub.id"
                    v-model="selectedSubscriptions"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ sub.tenantName }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ sub.plan }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatCurrency(sub.amount) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ new Date(sub.createdAt).toLocaleDateString('id-ID') }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                    {{ sub.status === 'ACTIVE' ? 'Aktif' : 'Expired' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <button
                      @click="editSubscription(sub)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="printSubscription(sub)"
                      class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Print"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Bulk Actions for Subscriptions -->
        <div v-if="selectedSubscriptions.length > 0" class="px-6 py-3 border-t border-gray-200 bg-blue-50 flex items-center justify-between">
          <div class="text-sm text-gray-700 font-medium">
            {{ selectedSubscriptions.length }} subscription dipilih
          </div>
          <div class="flex gap-2">
            <button
              @click="bulkDeleteSubscriptions"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Hapus Terpilih
            </button>
            <button
              @click="selectedSubscriptions = []"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
          </div>
        </div>
        <!-- Pagination for Subscriptions -->
        <div v-if="filteredSubscriptions.length > 0" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Menampilkan {{ (subscriptionPage - 1) * 7 + 1 }} - {{ Math.min(subscriptionPage * 7, filteredSubscriptions.length) }} dari {{ filteredSubscriptions.length }} subscription
          </div>
          <div class="flex gap-2">
            <button
              @click="subscriptionPage = Math.max(1, subscriptionPage - 1)"
              :disabled="subscriptionPage === 1"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              @click="subscriptionPage = Math.min(totalSubscriptionPages, subscriptionPage + 1)"
              :disabled="subscriptionPage === totalSubscriptionPages"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      <!-- Addon Data -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Penjualan Addons</h3>
          <div class="flex items-center gap-3">
            <select
              v-model="addonFilter"
              @change="addonPage = 1"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    :checked="selectedAddons.length === paginatedAddons.length && paginatedAddons.length > 0"
                    @change="toggleSelectAllAddons"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Addon</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="!reportData || !reportData.addons || filteredAddons.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data addon</td>
              </tr>
              <tr v-else v-for="addon in paginatedAddons" :key="addon.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    :value="addon.id"
                    v-model="selectedAddons"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ addon.tenantName }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ addon.addonName }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatCurrency(addon.amount) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ new Date(addon.subscribedAt).toLocaleDateString('id-ID') }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="addon.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                    {{ addon.status === 'active' ? 'Aktif' : 'Expired' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <button
                      @click="editAddon(addon)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="printAddon(addon)"
                      class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Print"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Bulk Actions for Addons -->
        <div v-if="selectedAddons.length > 0" class="px-6 py-3 border-t border-gray-200 bg-blue-50 flex items-center justify-between">
          <div class="text-sm text-gray-700 font-medium">
            {{ selectedAddons.length }} addon dipilih
          </div>
          <div class="flex gap-2">
            <button
              @click="bulkDeleteAddons"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Hapus Terpilih
            </button>
            <button
              @click="selectedAddons = []"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
          </div>
        </div>
        <!-- Pagination for Addons -->
        <div v-if="filteredAddons.length > 0" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Menampilkan {{ (addonPage - 1) * 7 + 1 }} - {{ Math.min(addonPage * 7, filteredAddons.length) }} dari {{ filteredAddons.length }} addon
          </div>
          <div class="flex gap-2">
            <button
              @click="addonPage = Math.max(1, addonPage - 1)"
              :disabled="addonPage === 1"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              @click="addonPage = Math.min(totalAddonPages, addonPage + 1)"
              :disabled="addonPage === totalAddonPages"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      <!-- Tenant Performance -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Performa per Tenant (Orders)</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendapatan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="!reportData.tenantReports || reportData.tenantReports.length === 0">
                <td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data tenant</td>
              </tr>
              <tr v-for="tenant in reportData.tenantReports" :key="tenant.tenantId" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ tenant.tenantName }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatCurrency(tenant.totalRevenue) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ tenant.totalOrders }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <GlobalReportExportModal
      :show="showExportModal"
      :default-start-date="dateRange.from"
      :default-end-date="dateRange.to"
      :report-data="reportData"
      @close="showExportModal = false"
      @exported="loadReport"
    />

    <!-- Subscription Detail Modal -->
    <div
      v-if="showSubscriptionModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showSubscriptionModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-gray-900">Detail Subscription</h3>
            <button
              @click="showSubscriptionModal = false"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="selectedSubscription" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Tenant</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedSubscription.tenantName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Paket</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedSubscription.plan }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Jumlah</label>
                <p class="mt-1 text-sm text-gray-900 font-semibold">{{ formatCurrency(selectedSubscription.amount) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <span
                  :class="[
                    'mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    selectedSubscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ selectedSubscription.status === 'ACTIVE' ? 'Aktif' : 'Expired' }}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Tanggal Dibuat</label>
                <p class="mt-1 text-sm text-gray-900">{{ new Date(selectedSubscription.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">ID Subscription</label>
                <p class="mt-1 text-sm text-gray-500 font-mono">{{ selectedSubscription.id }}</p>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button
                @click="showSubscriptionModal = false"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Tutup
              </button>
              <button
                @click="deleteSubscription(selectedSubscription)"
                class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Hapus Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Addon Detail Modal -->
    <div
      v-if="showAddonModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddonModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-gray-900">Detail Addon</h3>
            <button
              @click="showAddonModal = false"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="selectedAddon" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Tenant</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedAddon.tenantName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Nama Addon</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedAddon.addonName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Jumlah</label>
                <p class="mt-1 text-sm text-gray-900 font-semibold">{{ formatCurrency(selectedAddon.amount) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <span
                  :class="[
                    'mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    selectedAddon.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ selectedAddon.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Tanggal Berlangganan</label>
                <p class="mt-1 text-sm text-gray-900">{{ new Date(selectedAddon.subscribedAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">ID Addon</label>
                <p class="mt-1 text-sm text-gray-500 font-mono">{{ selectedAddon.id }}</p>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button
                @click="showAddonModal = false"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Tutup
              </button>
              <button
                @click="deleteAddon(selectedAddon)"
                class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Hapus Addon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { useNotification } from '../../composables/useNotification';
import GlobalReportExportModal from '../../components/GlobalReportExportModal.vue';

const { error: showError, success: showSuccess, confirm: showConfirm } = useNotification();
const loading = ref(false);
const reportData = ref<any>(null);
const showExportModal = ref(false);
const showSubscriptionModal = ref(false);
const showAddonModal = ref(false);
const selectedSubscription = ref<any>(null);
const selectedAddon = ref<any>(null);
const selectedSubscriptions = ref<string[]>([]);
const selectedAddons = ref<string[]>([]);
const shouldLoadReport = ref(false);

// Subscription pagination and filter
const subscriptionPage = ref(1);
const subscriptionFilter = ref<'all' | 'ACTIVE' | 'EXPIRED'>('all');
const itemsPerPage = 7;

// Addon pagination and filter
const addonPage = ref(1);
const addonFilter = ref<'all' | 'active' | 'expired'>('all');

// Set default date range: 2 weeks back and 2 weeks forward
const now = new Date();
const twoWeeksBack = new Date(now);
twoWeeksBack.setDate(now.getDate() - 14); // 2 weeks back
const twoWeeksForward = new Date(now);
twoWeeksForward.setDate(now.getDate() + 14); // 2 weeks forward

const dateRange = ref({
  from: twoWeeksBack.toISOString().split('T')[0],
  to: twoWeeksForward.toISOString().split('T')[0],
});

// Filtered subscriptions
const filteredSubscriptions = computed(() => {
  if (!reportData.value || !reportData.value.subscriptions) return [];
  
  let filtered = [...reportData.value.subscriptions];
  
  if (subscriptionFilter.value !== 'all') {
    filtered = filtered.filter((sub: any) => sub.status === subscriptionFilter.value);
  }
  
  return filtered;
});

// Paginated subscriptions
const paginatedSubscriptions = computed(() => {
  if (!filteredSubscriptions.value || filteredSubscriptions.value.length === 0) return [];
  const start = (subscriptionPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredSubscriptions.value.slice(start, end);
});

const totalSubscriptionPages = computed(() => {
  if (!filteredSubscriptions.value || filteredSubscriptions.value.length === 0) return 1;
  return Math.ceil(filteredSubscriptions.value.length / itemsPerPage);
});

// Filtered addons
const filteredAddons = computed(() => {
  if (!reportData.value || !reportData.value.addons) return [];
  
  let filtered = [...reportData.value.addons];
  
  if (addonFilter.value !== 'all') {
    filtered = filtered.filter((addon: any) => addon.status === addonFilter.value);
  }
  
  return filtered;
});

// Paginated addons
const paginatedAddons = computed(() => {
  if (!filteredAddons.value || filteredAddons.value.length === 0) return [];
  const start = (addonPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredAddons.value.slice(start, end);
});

const totalAddonPages = computed(() => {
  if (!filteredAddons.value || filteredAddons.value.length === 0) return 1;
  return Math.ceil(filteredAddons.value.length / itemsPerPage);
});

const loadReport = async () => {
  loading.value = true;
  try {
    const response = await api.get('/reports/global', {
      params: {
        startDate: dateRange.value.from,
        endDate: dateRange.value.to,
      },
    });
    reportData.value = response.data;
    // Reset pagination when data changes
    subscriptionPage.value = 1;
    addonPage.value = 1;
  } catch (error: any) {
    console.error('Error loading global report:', error);
    await showError('Gagal memuat laporan global');
  } finally {
    loading.value = false;
  }
};

const toggleSelectAllSubscriptions = () => {
  if (selectedSubscriptions.value.length === paginatedSubscriptions.value.length) {
    selectedSubscriptions.value = [];
  } else {
    selectedSubscriptions.value = paginatedSubscriptions.value.map((sub: any) => sub.id);
  }
};

const toggleSelectAllAddons = () => {
  if (selectedAddons.value.length === paginatedAddons.value.length) {
    selectedAddons.value = [];
  } else {
    selectedAddons.value = paginatedAddons.value.map((addon: any) => addon.id);
  }
};

const bulkDeleteSubscriptions = async () => {
  if (selectedSubscriptions.value.length === 0) return;
  
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin menghapus ${selectedSubscriptions.value.length} subscription?`,
    'Hapus Subscription'
  );
  
  if (!confirmed) return;
  
  try {
    await api.post('/subscriptions/bulk-delete', {
      ids: selectedSubscriptions.value,
    });
    
    await showSuccess(`${selectedSubscriptions.value.length} subscription berhasil dihapus`);
    selectedSubscriptions.value = [];
    await loadReport();
  } catch (error: any) {
    console.error('Error bulk deleting subscriptions:', error);
    await showError(error.response?.data?.message || 'Gagal menghapus subscription');
  }
};

const bulkDeleteAddons = async () => {
  if (selectedAddons.value.length === 0) return;
  
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin menghapus ${selectedAddons.value.length} addon?`,
    'Hapus Addon'
  );
  
  if (!confirmed) return;
  
  try {
    await api.post('/addons/bulk-delete', {
      ids: selectedAddons.value,
    });
    
    await showSuccess(`${selectedAddons.value.length} addon berhasil dihapus`);
    selectedAddons.value = [];
    await loadReport();
  } catch (error: any) {
    console.error('Error bulk deleting addons:', error);
    await showError(error.response?.data?.message || 'Gagal menghapus addon');
  }
};

const editSubscription = async (subscription: any) => {
  selectedSubscription.value = subscription;
  showSubscriptionModal.value = true;
};

const deleteSubscription = async (subscription: any) => {
  const confirmed = await showConfirm(`Apakah Anda yakin ingin menghapus subscription untuk ${subscription.tenantName}?`, 'Hapus Subscription');
  if (!confirmed) {
    return;
  }
  
  try {
    await api.delete(`/subscriptions/${subscription.id}`);
    await showSuccess('Subscription berhasil dihapus');
    showSubscriptionModal.value = false;
    await loadReport();
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    await showError(error.response?.data?.message || 'Gagal menghapus subscription');
  }
};

const printSubscription = async (subscription: any) => {
  try {
    // Generate print content for subscription
    const printContent = `
      <html>
        <head>
          <title>Subscription Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .info { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Subscription Receipt</h1>
          <div class="info"><span class="label">Tenant:</span> ${subscription.tenantName}</div>
          <div class="info"><span class="label">Paket:</span> ${subscription.plan}</div>
          <div class="info"><span class="label">Jumlah:</span> ${formatCurrency(subscription.amount)}</div>
          <div class="info"><span class="label">Tanggal:</span> ${new Date(subscription.createdAt).toLocaleDateString('id-ID')}</div>
          <div class="info"><span class="label">Status:</span> ${subscription.status === 'ACTIVE' ? 'Aktif' : 'Expired'}</div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  } catch (error: any) {
    console.error('Error printing subscription:', error);
    await showError('Gagal mencetak subscription');
  }
};

const editAddon = async (addon: any) => {
  selectedAddon.value = addon;
  showAddonModal.value = true;
};

const deleteAddon = async (addon: any) => {
  const confirmed = await showConfirm(`Apakah Anda yakin ingin menghapus addon ${addon.addonName} untuk ${addon.tenantName}?`, 'Hapus Addon');
  if (!confirmed) {
    return;
  }
  
  try {
    await api.delete(`/addons/${addon.id}`);
    await showSuccess('Addon berhasil dihapus');
    showAddonModal.value = false;
    await loadReport();
  } catch (error: any) {
    console.error('Error deleting addon:', error);
    await showError(error.response?.data?.message || 'Gagal menghapus addon');
  }
};

const printAddon = async (addon: any) => {
  try {
    // Generate print content for addon
    const printContent = `
      <html>
        <head>
          <title>Addon Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .info { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Addon Receipt</h1>
          <div class="info"><span class="label">Tenant:</span> ${addon.tenantName}</div>
          <div class="info"><span class="label">Nama Addon:</span> ${addon.addonName}</div>
          <div class="info"><span class="label">Jumlah:</span> ${formatCurrency(addon.amount)}</div>
          <div class="info"><span class="label">Tanggal:</span> ${new Date(addon.subscribedAt).toLocaleDateString('id-ID')}</div>
          <div class="info"><span class="label">Status:</span> ${addon.status === 'active' ? 'Aktif' : 'Expired'}</div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  } catch (error: any) {
    console.error('Error printing addon:', error);
    await showError('Gagal mencetak addon');
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadReport();
});
</script>

