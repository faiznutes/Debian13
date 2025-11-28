<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900">Edit Pengguna</h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nama *</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Masukkan nama pengguna"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="email@example.com"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    v-model="form.role"
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    v-model="form.isActive"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option :value="true">Aktif</option>
                    <option :value="false">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password Baru (opsional)</label>
                <input
                  v-model="form.password"
                  type="password"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                />
                <div v-if="authStore.isSuperAdmin && props.user" class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p class="text-xs font-medium text-gray-700 mb-2">
                    Password aktif saat ini:
                  </p>
                  <div v-if="currentPassword" class="flex items-center gap-2">
                    <span class="font-mono text-sm font-semibold text-gray-900 bg-white px-3 py-2 rounded border border-gray-300 flex-1">{{ currentPassword }}</span>
                    <button
                      type="button"
                      @click="copyPassword"
                      class="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition"
                    >
                      Salin
                    </button>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="loadPassword"
                      :disabled="loadingPassword"
                      class="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Klik untuk melihat password aktif"
                    >
                      {{ loadingPassword ? 'Memuat...' : 'Lihat Password' }}
                    </button>
                    <p v-if="loadingPassword" class="text-xs text-gray-500">Memuat password...</p>
                  </div>
                </div>
              </div>

              <!-- Permissions Section -->
              <div v-if="(form.role === 'CASHIER' || form.role === 'SUPERVISOR' || form.role === 'KITCHEN') && form.permissions" class="border-t pt-4 mt-4">
                <h4 class="text-lg font-semibold text-gray-900 mb-4">Hak Akses & Fitur</h4>
                <div class="space-y-3">
                  <!-- Order Permissions -->
                  <div class="bg-gray-50 rounded-lg p-4">
                    <h5 class="text-sm font-semibold text-gray-700 mb-3">Manajemen Pesanan</h5>
                    <div class="space-y-2">
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canEditOrders"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Edit Pesanan</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canDeleteOrders"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Hapus Pesanan</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canCancelOrders"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Batalkan Pesanan</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canRefundOrders"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Refund Pesanan</span>
                      </label>
                    </div>
                  </div>

                  <!-- Report Permissions -->
                  <div class="bg-gray-50 rounded-lg p-4">
                    <h5 class="text-sm font-semibold text-gray-700 mb-3">Laporan</h5>
                    <div class="space-y-2">
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canViewReports"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Lihat Laporan</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canEditReports"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Edit Laporan</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canExportReports"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Export Laporan</span>
                      </label>
                    </div>
                  </div>

                  <!-- Product & Customer Permissions (for Supervisor and Cashier) -->
                  <div v-if="form.role === 'SUPERVISOR' || form.role === 'CASHIER'" class="bg-gray-50 rounded-lg p-4">
                    <h5 class="text-sm font-semibold text-gray-700 mb-3">Manajemen Data</h5>
                    <div class="space-y-2">
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canManageProducts"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Kelola Produk</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="permissions.canManageCustomers"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">Bisa Kelola Pelanggan</span>
                      </label>
                    </div>
                  </div>

                  <!-- Store Access (for Supervisor) -->
                  <div v-if="form.role === 'SUPERVISOR'" class="bg-gray-50 rounded-lg p-4 mt-4">
                    <h5 class="text-sm font-semibold text-gray-700 mb-3">Akses Store</h5>
                    <div class="space-y-2">
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          v-model="selectAllStores"
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span class="text-sm font-medium text-gray-700">Pilih Semua Store</span>
                      </label>
                      <div class="border-t pt-2 mt-2 max-h-48 overflow-y-auto">
                        <div v-if="loadingStores" class="text-sm text-gray-500 py-2">Memuat store...</div>
                        <div v-else-if="stores.length === 0" class="text-sm text-gray-500 py-2">Tidak ada store tersedia</div>
                        <div v-else class="space-y-2">
                          <label
                            v-for="store in stores"
                            :key="store.id"
                            class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                          >
                            <input
                              :value="store.id"
                              v-model="permissions.allowedStoreIds"
                              type="checkbox"
                              class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span class="text-sm text-gray-700">{{ store.name }}</span>
                            <span v-if="!store.isActive" class="text-xs text-red-600">(Tidak Aktif)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Store Assignment (for Cashier and Kitchen) -->
                  <div v-if="isCashierOrKitchen" class="bg-gray-50 rounded-lg p-4 mt-4">
                    <h5 class="text-sm font-semibold text-gray-700 mb-3">Penugasan Store</h5>
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Store <span class="text-red-500">*</span>
                      </label>
                      <div v-if="loadingStores" class="text-sm text-gray-500 py-2">Memuat store...</div>
                      <select
                        v-else
                        v-model="permissions.assignedStoreId"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      >
                        <option value="">-- Pilih Store --</option>
                        <option
                          v-for="store in stores"
                          :key="store.id"
                          :value="store.id"
                          :disabled="!store.isActive"
                        >
                          {{ store.name }}{{ !store.isActive ? ' (Tidak Aktif)' : '' }}
                        </option>
                      </select>
                      <p class="text-xs text-gray-500 mt-1">
                        Kasir/Kitchen hanya bisa mengakses data dari store yang dipilih
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex space-x-3 pt-4">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ saving ? 'Menyimpan...' : 'Simpan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { useNotification } from '../composables/useNotification';

