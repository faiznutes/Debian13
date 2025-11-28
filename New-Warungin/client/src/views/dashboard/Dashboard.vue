<template>
  <div class="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h2>
        <p class="text-sm sm:text-base text-gray-600">Ringkasan bisnis Anda dalam satu tempat</p>
      </div>
      <div class="w-full sm:w-auto flex items-center gap-2 sm:gap-4">
        <select
          v-model="dateRange"
          @change="loadStats"
          class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium shadow-sm hover:shadow-md transition"
        >
          <option value="today">Hari Ini</option>
          <option value="week">Minggu Ini</option>
          <option value="month">Bulan Ini</option>
          <option value="year">Tahun Ini</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div class="text-gray-600 font-medium">Memuat data...</div>
    </div>

    <!-- Kasir Dashboard -->
    <div v-else-if="userRole === 'CASHIER'" class="flex flex-col gap-6 px-4 sm:px-6 pb-4 sm:pb-6">
      <!-- Welcome Section -->
      <div class="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-xl p-6 sm:p-8 text-white">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex-1">
            <h2 class="text-2xl sm:text-3xl font-bold mb-2">Selamat Datang, Kasir!</h2>
            <p class="text-primary-100 text-base sm:text-lg">Mulai transaksi baru untuk melayani pelanggan</p>
          </div>
          <div class="hidden md:block flex-shrink-0">
            <svg class="w-24 h-24 sm:w-32 sm:h-32 text-primary-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div class="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg hover:shadow-xl transition-all p-5 sm:p-6 border border-orange-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Transaksi Hari Ini</span>
            <div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{{ cashierStats?.todayTransactions || 0 }}</p>
          <p class="text-xs sm:text-sm text-gray-600">Total transaksi hari ini</p>
        </div>

        <div class="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg hover:shadow-xl transition-all p-5 sm:p-6 border border-green-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Pendapatan Hari Ini</span>
            <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{{ formatCurrency(cashierStats?.todayRevenue || 0) }}</p>
          <p class="text-xs sm:text-sm text-gray-600">Total pendapatan hari ini</p>
        </div>

        <div class="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-all p-5 sm:p-6 border border-blue-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Rata-rata per Transaksi</span>
            <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{{ formatCurrency(cashierStats?.averageTransaction || 0) }}</p>
          <p class="text-xs sm:text-sm text-gray-600">Rata-rata nilai transaksi</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200">
        <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">Aksi Cepat</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <router-link
            to="/app/pos"
            class="flex items-center p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl hover:from-primary-100 hover:to-primary-200 transition-all duration-200 border-2 border-primary-200 hover:border-primary-400 hover:shadow-lg group"
          >
            <div class="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-md">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span class="font-bold text-gray-900 block text-base">Buka Kasir</span>
              <span class="text-xs sm:text-sm text-gray-600">Buat transaksi baru</span>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Kitchen Dashboard -->
    <div v-else-if="userRole === 'KITCHEN'" class="flex flex-col gap-6 px-4 sm:px-6 pb-4 sm:pb-6">
      <!-- Welcome Section -->
      <div class="bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl shadow-xl p-6 sm:p-8 text-white">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex-1">
            <h2 class="text-2xl sm:text-3xl font-bold mb-2">Selamat Datang, Kitchen!</h2>
            <p class="text-red-100 text-base sm:text-lg">Kelola pesanan yang masuk dari kasir</p>
          </div>
          <div class="hidden md:block flex-shrink-0">
            <svg class="w-24 h-24 sm:w-32 sm:h-32 text-red-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div class="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-lg hover:shadow-xl transition-all p-5 sm:p-6 border border-yellow-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Pesanan Pending</span>
            <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{{ kitchenStats?.pendingOrders || 0 }}</p>
          <p class="text-xs sm:text-sm text-gray-600">Menunggu diproses</p>
        </div>

        <div class="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg hover:shadow-xl transition-all p-5 sm:p-6 border border-orange-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Sedang Dimasak</span>
            <div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{{ kitchenStats?.cookingOrders || 0 }}</p>
          <p class="text-xs sm:text-sm text-gray-600">Sedang dalam proses</p>
        </div>

        <div class="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg hover:shadow-xl transition-all p-5 sm:p-6 border border-green-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Pesanan Siap</span>
            <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{{ kitchenStats?.readyOrders || 0 }}</p>
          <p class="text-xs sm:text-sm text-gray-600">Siap untuk dikirim</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200">
        <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">Aksi Cepat</h3>
        <router-link
          to="/app/orders/kitchen"
          class="flex items-center p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-200 border-2 border-red-200 hover:border-red-400 hover:shadow-lg group"
        >
          <div class="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-md">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <span class="font-bold text-gray-900 block text-base">Lihat Pesanan Masuk</span>
            <span class="text-xs sm:text-sm text-gray-600">Kelola pesanan dari kasir</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Super Admin Dashboard (when no tenant selected) -->
    <div v-else-if="authStore.isSuperAdmin && !authStore.selectedTenantId" class="flex flex-col gap-6 sm:gap-8 px-4 sm:px-6 pb-6 sm:pb-8">
      <!-- Hero Section with Gradient -->
      <div class="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 sm:p-12 text-white overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div class="flex-1">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 drop-shadow-lg">Selamat Datang, Super Admin! 👋</h2>
            <p class="text-indigo-100 text-lg sm:text-xl mb-4">Kelola penjualan addon dan langganan dengan mudah</p>
            <div class="flex flex-wrap gap-3 mt-4">
              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p class="text-xs text-indigo-100">Total Pendapatan Global</p>
                <p class="text-xl font-bold">{{ formatCurrency(globalReportData?.summary?.totalGlobalRevenue || 0) }}</p>
              </div>
              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p class="text-xs text-indigo-100">Active Subscriptions</p>
                <p class="text-xl font-bold">{{ stats?.overview?.activeSubscriptions || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="hidden lg:block flex-shrink-0">
            <div class="w-40 h-40 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg class="w-24 h-24 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700">Periode:</label>
            <select
              v-model="superAdminDateRange"
              @change="loadSuperAdminStats"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
            </select>
          </div>
          <div class="text-sm text-gray-600">
            {{ getDateRangeLabel() }}
          </div>
        </div>
      </div>

      <!-- Revenue Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <router-link
          to="/app/reports/global"
          class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all p-4 sm:p-6 border border-green-200 hover:border-green-300"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Pendapatan Global</span>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{{ formatCurrency(globalReportData?.summary?.totalGlobalRevenue || stats?.overview?.totalRevenue || 0) }}</p>
          <p class="text-xs sm:text-sm text-gray-600">Orders + Subscriptions + Addons</p>
        </router-link>

        <router-link
          to="/app/reports/global"
          class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all p-4 sm:p-6 border border-purple-200 hover:border-purple-300"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Pendapatan Subscription</span>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{{ formatCurrency(globalReportData?.summary?.totalSubscriptionRevenue || stats?.overview?.totalSubscriptionRevenue || 0) }}</p>
          <p class="text-xs sm:text-sm text-gray-600">{{ stats?.overview?.activeSubscriptions || 0 }} langganan aktif</p>
        </router-link>

        <router-link
          to="/app/reports/global"
          class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all p-4 sm:p-6 border border-blue-200 hover:border-blue-300"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Pendapatan Addons</span>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{{ formatCurrency(globalReportData?.summary?.totalAddonRevenue || stats?.overview?.totalAddonRevenue || 0) }}</p>
          <p class="text-xs sm:text-sm text-gray-600">{{ stats?.overview?.totalAddons || 0 }} addon terjual</p>
        </router-link>

        <router-link
          to="/app/tenants"
          class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg hover:shadow-xl transition-all p-4 sm:p-6 border border-orange-200 hover:border-orange-300"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Tenant</span>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{{ stats?.overview?.totalTenants || superAdminStats?.totalTenants || 0 }}</p>
          <p class="text-xs sm:text-sm text-gray-600">{{ stats?.overview?.activeTenants || superAdminStats?.activeTenants || 0 }} tenant aktif</p>
        </router-link>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div class="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-2 border-blue-200 hover:border-blue-300">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Tenant</p>
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900">{{ stats?.overview?.totalTenants || 0 }}</p>
          <p class="text-xs text-gray-600 mt-1">Semua tenant terdaftar</p>
        </div>

        <div class="group bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-2 border-green-200 hover:border-green-300">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tenant Aktif</p>
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900">{{ stats?.overview?.activeTenants || 0 }}</p>
          <p class="text-xs text-gray-600 mt-1">Dengan langganan aktif</p>
        </div>

        <div class="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-2 border-purple-200 hover:border-purple-300">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Pengguna</p>
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl sm:text-4xl font-bold text-gray-900">{{ stats?.overview?.totalUsers || 0 }}</p>
          <p class="text-xs text-gray-600 mt-1">Semua pengguna sistem</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
        <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Aksi Cepat</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <router-link
            to="/app/reports/global"
            class="group relative flex flex-col p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div class="relative z-10">
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 class="font-bold text-lg mb-1">Laporan Global</h4>
              <p class="text-blue-100 text-sm">Lihat laporan addon & langganan</p>
            </div>
          </router-link>

          <router-link
            to="/app/reports/global"
            class="group relative flex flex-col p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div class="relative z-10">
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 class="font-bold text-lg mb-1">Laporan Subscription</h4>
              <p class="text-purple-100 text-sm">Lihat laporan subscription</p>
            </div>
          </router-link>

          <router-link
            to="/app/addons"
            class="group relative flex flex-col p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div class="relative z-10">
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 class="font-bold text-lg mb-1">Kelola Addon</h4>
              <p class="text-green-100 text-sm">Lihat penjualan addon</p>
            </div>
          </router-link>

          <router-link
            to="/app/tenants"
            class="group relative flex flex-col p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div class="relative z-10">
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 class="font-bold text-lg mb-1">Kelola Tenant</h4>
              <p class="text-orange-100 text-sm">Lihat dan kelola semua tenant</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Top Subscriptions & Subscription Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <!-- Top Subscription Plans -->
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Paket Subscription Terlaris</h3>
            <router-link to="/app/reports/global" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Lihat Semua
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
          <div v-if="!stats?.subscriptionBreakdown || stats.subscriptionBreakdown.length === 0" class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Belum ada subscription</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(plan, index) in stats.subscriptionBreakdown.sort((a: any, b: any) => b.count - a.count).slice(0, 5)"
              :key="plan.plan"
              class="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-purple-50 hover:to-pink-50 transition-all border border-gray-100 hover:border-purple-200 hover:shadow-md"
            >
              <div class="flex items-center space-x-4 flex-1">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  <span class="text-white font-bold text-lg">{{ index + 1 }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-gray-900 text-base truncate">{{ getPlanName(plan.plan) }}</p>
                  <p class="text-sm text-gray-600">{{ plan.count }} pembelian</p>
                </div>
              </div>
              <div class="text-right ml-4">
                <p class="font-bold text-primary-600 text-lg">{{ formatCurrency(getPlanPrice(plan.plan) * plan.count) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscription by Status -->
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Subscription Berdasarkan Status</h3>
            <router-link to="/app/reports/global" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Lihat Semua
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
          <div v-if="!globalReportData?.subscriptions || globalReportData.subscriptions.length === 0" class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Belum ada data subscription</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="statusGroup in getSubscriptionStatusGroups()"
              :key="statusGroup.status"
              class="group"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="px-4 py-2 text-sm font-semibold rounded-full" :class="getSubscriptionStatusClass(statusGroup.status)">
                  {{ getSubscriptionStatusLabel(statusGroup.status) }}
                </span>
                <span class="text-lg font-bold text-gray-900">{{ statusGroup.count }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  class="h-3 rounded-full transition-all duration-500"
                  :class="getSubscriptionStatusColor(statusGroup.status)"
                  :style="{ width: `${(statusGroup.count / (globalReportData.subscriptions.length || 1)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Addon Purchases -->
      <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Pembelian Addon Terbaru</h3>
          <router-link to="/app/addons" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
            Lihat Semua
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>
        <div v-if="!stats?.recentAddons || stats.recentAddons.length === 0" class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p>Belum ada pembelian addon</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="addon in stats.recentAddons.slice(0, 5)"
            :key="addon.id"
            class="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-purple-50 hover:to-pink-50 transition-all border border-gray-100 hover:border-purple-200 hover:shadow-md"
          >
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-900 text-base truncate">{{ addon.tenantName }}</p>
              <p class="text-sm text-gray-600">{{ addon.addonName }} • {{ formatDateTime(addon.subscribedAt) }}</p>
            </div>
            <div class="text-right ml-4 flex-shrink-0">
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-semibold',
                addon.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              ]">
                {{ addon.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tenant Stats (when tenant is selected) -->
    <div v-else-if="stats" class="flex flex-col gap-6 sm:gap-8 px-4 sm:px-6 pb-6 sm:pb-8">
      <!-- Loading State for Subscription (Admin/Supervisor only) -->
      <div v-if="isAdminOrSupervisor && subscriptionLoading" class="relative bg-gradient-to-br from-primary-600 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 sm:p-12 text-white overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="relative z-10 flex items-center justify-center py-8">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p class="text-primary-100 text-lg">Memuat informasi langganan...</p>
          </div>
        </div>
      </div>
      
      <!-- Hero Section with Subscription -->
      <div v-else-if="isAdminOrSupervisor && currentSubscription" class="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl p-8 sm:p-12 text-white overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-4">
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold">Dashboard Bisnis Anda</h2>
              <span
                class="px-4 py-1.5 text-sm font-bold rounded-full backdrop-blur-sm"
                :class="currentSubscription?.isExpired ? 'bg-red-500 bg-opacity-80 text-white' : 'bg-green-500 bg-opacity-80 text-white'"
              >
                {{ currentSubscription?.isExpired ? 'Kedaluwarsa' : 'Aktif' }}
              </span>
            </div>
            <div class="mb-4">
              <p class="text-emerald-100 text-lg sm:text-xl mb-2">Paket: <span class="font-bold text-white">{{ getPlanName(currentSubscription?.plan || 'BASIC') }}</span></p>
              <p class="text-emerald-100 text-sm sm:text-base">Berakhir: {{ formatDate(currentSubscription?.subscription?.endDate) }}</p>
              <p v-if="currentSubscription?.daysRemaining !== undefined" class="text-white font-bold text-lg mt-2">
                {{ currentSubscription.daysRemaining > 0 || (currentSubscription.hoursRemaining && currentSubscription.hoursRemaining > 0) 
                  ? `${formatRemainingTime(
                      currentSubscription.daysRemaining || 0,
                      currentSubscription.hoursRemaining,
                      currentSubscription.minutesRemaining,
                      currentSubscription.secondsRemaining
                    )} tersisa` 
                  : 'Langganan telah kedaluwarsa' }}
              </p>
            </div>
          </div>
          <div class="flex-shrink-0 w-full lg:w-auto">
            <router-link
              to="/app/subscription"
              class="block px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white rounded-xl transition-all font-semibold text-center border-2 border-white border-opacity-30 hover:border-opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upgrade/Perpanjang</span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- Welcome Section (if no subscription and subscription is loaded) -->
      <div v-else-if="showWelcomeSection" class="relative bg-gradient-to-br from-primary-600 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 sm:p-12 text-white overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div class="relative z-10">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 drop-shadow-lg">Selamat Datang! 👋</h2>
          <p class="text-primary-100 text-lg sm:text-xl">Kelola bisnis Anda dengan mudah dari satu tempat</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <router-link
          to="/app/reports"
          class="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1 overflow-hidden relative"
        >
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-semibold text-green-100 uppercase tracking-wide">Total Pendapatan</span>
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-3xl sm:text-4xl font-bold mb-3">{{ formatCurrency(stats?.overview?.totalRevenue || 0) }}</p>
            <div class="flex items-center">
              <span :class="stats?.overview?.revenueGrowth >= 0 ? 'text-green-100' : 'text-red-200'" class="flex items-center text-sm font-semibold">
                <svg v-if="stats?.overview?.revenueGrowth >= 0" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {{ stats?.overview?.revenueGrowth >= 0 ? '+' : '' }}{{ stats?.overview?.revenueGrowth?.toFixed(1) || 0 }}%
              </span>
              <span class="text-xs text-green-100 ml-2">vs periode lalu</span>
            </div>
          </div>
        </router-link>

        <router-link
          to="/app/orders"
          class="group bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1 overflow-hidden relative"
        >
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-semibold text-blue-100 uppercase tracking-wide">Total Pesanan</span>
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p class="text-3xl sm:text-4xl font-bold mb-3">{{ stats?.overview?.totalOrders || 0 }}</p>
            <p class="text-sm text-blue-100">
              <span class="font-bold text-white">{{ stats?.overview?.todayOrders || 0 }}</span> pesanan hari ini
            </p>
          </div>
        </router-link>

        <router-link
          to="/app/products"
          class="group bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1 overflow-hidden relative"
        >
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-semibold text-purple-100 uppercase tracking-wide">Total Produk</span>
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p class="text-3xl sm:text-4xl font-bold mb-3">{{ stats?.overview?.totalProducts || 0 }}</p>
            <p class="text-sm text-purple-100">
              <span class="font-bold text-white">{{ stats?.alerts?.lowStockProducts || 0 }}</span> produk stok rendah
            </p>
          </div>
        </router-link>

        <router-link
          to="/app/customers"
          class="group bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1 overflow-hidden relative"
        >
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-semibold text-indigo-100 uppercase tracking-wide">Total Pelanggan</span>
              <div class="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p class="text-3xl sm:text-4xl font-bold mb-3">{{ stats?.overview?.totalCustomers || 0 }}</p>
            <p class="text-sm text-indigo-100">
              <span class="font-bold text-white">{{ stats?.overview?.totalMembers || 0 }}</span> member aktif
            </p>
          </div>
        </router-link>
      </div>

      <!-- Quick Insight Widget (always visible for Super Admin, or if Business Analytics addon is active for Admin Tenant) -->
      <QuickInsightWidget v-if="authStore.isSuperAdmin || hasBusinessAnalytics" class="mb-6" />

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
        <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Aksi Cepat</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <router-link
            to="/app/pos"
            class="group flex flex-col items-center p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all border-2 border-green-200 hover:border-green-400 hover:shadow-lg"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span class="font-semibold text-gray-900 text-sm text-center">POS</span>
          </router-link>

          <router-link
            to="/app/products"
            class="group flex flex-col items-center p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition-all border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span class="font-semibold text-gray-900 text-sm text-center">Produk</span>
          </router-link>

          <router-link
            to="/app/orders"
            class="group flex flex-col items-center p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span class="font-semibold text-gray-900 text-sm text-center">Pesanan</span>
          </router-link>

          <router-link
            to="/app/customers"
            class="group flex flex-col items-center p-5 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl hover:from-indigo-100 hover:to-violet-100 transition-all border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span class="font-semibold text-gray-900 text-sm text-center">Pelanggan</span>
          </router-link>

          <router-link
            to="/app/reports"
            class="group flex flex-col items-center p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span class="font-semibold text-gray-900 text-sm text-center">Laporan</span>
          </router-link>
        </div>
      </div>


      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <!-- Top Products -->
        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 sm:p-8 border border-gray-200">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Produk Terlaris</h3>
            <router-link to="/app/products" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Lihat Semua
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
          <div v-if="stats?.charts?.topProducts?.length === 0" class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>Belum ada data produk</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in stats?.charts?.topProducts?.slice(0, 5)"
              :key="item.product?.id"
              class="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all border border-gray-100 hover:border-blue-200 hover:shadow-md"
            >
              <div class="flex items-center space-x-4 flex-1">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  <span class="text-white font-bold text-lg">{{ index + 1 }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-gray-900 text-base truncate">{{ item.product?.name || 'Unknown' }}</p>
                  <p class="text-sm text-gray-600">{{ item.totalQuantity }} terjual</p>
                </div>
              </div>
              <div class="text-right ml-4">
                <p class="font-bold text-primary-600 text-lg">{{ formatCurrency(Number(item.totalRevenue)) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sales by Status -->
        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 sm:p-8 border border-gray-200">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Pesanan Berdasarkan Status</h3>
            <router-link to="/app/orders" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Lihat Semua
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
          <div v-if="stats?.charts?.salesByStatus?.length === 0" class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Belum ada data pesanan</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="item in stats?.charts?.salesByStatus"
              :key="item.status"
              class="group"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="px-4 py-2 text-sm font-semibold rounded-full" :class="getStatusClass(item.status)">
                  {{ getStatusLabel(item.status) }}
                </span>
                <span class="text-lg font-bold text-gray-900">{{ item.count }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  class="h-3 rounded-full transition-all duration-500"
                  :class="{
                    'bg-yellow-500': item.status === 'PENDING',
                    'bg-blue-500': item.status === 'PROCESSING',
                    'bg-green-500': item.status === 'COMPLETED',
                    'bg-red-500': item.status === 'CANCELLED',
                    'bg-gray-500': item.status === 'REFUNDED'
                  }"
                  :style="{ width: `${(item.count / (stats?.overview?.totalOrders || 1)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import api from '../../api';
import { formatCurrency, formatDateTime, formatRemainingTime } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import Chart from 'chart.js/auto';
import { useNotification } from '../../composables/useNotification';
import QuickInsightWidget from '../../components/QuickInsightWidget.vue';

const authStore = useAuthStore();
const { error: showError } = useNotification();
const loading = ref(false);
const dateRange = ref('today');
const superAdminDateRange = ref('month'); // Default bulan ini untuk super admin
const stats = ref<any>(null);
const globalReportData = ref<any>(null);
const superAdminStats = ref({
  totalTenants: 0,
  totalUsers: 0,
  activeTenants: 0,
});
const recentTenants = ref<any[]>([]);
const cashierStats = ref<{
  todayTransactions: number;
  todayRevenue: number;
  averageTransaction: number;
  recentTransactions?: any[];
}>({
  todayTransactions: 0,
  todayRevenue: 0,
  averageTransaction: 0,
  recentTransactions: [],
});
const kitchenStats = ref<{
  pendingOrders: number;
  cookingOrders: number;
  readyOrders: number;
  totalOrders?: number;
}>({
  pendingOrders: 0,
  cookingOrders: 0,
  readyOrders: 0,
  totalOrders: 0,
});
const currentSubscription = ref<any>(null);
const subscriptionLoading = ref(false);
const isReloadingSubscription = ref(false); // Flag to prevent multiple reloads
const activeAddons = ref<any[]>([]);

const userRole = computed(() => authStore.user?.role || '');
const isAdminOrSupervisor = computed(() => userRole.value === 'ADMIN_TENANT' || userRole.value === 'SUPERVISOR');
const hasBusinessAnalytics = computed(() => {
  return activeAddons.value.some(
    (addon) => addon.addonType === 'BUSINESS_ANALYTICS' && addon.status === 'active'
  );
});
const showWelcomeSection = computed(() => {
  // For admin/supervisor, wait for subscription to finish loading before showing welcome
  if (isAdminOrSupervisor.value) {
    // Only show welcome section after subscription loading is complete and no subscription exists
    return !subscriptionLoading.value && currentSubscription.value === null;
  }
  // For other roles, show welcome section if no subscription (they don't load subscription)
  return currentSubscription.value === null;
});

let topProductsChart: Chart | null = null;
let salesByStatusChart: Chart | null = null;

const getDateRange = () => {
  const now = new Date();
  const startDate = new Date();
  
  switch (dateRange.value) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { startDate, endDate: now };
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REFUNDED: 'Refund',
  };
  return labels[status] || status;
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
};

const getPlanName = (plan: string) => {
  const planNames: Record<string, string> = {
    BASIC: 'Starter',
    PRO: 'Boost',
    ENTERPRISE: 'Max',
    STARTER: 'Starter',
    BOOST: 'Boost',
    MAX: 'Max',
  };
  return planNames[plan] || plan;
};

const getPlanPrice = (plan: string) => {
  const prices: Record<string, number> = {
    BASIC: 200000,
    PRO: 350000,
    ENTERPRISE: 500000,
  };
  return prices[plan] || 0;
};

const getSubscriptionStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getSubscriptionStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ACTIVE: 'Aktif',
    EXPIRED: 'Kedaluwarsa',
    CANCELLED: 'Dibatalkan',
  };
  return labels[status] || status;
};

const getSubscriptionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-500',
    EXPIRED: 'bg-red-500',
    CANCELLED: 'bg-gray-500',
  };
  return colors[status] || 'bg-gray-500';
};

const getSubscriptionStatusGroups = () => {
  if (!globalReportData.value?.subscriptions) return [];
  
  const statusMap = new Map<string, number>();
  globalReportData.value.subscriptions.forEach((sub: any) => {
    const status = sub.status || 'UNKNOWN';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });
  
  return Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));
};

const getSuperAdminDateRange = () => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  
  switch (superAdminDateRange.value) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
  }
  
  return { startDate, endDate };
};

const getDateRangeLabel = () => {
  const { startDate, endDate } = getSuperAdminDateRange();
  return `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`;
};

const loadSuperAdminStats = async () => {
  try {
    // Load stats from API (includes addon & subscription revenue) - ini cepat
    const response = await api.get('/dashboard/stats');
    stats.value = response.data;
    
    // Load global report data dan tenants secara lazy (tidak di awal)
    // Akan di-load saat user klik atau saat dibutuhkan
    // Ini akan mempercepat initial load
  } catch (error: any) {
    // Don't show alert if user is not authenticated (likely logged out)
    if (!authStore.isAuthenticated) {
      return;
    }
    
    // Suppress errors during logout (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return;
    }
    
    // Handle database connection errors (503)
    if (error.response?.status === 503) {
      console.error('Database connection error:', error.response?.data?.message);
      await showError('Koneksi database terputus. Silakan periksa konfigurasi database atau hubungi administrator.');
      return;
    }
    
    console.error('Error loading super admin stats:', error);
    const errorMessage = error.response?.data?.message || 'Gagal memuat statistik super admin';
    await showError(errorMessage);
  }
};

