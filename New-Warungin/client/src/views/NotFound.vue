<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-2xl mx-auto text-center">
        <h1 class="text-6xl sm:text-8xl font-bold text-primary-600 mb-4">404</h1>
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Halaman Tidak Ditemukan</h2>
        <p class="text-lg text-gray-600 mb-8">
          Maaf, halaman yang Anda cari tidak ditemukan. Halaman mungkin telah dipindahkan atau dihapus.
        </p>
        
        <!-- Internal Links Section -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 class="text-xl font-bold text-gray-900 mb-6">Halaman Populer</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <router-link
              to="/"
              class="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
            >
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span class="text-gray-700 font-medium">Beranda</span>
            </router-link>
            
            <router-link
              to="/pricing"
              class="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
            >
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-gray-700 font-medium">Paket Harga</span>
            </router-link>
            
            <router-link
              to="/demo"
              class="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
            >
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="text-gray-700 font-medium">Request Demo</span>
            </router-link>
            
            <router-link
              to="/contact"
              class="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
            >
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span class="text-gray-700 font-medium">Hubungi Kami</span>
            </router-link>
            
            <router-link
              to="/help"
              class="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
            >
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-gray-700 font-medium">Pusat Bantuan</span>
            </router-link>
            
            <router-link
              to="/terms"
              class="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
            >
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="text-gray-700 font-medium">Syarat & Ketentuan</span>
            </router-link>
          </div>
        </div>
        
        <router-link
          to="/"
          class="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Beranda
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSEO } from '../composables/useSEO';

useSEO({
  title: '404 - Halaman Tidak Ditemukan | Warungin',
  description: 'Halaman yang Anda cari tidak ditemukan. Kembali ke beranda atau jelajahi halaman populer Warungin.',
  keywords: '404, halaman tidak ditemukan, error page',
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
</script>
