<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-6xl mx-auto">
        <!-- Hero Section -->
        <div class="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-2">
            Request Demo Sistem Kasir <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">Warungin</span> - Gratis 30 Menit
          </h1>
          <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-2 px-4">
            Lihat langsung bagaimana Warungin dapat membantu mengembangkan bisnis UMKM Anda
          </p>
          <p class="text-sm sm:text-base md:text-lg text-gray-500 px-4">
            Demo personal 30-45 menit • Gratis • Tanpa komitmen • Semua fitur ditunjukkan
          </p>
        </div>

        <!-- Demo Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <!-- Form -->
          <div class="bg-white rounded-xl shadow-xl hover:shadow-2xl transition p-5 sm:p-6 md:p-8 border border-gray-100">
            <div class="flex items-center space-x-3 mb-4 sm:mb-6">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Formulir Request Demo</h2>
            </div>
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nama Bisnis</label>
                <input
                  v-model="form.businessName"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nama bisnis Anda"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal & Waktu</label>
                <input
                  v-model="form.dateTime"
                  type="datetime-local"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Pesan (Opsional)</label>
                <textarea
                  v-model="form.message"
                  rows="4"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ada pertanyaan spesifik?"
                ></textarea>
              </div>
              <button
                type="submit"
                :disabled="loading"
                class="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition disabled:opacity-50 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {{ loading ? 'Mengirim...' : 'Request Demo Gratis' }}
              </button>
            </form>
          </div>

          <!-- Info Section -->
          <div class="space-y-6">
            <div class="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-xl p-8 border border-primary-100">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-900">Fitur yang Akan Ditunjukkan dalam Demo</h2>
              </div>
              <ul class="space-y-3">
                <li class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600">Dashboard dengan statistik real-time</span>
                </li>
                <li class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600">Manajemen produk & inventory</span>
                </li>
                <li class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600">Sistem & transaksi</span>
                </li>
                <li class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600">Laporan & analitik lengkap</span>
                </li>
                <li class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600">Multi-outlet management</span>
                </li>
              </ul>
            </div>

            <div class="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl p-8 border border-primary-300">
              <div class="flex items-center space-x-3 mb-4">
                <svg class="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 class="text-xl font-bold text-gray-900">Mengapa Perlu Request Demo?</h2>
              </div>
              <p class="text-gray-700 leading-relaxed mb-4 font-medium">
                Demo personal memungkinkan kami menunjukkan fitur-fitur yang paling relevan
                untuk bisnis Anda dan menjawab pertanyaan spesifik Anda secara langsung.
              </p>
              <div class="bg-white/50 rounded-lg p-4 mt-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">⏱ Durasi:</span>
                  <span class="text-primary-700 font-bold">30-45 menit</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-gray-800">💰 Biaya:</span>
                  <span class="text-green-600 font-bold">Gratis & Tanpa Komitmen</span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">Butuh Bantuan Cepat?</h2>
              <p class="text-gray-600 mb-4">
                Hubungi kami langsung untuk demo langsung atau pertanyaan lainnya.
              </p>
              <div class="space-y-2">
                <a href="mailto:support@warungin.com" class="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>support@warungin.com</span>
                </a>
                <a href="tel:+6281234567890" class="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+62 812-3456-7890</span>
                </a>
              </div>
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
import { useSEO } from '../../composables/useSEO';

useSEO({
  title: 'Request Demo Warungin - Lihat Demo Sistem Kasir | Warungin',
  description: 'Lihat langsung bagaimana Warungin dapat membantu mengembangkan bisnis UMKM Anda. Demo personal 30-45 menit, gratis, tanpa komitmen. Semua fitur ditunjukkan.',
  keywords: 'demo warungin, request demo, coba warungin, demo sistem kasir, trial warungin',
});

const { success: showSuccess, error: showError } = useNotification();

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const form = ref({
  name: '',
  email: '',
  businessName: '',
  phone: '',
  dateTime: '',
  message: '',
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  try {
    await api.post('/contact/demo', form.value);
    await showSuccess('Terima kasih! Permintaan demo Anda telah dikirim. Tim kami akan menghubungi Anda segera.');
    form.value = { name: '', email: '', businessName: '', phone: '', dateTime: '', message: '' };
  } catch (error: any) {
    console.error('Error submitting demo request:', error);
    await showError(error.response?.data?.message || 'Gagal mengirim permintaan demo. Silakan coba lagi.');
  } finally {
    loading.value = false;
  }
};
</script>