const loadCashierStats = async () => {
  if (!authStore.isAuthenticated) return;
  
  try {
    const response = await api.get('/dashboard/stats/cashier');
    cashierStats.value = {
      todayTransactions: response.data.todayTransactions || response.data.todayOrders || 0,
      todayRevenue: response.data.todayRevenue || 0,
      averageTransaction: response.data.averageTransaction || 0,
      recentTransactions: response.data.recentTransactions || [],
    };
  } catch (error: any) {
    // Suppress errors during logout (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return;
    }
    // Suppress database connection errors (503) - will be handled by main loadStats
    if (error.response?.status === 503) {
      return;
    }
    console.error('Error loading cashier stats:', error);
  }
};

const loadKitchenStats = async () => {
  if (!authStore.isAuthenticated) return;
  
  try {
    const response = await api.get('/dashboard/stats/kitchen');
    kitchenStats.value = {
      pendingOrders: response.data.pendingOrders || 0,
      cookingOrders: response.data.cookingOrders || 0,
      readyOrders: response.data.readyOrders || 0,
      totalOrders: response.data.totalOrders || 0,
    };
  } catch (error: any) {
    // Suppress errors during logout (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return;
    }
    // Suppress database connection errors (503) - will be handled by main loadStats
    if (error.response?.status === 503) {
      return;
    }
    console.error('Error loading kitchen stats:', error);
  }
};

