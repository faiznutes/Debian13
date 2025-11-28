<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Kelola Template Struk</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition p-2"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Template List -->
        <div class="mb-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h4 class="text-lg font-semibold text-gray-900">Template Tersedia</h4>
            <button
              @click="showCreateModal = true"
              class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center space-x-2"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Template</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="template in templates"
              :key="template.id"
              class="border-2 rounded-lg p-4 cursor-pointer transition"
              :class="template.isDefault ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'"
              @click="selectTemplate(template)"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h5 class="font-semibold text-gray-900 mb-1">{{ template.name }}</h5>
                  <p class="text-xs text-gray-500 mb-2">{{ template.templateType }}</p>
                  <span
                    class="inline-block px-2 py-1 text-xs rounded"
                    :class="template.paperSize === 'A4' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'"
                  >
                    {{ template.paperSize }}
                  </span>
                </div>
                <span
                  v-if="template.isDefault"
                  class="px-2 py-1 text-xs bg-primary-600 text-white rounded"
                >
                  Default
                </span>
              </div>
              <div class="flex items-center space-x-2 mt-3">
                <button
                  @click.stop="editTemplate(template)"
                  class="flex-1 px-2 py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                >
                  Edit
                </button>
                <button
                  v-if="!template.isDefault"
                  @click.stop="setAsDefault(template.id)"
                  class="flex-1 px-2 py-1 text-xs sm:text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition"
                >
                  Set Default
                </button>
                <button
                  v-if="!template.isDefault"
                  @click.stop="deleteTemplate(template.id)"
                  class="px-2 py-1 text-xs sm:text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Template Preview -->
        <div v-if="selectedTemplate" class="border-t pt-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">Preview Template</h4>
          <div class="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div
              ref="previewContent"
              class="bg-white rounded p-4 sm:p-6 max-w-md mx-auto"
              :class="[getPaperSizeClass(selectedTemplate.paperSize), getTemplateContainerClass(selectedTemplate.templateType)]"
              :style="{ fontFamily: getTemplateFontFamily(selectedTemplate.templateType, selectedTemplate.styles), fontSize: getTemplateFontSize(selectedTemplate.templateType, selectedTemplate.styles) }"
            >
              <!-- Preview content will be rendered here -->
              <div :class="getTemplateHeaderStyle(selectedTemplate.templateType, selectedTemplate.styles)">
                <h1 :class="getTemplateTitleStyle(selectedTemplate.templateType)">
                  Nama Toko
                </h1>
                <p class="text-xs sm:text-sm text-gray-600">Alamat Toko</p>
                <p class="text-xs sm:text-sm text-gray-600 mt-1">Telp: 081234567890</p>
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span>No. Pesanan:</span>
                  <span class="font-semibold">ORD-001</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span>Tanggal:</span>
                  <span>{{ new Date().toLocaleDateString('id-ID') }}</span>
                </div>
              </div>
              <div :class="['border-t border-b py-4 mb-4', getTemplateContentStyle(selectedTemplate.templateType)]">
                <div :class="['flex justify-between text-sm mb-2', getTemplateItemStyle(selectedTemplate.templateType)]">
                  <span>Item 1</span>
                  <span>Rp 10.000</span>
                </div>
              </div>
              <div :class="getTemplateTotalStyle(selectedTemplate.templateType)">
                <span>Total:</span>
                <span>Rp 10.000</span>
              </div>
              <div :class="getTemplateFooterStyle(selectedTemplate.templateType)">
                <p class="font-semibold">Terima Kasih!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Template Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal || editingTemplate"
        class="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
        @click.self="closeTemplateModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-4 sm:p-6">
            <div class="flex items-center justify-between mb-4 sm:mb-6">
              <h3 class="text-xl font-bold text-gray-900">
                {{ editingTemplate ? 'Edit Template' : 'Tambah Template Baru' }}
              </h3>
              <button
                @click="closeTemplateModal"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="saveTemplate" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nama Template</label>
                <input
                  v-model="templateForm.name"
                  type="text"
                  required
                  class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nama template"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Template</label>
                <select
                  v-model="templateForm.templateType"
                  required
                  class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DEFAULT">Struk Standar</option>
                  <option value="MODERN">Struk Modern</option>
                  <option value="MINIMAL">Struk Minimalis</option>
                  <option value="DETAILED">Struk Detail</option>
                  <option value="COMPACT">Struk Kompak</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ukuran Kertas</label>
                <select
                  v-model="templateForm.paperSize"
                  required
                  class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="A4">A4 (Kertas Biasa)</option>
                  <option value="THERMAL_58">Thermal 58mm</option>
                  <option value="THERMAL_80">Thermal 80mm</option>
                </select>
              </div>

              <!-- Header Settings -->
              <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-900 mb-3">Pengaturan Header</h4>
                <div class="space-y-2">
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.header.showName"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Tampilkan Nama Toko</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.header.showAddress"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Tampilkan Alamat</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.header.showPhone"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Tampilkan Telepon</span>
                  </label>
                </div>
              </div>

              <!-- Fields Settings -->
              <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-900 mb-3">Field yang Ditampilkan</h4>
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showOrderNumber"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">No. Pesanan</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showDate"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Tanggal</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showTime"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Waktu</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showCustomer"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Pelanggan</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showItems"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Item</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showSubtotal"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Subtotal</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showDiscount"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Diskon</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showTotal"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Total</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showPaymentMethod"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Metode Pembayaran</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.fields.showChange"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Kembalian</span>
                  </label>
                </div>
              </div>

              <!-- Footer Settings -->
              <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-900 mb-3">Pengaturan Footer</h4>
                <div class="space-y-2">
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.footer.showThankYou"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Tampilkan "Terima Kasih"</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="templateForm.footer.showContact"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <span class="text-sm text-gray-700">Tampilkan Kontak</span>
                  </label>
                </div>
              </div>

              <div class="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  @click="closeTemplateModal"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm sm:text-base"
                >
                  {{ editingTemplate ? 'Update' : 'Simpan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '../api';
import { Teleport } from 'vue';
import { useNotification } from '../composables/useNotification';
import { 
  getTemplateHeaderStyle, 
  getTemplateTitleStyle, 
  getTemplateContentStyle, 
  getTemplateItemStyle, 
  getTemplateTotalStyle, 
  getTemplateFooterStyle 
} from '../utils/receipt-template-styles';

const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

interface ReceiptTemplate {
  id: string;
  name: string;
  templateType: string;
  paperSize: string;
  isDefault: boolean;
  header?: any;
  footer?: any;
  fields?: any;
  styles?: any;
}

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const templates = ref<ReceiptTemplate[]>([]);
const selectedTemplate = ref<ReceiptTemplate | null>(null);
const showCreateModal = ref(false);
const editingTemplate = ref<ReceiptTemplate | null>(null);
const previewContent = ref<HTMLElement | null>(null);

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
  try {
    const response = await api.get('/receipts/templates');
    templates.value = response.data;
    if (templates.value.length > 0 && !selectedTemplate.value) {
      selectedTemplate.value = templates.value.find(t => t.isDefault) || templates.value[0];
    }
  } catch (error: any) {
    console.error('Error loading templates:', error);
    await showError('Gagal memuat template');
  }
};

const selectTemplate = (template: ReceiptTemplate) => {
  selectedTemplate.value = template;
};

const editTemplate = (template: ReceiptTemplate) => {
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

const closeTemplateModal = () => {
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

const saveTemplate = async () => {
  try {
    if (editingTemplate.value) {
      await api.put(`/receipts/templates/${editingTemplate.value.id}`, templateForm.value);
      await showSuccess('Template berhasil diupdate');
    } else {
      await api.post('/receipts/templates', templateForm.value);
      await showSuccess('Template berhasil ditambahkan');
    }
    closeTemplateModal();
    await loadTemplates();
    emit('updated');
  } catch (error: any) {
    console.error('Error saving template:', error);
    await showError(error.response?.data?.message || 'Gagal menyimpan template');
  }
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
  const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus template ini?');
  if (!confirmed) return;
  try {
    await api.delete(`/receipts/templates/${id}`);
    await loadTemplates();
    if (selectedTemplate.value?.id === id) {
      selectedTemplate.value = templates.value[0] || null;
    }
    await showSuccess('Template berhasil dihapus');
  } catch (error: any) {
    console.error('Error deleting template:', error);
    await showError(error.response?.data?.message || 'Gagal menghapus template');
  }
};

const getPaperSizeClass = (paperSize: string) => {
  if (paperSize === 'THERMAL_58') return 'max-w-xs';
  if (paperSize === 'THERMAL_80') return 'max-w-sm';
  return 'max-w-md';
};

const getTemplateContainerClass = (templateType: string): string => {
  const classMap: Record<string, string> = {
    DEFAULT: 'border-2 border-gray-400',
    MODERN: 'border-0 shadow-lg',
    MINIMAL: 'border-0',
    DETAILED: 'border-2 border-gray-500 shadow-md',
    COMPACT: 'border border-gray-400',
  };
  return classMap[templateType] || classMap.DEFAULT;
};

const getTemplateFontFamily = (templateType: string, styles?: any): string => {
  const fontMap: Record<string, string> = {
    DEFAULT: styles?.fontFamily || 'Arial, sans-serif',
    MODERN: styles?.fontFamily || 'Inter, sans-serif',
    MINIMAL: styles?.fontFamily || 'Courier New, monospace',
    DETAILED: styles?.fontFamily || 'Arial, sans-serif',
    COMPACT: styles?.fontFamily || 'Courier New, monospace',
  };
  return fontMap[templateType] || 'Arial, sans-serif';
};

const getTemplateFontSize = (templateType: string, styles?: any): string => {
  return styles?.fontSize || '12px';
};

watch(() => props.show, (newShow) => {
  if (newShow) {
    loadTemplates();
  }
});

onMounted(() => {
  if (props.show) {
    loadTemplates();
  }
});
</script>

