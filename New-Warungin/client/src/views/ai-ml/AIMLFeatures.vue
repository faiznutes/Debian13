<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">AI/ML Features</h2>
        <p class="text-gray-600">Sales forecasting, product recommendations, customer segmentation, dan price optimization</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex space-x-8">
        <button
          @click="activeTab = 'forecast'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'forecast' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Sales Forecast
        </button>
        <button
          @click="activeTab = 'recommendations'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'recommendations' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Product Recommendations
        </button>
        <button
          @click="activeTab = 'segmentation'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'segmentation' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Customer Segmentation
        </button>
        <button
          @click="activeTab = 'pricing'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'pricing' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Price Optimization
        </button>
      </nav>
    </div>

    <!-- Sales Forecast Tab -->
    <div v-if="activeTab === 'forecast'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Sales Forecasting</h3>
          <div class="flex items-center space-x-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Period (Months)</label>
              <input
                v-model.number="forecastPeriod"
                type="number"
                min="1"
                max="12"
                class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              @click="loadSalesForecast"
              :disabled="loading"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {{ loading ? 'Loading...' : 'Generate Forecast' }}
            </button>
          </div>
        </div>

        <div v-if="salesForecast.length > 0" class="space-y-4">
          <!-- Summary Card -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <p class="text-sm text-gray-600 mb-1">Total Forecasted Revenue</p>
              <p class="text-2xl font-bold text-green-600">Rp {{ formatCurrency(salesForecastSummary.totalRevenue) }}</p>
            </div>
            <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p class="text-sm text-gray-600 mb-1">Average Monthly</p>
              <p class="text-2xl font-bold text-blue-600">Rp {{ formatCurrency(salesForecastSummary.averageMonthly) }}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
              <p class="text-sm text-gray-600 mb-1">Growth Rate</p>
              <p class="text-2xl font-bold text-purple-600">{{ (salesForecastSummary.growthRate * 100).toFixed(1) }}%</p>
            </div>
            <div class="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
              <p class="text-sm text-gray-600 mb-1">Confidence</p>
              <p class="text-2xl font-bold text-yellow-600">{{ (salesForecastSummary.confidence * 100).toFixed(0) }}%</p>
            </div>
          </div>

          <!-- Forecast Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecasted Revenue</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(forecast, index) in salesForecast" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ forecast.month }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {{ formatCurrency(forecast.forecastedRevenue) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm" :class="forecast.growthRate >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ (forecast.growthRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ (forecast.confidence * 100).toFixed(0) }}%</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-semibold rounded-full"
                      :class="getTrendClass(forecast.trend)"
                    >
                      {{ forecast.trend }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-500">
          Klik "Generate Forecast" untuk melihat prediksi penjualan
        </div>
      </div>
    </div>

    <!-- Product Recommendations Tab -->
    <div v-if="activeTab === 'recommendations'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Product Recommendations</h3>
          <div class="flex items-center space-x-4">
            <select
              v-model="recommendationType"
              @change="loadProductRecommendations"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="FREQUENTLY_BOUGHT_TOGETHER">Frequently Bought Together</option>
              <option value="PERSONALIZED">Personalized</option>
              <option value="TRENDING">Trending</option>
            </select>
            <input
              v-if="recommendationType === 'PERSONALIZED'"
              v-model="customerIdForRecommendation"
              type="text"
              placeholder="Customer ID"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div v-if="productRecommendations.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="rec in productRecommendations"
            :key="rec.productId"
            class="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-semibold text-gray-900">{{ rec.productName }}</h4>
              <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {{ (rec.confidence * 100).toFixed(0) }}% match
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ rec.reason }}</p>
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-gray-900">Rp {{ formatCurrency(rec.price) }}</span>
              <span class="text-xs text-gray-500">{{ rec.recommendationType }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-500">
          Pilih tipe recommendation dan klik untuk memuat
        </div>
      </div>
    </div>

    <!-- Customer Segmentation Tab -->
    <div v-if="activeTab === 'segmentation'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Customer Segmentation</h3>
          <button
            @click="loadCustomerSegments"
            :disabled="loading"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {{ loading ? 'Loading...' : 'Refresh Segments' }}
          </button>
        </div>

        <div v-if="customerSegments.length > 0" class="space-y-4">
          <div
            v-for="segment in customerSegments"
            :key="segment.segment"
            class="border-l-4 rounded-lg p-6"
            :class="getSegmentBorderClass(segment.segment)"
          >
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-xl font-bold text-gray-900">{{ segment.segment }}</h4>
                <p class="text-sm text-gray-600">{{ segment.description }}</p>
              </div>
              <span class="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                {{ segment.customerCount }} customers
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-600">Total Revenue</p>
                <p class="text-lg font-semibold text-gray-900">Rp {{ formatCurrency(segment.totalRevenue) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Average Order Value</p>
                <p class="text-lg font-semibold text-gray-900">Rp {{ formatCurrency(segment.averageOrderValue) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Purchase Frequency</p>
                <p class="text-lg font-semibold text-gray-900">{{ segment.purchaseFrequency.toFixed(1) }}x/month</p>
              </div>
            </div>

            <div v-if="segment.topCustomers && segment.topCustomers.length > 0" class="mt-4">
              <p class="text-sm font-medium text-gray-700 mb-2">Top Customers:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="customer in segment.topCustomers.slice(0, 5)"
                  :key="customer.id"
                  class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {{ customer.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-500">
          Klik "Refresh Segments" untuk melihat customer segmentation
        </div>
      </div>
    </div>

    <!-- Price Optimization Tab -->
    <div v-if="activeTab === 'pricing'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Price Optimization</h3>
          <div class="flex items-center space-x-4">
            <select
              v-model="optimizationStrategy"
              @change="loadPriceOptimization"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="DEMAND_BASED">Demand-Based</option>
              <option value="PROFIT_MARGIN">Profit Margin</option>
              <option value="COMPETITIVE">Competitive</option>
            </select>
            <button
              @click="loadPriceOptimization"
              :disabled="loading"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {{ loading ? 'Loading...' : 'Optimize Prices' }}
            </button>
          </div>
        </div>

        <div v-if="priceOptimizations.length > 0" class="space-y-4">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Price</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Impact</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="opt in priceOptimizations" :key="opt.productId">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ opt.productName }}</p>
                      <p class="text-xs text-gray-500">{{ opt.category }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {{ formatCurrency(opt.currentPrice) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">Rp {{ formatCurrency(opt.recommendedPrice) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm" :class="opt.priceChange >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ opt.priceChange >= 0 ? '+' : '' }}{{ (opt.priceChange * 100).toFixed(1) }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">
                      <p class="text-gray-900">Revenue: <span class="font-semibold" :class="opt.expectedRevenueChange >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ opt.expectedRevenueChange >= 0 ? '+' : '' }}{{ (opt.expectedRevenueChange * 100).toFixed(1) }}%
                      </span></p>
                      <p class="text-gray-600">Profit: <span class="font-semibold" :class="opt.expectedProfitChange >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ opt.expectedProfitChange >= 0 ? '+' : '' }}{{ (opt.expectedProfitChange * 100).toFixed(1) }}%
                      </span></p>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button
                      @click="applyPriceOptimization(opt)"
                      class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-500">
          Pilih strategy dan klik "Optimize Prices" untuk melihat rekomendasi
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError } = useNotification();

const activeTab = ref('forecast');
const loading = ref(false);
const forecastPeriod = ref(6);
const salesForecast = ref<any[]>([]);
const productRecommendations = ref<any[]>([]);
const customerSegments = ref<any[]>([]);
const priceOptimizations = ref<any[]>([]);
const recommendationType = ref('FREQUENTLY_BOUGHT_TOGETHER');
const customerIdForRecommendation = ref('');
const optimizationStrategy = ref('DEMAND_BASED');

const salesForecastSummary = computed(() => {
  if (salesForecast.value.length === 0) {
    return {
      totalRevenue: 0,
      averageMonthly: 0,
      growthRate: 0,
      confidence: 0,
    };
  }
  const total = salesForecast.value.reduce((sum: number, f: any) => sum + f.forecastedRevenue, 0);
  const avg = total / salesForecast.value.length;
  const growth = salesForecast.value.length > 1
    ? (salesForecast.value[salesForecast.value.length - 1].forecastedRevenue - salesForecast.value[0].forecastedRevenue) / salesForecast.value[0].forecastedRevenue
    : 0;
  const avgConfidence = salesForecast.value.reduce((sum: number, f: any) => sum + f.confidence, 0) / salesForecast.value.length;
  return {
    totalRevenue: total,
    averageMonthly: avg,
    growthRate: growth,
    confidence: avgConfidence,
  };
});

const loadSalesForecast = async () => {
  loading.value = true;
  try {
    const response = await api.get('/ai-ml/sales-forecast', {
      params: { months: forecastPeriod.value },
    });
    salesForecast.value = response.data;
    await showSuccess('Sales forecast berhasil di-generate');
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Gagal memuat sales forecast';
    await showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const loadProductRecommendations = async () => {
  loading.value = true;
  try {
    const params: any = { type: recommendationType.value };
    if (recommendationType.value === 'PERSONALIZED' && customerIdForRecommendation.value) {
      params.customerId = customerIdForRecommendation.value;
    }
    const response = await api.get('/ai-ml/product-recommendations', { params });
    productRecommendations.value = response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Gagal memuat product recommendations';
    await showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const loadCustomerSegments = async () => {
  loading.value = true;
  try {
    const response = await api.get('/ai-ml/customer-segments');
    customerSegments.value = response.data;
    await showSuccess('Customer segments berhasil di-refresh');
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Gagal memuat customer segments';
    await showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const loadPriceOptimization = async () => {
  loading.value = true;
  try {
    const response = await api.get('/ai-ml/price-optimization', {
      params: { strategy: optimizationStrategy.value },
    });
    priceOptimizations.value = response.data;
    await showSuccess('Price optimization berhasil di-generate');
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Gagal memuat price optimization';
    await showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const applyPriceOptimization = async (optimization: any) => {
  try {
    await api.put(`/products/${optimization.productId}`, {
      price: optimization.recommendedPrice,
    });
    await showSuccess(`Price untuk ${optimization.productName} berhasil di-update`);
    await loadPriceOptimization();
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Gagal apply price optimization';
    await showError(errorMessage);
  }
};

const getTrendClass = (trend: string): string => {
  const classes: Record<string, string> = {
    UP: 'bg-green-100 text-green-800',
    DOWN: 'bg-red-100 text-red-800',
    STABLE: 'bg-gray-100 text-gray-800',
  };
  return classes[trend] || 'bg-gray-100 text-gray-800';
};

const getSegmentBorderClass = (segment: string): string => {
  const classes: Record<string, string> = {
    VIP: 'border-purple-500 bg-purple-50',
    REGULAR: 'border-blue-500 bg-blue-50',
    AT_RISK: 'border-yellow-500 bg-yellow-50',
    NEW: 'border-green-500 bg-green-50',
  };
  return classes[segment] || 'border-gray-500 bg-gray-50';
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

onMounted(() => {
  // Auto-load segments on mount
  loadCustomerSegments();
});
</script>