const loadStats = async () => {
  // Don't load stats if user is not authenticated (e.g., after logout)
  if (!authStore.isAuthenticated) {
    return;
  }

  // Load subscription first for admin/supervisor to prevent flash
  if (isAdminOrSupervisor.value) {
    await loadSubscription();
    await loadAddons();
  }

  // For Super Admin, check if tenant is selected
  if (authStore.isSuperAdmin) {
    if (!authStore.selectedTenantId) {
      // No tenant selected, load super admin stats
      loading.value = false;
      stats.value = null;
      await loadSuperAdminStats();
      return;
    }
    // Tenant selected, load stats for that tenant
  }

  // For Cashier, load cashier-specific stats
  if (userRole.value === 'CASHIER') {
    loading.value = false;
    await loadCashierStats();
    return;
  }

  // For Kitchen, load kitchen-specific stats
  if (userRole.value === 'KITCHEN') {
    loading.value = false;
    await loadKitchenStats();
    return;
  }

  loading.value = true;
  try {
    const { startDate, endDate } = getDateRange();
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    
    // Add tenantId if SUPER_ADMIN has selected tenant
    if (authStore.isSuperAdmin && authStore.selectedTenantId) {
      params.tenantId = authStore.selectedTenantId;
    }
    
    const response = await api.get('/dashboard/stats', { params });
    stats.value = response.data;
    renderCharts();
  } catch (error: any) {
    // Don't show alert if user is not authenticated (likely logged out)
    if (!authStore.isAuthenticated) {
      return;
    }
    
    // Suppress errors during logout (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Unauthorized - user may have logged out');
      return;
    }
    
    // Handle database connection errors (503)
    if (error.response?.status === 503) {
      console.error('Database connection error:', error.response?.data?.message);
      await showError('Koneksi database terputus. Silakan periksa konfigurasi database atau hubungi administrator.');
      return;
    }
    
    // Handle validation errors (400) - might be tenant ID required
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || 'Gagal memuat statistik';
      // If it's tenant ID required, don't show alert (will be handled by tenant selector)
      if (errorMessage.includes('Tenant ID') || errorMessage.includes('tenant')) {
        console.log('Tenant ID required - will be handled by tenant selector');
        return;
      }
      console.error('Error loading stats:', error);
      await showError(errorMessage);
      return;
    }
    
    console.error('Error loading stats:', error);
    const errorMessage = error.response?.data?.message || 'Gagal memuat statistik';
    await showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const currentTime = ref(new Date());
