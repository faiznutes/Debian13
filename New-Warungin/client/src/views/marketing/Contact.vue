<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Hubungi Tim Support Warungin - Customer Service Sistem Kasir</h1>
          <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-2 px-4">
            Punya pertanyaan tentang Warungin? Tim support kami siap membantu Anda!
          </p>
          <p class="text-sm sm:text-base md:text-lg text-gray-500 px-4">
            Kami tersedia Senin-Jumat 09:00-18:00 WIB untuk membantu kelancaran bisnis Anda
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <!-- Contact Form -->
          <div class="bg-white rounded-xl shadow-xl hover:shadow-2xl transition p-5 sm:p-6 md:p-8 border border-gray-100">
            <div class="flex items-center space-x-3 mb-4 sm:mb-6">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Formulir Kontak Warungin</h2>
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
                <label class="block text-sm font-medium text-gray-700 mb-2">Subjek</label>
                <input
                  v-model="form.subject"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Subjek pesan"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Pesan</label>
                <textarea
                  v-model="form.message"
                  required
                  rows="5"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Tulis pesan Anda di sini..."
                ></textarea>
              </div>
              <button
                type="submit"
                :disabled="loading"
                class="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:scale-105 disabled:transform-none"
              >
                {{ loading ? 'Mengirim...' : 'Kirim Pesan' }}
              </button>
            </form>
          </div>

          <!-- Contact Info -->
          <div class="space-y-6">
            <div class="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-xl p-8 border border-primary-100">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900">Kontak & Lokasi Warungin</h2>
              </div>
              <div class="space-y-4">
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-800">Email</h3>
                    <p class="text-gray-600">support@warungin.com</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-800">Telepon</h3>
                    <p class="text-gray-600">+62 812-3456-7890</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-800">Alamat</h3>
                    <p class="text-gray-600">Jakarta, Indonesia</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl p-8 border border-primary-300">
              <div class="flex items-center space-x-3 mb-4">
                <svg class="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl font-bold text-gray-900">Jam Operasional</h3>
              </div>
              <div class="space-y-3 text-gray-700">
                <div class="flex items-center justify-between">
                  <span class="font-semibold">Senin - Jumat:</span>
                  <span>09:00 - 18:00 WIB</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-semibold">Sabtu:</span>
                  <span>09:00 - 15:00 WIB</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-semibold">Minggu:</span>
                  <span class="text-gray-500">Tutup</span>
                </div>
              </div>
              <p class="mt-4 text-sm text-gray-600 font-medium">
                💡 Untuk urgensi di luar jam operasional, kirim email dan kami akan merespon secepat mungkin!
              </p>
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
  title: 'Hubungi Kami - Warungin Support',
  description: 'Punya pertanyaan tentang Warungin? Tim support kami siap membantu Anda! Hubungi kami melalui email, telepon, atau form kontak. Tersedia Senin-Jumat 09:00-18:00 WIB.',
  keywords: 'kontak warungin, support warungin, hubungi kami, customer service, bantuan warungin',
});

const { success: showSuccess, error: showError } = useNotification();

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  try {
    await api.post('/contact', form.value);
    await showSuccess('Terima kasih! Pesan Anda telah dikirim.');
    form.value = { name: '', email: '', subject: '', message: '' };
  } catch (error: any) {
    console.error('Error submitting contact form:', error);
    await showError(error.response?.data?.message || 'Gagal mengirim pesan. Silakan coba lagi.');
  } finally {
    loading.value = false;
  }
};
</script>

