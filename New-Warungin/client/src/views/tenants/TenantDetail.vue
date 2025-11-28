<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex items-center space-x-4">
        <button
          @click="$router.push('/app/tenants')"
          class="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ tenant?.name || 'Loading...' }}</h2>
          <p class="text-sm sm:text-base text-gray-600">Detail Tenant & Manajemen Langganan</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="tenant" class="flex flex-col gap-6 px-4 sm:px-6 pb-6 sm:pb-8">
      <!-- Tenant Info Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Informasi Tenant</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <p class="text-gray-900">{{ tenant.name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p class="text-gray-900">{{ tenant.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <p class="text-gray-900">{{ tenant.phone || '-' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <span
              class="px-2 py-1 text-xs font-semibold rounded-full"
              :class="tenant.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ tenant.isActive !== false ? 'Aktif' : 'Tidak Aktif' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Subscription Info Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h3 class="text-lg font-semibold text-gray-900">Langganan</h3>
          <div class="flex flex-wrap gap-2">
            <button
              @click="showEditPlanModal = true"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              Edit Paket
            </button>
            <button
              @click="showReduceSubscriptionModal = true"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Kurangi Durasi
            </button>
            <button
              @click="showExtendSubscriptionModal = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Perpanjang Langganan
            </button>
            <button
              v-if="tenant?.subscriptionEnd && !subscription?.isExpired"
              @click="showDeactivateSubscriptionModal = true"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Nonaktifkan Langganan
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Paket</label>
            <div class="flex items-center gap-2">
              <span 
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="getPlanBadgeClass(subscription?.plan || tenant.subscriptionPlan || 'BASIC')"
              >
                {{ getPlanName(subscription?.plan || tenant.subscriptionPlan || 'BASIC') }}
              </span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
            <p class="text-gray-900">{{ formatDate(tenant.subscriptionStart) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Berakhir</label>
            <p class="text-gray-900">{{ formatDate(tenant.subscriptionEnd) }}</p>
            <!-- Hanya tampilkan warning jika expired dan plan bukan BASIC -->
            <p v-if="subscription?.isExpired && (subscription?.plan || tenant?.subscriptionPlan || 'BASIC') !== 'BASIC'" class="text-xs text-red-600 mt-1 font-medium">⚠️ Langganan telah kedaluwarsa - Paket akan otomatis kembali ke BASIC</p>
            <p v-if="subscription?.subscription?.temporaryUpgrade === true && !subscription?.isExpired && (subscription?.plan || tenant?.subscriptionPlan || 'BASIC') !== 'BASIC'" class="text-xs text-yellow-600 mt-1 font-medium">
              ⚠️ Upgrade sementara - akan kembali ke BASIC setelah expired
            </p>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Sisa Waktu</span>
            <span
              class="text-lg font-bold"
              :class="(subscription?.daysRemaining || 0) <= 0 ? 'text-gray-500' : (subscription?.daysRemaining || 0) <= 7 ? 'text-red-600' : (subscription?.daysRemaining || 0) <= 30 ? 'text-yellow-600' : 'text-green-600'"
            >
              <template v-if="subscription?.isExpired">
                <span class="text-gray-500">Kedaluwarsa</span>
              </template>
              <template v-else>
                {{ formatRemainingTime(
                  subscription?.daysRemaining || 0,
                  subscription?.hoursRemaining,
                  subscription?.minutesRemaining,
                  subscription?.secondsRemaining
                ) }}
              </template>
            </span>
          </div>
          <div v-if="!subscription?.isExpired" class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="(subscription?.daysRemaining || 0) <= 7 ? 'bg-red-500' : (subscription?.daysRemaining || 0) <= 30 ? 'bg-yellow-500' : 'bg-green-500'"
              :style="{ width: `${Math.min(100, Math.max(0, ((subscription?.daysRemaining || 0) / 365) * 100))}%` }"
            ></div>
          </div>
          <p v-if="subscription?.isTemporaryUpgrade && !subscription?.isExpired && (tenant?.subscriptionPlan || subscription?.plan || 'BASIC') !== 'BASIC'" class="text-xs text-gray-500 mt-2">
            ⏰ Upgrade sementara - akan kembali ke BASIC setelah durasi berakhir
          </p>
        </div>
      </div>

      <!-- Active Addons Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Addon Aktif</h3>
          <button
            @click="showAddAddonModal = true"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            Tambah Addon
          </button>
        </div>
        <div v-if="activeAddons.length === 0" class="text-center py-8 text-gray-500">
          Belum ada addon yang aktif
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="addon in activeAddons"
            :key="addon.id"
            class="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">{{ addon.addonName }}</h4>
                <p class="text-sm text-gray-600">{{ getAddonDescription(addon) }}</p>
              </div>
              <span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Aktif</span>
            </div>
            <div v-if="addon.limit" class="mb-3">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-600">Penggunaan:</span>
                <span class="font-semibold" :class="addon.isLimitReached ? 'text-red-600' : 'text-gray-900'">
                  {{ addon.currentUsage }} / {{ addon.limit }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="addon.isLimitReached ? 'bg-red-500' : 'bg-green-500'"
                  :style="{ width: `${Math.min(100, ((addon.currentUsage || 0) / (addon.limit || 1)) * 100)}%` }"
                ></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Berakhir:</span>
                <span class="font-semibold text-gray-900">{{ formatDate(addon.expiresAt) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm mt-1">
                <span class="text-gray-600">Sisa:</span>
                <span
                  class="font-semibold"
                  :class="getAddonDaysRemaining(addon) <= 7 ? 'text-red-600' : getAddonDaysRemaining(addon) <= 30 ? 'text-yellow-600' : 'text-green-600'"
                >
                  {{ getAddonDaysRemaining(addon) }} hari
                </span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button
                @click="reduceAddon(addon)"
                class="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
              >
                Kurangi
              </button>
              <button
                @click="extendAddon(addon)"
                class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
              >
                Perpanjang
              </button>
              <button
                @click="unsubscribeAddon(addon.addonId)"
                class="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Reward Points Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Reward Points</h3>
          <button
            @click="showEditPointsModal = true"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            Edit Point
          </button>
        </div>
        <div v-if="loadingPoints" class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Point Saat Ini</label>
              <p class="text-2xl font-bold text-blue-600">{{ tenantPoints?.currentPoints || 0 }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Total Diperoleh</label>
              <p class="text-2xl font-bold text-green-600">{{ tenantPoints?.totalEarned || 0 }}</p>
            </div>
            <div class="bg-orange-50 rounded-lg p-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Total Digunakan</label>
              <p class="text-2xl font-bold text-orange-600">{{ tenantPoints?.totalSpent || 0 }}</p>
            </div>
          </div>
          
          <div class="mt-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-2">Riwayat Point</h4>
            <div v-if="pointTransactions.length === 0" class="text-center py-4 text-gray-500 text-sm">
              Belum ada transaksi point
            </div>
            <div v-else class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="transaction in pointTransactions"
                :key="transaction.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div class="flex-1">
                  <p class="font-semibold text-gray-900 text-sm">{{ transaction.description }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ formatDate(transaction.createdAt) }}</p>
                </div>
                <span
                  :class="[
                    'font-bold text-sm',
                    transaction.amount > 0 ? 'text-green-600' : transaction.type === 'EXPIRED' ? 'text-red-600' : 'text-red-600'
                  ]"
                >
                  {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Pengguna Tenant</h3>
            <p v-if="userUsage" class="text-sm text-gray-600 mt-1">
              Maksimal {{ userUsage.limit === -1 ? 'Unlimited' : userUsage.limit }} pengguna, 
              sedang digunakan {{ userUsage.currentUsage }}
              <span v-if="userUsage.limit !== -1" class="font-semibold" :class="userUsage.currentUsage >= userUsage.limit ? 'text-red-600' : 'text-green-600'">
                ({{ userUsage.limit - userUsage.currentUsage }} tersedia)
              </span>
            </p>
          </div>
        </div>
        
        <div v-if="loadingUsers" class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="tenantUsers.length === 0" class="text-center py-8 text-gray-500">
          Belum ada pengguna
        </div>
        
        <template v-else>
          <!-- Bulk Actions Bar -->
          <div v-if="selectedUsers.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <span class="text-sm font-medium text-blue-900">
                {{ selectedUsers.length }} pengguna dipilih
              </span>
              <button
                v-if="selectedUsers.some(u => !u.isActive)"
                @click="bulkActivateUsers"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                Aktifkan ({{ selectedUsers.filter(u => !u.isActive).length }})
              </button>
              <button
                v-if="selectedUsers.some(u => u.isActive)"
                @click="bulkDeactivateUsers"
                class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
              >
                Nonaktifkan ({{ selectedUsers.filter(u => u.isActive).length }})
              </button>
            </div>
            <button
              @click="selectedUsers = []"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              Batal pilihan
            </button>
          </div>
          
          <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    :checked="selectedUsers.length === tenantUsers.length && tenantUsers.length > 0"
                    @change="toggleSelectAllUsers"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in tenantUsers" :key="user.id" class="hover:bg-gray-50" :class="{ 'bg-blue-50': isUserSelected(user.id) }">
                <td class="px-4 py-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    :checked="isUserSelected(user.id)"
                    @change="toggleUserSelection(user)"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ user.email }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getRoleClass(user.role)"
                  >
                    {{ getRoleLabel(user.role) }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ user.isActive ? 'Aktif' : 'Tidak Aktif' }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm text-gray-500">
                    {{ user.lastLogin ? formatDate(user.lastLogin) : 'Belum pernah' }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editUser(user)"
                    class="px-3 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </template>
      </div>

      <!-- Stores Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Store/Outlet</h3>
            <p v-if="outletUsage" class="text-sm text-gray-600 mt-1">
              Maksimal {{ outletUsage.limit === -1 ? 'Unlimited' : outletUsage.limit }} store, 
              sedang digunakan {{ outletUsage.currentUsage }}
              <span v-if="outletUsage.limit !== -1" class="font-semibold" :class="outletUsage.currentUsage >= outletUsage.limit ? 'text-red-600' : 'text-green-600'">
                ({{ outletUsage.limit - outletUsage.currentUsage }} tersedia)
              </span>
            </p>
          </div>
        </div>
        
        <div v-if="loadingStores" class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="tenantStores.length === 0" class="text-center py-8 text-gray-500">
          Belum ada store
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="store in tenantStores" :key="store.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ store.name }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ store.address || '-' }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ store.phone || '-' }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="store.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ store.isActive !== false ? 'Aktif' : 'Tidak Aktif' }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="toggleStoreStatus(store)"
                    class="px-3 py-1 rounded transition"
                    :class="store.isActive !== false 
                      ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                      : 'text-green-600 hover:text-green-900 hover:bg-green-50'"
                  >
                    {{ store.isActive !== false ? 'Nonaktifkan' : 'Aktifkan' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Available Addons Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Addon Tersedia</h3>
        <div v-if="filteredAvailableAddons.length === 0" class="text-center py-8 text-gray-500">
          Semua addon sudah aktif
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="addon in filteredAvailableAddons"
            :key="addon.id"
            class="border-2 border-gray-200 rounded-lg p-4 transition hover:border-blue-300"
          >
            <h4 class="font-semibold text-gray-900 mb-2">{{ addon.name }}</h4>
            <p class="text-sm text-gray-600 mb-3">{{ addon.description }}</p>
            
            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-lg font-bold text-blue-600">{{ formatCurrency(addon.price) }}</span>
                <span class="text-sm text-gray-500">/bulan</span>
              </div>
            </div>
            <div v-if="addon.defaultLimit" class="text-sm text-gray-600 mb-3">
              Limit: {{ addon.defaultLimit }}
            </div>
            <button
              @click="subscribeAddon(addon)"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Berlangganan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Plan Modal -->
    <Teleport to="body">
      <div
        v-if="showEditPlanModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showEditPlanModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Edit Paket Langganan</h3>
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Tenant: <strong>{{ tenant?.name }}</strong></p>
            <p class="text-sm text-gray-600 mb-2">Paket Saat Ini: <strong>{{ getPlanName(subscription?.plan || tenant?.subscriptionPlan || 'BASIC') }}</strong></p>
            <p class="text-xs text-yellow-600 mb-4 bg-yellow-50 p-2 rounded border border-yellow-200">
              ⚠️ Upgrade ini bersifat sementara. Setelah durasi berakhir ({{ planForm.durationDays }} hari), akan otomatis kembali ke paket BASIC.
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Paket Baru</label>
            <select
              v-model="planForm.subscriptionPlan"
              class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
            >
              <option value="BASIC">Starter (BASIC)</option>
              <option value="PRO">Boost (PRO)</option>
              <option value="ENTERPRISE">Max (ENTERPRISE)</option>
            </select>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Durasi (Hari)
            </label>
            <input
              v-model.number="planForm.durationDays"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
              placeholder="Masukkan durasi dalam hari"
            />
            <p class="text-xs text-gray-500 mt-1">
              Durasi default: 30 hari
            </p>
          </div>
          <div class="flex gap-3">
            <button
              @click="handleEditPlan"
              :disabled="!planForm.durationDays || planForm.durationDays < 1"
              class="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan
            </button>
            <button
              @click="showEditPlanModal = false"
              class="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reduce Subscription Modal -->
    <Teleport to="body">
      <div
        v-if="showReduceSubscriptionModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showReduceSubscriptionModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Kurangi Durasi Langganan</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Durasi untuk dikurangi (hari)</label>
              <input
                v-model.number="reduceSubscriptionDays"
                type="number"
                min="1"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Masukkan jumlah hari"
              />
              <p class="text-xs text-gray-500 mt-2">
                Langganan saat ini: {{ subscription?.daysRemaining || 0 }} hari
              </p>
            </div>
            <div class="flex space-x-3">
              <button
                @click="showReduceSubscriptionModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                @click="handleReduceSubscription"
                :disabled="!reduceSubscriptionDays || reduceSubscriptionDays < 1 || reducing"
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ reducing ? 'Memproses...' : 'Kurangi' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Extend Subscription Modal -->
    <div
      v-if="showExtendSubscriptionModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showExtendSubscriptionModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Perpanjang Langganan</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Durasi (hari)</label>
            <input
              v-model.number="extendSubscriptionDays"
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan jumlah hari"
            />
          </div>
          <div class="flex space-x-3">
            <button
              @click="showExtendSubscriptionModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              @click="handleExtendSubscription"
              :disabled="!extendSubscriptionDays || extendSubscriptionDays < 1 || extending"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ extending ? 'Memproses...' : 'Perpanjang' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reduce Addon Modal -->
    <Teleport to="body">
      <div
        v-if="showReduceAddonModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showReduceAddonModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Kurangi Durasi Addon</h3>
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Addon: <span class="font-semibold">{{ selectedAddon?.addonName }}</span></p>
            <p class="text-sm text-gray-600">Sisa waktu: <span class="font-semibold">{{ selectedAddon ? getAddonDaysRemaining(selectedAddon) : 0 }} hari</span></p>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Durasi untuk dikurangi (hari)</label>
              <input
                v-model.number="reduceAddonDays"
                type="number"
                min="1"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Masukkan jumlah hari"
              />
            </div>
            <div class="flex space-x-3">
              <button
                @click="showReduceAddonModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                @click="handleReduceAddon"
                :disabled="!reduceAddonDays || reduceAddonDays < 1 || reducing"
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ reducing ? 'Memproses...' : 'Kurangi' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Extend Addon Modal -->
    <div
      v-if="showExtendAddonModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showExtendAddonModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Perpanjang Addon</h3>
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2">Addon: <span class="font-semibold">{{ selectedAddon?.addonName }}</span></p>
          <p class="text-sm text-gray-600">Sisa waktu: <span class="font-semibold">{{ selectedAddon ? getAddonDaysRemaining(selectedAddon) : 0 }} hari</span></p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Durasi (hari)</label>
            <input
              v-model.number="extendAddonDays"
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan jumlah hari"
            />
          </div>
          <div class="flex space-x-3">
            <button
              @click="showExtendAddonModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              @click="handleExtendAddon"
              :disabled="!extendAddonDays || extendAddonDays < 1 || extending"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ extending ? 'Memproses...' : 'Perpanjang' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Addon Modal -->
    <div
      v-if="showAddAddonModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showAddAddonModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Tambah Addon</h3>
        <div class="space-y-4">
          <div
            v-for="addon in availableAddons.filter(a => !isAddonActive(a.id))"
            :key="addon.id"
            class="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
            :class="{ 'border-blue-500 bg-blue-50': selectedAddonForSubscribe?.id === addon.id }"
            @click="selectedAddonForSubscribe = addon"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 mb-1">{{ addon.name }}</h4>
                <p class="text-sm text-gray-600 mb-2">{{ addon.description }}</p>
                <div class="flex items-center space-x-2">
                  <span class="text-lg font-bold text-blue-600">{{ formatCurrency(addon.price) }}</span>
                  <span class="text-sm text-gray-500">/bulan</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex space-x-3 mt-4">
            <button
              @click="showAddAddonModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              @click="handleSubscribeAddon"
              :disabled="!selectedAddonForSubscribe"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berlangganan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div
      v-if="showEditUserModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showEditUserModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Edit Pengguna</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nama</label>
            <input
              v-model="editUserForm.name"
              type="text"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nama pengguna"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              v-model="editUserForm.email"
              type="email"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              v-model="editUserForm.role"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ADMIN_TENANT">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="CASHIER">Kasir</option>
              <option value="KITCHEN">Dapur</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="editUserForm.isActive"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="true">Aktif</option>
              <option :value="false">Tidak Aktif</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password Baru (opsional)</label>
            <input
              v-model="editUserForm.password"
              type="password"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Kosongkan jika tidak ingin mengubah password"
            />
            <p class="text-xs text-gray-500 mt-1">Biarkan kosong jika tidak ingin mengubah password</p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="showEditUserModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              @click="handleUpdateUser"
              :disabled="updatingUser || !editUserForm.name || !editUserForm.email"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ updatingUser ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Deactivate Subscription Modal -->
    <div
      v-if="showDeactivateSubscriptionModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showDeactivateSubscriptionModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Nonaktifkan Langganan</h3>
        <div class="space-y-4">
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800 font-semibold mb-2">⚠️ Peringatan</p>
            <p class="text-sm text-yellow-700">
              Dengan menonaktifkan langganan, semua fitur yang memerlukan langganan aktif akan dinonaktifkan, termasuk:
            </p>
            <ul class="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
              <li>POS (Point of Sale)</li>
              <li>Kitchen Orders</li>
              <li>Manajemen Produk</li>
              <li>Manajemen Pesanan</li>
              <li>Laporan dan Analytics</li>
            </ul>
            <p class="text-sm text-yellow-700 mt-3 font-semibold">
              User tenant (kasir, supervisor, dll) tidak akan bisa mengakses fitur-fitur tersebut.
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="showDeactivateSubscriptionModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              @click="handleDeactivateSubscription"
              :disabled="deactivatingSubscription"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ deactivatingSubscription ? 'Memproses...' : 'Nonaktifkan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Points Modal -->
    <div
      v-if="showEditPointsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showEditPointsModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Edit Point Tenant</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Point (positif untuk tambah, negatif untuk kurangi)
            </label>
            <input
              v-model.number="editPointsForm.points"
              type="number"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Contoh: 100 atau -50"
            />
            <p class="text-xs text-gray-500 mt-1">
              Saldo saat ini: <strong>{{ tenantPoints?.currentPoints || 0 }} point</strong>
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Alasan <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="editPointsForm.reason"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Contoh: Penyesuaian point karena kesalahan sistem"
            ></textarea>
          </div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button
            @click="showEditPointsModal = false; editPointsForm = { points: 0, reason: '' };"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Batal
          </button>
          <button
            @click="handleUpdatePoints"
            :disabled="updatingPoints"
            class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ updatingPoints ? 'Memproses...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../api';
import { formatCurrency, formatDate, formatRemainingTime } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import { useNotification } from '../../composables/useNotification';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  subscriptionPlan?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
}

interface Subscription {
  plan?: string;
  daysRemaining: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
  secondsRemaining?: number;
  isExpired: boolean;
  isTemporaryUpgrade?: boolean;
  status: string;
  subscription?: {
    temporaryUpgrade?: boolean;
    previousPlan?: string;
    plan?: string;
  };
}

interface Addon {
  id: string;
  addonId: string;
  addonName: string;
  addonType: string;
  limit?: number;
  currentUsage?: number;
  isLimitReached?: boolean;
  expiresAt?: string;
  subscribedAt?: string;
}

interface AvailableAddon {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  defaultLimit?: number;
}

const tenant = ref<Tenant | null>(null);
const subscription = ref<Subscription | null>(null);
const activeAddons = ref<Addon[]>([]);
const availableAddons = ref<AvailableAddon[]>([]);
const loading = ref(false);
const isReloadingTenant = ref(false); // Flag to prevent multiple reloads
const currentTime = ref(new Date());
let countdownInterval: NodeJS.Timeout | null = null;
let pointsUpdateInterval: NodeJS.Timeout | null = null;
const extending = ref(false);
const reducing = ref(false);

const showExtendSubscriptionModal = ref(false);
const showReduceSubscriptionModal = ref(false);
const showEditPlanModal = ref(false);
const showExtendAddonModal = ref(false);
const showReduceAddonModal = ref(false);
const showAddAddonModal = ref(false);
const showEditUserModal = ref(false);
const showDeactivateSubscriptionModal = ref(false);
const deactivatingSubscription = ref(false);
const loadingUsers = ref(false);
const tenantUsers = ref<any[]>([]);
const updatingUser = ref(false);
const selectedUser = ref<any>(null);
const userUsage = ref<{ currentUsage: number; limit: number } | null>(null);
const showEditPointsModal = ref(false);
const loadingPoints = ref(false);
const tenantPoints = ref<{ currentPoints: number; totalEarned: number; totalSpent: number } | null>(null);
const pointTransactions = ref<any[]>([]);
const updatingPoints = ref(false);
const editPointsForm = ref({
  points: 0,
  reason: '',
});
const loadingStores = ref(false);
const tenantStores = ref<any[]>([]);
const outletUsage = ref<{ currentUsage: number; limit: number } | null>(null);
const selectedUsers = ref<any[]>([]);
const editUserForm = ref({
  name: '',
  email: '',
  role: 'CASHIER' as 'ADMIN_TENANT' | 'SUPERVISOR' | 'CASHIER' | 'KITCHEN',
  isActive: true,
  password: '',
});
const planForm = ref({
  subscriptionPlan: 'BASIC' as 'BASIC' | 'PRO' | 'ENTERPRISE',
  durationDays: 30, // Default 30 hari
});
const extendSubscriptionDays = ref<number>(30);
const reduceSubscriptionDays = ref<number>(30);
const extendAddonDays = ref<number>(30);
const reduceAddonDays = ref<number>(30);
const selectedAddon = ref<Addon | null>(null);
const selectedAddonForSubscribe = ref<AvailableAddon | null>(null);

const getAddonDaysRemaining = (addon: Addon) => {
  if (!addon.expiresAt) return 0;
  const now = new Date();
  const expiresAt = new Date(addon.expiresAt);
  const diffTime = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const isAddonActive = (addonId: string) => {
  const now = new Date();
  return activeAddons.value.some(a => {
    if (a.addonId !== addonId) return false;
    // Check if expired
    if (a.expiresAt) {
      const expiresAt = new Date(a.expiresAt);
      return expiresAt > now;
    }
    return true;
  });
};

// Check if addon has limit (can be purchased multiple times)
const hasLimit = (addon: any) => {
  return addon.defaultLimit !== null && addon.defaultLimit !== undefined;
};

// Filter available addons: hide addons without limit that are already active
const filteredAvailableAddons = computed(() => {
  return availableAddons.value.filter(addon => {
    // Addon dengan limit (ADD_OUTLETS, ADD_USERS, ADD_PRODUCTS) selalu ditampilkan
    if (hasLimit(addon)) {
      return true;
    }
    // Addon tanpa limit (BUSINESS_ANALYTICS, EXPORT_REPORTS, RECEIPT_EDITOR)
    // Sembunyikan jika sudah aktif dan belum expired
    // Tampilkan jika expired atau belum pernah dibeli
    if (isAddonActive(addon.id)) {
      return false; // Hide if active and not expired
    }
    return true; // Show if expired or not purchased
  });
});

const getAddonDescription = (activeAddon: any) => {
  // Find matching addon from available addons by addonId or addonType
  const matchedAddon = availableAddons.value.find(
    a => a.id === activeAddon.addonId || a.type === activeAddon.addonType
  );
  return matchedAddon?.description || activeAddon.addonType || 'Tidak ada deskripsi';
};

const getPlanName = (plan: string) => {
  const planNames: Record<string, string> = {
    BASIC: 'Starter',
    PRO: 'Boost',
    ENTERPRISE: 'Max',
  };
  return planNames[plan] || plan;
};

const getPlanBadgeClass = (plan: string) => {
  const classes: Record<string, string> = {
    BASIC: 'bg-gray-100 text-gray-700',
    PRO: 'bg-blue-100 text-blue-700',
    ENTERPRISE: 'bg-purple-100 text-purple-700',
  };
  return classes[plan] || 'bg-gray-100 text-gray-700';
};


const loadActiveAddons = async () => {
  if (!tenant.value?.id) return;
  
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    const response = await api.get('/addons');
    activeAddons.value = response.data || [];
  } catch (error: any) {
    console.error('Error loading active addons:', error);
    // Don't show error for addons, just set empty array
    activeAddons.value = [];
  }
};

const loadAvailableAddons = async () => {
  try {
    // Available addons are the same for all tenants
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    const response = await api.get('/addons/available');
    availableAddons.value = response.data || [];
  } catch (error: any) {
    console.error('Error loading available addons:', error);
    // Don't show error for addons, just set empty array
    availableAddons.value = [];
  }
};

const loadUsers = async () => {
  if (!tenant.value?.id) return;
  
  loadingUsers.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    const response = await api.get('/users', {
      params: {
        page: 1,
        limit: 100, // Get all users for this tenant
      },
    });
    tenantUsers.value = response.data.data || [];
    
    // Load user usage limit
    try {
      const usageResponse = await api.get('/addons/check-limit/ADD_USERS');
      userUsage.value = {
        currentUsage: usageResponse.data.currentUsage || 0,
        limit: usageResponse.data.limit === undefined ? -1 : usageResponse.data.limit,
      };
    } catch (error: any) {
      console.error('Error loading user usage:', error);
      // Set default if error
      userUsage.value = {
        currentUsage: tenantUsers.value.length,
        limit: -1,
      };
    }
  } catch (error: any) {
    console.error('Error loading users:', error);
    showError(error.response?.data?.message || 'Gagal memuat daftar pengguna');
  } finally {
    loadingUsers.value = false;
  }
};

const loadStores = async () => {
  if (!tenant.value?.id) return;
  
  loadingStores.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    const response = await api.get('/outlets');
    tenantStores.value = response.data.data || [];
    
    // Load outlet usage limit
    try {
      const usageResponse = await api.get('/addons/check-limit/ADD_OUTLETS');
      outletUsage.value = {
        currentUsage: usageResponse.data.currentUsage || 0,
        limit: usageResponse.data.limit === undefined ? -1 : usageResponse.data.limit,
      };
    } catch (error: any) {
      console.error('Error loading outlet usage:', error);
      // Set default if error
      outletUsage.value = {
        currentUsage: tenantStores.value.filter((s: any) => s.isActive !== false).length,
        limit: -1,
      };
    }
  } catch (error: any) {
    console.error('Error loading stores:', error);
    showError(error.response?.data?.message || 'Gagal memuat daftar store');
  } finally {
    loadingStores.value = false;
  }
};

const loadTenantPoints = async () => {
  if (!tenant.value?.id || !authStore.isSuperAdmin) return;
  
  loadingPoints.value = true;
  try {
    const balanceRes = await api.get(`/rewards/tenant/${tenant.value.id}/balance`);
    tenantPoints.value = balanceRes.data;
    
    const transactionsRes = await api.get(`/rewards/tenant/${tenant.value.id}/transactions`, {
      params: { limit: 20 },
    });
    pointTransactions.value = transactionsRes.data;
  } catch (error: any) {
    console.error('Error loading tenant points:', error);
    // Don't show error, just set defaults
    tenantPoints.value = { currentPoints: 0, totalEarned: 0, totalSpent: 0 };
    pointTransactions.value = [];
  } finally {
    loadingPoints.value = false;
  }
};

const handleUpdatePoints = async () => {
  if (!tenant.value?.id) return;
  
  if (!editPointsForm.value.reason.trim()) {
    await showError('Alasan wajib diisi');
    return;
  }
  
  if (editPointsForm.value.points === 0) {
    await showError('Point harus lebih dari 0');
    return;
  }
  
  updatingPoints.value = true;
  try {
    const response = await api.post(`/rewards/tenant/${tenant.value.id}/update`, {
      points: Math.floor(editPointsForm.value.points), // Ensure integer
      reason: editPointsForm.value.reason,
    });
    
    if (response.data.success) {
      await showSuccess(response.data.message);
      showEditPointsModal.value = false;
      editPointsForm.value = { points: 0, reason: '' };
      await loadTenantPoints();
    } else {
      await showError(response.data.message || 'Gagal mengupdate point');
    }
  } catch (error: any) {
    console.error('Error updating points:', error);
    await showError(error.response?.data?.message || 'Gagal mengupdate point');
  } finally {
    updatingPoints.value = false;
  }
};

const toggleStoreStatus = async (store: any) => {
  const action = store.isActive !== false ? 'nonaktifkan' : 'aktifkan';
  const confirmed = await showConfirm(`Apakah Anda yakin ingin ${action} store "${store.name}"?`);
  if (!confirmed) return;
  
  try {
    await api.put(`/outlets/${store.id}`, {
      isActive: !store.isActive,
    });
    await showSuccess(`Store berhasil di${action}`);
    await loadStores();
  } catch (error: any) {
    await showError(error.response?.data?.message || `Gagal ${action} store`);
  }
};

// Bulk user operations
const isUserSelected = (userId: string) => {
  return selectedUsers.value.some(u => u.id === userId);
};

const toggleUserSelection = (user: any) => {
  const index = selectedUsers.value.findIndex(u => u.id === user.id);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  } else {
    selectedUsers.value.push(user);
  }
};

const toggleSelectAllUsers = () => {
  if (selectedUsers.value.length === tenantUsers.value.length) {
    selectedUsers.value = [];
  } else {
    selectedUsers.value = [...tenantUsers.value];
  }
};

const bulkActivateUsers = async () => {
  const inactiveUsers = selectedUsers.value.filter(u => !u.isActive);
  if (inactiveUsers.length === 0) return;
  
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin mengaktifkan ${inactiveUsers.length} pengguna?`,
    'Aktifkan Pengguna'
  );
  if (!confirmed) return;

  try {
    const userIds = inactiveUsers.map(u => u.id);
    const response = await api.post('/users/bulk-update-status', {
      userIds,
      isActive: true,
    });
    
    if (response.data.updated > 0) {
      await showSuccess(`${response.data.updated} pengguna berhasil diaktifkan`);
    }
    if (response.data.failed > 0) {
      await showError(`${response.data.failed} pengguna gagal diaktifkan. ${response.data.errors.join(', ')}`);
    }
    
    selectedUsers.value = [];
    await loadUsers();
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal mengaktifkan pengguna');
  }
};

const bulkDeactivateUsers = async () => {
  const activeUsers = selectedUsers.value.filter(u => u.isActive);
  if (activeUsers.length === 0) return;
  
  const confirmed = await showConfirm(
    `Apakah Anda yakin ingin menonaktifkan ${activeUsers.length} pengguna?`,
    'Nonaktifkan Pengguna'
  );
  if (!confirmed) return;

  try {
    const userIds = activeUsers.map(u => u.id);
    const response = await api.post('/users/bulk-update-status', {
      userIds,
      isActive: false,
    });
    
    if (response.data.updated > 0) {
      await showSuccess(`${response.data.updated} pengguna berhasil dinonaktifkan`);
    }
    if (response.data.failed > 0) {
      await showError(`${response.data.failed} pengguna gagal dinonaktifkan. ${response.data.errors.join(', ')}`);
    }
    
    selectedUsers.value = [];
    await loadUsers();
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menonaktifkan pengguna');
  }
};

const getRoleClass = (role: string) => {
  const classes: Record<string, string> = {
    ADMIN_TENANT: 'bg-purple-100 text-purple-800',
    SUPERVISOR: 'bg-blue-100 text-blue-800',
    CASHIER: 'bg-green-100 text-green-800',
    KITCHEN: 'bg-orange-100 text-orange-800',
  };
  return classes[role] || 'bg-gray-100 text-gray-800';
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    ADMIN_TENANT: 'Admin',
    SUPERVISOR: 'Supervisor',
    CASHIER: 'Kasir',
    KITCHEN: 'Dapur',
  };
  return labels[role] || role;
};

const editUser = (user: any) => {
  selectedUser.value = user;
  editUserForm.value = {
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    password: '',
  };
  showEditUserModal.value = true;
};

const handleUpdateUser = async () => {
  if (!selectedUser.value) return;
  
  updatingUser.value = true;
  try {
    const updateData: any = {
      name: editUserForm.value.name,
      email: editUserForm.value.email,
      role: editUserForm.value.role,
      isActive: editUserForm.value.isActive,
    };
    
    // Only include password if provided
    if (editUserForm.value.password && editUserForm.value.password.trim() !== '') {
      updateData.password = editUserForm.value.password;
    }
    
    await api.put(`/users/${selectedUser.value.id}`, updateData);
    
    // Close modal first
    showEditUserModal.value = false;
    selectedUser.value = null;
    editUserForm.value = {
      name: '',
      email: '',
      role: 'CASHIER',
      isActive: true,
      password: '',
    };
    // Wait a bit for modal to close, then show success
    await new Promise(resolve => setTimeout(resolve, 100));
    await showSuccess('Pengguna berhasil diperbarui');
    await loadUsers(); // Auto-reload users after update
  } catch (error: any) {
    console.error('Error updating user:', error);
    await showError(error.response?.data?.message || 'Gagal memperbarui pengguna');
  } finally {
    updatingUser.value = false;
  }
};

const loadTenantDetail = async () => {
  // Check if user is still authenticated before making API calls
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  const tenantId = route.params.id as string;
  if (!tenantId) {
    router.push('/app/tenants');
    return;
  }

  // Set selectedTenantId for Super Admin before loading data
  if (authStore.isSuperAdmin) {
    authStore.setSelectedTenant(tenantId);
    localStorage.setItem('selectedTenantId', tenantId);
  }

  loading.value = true;
  try {
    // Load tenant info
    const tenantRes = await api.get(`/tenants/${tenantId}`);
    tenant.value = tenantRes.data;

    // Load subscription
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    const subRes = await api.get('/subscriptions/current');
    subscription.value = subRes.data;
    
    // IMPORTANT: Use isExpired from backend response directly
    // Don't recalculate isExpired based on subscriptionEnd to avoid flash to expired
    // Backend already calculated isExpired correctly after revert
    if (subRes.data && subRes.data.isExpired !== undefined && subscription.value) {
      // Use isExpired from backend
      subscription.value.isExpired = subRes.data.isExpired;
    }
    
    // Set initial plan form value
    planForm.value.subscriptionPlan = (subscription.value?.plan || tenant.value?.subscriptionPlan || 'BASIC') as 'BASIC' | 'PRO' | 'ENTERPRISE';
    planForm.value.durationDays = 30; // Reset durasi ke default

    // Use daysRemaining, hoursRemaining, minutesRemaining, secondsRemaining from backend if available
    // Only calculate if backend didn't provide these values
    if (subRes.data.daysRemaining === undefined) {
      // Calculate remaining time for countdown only if backend didn't provide
      // Use tenant.subscriptionEnd as fallback if subscription.subscription.endDate is not available
      const subscriptionEndDate = (subscription.value as any)?.subscription?.endDate || tenant.value?.subscriptionEnd;
      if (subscription.value && subscriptionEndDate) {
        const endDate = new Date(subscriptionEndDate);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        
        if (diffTime > 0) {
          const totalSeconds = Math.floor(diffTime / 1000);
          const totalMinutes = Math.floor(totalSeconds / 60);
          const totalHours = Math.floor(totalMinutes / 60);
          const days = Math.floor(totalHours / 24);
          
          subscription.value.daysRemaining = days;
          subscription.value.hoursRemaining = totalHours % 24;
          subscription.value.minutesRemaining = totalMinutes % 60;
          subscription.value.secondsRemaining = totalSeconds % 60;
        } else {
          subscription.value.daysRemaining = 0;
          subscription.value.hoursRemaining = 0;
          subscription.value.minutesRemaining = 0;
          subscription.value.secondsRemaining = 0;
        }
      }
    }
    
    // Start countdown if subscription exists and has endDate
    // Always start countdown if subscription exists and has endDate
    // The countdown will handle expired state internally
    const subscriptionEndDateForCountdown = (subscription.value as any)?.subscription?.endDate || tenant.value?.subscriptionEnd;
    if (subscription.value && subscriptionEndDateForCountdown) {
      // Initialize countdown values from backend response
      if (subscription.value.daysRemaining !== undefined) {
        // Backend already calculated, use those values
        startCountdown();
      } else {
        // Calculate from endDate if backend didn't provide
        const endDate = new Date(subscriptionEndDateForCountdown);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        
        if (diffTime > 0) {
          const totalSeconds = Math.floor(diffTime / 1000);
          const totalMinutes = Math.floor(totalSeconds / 60);
          const totalHours = Math.floor(totalMinutes / 60);
          const days = Math.floor(totalHours / 24);
          
          subscription.value.daysRemaining = days;
          subscription.value.hoursRemaining = totalHours % 24;
          subscription.value.minutesRemaining = totalMinutes % 60;
          subscription.value.secondsRemaining = totalSeconds % 60;
          // Don't set isExpired here - use from backend
        } else {
          // Only set isExpired if backend didn't provide it
          if (subscription.value.isExpired === undefined) {
            subscription.value.isExpired = true;
          }
          subscription.value.daysRemaining = 0;
          subscription.value.hoursRemaining = 0;
          subscription.value.minutesRemaining = 0;
          subscription.value.secondsRemaining = 0;
        }
        
        startCountdown();
      }
    }

    // Load active addons
    await loadActiveAddons();
    // Load available addons
    await loadAvailableAddons();
    // Load users and stores for this tenant
    await loadUsers();
    await loadStores();
    // Load tenant points (for super admin)
    await loadTenantPoints();
  } catch (error: any) {
    // If 401 Unauthorized, redirect to login
    if (error.response?.status === 401) {
      authStore.clearAuth();
      router.push('/login');
      return;
    }
    console.error('Error loading tenant detail:', error);
    // Only show error if it's not a navigation error
    if (error.response?.status !== 401) {
      await showError(error.response?.data?.message || 'Gagal memuat detail tenant');
    }
    if (error.response?.status !== 401) {
      router.push('/app/tenants');
    }
  } finally {
    loading.value = false;
  }
};

const handleExtendSubscription = async () => {
  if (!extendSubscriptionDays.value || extendSubscriptionDays.value < 1) return;

  extending.value = true;
  try {
    // Super Admin can extend without plan, just duration
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    await api.post('/subscriptions/extend', {
      duration: extendSubscriptionDays.value,
    });
    // Close modal first
    showExtendSubscriptionModal.value = false;
    extendSubscriptionDays.value = 30;
    // Wait a bit for modal to close, then show success
    await new Promise(resolve => setTimeout(resolve, 100));
    await showSuccess('Langganan berhasil diperpanjang');
    await loadTenantDetail();
  } catch (error: any) {
    console.error('Error extending subscription:', error);
    await showError(error.response?.data?.message || 'Gagal memperpanjang langganan');
  } finally {
    extending.value = false;
  }
};

const handleReduceSubscription = async () => {
  // Validate input
  if (!reduceSubscriptionDays.value) {
    await showError('Durasi harus diisi');
    return;
  }

  // Convert to number and validate
  const durationValue = Number(reduceSubscriptionDays.value);
  if (isNaN(durationValue) || durationValue < 1 || !Number.isInteger(durationValue)) {
    await showError('Durasi harus berupa angka bulat positif');
    return;
  }

  const duration = Math.floor(durationValue);

  reducing.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    await api.post('/subscriptions/reduce', {
      duration: duration, // Send as integer
    });
    
    // Close modal first
    showReduceSubscriptionModal.value = false;
    reduceSubscriptionDays.value = 30;
    // Wait a bit for modal to close, then show success
    await new Promise(resolve => setTimeout(resolve, 100));
    await showSuccess('Durasi langganan berhasil dikurangi');
    await loadTenantDetail();
  } catch (error: any) {
    console.error('Error reducing subscription:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message || 'Gagal mengurangi durasi langganan';
    await showError(errorMessage);
  } finally {
    reducing.value = false;
  }
};

const handleEditPlan = async () => {
  if (!planForm.value.subscriptionPlan || !tenant.value?.id || !planForm.value.durationDays || planForm.value.durationDays < 1) {
    await showError('Mohon lengkapi semua field');
    return;
  }
  
  try {
    await api.put(`/tenants/${tenant.value.id}/upgrade-plan`, {
      subscriptionPlan: planForm.value.subscriptionPlan,
      durationDays: planForm.value.durationDays,
    });
    // Close modal first
    showEditPlanModal.value = false;
    // Wait a bit for modal to close, then show success
    await new Promise(resolve => setTimeout(resolve, 100));
    await showSuccess('Paket berhasil diupdate (temporary upgrade)');
    await loadTenantDetail();
  } catch (error: any) {
    console.error('Error updating plan:', error);
    await showError(error.response?.data?.message || 'Gagal mengupdate paket');
  }
};

const extendAddon = (addon: Addon) => {
  selectedAddon.value = addon;
  extendAddonDays.value = 30;
  showExtendAddonModal.value = true;
};

const reduceAddon = (addon: Addon) => {
  selectedAddon.value = addon;
  reduceAddonDays.value = 30;
  showReduceAddonModal.value = true;
};

const handleExtendAddon = async () => {
  if (!selectedAddon.value || !extendAddonDays.value || extendAddonDays.value < 1) return;

  extending.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    await api.post('/addons/extend', {
      addonId: selectedAddon.value.addonId,
      duration: extendAddonDays.value,
    });
    // Close modal first
    showExtendAddonModal.value = false;
    selectedAddon.value = null;
    extendAddonDays.value = 30;
    // Wait a bit for modal to close, then show success
    await new Promise(resolve => setTimeout(resolve, 100));
    await showSuccess('Addon berhasil diperpanjang');
    // Reload addons to show updated list
    await loadActiveAddons();
  } catch (error: any) {
    console.error('Error extending addon:', error);
    await showError(error.response?.data?.message || 'Gagal memperpanjang addon');
  } finally {
    extending.value = false;
  }
};

const handleReduceAddon = async () => {
  if (!selectedAddon.value || !reduceAddonDays.value || reduceAddonDays.value < 1) return;

  reducing.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    await api.post('/addons/reduce', {
      addonId: selectedAddon.value.addonId,
      duration: reduceAddonDays.value,
    });
    // Close modal first
    showReduceAddonModal.value = false;
    selectedAddon.value = null;
    reduceAddonDays.value = 30;
    // Wait a bit for modal to close, then show success
    await new Promise(resolve => setTimeout(resolve, 100));
    await showSuccess('Durasi addon berhasil dikurangi');
    // Reload addons to show updated list
    await loadActiveAddons();
  } catch (error: any) {
    console.error('Error reducing addon:', error);
    await showError(error.response?.data?.message || 'Gagal mengurangi durasi addon');
  } finally {
    reducing.value = false;
  }
};

const subscribeAddon = async (addon: AvailableAddon) => {
  try {
    // If Super Admin, directly subscribe addon without payment
    if (authStore.isSuperAdmin) {
      await api.post('/addons/subscribe', {
        addonId: addon.id,
        addonName: addon.name,
        addonType: addon.type,
        limit: addon.defaultLimit ?? undefined,
        duration: 30, // Default 30 days
      });
      
      await showSuccess('Addon berhasil ditambahkan');
      // Reload addons to show updated list
      await loadActiveAddons();
      await loadAvailableAddons();
      return;
    }

    // For non-Super Admin, use payment flow
    const response = await api.post('/payment/addon', {
      itemName: addon.name,
      amount: addon.price,
      itemId: addon.id,
      itemType: 'addon',
    });

    if (response.data.success && response.data.paymentUrl) {
      // Redirect to Midtrans payment page
      window.location.href = response.data.paymentUrl;
    } else {
      await showError(response.data.message || 'Gagal membuat pembayaran');
    }
  } catch (error: any) {
    console.error('Error subscribing addon:', error);
    await showError(error.response?.data?.message || 'Gagal menambahkan addon');
  }
};

const handleSubscribeAddon = async () => {
  if (!selectedAddonForSubscribe.value) return;

  try {
    // If Super Admin, directly subscribe addon without payment
    if (authStore.isSuperAdmin) {
      const addon = selectedAddonForSubscribe.value;
      await api.post('/addons/subscribe', {
        addonId: addon.id,
        addonName: addon.name,
        addonType: addon.type,
        limit: addon.defaultLimit ?? undefined,
        duration: 30, // Default 30 days
      });
      
      // Close modal first
      showAddAddonModal.value = false;
      selectedAddonForSubscribe.value = null;
      // Wait a bit for modal to close, then show success
      await new Promise(resolve => setTimeout(resolve, 100));
      await showSuccess('Addon berhasil ditambahkan');
      // Reload addons to show updated list
      await loadActiveAddons();
      await loadAvailableAddons();
      return;
    }

    // For non-Super Admin, use payment flow
    const response = await api.post('/payment/addon', {
      itemName: selectedAddonForSubscribe.value.name,
      amount: selectedAddonForSubscribe.value.price,
      itemId: selectedAddonForSubscribe.value.id,
      itemType: 'addon',
    });

    if (response.data.success && response.data.paymentUrl) {
      // Redirect to Midtrans payment page
      window.location.href = response.data.paymentUrl;
    } else {
      await showError(response.data.message || 'Gagal membuat pembayaran');
    }
  } catch (error: any) {
    console.error('Error subscribing addon:', error);
    await showError(error.response?.data?.message || 'Gagal menambahkan addon');
  }
};

const unsubscribeAddon = async (addonId: string) => {
  const confirmed = await showConfirm('Apakah Anda yakin ingin menonaktifkan addon ini?');
  if (!confirmed) return;

  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    await api.post(`/addons/unsubscribe/${addonId}`);
    await showSuccess('Addon berhasil dinonaktifkan');
    // Reload addons to show updated list
    await loadActiveAddons();
    await loadAvailableAddons();
  } catch (error: any) {
    console.error('Error unsubscribing addon:', error);
    await showError(error.response?.data?.message || 'Gagal menonaktifkan addon');
  }
};

const handleDeactivateSubscription = async () => {
  if (!tenant.value?.id) return;
  
  deactivatingSubscription.value = true;
  try {
    await api.put(`/tenants/${tenant.value.id}/deactivate-subscription`);
    
    showSuccess('Langganan berhasil dinonaktifkan');
    showDeactivateSubscriptionModal.value = false;
    await loadTenantDetail();
  } catch (error: any) {
    console.error('Error deactivating subscription:', error);
    showError(error.response?.data?.message || 'Gagal menonaktifkan langganan');
  } finally {
    deactivatingSubscription.value = false;
  }
};

// Watch for route changes to update selectedTenantId
watch(() => route.params.id, (newTenantId) => {
  if (newTenantId && authStore.isSuperAdmin) {
    authStore.setSelectedTenant(newTenantId as string);
    localStorage.setItem('selectedTenantId', newTenantId as string);
  }
}, { immediate: true });

// Countdown real-time
const startCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    currentTime.value = new Date();
    
    // Update subscription remaining time if subscription exists
    // Use tenant.subscriptionEnd as fallback if subscription.subscription.endDate is not available
    // IMPORTANT: Skip if subscriptionEnd is null (already deactivated, don't reload)
    const subscriptionEndDate = (subscription.value as any)?.subscription?.endDate || tenant.value?.subscriptionEnd;
    if (subscription.value && subscriptionEndDate) {
      const endDate = new Date(subscriptionEndDate);
      const diffTime = endDate.getTime() - currentTime.value.getTime();
      
      // Only update if there's still time remaining (diffTime > 0)
      // If diffTime <= 0, mark as expired but don't stop countdown immediately
      // This allows the UI to show "0 hari" or "Kadaluwarsa" properly
      if (diffTime > 0) {
        const totalSeconds = Math.floor(diffTime / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const days = Math.floor(totalHours / 24);
        
        subscription.value.daysRemaining = days;
        subscription.value.hoursRemaining = totalHours % 24;
        subscription.value.minutesRemaining = totalMinutes % 60;
        subscription.value.secondsRemaining = totalSeconds % 60;
        subscription.value.isExpired = false;
      } else {
        // Time has expired
        subscription.value.isExpired = true;
        subscription.value.daysRemaining = 0;
        subscription.value.hoursRemaining = 0;
        subscription.value.minutesRemaining = 0;
        subscription.value.secondsRemaining = 0;
        
        // Stop countdown
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
        
        // IMPORTANT: Only auto refresh if current plan is BOOST (PRO/ENTERPRISE) and expired
        // If current plan is BASIC and expired, don't auto refresh (just show expired state)
        // This prevents unnecessary page refresh for BASIC plan
        const currentPlan = subscription.value?.plan || tenant.value?.subscriptionPlan || 'BASIC';
        const subscriptionEnd = (subscription.value as any)?.subscription?.endDate || tenant.value?.subscriptionEnd;
        
        // Only reload if:
        // 1. Current plan is PRO or ENTERPRISE (boost) and expired
        // 2. SubscriptionEnd is not null (might be temporary upgrade that needs revert)
        // 3. Not already reloading
        if ((currentPlan === 'PRO' || currentPlan === 'ENTERPRISE') && subscriptionEnd && !isReloadingTenant.value) {
          // Boost plan expired - reload to get reverted BASIC plan with remaining time
          isReloadingTenant.value = true;
          loadTenantDetail().finally(() => {
            isReloadingTenant.value = false;
          });
        } else if (currentPlan === 'BASIC' || !subscriptionEnd) {
          // BASIC plan expired or subscriptionEnd is null - don't reload to prevent page refresh
          // Just stop countdown and show expired state
        }
      }
    }
  }, 1000); // Update every second
};

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Only load if authenticated
  if (authStore.isAuthenticated) {
    loadTenantDetail();
    
    // Auto-refresh removed per user request
    
    // Load points once for Super Admin (no auto-refresh)
    if (authStore.isSuperAdmin) {
      loadTenantPoints();
    }
  } else {
    router.push('/login');
  }
});

onUnmounted(() => {
  stopCountdown();
  // Clear points update interval
  if (pointsUpdateInterval) {
    clearInterval(pointsUpdateInterval);
    pointsUpdateInterval = null;
  }
});
</script>

