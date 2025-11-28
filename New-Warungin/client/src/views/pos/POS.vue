<template>
  <div class="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
    <!-- Store Selector (only for Admin/Supervisor) -->
    <div v-if="authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN' || authStore.user?.role === 'SUPERVISOR'" class="px-4 sm:px-6 pt-4 sm:pt-6">
      <StoreSelector @store-changed="handleStoreChange" />
    </div>
    
    <!-- Header Section -->
    <div class="mb-4 sm:mb-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Point of Sale</h2>
        <p class="text-sm sm:text-base text-gray-600">Pilih produk dan lakukan transaksi</p>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full px-4 sm:px-6 pb-4 sm:pb-6">
      <!-- Product Grid -->
      <div class="flex-1 bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 overflow-y-auto">
        <!-- Search Section -->
        <div class="mb-4 sm:mb-6">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari produk..."
              class="block w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition"
            />
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="text-center py-12 text-gray-500">
          <p>Tidak ada produk ditemukan</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="addToCart(product)"
            class="bg-gradient-to-br from-white to-gray-50 border-2 rounded-xl p-3 sm:p-4 cursor-pointer hover:border-primary-500 hover:shadow-xl transition-all active:scale-95 group"
            :class="{ 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-md': isInCart(product.id), 'border-gray-200': !isInCart(product.id) }"
          >
            <div class="text-center">
              <div class="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mx-auto mb-2 sm:mb-3 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition">
                <!-- Priority: Image → Emoji → Default icon -->
                <img v-if="product.image" :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
                <span v-else-if="product.emoji" class="text-3xl sm:text-4xl md:text-5xl">{{ product.emoji }}</span>
                <span v-else class="text-2xl sm:text-3xl">📦</span>
              </div>
              <h3 class="font-semibold text-xs sm:text-sm text-gray-900 mb-1 truncate">{{ product.name }}</h3>
              <p class="text-sm sm:text-base md:text-lg font-bold text-primary-600 mb-1 sm:mb-2">{{ formatCurrency(product.price) }}</p>
              <p class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">Stok: {{ product.stock }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Sidebar -->
      <div class="w-full lg:w-96 bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 flex flex-col">
        <div class="mb-4 sm:mb-6">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Keranjang</h2>
          <p class="text-sm text-gray-600">{{ cart.length }} item</p>
        </div>

        <div class="flex-1 overflow-y-auto mb-4">
          <div v-if="cart.length === 0" class="text-center py-8 text-gray-500">
            <p>Keranjang kosong</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in cart"
              :key="item.id"
              class="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition"
            >
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <!-- Item Icon/Image/Emoji -->
                <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  <!-- Priority: Image → Emoji → Default icon -->
                  <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
                  <span v-else-if="item.emoji" class="text-2xl sm:text-3xl">{{ item.emoji }}</span>
                  <span v-else class="text-xl">📦</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-gray-900 truncate text-sm sm:text-base">{{ item.name }}</h4>
                  <p class="text-xs sm:text-sm text-gray-600">{{ formatCurrency(item.price) }} × {{ item.quantity }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="decreaseQuantity(item.id)"
                  class="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 transition font-semibold text-gray-700"
                >
                  −
                </button>
                <span class="w-10 text-center font-bold text-gray-900">{{ item.quantity }}</span>
                <button
                  @click="increaseQuantity(item.id)"
                  class="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 transition font-semibold text-gray-700"
                >
                  +
                </button>
                <button
                  @click="removeFromCart(item.id)"
                  class="ml-2 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer/Member Info -->
        <div class="mb-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
          <p class="text-xs font-medium text-gray-700 mb-3">Tipe Pelanggan</p>
          <div class="flex gap-2 mb-3">
            <button
              @click="switchCustomerType('customer')"
              :class="[
                'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                customerType === 'customer'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary-300'
              ]"
            >
              Pelanggan
            </button>
            <button
              @click="switchCustomerType('member')"
              :class="[
                'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                customerType === 'member'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary-300'
              ]"
            >
              Member
            </button>
          </div>
          
          <!-- Customer Input -->
          <div v-if="customerType === 'customer'" class="flex gap-2">
            <input
              v-model="customerInput"
              type="text"
              placeholder="Nama pelanggan (opsional)"
              class="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              @blur="handleCustomerInput"
            />
            <button
              @click="clearCustomer"
              v-if="customerInput"
              class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
            >
              ✕
            </button>
          </div>

          <!-- Member Select -->
          <div v-else class="flex gap-2">
            <select
              v-model="selectedMemberId"
              @change="handleMemberSelect"
              class="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="">-- Pilih Member --</option>
              <option
                v-for="member in members"
                :key="member.id"
                :value="member.id"
              >
                {{ member.name }} ({{ member.phone }}){{ member.discountType && member.discountValue ? ` - ${member.discountType === 'PERCENTAGE' ? member.discountValue + '%' : formatCurrency(member.discountValue)}` : '' }}
              </option>
            </select>
            <button
              @click="clearCustomer"
              v-if="selectedMember"
              class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
            >
              ✕
            </button>
          </div>

          <div v-if="selectedMember" class="mt-3 p-2.5 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div class="flex items-center gap-2 text-xs sm:text-sm text-green-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="font-medium">Member: {{ selectedMember.name }}</span>
              <span v-if="selectedMember.discountType && selectedMember.discountValue" class="text-green-700">
                ({{ selectedMember.discountType === 'PERCENTAGE' ? selectedMember.discountValue + '%' : formatCurrency(selectedMember.discountValue) }})
              </span>
            </div>
          </div>
          <div v-else-if="customerType === 'customer' && customerName" class="mt-3 p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div class="flex items-center gap-2 text-xs sm:text-sm text-blue-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="font-medium">Pelanggan: {{ customerName }}</span>
            </div>
          </div>
        </div>

        <!-- Send to Kitchen -->
        <div class="mb-4">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              v-model="sendToKitchen"
              type="checkbox"
              class="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span class="text-sm text-gray-700">Kirim ke dapur</span>
          </label>
        </div>

        <!-- Total -->
        <div class="mb-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200">
          <div class="flex justify-between items-center mb-2 pb-2 border-b border-primary-200">
            <span class="text-sm text-gray-700 font-medium">Subtotal:</span>
            <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div v-if="estimatedDiscount > 0" class="flex justify-between items-center mb-2 pb-2 border-b border-primary-200">
            <span class="text-sm text-green-700 font-medium">Diskon:</span>
            <span class="text-sm font-semibold text-green-700">-{{ formatCurrency(estimatedDiscount) }}</span>
          </div>
          <div class="flex justify-between items-center pt-2">
            <span class="text-base sm:text-lg font-bold text-gray-900">Total:</span>
            <span class="text-lg sm:text-xl font-bold text-primary-600">{{ formatCurrency(total) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            @click="showPaymentModal = true"
            :disabled="cart.length === 0 || processing"
            class="w-full px-4 sm:px-6 py-3 text-sm sm:text-base bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
          >
            <svg v-if="!processing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span v-if="processing" class="flex items-center gap-2">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Memproses...
            </span>
            <span v-else>Bayar Sekarang</span>
          </button>
          <button
            @click="clearCart"
            :disabled="cart.length === 0"
            class="w-full px-4 sm:px-6 py-2.5 text-sm sm:text-base bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Hapus Semua
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <PaymentModal
      :show="showPaymentModal"
      :total="total"
      :discount="estimatedDiscount"
      :processing="processing"
      @close="showPaymentModal = false"
      @confirm="handlePaymentConfirm"
    />

    <!-- Receipt Printer -->
    <ReceiptPrinter
      :show="showReceiptModal"
      :order-id="lastOrderId"
      :receipt-data="lastOrderReceipt"
      @close="showReceiptModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import { useSocket } from '../../composables/useSocket';
import { useNotification } from '../../composables/useNotification';
import PaymentModal from '../../components/PaymentModal.vue';
import ReceiptPrinter from '../../components/ReceiptPrinter.vue';
import StoreSelector from '../../components/StoreSelector.vue';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  emoji?: string;
}

const authStore = useAuthStore();
const { socket } = useSocket();
const { error: showError, warning: showWarning, confirm: showConfirm } = useNotification();
const products = ref<any[]>([]);
const cart = ref<CartItem[]>([]);
const loading = ref(false);
const processing = ref(false);
const searchQuery = ref('');
const customerType = ref<'customer' | 'member'>('customer');
const customerInput = ref('');
const customerName = ref('');
const selectedMember = ref<any>(null);
const selectedMemberId = ref<string>('');
const members = ref<any[]>([]);
const sendToKitchen = ref(false);
const showPaymentModal = ref(false);
const showReceiptModal = ref(false);
const selectedPaymentMethod = ref<string>('CASH');
const lastOrderReceipt = ref<any>(null);
const lastOrderId = ref<string | undefined>(undefined);
const estimatedDiscount = ref(0);

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value.filter(p => p.isActive && p.stock > 0);
  const query = searchQuery.value.toLowerCase();
  return products.value.filter(
    p => p.isActive && p.stock > 0 && (p.name.toLowerCase().includes(query) || p.category?.toLowerCase().includes(query))
  );
});

