<template>
  <div class="flex flex-col h-full">
    <!-- Tenant Selector for Super Admin -->
    <TenantSelector @tenant-changed="handleTenantChange" />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Pengguna</h2>
        <p class="text-sm sm:text-base text-gray-600">Kelola pengguna dan akses</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="showCreateModal = true"
          class="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Pengguna</span>
        </button>
      </div>
    </div>

    <!-- User Limit Info -->
    <div v-if="userLimit && userLimit.limit" class="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-semibold text-blue-900">Limit Pengguna</p>
          <p class="text-sm text-blue-700">
            {{ userLimit.currentUsage }} / {{ userLimit.limit }} pengguna aktif
          </p>
        </div>
        <div class="flex-1 max-w-xs ml-4">
          <div class="w-full bg-blue-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all"
              :class="userLimit.currentUsage >= userLimit.limit ? 'bg-red-600' : ''"
              :style="{ width: `${Math.min(100, (userLimit.currentUsage / userLimit.limit) * 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tenant Selection Message -->
    <div v-if="needsTenantSelection" class="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <svg class="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Pilih Tenant Terlebih Dahulu</h3>
      <p class="text-gray-600 text-center max-w-md">{{ tenantMessage }}</p>
    </div>

    <!-- Users Table -->
    <div v-else-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-gray-600 font-medium">Memuat pengguna...</div>
      </div>
    </div>

    <div v-else-if="users.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="text-gray-500">Belum ada pengguna</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ user.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getRoleClass(user.role)"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ user.isActive ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">
                  {{ user.lastLogin ? formatDateTime(user.lastLogin) : 'Belum pernah' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="editUser(user)"
                    class="px-3 py-1 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    v-if="user.role !== 'ADMIN_TENANT'"
                    @click="deleteUser(user.id)"
                    class="px-3 py-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
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

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center space-x-2 mt-6">
      <button
        @click="loadUsers(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Sebelumnya
      </button>
      <span class="px-4 py-2 text-gray-700">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
      </span>
      <button
        @click="loadUsers(pagination.page + 1)"
        :disabled="pagination.page === pagination.totalPages"
        class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Selanjutnya
      </button>
    </div>
  </div>

  <!-- User Edit Modal -->
  <UserEditModal
    :show="showEditModal"
    :user="editingUser"
    @close="showEditModal = false; editingUser = null"
    @save="handleSaveUser"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '../../api';
import { formatDateTime } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import TenantSelector from '../../components/TenantSelector.vue';
import UserEditModal from '../../components/UserEditModal.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';

const authStore = useAuthStore();
const userRole = authStore.user?.role || '';
const { needsTenantSelection, tenantMessage } = useTenantCheck();
const { error: showError, success: showSuccess, info: showInfo, confirm: showConfirm } = useNotification();

const users = ref<any[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingUser = ref<any>(null);
const userLimit = ref<any>(null);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const loadUsers = async (page = 1) => {
  if (needsTenantSelection.value) {
    return; // Don't load if tenant not selected
  }
  
  loading.value = true;
  try {
    const response = await api.get('/users', {
      params: { page, limit: pagination.value.limit },
    });
    users.value = response.data.data;
    pagination.value = response.data.pagination;

    // Load user limit
    try {
      const limitRes = await api.get('/addons/check-limit/ADD_USERS');
      userLimit.value = limitRes.data;
    } catch (e) {
      // Ignore if no addon
    }
  } catch (error: any) {
    console.error('Error loading users:', error);
    await showError(error.response?.data?.message || 'Gagal memuat pengguna');
  } finally {
    loading.value = false;
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
  editingUser.value = user;
  showEditModal.value = true;
};

const handleSaveUser = async (userData: any) => {
  try {
    if (editingUser.value) {
      await api.put(`/users/${editingUser.value.id}`, userData);
    }
    // Close modal first
    showEditModal.value = false;
    editingUser.value = null;
    // Wait a bit for modal to close, then show success
    await new Promise(resolve => setTimeout(resolve, 100));
    await showSuccess('Pengguna berhasil diupdate');
    await loadUsers(pagination.value.page);
  } catch (error: any) {
    console.error('Error saving user:', error);
    // Close modal first even on error
    showEditModal.value = false;
    editingUser.value = null;
    // Wait a bit for modal to close, then show error
    await new Promise(resolve => setTimeout(resolve, 100));
    await showError(error.response?.data?.message || 'Gagal menyimpan pengguna');
  }
};

const deleteUser = async (id: string) => {
  const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus pengguna ini?');
  if (!confirmed) return;
  try {
    await api.delete(`/users/${id}`);
    await loadUsers(pagination.value.page);
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menghapus pengguna');
  }
};

const handleTenantChange = (tenantId: string | null) => {
  // Auto-refetch users when tenant changes
  if (tenantId && !needsTenantSelection.value) {
    if (userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN') {
      loadUsers();
    }
  }
};

// Watch for tenant changes and auto-refetch
watch(() => authStore.currentTenantId, (newTenantId, oldTenantId) => {
  if (newTenantId && newTenantId !== oldTenantId && !needsTenantSelection.value) {
    if (userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN') {
      loadUsers();
    }
  }
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN') {
    if (!needsTenantSelection.value) {
      loadUsers();
    }
  }
});
</script>

