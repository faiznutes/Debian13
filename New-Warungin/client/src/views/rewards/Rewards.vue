<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header dengan Balance -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Point Gratis</h1>
      <p class="text-gray-600">Tukarkan point dengan langganan atau addon</p>
    </div>

    <!-- Balance Card -->
    <div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mb-6 text-white shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-yellow-100 text-sm mb-1">Total Point Anda</p>
          <p class="text-4xl font-bold">{{ balance.currentPoints || 0 }}</p>
          <p class="text-yellow-100 text-sm mt-2">
            Total diperoleh: {{ balance.totalEarned || 0 }} • Digunakan: {{ balance.totalSpent || 0 }}
          </p>
          <p v-if="balance.expirationDays" class="text-yellow-100 text-xs mt-1">
            ⏰ Point berlaku selama {{ balance.expirationDays }} hari (6 bulan)
          </p>
        </div>
        <div class="text-right space-y-2">
          <div class="bg-white/20 rounded-lg px-4 py-2">
            <p class="text-xs text-yellow-100">Sisa hari ini</p>
            <p class="text-2xl font-bold">{{ dailyLimit.remaining || 0 }}/5</p>
          </div>
          <div v-if="balance.expiringSoon > 0" class="bg-red-500/80 rounded-lg px-4 py-2">
            <p class="text-xs text-white">Akan kadaluarsa</p>
            <p class="text-xl font-bold">{{ balance.expiringSoon }} pts</p>
            <p class="text-xs text-white">(dalam 30 hari)</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Expiration Warning -->
    <div v-if="balance.expiringSoon > 0" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">
            <strong>Peringatan:</strong> Anda memiliki {{ balance.expiringSoon }} point yang akan kadaluarsa dalam 30 hari ke depan. 
            Gunakan point Anda sebelum kadaluarsa!
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <div class="flex space-x-4">
        <button
          @click="activeTab = 'earn'"
          :class="[
            'pb-3 px-1 border-b-2 font-medium transition',
            activeTab === 'earn'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Dapatkan Point
        </button>
        <button
          @click="activeTab = 'redeem'"
          :class="[
            'pb-3 px-1 border-b-2 font-medium transition',
            activeTab === 'redeem'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Tukar Point
        </button>
        <button
          @click="activeTab = 'history'"
          :class="[
            'pb-3 px-1 border-b-2 font-medium transition',
            activeTab === 'history'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Riwayat
        </button>
      </div>
    </div>

    <!-- Tab: Earn Points -->
    <div v-if="activeTab === 'earn'" class="space-y-6">
      <!-- Ad View Section -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Tonton Iklan untuk Mendapat Point</h2>
        
        <div v-if="dailyLimit.remaining > 0" class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800 mb-2">
              <strong>Info:</strong> Anda bisa menonton maksimal 5 iklan per hari.
              Setiap iklan memberikan point secara acak.
            </p>
          </div>

          <!-- Info: Iklan akan muncul di halaman reward-view -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <svg class="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p class="text-blue-800 font-medium mb-1">Klik tombol "Claim Reward" untuk menonton iklan</p>
            <p class="text-sm text-blue-600">Iklan IronSource akan muncul di halaman khusus</p>
          </div>

          <button
            @click="claimReward"
            :disabled="loading || dailyLimit.remaining === 0"
            class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 8 0 4.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Memproses...' : `Claim Reward (${dailyLimit.remaining} tersisa)` }}</span>
          </button>
        </div>

        <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p class="text-yellow-800 font-semibold">
            ⏰ Batas harian sudah tercapai. Kembali besok untuk menonton iklan lagi!
          </p>
        </div>
      </div>
    </div>

    <!-- Tab: Redeem Points -->
    <div v-if="activeTab === 'redeem'" class="space-y-6">
      <!-- Subscription Redeem -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Tukar Point untuk Langganan</h2>
        <div v-if="loading" class="text-center py-8">
          <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600">Memuat data...</p>
        </div>
        <div v-else-if="subscriptionPlans.length === 0" class="text-center py-8 text-gray-500">
          <p>Tidak ada paket langganan tersedia saat ini.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="plan in subscriptionPlans"
            :key="plan.id"
            class="border-2 rounded-lg p-4 hover:border-primary-500 transition"
            :class="{
              'border-primary-500': balance.currentPoints >= plan.pointsRequired,
              'border-gray-200 opacity-50': balance.currentPoints < plan.pointsRequired
            }"
          >
            <h3 class="font-bold text-lg mb-2">{{ plan.name }}</h3>
            <p class="text-gray-600 text-sm mb-4">{{ plan.description }}</p>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-primary-600">{{ plan.pointsRequired }} pts</span>
              <button
                @click="redeemSubscription(plan)"
                :disabled="balance.currentPoints < plan.pointsRequired || redeeming"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-semibold transition"
              >
                {{ redeeming ? 'Memproses...' : 'Tukar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Addon Redeem -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Tukar Point untuk Addon</h2>
        <div v-if="loading" class="text-center py-8">
          <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600">Memuat data...</p>
        </div>
        <div v-else-if="availableAddons.length === 0" class="text-center py-8 text-gray-500">
          <p>Tidak ada addon tersedia saat ini.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="addon in availableAddons"
            :key="addon.id"
            class="border-2 rounded-lg p-4 hover:border-primary-500 transition"
            :class="{
              'border-primary-500': balance.currentPoints >= addon.pointsRequired,
              'border-gray-200 opacity-50': balance.currentPoints < addon.pointsRequired
            }"
          >
            <h3 class="font-bold text-lg mb-2">{{ addon.name }}</h3>
            <p class="text-gray-600 text-sm mb-4">{{ addon.description }}</p>
            <div class="flex items-center justify-between">
              <span class="text-xl font-bold text-primary-600">{{ addon.pointsRequired }} pts</span>
              <button
                @click="redeemAddon(addon)"
                :disabled="balance.currentPoints < addon.pointsRequired || redeeming"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-semibold transition"
              >
                {{ redeeming ? 'Memproses...' : 'Tukar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: History -->
    <div v-if="activeTab === 'history'">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Riwayat Transaksi Point</h2>
        <div v-if="loading" class="text-center py-8">
          <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600">Memuat riwayat...</p>
        </div>
        <div v-else-if="transactions.length === 0" class="text-center py-8 text-gray-500">
          Belum ada transaksi
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="transaction in transactions"
            :key="transaction.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div class="flex-1">
              <p class="font-semibold text-gray-900">{{ transaction.description }}</p>
              <p class="text-sm text-gray-500">{{ formatDate(transaction.createdAt) }}</p>
              <p v-if="transaction.type === 'EARNED' && transaction.metadata?.expirationDate" class="text-xs text-gray-400 mt-1">
                ⏰ Kadaluarsa: {{ formatDate(transaction.metadata.expirationDate) }}
                <span v-if="getDaysUntilExpiration(transaction.metadata.expirationDate) <= 30" class="text-yellow-600 font-semibold">
                  ({{ getDaysUntilExpiration(transaction.metadata.expirationDate) }} hari lagi)
                </span>
              </p>
              <p v-if="transaction.type === 'EXPIRED'" class="text-xs text-red-500 mt-1">
                ⚠️ Point telah kadaluarsa
              </p>
            </div>
            <span
              :class="[
                'font-bold text-lg',
                transaction.amount > 0 ? 'text-green-600' : transaction.type === 'EXPIRED' ? 'text-red-600' : 'text-red-600'
              ]"
            >
              {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import api from '../../api';

const router = useRouter();
const activeTab = ref<'earn' | 'redeem' | 'history'>('earn');
const loading = ref(false);
const redeeming = ref(false);
const balance = ref({
  currentPoints: 0,
  totalEarned: 0,
  totalSpent: 0,
  expirationDays: 180,
  expiringSoon: 0,
});
const dailyLimit = ref({
  remaining: 5,
  todayViews: 0,
});
const transactions = ref<any[]>([]);
const subscriptionPlans = ref<any[]>([]);
const availableAddons = ref<any[]>([]);

const loadBalance = async () => {
  try {
    const response = await api.get('/rewards/balance');
    balance.value = response.data;
  } catch (error) {
    console.error('Error loading balance:', error);
  }
};

const loadDailyLimit = async () => {
  try {
    const response = await api.get('/rewards/daily-limit');
    dailyLimit.value = response.data;
  } catch (error) {
    console.error('Error loading daily limit:', error);
  }
};

const loadTransactions = async () => {
  try {
    const response = await api.get('/rewards/transactions');
    transactions.value = response.data;
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
};

const loadConfig = async () => {
  try {
    const response = await api.get('/rewards/config');
    console.log('Rewards config response:', response.data);
    
    const { redemptions } = response.data;
    
    if (!redemptions) {
      console.error('No redemptions data in response');
      return;
    }
    
    // Format subscription plans
    if (redemptions.subscriptions && Array.isArray(redemptions.subscriptions)) {
      subscriptionPlans.value = redemptions.subscriptions.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        description: `Paket ${sub.name} selama 1 bulan`,
        pointsRequired: sub.pointsRequired,
      }));
      console.log('Loaded subscription plans:', subscriptionPlans.value);
    } else {
      console.warn('No subscriptions in redemptions');
      subscriptionPlans.value = [];
    }
    
    // Format addons
    if (redemptions.addons && Array.isArray(redemptions.addons)) {
      availableAddons.value = redemptions.addons.map((addon: any) => ({
        id: addon.id,
        name: addon.name,
        description: `Aktifkan addon ${addon.name}`,
        pointsRequired: addon.pointsRequired,
      }));
      console.log('Loaded addons:', availableAddons.value);
    } else {
      console.warn('No addons in redemptions');
      availableAddons.value = [];
    }
  } catch (error: any) {
    console.error('Error loading config:', error);
    console.error('Error details:', error.response?.data);
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    console.error('Error message:', errorMessage);
    
    // Show detailed error message
    if (errorMessage.includes('Tenant ID')) {
      alert('Error: ' + errorMessage + '\n\nPastikan Anda sudah memilih tenant (untuk Super Admin) atau sudah login dengan benar.');
    } else {
      alert('Gagal memuat data langganan dan addon.\n\nError: ' + errorMessage + '\n\nSilakan refresh halaman atau hubungi administrator.');
    }
  }
};

const claimReward = () => {
  // Generate session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Redirect to reward view page
  router.push({
    name: 'reward-view',
    query: { session: sessionId },
  });
};

const redeemSubscription = async (plan: any) => {
  if (!confirm(`Tukar ${plan.pointsRequired} point untuk ${plan.name}?`)) return;
  
  redeeming.value = true;
  try {
    await api.post('/rewards/redeem/subscription', {
      planId: plan.id,
      pointsRequired: plan.pointsRequired,
    });
    
    alert('Berhasil! Langganan Anda telah diperpanjang.');
    await loadBalance();
    await loadTransactions();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Error menukar point');
  } finally {
    redeeming.value = false;
  }
};

const redeemAddon = async (addon: any) => {
  if (!confirm(`Tukar ${addon.pointsRequired} point untuk ${addon.name}?`)) return;
  
  redeeming.value = true;
  try {
    await api.post('/rewards/redeem/addon', {
      addonId: addon.id,
      addonName: addon.name,
      pointsRequired: addon.pointsRequired,
    });
    
    alert('Berhasil! Addon telah diaktifkan.');
    await loadBalance();
    await loadTransactions();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Error menukar point');
  } finally {
    redeeming.value = false;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDaysUntilExpiration = (expirationDate: string): number => {
  const expDate = new Date(expirationDate);
  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    loadBalance(),
    loadDailyLimit(),
    loadTransactions(),
    loadConfig(),
  ]);
  loading.value = false;
});
</script>

