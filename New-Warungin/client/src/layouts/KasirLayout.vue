<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex w-full">
    <!-- Sidebar - Orange theme for Kasir -->
    <aside
      class="w-64 bg-gradient-to-b from-orange-600 to-orange-500 shadow-2xl fixed h-full z-50 transition-transform duration-300 ease-in-out"
      :class="{ 
        '-translate-x-full lg:translate-x-0': !sidebarOpen && windowWidth < 1024,
        'translate-x-0': sidebarOpen || windowWidth >= 1024
      }"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="p-6 border-b border-orange-500 flex-shrink-0">
          <router-link to="/" class="flex items-center hover:opacity-90 transition-opacity group">
            <span class="text-xl font-bold text-white">Warungin</span>
            <span class="ml-2 px-2 py-1 text-xs bg-orange-500 text-orange-100 rounded-full">Kasir</span>
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <router-link
            to="/app/dashboard"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-orange-100 hover:bg-orange-500 hover:text-white group"
            active-class="bg-orange-500 text-white font-semibold shadow-lg"
            exact-active-class="bg-orange-500 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="font-medium">Dashboard Kasir</span>
          </router-link>

          <router-link
            v-if="canManageProducts"
            to="/app/products"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-orange-100 hover:bg-orange-500 hover:text-white group"
            active-class="bg-orange-500 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span class="font-medium">Produk</span>
          </router-link>

          <router-link
            to="/app/pos"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-orange-100 hover:bg-orange-500 hover:text-white group"
            active-class="bg-orange-500 text-white font-semibold shadow-lg"
            exact-active-class="bg-orange-500 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span class="font-medium">Kasir</span>
          </router-link>

          <router-link
            v-if="canEditOrders"
            to="/app/orders"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-orange-100 hover:bg-orange-500 hover:text-white group"
            active-class="bg-orange-500 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="font-medium">Pesanan</span>
          </router-link>

          <router-link
            v-if="canManageCustomers"
            to="/app/customers"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-orange-100 hover:bg-orange-500 hover:text-white group"
            active-class="bg-orange-500 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="font-medium">Pelanggan</span>
          </router-link>

          <router-link
            v-if="canViewReports"
            to="/app/reports"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-orange-100 hover:bg-orange-500 hover:text-white group"
            active-class="bg-orange-500 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="font-medium">Laporan</span>
          </router-link>

        </nav>

        <!-- User Section -->
        <div class="p-4 border-t border-orange-500 flex-shrink-0">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-orange-100 font-semibold text-sm">{{ userInitials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ userName }}</p>
              <p class="text-xs text-orange-200 truncate">{{ tenantName }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full px-4 py-2 text-sm text-orange-100 hover:bg-orange-500 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2"
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
            class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex items-center space-x-4 flex-1">
            <h1 class="text-xl font-semibold text-gray-900">{{ pageTitle }}</h1>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { usePermissions } from '../composables/usePermissions';

const route = useRoute();
const authStore = useAuthStore();
const { canManageProducts, canManageCustomers, canViewReports, canEditOrders } = usePermissions();

// Debug: Log permissions when they change
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    const permissions = (newUser as any).permissions || {};
    console.log('Kasir Layout - User permissions:', {
      role: newUser.role,
      permissions,
      canManageProducts: canManageProducts.value,
      canManageCustomers: canManageCustomers.value,
      canViewReports: canViewReports.value,
      canEditOrders: canEditOrders.value,
    });
  }
}, { deep: true, immediate: true });

const sidebarOpen = ref(false);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

const userName = computed(() => authStore.user?.name || 'Kasir');
const tenantName = computed(() => authStore.user?.tenantName || 'Toko');
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
      '/app/dashboard': 'Dashboard Kasir',
      '/app/products': 'Produk',
      '/app/pos': 'Kasir',
      '/app/orders': 'Pesanan',
      '/app/customers': 'Pelanggan',
      '/app/reports': 'Laporan',
  };
  return titles[route.path] || 'Kasir Dashboard';
});

const closeSidebarOnMobile = () => {
  if (windowWidth.value < 1024) {
    sidebarOpen.value = false;
  }
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value >= 1024) {
    sidebarOpen.value = true;
  } else {
    sidebarOpen.value = false;
  }
};

const handleLogout = () => {
  // Clear auth synchronously to prevent any flash
  authStore.clearAuth();
  // Use replace instead of href to avoid history entry and flash
  window.location.replace('/login');
};

onMounted(() => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value >= 1024) {
    sidebarOpen.value = true;
  }
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
nav {
  scrollbar-width: thin;
  scrollbar-color: #ea580c transparent;
}

nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background-color: #ea580c;
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background-color: #c2410c;
}
</style>

