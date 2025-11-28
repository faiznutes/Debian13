<template>
  <div class="flex flex-col h-full">
    <!-- Tenant Selector for Super Admin -->
    <TenantSelector @tenant-changed="handleTenantChange" />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Berlangganan</h2>
        <p class="text-gray-600 mt-1">Kelola paket langganan Anda</p>
      </div>
      <router-link
        to="/pricing"
        class="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-lg hover:bg-primary-50 transition"
      >
        Lihat Detail Paket →
      </router-link>
    </div>

    <!-- Tenant Selection Message -->
    <div v-if="needsTenantSelection" class="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300 mx-4 sm:mx-6">
      <svg class="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Pilih Tenant Terlebih Dahulu</h3>
      <p class="text-gray-600 text-center max-w-md">Silakan pilih tenant terlebih dahulu untuk melihat informasi berlangganan.</p>
    </div>

    <div v-else-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-gray-600 font-medium">Memuat data berlangganan...</div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-6 px-4 sm:px-6">
      <!-- Current Subscription Card -->
      <div class="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-primary-200">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <h3 class="text-xl font-bold text-gray-900">Paket Saat Ini</h3>
              <span
                class="px-3 py-1 text-sm font-semibold rounded-full"
                :class="subscription?.isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
              >
                {{ subscription?.isExpired ? 'Kedaluwarsa' : 'Aktif' }}
              </span>
            </div>
            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-3xl font-bold text-primary-600">{{ getPlanName(subscription?.plan || 'BASIC') }}</span>
            </div>
            <div class="space-y-1 text-sm text-gray-600">
              <p>Mulai: {{ formatDate(subscription?.subscription?.startDate) }}</p>
              <p>Berakhir: {{ formatDate(subscription?.subscription?.endDate) }}</p>
            </div>
          </div>
          <div v-if="userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN'" class="flex flex-col items-center md:items-end">
            <div class="text-5xl font-bold text-primary-600 mb-1">
              {{ formatRemainingTime(
                subscription?.daysRemaining || 0,
                subscription?.hoursRemaining,
                subscription?.minutesRemaining,
                subscription?.secondsRemaining
              ) }}
            </div>
            <div class="text-sm text-gray-600 mb-3">{{ (subscription?.daysRemaining || 0) > 1 ? 'Hari Tersisa' : 'Tersisa' }}</div>
            <div class="w-32 bg-gray-200 rounded-full h-2">
              <div
                class="bg-primary-600 h-2 rounded-full transition-all"
                :style="{ width: `${Math.min(100, (subscription?.daysRemaining || 0) / 30 * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upgrade/Extend Section -->
      <div v-if="(userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN') && !subscription?.isExpired" class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Upgrade Paket</h3>
          <button
            @click="showExtendSection = !showExtendSection"
            class="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-lg hover:bg-primary-50 transition"
          >
            {{ showExtendSection ? 'Sembunyikan' : 'Perpanjang Paket' }}
          </button>
        </div>
        
        <!-- Extend Section (Perpanjang Paket) -->
        <div v-if="showExtendSection" class="mb-6 pb-6 border-b border-gray-200">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">Perpanjang Paket Saat Ini</h4>
          
          <!-- Plan Selection for Extend -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div
              v-for="plan in subscriptionPlans"
              :key="plan.id"
              @click="extendPlan = plan.id"
              class="border-2 rounded-lg p-4 cursor-pointer transition-all"
              :class="extendPlan === plan.id 
                ? 'border-primary-600 bg-primary-50' 
                : 'border-gray-200 hover:border-primary-300'"
            >
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-gray-900">{{ plan.name }}</h4>
                <div v-if="extendPlan === plan.id" class="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div class="text-2xl font-bold text-primary-600 mb-1">
                <div v-if="plan.originalPrice && plan.discount" class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-lg font-normal text-gray-400 line-through">{{ formatCurrency(plan.originalPrice) }}</span>
                  <span>{{ formatCurrency(plan.price) }}</span>
                  <span class="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">Hemat {{ plan.discount }}%</span>
                </div>
                <template v-else>
                  {{ formatCurrency(plan.price) }}
                </template>
                <span class="text-sm text-gray-600 font-normal">/bulan</span>
              </div>
              <p class="text-xs text-gray-500">{{ plan.description }}</p>
            </div>
          </div>

          <!-- Duration Selection for Extend -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Durasi Perpanjangan</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                v-for="duration in durationOptions"
                :key="duration.value"
                @click="extendDuration = duration.value"
                class="px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all"
                :class="extendDuration === duration.value
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-primary-300 text-gray-700'"
              >
                {{ duration.label }}
                <span v-if="duration.discount" class="block text-xs text-green-600 mt-1">Diskon {{ duration.discount }}%</span>
              </button>
            </div>
          </div>

          <!-- Summary for Extend -->
          <div v-if="extendPlan && extendDuration" class="bg-gray-50 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-700">Paket:</span>
              <span class="font-semibold text-gray-900">{{ getPlanName(extendPlan) }}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-700">Durasi:</span>
              <span class="font-semibold text-gray-900">{{ extendDuration }} hari</span>
            </div>
            <div v-if="getExtendDiscount() > 0" class="flex justify-between items-center mb-2">
              <span class="text-gray-700">Diskon:</span>
              <span class="font-semibold text-green-600">{{ getExtendDiscount() }}%</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-200">
              <span class="text-lg font-semibold text-gray-900">Total Pembayaran:</span>
              <span class="text-2xl font-bold text-primary-600">{{ formatCurrency(calculateExtendTotal()) }}</span>
            </div>
          </div>

          <!-- Action Button for Extend -->
          <button
            v-if="extendPlan && extendDuration"
            @click="handleExtend"
            :disabled="processing"
            class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ processing ? 'Memproses...' : 'Perpanjang Paket' }}
          </button>
        </div>
        
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Upgrade ke Paket Lain</h3>
        
        <!-- Plan Selection -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            v-for="plan in availablePlans"
            :key="plan.id"
            @click="selectedPlan = plan.id"
            class="border-2 rounded-lg p-4 cursor-pointer transition-all"
            :class="selectedPlan === plan.id 
              ? 'border-primary-600 bg-primary-50' 
              : 'border-gray-200 hover:border-primary-300'"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900">{{ plan.name }}</h4>
              <div v-if="selectedPlan === plan.id" class="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div class="text-2xl font-bold text-primary-600 mb-1">
              <div v-if="plan.originalPrice && plan.discount" class="flex items-baseline gap-2 flex-wrap">
                <span class="text-lg font-normal text-gray-400 line-through">{{ formatCurrency(plan.originalPrice) }}</span>
                <span>{{ formatCurrency(plan.price) }}</span>
                <span class="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">Hemat {{ plan.discount }}%</span>
              </div>
              <template v-else>
                {{ formatCurrency(plan.price) }}
              </template>
              <span class="text-sm text-gray-600 font-normal">/bulan</span>
            </div>
            <p class="text-xs text-gray-500">{{ plan.description }}</p>
          </div>
        </div>

        <!-- Upgrade Type Selection -->
        <div v-if="selectedPlan && selectedPlan !== currentPlan" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">Pilih Durasi Upgrade</label>
          <div class="space-y-3">
            <!-- Temporary: 1 bulan -->
            <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
              :class="upgradeType === 'temporary' 
                ? 'border-primary-600 bg-primary-50' 
                : 'border-gray-200 hover:border-primary-300'"
            >
              <input
                type="radio"
                v-model="upgradeType"
                value="temporary"
                class="mt-1 mr-3"
              />
              <div class="flex-1">
                <div class="font-semibold text-gray-900">1 Bulan (Sementara)</div>
                <div class="text-sm text-gray-600">Upgrade selama 1 bulan, setelah selesai kembali ke paket {{ getPlanName(currentPlan) }}</div>
                <div class="text-sm font-semibold text-primary-600 mt-1">
                  Hanya bayar: {{ formatCurrency(calculateUpgradeAmount('temporary')) }}
                </div>
              </div>
            </label>

            <!-- Until End: Sampai masa aktif selesai -->
            <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
              :class="upgradeType === 'until_end' 
                ? 'border-primary-600 bg-primary-50' 
                : 'border-gray-200 hover:border-primary-300'"
            >
              <input
                type="radio"
                v-model="upgradeType"
                value="until_end"
                class="mt-1 mr-3"
              />
              <div class="flex-1">
                <div class="font-semibold text-gray-900">Sampai Masa Aktif Selesai</div>
                <div class="text-sm text-gray-600">Upgrade hingga {{ subscription?.daysRemaining || 0 }} hari tersisa</div>
                <div class="text-sm font-semibold text-primary-600 mt-1">
                  Hanya bayar: {{ formatCurrency(calculateUpgradeAmount('until_end')) }}
                </div>
              </div>
            </label>

            <!-- Custom: 3, 6, 12 bulan -->
            <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
              :class="upgradeType === 'custom' 
                ? 'border-primary-600 bg-primary-50' 
                : 'border-gray-200 hover:border-primary-300'"
            >
              <input
                type="radio"
                v-model="upgradeType"
                value="custom"
                class="mt-1 mr-3"
              />
              <div class="flex-1">
                <div class="font-semibold text-gray-900 mb-2">Durasi Custom (3, 6, atau 12 Bulan)</div>
                <div v-if="upgradeType === 'custom'" class="grid grid-cols-3 gap-2 mb-2">
                  <button
                    v-for="duration in customDurationOptions"
                    :key="duration.value"
                    @click.stop="selectedCustomDuration = duration.value"
                    class="px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all"
                    :class="selectedCustomDuration === duration.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300 text-gray-700'"
                  >
                    {{ duration.label }}
                    <span v-if="duration.discount" class="text-xs text-green-600">(Diskon {{ duration.discount }}%)</span>
                  </button>
                </div>
                <div v-if="upgradeType === 'custom' && selectedCustomDuration" class="text-sm font-semibold text-primary-600">
                  Hanya bayar: {{ formatCurrency(calculateUpgradeAmount('custom')) }}
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="selectedPlan && selectedPlan !== currentPlan && upgradeType" class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Dari:</span>
            <span class="font-semibold text-gray-900">{{ getPlanName(currentPlan) }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Ke:</span>
            <span class="font-semibold text-gray-900">{{ getPlanName(selectedPlan) }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Durasi:</span>
            <span class="font-semibold text-gray-900">{{ getUpgradeDurationLabel() }}</span>
          </div>
          <div v-if="getDiscount() > 0" class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Diskon:</span>
            <span class="font-semibold text-green-600">{{ getDiscount() }}%</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-gray-200">
            <span class="text-lg font-semibold text-gray-900">Total Pembayaran:</span>
            <span class="text-2xl font-bold text-primary-600">{{ formatCurrency(calculateUpgradeAmount(upgradeType)) }}</span>
          </div>
        </div>

        <!-- Action Button -->
        <button
          v-if="selectedPlan && selectedPlan !== currentPlan && upgradeType && (upgradeType !== 'custom' || selectedCustomDuration)"
          @click="handleUpgrade"
          :disabled="processing"
          class="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ processing ? 'Memproses...' : 'Lanjutkan ke Pembayaran' }}
        </button>
      </div>

      <!-- Extend Section (if expired or no active subscription) -->
      <div v-if="(userRole === 'ADMIN_TENANT' || userRole === 'SUPER_ADMIN') && (subscription?.isExpired || !subscription?.subscription?.endDate)" class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Perpanjang Berlangganan</h3>
        
        <!-- Plan Selection -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            v-for="plan in subscriptionPlans"
            :key="plan.id"
            @click="extendPlan = plan.id"
            class="border-2 rounded-lg p-4 cursor-pointer transition-all"
            :class="extendPlan === plan.id 
              ? 'border-primary-600 bg-primary-50' 
              : 'border-gray-200 hover:border-primary-300'"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900">{{ plan.name }}</h4>
              <div v-if="extendPlan === plan.id" class="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div class="text-2xl font-bold text-primary-600 mb-1">
              <div v-if="plan.originalPrice && plan.discount" class="flex items-baseline gap-2 flex-wrap">
                <span class="text-lg font-normal text-gray-400 line-through">{{ formatCurrency(plan.originalPrice) }}</span>
                <span>{{ formatCurrency(plan.price) }}</span>
                <span class="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">Hemat {{ plan.discount }}%</span>
              </div>
              <template v-else>
                {{ formatCurrency(plan.price) }}
              </template>
              <span class="text-sm text-gray-600 font-normal">/bulan</span>
            </div>
            <p class="text-xs text-gray-500">{{ plan.description }}</p>
          </div>
        </div>

        <!-- Duration Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Durasi Berlangganan</label>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              v-for="duration in durationOptions"
              :key="duration.value"
              @click="extendDuration = duration.value"
              class="px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all"
              :class="extendDuration === duration.value
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-primary-300 text-gray-700'"
            >
              {{ duration.label }}
              <span v-if="duration.discount" class="block text-xs text-green-600 mt-1">Diskon {{ duration.discount }}%</span>
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="extendPlan && extendDuration" class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Paket:</span>
            <span class="font-semibold text-gray-900">{{ getPlanName(extendPlan) }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Durasi:</span>
            <span class="font-semibold text-gray-900">{{ extendDuration }} hari</span>
          </div>
          <div v-if="getExtendDiscount() > 0" class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Diskon:</span>
            <span class="font-semibold text-green-600">{{ getExtendDiscount() }}%</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-gray-200">
            <span class="text-lg font-semibold text-gray-900">Total:</span>
            <span class="text-2xl font-bold text-primary-600">{{ formatCurrency(calculateExtendTotal()) }}</span>
          </div>
        </div>

        <!-- Action Button -->
        <button
          @click="handleExtend"
          :disabled="!extendPlan || !extendDuration || processing"
          class="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ processing ? 'Memproses...' : 'Lanjutkan ke Pembayaran' }}
        </button>
      </div>

      <!-- Available Plans Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 class="font-semibold text-blue-900 mb-1">Ingin melihat detail lengkap paket?</h4>
            <p class="text-sm text-blue-700 mb-2">Lihat perbandingan fitur, harga, dan addon yang tersedia di halaman pricing.</p>
            <router-link
              to="/pricing"
              class="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Lihat Halaman Pricing →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import api from '../../api';
import { formatDate, formatCurrency, formatRemainingTime } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import TenantSelector from '../../components/TenantSelector.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';

const authStore = useAuthStore();
const userRole = computed(() => authStore.user?.role || '');
const { needsTenantSelection } = useTenantCheck();
const { error: showError, warning: showWarning } = useNotification();

const loading = ref(false);
const isReloading = ref(false); // Flag to prevent multiple reloads
const processing = ref(false);
const subscription = ref<any>(null);
const currentTime = ref(new Date());
let countdownInterval: NodeJS.Timeout | null = null;
const selectedPlan = ref<string>('');
const upgradeType = ref<'temporary' | 'until_end' | 'custom' | ''>('');
const selectedCustomDuration = ref<number>(0);
const extendPlan = ref<string>('');
const extendDuration = ref<number>(0);
const showExtendSection = ref(false);

const subscriptionPlans = [
  {
    id: 'BASIC',
    name: 'Warungin Starter',
    price: 200000,
    originalPrice: 250000, // Harga sebelum discount 20%
    discount: 20,
    description: '1 Admin + 2 Kasir + 1 Kitchen, 10 Produk',
  },
  {
    id: 'PRO',
    name: 'Warungin Boost',
    price: 350000,
    originalPrice: 500000, // Harga sebelum discount 30%
    discount: 30,
    description: '1 Admin + 1 Supervisor + 6 Kasir + 2 Kitchen, 2 Outlet, 100 Produk',
  },
  {
    id: 'ENTERPRISE',
    name: 'Warungin Max',
    price: 500000,
    description: 'Custom paket sesuai kebutuhan. Hubungi admin untuk penawaran khusus.',
  },
];

const durationOptions = [
  { label: '1 Bulan', value: 30, discount: 0 },
  { label: '3 Bulan', value: 90, discount: 5 },
  { label: '6 Bulan', value: 180, discount: 10 },
  { label: '1 Tahun', value: 365, discount: 15 },
];

const customDurationOptions = [
  { label: '3 Bulan', value: 90, discount: 5 },
  { label: '6 Bulan', value: 180, discount: 10 },
  { label: '1 Tahun', value: 365, discount: 15 },
];

const currentPlan = computed(() => subscription.value?.plan || 'BASIC');

const availablePlans = computed(() => {
  // Filter out current plan
  return subscriptionPlans.filter(p => p.id !== currentPlan.value);
});

const getPlanName = (planId: string) => {
  const plan = subscriptionPlans.find(p => p.id === planId);
  return plan?.name || planId;
};

const getDiscount = () => {
  if (upgradeType.value === 'custom' && selectedCustomDuration.value) {
    const duration = customDurationOptions.find(d => d.value === selectedCustomDuration.value);
    return duration?.discount || 0;
  }
  return 0;
};

const getExtendDiscount = () => {
  if (extendDuration.value) {
    const duration = durationOptions.find(d => d.value === extendDuration.value);
    return duration?.discount || 0;
  }
  return 0;
};

const calculateUpgradeAmount = (type: 'temporary' | 'until_end' | 'custom') => {
  if (!selectedPlan.value || selectedPlan.value === currentPlan.value) return 0;
  
  const currentPlanPrice = subscriptionPlans.find(p => p.id === currentPlan.value)?.price || 0;
  const newPlanPrice = subscriptionPlans.find(p => p.id === selectedPlan.value)?.price || 0;
  const priceDifferencePerDay = (newPlanPrice - currentPlanPrice) / 30;
  
  let duration = 0;
  if (type === 'temporary') {
    duration = 30;
  } else if (type === 'until_end') {
    duration = subscription.value?.daysRemaining || 0;
  } else if (type === 'custom') {
    duration = selectedCustomDuration.value || 0;
  }
  
  const baseAmount = priceDifferencePerDay * duration;
  const discount = getDiscount() / 100;
  return Math.max(0, baseAmount * (1 - discount));
};

const calculateExtendTotal = () => {
  if (!extendPlan.value || !extendDuration.value) return 0;
  const plan = subscriptionPlans.find(p => p.id === extendPlan.value);
  if (!plan) return 0;
  
  const baseAmount = (plan.price * extendDuration.value) / 30;
  const discount = getExtendDiscount() / 100;
  return baseAmount * (1 - discount);
};

const getUpgradeDurationLabel = () => {
  if (upgradeType.value === 'temporary') {
    return '1 Bulan';
  } else if (upgradeType.value === 'until_end') {
    return `${subscription.value?.daysRemaining || 0} hari (sampai masa aktif selesai)`;
  } else if (upgradeType.value === 'custom' && selectedCustomDuration.value) {
    const duration = customDurationOptions.find(d => d.value === selectedCustomDuration.value);
    return duration?.label || `${selectedCustomDuration.value} hari`;
  }
  return '';
};

const loadSubscription = async () => {
  if (needsTenantSelection.value) {
    return;
  }
  
  loading.value = true;
  try {
    const response = await api.get('/subscriptions/current');
    subscription.value = response.data;
    
    // IMPORTANT: Use isExpired from backend response directly
    // Don't recalculate isExpired based on subscriptionEnd to avoid flash to expired
    // Backend already calculated isExpired correctly after revert
    if (response.data.isExpired !== undefined) {
      // Use isExpired from backend
      subscription.value.isExpired = response.data.isExpired;
    }
    
    // Set default selected plan to next plan (for upgrade)
    if (subscription.value?.plan) {
      const currentIndex = subscriptionPlans.findIndex(p => p.id === subscription.value.plan);
      if (currentIndex < subscriptionPlans.length - 1) {
        selectedPlan.value = subscriptionPlans[currentIndex + 1].id;
      }
    }
    
    // Start countdown after subscription is loaded
    // Always start countdown if subscription exists and has endDate
    // The countdown will handle expired state internally
    if (subscription.value && subscription.value.subscription?.endDate) {
      // Initialize countdown values from backend response
      if (subscription.value.daysRemaining !== undefined) {
        // Backend already calculated, use those values
        startCountdown();
      } else {
        // Calculate from endDate if backend didn't provide
        const endDate = new Date(subscription.value.subscription.endDate);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        
        if (diffTime > 0) {
          const totalSeconds = Math.floor(diffTime / 1000);
          const totalMinutes = Math.floor(totalSeconds / 60);
          const totalHours = Math.floor(totalMinutes / 60);
          const days = Math.floor(totalHours / 24);
          
          subscription.value.daysRemaining = days;
          subscription.value.hoursRemaining = totalHours % 24;
          subscription.value.minutesRemaining = totalMinutes % 60;
          subscription.value.secondsRemaining = totalSeconds % 60;
          // Don't set isExpired here - use from backend
        } else {
          // Only set isExpired if backend didn't provide it
          if (subscription.value.isExpired === undefined) {
            subscription.value.isExpired = true;
          }
          subscription.value.daysRemaining = 0;
          subscription.value.hoursRemaining = 0;
          subscription.value.minutesRemaining = 0;
          subscription.value.secondsRemaining = 0;
        }
        
        startCountdown();
      }
    }
  } catch (error: any) {
    console.error('Error loading subscription:', error);
  } finally {
    loading.value = false;
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
    if (subscription.value && subscription.value.subscription?.endDate) {
      const endDate = new Date(subscription.value.subscription.endDate);
      const diffTime = endDate.getTime() - currentTime.value.getTime();
      
      // Only update if there's still time remaining (diffTime > 0)
      // If diffTime <= 0, mark as expired but don't stop countdown immediately
      // This allows the UI to show "0 hari" or "Kadaluwarsa" properly
      if (diffTime > 0) {
        const totalSeconds = Math.floor(diffTime / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const days = Math.floor(totalHours / 24);
        
        subscription.value.daysRemaining = days;
        subscription.value.hoursRemaining = totalHours % 24;
        subscription.value.minutesRemaining = totalMinutes % 60;
        subscription.value.secondsRemaining = totalSeconds % 60;
        subscription.value.isExpired = false;
      } else {
        // Time has expired
        subscription.value.isExpired = true;
        subscription.value.daysRemaining = 0;
        subscription.value.hoursRemaining = 0;
        subscription.value.minutesRemaining = 0;
        subscription.value.secondsRemaining = 0;
        
        // Stop countdown
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
        
        // IMPORTANT: Only auto refresh if current plan is BOOST (PRO/ENTERPRISE) and expired
        // If current plan is BASIC and expired, don't auto refresh (just show expired state)
        // This prevents unnecessary page refresh for BASIC plan
        const currentPlan = subscription.value?.plan || 'BASIC';
        const subscriptionEnd = subscription.value?.subscription?.endDate;
        
        // Only reload if:
        // 1. Current plan is PRO or ENTERPRISE (boost) and expired
        // 2. SubscriptionEnd is not null (might be temporary upgrade that needs revert)
        // 3. Not already reloading
        if ((currentPlan === 'PRO' || currentPlan === 'ENTERPRISE') && subscriptionEnd && !isReloading.value) {
          // Boost plan expired - reload to get reverted BASIC plan with remaining time
          isReloading.value = true;
          loadSubscription().finally(() => {
            isReloading.value = false;
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

const handleUpgrade = async () => {
  if (needsTenantSelection.value || !selectedPlan.value || !upgradeType.value) {
    return;
  }
  
  if (upgradeType.value === 'custom' && !selectedCustomDuration.value) {
    await showWarning('Pilih durasi custom terlebih dahulu');
    return;
  }
  
  processing.value = true;
  try {
    // Calculate upgrade amount
    const amount = calculateUpgradeAmount(upgradeType.value);
    
    // Create itemId with upgrade info
    // Format: upgrade-{newPlan}-{upgradeType}-{customDuration?}
    const itemId = `upgrade-${selectedPlan.value}-${upgradeType.value}${upgradeType.value === 'custom' ? `-${selectedCustomDuration.value}` : ''}`;
    const plan = subscriptionPlans.find(p => p.id === selectedPlan.value);
    
    const response = await api.post('/payment/addon', {
      itemName: `Upgrade ke ${plan?.name} - ${getUpgradeDurationLabel()}`,
      amount: amount,
      itemId: itemId,
      itemType: 'subscription',
    });

    if (response.data.success && response.data.paymentUrl) {
      window.location.href = response.data.paymentUrl;
    } else {
      await showError(response.data.message || 'Gagal membuat pembayaran');
    }
  } catch (error: any) {
    console.error('Error creating payment:', error);
    await showError(error.response?.data?.message || 'Gagal membuat pembayaran');
  } finally {
    processing.value = false;
  }
};

const handleExtend = async () => {
  if (needsTenantSelection.value || !extendPlan.value || !extendDuration.value) {
    return;
  }
  
  processing.value = true;
  try {
    const plan = subscriptionPlans.find(p => p.id === extendPlan.value);
    if (!plan) {
      await showError('Paket tidak ditemukan');
      return;
    }

    const total = calculateExtendTotal();
    const itemId = `${extendPlan.value}-${extendDuration.value}`;

    const response = await api.post('/payment/addon', {
      itemName: `${plan.name} - ${extendDuration.value} hari`,
      amount: total,
      itemId: itemId,
      itemType: 'subscription',
    });

    if (response.data.success && response.data.paymentUrl) {
      window.location.href = response.data.paymentUrl;
    } else {
      await showError(response.data.message || 'Gagal membuat pembayaran');
    }
  } catch (error: any) {
    console.error('Error creating payment:', error);
    await showError(error.response?.data?.message || 'Gagal membuat pembayaran');
  } finally {
    processing.value = false;
  }
};

const handleTenantChange = (tenantId: string | null) => {
  if (tenantId && !needsTenantSelection.value) {
    loadSubscription();
  }
};

watch(() => authStore.currentTenantId, (newTenantId, oldTenantId) => {
  if (newTenantId && newTenantId !== oldTenantId && !needsTenantSelection.value) {
    loadSubscription();
  }
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!needsTenantSelection.value) {
    loadSubscription();
  }
});

onUnmounted(() => {
  stopCountdown();
});
</script>
