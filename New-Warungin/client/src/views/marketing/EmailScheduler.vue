<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Email Scheduler</h2>
        <p class="text-gray-600">Jadwalkan pengiriman email campaign</p>
      </div>
      <button
        @click="showScheduleModal = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Jadwalkan Email</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex items-center space-x-4">
      <select
        v-model="statusFilter"
        @change="loadSchedules"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">Semua Status</option>
        <option value="PENDING">Pending</option>
        <option value="SENT">Sent</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="FAILED">Failed</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="schedules.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-gray-500">Belum ada scheduled emails</p>
    </div>

    <!-- Schedules List -->
    <div v-else class="space-y-4">
      <div
        v-for="schedule in schedules"
        :key="schedule.id"
        class="bg-white rounded-lg shadow-lg p-6 border-l-4"
        :class="getStatusBorderClass(schedule.status)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ schedule.subject }}</h3>
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="getStatusClass(schedule.status)"
              >
                {{ schedule.status }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-4">{{ schedule.content.substring(0, 100) }}...</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-gray-500">Scheduled At</p>
                <p class="font-semibold text-gray-900">{{ formatDateTime(schedule.scheduledAt) }}</p>
              </div>
              <div>
                <p class="text-gray-500">Target</p>
                <p class="font-semibold text-gray-900">{{ schedule.target }}</p>
              </div>
              <div>
                <p class="text-gray-500">Campaign ID</p>
                <p class="font-semibold text-gray-900 text-xs">{{ schedule.campaignId }}</p>
              </div>
              <div>
                <p class="text-gray-500">Template</p>
                <p class="font-semibold text-gray-900 text-xs">{{ schedule.templateId || 'No template' }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2 ml-4">
            <button
              v-if="schedule.status === 'PENDING'"
              @click="cancelSchedule(schedule)"
              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
            >
              Cancel
            </button>
            <button
              v-if="schedule.status === 'PENDING'"
              @click="editSchedule(schedule)"
              class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Modal -->
    <div
      v-if="showScheduleModal || editingSchedule"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              {{ editingSchedule ? 'Edit Schedule' : 'Jadwalkan Email' }}
            </h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveSchedule" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Campaign ID</label>
              <input
                v-model="scheduleForm.campaignId"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Campaign ID"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                v-model="scheduleForm.subject"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Email subject"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                v-model="scheduleForm.content"
                required
                rows="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Email content"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                v-model="scheduleForm.target"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="ALL">All Customers</option>
                <option value="MEMBERS">Members Only</option>
                <option value="ACTIVE">Active Customers</option>
                <option value="INACTIVE">Inactive Customers</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
              <input
                v-model="scheduleForm.scheduledAt"
                type="datetime-local"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Template ID (Optional)</label>
              <input
                v-model="scheduleForm.templateId"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Template ID"
              />
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : editingSchedule ? 'Update' : 'Jadwalkan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

interface ScheduledEmail {
  id: string;
  campaignId: string;
  scheduledAt: string;
  target: string;
  subject: string;
  content: string;
  templateId?: string;
  status: string;
  createdAt: string;
}

const schedules = ref<ScheduledEmail[]>([]);
const loading = ref(false);
const statusFilter = ref('');
const showScheduleModal = ref(false);
const editingSchedule = ref<ScheduledEmail | null>(null);
const saving = ref(false);

const scheduleForm = ref({
  campaignId: '',
  subject: '',
  content: '',
  target: 'ALL',
  scheduledAt: '',
  templateId: '',
});

const loadSchedules = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (statusFilter.value) {
      params.status = statusFilter.value;
    }
    const response = await api.get('/email-scheduler', { params });
    schedules.value = response.data;
  } catch (error: any) {
    console.error('Error loading schedules:', error);
    await showError('Gagal memuat schedules');
  } finally {
    loading.value = false;
  }
};

const saveSchedule = async () => {
  saving.value = true;
  try {
    const data = {
      campaignId: scheduleForm.value.campaignId,
      subject: scheduleForm.value.subject,
      content: scheduleForm.value.content,
      target: scheduleForm.value.target,
      scheduledAt: new Date(scheduleForm.value.scheduledAt).toISOString(),
      templateId: scheduleForm.value.templateId || undefined,
    };

    if (editingSchedule.value) {
      await api.put(`/email-scheduler/${editingSchedule.value.id}`, data);
      await showSuccess('Schedule berhasil diupdate');
    } else {
      await api.post('/email-scheduler', data);
      await showSuccess('Email berhasil dijadwalkan');
    }

    closeModal();
    await loadSchedules();
  } catch (error: any) {
    console.error('Error saving schedule:', error);
    await showError('Gagal menyimpan schedule');
  } finally {
    saving.value = false;
  }
};

const editSchedule = (schedule: ScheduledEmail) => {
  editingSchedule.value = schedule;
  scheduleForm.value = {
    campaignId: schedule.campaignId,
    subject: schedule.subject,
    content: schedule.content,
    target: schedule.target,
    scheduledAt: new Date(schedule.scheduledAt).toISOString().slice(0, 16),
    templateId: schedule.templateId || '',
  };
  showScheduleModal.value = true;
};

const cancelSchedule = async (schedule: ScheduledEmail) => {
  const confirmed = await showConfirm(
    'Cancel Schedule',
    `Apakah Anda yakin ingin membatalkan schedule ini?`
  );
  if (!confirmed) return;

  try {
    await api.post(`/email-scheduler/${schedule.id}/cancel`);
    await showSuccess('Schedule berhasil dibatalkan');
    await loadSchedules();
  } catch (error: any) {
    console.error('Error cancelling schedule:', error);
    await showError('Gagal membatalkan schedule');
  }
};

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusBorderClass = (status: string): string => {
  const classes: Record<string, string> = {
    PENDING: 'border-yellow-500',
    SENT: 'border-green-500',
    CANCELLED: 'border-gray-500',
    FAILED: 'border-red-500',
  };
  return classes[status] || 'border-gray-500';
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID');
};

const closeModal = () => {
  showScheduleModal.value = false;
  editingSchedule.value = null;
  scheduleForm.value = {
    campaignId: '',
    subject: '',
    content: '',
    target: 'ALL',
    scheduledAt: '',
    templateId: '',
  };
};

onMounted(() => {
  loadSchedules();
});
</script>

