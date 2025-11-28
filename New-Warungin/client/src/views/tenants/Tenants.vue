<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Tenant Management</h2>
        <p class="text-sm sm:text-base text-gray-600">Kelola semua tenant yang terdaftar</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Tenant</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mb-4 sm:mb-6 mx-4 sm:mx-6">
      <!-- Search Bar -->
      <div class="mb-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="filters.search"
            @focus="handleSearchFocus"
            type="text"
            placeholder="Cari tenant..."
            class="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      <!-- Status Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-2">Status</label>
        <div class="flex flex-wrap gap-2">
          <button
            @click="filters.isActive = ''"
            :class="filters.isActive === '' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
          >
            Semua
          </button>
          <button
            @click="filters.isActive = 'true'"
            :class="filters.isActive === 'true' 
              ? 'bg-green-600 text-white border-green-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
          >
            Aktif
          </button>
          <button
            @click="filters.isActive = 'false'"
            :class="filters.isActive === 'false' 
              ? 'bg-red-600 text-white border-red-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
          >
            Tidak Aktif
          </button>
        </div>
      </div>
    </div>

    <!-- Tenants Table -->
    <div v-if="loading" class="flex items-center justify-center py-12 mx-4 sm:mx-6">
      <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="filteredTenants.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg mx-4 sm:mx-6">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <p class="text-gray-500">Belum ada tenant</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden mx-4 sm:mx-6">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paket</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="tenant in filteredTenants" :key="tenant.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="viewTenantDetail(tenant.id)"
                  class="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                >
                  {{ tenant.name }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ tenant.email || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="tenant.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ tenant.isActive !== false ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span 
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getPlanBadgeClass(tenant.subscriptionPlan || 'BASIC')"
                  >
                    {{ getPlanName(tenant.subscriptionPlan || 'BASIC') }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ formatDate(tenant.createdAt) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="editTenant(tenant)"
                    class="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteTenant(tenant.id)"
                    class="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || editingTenant"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          {{ editingTenant ? 'Edit Tenant' : 'Tambah Tenant' }}
        </h3>
        <form @submit.prevent="saveTenant" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Tenant</label>
            <input
              v-model="tenantForm.name"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Nasi Padang Barokah"
            />
            <p v-if="!editingTenant" class="text-xs text-gray-500 mt-1">Email dan password akan di-generate otomatis</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
            <input
              v-model="tenantForm.phone"
              type="tel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="081234567890"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <textarea
              v-model="tenantForm.address"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Alamat lengkap tenant"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Paket</label>
            <select
              v-model="tenantForm.subscriptionPlan"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="BASIC">Starter (BASIC)</option>
              <option value="PRO">Boost (PRO)</option>
              <option value="ENTERPRISE">Max (ENTERPRISE)</option>
            </select>
          </div>
          <div v-if="editingTenant" class="flex items-center space-x-2">
            <input
              v-model="tenantForm.isActive"
              type="checkbox"
              id="isActive"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label for="isActive" class="text-sm text-gray-700">Aktif</label>
          </div>
          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {{ editingTenant ? 'Update' : 'Simpan' }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../api';
import { formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import { useNotification } from '../../composables/useNotification';

const router = useRouter();

const authStore = useAuthStore();
const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();
const tenants = ref<any[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const editingTenant = ref<any>(null);
const filters = ref({
  search: '',
  isActive: '',
});

const tenantForm = ref({
  name: '',
  phone: '',
  address: '',
  subscriptionPlan: 'BASIC',
  isActive: true,
});

const filteredTenants = computed(() => {
  let result = tenants.value;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(search) ||
      (t.email && t.email.toLowerCase().includes(search))
    );
  }

  if (filters.value.isActive !== '') {
    const isActive = filters.value.isActive === 'true';
    result = result.filter(t => (t.isActive !== false) === isActive);
  }

  return result;
});

const loadTenants = async () => {
  if (!authStore.isAuthenticated) return; // Don't load if not authenticated
  
  loading.value = true;
  try {
    const response = await api.get('/tenants');
    tenants.value = response.data.data || response.data;
  } catch (error: any) {
    // Suppress errors during logout (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return;
    }
    console.error('Error loading tenants:', error);
    if (authStore.isAuthenticated) {
      await showError('Gagal memuat tenant');
    }
  } finally {
    loading.value = false;
  }
};

const viewTenantDetail = (tenantId: string) => {
  // Set selectedTenantId for Super Admin before navigation
  if (authStore.isSuperAdmin) {
    authStore.setSelectedTenant(tenantId);
    localStorage.setItem('selectedTenantId', tenantId);
  }
  router.push(`/app/tenants/${tenantId}`);
};

const editTenant = (tenant: any) => {
  editingTenant.value = tenant;
  tenantForm.value = {
    name: tenant.name,
    phone: tenant.phone || '',
    address: tenant.address || '',
    subscriptionPlan: tenant.subscriptionPlan || 'BASIC',
    isActive: tenant.isActive !== false,
  };
};

const deleteTenant = async (id: string) => {
  const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus tenant ini?');
  if (!confirmed) return;
  try {
    await api.delete(`/tenants/${id}`);
    await loadTenants();
    await showSuccess('Tenant berhasil dihapus');
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menghapus tenant');
  }
};

const saveTenant = async () => {
  try {
    const data: any = {
      name: tenantForm.value.name,
      phone: tenantForm.value.phone,
      address: tenantForm.value.address,
      subscriptionPlan: tenantForm.value.subscriptionPlan,
    };

    if (editingTenant.value) {
      data.isActive = tenantForm.value.isActive;
      await api.put(`/tenants/${editingTenant.value.id}`, data);
      await showSuccess('Tenant berhasil diupdate');
    } else {
      try {
        const response = await api.post('/tenants', data);
        // Show success with generated password
        const defaultPassword = response.data?.defaultPassword || response.data?.users?.[0]?.password;
        if (defaultPassword) {
          await showSuccess(`Tenant berhasil dibuat! Password default: ${defaultPassword}`);
        } else {
          await showSuccess('Tenant berhasil dibuat!');
        }
      } catch (error: any) {
        // Check if tenant was actually created (status 201 or 200)
        if (error.response?.status === 201 || error.response?.status === 200) {
          // Tenant was created successfully, just show success
          const defaultPassword = error.response?.data?.defaultPassword || error.response?.data?.users?.[0]?.password;
          if (defaultPassword) {
            await showSuccess(`Tenant berhasil dibuat! Password default: ${defaultPassword}`);
          } else {
            await showSuccess('Tenant berhasil dibuat!');
          }
        } else {
          // Real error, show error message
          throw error;
        }
      }
    }

    closeModal();
    await loadTenants();
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menyimpan tenant');
  }
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

const closeModal = () => {
  showCreateModal.value = false;
  editingTenant.value = null;
  tenantForm.value = {
    name: '',
    phone: '',
    address: '',
    subscriptionPlan: 'BASIC',
    isActive: true,
  };
};

const handleSearchFocus = () => {
  // No-op, just for compatibility
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadTenants();
});
</script>

