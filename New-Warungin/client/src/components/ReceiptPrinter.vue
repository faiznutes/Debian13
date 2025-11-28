<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Print Receipt</h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 transition p-2"
            >
              <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Paper Size Selection -->
          <div class="mb-4 sm:mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Ukuran Kertas</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="selectedPaperSize = '50mm'"
                class="px-4 py-3 rounded-lg border-2 transition flex flex-col items-center space-y-2"
                :class="selectedPaperSize === '50mm' 
                  ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm font-medium">50mm</span>
                <span class="text-xs text-gray-500">Thermal Kecil</span>
              </button>
              <button
                type="button"
                @click="selectedPaperSize = '85mm'"
                class="px-4 py-3 rounded-lg border-2 transition flex flex-col items-center space-y-2"
                :class="selectedPaperSize === '85mm' 
                  ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm font-medium">85mm</span>
                <span class="text-xs text-gray-500">Thermal Standar</span>
              </button>
            </div>
          </div>

          <!-- Template Selection -->
          <div class="mb-4 sm:mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Template</label>
            <select
              v-model="selectedTemplate"
              @change="loadTemplate(selectedTemplate)"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>

          <!-- Receipt Preview -->
          <div
            ref="receiptContent"
            class="bg-white border-2 border-gray-300 rounded-lg p-4 sm:p-6 receipt-print-container"
            :class="selectedPaperSize === '50mm' ? 'receipt-50mm' : 'receipt-85mm'"
          >
            <!-- Receipt Content -->
            <div v-if="receiptData && template" 
                 class="receipt-content"
                 :style="{ fontFamily: getTemplateFontFamily(template.templateType, template.styles), fontSize: getTemplateFontSize(template.templateType, template.styles) }">
              <!-- Header -->
              <div v-if="template?.header?.showName || template?.header?.showAddress" 
                   :class="getTemplateHeaderStyle(template.templateType, template.styles)">
                <h1 v-if="template?.header?.showName" 
                    :class="getTemplateTitleStyle(template.templateType)">
                  {{ props.tenantName || tenantInfo?.name || 'Warungin' }}
                </h1>
                <p v-if="template?.header?.showAddress" 
                   class="text-xs sm:text-sm text-gray-600">
                  {{ props.tenantAddress || tenantInfo?.address || 'Jl. Contoh No. 123' }}
                </p>
                <p v-if="template?.header?.showPhone" 
                   class="text-xs sm:text-sm text-gray-600 mt-1">
                  {{ props.tenantPhone || tenantInfo?.phone || 'Telp: 081234567890' }}
                </p>
              </div>

              <!-- Order Info -->
              <div class="mb-3 sm:mb-4 space-y-1 sm:space-y-2">
                <div v-if="template?.fields?.showOrderNumber" class="flex justify-between text-xs sm:text-sm">
                  <span class="text-gray-600">No. Pesanan:</span>
                  <span class="font-semibold">{{ receiptData.orderNumber }}</span>
                </div>
                <div v-if="template?.fields?.showDate" class="flex justify-between text-xs sm:text-sm">
                  <span class="text-gray-600">Tanggal:</span>
                  <span>{{ formatDateTime(receiptData.date) }}</span>
                </div>
                <div v-if="template?.fields?.showTime" class="flex justify-between text-xs sm:text-sm">
                  <span class="text-gray-600">Waktu:</span>
                  <span>{{ formatTime(receiptData.date) }}</span>
                </div>
                <div v-if="template?.fields?.showCustomer && receiptData.customerName" class="flex justify-between text-xs sm:text-sm">
                  <span class="text-gray-600">Pelanggan:</span>
                  <span>{{ receiptData.customerName }}</span>
                </div>
              </div>

              <!-- Items -->
              <div v-if="template?.fields?.showItems" 
                   class="mb-3 sm:mb-4 border-t border-b py-3 sm:py-4"
                   :class="getTemplateContentStyle(template.templateType)">
                <div class="space-y-2">
                  <div v-for="item in receiptData.items" 
                       :key="item.name" 
                       :class="getTemplateItemStyle(template.templateType) + ' last:border-0'">
                    <div class="flex justify-between items-start mb-1">
                      <div class="flex-1">
                        <div class="font-semibold text-sm">{{ item.name }}</div>
                        <div v-if="item.discount && item.discount > 0" class="text-xs text-red-600 mt-0.5">
                          Diskon: -{{ formatCurrency(item.discount) }}
                        </div>
                      </div>
                      <div class="text-right ml-2">
                        <div class="text-sm font-semibold">{{ formatCurrency(item.subtotal) }}</div>
                        <div class="text-xs text-gray-500">{{ item.quantity }} x {{ formatCurrency(item.price) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Totals -->
              <div class="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div class="border-t border-dashed border-gray-400 pt-2 mt-2">
                  <div v-if="template?.fields?.showSubtotal" class="flex justify-between mb-1">
                    <span class="font-medium">Subtotal:</span>
                    <span class="font-semibold">{{ formatCurrency(receiptData.subtotal) }}</span>
                  </div>
                  <div v-if="template?.fields?.showDiscount && receiptData.discount > 0" class="flex justify-between mb-1 text-red-600">
                    <span class="font-medium">Diskon Total:</span>
                    <span class="font-semibold">-{{ formatCurrency(receiptData.discount) }}</span>
                  </div>
                  <div v-if="template?.fields?.showTax" class="flex justify-between mb-1">
                    <span>Pajak:</span>
                    <span>{{ formatCurrency(0) }}</span>
                  </div>
                </div>
                <div v-if="template?.fields?.showTotal" 
                     :class="getTemplateTotalStyle(template.templateType)">
                  <span>TOTAL:</span>
                  <span>{{ formatCurrency(receiptData.total) }}</span>
                </div>
                <div class="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
                  <div v-if="template?.fields?.showPaymentMethod" class="flex justify-between text-xs sm:text-sm">
                    <span class="font-medium">Pembayaran:</span>
                    <span class="font-semibold">{{ getPaymentMethodLabel(receiptData.paymentMethod) }}</span>
                  </div>
                  <div v-if="template?.fields?.showChange && receiptData.change && receiptData.change > 0" class="flex justify-between text-xs sm:text-sm">
                    <span class="font-medium">Kembalian:</span>
                    <span class="font-semibold text-green-600">{{ formatCurrency(receiptData.change) }}</span>
                  </div>
                  <div v-if="receiptData.servedBy" class="flex justify-between text-xs sm:text-sm mt-2 pt-2 border-t border-dashed border-gray-300">
                    <span class="font-medium">Dilayani oleh:</span>
                    <span class="font-semibold">{{ receiptData.servedBy }}</span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div v-if="template?.footer?.showThankYou || template?.footer?.showContact" 
                   :class="getTemplateFooterStyle(template.templateType)">
                <p v-if="template?.footer?.showThankYou" class="mb-1 sm:mb-2 font-semibold text-sm sm:text-base">Terima Kasih!</p>
                <p v-if="template?.footer?.showContact" class="text-xs sm:text-sm text-gray-600">
                  {{ props.tenantPhone || tenantInfo?.phone || 'Telp: 081234567890' }}
                </p>
              </div>
            </div>

            <div v-else class="text-center py-8 sm:py-12 text-gray-500">
              <p>Memuat data receipt...</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
            <button
              @click="$emit('close')"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
            >
              Tutup
            </button>
            <button
              @click="handlePrint"
              :disabled="!receiptData || !template"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Teleport } from 'vue';
import api from '../api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useNotification } from '../composables/useNotification';
import { 
  getTemplateHeaderStyle, 
  getTemplateTitleStyle, 
  getTemplateContentStyle, 
  getTemplateItemStyle, 
  getTemplateTotalStyle, 
  getTemplateFooterStyle 
} from '../utils/receipt-template-styles';

const { warning } = useNotification();

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  discount?: number;
}

