<template>
  <div class="min-h-screen flex flex-col w-full overflow-x-hidden">
    <!-- Navigation - Fixed Header -->
    <nav class="bg-white shadow-md fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-sm bg-white/95">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <router-link to="/" class="flex items-center hover:opacity-90 transition-opacity group">
            <span class="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">Warungin</span>
          </router-link>

          <!-- Navigation Links - Hidden below 1200px (lg breakpoint) -->
          <div class="hidden lg:flex items-center space-x-8">
            <router-link
              to="/"
              class="text-gray-700 hover:text-primary-600 transition font-medium"
              active-class="text-primary-600"
            >
              Beranda
            </router-link>
            <router-link
              to="/demo"
              class="text-gray-700 hover:text-primary-600 transition font-medium"
              active-class="text-primary-600"
            >
              Demo
            </router-link>
            <router-link
              to="/contact"
              class="text-gray-700 hover:text-primary-600 transition font-medium"
              active-class="text-primary-600"
            >
              Kontak
            </router-link>
            <router-link
              to="/pricing"
              class="text-gray-700 hover:text-primary-600 transition font-medium"
              active-class="text-primary-600"
            >
              Harga
            </router-link>
            <router-link
              to="/help"
              class="text-gray-700 hover:text-primary-600 transition font-medium"
              active-class="text-primary-600"
            >
              Bantuan
            </router-link>
            <router-link
              to="/terms"
              class="text-gray-700 hover:text-primary-600 transition font-medium"
              active-class="text-primary-600"
            >
              Syarat & Ketentuan
            </router-link>
          </div>

          <!-- Auth Buttons (Desktop only - above 1200px) -->
          <div class="hidden lg:flex items-center space-x-4">
            <router-link
              to="/login"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition font-medium"
            >
              Masuk
            </router-link>
            <router-link
              to="/pricing"
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Lihat Harga
            </router-link>
          </div>

          <!-- Hamburger Menu Button - Show below 1200px (lg breakpoint) -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
              />
            </svg>
          </button>
        </div>

        <!-- Mobile/Tablet Menu - Show below 1200px -->
        <div
          v-if="mobileMenuOpen"
          class="lg:hidden py-4 border-t border-gray-200 bg-white"
        >
          <div class="flex flex-col space-y-3">
            <router-link
              to="/"
              @click="mobileMenuOpen = false"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition"
              active-class="text-primary-600 font-semibold"
            >
              Beranda
            </router-link>
            <router-link
              to="/demo"
              @click="mobileMenuOpen = false"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition"
              active-class="text-primary-600 font-semibold"
            >
              Demo
            </router-link>
            <router-link
              to="/contact"
              @click="mobileMenuOpen = false"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition"
              active-class="text-primary-600 font-semibold"
            >
              Kontak
            </router-link>
            <router-link
              to="/pricing"
              @click="mobileMenuOpen = false"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition"
              active-class="text-primary-600 font-semibold"
            >
              Harga
            </router-link>
            <router-link
              to="/help"
              @click="mobileMenuOpen = false"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition"
              active-class="text-primary-600 font-semibold"
            >
              Bantuan
            </router-link>
            <router-link
              to="/terms"
              @click="mobileMenuOpen = false"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition"
              active-class="text-primary-600 font-semibold"
            >
              Syarat & Ketentuan
            </router-link>
            <!-- Auth Buttons for Mobile/Tablet -->
            <div class="pt-4 border-t border-gray-200 space-y-3">
              <router-link
                to="/login"
                @click="mobileMenuOpen = false"
                class="block w-full px-4 py-2 text-center text-gray-700 hover:text-primary-600 transition font-medium border border-gray-300 rounded-lg hover:border-primary-600"
              >
                Masuk
              </router-link>
              <router-link
                to="/pricing"
                @click="mobileMenuOpen = false"
                class="block w-full px-4 py-2 text-center bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
              >
                Lihat Harga
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 w-full min-h-0 relative pt-16">
      <div class="w-full h-full">
        <router-view />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white mt-16">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div>
            <router-link to="/" class="flex items-center mb-4 hover:opacity-90 transition-opacity group inline-flex">
              <span class="text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 bg-clip-text text-transparent">Warungin</span>
            </router-link>
            <p class="text-gray-400 text-sm">
              Sistem modern untuk UMKM. Kelola bisnis Anda dengan mudah dan efisien.
            </p>
          </div>

          <!-- Links -->
          <div>
            <h3 class="font-semibold mb-4">Produk</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>
                <router-link to="/demo" class="hover:text-white transition">
                  Request Demo
                </router-link>
              </li>
              <li>
                <router-link to="/" class="hover:text-white transition">
                  Fitur
                </router-link>
              </li>
              <li>
                <router-link to="/pricing" class="hover:text-white transition">
                  Harga & Paket
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h3 class="font-semibold mb-4">Dukungan</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>
                <router-link to="/contact" class="hover:text-white transition">
                  Hubungi Kami
                </router-link>
              </li>
              <li>
                <router-link to="/terms" class="hover:text-white transition">
                  Syarat & Ketentuan
                </router-link>
              </li>
              <li>
                <router-link to="/help" class="hover:text-white transition">Pusat Bantuan</router-link>
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h3 class="font-semibold mb-4">Kontak</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@warungin.com</span>
              </li>
              <li class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+62 812-3456-7890</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Warungin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const mobileMenuOpen = ref(false);
</script>

