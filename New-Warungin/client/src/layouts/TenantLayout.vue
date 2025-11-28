<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex w-full">
    <!-- Sidebar - Green theme for Tenant -->
    <aside
      class="w-64 bg-gradient-to-b from-green-700 to-green-600 shadow-2xl fixed h-full z-50 transition-transform duration-300 ease-in-out"
      :class="{ 
        '-translate-x-full lg:translate-x-0': !sidebarOpen && windowWidth < 1024,
        'translate-x-0': sidebarOpen || windowWidth >= 1024
      }"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="p-6 border-b border-green-600 flex-shrink-0">
          <router-link to="/" class="flex items-center hover:opacity-90 transition-opacity group">
            <span class="text-xl font-bold text-white">Warungin</span>
            <span class="ml-2 px-2 py-1 text-xs bg-green-600 text-green-100 rounded-full">Owner</span>
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <!-- Operasional Section -->
          <div class="mb-2">
            <button
              @click="toggleMenu('operasional')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-green-300 uppercase tracking-wider hover:text-green-200 transition-colors"
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
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
              active-class="bg-green-600 text-white font-semibold shadow-lg"
              exact-active-class="bg-green-600 text-white font-semibold shadow-lg"
              @click="closeSidebarOnMobile"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span class="font-medium">Dashboard</span>
            </router-link>

            <router-link
              to="/app/products"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
              active-class="bg-green-600 text-white font-semibold shadow-lg"
              @click="closeSidebarOnMobile"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span class="font-medium">Produk</span>
            </router-link>

            <router-link
              v-if="authStore.user?.role === 'ADMIN_TENANT'"
              to="/app/products/adjustments"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
              active-class="bg-green-600 text-white font-semibold shadow-lg"
              @click="closeSidebarOnMobile"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="font-medium">Penyesuaian Produk</span>
            </router-link>

            <router-link
              to="/app/orders"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
              active-class="bg-green-600 text-white font-semibold shadow-lg"
              @click="closeSidebarOnMobile"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span class="font-medium">Pesanan</span>
            </router-link>

            <router-link
              to="/app/customers"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
              active-class="bg-green-600 text-white font-semibold shadow-lg"
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
          <div v-if="authStore.user?.role === 'ADMIN_TENANT'" class="pt-4 mt-4 border-t border-green-600">
            <button
              @click="toggleMenu('laporan')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-green-300 uppercase tracking-wider hover:text-green-200 transition-colors"
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
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="font-medium">Laporan</span>
              </router-link>

              <!-- Business Analytics Submenu -->
              <div v-if="hasBusinessAnalytics" class="ml-4 mt-1 space-y-1">
                <router-link
                  to="/app/analytics"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                  active-class="bg-green-600 text-white font-semibold shadow-lg"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span class="font-medium">Advanced Analytics</span>
                </router-link>

                <router-link
                  to="/app/finance"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                  active-class="bg-green-600 text-white font-semibold shadow-lg"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium">Keuangan</span>
                </router-link>

                <router-link
                  to="/app/profit-loss"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                  active-class="bg-green-600 text-white font-semibold shadow-lg"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span class="font-medium">Laporan Laba Rugi</span>
                </router-link>

                <router-link
                  to="/app/reports/advanced"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                  active-class="bg-green-600 text-white font-semibold shadow-lg"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="font-medium">Advanced Reporting</span>
                </router-link>

                <router-link
                  to="/app/finance/management"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                  active-class="bg-green-600 text-white font-semibold shadow-lg"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span class="font-medium">Financial Management</span>
                </router-link>

                <router-link
                  to="/app/ai-ml"
                  class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                  active-class="bg-green-600 text-white font-semibold shadow-lg"
                  @click="closeSidebarOnMobile"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span class="font-medium">AI/ML Features</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Marketing & Delivery Section -->
          <div v-if="authStore.user?.role === 'ADMIN_TENANT' && hasDeliveryMarketing" class="pt-4 mt-4 border-t border-green-600">
            <button
              @click="toggleMenu('marketing')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-green-300 uppercase tracking-wider hover:text-green-200 transition-colors"
            >
              <span>Marketing & Delivery</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': expandedMenus.marketing }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-show="expandedMenus.marketing"
              class="mt-1 space-y-1 transition-all duration-200"
            >
              <router-link
                to="/app/marketing"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span class="font-medium">Campaigns</span>
              </router-link>

              <router-link
                to="/app/marketing/email-templates"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span class="font-medium">Email Templates</span>
              </router-link>

              <router-link
                to="/app/marketing/email-analytics"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="font-medium">Email Analytics</span>
              </router-link>

              <router-link
                to="/app/marketing/email-scheduler"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Email Scheduler</span>
              </router-link>

              <router-link
                to="/app/marketing/customer-engagement"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span class="font-medium">Customer Engagement</span>
              </router-link>

              <router-link
                to="/app/delivery"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span class="font-medium">Delivery Orders</span>
              </router-link>
            </div>
          </div>

          <!-- Inventory Management Section -->
          <div v-if="authStore.user?.role === 'ADMIN_TENANT'" class="pt-4 mt-4 border-t border-green-600">
            <button
              @click="toggleMenu('inventory')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-green-300 uppercase tracking-wider hover:text-green-200 transition-colors"
            >
              <span>Inventory</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': expandedMenus.inventory }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-show="expandedMenus.inventory"
              class="mt-1 space-y-1 transition-all duration-200"
            >
              <router-link
                to="/app/inventory/suppliers"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span class="font-medium">Suppliers</span>
              </router-link>

              <router-link
                to="/app/inventory/purchase-orders"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="font-medium">Purchase Orders</span>
              </router-link>

              <router-link
                to="/app/inventory/stock-transfers"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span class="font-medium">Stock Transfers</span>
              </router-link>

              <router-link
                to="/app/inventory/stock-alerts"
                class="flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group text-sm"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="font-medium">Stock Alerts</span>
              </router-link>
            </div>
          </div>

          <!-- Manajemen Section -->
          <div v-if="authStore.user?.role === 'ADMIN_TENANT'" class="pt-4 mt-4 border-t border-green-600">
            <button
              @click="toggleMenu('manajemen')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-green-300 uppercase tracking-wider hover:text-green-200 transition-colors"
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
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span class="font-medium">Pengguna</span>
              </router-link>

              <router-link
                to="/app/stores"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="font-medium">Kelola Store</span>
              </router-link>

              <router-link
                to="/app/discounts"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Diskon</span>
              </router-link>
            </div>
          </div>

          <!-- Pengaturan Section -->
          <div v-if="authStore.user?.role === 'ADMIN_TENANT'" class="pt-4 mt-4 border-t border-green-600">
            <button
              @click="toggleMenu('pengaturan')"
              class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-green-300 uppercase tracking-wider hover:text-green-200 transition-colors"
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
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Berlangganan</span>
              </router-link>

              <router-link
                to="/app/addons"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span class="font-medium">Addon</span>
              </router-link>

              <router-link
                to="/app/rewards"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Point Gratis</span>
              </router-link>

              <router-link
                to="/app/settings/store"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="font-medium">Pengaturan Toko</span>
              </router-link>

              <router-link
                to="/app/receipts/templates"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="font-medium">Template Struk</span>
              </router-link>

              <router-link
                to="/app/settings/archive"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span class="font-medium">Archive Management</span>
              </router-link>

              <router-link
                to="/app/settings/retention"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-green-100 hover:bg-green-600 hover:text-white group"
                active-class="bg-green-600 text-white font-semibold shadow-lg"
                @click="closeSidebarOnMobile"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span class="font-medium">Retention Management</span>
              </router-link>
            </div>
          </div>
        </nav>

        <!-- User Section -->
        <div class="p-4 border-t border-green-600 flex-shrink-0">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-green-100 font-semibold text-sm">{{ userInitials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ userName }}</p>
              <p class="text-xs text-green-200 truncate">{{ tenantName }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full px-4 py-2 text-sm text-green-100 hover:bg-green-600 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2"
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
          <div class="flex items-center space-x-2">
            <!-- Notification Button for Admin Tenant -->
            <button
              v-if="authStore.user?.role === 'ADMIN_TENANT'"
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
          </div>
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
import AdminInfoModal from '../components/AdminInfoModal.vue';
import api from '../api';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sidebarOpen = ref(false);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const showInfoModal = ref(false);
const hasUnreadInfo = ref(false);
const activeAddons = ref<any[]>([]);
const hasBusinessAnalytics = computed(() => {
  return activeAddons.value.some(
    (addon: any) => addon.addonType === 'BUSINESS_ANALYTICS' && addon.status === 'active'
  );
});

const hasDeliveryMarketing = computed(() => {
  return activeAddons.value.some(
    (addon: any) => addon.addonType === 'DELIVERY_MARKETING' && addon.status === 'active'
  );
});

// Menu expand/collapse state
const expandedMenus = ref({
  operasional: true,
  laporan: true,
  marketing: false,
  inventory: false,
  manajemen: true,
  pengaturan: true,
});

// Toggle menu section - close other menus when opening one
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
const autoExpandMenu = () => {
  const currentPath = route.path;
  
  // Check which section contains the current route
  if (currentPath.includes('/dashboard') || currentPath.includes('/products') || 
      currentPath.includes('/orders') || currentPath.includes('/customers')) {
    expandedMenus.value.operasional = true;
  }
  
  if (currentPath.includes('/reports') || currentPath.includes('/analytics') || 
      currentPath.includes('/finance') || currentPath.includes('/profit-loss') ||
      currentPath.includes('/ai-ml')) {
    expandedMenus.value.laporan = true;
  }
  
  if (currentPath.includes('/marketing') || currentPath.includes('/delivery')) {
    expandedMenus.value.marketing = true;
  }
  
  if (currentPath.includes('/inventory')) {
    expandedMenus.value.inventory = true;
  }
  
  if (currentPath.includes('/users') || currentPath.includes('/stores') || 
      currentPath.includes('/discounts')) {
    expandedMenus.value.manajemen = true;
  }
  
  if (currentPath.includes('/subscription') || currentPath.includes('/addons') || 
      currentPath.includes('/settings')) {
    expandedMenus.value.pengaturan = true;
  }
};

// Load saved menu state from localStorage
const loadMenuState = () => {
  const saved = localStorage.getItem('expandedMenus');
  if (saved) {
    try {
      expandedMenus.value = { ...expandedMenus.value, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load menu state:', e);
    }
  }
  // Auto-expand based on current route
  autoExpandMenu();
};

// Check if info modal should be shown (once per day)
const checkShouldShowInfo = () => {
  if (authStore.user?.role !== 'ADMIN_TENANT') {
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
  if (authStore.user?.role !== 'ADMIN_TENANT') {
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

// Load active addons
const loadAddons = async () => {
  if (authStore.user?.role === 'ADMIN_TENANT') {
    try {
      const response = await api.get('/addons');
      activeAddons.value = response.data || [];
    } catch (error) {
      console.error('Failed to load addons:', error);
      activeAddons.value = [];
    }
  }
};

// Watch for role changes to check info status
watch(() => authStore.user?.role, () => {
  checkUnreadInfo();
  if (checkShouldShowInfo()) {
    showInfoModal.value = true;
  }
  loadAddons();
}, { immediate: true });

// Watch route changes to auto-expand menu
watch(() => route.path, () => {
  autoExpandMenu();
}, { immediate: true });

// Load menu state on mount
onMounted(() => {
  loadMenuState();
});

const userName = computed(() => authStore.user?.name || 'Tenant');
const userEmail = computed(() => authStore.user?.email || '');
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
    '/app/dashboard': 'Dashboard',
    '/app/products': 'Produk',
    '/app/orders': 'Pesanan',
    '/app/customers': 'Pelanggan',
    '/app/reports': 'Laporan',
    '/app/users': 'Pengguna',
    '/app/subscription': 'Berlangganan',
    '/app/addons': 'Addon',
    '/app/discounts': 'Diskon',
    '/app/settings/store': 'Pengaturan Toko',
    '/app/analytics': 'Advanced Analytics',
    '/app/finance': 'Keuangan',
    '/app/profit-loss': 'Laporan Laba Rugi',
    '/app/reports/advanced': 'Advanced Reporting',
    '/app/finance/management': 'Financial Management',
    '/app/ai-ml': 'AI/ML Features',
  };
  return titles[route.path] || 'Dashboard';
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
  
  // Check and show info modal for Admin Tenant (once per day)
  if (checkShouldShowInfo()) {
    showInfoModal.value = true;
  }
  checkUnreadInfo();
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
nav {
  scrollbar-width: thin;
  scrollbar-color: #059669 transparent;
}

nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background-color: #059669;
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background-color: #047857;
}
</style>

