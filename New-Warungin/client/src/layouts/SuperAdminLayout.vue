<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex w-full">
    <!-- Sidebar - Blue theme for Super Admin -->
    <aside
      class="w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl fixed h-full z-50 transition-transform duration-300 ease-in-out"
      :class="{ 
        '-translate-x-full lg:translate-x-0': !sidebarOpen && windowWidth < 1024,
        'translate-x-0': sidebarOpen || windowWidth >= 1024
      }"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="p-6 border-b border-blue-700 flex-shrink-0">
          <router-link to="/" class="flex items-center hover:opacity-90 transition-opacity group">
            <span class="text-xl font-bold text-white">Warungin</span>
            <span class="ml-2 px-2 py-1 text-xs bg-blue-700 text-blue-100 rounded-full">Super Admin</span>
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <router-link
            to="/app/dashboard"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
            active-class="bg-blue-700 text-white font-semibold shadow-lg"
            exact-active-class="bg-blue-700 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="font-medium">Dashboard</span>
          </router-link>

          <router-link
            to="/app/tenants"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
            active-class="bg-blue-700 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span class="font-medium">Tenant Management</span>
          </router-link>

          <router-link
            to="/app/tenants/support"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
            active-class="bg-blue-700 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="font-medium">Tenant Support</span>
          </router-link>

          <router-link
            to="/app/addons"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
            active-class="bg-blue-700 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span class="font-medium">Addon Management</span>
          </router-link>

          <router-link
            to="/app/reports/global"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
            active-class="bg-blue-700 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="font-medium">Laporan Global</span>
          </router-link>

          <router-link
            to="/app/settings/system"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
            active-class="bg-blue-700 text-white font-semibold shadow-lg"
            @click="closeSidebarOnMobile"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="font-medium">System Settings</span>
          </router-link>

          <!-- Business Analytics Menu Section (Always visible for Super Admin) -->
          <div class="pt-4 mt-4 border-t border-blue-700">
            <p class="px-4 py-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">Business Analytics</p>
            
            <router-link
              to="/app/analytics"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
              active-class="bg-blue-700 text-white font-semibold shadow-lg"
              @click="closeSidebarOnMobile"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span class="font-medium">Advanced Analytics</span>
            </router-link>

            <router-link
              to="/app/finance"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
              active-class="bg-blue-700 text-white font-semibold shadow-lg"
              @click="closeSidebarOnMobile"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">Keuangan</span>
            </router-link>

            <router-link
              to="/app/profit-loss"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-700 hover:text-white group"
              active-class="bg-blue-700 text-white font-semibold shadow-lg"
              @click="closeSidebarOnMobile"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span class="font-medium">Laporan Laba Rugi</span>
            </router-link>
          </div>
        </nav>

        <!-- User Section -->
        <div class="p-4 border-t border-blue-700 flex-shrink-0">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-blue-100 font-semibold text-sm">{{ userInitials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ userName }}</p>
              <p class="text-xs text-blue-200 truncate">{{ userEmail }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full px-4 py-2 text-sm text-blue-100 hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sidebarOpen = ref(false);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

const userName = computed(() => authStore.user?.name || 'Super Admin');
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
    '/app/tenants': 'Tenant Management',
    '/app/tenants/support': 'Tenant Support',
    '/app/addons': 'Addon Management',
    '/app/reports/global': 'Laporan Global',
    '/app/settings/system': 'System Settings',
    '/app/analytics': 'Advanced Analytics',
    '/app/finance': 'Keuangan',
    '/app/profit-loss': 'Laporan Laba Rugi',
  };
  return titles[route.path] || 'Super Admin Dashboard';
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
  scrollbar-color: #1e40af transparent;
}

nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background-color: #1e40af;
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background-color: #1e3a8a;
}
</style>

