<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Marketing Campaigns</h2>
        <p class="text-gray-600">Kelola campaign SMS, Email, dan Promo</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        Buat Campaign
      </button>
    </div>

    <!-- Campaigns Grid -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="campaigns.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
      <p class="text-gray-500">Belum ada campaign</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="campaign in campaigns"
        :key="campaign.id"
        class="bg-white rounded-lg shadow-lg p-6 border-2"
        :class="campaign.status === 'ACTIVE' ? 'border-green-500' : 'border-gray-200'"
      >
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">{{ campaign.name }}</h3>
          <span
            class="px-2 py-1 text-xs font-semibold rounded-full"
            :class="campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
          >
            {{ campaign.status }}
          </span>
        </div>
        <p class="text-sm text-gray-600 mb-4">{{ campaign.description }}</p>
        <div class="space-y-2 mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Tipe:</span>
            <span class="font-semibold">{{ campaign.type }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Target:</span>
            <span class="font-semibold">{{ campaign.targetCount }} penerima</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Terikirim:</span>
            <span class="font-semibold">{{ campaign.sentCount || 0 }}</span>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            @click="viewCampaign(campaign)"
            class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          >
            Detail
          </button>
          <button
            v-if="campaign.status === 'DRAFT'"
            @click="sendCampaign(campaign.id)"
            class="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>

    <!-- Create Campaign Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Buat Campaign Baru</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nama Campaign</label>
              <input
                v-model="campaignForm.name"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Promo Lebaran 2025"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Campaign</label>
              <select
                v-model="campaignForm.type"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PROMO">Promo/Voucher</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <select
                v-model="campaignForm.target"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">Semua Customer</option>
                <option value="MEMBERS">Member Saja</option>
                <option value="ACTIVE">Customer Aktif</option>
                <option value="INACTIVE">Customer Tidak Aktif</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pesan/Content</label>
              <textarea
                v-model="campaignForm.content"
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Masukkan pesan campaign..."
              ></textarea>
            </div>
            <div v-if="campaignForm.type === 'PROMO'">
              <label class="block text-sm font-medium text-gray-700 mb-2">Kode Promo</label>
              <input
                v-model="campaignForm.promoCode"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="LEBARAN20"
              />
            </div>
            <div class="flex space-x-3">
              <button
                @click="showCreateModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                @click="saveCampaign"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Campaign Detail Modal -->
    <CampaignDetailModal
      :show="showDetailModal"
      :campaign="viewingCampaign"
      @close="showDetailModal = false; viewingCampaign = null"
      @send="handleSendFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import CampaignDetailModal from '../../components/CampaignDetailModal.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';

const { needsTenantSelection } = useTenantCheck();
const { success: showSuccess, error: showError, info: showInfo, confirm: showConfirm } = useNotification();

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status: string;
  targetCount?: number;
  sentCount?: number;
  targetAudience?: string;
  startDate?: string;
  endDate?: string;
  opens?: number;
  clicks?: number;
  conversions?: number;
}

const campaigns = ref<Campaign[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);

const campaignForm = ref({
  name: '',
  type: 'SMS',
  target: 'ALL',
  content: '',
  promoCode: '',
});

const loadCampaigns = async () => {
  if (needsTenantSelection.value) return;

  loading.value = true;
  try {
    const response = await api.get('/marketing/campaigns');
    campaigns.value = response.data.data || response.data || [];
  } catch (error: any) {
    console.error('Error loading campaigns:', error);
    campaigns.value = [];
  } finally {
    loading.value = false;
  }
};

const showDetailModal = ref(false);
const viewingCampaign = ref<Campaign | null>(null);

const viewCampaign = (campaign: Campaign) => {
  viewingCampaign.value = campaign;
  showDetailModal.value = true;
};

const handleSendFromDetail = async (campaignId: string) => {
  showDetailModal.value = false;
  await sendCampaign(campaignId);
};

const sendCampaign = async (campaignId: string) => {
  const confirmed = await showConfirm('Kirim campaign ini sekarang?');
  if (!confirmed) return;
  try {
    await api.post(`/marketing/campaigns/${campaignId}/send`);
    await loadCampaigns();
    await showSuccess('Campaign berhasil dikirim');
  } catch (error: any) {
    console.error('Error sending campaign:', error);
    await showError(error.response?.data?.message || 'Gagal mengirim campaign');
  }
};

const saveCampaign = async () => {
  try {
    await api.post('/marketing/campaigns', campaignForm.value);
    await showSuccess('Campaign berhasil dibuat');
    showCreateModal.value = false;
    campaignForm.value = {
      name: '',
      type: 'SMS',
      target: 'ALL',
      content: '',
      promoCode: '',
    };
    await loadCampaigns();
  } catch (error: any) {
    console.error('Error saving campaign:', error);
    await showError(error.response?.data?.message || 'Gagal membuat campaign');
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadCampaigns();
});
</script>