const authStore = useAuthStore();
const { error: showError, success: showSuccess } = useNotification();

interface UserPermissions {
  canEditOrders?: boolean;
  canDeleteOrders?: boolean;
  canCancelOrders?: boolean;
  canRefundOrders?: boolean;
  canViewReports?: boolean;
  canEditReports?: boolean;
  canExportReports?: boolean;
  canManageProducts?: boolean;
  canManageCustomers?: boolean;
  allowedStoreIds?: string[]; // Array of store IDs that supervisor can access
  assignedStoreId?: string; // Single store ID assigned to cashier/kitchen
}

interface Store {
  id: string;
  name: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions?: UserPermissions;
}

interface Props {
  show: boolean;
  user: User | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [userData: Partial<User & { password?: string; permissions?: UserPermissions }>];
}>();

const form = ref<Partial<User & { password?: string; permissions?: UserPermissions }>>({
  name: '',
  email: '',
  role: 'CASHIER',
  isActive: true,
  password: '',
  permissions: {
    canEditOrders: false,
    canDeleteOrders: false,
    canCancelOrders: false,
    canRefundOrders: false,
    canViewReports: false,
    canEditReports: false,
    canExportReports: false,
    canManageProducts: false,
    canManageCustomers: false,
  },
});

// Computed to ensure permissions is always defined when accessing
const permissions = computed({
  get: () => {
    if (!form.value.permissions) {
      form.value.permissions = {
        canEditOrders: false,
        canDeleteOrders: false,
        canCancelOrders: false,
        canRefundOrders: false,
        canViewReports: false,
        canEditReports: false,
        canExportReports: false,
        canManageProducts: false,
        canManageCustomers: false,
      };
    }
    return form.value.permissions;
  },
  set: (value: UserPermissions) => {
    form.value.permissions = value;
  },
});

const saving = ref(false);
const stores = ref<Store[]>([]);
const loadingStores = ref(false);
const storesLoaded = ref(false); // Cache flag to prevent multiple loads
let loadStoresTimeout: ReturnType<typeof setTimeout> | null = null;
let isLoadingStores = false; // Prevent concurrent requests
const currentPassword = ref<string>('');
const loadingPassword = ref(false);

const isCashierOrKitchen = computed(() => {
  const role = form.value.role;
  return role === 'CASHIER' || role === 'KITCHEN';
});

const selectAllStores = computed({
  get: () => {
    if (!permissions.value.allowedStoreIds) return false;
    const activeStores = stores.value.filter(s => s.isActive);
    return activeStores.length > 0 && 
           activeStores.every(store => permissions.value.allowedStoreIds?.includes(store.id));
  },
  set: (value: boolean) => {
    handleSelectAllStores(value);
  }
});

const loadStores = async (force = false) => {
  // Load stores for SUPERVISOR, CASHIER, or KITCHEN
  const role = form.value.role;
  if (!role || !['SUPERVISOR', 'CASHIER', 'KITCHEN'].includes(role)) {
    stores.value = [];
    return;
  }
  
  // If already loaded and not forced, skip
  if (storesLoaded.value && !force && stores.value.length > 0) {
    return;
  }
  
  // Prevent concurrent requests
  if (isLoadingStores) {
    return;
  }
  
  // Clear existing timeout
  if (loadStoresTimeout) {
    clearTimeout(loadStoresTimeout);
  }
  
  // Debounce API call
  loadStoresTimeout = setTimeout(async () => {
    if (isLoadingStores) return; // Double check
    
    isLoadingStores = true;
    loadingStores.value = true;
    try {
      const response = await api.get('/outlets');
      stores.value = (response.data.data || []).map((store: any) => ({
        id: store.id,
        name: store.name,
        isActive: store.isActive !== false,
      }));
      storesLoaded.value = true; // Mark as loaded
    } catch (error: any) {
      console.error('Error loading stores:', error);
      // Don't clear stores on 429 error (rate limiting)
      if (error.response?.status !== 429) {
        stores.value = [];
      }
      // Don't mark as loaded if there was an error (except 429)
      if (error.response?.status !== 429) {
        storesLoaded.value = false;
      }
    } finally {
      loadingStores.value = false;
      isLoadingStores = false;
    }
  }, 300); // 300ms debounce
};

const handleSelectAllStores = (checked: boolean) => {
  if (checked) {
    // Select all active stores
    const activeStoreIds = stores.value.filter(s => s.isActive).map(s => s.id);
    permissions.value.allowedStoreIds = activeStoreIds;
  } else {
    // Deselect all
    permissions.value.allowedStoreIds = [];
  }
};

