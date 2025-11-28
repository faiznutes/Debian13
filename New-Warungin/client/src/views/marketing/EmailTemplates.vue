<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Email Templates</h2>
        <p class="text-gray-600">Kelola template email untuk campaign</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Template</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex items-center space-x-4">
      <select
        v-model="selectedCategory"
        @change="loadTemplates"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">Semua Kategori</option>
        <option value="PROMOTION">Promotion</option>
        <option value="NOTIFICATION">Notification</option>
        <option value="TRANSACTIONAL">Transactional</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="templates.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-500">Belum ada template</p>
    </div>

    <!-- Templates Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="bg-white rounded-lg shadow-lg p-6 border-2"
        :class="template.isActive ? 'border-green-500' : 'border-gray-200 opacity-60'"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ template.name }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ template.subject }}</p>
            <span
              class="inline-block px-2 py-1 text-xs font-semibold rounded-full"
              :class="getCategoryClass(template.category)"
            >
              {{ template.category }}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <span
              v-if="template.isActive"
              class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
            >
              Active
            </span>
            <span
              v-else
              class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800"
            >
              Inactive
            </span>
          </div>
        </div>

        <div class="mb-4">
          <p class="text-xs text-gray-500 mb-2">Variables:</p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="variable in template.variables || []"
              :key="variable"
              class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {{ variable }}
            </span>
            <span v-if="!template.variables || template.variables.length === 0" class="text-xs text-gray-400">
              No variables
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-4 border-t">
          <span class="text-xs text-gray-500">
            {{ new Date(template.createdAt).toLocaleDateString() }}
          </span>
          <div class="flex items-center space-x-2">
            <button
              @click="previewTemplate(template)"
              class="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition"
            >
              Preview
            </button>
            <button
              @click="editTemplate(template)"
              class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
            >
              Edit
            </button>
            <button
              @click="deleteTemplate(template)"
              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || editingTemplate"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              {{ editingTemplate ? 'Edit Template' : 'Tambah Template' }}
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

          <form @submit.prevent="saveTemplate" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
              <input
                v-model="templateForm.name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Nama template"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                v-model="templateForm.subject"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Email subject"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                v-model="templateForm.category"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="PROMOTION">Promotion</option>
                <option value="NOTIFICATION">Notification</option>
                <option value="TRANSACTIONAL">Transactional</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
              <textarea
                v-model="templateForm.htmlContent"
                required
                rows="10"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                placeholder="HTML content dengan variables seperti {{name}}, {{email}}, dll"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Gunakan variables seperti: {{name}}, {{email}}, {{orderNumber}}, dll
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Text Content (Optional)</label>
              <textarea
                v-model="templateForm.textContent"
                rows="5"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                placeholder="Plain text version"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Variables (comma-separated)</label>
              <input
                v-model="templateForm.variablesString"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="name, email, orderNumber"
              />
              <p class="text-xs text-gray-500 mt-1">
                Pisahkan dengan koma (akan otomatis di-extract dari HTML content jika kosong)
              </p>
            </div>

            <div class="flex items-center">
              <input
                v-model="templateForm.isActive"
                type="checkbox"
                id="isActive"
                class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label for="isActive" class="ml-2 text-sm text-gray-700">Active</label>
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
                {{ saving ? 'Menyimpan...' : editingTemplate ? 'Update' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div
      v-if="previewingTemplate"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="previewingTemplate = null"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Preview Template</h3>
            <button
              @click="previewingTemplate = null"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mb-4">
            <h4 class="text-lg font-semibold mb-2">{{ previewingTemplate.name }}</h4>
            <p class="text-sm text-gray-600 mb-4">Subject: {{ previewingTemplate.subject }}</p>
          </div>

          <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div v-html="renderPreview(previewingTemplate.htmlContent)"></div>
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

const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
}

const templates = ref<EmailTemplate[]>([]);
const loading = ref(false);
const selectedCategory = ref('');
const showCreateModal = ref(false);
const editingTemplate = ref<EmailTemplate | null>(null);
const previewingTemplate = ref<EmailTemplate | null>(null);
const saving = ref(false);

const templateForm = ref({
  name: '',
  subject: '',
  htmlContent: '',
  textContent: '',
  category: 'PROMOTION',
  variablesString: '',
  isActive: true,
});

const loadTemplates = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (selectedCategory.value) {
      params.category = selectedCategory.value;
    }
    const response = await api.get('/email-templates', { params });
    templates.value = response.data;
  } catch (error: any) {
    console.error('Error loading templates:', error);
    await showError('Gagal memuat templates');
  } finally {
    loading.value = false;
  }
};

