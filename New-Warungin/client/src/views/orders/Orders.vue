<template>
  <div class="flex flex-col h-full">
    <!-- Tenant Selector for Super Admin -->
    <TenantSelector @tenant-changed="handleTenantChange" />
    
    <!-- Store Selector -->
    <div class="px-4 sm:px-6 pt-4 sm:pt-6">
      <StoreSelector @store-changed="handleStoreChange" />
    </div>

    <!-- Header -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
            <div class="flex flex-col gap-2">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Pesanan & Transaksi</h2>
              <p class="text-sm sm:text-base text-gray-600">Kelola pesanan dan riwayat transaksi</p>
            </div>
            <button
              v-if="canDeleteOrders && deletableOrdersCount > 0"
              @click="deleteAllOrders"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
            >
              Hapus Semua ({{ deletableOrdersCount }})
            </button>
          </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mb-4 sm:mb-6 mx-4 sm:mx-6">
      <!-- All Filters in 1 row -->
      <div class="flex flex-col xl:flex-row gap-4 items-end">
        <!-- Status Filter -->
        <div class="flex-1 w-full xl:w-auto">
          <label class="block text-xs font-medium text-gray-700 mb-2">Status</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="filters.status = ''"
              :class="!filters.status 
                ? 'bg-primary-600 text-white border-primary-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Semua
            </button>
            <button
              @click="filters.status = 'PENDING'"
              :class="filters.status === 'PENDING' 
                ? 'bg-yellow-600 text-white border-yellow-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Pending
            </button>
            <button
              @click="filters.status = 'PROCESSING'"
              :class="filters.status === 'PROCESSING' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Processing
            </button>
            <button
              @click="filters.status = 'COMPLETED'"
              :class="filters.status === 'COMPLETED' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Completed
            </button>
            <button
              @click="filters.status = 'CANCELLED'"
              :class="filters.status === 'CANCELLED' 
                ? 'bg-red-600 text-white border-red-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Cancelled
            </button>
          </div>
        </div>

        <!-- Month Filter -->
        <div class="flex-none w-full xl:w-40">
          <label class="block text-xs font-medium text-gray-700 mb-2">Bulan</label>
          <input
            v-model="filters.month"
            type="month"
            @change="handleMonthChange"
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        </div>

        <!-- Date Range Filter -->
        <div class="flex-none w-full xl:w-56 min-w-0">
          <label class="block text-xs font-medium text-gray-700 mb-2">Rentang Tanggal</label>
          <div class="flex gap-2">
            <input
              v-model="filters.startDate"
              type="date"
              @change="loadOrders(1)"
              class="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
            <input
              v-model="filters.endDate"
              type="date"
              @change="loadOrders(1)"
              class="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>

        <!-- Search Bar -->
        <div class="flex-none w-full xl:w-48 min-w-0">
          <label class="block text-xs font-medium text-gray-700 mb-2">Cari Pesanan</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="filters.search"
              @focus="handleSearchFocus"
              @input="handleSearchInput"
              type="text"
              placeholder="Cari nomor pesanan..."
              class="block w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Orders Table -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-gray-500">Memuat...</div>
    </div>

    <div v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <p class="text-gray-500">Belum ada pesanan</p>
    </div>

    <!-- Orders List (Mobile & Desktop) -->
    <div v-else>
      <!-- Mobile Card View -->
      <div class="block sm:hidden space-y-3 px-2">
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
          :class="{ 'border-blue-500 bg-blue-50': isOrderSelected(order.id) }"
        >
          <div class="flex items-start justify-between mb-3">
            <input
              type="checkbox"
              :checked="isOrderSelected(order.id)"
              @change="toggleOrderSelection(order)"
              class="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div class="flex-1 ml-3">
              <div class="text-sm font-semibold text-gray-900 mb-1">{{ order.orderNumber }}</div>
              <div class="text-xs text-gray-500">{{ formatDateTime(order.createdAt) }}</div>
            </div>
            <span
              class="px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0"
              :class="getStatusClass(order.status)"
            >
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
          <div class="space-y-2 mb-3">
            <div class="text-sm">
              <span class="text-gray-600">Customer:</span>
              <span class="font-medium text-gray-900 ml-1">
                {{ order.member?.name || order.customer?.name || order.temporaryCustomerName || 'Walk-in' }}
              </span>
            </div>
            <div class="text-sm">
              <span class="text-gray-600">Total:</span>
              <span class="font-semibold text-gray-900 ml-1">{{ formatCurrency(Number(order.total)) }}</span>
            </div>
            <div v-if="order.sendToKitchen" class="text-xs text-blue-600">
              → Dikirim ke Dapur
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
            <button
              @click="viewOrder(order)"
              class="flex-1 px-3 py-1.5 text-xs bg-primary-50 text-primary-600 rounded hover:bg-primary-100"
            >
              Detail
            </button>
            <button
              @click="printReceipt(order)"
              class="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
            >
              Print
            </button>
            <button
              v-if="order.status === 'PENDING' && !order.sendToKitchen"
              @click="sendToKitchen(order.id)"
              class="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Ke Dapur
            </button>
            <button
              v-if="order.status === 'PENDING' || order.status === 'PROCESSING'"
              @click="updateStatus(order.id, 'COMPLETED')"
              class="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <div v-if="selectedOrders.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <span class="text-sm font-medium text-blue-900">
            {{ selectedOrders.length }} pesanan dipilih
          </span>
          <button
            v-if="canRefundOrders && selectedOrders.every(o => o.status === 'COMPLETED')"
            @click="bulkRefund"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            Refund ({{ selectedOrders.length }})
          </button>
          <button
            v-if="canDeleteOrders && selectedOrders.every(o => o.status === 'CANCELLED' || o.status === 'REFUNDED')"
            @click="bulkDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Hapus ({{ selectedOrders.length }})
          </button>
        </div>
        <button
          @click="selectedOrders = []"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          Batal pilihan
        </button>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 lg:px-6 py-3 text-left">
                <input
                  type="checkbox"
                  :checked="selectedOrders.length === orders.length && orders.length > 0"
                  @change="toggleSelectAll"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Number
              </th>
              <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th class="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50" :class="{ 'bg-blue-50': isOrderSelected(order.id) }">
              <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  :checked="isOrderSelected(order.id)"
                  @change="toggleOrderSelection(order)"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </td>
              <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ order.orderNumber }}</div>
              </td>
              <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ order.member?.name || order.customer?.name || order.temporaryCustomerName || 'Walk-in' }}
                </div>
                <div v-if="order.sendToKitchen" class="text-xs text-blue-600 mt-1">
                  → Dapur
                </div>
              </td>
              <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900">{{ formatCurrency(Number(order.total)) }}</div>
              </td>
              <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusClass(order.status)"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ formatDateTime(order.createdAt) }}</div>
              </td>
              <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-1 sm:space-x-2 flex-wrap">
                  <button
                    @click="viewOrder(order)"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded"
                  >
                    Detail
                  </button>
                  <button
                    @click="printReceipt(order)"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                  >
                    Print
                  </button>
                  <!-- Edit Order Button (conditional) -->
                  <button
                    v-if="canEditOrders && (order.status === 'PENDING' || order.status === 'PROCESSING')"
                    @click="editOrder(order)"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <!-- Cancel Order Button (conditional) -->
                  <button
                    v-if="canCancelOrders && (order.status === 'PENDING' || order.status === 'PROCESSING')"
                    @click="cancelOrder(order.id)"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded"
                  >
                    Batal
                  </button>
                  <!-- Refund Order Button (conditional) -->
                  <button
                    v-if="canRefundOrders && order.status === 'COMPLETED'"
                    @click="refundOrder(order.id)"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                  >
                    Refund
                  </button>
                  <!-- Delete Order Button (conditional) -->
                  <button
                    v-if="canDeleteOrders && (order.status === 'CANCELLED' || order.status === 'REFUNDED')"
                    @click="deleteOrder(order.id)"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                  >
                    Hapus
                  </button>
                  <button
                    v-if="order.status === 'PENDING' && !order.sendToKitchen"
                    @click="sendToKitchen(order.id)"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                  >
                    <span class="hidden md:inline">Kirim ke Dapur</span>
                    <span class="md:hidden">Dapur</span>
                  </button>
                  <button
                    v-if="order.status === 'PENDING' || order.status === 'PROCESSING'"
                    @click="updateStatus(order.id, 'COMPLETED')"
                    class="px-2 sm:px-3 py-1 text-xs sm:text-sm text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                  >
                    Selesai
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center space-x-2 mt-6">
      <button
        @click="loadOrders(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Sebelumnya
      </button>
      <span class="px-4 py-2 text-gray-700">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
      </span>
      <button
        @click="loadOrders(pagination.page + 1)"
        :disabled="pagination.page === pagination.totalPages"
        class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Selanjutnya
      </button>
    </div>
  </div>

  <!-- Tenant Selector Modal -->
  <TenantSelectorModal
    :show="showTenantModal"
    @close="showTenantModal = false"
    @select="handleTenantSelected"
  />

  <!-- Order Edit Modal -->
  <OrderEditModal
    :show="showEditModal"
    :order="editingOrder as Order | null"
    @close="showEditModal = false; editingOrder = null"
    @saved="handleOrderSaved"
  />

  <!-- Order Detail Modal -->
  <div
    v-if="selectedOrder"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
    @click.self="selectedOrder = null"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Detail Pesanan</h3>
          <p class="text-sm text-gray-600 mt-1">{{ selectedOrder.orderNumber }}</p>
        </div>
        <button
          @click="selectedOrder = null"
          class="text-gray-400 hover:text-gray-600 transition p-2"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-4 sm:p-6">
        <!-- Order Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div>
            <h4 class="text-sm font-medium text-gray-500 mb-2">Informasi Pesanan</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Nomor Pesanan:</span>
                <span class="font-semibold">{{ selectedOrder.orderNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal:</span>
                <span>{{ formatDateTime(selectedOrder.createdAt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusClass(selectedOrder.status)"
                >
                  {{ getStatusLabel(selectedOrder.status) }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-500 mb-2">Informasi Pelanggan</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Nama:</span>
                <span>{{ (selectedOrder as any).member?.name || (selectedOrder as any).customer?.name || (selectedOrder as any).temporaryCustomerName || 'Pelanggan Umum' }}</span>
              </div>
              <div v-if="(selectedOrder as any).member?.email || (selectedOrder as any).customer?.email" class="flex justify-between">
                <span class="text-gray-600">Email:</span>
                <span>{{ (selectedOrder as any).member?.email || (selectedOrder as any).customer?.email }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-500 mb-3">Item Pesanan</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(item, index) in ((selectedOrder as any).items || [])" :key="index">
                  <td class="px-4 py-2 text-sm">{{ item.product?.name || item.name }}</td>
                  <td class="px-4 py-2 text-sm">{{ item.quantity }}</td>
                  <td class="px-4 py-2 text-sm text-right">{{ formatCurrency(Number(item.price)) }}</td>
                  <td class="px-4 py-2 text-sm text-right font-semibold">{{ formatCurrency(Number(item.subtotal)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="border-t pt-4">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Subtotal:</span>
              <span>{{ formatCurrency(Number((selectedOrder as any).subtotal || selectedOrder.total)) }}</span>
            </div>
            <div v-if="(selectedOrder as any).discount > 0" class="flex justify-between text-red-600">
              <span>Diskon:</span>
              <span>-{{ formatCurrency(Number((selectedOrder as any).discount)) }}</span>
            </div>
            <div class="flex justify-between text-base font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(Number(selectedOrder.total)) }}</span>
            </div>
            <div v-if="(selectedOrder as any).transaction" class="flex justify-between text-sm text-gray-600 mt-2">
              <span>Metode Pembayaran:</span>
              <span>{{ getPaymentMethodLabel((selectedOrder as any).transaction.paymentMethod) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            @click="printReceipt(selectedOrder)"
            class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Print Receipt
          </button>
          <!-- Edit Order Button (conditional) -->
          <button
            v-if="canEditOrders && (selectedOrder.status === 'PENDING' || selectedOrder.status === 'PROCESSING')"
            @click="editOrder(selectedOrder)"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Edit Pesanan
          </button>
          <!-- Cancel Order Button (conditional) -->
          <button
            v-if="canCancelOrders && (selectedOrder.status === 'PENDING' || selectedOrder.status === 'PROCESSING')"
            @click="cancelOrder(selectedOrder.id)"
            class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Batalkan Pesanan
          </button>
          <!-- Refund Order Button (conditional) -->
          <button
            v-if="canRefundOrders && selectedOrder.status === 'COMPLETED'"
            @click="refundOrder(selectedOrder.id)"
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Refund Pesanan
          </button>
          <!-- Delete Order Button (conditional) -->
          <button
            v-if="canDeleteOrders && (selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'REFUNDED')"
            @click="deleteOrder(selectedOrder.id)"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Hapus Pesanan
          </button>
          <button
            @click="selectedOrder = null"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Receipt Printer -->
  <ReceiptPrinter
    v-if="selectedOrderForReceipt"
    :show="showReceiptModal"
    :order-id="selectedOrderForReceipt.id"
    :receipt-data="(selectedOrderForReceipt as any).receiptData"
    @close="showReceiptModal = false; selectedOrderForReceipt = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import TenantSelectorModal from '../../components/TenantSelectorModal.vue';
import TenantSelector from '../../components/TenantSelector.vue';
import StoreSelector from '../../components/StoreSelector.vue';
import ReceiptPrinter from '../../components/ReceiptPrinter.vue';
import OrderEditModal from '../../components/OrderEditModal.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';
import { usePermissions } from '../../composables/usePermissions';

interface OrderItem {
  id?: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
  };
  name?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: string | number;
  subtotal: string | number;
  discount: string | number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  customer?: {
    name: string;
    email?: string;
  };
  member?: {
    name: string;
    email?: string;
  };
  temporaryCustomerName?: string;
  sendToKitchen?: boolean;
  transaction?: {
    paymentMethod: string;
  };
  receiptData?: any;
}

const authStore = useAuthStore();
const { needsTenantSelection, showTenantModal, handleTenantSelected } = useTenantCheck();
const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();
const { canEditOrders, canDeleteOrders, canCancelOrders, canRefundOrders } = usePermissions();
const selectedOrder = ref<Order | null>(null);
const showEditModal = ref(false);
const editingOrder = ref<Order | null>(null);

const orders = ref<Order[]>([]);
const loading = ref(false);
const showReceiptModal = ref(false);
const selectedOrderForReceipt = ref<Order | null>(null);
const selectedOrders = ref<Order[]>([]);
const filters = ref({
  search: '',
  status: '',
  month: '',
  startDate: '',
  endDate: '',
});
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// Debounce to prevent rate limiting
let loadOrdersTimeout: ReturnType<typeof setTimeout> | null = null;

const loadOrders = async (page = 1) => {
  // Check if tenant selection is needed (modal as fallback)
  if (needsTenantSelection.value) {
    if (page === 1) {
      showTenantModal.value = true;
    }
    return;
  }
  
  // Clear existing timeout
  if (loadOrdersTimeout) clearTimeout(loadOrdersTimeout);
  
  // Debounce API call
  loadOrdersTimeout = setTimeout(async () => {
    loading.value = true;
    try {
      const params: any = {
        page,
        limit: pagination.value.limit,
        ...(filters.value.status && { status: filters.value.status }),
        ...(filters.value.startDate && { startDate: filters.value.startDate }),
        ...(filters.value.endDate && {
          // Set endDate to end of day (23:59:59)
          endDate: (() => {
            const dateTo = new Date(filters.value.endDate);
            dateTo.setHours(23, 59, 59, 999);
            return dateTo.toISOString();
          })(),
        }),
      };
      const response = await api.get('/orders', { params });
      orders.value = response.data.data;
      pagination.value = response.data.pagination;
    } catch (error: any) {
      console.error('Error loading orders:', error);
      if (error.response?.status !== 429) { // Don't show error for rate limiting
        await showError(error.response?.data?.message || 'Gagal memuat pesanan');
      }
    } finally {
      loading.value = false;
    }
  }, page === 1 ? 100 : 0); // Only debounce on first load
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REFUNDED: 'Refund',
  };
  return labels[status] || status;
};

const viewOrder = async (order: Order) => {
  try {
    // Load full order data
    const response = await api.get(`/orders/${order.id}`);
    const orderData = response.data;
    // Ensure required fields have default values
    selectedOrder.value = {
      ...orderData,
      subtotal: orderData.subtotal ?? orderData.total ?? 0,
      discount: orderData.discount ?? 0,
      items: orderData.items ?? [],
    };
  } catch (error: any) {
    console.error('Error loading order details:', error);
    await showError('Gagal memuat detail pesanan');
  }
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Kartu',
    E_WALLET: 'E-Wallet',
    QRIS: 'QRIS',
    BANK_TRANSFER: 'Bank',
    SHOPEEPAY: 'ShopeePay',
    DANA: 'Dana',
    MIDTRANS: 'Midtrans',
  };
  return labels[method] || method;
};

const printReceipt = async (order: Order) => {
  try {
    // Load full order data for receipt
    const response = await api.get(`/orders/${order.id}`);
    const fullOrder = response.data;
    
    // Prepare receipt data
    const receiptData = {
      orderNumber: fullOrder.orderNumber,
      date: fullOrder.createdAt,
      customerName: fullOrder.member?.name || fullOrder.customer?.name || fullOrder.temporaryCustomerName || null,
      memberName: fullOrder.member?.name || null,
      items: fullOrder.items?.map((item: any) => ({
        name: item.product?.name || item.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })) || [],
      subtotal: Number(fullOrder.subtotal || fullOrder.total),
      discount: Number(fullOrder.discount || 0),
      total: Number(fullOrder.total),
      paymentMethod: fullOrder.transaction?.paymentMethod || 'CASH',
      servedBy: fullOrder.transaction?.servedBy || null, // Nama kasir/admin yang melayani
    };
    
    selectedOrderForReceipt.value = { ...order, receiptData } as any;
    showReceiptModal.value = true;
  } catch (error: any) {
    console.error('Error loading order for receipt:', error);
    await showError('Gagal memuat data order untuk receipt');
  }
};

const updateStatus = async (id: string, status: string) => {
  try {
    await api.put(`/orders/${id}/status`, { status });
    await loadOrders(pagination.value.page);
    await showSuccess('Status pesanan berhasil diupdate');
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal mengupdate status');
  }
};

const sendToKitchen = async (id: string) => {
  try {
    // Update order dengan sendToKitchen flag dan status
    await api.put(`/orders/${id}`, { 
      sendToKitchen: true,
    });
    await api.put(`/orders/${id}/status`, { status: 'PROCESSING' });
    await loadOrders(pagination.value.page);
    await showSuccess('Pesanan berhasil dikirim ke dapur');
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal mengirim ke dapur');
  }
};

const editOrder = async (order: Order) => {
  try {
    // Load full order data
    const response = await api.get(`/orders/${order.id}`);
    const orderData = response.data;
    // Ensure required fields have default values
    editingOrder.value = {
      ...orderData,
      subtotal: orderData.subtotal ?? orderData.total ?? 0,
      discount: orderData.discount ?? 0,
      items: orderData.items ?? [],
    };
    showEditModal.value = true;
  } catch (error: any) {
    await showError('Gagal memuat data pesanan untuk edit');
  }
};

const cancelOrder = async (id: string) => {
  const confirmed = await showConfirm('Apakah Anda yakin ingin membatalkan pesanan ini?', 'Batalkan Pesanan');
  if (!confirmed) return;
  
  try {
    await api.put(`/orders/${id}/status`, { status: 'CANCELLED' });
    await loadOrders(pagination.value.page);
    if (selectedOrder.value?.id === id) {
      selectedOrder.value = null;
    }
    await showSuccess('Pesanan berhasil dibatalkan');
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal membatalkan pesanan');
  }
};

const refundOrder = async (id: string) => {
  const confirmed = await showConfirm('Apakah Anda yakin ingin melakukan refund untuk pesanan ini?', 'Refund Pesanan');
  if (!confirmed) return;
  
  try {
    await api.put(`/orders/${id}/status`, { status: 'REFUNDED' });
    await loadOrders(pagination.value.page);
    if (selectedOrder.value?.id === id) {
      selectedOrder.value = null;
    }
    await showSuccess('Pesanan berhasil direfund');
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal melakukan refund');
  }
};

const deleteOrder = async (id: string) => {
  const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.', 'Hapus Pesanan');
  if (!confirmed) return;
  
  try {
    await api.delete(`/orders/${id}`);
    await loadOrders(pagination.value.page);
    if (selectedOrder.value?.id === id) {
      selectedOrder.value = null;
    }
    await showSuccess('Pesanan berhasil dihapus');
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menghapus pesanan');
  }
};

const handleOrderSaved = async (order: Order) => {
  await loadOrders(pagination.value.page);
  if (selectedOrder.value?.id === order.id) {
    // Reload selected order
    await viewOrder(order);
  }
  await showSuccess('Pesanan berhasil diupdate');
  showEditModal.value = false;
  editingOrder.value = null;
};

// Bulk operations
const isOrderSelected = (orderId: string) => {
  return selectedOrders.value.some(o => o.id === orderId);
};

const toggleOrderSelection = (order: Order) => {
  const index = selectedOrders.value.findIndex(o => o.id === order.id);
  if (index > -1) {
    selectedOrders.value.splice(index, 1);
  } else {
    selectedOrders.value.push(order);
  }
};

const toggleSelectAll = () => {
  if (selectedOrders.value.length === orders.value.length) {
    selectedOrders.value = [];
  } else {
    selectedOrders.value = [...orders.value];
  }
};

const bulkDelete = async () => {
  if (selectedOrders.value.length === 0) return;
  
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin menghapus ${selectedOrders.value.length} pesanan? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus Pesanan'
  );
  if (!confirmed) return;

  try {
    const orderIds = selectedOrders.value.map(o => o.id);
    const response = await api.post('/orders/bulk-delete', { orderIds });
    
    if (response.data.deleted > 0) {
      await showSuccess(`${response.data.deleted} pesanan berhasil dihapus`);
    }
    if (response.data.failed > 0) {
      await showError(`${response.data.failed} pesanan gagal dihapus. ${response.data.errors.join(', ')}`);
    }
    
    selectedOrders.value = [];
    await loadOrders(pagination.value.page);
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menghapus pesanan');
  }
};

const bulkRefund = async () => {
  if (selectedOrders.value.length === 0) return;
  
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin melakukan refund untuk ${selectedOrders.value.length} pesanan?`,
    'Refund Pesanan'
  );
  if (!confirmed) return;

  try {
    const orderIds = selectedOrders.value.map(o => o.id);
    const response = await api.post('/orders/bulk-refund', { orderIds });
    
    if (response.data.refunded > 0) {
      await showSuccess(`${response.data.refunded} pesanan berhasil direfund`);
    }
    if (response.data.failed > 0) {
      await showError(`${response.data.failed} pesanan gagal direfund. ${response.data.errors.join(', ')}`);
    }
    
    selectedOrders.value = [];
    await loadOrders(pagination.value.page);
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal melakukan refund');
  }
};

// Computed property untuk menghitung jumlah order yang bisa dihapus
const deletableOrdersCount = computed(() => {
  return orders.value.filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED').length;
});

// Hapus semua order yang bisa dihapus
const deleteAllOrders = async () => {
  const deletableOrders = orders.value.filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED');
  
  if (deletableOrders.length === 0) {
    await showError('Tidak ada pesanan yang bisa dihapus. Hanya pesanan dengan status Dibatalkan atau Direfund yang bisa dihapus.');
    return;
  }
  
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin menghapus ${deletableOrders.length} pesanan? Tindakan ini tidak dapat dibatalkan.`,
    'Hapus Semua Pesanan'
  );
  if (!confirmed) return;

  try {
    const orderIds = deletableOrders.map(o => o.id);
    const response = await api.post('/orders/bulk-delete', { orderIds });
    
    if (response.data.deleted > 0) {
      await showSuccess(`${response.data.deleted} pesanan berhasil dihapus`);
    }
    if (response.data.failed > 0) {
      await showError(`${response.data.failed} pesanan gagal dihapus. ${response.data.errors.join(', ')}`);
    }
    
    selectedOrders.value = [];
    await loadOrders(pagination.value.page);
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menghapus pesanan');
  }
};


const handleMonthChange = () => {
  if (filters.value.month) {
    // Parse month (format: YYYY-MM)
    const [year, month] = filters.value.month.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    // Set startDate to first day of month (format: YYYY-MM-DD)
    const firstDay = `${year}-${month.padStart(2, '0')}-01`;
    filters.value.startDate = firstDay;
    
    // Calculate last day of month correctly
    // new Date(year, month, 0) gives the last day of the previous month
    // So new Date(year, monthNum, 0) gives last day of (monthNum - 1)
    // We need last day of monthNum, so use new Date(year, monthNum, 0)
    const lastDayDate = new Date(yearNum, monthNum, 0);
    const lastDay = lastDayDate.getDate();
    
    // Format endDate as YYYY-MM-DD
    const endDate = `${year}-${month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    filters.value.endDate = endDate;
    
    // Load orders with new date range
    loadOrders(1);
  } else {
    // Clear date range if month is cleared
    filters.value.startDate = '';
    filters.value.endDate = '';
    loadOrders(1);
  }
};

watch([() => filters.value.status, () => filters.value.startDate, () => filters.value.endDate], () => {
  loadOrders(1);
});

const handleTenantChange = (tenantId: string | null) => {
  // Reload orders when tenant changes
  if (tenantId && !needsTenantSelection.value) {
    loadOrders();
  }
};

const handleStoreChange = (_storeId: string | null) => {
  // Reload orders when store changes
  if (!needsTenantSelection.value) {
    loadOrders(1);
  }
};

watch(() => authStore.selectedTenantId, (newTenantId, oldTenantId) => {
  // Only reload if tenantId actually changed
  if (newTenantId && newTenantId !== oldTenantId && !needsTenantSelection.value) {
    loadOrders();
  }
}, { immediate: false });

const handleSearchFocus = () => {
  // No-op, just for compatibility
};

const handleSearchInput = () => {
  loadOrders(1);
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Initialize month filter to current month
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  filters.value.month = `${year}-${month}`;
  
  // Set date range to current month (1st to last day)
  handleMonthChange();
  
  if (!needsTenantSelection.value) {
    loadOrders(1);
  }
});
</script>