interface ReceiptData {
  orderNumber: string;
  date: string;
  customerName?: string;
  memberName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  change?: number;
  servedBy?: string; // Nama kasir/admin yang melayani
}

interface ReceiptTemplate {
  id: string;
  name: string;
  templateType: string;
  paperSize: string;
  isDefault?: boolean;
  header?: any;
  footer?: any;
  fields?: any;
  styles?: any;
}

interface Props {
  show: boolean;
  orderId?: string;
  receiptData?: ReceiptData | null;
  tenantName?: string;
  tenantAddress?: string;
  tenantPhone?: string;
}

const props = withDefaults(defineProps<Props>(), {
  orderId: undefined,
  receiptData: null,
  tenantName: '',
  tenantAddress: '',
  tenantPhone: '',
});

const emit = defineEmits<{
  close: [];
}>();

const templates = ref<ReceiptTemplate[]>([]);
const selectedTemplate = ref<string>('');
const selectedPaperSize = ref<'50mm' | '85mm'>('85mm');
const template = ref<ReceiptTemplate | null>(null);
const receiptContent = ref<HTMLElement | null>(null);
const loading = ref(false);

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
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

const loadTemplates = async () => {
  try {
    const response = await api.get('/receipts/templates');
    templates.value = response.data;
    if (templates.value.length > 0) {
      const defaultTemplate = templates.value.find(t => t.isDefault) || templates.value[0];
      selectedTemplate.value = defaultTemplate.id;
      await loadTemplate(defaultTemplate.id);
    }
  } catch (error: any) {
    console.error('Error loading templates:', error);
  }
};