const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const total = computed(() => {
  return Math.max(0, subtotal.value - estimatedDiscount.value);
});

const isInCart = (productId: string) => {
  return cart.value.some(item => item.id === productId);
};

const addToCart = async (product: any) => {
  // Refresh product stock dari database sebelum add to cart
  try {
    const response = await api.get(`/products/${product.id}`);
    const updatedProduct = response.data;
    
    if (updatedProduct.stock <= 0) {
      showError('Stok produk habis', 'Stok Tidak Tersedia');
      // Update local product data
      const productIndex = products.value.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        products.value[productIndex].stock = updatedProduct.stock;
      }
      return;
    }

    const existingItem = cart.value.find(item => item.id === product.id);
    if (existingItem) {
      // Check stock dari database
      if (existingItem.quantity >= updatedProduct.stock) {
        await showWarning('Stok tidak mencukupi');
        // Update local product data
        const productIndex = products.value.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          products.value[productIndex].stock = updatedProduct.stock;
        }
        return;
      }
      existingItem.quantity++;
    } else {
      cart.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        emoji: product.emoji,
      });
    }
    
    // Update local product stock setelah add to cart
    const productIndex = products.value.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      products.value[productIndex].stock = updatedProduct.stock;
    }
  } catch (error: any) {
    console.error('Error checking product stock:', error);
    // Fallback to local check if API fails
    if (product.stock <= 0) {
      await showWarning('Stok produk habis');
      return;
    }
    const existingItem = cart.value.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        await showWarning('Stok tidak mencukupi');
        return;
      }
      existingItem.quantity++;
    } else {
      cart.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        emoji: product.emoji,
      });
    }
  }
};

