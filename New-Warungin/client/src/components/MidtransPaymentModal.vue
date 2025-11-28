<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click.self="close"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Pembayaran {{ itemName }}</h3>
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
            <span class="text-2xl font-bold text-primary-600">{{ formatCurrency(amount) }}</span>
          </div>
        </div>

        <!-- Midtrans Snap Embed Container -->
        <div v-if="snapToken" id="snap-container" class="mb-4 min-h-[500px]"></div>
        <div v-else-if="loading" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div class="text-gray-600 font-medium">Memuat halaman pembayaran...</div>
          </div>
        </div>
        <div v-else-if="error" class="p-4 bg-red-50 rounded-lg mb-4">
          <p class="text-red-700">{{ error }}</p>
        </div>

        <div class="flex space-x-3 mt-4">
          <button
            @click="close"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { formatCurrency } from '../utils/formatters';
import api from '../api';

interface Props {
  show: boolean;
  itemName: string;
  amount: number;
  itemId: string;
  itemType: 'addon' | 'subscription';
}

interface Emits {
  (e: 'close'): void;
  (e: 'success'): void;
  (e: 'error', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const snapToken = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
let snapInstance: any = null;

const loadSnapScript = (clientKey: string, isProduction: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (window.snap) {
      console.log('Snap.js already loaded');
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src*="midtrans.com/snap/snap.js"]`);
    if (existingScript) {
      console.log('Snap.js script tag already exists, waiting for it to load...');
      // Wait for window.snap to be available
      let attempts = 0;
      const checkInterval = setInterval(() => {
        if (window.snap) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= 50) {
          clearInterval(checkInterval);
          reject(new Error('Snap.js tidak tersedia setelah menunggu'));
        }
        attempts++;
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = isProduction 
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    script.onload = () => {
      console.log('Snap.js script loaded from URL');
      // Wait a bit for window.snap to be available
      let attempts = 0;
      const checkInterval = setInterval(() => {
        if (window.snap) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= 50) {
          clearInterval(checkInterval);
          reject(new Error('window.snap tidak tersedia setelah script loaded'));
        }
        attempts++;
      }, 100);
    };
    script.onerror = () => {
      console.error('Failed to load Snap.js script');
      reject(new Error('Gagal memuat Midtrans Snap.js'));
    };
    document.head.appendChild(script);
    console.log('Snap.js script tag added to head');
  });
};

const createPayment = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.post('/payment/addon', {
      itemName: props.itemName,
      amount: props.amount,
      itemId: props.itemId,
      itemType: props.itemType,
    });

    if (response.data.success && response.data.transactionId) {
      snapToken.value = response.data.transactionId;
      const clientKey = response.data.clientKey;
      const isProduction = response.data.isProduction || false;
      const orderId = response.data.orderId;
      
      console.log('Payment created:', {
        hasToken: !!snapToken.value,
        clientKey: clientKey ? `${clientKey.substring(0, 10)}...` : 'missing',
        isProduction,
        orderId,
      });
      
      // Load Snap.js script
      try {
        await loadSnapScript(clientKey, isProduction);
        console.log('Snap.js script loaded');
      } catch (err: any) {
        console.error('Failed to load Snap.js:', err);
        error.value = err.message || 'Gagal memuat Midtrans Snap.js';
        emit('error', error.value);
        loading.value = false;
        return;
      }
      
      // Wait for Vue to render the container
      await nextTick();
      
      // Wait a bit more for Vue to fully render
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Retry to find container (Vue might need more time to render)
      let container = document.getElementById('snap-container');
      let retries = 0;
      while (!container && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        container = document.getElementById('snap-container');
        retries++;
      }
      
      if (!container) {
        console.error('Snap container not found in DOM after retries');
        error.value = 'Container pembayaran tidak ditemukan';
        emit('error', error.value);
        loading.value = false;
        return;
      }
      
      // Wait a bit more for script to fully initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Embed Snap.js
      if (window.snap && snapToken.value) {
        console.log('Embedding Snap.js with token:', snapToken.value.substring(0, 20) + '...');
        
        try {
          snapInstance = window.snap.embed(snapToken.value, {
            embedId: 'snap-container',
            onSuccess: (result: any) => {
              console.log('Payment success:', result);
              // Wait a bit for webhook to process, then check status
              setTimeout(async () => {
                if (orderId) {
                  // Double check payment status
                  try {
                    const statusResponse = await api.get(`/payment/status/${orderId}`);
                    if (statusResponse.data.status === 'settlement') {
                      emit('success');
                      close();
                    } else {
                      // Still pending, start polling
                      checkPaymentStatus(orderId);
                    }
                  } catch (err) {
                    // If status check fails, assume success (webhook will handle it)
                    emit('success');
                    close();
                  }
                } else {
                  emit('success');
                  close();
                }
              }, 2000);
            },
            onPending: (result: any) => {
              console.log('Payment pending:', result);
              // Use orderId from backend or from result
              const pendingOrderId = result.order_id || orderId;
              if (pendingOrderId) {
                checkPaymentStatus(pendingOrderId);
              }
            },
            onError: (result: any) => {
              console.error('Payment error:', result);
              error.value = result.status_message || 'Pembayaran gagal';
              emit('error', error.value);
            },
            onClose: () => {
              console.log('Payment modal closed');
              // Don't close our modal, let user decide
            },
          });
          console.log('Snap.js embedded successfully');
        } catch (embedError: any) {
          console.error('Failed to embed Snap.js:', embedError);
          error.value = embedError.message || 'Gagal memuat halaman pembayaran';
          emit('error', error.value);
        }
      } else {
        console.error('Snap.js not available:', {
          hasWindowSnap: !!window.snap,
          hasToken: !!snapToken.value,
        });
        error.value = 'Gagal memuat halaman pembayaran. Snap.js tidak tersedia.';
        emit('error', error.value);
      }
    } else {
      error.value = response.data.message || 'Gagal membuat pembayaran';
      emit('error', error.value);
    }
  } catch (err: any) {
    console.error('Error creating payment:', err);
    error.value = err.response?.data?.message || 'Gagal membuat pembayaran';
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
};

let paymentStatusPoll: any = null;

const checkPaymentStatus = async (orderId: string) => {
  // Poll payment status
  const maxAttempts = 30; // 30 attempts (60 seconds total)
  let attempts = 0;
  
  // Clear any existing poll
  if (paymentStatusPoll) {
    clearInterval(paymentStatusPoll);
  }
  
  paymentStatusPoll = setInterval(async () => {
    attempts++;
    
    try {
      const response = await api.get(`/payment/status/${orderId}`);
      
      if (response.data.status === 'settlement') {
        clearInterval(paymentStatusPoll);
        paymentStatusPoll = null;
        emit('success');
        close();
      } else if (response.data.status === 'cancel' || response.data.status === 'expire') {
        clearInterval(paymentStatusPoll);
        paymentStatusPoll = null;
        error.value = 'Pembayaran dibatalkan atau kedaluwarsa';
        emit('error', error.value);
      } else if (attempts >= maxAttempts) {
        clearInterval(paymentStatusPoll);
        paymentStatusPoll = null;
        error.value = 'Waktu pembayaran habis';
        emit('error', error.value);
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      if (attempts >= maxAttempts) {
        clearInterval(paymentStatusPoll);
        paymentStatusPoll = null;
      }
    }
  }, 2000); // Check every 2 seconds
};

const close = () => {
  // Clear payment status poll
  if (paymentStatusPoll) {
    clearInterval(paymentStatusPoll);
    paymentStatusPoll = null;
  }
  
  if (snapInstance) {
    // Clean up Snap instance if needed
    snapInstance = null;
  }
  
  // Clear snap container
  const container = document.getElementById('snap-container');
  if (container) {
    container.innerHTML = '';
  }
  
  snapToken.value = null;
  error.value = null;
  emit('close');
};

// Watch for show prop changes
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    createPayment();
  } else {
    close();
  }
});

// Cleanup on unmount
onUnmounted(() => {
  close();
});

// Declare window.snap type
declare global {
  interface Window {
    snap: any;
  }
}
</script>

