<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white">
    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-20">
      <div class="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
          Warungin - Sistem Kasir Modern untuk UMKM | Kelola Warung & Toko Lebih Mudah
        </h1>
        <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-3 sm:mb-4 max-w-2xl px-4">
          <strong>Sistem kasir</strong> modern untuk <strong>warung</strong> dan <strong>toko</strong> UMKM. Kelola semua <strong>transaksi</strong>, <strong>produk</strong>, dan <strong>laporan penjualan</strong> dalam satu <strong>aplikasi kasir</strong> yang mudah digunakan. Hemat waktu, tingkatkan penjualan, dan fokus pada bisnis Anda.
        </p>
        <p class="text-sm sm:text-base md:text-lg text-gray-500 mb-6 sm:mb-8 max-w-2xl px-4">
          ✨ <strong>Mulai dari Rp 200rb/bulan</strong> <span class="text-gray-400 line-through text-base">(dari Rp 250rb)</span> • Trial Gratis 14 Hari • Tanpa Setup Ribet
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto px-4">
          <router-link
            to="/pricing"
            class="px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
          >
            Mulai Gratis 14 Hari
          </router-link>
          <router-link
            to="/demo"
            class="px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary-600 rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl text-center"
          >
            Lihat Demo
          </router-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 bg-white">
      <div class="text-center mb-8 sm:mb-12 md:mb-16">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Fitur Sistem Kasir Warungin untuk UMKM</h2>
        <p class="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          <strong>Sistem kasir</strong> lengkap dengan fitur <strong>transaksi</strong>, <strong>inventori</strong>, <strong>laporan penjualan</strong>, dan <strong>multi-outlet</strong>. Semua tersedia dalam satu <strong>aplikasi kasir</strong> yang mudah digunakan untuk <strong>warung</strong> dan <strong>toko</strong> Anda.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
        <!-- Feature 1 -->
        <div class="flex flex-col p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg hover:shadow-xl transition">
          <div class="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Dashboard Real-time</h3>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Lihat <strong>omzet harian</strong>, <strong>penjualan terlaris</strong>, dan <strong>stok menipis</strong> langsung di <strong>dashboard sistem kasir</strong>. Tidak perlu buka Excel lagi!</p>
        </div>

        <!-- Feature 2 -->
        <div class="flex flex-col p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg hover:shadow-xl transition">
          <div class="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Kelola Produk & Stok</h3>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Tambah <strong>produk</strong> dengan foto, atur <strong>harga</strong> & <strong>diskon</strong>, dan dapatkan notifikasi otomatis saat <strong>stok menipis</strong>. <strong>Sistem kasir</strong> yang simple tapi powerful!</p>
        </div>

        <!-- Feature 3 -->
        <div class="flex flex-col p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg hover:shadow-xl transition">
          <div class="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Cepat & Praktis</h3>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Scan <strong>barcode</strong>, tambah item, dan cetak <strong>struk</strong> dalam hitungan detik. <strong>Aplikasi kasir</strong> yang mendukung cash, kartu, QRIS, dan e-wallet.</p>
        </div>

        <!-- Feature 4 -->
        <div class="flex flex-col p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg hover:shadow-xl transition">
          <div class="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Laporan Otomatis</h3>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Laporan penjualan harian, produk terlaris, dan laba rugi otomatis. Export PDF/Excel untuk keperluan pajak & laporan bank.</p>
        </div>

        <!-- Feature 5 -->
        <div class="flex flex-col p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg hover:shadow-xl transition">
          <div class="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Multi-Outlet & Cabang</h3>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Punya beberapa toko atau cabang? Kelola semua dalam satu dashboard. Lihat laporan per outlet atau gabungan.</p>
        </div>

        <!-- Feature 6 -->
        <div class="flex flex-col p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg hover:shadow-xl transition">
          <div class="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Data Aman & Terbackup</h3>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Data tersimpan aman di cloud dengan backup harian. Tidak perlu khawatir kehilangan data jika device rusak atau hilang.</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
      <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-center text-white shadow-2xl">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">Siap Mengembangkan Bisnis Anda?</h2>
        <p class="text-base sm:text-lg md:text-xl mb-3 sm:mb-4 opacity-90 px-4">
          Mulai gratis 14 hari tanpa kartu kredit. Coba semua fitur tanpa batasan.
        </p>
        <p class="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 opacity-80 px-4">
          Setelah trial, mulai dari <strong>Rp 200rb/bulan</strong> <span class="opacity-70 line-through text-xs sm:text-sm">(dari Rp 250rb)</span> - investasi kecil untuk kemudahan besar!
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <router-link
            to="/pricing"
            class="px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold text-base sm:text-lg shadow-lg transform hover:scale-105"
          >
            Lihat Paket & Harga
          </router-link>
          <router-link
            to="/demo"
            class="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold text-base sm:text-lg"
          >
            Request Demo Gratis
          </router-link>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 bg-gray-50">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto text-center">
        <div class="flex flex-col">
          <div class="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-600 mb-2">2,500+</div>
          <div class="text-gray-600 text-base sm:text-lg">Warung & Toko Aktif</div>
          <div class="text-xs sm:text-sm text-gray-500 mt-1">Dari seluruh Indonesia</div>
        </div>
        <div class="flex flex-col">
          <div class="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-600 mb-2">150K+</div>
          <div class="text-gray-600 text-base sm:text-lg">Transaksi/Bulan</div>
          <div class="text-xs sm:text-sm text-gray-500 mt-1">Dari ribuan merchant</div>
        </div>
        <div class="flex flex-col">
          <div class="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-600 mb-2">99.9%</div>
          <div class="text-gray-600 text-base sm:text-lg">Uptime Terjamin</div>
          <div class="text-xs sm:text-sm text-gray-500 mt-1">Server lokal & cepat</div>
        </div>
      </div>
    </section>

    <!-- CTA Section with Internal Links -->
    <section class="container mx-auto px-4 sm:px-6 py-12 sm:py-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Siap Meningkatkan Bisnis Warung & Toko Anda?</h2>
        <p class="text-lg sm:text-xl mb-6 sm:mb-8 text-primary-100">
          Mulai gratis 14 hari tanpa kartu kredit. <strong>Sistem kasir</strong> Warungin tidak perlu setup ribet, langsung bisa digunakan untuk <strong>warung</strong> dan <strong>toko</strong> Anda!
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <router-link
            to="/pricing"
            class="px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Lihat Paket & Harga
          </router-link>
          <router-link
            to="/demo"
            class="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold text-lg"
          >
            Request Demo Gratis
          </router-link>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 text-sm">
          <router-link to="/pricing" class="text-primary-100 hover:text-white transition underline">Paket Harga</router-link>
          <router-link to="/demo" class="text-primary-100 hover:text-white transition underline">Request Demo</router-link>
          <router-link to="/contact" class="text-primary-100 hover:text-white transition underline">Hubungi Kami</router-link>
          <router-link to="/help" class="text-primary-100 hover:text-white transition underline">Pusat Bantuan</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSEO } from '../../composables/useSEO';

useSEO({
  title: 'Warungin - Sistem Kasir Modern untuk UMKM | Kelola Warung Lebih Mudah',
  description: 'Kelola warung dan toko Anda dengan mudah menggunakan sistem kasir modern. Mulai dari Rp 200rb/bulan dengan trial gratis 14 hari. Fitur lengkap: transaksi, inventori, laporan, dan multi-outlet.',
  keywords: 'sistem kasir, warung, toko, UMKM, inventori, laporan penjualan, aplikasi kasir, sistem toko, aplikasi kasir Indonesia',
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
</script>