const increaseQuantity = async (productId: string) => {
  const item = cart.value.find(item => item.id === productId);
  if (item) {
    // Check stock dari database
    try {
      const response = await api.get(`/products/${productId}`);
      const updatedProduct = response.data;
      
      if (item.quantity >= updatedProduct.stock) {
        showError('Stok tidak mencukupi', 'Stok Tidak Tersedia');
        // Update local product data
        const productIndex = products.value.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          products.value[productIndex].stock = updatedProduct.stock;
        }
        return;
      }
      item.quantity++;
      
      // Update local product stock
      const productIndex = products.value.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        products.value[productIndex].stock = updatedProduct.stock;
      }
    } catch (error: any) {
      console.error('Error checking product stock:', error);
      // Fallback to local check
      const product = products.value.find(p => p.id === productId);
      if (product && item.quantity >= product.stock) {
        showError('Stok tidak mencukupi', 'Stok Tidak Tersedia');
        return;
      }
      item.quantity++;
    }
  }
};

const decreaseQuantity = (productId: string) => {
  const item = cart.value.find(item => item.id === productId);
  if (item) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      removeFromCart(productId);
    }
  }
};

const removeFromCart = (productId: string) => {
  cart.value = cart.value.filter(item => item.id !== productId);
};

const clearCart = async () => {
  const confirmed = await showConfirm('Hapus semua item dari keranjang?');
  if (confirmed) {
    clearCartSilent();
  }
};

const clearCartSilent = () => {
  cart.value = [];
  customerInput.value = '';
  customerName.value = '';
  selectedMember.value = null;
  selectedMemberId.value = '';
  estimatedDiscount.value = 0;
  customerType.value = 'customer';
  sendToKitchen.value = false;
};

const handleCustomerInput = async () => {
  if (!customerInput.value.trim()) {
    customerName.value = '';
    return;
  }
  // Set as regular customer name
  customerName.value = customerInput.value.trim();
  selectedMember.value = null;
  estimatedDiscount.value = 0;
};