let countdownInterval: NodeJS.Timeout | null = null;

const loadAddons = async () => {
  try {
    const response = await api.get('/addons');
    activeAddons.value = response.data || [];
  } catch (error: any) {
    // Silently fail if addons can't be loaded
    console.error('Error loading addons:', error);
    activeAddons.value = [];
  }
};

const loadSubscription = async () => {
  subscriptionLoading.value = true;
  try {
    const response = await api.get('/subscriptions/current');
    if (response.data) {
      currentSubscription.value = response.data;
      
      // IMPORTANT: Use isExpired from backend response directly
      // Don't recalculate isExpired based on subscriptionEnd to avoid flash to expired
      // Backend already calculated isExpired correctly after revert
      if (response.data.isExpired !== undefined) {
        // Use isExpired from backend
        currentSubscription.value.isExpired = response.data.isExpired;
      }
      
      // Use daysRemaining, hoursRemaining, minutesRemaining, secondsRemaining from backend if available
      // Only calculate if backend didn't provide these values
      if (response.data.daysRemaining === undefined && response.data.subscription?.endDate) {
        // Calculate days remaining only if backend didn't provide
        const endDate = new Date(response.data.subscription.endDate);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        
        // Calculate hours, minutes, seconds for countdown
        if (diffTime > 0) {
          const totalSeconds = Math.floor(diffTime / 1000);
          const totalMinutes = Math.floor(totalSeconds / 60);
          const totalHours = Math.floor(totalMinutes / 60);
          const days = Math.floor(totalHours / 24);
          
          currentSubscription.value.daysRemaining = days;
          currentSubscription.value.hoursRemaining = totalHours % 24;
          currentSubscription.value.minutesRemaining = totalMinutes % 60;
          currentSubscription.value.secondsRemaining = totalSeconds % 60;
        } else {
          currentSubscription.value.daysRemaining = 0;
          currentSubscription.value.hoursRemaining = 0;
          currentSubscription.value.minutesRemaining = 0;
          currentSubscription.value.secondsRemaining = 0;
        }
      }
      
      // Start countdown if subscription exists and has endDate
      // Always start countdown if subscription exists and has endDate
      // The countdown will handle expired state internally
      if (currentSubscription.value && currentSubscription.value.subscription?.endDate) {
        // Initialize countdown values from backend response
        if (currentSubscription.value.daysRemaining !== undefined) {
          // Backend already calculated, use those values
          startCountdown();
        } else {
          // Calculate from endDate if backend didn't provide
          const endDate = new Date(currentSubscription.value.subscription.endDate);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          
          if (diffTime > 0) {
            const totalSeconds = Math.floor(diffTime / 1000);
            const totalMinutes = Math.floor(totalSeconds / 60);
            const totalHours = Math.floor(totalMinutes / 60);
            const days = Math.floor(totalHours / 24);
            
            currentSubscription.value.daysRemaining = days;
            currentSubscription.value.hoursRemaining = totalHours % 24;
            currentSubscription.value.minutesRemaining = totalMinutes % 60;
            currentSubscription.value.secondsRemaining = totalSeconds % 60;
            currentSubscription.value.isExpired = false;
          } else {
            currentSubscription.value.isExpired = true;
            currentSubscription.value.daysRemaining = 0;
            currentSubscription.value.hoursRemaining = 0;
            currentSubscription.value.minutesRemaining = 0;
            currentSubscription.value.secondsRemaining = 0;
          }
          
          startCountdown();
        }
      }
    } else {
      currentSubscription.value = null;
    }
  } catch (error: any) {
    // Ignore 404 or other errors - subscription might not exist yet
    if (error.response?.status !== 404 && error.response?.status !== 429) {
      console.error('Error loading subscription:', error);
    }
    currentSubscription.value = null;
  } finally {
    subscriptionLoading.value = false;
  }
};

