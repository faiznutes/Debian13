<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Customer Engagement</h2>
        <p class="text-gray-600">Analisis engagement level pelanggan</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Overall Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">High Engagement</p>
              <p class="text-3xl font-bold text-gray-900">{{ overallStats.high || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Medium Engagement</p>
              <p class="text-3xl font-bold text-gray-900">{{ overallStats.medium || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Low Engagement</p>
              <p class="text-3xl font-bold text-gray-900">{{ overallStats.low || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Inactive</p>
              <p class="text-3xl font-bold text-gray-900">{{ overallStats.inactive || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center space-x-4 mb-6">
          <select
            v-model="selectedLevel"
            @change="loadCustomers"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Levels</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search customers..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            @input="loadCustomers"
          />
        </div>

        <!-- Customers List -->
        <div v-if="customersLoading" class="text-center py-12">
          <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        <div v-else-if="customers.length === 0" class="text-center py-12 text-gray-500">
          <p>No customers found</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="customer in customers"
            :key="customer.customerId"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ customer.customerName || 'Unknown' }}</h3>
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getEngagementLevelClass(customer.engagementLevel)"
                  >
                    {{ customer.engagementLevel }}
                  </span>
                  <span class="text-sm text-gray-600">Score: {{ customer.engagementScore }}/100</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p class="text-gray-500">Total Orders</p>
                    <p class="font-semibold text-gray-900">{{ customer.totalOrders || 0 }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Total Spent</p>
                    <p class="font-semibold text-gray-900">Rp {{ formatCurrency(customer.totalSpent || 0) }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Order Frequency</p>
                    <p class="font-semibold text-gray-900">{{ customer.orderFrequency || 0 }}x</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Email Engagement</p>
                    <p class="font-semibold text-gray-900">{{ formatPercentage(customer.emailEngagement || 0) }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';

const { error: showError } = useNotification();

interface CustomerEngagement {
  customerId: string;
  customerName?: string;
  engagementScore: number;
  engagementLevel: string;
  totalOrders: number;
  totalSpent: number;
  orderFrequency: number;
  emailEngagement: number;
}

const loading = ref(false);
const customersLoading = ref(false);
const overallStats = ref<any>({});
const customers = ref<CustomerEngagement[]>([]);
const selectedLevel = ref('');
const searchQuery = ref('');

const loadOverallStats = async () => {
  loading.value = true;
  try {
    const response = await api.get('/customer-engagement/stats/overall');
    overallStats.value = response.data.distribution || {};
  } catch (error: any) {
    console.error('Error loading overall stats:', error);
    await showError('Gagal memuat overall stats');
  } finally {
    loading.value = false;
  }
};

const loadCustomers = async () => {
  customersLoading.value = true;
  try {
    const params: any = {};
    if (selectedLevel.value) {
      params.level = selectedLevel.value;
    }
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    const response = await api.get('/customer-engagement', { params });
    customers.value = response.data || [];
  } catch (error: any) {
    console.error('Error loading customers:', error);
    await showError('Gagal memuat customers');
  } finally {
    customersLoading.value = false;
  }
};

const getEngagementLevelClass = (level: string): string => {
  const classes: Record<string, string> = {
    HIGH: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    LOW: 'bg-yellow-100 text-yellow-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  };
  return classes[level] || 'bg-gray-100 text-gray-800';
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

const formatPercentage = (value: number): string => {
  return value.toFixed(2);
};

onMounted(() => {
  loadOverallStats();
  loadCustomers();
});
</script>

