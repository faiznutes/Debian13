<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click.self="close"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Pilih Metode Pembayaran</h3>
          <button
            @click="close"
            class="text-gray-400 hover:text-gray-600 transition"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Total Pembayaran:</span>
            <span class="text-2xl font-bold text-orange-600">{{ formatCurrency(total) }}</span>
          </div>
          <div v-if="discount > 0" class="flex justify-between items-center text-sm text-green-600">
            <span>Diskon:</span>
            <span class="font-semibold">-{{ formatCurrency(discount) }}</span>
          </div>
        </div>

        <!-- Payment Methods Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Metode Pembayaran
          </label>
          <select
            v-model="selectedPayment"
            @change="onPaymentMethodChange"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold bg-white"
          >
            <option value="" disabled>Pilih metode pembayaran</option>
            <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
              {{ method.icon }} {{ method.label }}
            </option>
          </select>
        </div>

        <!-- Cash Payment Input -->
        <div v-if="selectedPayment === 'CASH'" class="mb-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Uang yang Dibayar
            </label>
            <input
              v-model.number="cashAmount"
              type="number"
              min="0"
              step="1000"
              placeholder="Masukkan jumlah uang"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold"
              @input="calculateChange"
            />
          </div>
          <div v-if="change >= 0" class="p-4 bg-green-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-gray-700 font-medium">Kembalian:</span>
              <span class="text-2xl font-bold text-green-600">{{ formatCurrency(change) }}</span>
            </div>
          </div>
          <div v-else-if="cashAmount > 0" class="p-4 bg-red-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-red-700 font-medium">Kurang:</span>
              <span class="text-xl font-bold text-red-600">{{ formatCurrency(Math.abs(change)) }}</span>
            </div>
          </div>
        </div>

        <!-- QRIS Payment Input -->
        <div v-if="selectedPayment === 'QRIS'" class="mb-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              QR Code (Opsional)
            </label>
            <input
              v-model="qrCode"
              type="text"
              placeholder="Masukkan atau scan QR Code"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div class="p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
              💡 Scan QR Code menggunakan aplikasi e-wallet (DANA, ShopeePay, OVO, dll)
            </p>
          </div>
        </div>

        <!-- Info untuk metode pembayaran lainnya -->
        <div v-if="selectedPayment && selectedPayment !== 'CASH' && selectedPayment !== 'QRIS'" class="mb-6">
          <div class="p-4 bg-green-50 rounded-lg border border-green-200">
            <p class="text-sm text-green-800 font-medium">
              ✅ Metode pembayaran <strong>{{ getPaymentMethodLabel(selectedPayment) }}</strong> dipilih.
            </p>
            <p class="text-xs text-green-700 mt-1">
              Klik "Bayar" untuk menyelesaikan transaksi.
            </p>
          </div>
        </div>

        <div class="flex space-x-3">
          <button
            @click="close"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Batal
          </button>
          <button
            @click="confirmPayment"
            :disabled="!canConfirm || processing"
            class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {{ processing ? 'Memproses...' : 'Bayar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { formatCurrency } from '../utils/formatters';

interface Props {
  show: boolean;
  total: number;
  discount?: number;
  processing?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'confirm', data: { paymentMethod: string; cashAmount?: number; qrCode?: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
  discount: 0,
  processing: false,
});

const emit = defineEmits<Emits>();

const selectedPayment = ref<string>('');
const cashAmount = ref<number>(0);
const qrCode = ref<string>('');

const paymentMethods = [
  {
    value: 'CASH',
    label: 'Cash',
    icon: '💵',
    description: 'Pembayaran tunai langsung',
  },
  {
    value: 'QRIS',
    label: 'QRIS',
    icon: '📲',
    description: 'Scan QR Code untuk pembayaran',
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Bank',
    icon: '🏦',
    description: 'Transfer Bank',
  },
  {
    value: 'SHOPEEPAY',
    label: 'ShopeePay',
    icon: '🛒',
    description: 'Pembayaran via ShopeePay',
  },
  {
    value: 'DANA',
    label: 'Dana',
    icon: '💙',
    description: 'Pembayaran via DANA',
  },
];

const finalTotal = computed(() => {
  return props.total - props.discount;
});

const change = computed(() => {
  if (selectedPayment.value !== 'CASH' || !cashAmount.value) return 0;
  return cashAmount.value - finalTotal.value;
});

const canConfirm = computed(() => {
  if (!selectedPayment.value) return false;
  if (selectedPayment.value === 'CASH') {
    return cashAmount.value >= finalTotal.value;
  }
  // Untuk metode pembayaran lainnya (QRIS, BANK_TRANSFER, SHOPEEPAY, DANA), langsung bisa konfirmasi
  return true;
});

const calculateChange = () => {
  // Auto-calculate change
};

const getPaymentMethodLabel = (method: string) => {
  const methodObj = paymentMethods.find(m => m.value === method);
  return methodObj ? methodObj.label : method;
};

const close = () => {
  selectedPayment.value = '';
  cashAmount.value = 0;
  qrCode.value = '';
  emit('close');
};

const onPaymentMethodChange = () => {
  if (selectedPayment.value === 'CASH') {
    // Auto-set cash amount to total if empty
    if (!cashAmount.value || cashAmount.value < finalTotal.value) {
      cashAmount.value = Math.ceil(finalTotal.value / 1000) * 1000; // Round up to nearest 1000
    }
  }
};

const confirmPayment = () => {
  if (!canConfirm.value) return;
  
  const paymentData: { paymentMethod: string; cashAmount?: number; qrCode?: string } = {
    paymentMethod: selectedPayment.value,
  };
  
  if (selectedPayment.value === 'CASH') {
    paymentData.cashAmount = cashAmount.value;
  } else if (selectedPayment.value === 'QRIS') {
    paymentData.qrCode = qrCode.value || undefined;
  }
  // Untuk BANK_TRANSFER, SHOPEEPAY, DANA tidak perlu data tambahan
  
  emit('confirm', paymentData);
};

// Watch for total changes and auto-update cash amount
watch(() => props.total, (newTotal) => {
  if (selectedPayment.value === 'CASH' && cashAmount.value < finalTotal.value) {
    cashAmount.value = Math.ceil(finalTotal.value / 1000) * 1000;
  }
});

// Reset when modal opens
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    selectedPayment.value = ''; // Reset to empty, user must select
    cashAmount.value = 0;
    qrCode.value = '';
  }
});
</script>