const getCategoryClass = (category: string) => {
  const classes: Record<string, string> = {
    PROMOTION: 'bg-purple-100 text-purple-800',
    NOTIFICATION: 'bg-blue-100 text-blue-800',
    TRANSACTIONAL: 'bg-green-100 text-green-800',
  };
  return classes[category] || 'bg-gray-100 text-gray-800';
};

const extractVariables = (htmlContent: string): string[] => {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = htmlContent.matchAll(regex);
  const variables = new Set<string>();
  for (const match of matches) {
    variables.add(match[1]);
  }
  return Array.from(variables);
};

const saveTemplate = async () => {
  saving.value = true;
  try {
    // Extract variables from HTML if not provided
    let variables: string[] = [];
    if (templateForm.value.variablesString) {
      variables = templateForm.value.variablesString.split(',').map(v => v.trim()).filter(v => v);
    } else {
      variables = extractVariables(templateForm.value.htmlContent);
    }

    const data = {
      name: templateForm.value.name,
      subject: templateForm.value.subject,
      htmlContent: templateForm.value.htmlContent,
      textContent: templateForm.value.textContent || undefined,
      category: templateForm.value.category,
      variables,
    };

    if (editingTemplate.value) {
      await api.put(`/email-templates/${editingTemplate.value.id}`, {
        ...data,
        isActive: templateForm.value.isActive,
      });
      await showSuccess('Template berhasil diupdate');
    } else {
      await api.post('/email-templates', data);
      await showSuccess('Template berhasil dibuat');
    }

    closeModal();
    await loadTemplates();
  } catch (error: any) {
    console.error('Error saving template:', error);
    await showError('Gagal menyimpan template');
  } finally {
    saving.value = false;
  }
};

const editTemplate = (template: EmailTemplate) => {
  editingTemplate.value = template;
  templateForm.value = {
    name: template.name,
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent || '',
    category: template.category,
    variablesString: (template.variables || []).join(', '),
    isActive: template.isActive,
  };
  showCreateModal.value = true;
};

const deleteTemplate = async (template: EmailTemplate) => {
  const confirmed = await showConfirm(
    'Hapus Template',
    `Apakah Anda yakin ingin menghapus template "${template.name}"?`
  );
  if (!confirmed) return;

  try {
    await api.delete(`/email-templates/${template.id}`);
    await showSuccess('Template berhasil dihapus');
    await loadTemplates();
  } catch (error: any) {
    console.error('Error deleting template:', error);
    await showError('Gagal menghapus template');
  }
};

const previewTemplate = (template: EmailTemplate) => {
  previewingTemplate.value = template;
};

const renderPreview = (htmlContent: string): string => {
  // Replace variables with sample data
  return htmlContent
    .replace(/\{\{name\}\}/g, 'John Doe')
    .replace(/\{\{email\}\}/g, 'john@example.com')
    .replace(/\{\{orderNumber\}\}/g, 'ORD-12345')
    .replace(/\{\{orderTotal\}\}/g, 'Rp 150.000')
    .replace(/\{\{(\w+)\}\}/g, '{{$1}}');
};

const closeModal = () => {
  showCreateModal.value = false;
  editingTemplate.value = null;
  templateForm.value = {
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    category: 'PROMOTION',
    variablesString: '',
    isActive: true,
  };
};

onMounted(() => {
  loadTemplates();
});
</script>

