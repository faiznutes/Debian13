<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Syarat & Ketentuan Warungin - Kebijakan Layanan Sistem Kasir</h1>
          <p class="text-base sm:text-lg md:text-xl text-gray-600 px-4">
            Ketentuan penggunaan layanan Warungin
          </p>
        </div>
        
        <div class="bg-white rounded-xl shadow-xl p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 border border-gray-100">
          <section class="pb-4 sm:pb-6 border-b border-gray-200">
            <div class="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span class="text-primary-600 font-bold text-base sm:text-lg">1</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900">1. Penerimaan Syarat & Ketentuan</h2>
            </div>
            <p class="text-gray-700 leading-relaxed">
              Dengan menggunakan Warungin, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini.
              Jika Anda tidak setuju dengan syarat-syarat ini, mohon jangan menggunakan layanan kami.
            </p>
          </section>

          <section class="pb-6 border-b border-gray-200">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-lg">2</span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">2. Deskripsi Layanan Sistem Kasir</h2>
            </div>
            <p class="text-gray-700 leading-relaxed">
              Warungin adalah sistem berbasis cloud yang memungkinkan Anda mengelola
              bisnis, produk, transaksi, dan laporan secara digital. Layanan ini tersedia 24/7 dengan 
              backup otomatis dan keamanan data terjamin.
            </p>
          </section>

          <section class="pb-6 border-b border-gray-200">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-lg">3</span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">3. Berlangganan & Pembayaran Paket</h2>
            </div>
            <p class="text-gray-700 leading-relaxed mb-3">
              Layanan kami tersedia dengan berbagai paket berlangganan mulai dari Rp 200rb/bulan <span class="text-gray-400 line-through">(dari Rp 250rb)</span>. 
              Pembayaran dilakukan secara berkala sesuai dengan paket yang Anda pilih.
            </p>
            <p class="text-gray-700 leading-relaxed">
              <strong>Pembatalan:</strong> Anda dapat membatalkan langganan kapan saja tanpa biaya tambahan. 
              Data Anda akan tetap tersimpan selama 30 hari setelah pembatalan.
            </p>
          </section>

          <section class="pb-6 border-b border-gray-200">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-lg">4</span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">4. Data & Privasi Pengguna</h2>
            </div>
            <p class="text-gray-700 leading-relaxed mb-3">
              Kami sangat menghormati privasi data Anda. Data yang Anda simpan di Warungin dijamin
              keamanannya dengan enkripsi tingkat tinggi dan backup otomatis setiap hari.
            </p>
            <p class="text-gray-700 leading-relaxed">
              <strong>Privasi:</strong> Data Anda tidak akan dibagikan kepada pihak ketiga tanpa persetujuan 
              Anda, kecuali diminta oleh hukum yang berlaku.
            </p>
          </section>

          <section>
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-lg">5</span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">5. Tanggung Jawab Pengguna Sistem</h2>
            </div>
            <p class="text-gray-700 leading-relaxed">
              Anda bertanggung jawab untuk menjaga kerahasiaan akun Anda dan memastikan bahwa semua
              aktivitas yang dilakukan melalui akun Anda sesuai dengan hukum yang berlaku. 
              Jangan bagikan kredensial login Anda kepada pihak lain.
            </p>
          </section>
        </div>

        <div class="mt-12 text-center">
          <router-link
            to="/"
            class="inline-flex items-center px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSEO } from '../../composables/useSEO';

useSEO({
  title: 'Syarat & Ketentuan - Warungin',
  description: 'Ketentuan penggunaan layanan Warungin. Pelajari tentang berlangganan, pembayaran, privasi data, dan tanggung jawab pengguna.',
  keywords: 'syarat ketentuan warungin, terms of service, kebijakan privasi, ketentuan penggunaan',
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
</script>