const handleMemberSelect = () => {
  if (!selectedMemberId.value) {
    selectedMember.value = null;
    estimatedDiscount.value = 0;
    return;
  }

  const member = members.value.find(m => m.id === selectedMemberId.value);
  if (member) {
    selectedMember.value = member;
    customerName.value = ''; // Clear customer name when member is selected
    // Calculate estimated member discount
    if (member.discountType === 'PERCENTAGE') {
      estimatedDiscount.value = (subtotal.value * Number(member.discountValue)) / 100;
    } else {
      estimatedDiscount.value = Number(member.discountValue);
    }
  } else {
    selectedMember.value = null;
    estimatedDiscount.value = 0;
  }
};

const switchCustomerType = (type: 'customer' | 'member') => {
  if (customerType.value === type) return;
  
  // Clear previous data when switching
  customerInput.value = '';
  customerName.value = '';
  selectedMember.value = null;
  selectedMemberId.value = '';
  estimatedDiscount.value = 0;
  customerType.value = type;
};

const clearCustomer = () => {
  customerInput.value = '';
  customerName.value = '';
  selectedMember.value = null;
  selectedMemberId.value = '';
  estimatedDiscount.value = 0;
};

const handleStoreChange = (_storeId: string | null) => {
  // Reload products when store changes
  loadProducts();
  loadMembers();
};

const loadProducts = async () => {
  // For Super Admin, wait for tenantId to be available
  if (authStore.isSuperAdmin && !authStore.selectedTenantId) {
    const selectedTenantId = localStorage.getItem('selectedTenantId');
    if (!selectedTenantId) {
      console.log('Waiting for tenant selection...');
      return;
    }
    // Ensure authStore has the selected tenant
    authStore.setSelectedTenant(selectedTenantId);
  }

  loading.value = true;
  try {
    const response = await api.get('/products', {
      params: { isActive: true },
    });
    products.value = response.data.data || response.data;
  } catch (err: any) {
    console.error('Error loading products:', err);
    const errorMessage = err.response?.data?.message || 'Gagal memuat produk';
    showError(errorMessage, 'Terjadi Kesalahan');
  } finally {
    loading.value = false;
  }
};

const loadMembers = async () => {
  try {
    const response = await api.get('/members', {
      params: { limit: 100, isActive: 'true' },
    });
    const result = response.data.data || response.data;
    members.value = Array.isArray(result) ? result : [];
  } catch (error: any) {
    console.error('Error loading members:', error);
    members.value = [];
  }
};

const handlePaymentConfirm = async (paymentData: { paymentMethod: string; cashAmount?: number; qrCode?: string }) => {
  selectedPaymentMethod.value = paymentData.paymentMethod;
  showPaymentModal.value = false;
  await processPayment(paymentData);
};

const processPayment = async (paymentData: { paymentMethod: string; cashAmount?: number; qrCode?: string }) => {
  if (cart.value.length === 0) return;

  processing.value = true;
  try {
    // Create order first
    const orderData: any = {
      items: cart.value.map(item => ({
        productId: item.id,
        quantity: Number(item.quantity),
        price: Number(item.price),
        // discount field tidak perlu karena tidak ada di OrderItem model
      })),
      sendToKitchen: Boolean(sendToKitchen.value),
      discount: 0, // Add order-level discount field
    };

    // Add outletId if selected
    if (authStore.selectedStoreId) {
      orderData.outletId = authStore.selectedStoreId;
    }

    // Add customer/member info only if provided
    if (customerType.value === 'customer' && customerName.value?.trim()) {
      orderData.temporaryCustomerName = customerName.value.trim();
    }
    
    if (customerType.value === 'member' && selectedMember.value?.id) {
      orderData.memberId = selectedMember.value.id;
    }

    console.log('Creating order with data:', orderData);
    const orderResponse = await api.post('/orders', orderData);
    const order = orderResponse.data;
    
    // Update estimated discount from order response
    const orderDiscount = parseFloat(order.discount || 0);
    estimatedDiscount.value = orderDiscount;

    // Process payment
    const finalTotal = parseFloat(order.total);
    
    // Create transaction for all payment methods (CASH, QRIS, BANK_TRANSFER, SHOPEEPAY, DANA)
    const transactionData: any = {
      orderId: order.id,
      amount: finalTotal,
      paymentMethod: paymentData.paymentMethod,
      status: 'COMPLETED',
      servedBy: authStore.user?.name || 'Unknown', // Nama kasir/admin yang melayani
    };
    
    if (paymentData.paymentMethod === 'QRIS' && paymentData.qrCode) {
      transactionData.qrCode = paymentData.qrCode;
    }
    
    const transactionResponse = await api.post('/transactions', transactionData);
    const transaction = transactionResponse.data;

    // Prepare receipt data
    const receiptData = {
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customerName: customerName.value || null,
      memberName: selectedMember.value?.name || null,
      items: cart.value.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      subtotal: parseFloat(order.subtotal),
      discount: orderDiscount,
      total: finalTotal,
      paymentMethod: paymentData.paymentMethod,
      cashAmount: paymentData.cashAmount,
      change: paymentData.paymentMethod === 'CASH' && paymentData.cashAmount 
        ? paymentData.cashAmount - finalTotal 
        : 0,
      servedBy: transaction?.servedBy || authStore.user?.name || 'Unknown', // Nama kasir/admin yang melayani
    };

    lastOrderId.value = order.id;
    lastOrderReceipt.value = receiptData;

    // Emit socket event for kitchen if needed
    if (sendToKitchen.value && socket?.connected) {
      socket.emit('order:new', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        items: cart.value,
      });
    }

    // Show receipt printer
    showReceiptModal.value = true;
    
    // Auto clear cart tanpa confirm
    clearCartSilent();
    
    // Refresh products untuk update stock
    await loadProducts();
  } catch (error: any) {
    console.error('Error processing payment:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Gagal memproses pembayaran';
    console.error('Error details:', error.response?.data);
    showError(errorMessage, 'Gagal Memproses Pembayaran');
  } finally {
    processing.value = false;
  }
};

