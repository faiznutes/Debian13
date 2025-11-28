<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Email Analytics</h2>
        <p class="text-gray-600">Analisis performa email campaign</p>
      </div>
      <div class="flex items-center space-x-4">
        <input
          v-model="dateRange.start"
          type="date"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <span class="text-gray-600">to</span>
        <input
          v-model="dateRange.end"
          type="date"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <button
          @click="loadAnalytics"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Filter
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Overall Stats -->
    <div v-else class="space-y-6">
      <!-- Overall Analytics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Sent</p>
              <p class="text-3xl font-bold text-gray-900">{{ overallAnalytics.sent || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Open Rate</p>
              <p class="text-3xl font-bold text-gray-900">{{ formatPercentage(overallAnalytics.openRate || 0) }}%</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Click Rate</p>
              <p class="text-3xl font-bold text-gray-900">{{ formatPercentage(overallAnalytics.clickRate || 0) }}%</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2-5M9.396 6.622a4 4 0 115.208 5.208l-5.208-5.208zM13 13l2-7 7 2-2 7-7-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Bounce Rate</p>
              <p class="text-3xl font-bold text-gray-900">{{ formatPercentage(overallAnalytics.bounceRate || 0) }}%</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Campaign Analytics -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900">Campaign Performance</h3>
          <select
            v-model="selectedCampaignId"
            @change="loadCampaignAnalytics"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Campaigns</option>
            <option v-for="campaign in campaigns" :key="campaign.id" :value="campaign.id">
              {{ campaign.name }}
            </option>
          </select>
        </div>

        <div v-if="selectedCampaignId && campaignAnalytics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Sent</p>
            <p class="text-2xl font-bold text-gray-900">{{ campaignAnalytics.sent || 0 }}</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Opened</p>
            <p class="text-2xl font-bold text-green-600">{{ campaignAnalytics.opened || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Open Rate: {{ formatPercentage(campaignAnalytics.openRate || 0) }}%</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Clicked</p>
            <p class="text-2xl font-bold text-purple-600">{{ campaignAnalytics.clicked || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Click Rate: {{ formatPercentage(campaignAnalytics.clickRate || 0) }}%</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Unique Opens</p>
            <p class="text-2xl font-bold text-blue-600">{{ campaignAnalytics.uniqueOpens || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Unique Open Rate: {{ formatPercentage(campaignAnalytics.uniqueOpenRate || 0) }}%</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Unique Clicks</p>
            <p class="text-2xl font-bold text-indigo-600">{{ campaignAnalytics.uniqueClicks || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Unique Click Rate: {{ formatPercentage(campaignAnalytics.uniqueClickRate || 0) }}%</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">Bounced</p>
            <p class="text-2xl font-bold text-red-600">{{ campaignAnalytics.bounced || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Bounce Rate: {{ formatPercentage(campaignAnalytics.bounceRate || 0) }}%</p>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <p>Pilih campaign untuk melihat detail analytics</p>
        </div>
      </div>

      <!-- Event Timeline -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-6">Recent Events</h3>
        <div v-if="recentEvents.length === 0" class="text-center py-12 text-gray-500">
          <p>Belum ada events</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="event in recentEvents"
            :key="event.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="getEventTypeClass(event.eventType)"
              >
                <svg class="w-5 h-5" :class="getEventTypeIconClass(event.eventType)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon(event.eventType)" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ event.email }}</p>
                <p class="text-sm text-gray-600">{{ event.eventType }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">{{ formatDate(event.createdAt) }}</p>
              <p v-if="event.linkUrl" class="text-xs text-blue-600 truncate max-w-xs">{{ event.linkUrl }}</p>
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

interface EmailEvent {
  id: string;
  email: string;
  eventType: string;
  linkUrl?: string;
  createdAt: string;
}

interface CampaignAnalytics {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  uniqueOpens: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  uniqueOpenRate: number;
  uniqueClickRate: number;
  bounceRate: number;
}

const loading = ref(false);
const overallAnalytics = ref<any>({});
const campaignAnalytics = ref<CampaignAnalytics | null>(null);
const campaigns = ref<any[]>([]);
const selectedCampaignId = ref('');
const recentEvents = ref<EmailEvent[]>([]);
const dateRange = ref({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
});

const loadAnalytics = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (dateRange.value.start) {
      params.startDate = dateRange.value.start;
    }
    if (dateRange.value.end) {
      params.endDate = dateRange.value.end;
    }
    
    // Load overall analytics
    const overallResponse = await api.get('/email-analytics/overall', { params });
    overallAnalytics.value = overallResponse.data;

    // Load campaigns
    const campaignsResponse = await api.get('/marketing/campaigns');
    campaigns.value = campaignsResponse.data || [];

    // Load recent events (last 50)
    // Note: This would need a new endpoint or we can use the existing track endpoint
    // For now, we'll skip this or implement a separate endpoint
  } catch (error: any) {
    console.error('Error loading analytics:', error);
    await showError('Gagal memuat analytics');
  } finally {
    loading.value = false;
  }
};

const loadCampaignAnalytics = async () => {
  if (!selectedCampaignId.value) {
    campaignAnalytics.value = null;
    return;
  }

  try {
    const response = await api.get(`/email-analytics/campaign/${selectedCampaignId.value}`);
    campaignAnalytics.value = response.data;
  } catch (error: any) {
    console.error('Error loading campaign analytics:', error);
    await showError('Gagal memuat campaign analytics');
  }
};

const formatPercentage = (value: number): string => {
  return value.toFixed(2);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID');
};

const getEventTypeClass = (eventType: string): string => {
  const classes: Record<string, string> = {
    SENT: 'bg-blue-100',
    OPENED: 'bg-green-100',
    CLICKED: 'bg-purple-100',
    BOUNCED: 'bg-red-100',
    UNSUBSCRIBED: 'bg-gray-100',
  };
  return classes[eventType] || 'bg-gray-100';
};

const getEventTypeIconClass = (eventType: string): string => {
  const classes: Record<string, string> = {
    SENT: 'text-blue-600',
    OPENED: 'text-green-600',
    CLICKED: 'text-purple-600',
    BOUNCED: 'text-red-600',
    UNSUBSCRIBED: 'text-gray-600',
  };
  return classes[eventType] || 'text-gray-600';
};

const getEventTypeIcon = (eventType: string): string => {
  const icons: Record<string, string> = {
    SENT: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    OPENED: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    CLICKED: 'M15 15l-2-5M9.396 6.622a4 4 0 115.208 5.208l-5.208-5.208zM13 13l2-7 7 2-2 7-7-2z',
    BOUNCED: 'M6 18L18 6M6 6l12 12',
    UNSUBSCRIBED: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  };
  return icons[eventType] || 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
};

onMounted(() => {
  loadAnalytics();
});
</script>

