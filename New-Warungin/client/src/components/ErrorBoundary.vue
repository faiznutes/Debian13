<template>
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div class="mb-4">
        <svg class="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Oops! Terjadi Kesalahan</h2>
      <p class="text-gray-600 mb-4">
        {{ errorMessage || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.' }}
      </p>
      <div class="space-y-2">
        <button
          @click="handleRetry"
          class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
        >
          Coba Lagi
        </button>
        <button
          @click="handleGoHome"
          class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Kembali ke Beranda
        </button>
        <button
          v-if="showDetails"
          @click="showDetails = false"
          class="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Sembunyikan Detail
        </button>
        <button
          v-else
          @click="showDetails = true"
          class="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Tampilkan Detail Teknis
        </button>
      </div>
      <div v-if="showDetails && error" class="mt-4 p-4 bg-gray-100 rounded text-left text-xs font-mono overflow-auto max-h-48">
        <p class="font-semibold mb-2">Error Details:</p>
        <p class="text-red-600 mb-2">{{ error.message }}</p>
        <p class="text-gray-600 whitespace-pre-wrap">{{ error.stack }}</p>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onMounted } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  fallback?: (error: Error) => void;
  onError?: (error: Error, instance: any, info: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  fallback: undefined,
  onError: undefined,
});

const router = useRouter();
const hasError = ref(false);
const error = ref<Error | null>(null);
const errorMessage = ref<string>('');
const showDetails = ref(false);

onErrorCaptured((err: Error, instance: any, info: string) => {
  console.error('ErrorBoundary caught error:', err, info);
  hasError.value = true;
  error.value = err;
  
  // Try to extract user-friendly message
  if (err.message) {
    if (err.message.includes('Network Error') || err.message.includes('fetch')) {
      errorMessage.value = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    } else if (err.message.includes('timeout')) {
      errorMessage.value = 'Permintaan memakan waktu terlalu lama. Silakan coba lagi.';
    } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      errorMessage.value = 'Sesi Anda telah berakhir. Silakan login kembali.';
    } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
      errorMessage.value = 'Anda tidak memiliki izin untuk mengakses halaman ini.';
    } else if (err.message.includes('404') || err.message.includes('Not Found')) {
      errorMessage.value = 'Halaman yang Anda cari tidak ditemukan.';
    } else if (err.message.includes('500') || err.message.includes('Internal Server')) {
      errorMessage.value = 'Terjadi kesalahan di server. Silakan coba lagi nanti.';
    } else {
      errorMessage.value = err.message;
    }
  }

  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, instance, info);
  }

  // Call fallback if provided
  if (props.fallback) {
    props.fallback(err);
  }

  // Prevent error from propagating
  return false;
});

const handleRetry = () => {
  hasError.value = false;
  error.value = null;
  errorMessage.value = '';
  showDetails.value = false;
  // Force component re-render
  window.location.reload();
};

const handleGoHome = () => {
  hasError.value = false;
  error.value = null;
  errorMessage.value = '';
  router.push('/');
};

onMounted(() => {
  // Also catch global errors
  window.addEventListener('error', (event) => {
    if (!hasError.value) {
      hasError.value = true;
      error.value = event.error || new Error(event.message);
      errorMessage.value = 'Terjadi kesalahan yang tidak terduga.';
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!hasError.value && event.reason) {
      hasError.value = true;
      error.value = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      errorMessage.value = 'Terjadi kesalahan saat memproses permintaan.';
    }
  });
});
</script>