const loadTemplate = async (templateId: string) => {
  try {
    const response = await api.get(`/receipts/templates/${templateId}`);
    template.value = response.data;
    
    // Set default fields if not present
    if (template.value) {
      if (!template.value.fields) {
        template.value.fields = {
          showOrderNumber: true,
          showDate: true,
          showItems: true,
          showSubtotal: true,
          showDiscount: true,
          showTotal: true,
          showPaymentMethod: true,
        };
      }
      if (!template.value.header) {
        template.value.header = {
          showName: true,
          showAddress: true,
        };
      }
      if (!template.value.footer) {
        template.value.footer = {
          showThankYou: true,
          showContact: true,
        };
      }
    }
  } catch (error: any) {
    console.error('Error loading template:', error);
    // Use default template config
    template.value = {
      id: 'default',
      name: 'Default Receipt',
      templateType: 'DEFAULT',
      paperSize: 'A4',
      header: {
        showName: true,
        showAddress: true,
      },
      footer: {
        showThankYou: true,
        showContact: true,
      },
      fields: {
        showOrderNumber: true,
        showDate: true,
        showItems: true,
        showSubtotal: true,
        showDiscount: true,
        showTotal: true,
        showPaymentMethod: true,
      },
    };
  }
};

const receiptData = ref<ReceiptData | null>(props.receiptData || null);
const tenantInfo = ref<any>(null);

const loadReceiptData = async () => {
  if (!props.orderId) {
    receiptData.value = props.receiptData;
    return;
  }
  
  loading.value = true;
  try {
    const response = await api.get(`/receipts/generate/${props.orderId}?templateId=${selectedTemplate.value}`);
    if (response.data) {
      receiptData.value = response.data.receiptData;
      template.value = response.data.template;
      if (response.data.order?.tenant) {
        tenantInfo.value = response.data.order.tenant;
      }
    }
  } catch (error: any) {
    console.error('Error loading receipt data:', error);
    receiptData.value = props.receiptData;
  } finally {
    loading.value = false;
  }
};

const handlePrint = () => {
  if (!receiptContent.value) return;
  printBrowser();
};