// Countdown real-time
const startCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    currentTime.value = new Date();
    
    // Update subscription remaining time if subscription exists
    if (currentSubscription.value && currentSubscription.value.subscription?.endDate) {
      const endDate = new Date(currentSubscription.value.subscription.endDate);
      const diffTime = endDate.getTime() - currentTime.value.getTime();
      
      // Only update if there's still time remaining (diffTime > 0)
      // If diffTime <= 0, mark as expired but don't stop countdown immediately
      // This allows the UI to show "0 hari" or "Kadaluwarsa" properly
      if (diffTime > 0) {
        const totalSeconds = Math.floor(diffTime / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const days = Math.floor(totalHours / 24);
        
        currentSubscription.value.daysRemaining = days;
        currentSubscription.value.hoursRemaining = totalHours % 24;
        currentSubscription.value.minutesRemaining = totalMinutes % 60;
        currentSubscription.value.secondsRemaining = totalSeconds % 60;
        currentSubscription.value.isExpired = false;
      } else {
        // Time has expired
        currentSubscription.value.isExpired = true;
        currentSubscription.value.daysRemaining = 0;
        currentSubscription.value.hoursRemaining = 0;
        currentSubscription.value.minutesRemaining = 0;
        currentSubscription.value.secondsRemaining = 0;
        
        // Stop countdown
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
        
        // IMPORTANT: Only auto refresh if current plan is BOOST (PRO/ENTERPRISE) and expired
        // If current plan is BASIC and expired, don't auto refresh (just show expired state)
        // This prevents unnecessary page refresh for BASIC plan
        const currentPlan = currentSubscription.value?.plan || 'BASIC';
        const subscriptionEnd = currentSubscription.value?.subscription?.endDate;
        
        // Only reload if:
        // 1. Current plan is PRO or ENTERPRISE (boost) and expired
        // 2. SubscriptionEnd is not null (might be temporary upgrade that needs revert)
        // 3. Not already reloading
        if ((currentPlan === 'PRO' || currentPlan === 'ENTERPRISE') && subscriptionEnd && !isReloadingSubscription.value) {
          // Boost plan expired - reload to get reverted BASIC plan with remaining time
          isReloadingSubscription.value = true;
          loadSubscription().finally(() => {
            isReloadingSubscription.value = false;
          });
        } else if (currentPlan === 'BASIC' || !subscriptionEnd) {
          // BASIC plan expired or subscriptionEnd is null - don't reload to prevent page refresh
          // Just stop countdown and show expired state
        }
      }
    }
  }, 1000); // Update every second
};

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
};

