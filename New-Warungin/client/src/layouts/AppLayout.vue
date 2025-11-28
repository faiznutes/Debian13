<template>
  <div class="min-h-screen bg-gray-50 flex w-full">
    <!-- Sidebar -->
    <aside
      class="w-64 bg-white shadow-xl fixed h-full z-50 transition-transform duration-300 ease-in-out"
      :class="{ 
        '-translate-x-full lg:translate-x-0': !sidebarOpen && windowWidth < 1024,
        'translate-x-0': sidebarOpen || windowWidth >= 1024
      }"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="p-6 border-b border-gray-200 flex-shrink-0">
          <router-link to="/" class="flex items-center hover:opacity-90 transition-opacity group">
            <span class="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">Warungin</span>
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto overscroll-contain">
          <!-- Operasional Section -->
          <div class="mb-2">
            <button
              @click="toggleMenu('operasional')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
            >
              <span>Operasional</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': expandedMenus.operasional }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-show="expandedMenus.operasional"
              class="mt-1 space-y-1 transition-all duration-200"
            >
              <router-link
                to="/app/dashboard"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                exact-active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span class="font-medium">Dashboard</span>
              </router-link>

              <router-link
                v-if="userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN' || (userRole === 'SUPERVISOR' && canManageProducts) || (userRole === 'CASHIER' && canManageProducts)"
                to="/app/products"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span class="font-medium">Produk</span>
              </router-link>

              <router-link
                v-if="userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN' || (userRole === 'SUPERVISOR' && canEditOrders) || userRole === 'CASHIER'"
                to="/app/orders"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span class="font-medium">Pesanan & Transaksi</span>
              </router-link>

              <router-link
                v-if="userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN' || (userRole === 'SUPERVISOR' && canManageCustomers) || (userRole === 'CASHIER' && canManageCustomers)"
                to="/app/customers"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span class="font-medium">Pelanggan</span>
              </router-link>
            </div>
          </div>

          <!-- Laporan & Analitik Section -->
          <div v-if="(userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN' || (userRole === 'SUPERVISOR' && canViewReports) || (userRole === 'CASHIER' && canViewReports)) && userRole !== 'KITCHEN'" class="pt-4 mt-4 border-t border-gray-200">
            <button
              @click="toggleMenu('laporan')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
            >
              <span>Laporan & Analitik</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': expandedMenus.laporan }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-show="expandedMenus.laporan"
              class="mt-1 space-y-1 transition-all duration-200"
            >
              <router-link
                to="/app/reports"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="font-medium">Laporan</span>
              </router-link>

              <!-- Business Analytics Submenu -->
              <div v-if="hasBusinessAnalytics" class="ml-4 mt-1 space-y-1">
                <router-link
                  to="/app/analytics"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group text-sm"
                  active-class="bg-primary-50 text-primary-600 font-semibold"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span class="font-medium">Advanced Analytics</span>
                </router-link>

                <router-link
                  to="/app/finance"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group text-sm"
                  active-class="bg-primary-50 text-primary-600 font-semibold"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium">Keuangan</span>
                </router-link>

                <router-link
                  to="/app/profit-loss"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group text-sm"
                  active-class="bg-primary-50 text-primary-600 font-semibold"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span class="font-medium">Laporan Laba Rugi</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Manajemen Section -->
          <div v-if="userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN'" class="pt-4 mt-4 border-t border-gray-200">
            <button
              @click="toggleMenu('manajemen')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
            >
              <span>Manajemen</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': expandedMenus.manajemen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-show="expandedMenus.manajemen"
              class="mt-1 space-y-1 transition-all duration-200"
            >
              <router-link
                to="/app/users"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span class="font-medium">Pengguna</span>
              </router-link>
            </div>
          </div>

          <!-- Pengaturan Section -->
          <div v-if="userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN'" class="pt-4 mt-4 border-t border-gray-200">
            <button
              @click="toggleMenu('pengaturan')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
            >
              <span>Pengaturan</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': expandedMenus.pengaturan }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-show="expandedMenus.pengaturan"
              class="mt-1 space-y-1 transition-all duration-200"
            >
              <router-link
                to="/app/subscription"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Berlangganan</span>
              </router-link>

              <router-link
                v-if="userRole === 'ADMIN_TENANT'"
                to="/app/addons"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span class="font-medium">Addon</span>
              </router-link>

              <router-link
                v-if="userRole === 'ADMIN_TENANT' || userRole === 'SUPERVISOR' || userRole === 'SUPER_ADMIN'"
                to="/app/rewards"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-primary-50 hover:text-primary-600 group"
                active-class="bg-primary-50 text-primary-600 font-semibold"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Point Gratis</span>
              </router-link>
            </div>
          </div>
        </nav>

        <!-- User Section -->
        <div class="p-4 border-t border-gray-200 flex-shrink-0">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-primary-700 font-semibold text-sm">{{ userInitials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ userName }}</p>
              <p class="text-xs text-gray-500 truncate">{{ userEmail }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay for mobile/tablet -->
    <div
      v-if="sidebarOpen && windowWidth < 1024"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
      @click="sidebarOpen = false"
    ></div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col lg:ml-64 w-full">
      <!-- Top Bar -->
      <header class="bg-white shadow-sm sticky top-0 z-30">
        <div class="flex items-center justify-between px-4 py-4">
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-manipulation"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex items-center space-x-4 flex-1 lg:flex-none">
            <h1 class="text-xl font-semibold" :class="pageTitle === 'Warungin' ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent' : 'text-gray-900'">
              {{ pageTitle }}
            </h1>
          </div>
          <!-- Notification Button for Admin Tenant -->
          <button
            v-if="userRole === 'ADMIN_TENANT'"
            @click="showInfoModal = true"
            class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Informasi Penting"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span
              v-if="hasUnreadInfo"
              class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
            ></span>
          </button>
          <!-- Tenant Selector for Super Admin -->
          <div v-if="authStore.isSuperAdmin && authStore.tenants.length > 0" class="hidden md:flex items-center space-x-2">
            <select
              v-model="selectedTenant"
              @change="handleTenantChange"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[150px]"
            >
              <option value="">Pilih Tenant</option>
              <option v-for="tenant in authStore.tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
          </div>
          <div class="w-8 lg:hidden"></div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
        <router-view />
      </main>
    </div>
    
    <!-- Admin Info Modal -->
    <AdminInfoModal
      :show="showInfoModal"
      @close="handleInfoModalClose"
      @dont-show-today="handleDontShowToday"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { usePermissions } from '../composables/usePermissions';
import api from '../api';
import AdminInfoModal from '../components/AdminInfoModal.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { canManageProducts, canViewReports, canEditOrders, canManageCustomers } = usePermissions();

// Watch for permission changes to update menu visibility
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    // Force reactivity update when user/permissions change
    console.log('User permissions updated:', (newUser as any).permissions);
  }
}, { deep: true, immediate: true });

