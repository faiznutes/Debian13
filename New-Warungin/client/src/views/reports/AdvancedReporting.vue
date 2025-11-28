<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Advanced Reporting</h2>
        <p class="text-gray-600">Custom reports, scheduled reports, dan dashboard customization</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="showTemplateModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Buat Template</span>
        </button>
        <button
          @click="showScheduleModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Jadwalkan Report</span>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex space-x-8">
        <button
          @click="activeTab = 'templates'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'templates' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Report Templates
        </button>
        <button
          @click="activeTab = 'scheduled'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'scheduled' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Scheduled Reports
        </button>
        <button
          @click="activeTab = 'dashboard'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'dashboard' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Dashboard Settings
        </button>
      </nav>
    </div>

    <!-- Templates Tab -->
    <div v-if="activeTab === 'templates'" class="space-y-4">
      <div v-if="templates.length === 0" class="text-center py-12 bg-white rounded-lg">
        <p class="text-gray-500">Belum ada report template</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="template in templates"
          :key="template.id"
          class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ template.name }}</h3>
          <p class="text-sm text-gray-600 mb-4">{{ template.description || 'No description' }}</p>
          <div class="flex items-center justify-between">
            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              {{ template.type }}
            </span>
            <div class="flex space-x-2">
              <button
                @click="generateReport(template)"
                class="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition"
              >
                Generate
              </button>
              <button
                @click="editTemplate(template)"
                class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scheduled Reports Tab -->
    <div v-if="activeTab === 'scheduled'" class="space-y-4">
      <div v-if="scheduledReports.length === 0" class="text-center py-12 bg-white rounded-lg">
        <p class="text-gray-500">Belum ada scheduled report</p>
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="report in scheduledReports"
          :key="report.id"
          class="bg-white rounded-lg shadow-lg p-6 border-l-4"
          :class="getStatusBorderClass(report.status)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">{{ report.templateName || 'Report' }}</h3>
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusClass(report.status)"
                >
                  {{ report.status }}
                </span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p class="text-gray-500">Schedule</p>
                  <p class="font-semibold text-gray-900">{{ report.schedule }}</p>
                </div>
                <div>
                  <p class="text-gray-500">Format</p>
                  <p class="font-semibold text-gray-900">{{ report.format }}</p>
                </div>
                <div>
                  <p class="text-gray-500">Next Run</p>
                  <p class="font-semibold text-gray-900">{{ report.nextRunAt ? formatDate(report.nextRunAt) : '-' }}</p>
                </div>
                <div>
                  <p class="text-gray-500">Recipients</p>
                  <p class="font-semibold text-gray-900">{{ report.recipients?.length || 0 }} emails</p>
                </div>
              </div>
            </div>
            <div class="flex flex-col space-y-2 ml-4">
              <button
                @click="editSchedule(report)"
                class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
              >
                Edit
              </button>
              <button
                @click="deleteSchedule(report)"
                class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Settings Tab -->
    <div v-if="activeTab === 'dashboard'" class="space-y-4">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Customize Dashboard Layout</h3>
        <p class="text-sm text-gray-600 mb-6">Drag and drop widgets to customize your dashboard</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="widget in dashboardWidgets"
            :key="widget.id"
            class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition cursor-move"
            :class="{ 'border-green-500': selectedWidgets.includes(widget.id) }"
            @click="toggleWidget(widget.id)"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold text-gray-900">{{ widget.name }}</h4>
                <p class="text-xs text-gray-500">{{ widget.description }}</p>
              </div>
              <input
                type="checkbox"
                :checked="selectedWidgets.includes(widget.id)"
                @change="toggleWidget(widget.id)"
                class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            @click="saveDashboardSettings"
            :disabled="saving"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan Layout' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Template Modal -->
    <div
      v-if="showTemplateModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeTemplateModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              {{ editingTemplate ? 'Edit Template' : 'Buat Report Template' }}
            </h3>
            <button
              @click="closeTemplateModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveTemplate" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                v-model="templateForm.name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="templateForm.description"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                v-model="templateForm.type"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Pilih Type</option>
                <option value="SALES">Sales Report</option>
                <option value="INVENTORY">Inventory Report</option>
                <option value="FINANCIAL">Financial Report</option>
                <option value="CUSTOMER">Customer Report</option>
                <option value="CUSTOM">Custom Report</option>
              </select>
            </div>

            <div class="border-t pt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Columns</label>
              <div class="space-y-2">
                <div
                  v-for="(column, index) in templateForm.config.columns"
                  :key="index"
                  class="flex items-center space-x-2"
                >
                  <input
                    v-model="column.field"
                    type="text"
                    placeholder="Field name"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    v-model="column.label"
                    type="text"
                    placeholder="Label"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    @click="removeColumn(index)"
                    class="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
                <button
                  type="button"
                  @click="addColumn"
                  class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                >
                  + Add Column
                </button>
              </div>
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeTemplateModal"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Schedule Modal -->
    <div
      v-if="showScheduleModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeScheduleModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Jadwalkan Report</h3>
            <button
              @click="closeScheduleModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveSchedule" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Template *</label>
              <select
                v-model="scheduleForm.templateId"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Pilih Template</option>
                <option v-for="template in templates" :key="template.id" :value="template.id">
                  {{ template.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Schedule *</label>
              <select
                v-model="scheduleForm.schedule"
                required
                @change="updateScheduleConfig"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div v-if="scheduleForm.schedule === 'WEEKLY'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
              <select
                v-model="scheduleForm.scheduleConfig.dayOfWeek"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option :value="1">Monday</option>
                <option :value="2">Tuesday</option>
                <option :value="3">Wednesday</option>
                <option :value="4">Thursday</option>
                <option :value="5">Friday</option>
                <option :value="6">Saturday</option>
                <option :value="0">Sunday</option>
              </select>
            </div>

            <div v-if="scheduleForm.schedule === 'MONTHLY'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
              <input
                v-model.number="scheduleForm.scheduleConfig.dayOfMonth"
                type="number"
                min="1"
                max="31"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                v-model="scheduleForm.scheduleConfig.time"
                type="time"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Format *</label>
              <select
                v-model="scheduleForm.format"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="PDF">PDF</option>
                <option value="EXCEL">Excel</option>
                <option value="CSV">CSV</option>
                <option value="HTML">HTML</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Recipients (Email) *</label>
              <textarea
                v-model="scheduleForm.recipientsText"
                rows="3"
                placeholder="Enter email addresses, one per line"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeScheduleModal"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
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

const activeTab = ref('templates');
const templates = ref<any[]>([]);
const scheduledReports = ref<any[]>([]);
const dashboardWidgets = ref([
  { id: 'sales-overview', name: 'Sales Overview', description: 'Total sales and revenue' },
  { id: 'top-products', name: 'Top Products', description: 'Best selling products' },
  { id: 'recent-orders', name: 'Recent Orders', description: 'Latest orders' },
  { id: 'customer-stats', name: 'Customer Stats', description: 'Customer metrics' },
  { id: 'inventory-alerts', name: 'Inventory Alerts', description: 'Low stock warnings' },
  { id: 'financial-summary', name: 'Financial Summary', description: 'Revenue and expenses' },
]);
const selectedWidgets = ref<string[]>([]);
const showTemplateModal = ref(false);
const showScheduleModal = ref(false);
const editingTemplate = ref<any>(null);
const saving = ref(false);

const templateForm = ref({
  name: '',
  description: '',
  type: '',
  config: {
    columns: [{ field: '', label: '', type: 'string' }],
    filters: [],
  },
});

const scheduleForm = ref({
  templateId: '',
  schedule: 'DAILY',
  scheduleConfig: {
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
  },
  format: 'PDF',
  recipientsText: '',
});

const loadTemplates = async () => {
  try {
    const response = await api.get('/advanced-reporting/templates');
    templates.value = response.data.data || [];
  } catch (error: any) {
    console.error('Error loading templates:', error);
    await showError('Gagal memuat templates');
  }
};

const loadScheduledReports = async () => {
  try {
    const response = await api.get('/advanced-reporting/scheduled');
    scheduledReports.value = response.data.data || [];
  } catch (error: any) {
    console.error('Error loading scheduled reports:', error);
  }
};

const loadDashboardSettings = async () => {
  try {
    const response = await api.get('/advanced-reporting/dashboard-settings');
    if (response.data.widgets) {
      selectedWidgets.value = response.data.widgets.map((w: any) => w.id);
    }
  } catch (error: any) {
    console.error('Error loading dashboard settings:', error);
  }
};

const saveTemplate = async () => {
  saving.value = true;
  try {
    if (editingTemplate.value) {
      await api.put(`/advanced-reporting/templates/${editingTemplate.value.id}`, templateForm.value);
      await showSuccess('Template berhasil diupdate');
    } else {
      await api.post('/advanced-reporting/templates', templateForm.value);
      await showSuccess('Template berhasil dibuat');
    }
    closeTemplateModal();
    await loadTemplates();
  } catch (error: any) {
    console.error('Error saving template:', error);
    await showError('Gagal menyimpan template');
  } finally {
    saving.value = false;
  }
};

const saveSchedule = async () => {
  saving.value = true;
  try {
    const recipients = scheduleForm.value.recipientsText.split('\n').filter(e => e.trim());
    const data = {
      ...scheduleForm.value,
      recipients,
    };
    delete data.recipientsText;
    
    await api.post('/advanced-reporting/scheduled', data);
    await showSuccess('Scheduled report berhasil dibuat');
    closeScheduleModal();
    await loadScheduledReports();
  } catch (error: any) {
    console.error('Error saving schedule:', error);
    await showError('Gagal menyimpan schedule');
  } finally {
    saving.value = false;
  }
};

const saveDashboardSettings = async () => {
  saving.value = true;
  try {
    const settings = {
      widgets: selectedWidgets.value.map(id => ({
        id,
        position: { x: 0, y: 0 },
        size: { w: 4, h: 2 },
      })),
      layout: 'grid',
    };
    await api.put('/advanced-reporting/dashboard-settings', settings);
    await showSuccess('Dashboard settings berhasil disimpan');
  } catch (error: any) {
    console.error('Error saving dashboard settings:', error);
    await showError('Gagal menyimpan dashboard settings');
  } finally {
    saving.value = false;
  }
};

const generateReport = async (template: any) => {
  try {
    const response = await api.post('/advanced-reporting/generate', {
      templateId: template.id,
    });
    // TODO: Handle report download/display
    await showSuccess('Report berhasil di-generate');
  } catch (error: any) {
    console.error('Error generating report:', error);
    await showError('Gagal generate report');
  }
};

const editTemplate = (template: any) => {
  editingTemplate.value = template;
  templateForm.value = {
    name: template.name,
    description: template.description || '',
    type: template.type,
    config: template.config || { columns: [], filters: [] },
  };
  showTemplateModal.value = true;
};

const editSchedule = (report: any) => {
  // TODO: Implement edit schedule
  console.log('Edit schedule:', report);
};

const deleteSchedule = async (report: any) => {
  const confirmed = await showConfirm('Hapus Schedule', 'Apakah Anda yakin ingin menghapus scheduled report ini?');
  if (!confirmed) return;
  // TODO: Implement delete schedule
};

const addColumn = () => {
  templateForm.value.config.columns.push({ field: '', label: '', type: 'string' });
};

const removeColumn = (index: number) => {
  templateForm.value.config.columns.splice(index, 1);
};

const toggleWidget = (widgetId: string) => {
  const index = selectedWidgets.value.indexOf(widgetId);
  if (index > -1) {
    selectedWidgets.value.splice(index, 1);
  } else {
    selectedWidgets.value.push(widgetId);
  }
};

const updateScheduleConfig = () => {
  // Reset config based on schedule type
  if (scheduleForm.value.schedule === 'DAILY') {
    scheduleForm.value.scheduleConfig = { time: '09:00' };
  } else if (scheduleForm.value.schedule === 'WEEKLY') {
    scheduleForm.value.scheduleConfig = { dayOfWeek: 1, time: '09:00' };
  } else if (scheduleForm.value.schedule === 'MONTHLY') {
    scheduleForm.value.scheduleConfig = { dayOfMonth: 1, time: '09:00' };
  }
};

const closeTemplateModal = () => {
  showTemplateModal.value = false;
  editingTemplate.value = null;
  templateForm.value = {
    name: '',
    description: '',
    type: '',
    config: {
      columns: [{ field: '', label: '', type: 'string' }],
      filters: [],
    },
  };
};

const closeScheduleModal = () => {
  showScheduleModal.value = false;
  scheduleForm.value = {
    templateId: '',
    schedule: 'DAILY',
    scheduleConfig: {
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
    },
    format: 'PDF',
    recipientsText: '',
  };
};

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusBorderClass = (status: string): string => {
  const classes: Record<string, string> = {
    ACTIVE: 'border-green-500',
    PENDING: 'border-yellow-500',
    FAILED: 'border-red-500',
    CANCELLED: 'border-gray-500',
  };
  return classes[status] || 'border-gray-500';
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  loadTemplates();
  loadScheduledReports();
  loadDashboardSettings();
});
</script>