const renderCharts = () => {
  // Destroy existing charts if they exist
  if (topProductsChart) topProductsChart.destroy();
  if (salesByStatusChart) salesByStatusChart.destroy();

  // Top Products Chart
  const topProductsCtx = document.getElementById('topProductsChart') as HTMLCanvasElement;
  if (topProductsCtx && stats.value?.charts?.topProducts?.length > 0) {
    topProductsChart = new Chart(topProductsCtx, {
      type: 'bar',
      data: {
        labels: stats.value.charts.topProducts.map((p: any) => p.name),
        datasets: [{
          label: 'Jumlah Terjual',
          data: stats.value.charts.topProducts.map((p: any) => p.quantity),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  // Sales by Status Chart
  const salesByStatusCtx = document.getElementById('salesByStatusChart') as HTMLCanvasElement;
  if (salesByStatusCtx && stats.value?.charts?.salesByStatus?.length > 0) {
    salesByStatusChart = new Chart(salesByStatusCtx, {
      type: 'pie',
      data: {
        labels: stats.value.charts.salesByStatus.map((s: any) => getStatusLabel(s.status)),
        datasets: [{
          data: stats.value.charts.salesByStatus.map((s: any) => s.count),
          backgroundColor: [
            'rgba(255, 206, 86, 0.6)', // PENDING
            'rgba(54, 162, 235, 0.6)', // PROCESSING
            'rgba(75, 192, 192, 0.6)', // COMPLETED
            'rgba(255, 99, 132, 0.6)', // CANCELLED
            'rgba(201, 203, 207, 0.6)', // REFUNDED
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(201, 203, 207, 1)',
          ],
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
      },
    });
  }
};

// Watch for tenant changes and reload stats and subscription
watch(() => authStore.currentTenantId, () => {
  // Only load stats if user is authenticated
  if (authStore.isAuthenticated) {
    // Reset subscription when tenant changes
    if (isAdminOrSupervisor.value) {
      currentSubscription.value = null;
      subscriptionLoading.value = false;
    }
    loadStats();
  }
});

// Also watch for selectedTenantId changes (for Super Admin)
watch(() => authStore.selectedTenantId, () => {
  if (authStore.isAuthenticated && isAdminOrSupervisor.value) {
    currentSubscription.value = null;
    subscriptionLoading.value = false;
    loadStats();
  }
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Only load stats if user is authenticated
  if (authStore.isAuthenticated) {
    loadStats();
  }
});

onUnmounted(() => {
  stopCountdown();
});
</script>