const printBrowser = async () => {
  if (!receiptContent.value) return;

  const paperSize = selectedPaperSize.value === '50mm' ? 'THERMAL_50' : 'THERMAL_85';
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    await warning('Popup blocker terdeteksi. Silakan izinkan popup untuk mencetak struk.');
    return;
  }

  const printContent = receiptContent.value.innerHTML;
  
  // Responsive print styles based on paper size
  const getPageSize = () => {
    switch (paperSize) {
      case 'THERMAL_50':
        return '50mm';
      case 'THERMAL_85':
        return '85mm';
      default:
        return '85mm';
    }
  };

  const getMaxWidth = () => {
    switch (paperSize) {
      case 'THERMAL_50':
        return '50mm';
      case 'THERMAL_85':
        return '85mm';
      default:
        return '85mm';
    }
  };

  const getFontSize = () => {
    // Use template font size if available, otherwise use paper size default
    if (template.value?.styles?.fontSize) {
      return template.value.styles.fontSize;
    }
    switch (paperSize) {
      case 'THERMAL_50':
        return '9px';
      case 'THERMAL_85':
        return '11px';
      default:
        return '11px';
    }
  };

  const getFontFamily = () => {
    // Use template font family if available
    if (template.value?.styles?.fontFamily) {
      return template.value.styles.fontFamily;
    }
    // Fallback to template type default
    const fontMap: Record<string, string> = {
      DEFAULT: 'Arial, sans-serif',
      MODERN: 'Inter, sans-serif',
      MINIMAL: 'Courier New, monospace',
      DETAILED: 'Arial, sans-serif',
      COMPACT: 'Courier New, monospace',
    };
    return fontMap[template.value?.templateType || 'DEFAULT'] || 'Courier New, monospace';
  };

  const printStyles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      @media print {
        @page {
          size: ${getPageSize()};
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: ${getFontFamily()};
          font-size: ${getFontSize()};
          line-height: 1.4;
        }
        .receipt-print-container {
          max-width: ${getMaxWidth()};
          width: ${getMaxWidth()};
          margin: 0 auto;
          padding: 8px;
        }
        .receipt-content {
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
        * {
          color: #000 !important;
          background: transparent !important;
        }
        .border-b, .border-t {
          border-color: #000 !important;
        }
      }
      @media screen {
        .receipt-print-container {
          max-width: ${getMaxWidth()};
          margin: 0 auto;
        }
      }
    </style>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${receiptData.value?.orderNumber || ''}</title>
        <meta charset="UTF-8">
        ${printStyles}
      </head>
      <body>
        <div class="receipt-print-container">
          ${printContent}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};


watch(() => props.show, (newShow) => {
  if (newShow) {
    loadTemplates();
    if (props.orderId) {
      loadReceiptData();
    } else {
      receiptData.value = props.receiptData;
    }
  }
});

watch(() => props.receiptData, (newData) => {
  if (newData) {
    receiptData.value = newData;
  }
}, { immediate: true });

watch(() => selectedTemplate.value, (newTemplateId) => {
  if (newTemplateId) {
    loadTemplate(newTemplateId);
  }
});

onMounted(() => {
  if (props.show) {
    loadTemplates();
  }
});
</script>

<style scoped>
.receipt-content {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.receipt-print-container {
  width: 100%;
  max-width: 100%;
}

/* Responsive styles for different paper sizes */
.receipt-50mm {
  max-width: 50mm;
  width: 50mm;
  font-size: 9px;
}

.receipt-85mm {
  max-width: 85mm;
  width: 85mm;
  font-size: 11px;
}

.receipt-content {
  font-family: 'Courier New', monospace;
}

.receipt-50mm .receipt-content {
  font-size: 9px;
}

.receipt-85mm .receipt-content {
  font-size: 11px;
}

@media print {
  .receipt-content {
    font-size: inherit;
  }
}
</style>