watch(() => props.user, async (newUser) => {
  if (newUser) {
    // Reset stores cache when user changes
    storesLoaded.value = false;
    
    form.value = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      password: '',
      permissions: newUser.permissions || {
        canEditOrders: false,
        canDeleteOrders: false,
        canCancelOrders: false,
        canRefundOrders: false,
        canViewReports: false,
        canEditReports: false,
        canExportReports: false,
        canManageProducts: false,
        canManageCustomers: false,
        allowedStoreIds: newUser.role === 'SUPERVISOR' ? [] : undefined,
        assignedStoreId: (newUser.role === 'CASHIER' || newUser.role === 'KITCHEN') ? '' : undefined,
      },
    };
    
    // Set current password if available (for Super Admin)
    if (authStore.isSuperAdmin) {
      // First check if defaultPassword is already in the user object
      if ((newUser as any).defaultPassword) {
        currentPassword.value = (newUser as any).defaultPassword;
      } else {
        // If not available, try to load it automatically when modal opens
        currentPassword.value = '';
        // Auto-load password when modal opens for Super Admin (with delay to ensure modal is ready)
        setTimeout(async () => {
          try {
            await loadPassword();
          } catch (error) {
            // Silently fail - user can click "Lihat Password" manually
            console.log('Password not available yet, user can click to load');
          }
        }, 300); // Small delay to ensure modal is fully rendered
      }
    } else {
      currentPassword.value = '';
    }
    
    // Load stores if role requires it (SUPERVISOR, CASHIER, or KITCHEN)
    if (['SUPERVISOR', 'CASHIER', 'KITCHEN'].includes(newUser.role)) {
      loadStores(true); // Force reload when user changes
    }
  }
}, { immediate: true });

watch(() => form.value.role, (newRole, oldRole) => {
  // Only reload stores if role changed to a role that needs stores
  const rolesNeedingStores = ['SUPERVISOR', 'CASHIER', 'KITCHEN'] as const;
  const oldNeededStores = oldRole && rolesNeedingStores.includes(oldRole as any);
  
  // Ensure permissions object exists
  if (!form.value.permissions) {
    form.value.permissions = {};
  }
  
  if (newRole === 'SUPERVISOR') {
    // Only load if not already loaded or role changed
    if (!oldNeededStores || !storesLoaded.value) {
      loadStores();
    }
    // Initialize allowedStoreIds if not exists
    permissions.value.allowedStoreIds = permissions.value.allowedStoreIds || [];
    // Clear assignedStoreId for supervisor
    if (permissions.value.assignedStoreId) {
      permissions.value.assignedStoreId = undefined;
    }
  } else if (newRole === 'CASHIER' || newRole === 'KITCHEN') {
    // Only load if not already loaded or role changed
    if (!oldNeededStores || !storesLoaded.value) {
      loadStores();
    }
    // Initialize assignedStoreId if not exists
    if (!permissions.value.assignedStoreId) {
      permissions.value.assignedStoreId = '';
    }
    // Clear allowedStoreIds for cashier/kitchen
    if (permissions.value.allowedStoreIds) {
      permissions.value.allowedStoreIds = undefined;
    }
  } else {
    stores.value = [];
    storesLoaded.value = false; // Reset cache
    if (permissions.value) {
      permissions.value.allowedStoreIds = undefined;
      permissions.value.assignedStoreId = undefined;
    }
  }
});

onMounted(() => {
  // Stores will be loaded by watch if needed
  // No need to load again here to prevent duplicate requests
});

onUnmounted(() => {
  // Clear timeout on unmount to prevent memory leaks
  if (loadStoresTimeout) {
    clearTimeout(loadStoresTimeout);
    loadStoresTimeout = null;
  }
});

const loadPassword = async () => {
  if (!props.user || !authStore.isSuperAdmin) return;
  
  loadingPassword.value = true;
  try {
    const response = await api.get(`/users/${props.user.id}/password`);
    if (response.data && response.data.password) {
      currentPassword.value = response.data.password;
      // Auto-copy to clipboard
      await copyPassword();
    } else {
      currentPassword.value = '';
      await showError('Password tidak ditemukan. Silakan coba lagi.');
    }
  } catch (error: any) {
    console.error('Error loading password:', error);
    currentPassword.value = '';
    const errorMessage = error.response?.data?.message || 'Gagal memuat password. Silakan coba lagi.';
    await showError(errorMessage);
  } finally {
    loadingPassword.value = false;
  }
};

const copyPassword = async () => {
  if (!currentPassword.value) return;
  
  try {
    await navigator.clipboard.writeText(currentPassword.value);
    // Show success message
    await showSuccess('Password telah disalin ke clipboard!');
  } catch (error) {
    console.error('Error copying password:', error);
    await showError('Gagal menyalin password ke clipboard.');
  }
};

const handleSubmit = () => {
  const userData: Partial<User & { password?: string; permissions?: UserPermissions }> = {
    name: form.value.name,
    email: form.value.email,
    role: form.value.role,
    isActive: form.value.isActive,
  };

  if (form.value.password) {
    userData.password = form.value.password;
  }

  // Include permissions if role is CASHIER, SUPERVISOR, or KITCHEN
  if (form.value.role === 'CASHIER' || form.value.role === 'SUPERVISOR' || form.value.role === 'KITCHEN') {
    userData.permissions = form.value.permissions;
  }

  emit('save', userData);
  saving.value = true;
  setTimeout(() => {
    saving.value = false;
  }, 1000);
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