const sidebarOpen = ref(false);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const selectedTenant = ref<string>('');
const openSubmenus = ref<Record<string, boolean>>({});
const activeAddons = ref<any[]>([]);
const userRole = computed(() => authStore.user?.role || '');
const showInfoModal = ref(false);
const hasUnreadInfo = ref(false);

// Menu expand/collapse state - all closed by default
const expandedMenus = ref({
  operasional: false,
  laporan: false,
  manajemen: false,
  pengaturan: false,
});

// Toggle menu section
const toggleMenu = (menuKey: keyof typeof expandedMenus.value) => {
  const isCurrentlyOpen = expandedMenus.value[menuKey];
  
  // If clicking to open, close all other menus first
  if (!isCurrentlyOpen) {
    Object.keys(expandedMenus.value).forEach(key => {
      if (key !== menuKey) {
        expandedMenus.value[key as keyof typeof expandedMenus.value] = false;
      }
    });
  }
  
  // Toggle the clicked menu
  expandedMenus.value[menuKey] = !isCurrentlyOpen;
  
  // Save to localStorage
  localStorage.setItem('expandedMenus', JSON.stringify(expandedMenus.value));
};

// Auto-expand menu based on current route
// Only expand the relevant menu section, close others
const autoExpandMenu = () => {
  const currentPath = route.path;
  
  // Close all menus first
  expandedMenus.value.operasional = false;
  expandedMenus.value.laporan = false;
  expandedMenus.value.manajemen = false;
  expandedMenus.value.pengaturan = false;
  
  // Open only the relevant menu section based on current route
  if (currentPath.includes('/dashboard') || currentPath.includes('/products') || 
      currentPath.includes('/orders') || currentPath.includes('/customers')) {
    expandedMenus.value.operasional = true;
  } else if (currentPath.includes('/reports') || currentPath.includes('/analytics') || 
      currentPath.includes('/finance') || currentPath.includes('/profit-loss')) {
    expandedMenus.value.laporan = true;
  } else if (currentPath.includes('/users')) {
    expandedMenus.value.manajemen = true;
  } else if (currentPath.includes('/subscription') || currentPath.includes('/addons') || 
      currentPath.includes('/settings')) {
    expandedMenus.value.pengaturan = true;
  } else {
    // Default: if on dashboard route, open operasional menu
    if (currentPath === '/app/dashboard' || currentPath === '/app') {
      expandedMenus.value.operasional = true;
    }
  }
};

// Load saved menu state from localStorage (but don't override auto-expand for current route)
const loadMenuState = () => {
  // Don't load saved state - always start fresh
  // Auto-expand based on current route (will open dashboard menu if on dashboard)
  autoExpandMenu();
};

// Check if info modal should be shown (once per day)
const checkShouldShowInfo = () => {
  if (userRole.value !== 'ADMIN_TENANT') {
    return false;
  }
  
  const lastShownDate = localStorage.getItem('adminInfoLastShown');
  const today = new Date().toDateString();
  
  if (lastShownDate !== today) {
    return true;
  }
  
  return false;
};

