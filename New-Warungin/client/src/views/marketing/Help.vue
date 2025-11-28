<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-16">
      <div class="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
          Pusat Bantuan Warungin - FAQ & Panduan Sistem Kasir
        </h1>
        <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl px-4">
          Temukan jawaban untuk pertanyaan Anda atau hubungi tim support kami
        </p>
        <div class="w-full max-w-2xl">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari bantuan..."
              class="w-full px-6 py-4 pl-14 rounded-lg border-2 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 text-lg"
            />
            <svg class="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="container mx-auto px-4 py-12 pb-20">
      <div class="max-w-6xl mx-auto">
        <!-- Categories -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" @click="selectedCategory = 'getting-started'">
            <div class="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Panduan Memulai Warungin</h2>
            <p class="text-gray-600">Panduan setup dan onboarding untuk memulai menggunakan Warungin</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" @click="selectedCategory = 'features'">
            <div class="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Panduan Fitur Sistem Kasir</h2>
            <p class="text-gray-600">Pelajari cara menggunakan semua fitur yang tersedia di platform</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" @click="selectedCategory = 'billing'">
            <div class="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Panduan Paket & Pembayaran</h2>
            <p class="text-gray-600">Informasi tentang paket, pembayaran, dan upgrade</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" @click="selectedCategory = 'troubleshooting'">
            <div class="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Troubleshooting & Solusi Masalah</h2>
            <p class="text-gray-600">Solusi untuk masalah umum yang mungkin Anda hadapi</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" @click="selectedCategory = 'api'">
            <div class="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">API & Integrasi Sistem</h2>
            <p class="text-gray-600">Dokumentasi API dan panduan integrasi dengan sistem lain</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" @click="selectedCategory = 'security'">
            <div class="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Keamanan Data & Privasi</h2>
            <p class="text-gray-600">Informasi tentang keamanan data dan privasi</p>
          </div>
        </div>

        <!-- Popular Articles -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-8">Artikel & Panduan Populer Warungin</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Cara Setup Awal Warungin</h3>
              <p class="text-gray-600 mb-4">Panduan lengkap untuk menyiapkan akun dan outlet pertama Anda</p>
              <a href="#" class="text-primary-600 hover:text-primary-700 font-medium">Baca lebih lanjut →</a>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Cara Menambah Produk</h3>
              <p class="text-gray-600 mb-4">Pelajari cara menambahkan dan mengelola produk di sistem</p>
              <a href="#" class="text-primary-600 hover:text-primary-700 font-medium">Baca lebih lanjut →</a>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Cara Mencetak Struk</h3>
              <p class="text-gray-600 mb-4">Setup printer dan konfigurasi untuk mencetak struk transaksi</p>
              <a href="#" class="text-primary-600 hover:text-primary-700 font-medium">Baca lebih lanjut →</a>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Mengelola Laporan</h3>
              <p class="text-gray-600 mb-4">Cara membuat dan mengunduh laporan penjualan, produk, dan keuangan</p>
              <a href="#" class="text-primary-600 hover:text-primary-700 font-medium">Baca lebih lanjut →</a>
            </div>
          </div>
        </div>

        <!-- Contact Support -->
        <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-white text-center">
          <h2 class="text-3xl font-bold mb-4">Masih Butuh Bantuan? Hubungi Support Warungin</h2>
          <p class="text-xl mb-8 opacity-90">
            Tim support kami siap membantu Anda 24/7
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/contact"
              class="px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Hubungi Support
            </router-link>
            <a
              href="mailto:support@warungin.com"
              class="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold"
            >
              Kirim Email
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSEO } from '../../composables/useSEO';

useSEO({
  title: 'Pusat Bantuan Warungin - FAQ & Panduan | Warungin',
  description: 'Temukan jawaban untuk pertanyaan Anda tentang Warungin. Panduan setup, fitur, pembayaran, troubleshooting, dan lebih banyak lagi. Atau hubungi tim support kami.',
  keywords: 'bantuan warungin, FAQ warungin, panduan warungin, help center, tutorial warungin, support warungin',
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const searchQuery = ref('');
const selectedCategory = ref('');
</script>

