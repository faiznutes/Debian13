<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Receipt Templates</h1>
        <p class="text-gray-600">Kelola template struk untuk berbagai ukuran kertas</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Template
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Templates List -->
    <div v-else class="space-y-6">
      <div v-if="templates.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600 mb-4">Belum ada template yang dibuat</p>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Buat Template Pertama
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="template in templates"
          :key="template.id"
          class="bg-white rounded-lg shadow-md p-6 border-2 transition"
          :class="template.isDefault ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:shadow-lg'"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ template.name }}</h3>
              <p class="text-sm text-gray-500 mb-2">{{ template.templateType }}</p>
              <div class="flex flex-wrap gap-2">
                <span
                  class="inline-block px-2 py-1 text-xs rounded"
                  :class="template.paperSize === 'A4' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'"
                >
                  {{ template.paperSize }}
                </span>
                <span
                  v-if="template.isDefault"
                  class="inline-block px-2 py-1 text-xs bg-primary-600 text-white rounded"
                >
                  Default
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2 mt-4">
            <button
              @click="previewTemplate(template)"
              class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Preview
            </button>
            <button
              @click="editTemplate(template)"
              class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
            >
              Edit
            </button>
            <button
              v-if="!template.isDefault"
              @click="setAsDefault(template.id)"
              class="px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition"
              title="Set as Default"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              v-if="!template.isDefault"
              @click="deleteTemplate(template.id)"
              class="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              title="Delete"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || editingTemplate"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            {{ editingTemplate ? 'Edit Template' : 'Buat Template Baru' }}
          </h3>

          <form @submit.prevent="saveTemplate" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nama Template *</label>
                <input
                  v-model="templateForm.name"
                  type="text"
                  required
                  placeholder="Contoh: Struk Thermal 58mm"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Template *</label>
                <select
                  v-model="templateForm.templateType"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DEFAULT">Default</option>
                  <option value="MODERN">Modern</option>
                  <option value="MINIMAL">Minimal</option>
                  <option value="DETAILED">Detailed</option>
                  <option value="COMPACT">Compact</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ukuran Kertas *</label>
                <select
                  v-model="templateForm.paperSize"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="A4">A4</option>
                  <option value="THERMAL_58">Thermal 58mm</option>
                  <option value="THERMAL_80">Thermal 80mm</option>
                </select>
              </div>
            </div>

            <div class="border-t pt-4">
              <h4 class="font-semibold text-gray-900 mb-3">Header Settings</h4>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.header.showName"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Tampilkan Nama Toko</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.header.showAddress"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Tampilkan Alamat</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.header.showPhone"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Tampilkan Telepon</span>
                </label>
              </div>
            </div>

            <div class="border-t pt-4">
              <h4 class="font-semibold text-gray-900 mb-3">Fields Settings</h4>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showOrderNumber"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Nomor Order</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showDate"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Tanggal</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showTime"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Waktu</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showCustomer"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Customer</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showItems"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Items</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showSubtotal"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Subtotal</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showDiscount"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Discount</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showTotal"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Total</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showPaymentMethod"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Payment Method</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.fields.showChange"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Change</span>
                </label>
              </div>
            </div>

            <div class="border-t pt-4">
              <h4 class="font-semibold text-gray-900 mb-3">Footer Settings</h4>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.footer.showThankYou"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Thank You Message</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    v-model="templateForm.footer.showContact"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Contact Info</span>
                </label>
              </div>
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div
      v-if="previewingTemplate"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="previewingTemplate = null"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900">Preview Template: {{ previewingTemplate.name }}</h3>
            <button
              @click="previewingTemplate = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="bg-gray-50 rounded-lg p-6">
            <div class="bg-white rounded p-4 max-w-md mx-auto border-2 border-dashed border-gray-300">
              <p class="text-center text-gray-500 text-sm">Preview akan ditampilkan di sini</p>
              <p class="text-center text-gray-400 text-xs mt-2">Template: {{ previewingTemplate.templateType }} - {{ previewingTemplate.paperSize }}</p>
            </div>
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

const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

const loading = ref(true);
const saving = ref(false);
const templates = ref<any[]>([]);
const showCreateModal = ref(false);
const editingTemplate = ref<any>(null);
const previewingTemplate = ref<any>(null);

const templateForm = ref({
  name: '',
  templateType: 'DEFAULT',
  paperSize: 'A4',
  header: {
    showName: true,
    showAddress: true,
    showPhone: false,
  },
  footer: {
    showThankYou: true,
    showContact: true,
  },
  fields: {
    showOrderNumber: true,
    showDate: true,
    showTime: false,
    showCustomer: false,
    showItems: true,
    showSubtotal: true,
    showDiscount: true,
    showTotal: true,
    showPaymentMethod: true,
    showChange: true,
  },
});

const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await api.get('/receipts/templates');
    templates.value = response.data;
  } catch (error: any) {
    console.error('Error loading templates:', error);
    await showError('Gagal memuat template');
  } finally {
    loading.value = false;
  }
};

const saveTemplate = async () => {
  saving.value = true;
  try {
    if (editingTemplate.value) {
      await api.put(`/receipts/templates/${editingTemplate.value.id}`, templateForm.value);
      await showSuccess('Template berhasil diupdate');
    } else {
      await api.post('/receipts/templates', templateForm.value);
      await showSuccess('Template berhasil ditambahkan');
    }
    closeModal();
    await loadTemplates();
  } catch (error: any) {
    console.error('Error saving template:', error);
    await showError(error.response?.data?.message || 'Gagal menyimpan template');
  } finally {
    saving.value = false;
  }
};

const editTemplate = (template: any) => {
  editingTemplate.value = template;
  templateForm.value = {
    name: template.name,
    templateType: template.templateType,
    paperSize: template.paperSize,
    header: template.header || {
      showName: true,
      showAddress: true,
      showPhone: false,
    },
    footer: template.footer || {
      showThankYou: true,
      showContact: true,
    },
    fields: template.fields || {
      showOrderNumber: true,
      showDate: true,
      showTime: false,
      showCustomer: false,
      showItems: true,
      showSubtotal: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showChange: true,
    },
  };
  showCreateModal.value = true;
};

const previewTemplate = (template: any) => {
  previewingTemplate.value = template;
};

const setAsDefault = async (id: string) => {
  try {
    await api.post(`/receipts/templates/${id}/set-default`);
    await loadTemplates();
    await showSuccess('Template berhasil dijadikan default');
  } catch (error: any) {
    console.error('Error setting default:', error);
    await showError('Gagal mengatur template default');
  }
};

const deleteTemplate = async (id: string) => {
  const confirmed = await showConfirm(
    'Hapus Template',
    'Apakah Anda yakin ingin menghapus template ini?',
    'Hapus',
    'Batal'
  );
  
  if (!confirmed) return;

  try {
    await api.delete(`/receipts/templates/${id}`);
    await loadTemplates();
    await showSuccess('Template berhasil dihapus');
  } catch (error: any) {
    console.error('Error deleting template:', error);
    await showError(error.response?.data?.message || 'Gagal menghapus template');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingTemplate.value = null;
  templateForm.value = {
    name: '',
    templateType: 'DEFAULT',
    paperSize: 'A4',
    header: {
      showName: true,
      showAddress: true,
      showPhone: false,
    },
    footer: {
      showThankYou: true,
      showContact: true,
    },
    fields: {
      showOrderNumber: true,
      showDate: true,
      showTime: false,
      showCustomer: false,
      showItems: true,
      showSubtotal: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showChange: true,
    },
  };
};

onMounted(() => {
  loadTemplates();
});
</script>