// Watch for tenantId changes (for Super Admin using Tenant Support)
watch(
  () => {
    // Get tenantId from multiple sources
    const fromStore = authStore.selectedTenantId;
    const fromStorage = localStorage.getItem('selectedTenantId');
    return fromStore || fromStorage;
  },
  (newTenantId, oldTenantId) => {
    // Only reload if tenantId actually changed and is not empty
    if (authStore.isSuperAdmin && newTenantId && newTenantId !== oldTenantId) {
      // Ensure authStore has the selected tenant
      if (!authStore.selectedTenantId) {
        authStore.setSelectedTenant(newTenantId);
      }
      
      // Reload products when tenant changes
      loadProducts();
      loadMembers();
      
      // Join tenant room for socket updates
      if (socket?.connected) {
        socket.emit('join-tenant', newTenantId);
      }
    }
  },
  { immediate: false }
);

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // For Super Admin, check if tenantId is available
  if (authStore.isSuperAdmin) {
    const selectedTenantId = localStorage.getItem('selectedTenantId');
    if (selectedTenantId) {
      authStore.setSelectedTenant(selectedTenantId);
      // Small delay to ensure tenantId is set in interceptor
      setTimeout(() => {
        loadProducts();
        loadMembers();
      }, 100);
    } else {
      // Wait a bit and try again (in case TenantPOS is setting it)
      setTimeout(() => {
        const tenantId = localStorage.getItem('selectedTenantId');
        if (tenantId) {
          authStore.setSelectedTenant(tenantId);
          loadProducts();
          loadMembers();
        }
      }, 500);
    }
  } else {
    // For non-Super Admin, load immediately
    loadProducts();
    loadMembers();
  }
  
  // Join tenant room for socket updates
  // For SUPER_ADMIN, use selectedTenantId; for others, use user.tenantId
  const tenantIdForSocket = authStore.isSuperAdmin 
    ? authStore.selectedTenantId || localStorage.getItem('selectedTenantId') || authStore.user?.tenantId
    : authStore.user?.tenantId;
  if (socket && tenantIdForSocket) {
    socket.emit('join-tenant', tenantIdForSocket);
  }
  
  // Listen for stock updates via socket
  if (socket) {
    socket.on('product:stock-update', (data: { productId: string; stock: number }) => {
      const productIndex = products.value.findIndex(p => p.id === data.productId);
      if (productIndex !== -1) {
        products.value[productIndex].stock = data.stock;
      }
    });
    
    socket.on('order:created', (data: any) => {
      // Only update stock for affected products, don't reload all products
      if (data.orderId && data.items) {
        // Update stock for products in the order
        data.items.forEach((item: any) => {
          const productIndex = products.value.findIndex(p => p.id === item.id || p.id === item.productId);
          if (productIndex !== -1 && item.stock !== undefined) {
            products.value[productIndex].stock = item.stock;
          }
        });
      }
      // Don't reload all products to avoid auto-refresh
    });
  }
});
</script>

