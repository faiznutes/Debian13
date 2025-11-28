<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Tonton Iklan untuk Mendapat Point</h1>
        <p class="text-gray-600">Tonton iklan hingga selesai untuk mendapatkan point</p>
      </div>

      <!-- Loading State (Initializing) -->
      <div v-if="initializing" class="text-center py-12">
        <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600">Memuat iklan...</p>
      </div>

      <!-- Ad Container -->
      <div v-else-if="!adShown && !completed" class="mb-6">
        <div class="bg-gray-50 rounded-lg p-6 min-h-[300px] flex flex-col items-center justify-center">
          <div v-if="!isAdAvailable" class="text-center">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 mb-4" v-if="!ironSourceError">Iklan sedang dimuat...</p>
            <p class="text-red-600 mb-4 font-semibold" v-else>{{ ironSourceError }}</p>
            <div v-if="ironSourceError" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p class="font-semibold mb-1">Tips:</p>
              <ul class="list-disc list-inside text-left space-y-1">
                <li v-if="trackingPreventionBlocked">Nonaktifkan Tracking Prevention di pengaturan browser (Edge: Settings → Privacy → Tracking Prevention → Balanced/Off)</li>
                <li>Nonaktifkan ad blocker untuk halaman ini</li>
                <li>Refresh halaman setelah mengubah pengaturan</li>
                <li>Pastikan koneksi internet stabil</li>
              </ul>
            </div>
            <button
              @click="checkAdAvailability"
              :disabled="ironSourceLoading"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ ironSourceLoading ? 'Memeriksa...' : 'Cek Ketersediaan Iklan' }}
            </button>
          </div>

          <div v-else class="text-center">
            <svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-700 font-semibold mb-4">Iklan siap ditampilkan!</p>
            <button
              @click="showAd"
              :disabled="loading"
              class="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ loading ? 'Memuat...' : 'Tonton Iklan' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Ad Playing Indicator -->
      <div v-if="adShown && !completed" class="mb-6">
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
          <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-blue-800 font-semibold">Iklan sedang diputar...</p>
          <p class="text-blue-600 text-sm mt-2">Tunggu hingga iklan selesai untuk mendapatkan point</p>
        </div>
      </div>

      <!-- Status Message -->
      <div v-if="statusMessage" class="mb-6">
        <div
          :class="[
            'rounded-lg p-4 text-center',
            statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          ]"
        >
          <p class="font-semibold">{{ statusMessage.text }}</p>
        </div>
      </div>

      <!-- Loading State (Processing Points) -->
      <div v-if="loading && !adShown" class="text-center">
        <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600">Memproses point Anda...</p>
      </div>

      <!-- Back Button -->
      <div v-if="completed" class="text-center">
        <button
          @click="goBack"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
        >
          Kembali ke Halaman Reward
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../api';
import { useIronSource } from '../../composables/useIronSource';

const route = useRoute();
const router = useRouter();

const { initialize, showAd: showIronSourceAd, isAdAvailable, isLoading: ironSourceLoading, error: ironSourceError, forceCheckAvailability, trackingPreventionBlocked } = useIronSource();

const initializing = ref(true);
const adShown = ref(false);
const loading = ref(false);
const completed = ref(false);
const statusMessage = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

/**
 * Check ad availability
 */
const checkAdAvailability = async () => {
  try {
    loading.value = true;
    statusMessage.value = {
      type: 'info',
      text: 'Memeriksa ketersediaan iklan...',
    };
    
    // Initialize if not already initialized
    if (!ironSourceLoading.value) {
      await initialize();
    }
    
    // Force check availability
    const available = await forceCheckAvailability();
    
    if (available) {
      statusMessage.value = {
        type: 'success',
        text: 'Iklan tersedia! Klik tombol "Tonton Iklan" untuk menonton.',
      };
    } else {
      statusMessage.value = {
        type: 'error',
        text: 'Iklan belum tersedia saat ini. Silakan coba lagi dalam beberapa saat atau pastikan ad blocker dinonaktifkan.',
      };
    }
  } catch (error: any) {
    console.error('Error checking ad availability:', error);
    statusMessage.value = {
      type: 'error',
      text: error.message || 'Gagal memuat iklan. Pastikan ad blocker dinonaktifkan dan coba refresh halaman.',
    };
  } finally {
    loading.value = false;
  }
};

/**
 * Show IronSource ad
 */
const showAd = async () => {
  try {
    loading.value = true;
    adShown.value = true;
    statusMessage.value = {
      type: 'info',
      text: 'Iklan sedang dimuat...',
    };

    // Show ad
    const result = await showIronSourceAd();

    if (result.success && result.rewarded) {
      // Ad completed and user was rewarded
      await awardPoints();
    } else if (result.success) {
      // Ad closed but not rewarded (user skipped)
      statusMessage.value = {
        type: 'error',
        text: 'Iklan ditutup sebelum selesai. Point tidak diberikan.',
      };
      adShown.value = false;
      loading.value = false;
    }
  } catch (error: any) {
    console.error('Error showing ad:', error);
    statusMessage.value = {
      type: 'error',
      text: error.message || 'Gagal menampilkan iklan. Silakan coba lagi.',
    };
    adShown.value = false;
    loading.value = false;
  }
};

/**
 * Award points after ad completion
 */
const awardPoints = async () => {
  loading.value = true;
  statusMessage.value = {
    type: 'info',
    text: 'Iklan selesai! Memproses point Anda...',
  };

  try {
    const response = await api.post('/rewards/watch-ad', {
      adMetadata: {
        timestamp: new Date().toISOString(),
        sessionId: route.query.session || '',
        adProvider: 'ironsource',
        appKey: '244d3c355',
        placementName: '0aoy03hfxtsvzcix',
      },
    });

    if (response.data.success) {
      statusMessage.value = {
        type: 'success',
        text: `Selamat! Anda mendapat ${response.data.pointsEarned} point. Total point Anda sekarang: ${response.data.totalPoints}`,
      };
      completed.value = true;
    } else {
      statusMessage.value = {
        type: 'error',
        text: response.data.message || 'Gagal mendapatkan point',
      };
    }
  } catch (error: any) {
    console.error('Error awarding points:', error);
    statusMessage.value = {
      type: 'error',
      text: error.response?.data?.message || 'Terjadi kesalahan saat memproses point',
    };
  } finally {
    loading.value = false;
    adShown.value = false;
  }
};

const goBack = () => {
  router.push('/app/rewards');
};

onMounted(async () => {
  try {
    // Initialize IronSource
    initializing.value = true;
    await initialize();
    
    // Check ad availability
    setTimeout(() => {
      checkAdAvailability();
      initializing.value = false;
    }, 1000);
  } catch (error: any) {
    console.error('Error initializing IronSource:', error);
    statusMessage.value = {
      type: 'error',
      text: 'Gagal menginisialisasi iklan. Silakan refresh halaman.',
    };
    initializing.value = false;
  }
});
</script>