// Check for unread info (show badge if not shown today)
const checkUnreadInfo = () => {
  if (userRole.value !== 'ADMIN_TENANT') {
    hasUnreadInfo.value = false;
    return;
  }
  
  const lastShownDate = localStorage.getItem('adminInfoLastShown');
  const today = new Date().toDateString();
  
  hasUnreadInfo.value = lastShownDate !== today;
};

const handleInfoModalClose = () => {
  // Save today's date when modal is closed (so it won't show again today)
  const today = new Date().toDateString();
  localStorage.setItem('adminInfoLastShown', today);
  hasUnreadInfo.value = false;
  showInfoModal.value = false;
};

const handleDontShowToday = () => {
  // Same as close - save today's date
  handleInfoModalClose();
};

// Watch for role changes to check info status
watch(() => userRole.value, () => {
  checkUnreadInfo();
  if (checkShouldShowInfo()) {
    showInfoModal.value = true;
  }
}, { immediate: true });

const hasBusinessAnalytics = computed(() => {
  return activeAddons.value.some(
    (addon) => addon.addonType === 'BUSINESS_ANALYTICS' && addon.status === 'active'
  );
});

const userName = computed(() => authStore.user?.name || 'User');
const userEmail = computed(() => authStore.user?.email || '');
const userInitials = computed(() => {
  const name = userName.value;
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/app/dashboard': 'Dashboard',
    '/app/products': 'Produk',
    '/app/orders': 'Pesanan & Transaksi',
    '/app/customers': 'Pelanggan',
    '/app/reports': 'Laporan',
    '/app/subscription': 'Berlangganan',
    '/app/addons': 'Addon',
    '/app/users': 'Pengguna',
    '/app/analytics': 'Advanced Analytics',
    '/app/finance': 'Keuangan',
    '/app/profit-loss': 'Laporan Laba Rugi',
  };
  return titles[route.path] || 'Warungin';
});

const closeSidebarOnMobile = () => {
  if (windowWidth.value < 1024) {
    sidebarOpen.value = false;
  }
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  // Auto-close sidebar on mobile when resizing to desktop
  if (windowWidth.value >= 1024) {
    sidebarOpen.value = true;
  } else {
    sidebarOpen.value = false;
  }
};

const handleTenantChange = () => {
  authStore.setSelectedTenant(selectedTenant.value || null);
  // Reload current page to refresh data with new tenant
  window.location.reload();
};

const toggleSubmenu = (menu: string) => {
  openSubmenus.value[menu as keyof typeof openSubmenus.value] = !openSubmenus.value[menu as keyof typeof openSubmenus.value];
};

       const selectTenantAndNavigate = async (path: string, tenantId: string) => {
         // Ensure user is still authenticated before navigating
         if (!authStore.isAuthenticated) {
           // Try to restore session
           const token = localStorage.getItem('token') || sessionStorage.getItem('token');
           if (token) {
             try {
               await authStore.fetchMe();
             } catch (error) {
               console.error('Session expired, redirecting to login');
               router.push('/login');
               return;
             }
           } else {
             router.push('/login');
             return;
           }
         }
         
         authStore.setSelectedTenant(tenantId);
         closeSidebarOnMobile();
         
         // Use router.push instead of window.location.reload to maintain session
         await router.push(path);
         
         // Force reload only if needed (to refresh data)
         // But ensure we don't lose auth state
         setTimeout(() => {
           if (authStore.isAuthenticated) {
             window.location.reload();
           }
         }, 100);
       };

const loadAddons = async () => {
  if (userRole.value !== 'ADMIN_TENANT' && userRole.value !== 'SUPER_ADMIN') {
    return;
  }
  
  try {
    const response = await api.get('/addons');
    activeAddons.value = response.data || [];
  } catch (error: any) {
    console.error('Error loading addons:', error);
    activeAddons.value = [];
  }
};

onMounted(async () => {
  windowWidth.value = window.innerWidth;
  
  // Load menu state
  loadMenuState();
  
  // Check and show info modal for Admin Tenant (once per day)
  if (checkShouldShowInfo()) {
    showInfoModal.value = true;
  }
  checkUnreadInfo();
  
  // Auto-open sidebar on desktop
  if (windowWidth.value >= 1024) {
    sidebarOpen.value = true;
  }
  
  // Load addons for menu visibility
  await loadAddons();
  window.addEventListener('resize', handleResize);
  
  // Fetch tenants if super admin
  if (authStore.isSuperAdmin) {
    await authStore.fetchTenants();
    // Initialize selectedTenant from authStore
    selectedTenant.value = authStore.selectedTenantId || '';
  }
});

// Watch route changes to auto-expand menu
watch(() => route.path, () => {
  autoExpandMenu();
}, { immediate: true });

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const handleLogout = () => {
  // Clear auth synchronously to prevent any flash
  authStore.clearAuth();
  // Use replace instead of href to avoid history entry and flash
  window.location.replace('/login');
};
</script>

<style scoped>
/* Touch-friendly for mobile */
.touch-manipulation {
  touch-action: manipulation;
}

/* Smooth scrolling for nav */
nav {
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb transparent;
}

nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
</style>
