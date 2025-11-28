<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Two-Factor Authentication (2FA)</h1>
      <p class="text-gray-600">Tingkatkan keamanan akun Anda dengan 2FA</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- 2FA Status Card -->
    <div v-else class="space-y-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Status 2FA</h2>
            <p class="text-sm text-gray-600 mt-1">Status autentikasi dua faktor Anda</p>
          </div>
          <div
            :class="[
              'px-4 py-2 rounded-lg font-semibold',
              status.enabled
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            ]"
          >
            {{ status.enabled ? 'Aktif' : 'Tidak Aktif' }}
          </div>
        </div>

        <div v-if="status.enabled" class="mt-4 space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800">
              <strong>Backup Codes Tersisa:</strong> {{ status.remainingBackupCodes }}
            </p>
            <p class="text-xs text-blue-600 mt-1">
              Simpan backup codes di tempat yang aman. Gunakan jika Anda kehilangan akses ke aplikasi authenticator.
            </p>
          </div>

          <button
            @click="showDisableModal = true"
            class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            Nonaktifkan 2FA
          </button>
        </div>

        <div v-else class="mt-4">
          <button
            @click="startSetup"
            class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            Aktifkan 2FA
          </button>
        </div>
      </div>

      <!-- Setup Flow -->
      <div v-if="setupStep === 'generate'" class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Langkah 1: Scan QR Code</h2>
        <p class="text-gray-600 mb-4">
          Scan QR code di bawah ini menggunakan aplikasi authenticator seperti Google Authenticator atau Authy.
        </p>

        <div v-if="generating" class="text-center py-8">
          <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600">Membuat QR code...</p>
        </div>

        <div v-else-if="qrData" class="space-y-4">
          <!-- QR Code -->
          <div class="flex justify-center">
            <img :src="qrData.qrCode" alt="2FA QR Code" class="border-2 border-gray-200 rounded-lg p-4 bg-white" />
          </div>

          <!-- Manual Entry -->
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm font-semibold text-gray-700 mb-2">Atau masukkan secara manual:</p>
            <div class="flex items-center space-x-2">
              <code class="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">{{ qrData.secret }}</code>
              <button
                @click="copySecret"
                class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
              >
                Salin
              </button>
            </div>
          </div>

          <!-- Backup Codes -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm font-semibold text-yellow-800 mb-2">⚠️ Backup Codes (Simpan di tempat aman!):</p>
            <div class="grid grid-cols-2 gap-2 mb-3">
              <code
                v-for="(code, index) in qrData.backupCodes"
                :key="index"
                class="bg-white px-2 py-1 rounded text-xs font-mono text-center"
              >
                {{ code }}
              </code>
            </div>
            <button
              @click="copyBackupCodes"
              class="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm"
            >
              Salin Semua Backup Codes
            </button>
          </div>

          <!-- Verify Token -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Masukkan kode 6 digit dari aplikasi authenticator:</label>
            <input
              v-model="verificationToken"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              @input="verificationToken = verificationToken.replace(/\D/g, '')"
            />
            <p v-if="verifyError" class="text-sm text-red-600">{{ verifyError }}</p>
          </div>

          <div class="flex space-x-3">
            <button
              @click="cancelSetup"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button
              @click="enable2FA"
              :disabled="verificationToken.length !== 6 || enabling"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ enabling ? 'Mengaktifkan...' : 'Aktifkan 2FA' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Disable Modal -->
    <div
      v-if="showDisableModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showDisableModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Nonaktifkan 2FA</h3>
        <p class="text-gray-600 mb-4">
          Untuk menonaktifkan 2FA, Anda perlu memasukkan password Anda.
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              v-model="disablePassword"
              type="password"
              placeholder="Masukkan password Anda"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p v-if="disableError" class="text-sm text-red-600 mt-1">{{ disableError }}</p>
          </div>

          <div class="flex space-x-3">
            <button
              @click="showDisableModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button
              @click="disable2FA"
              :disabled="!disablePassword || disabling"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {{ disabling ? 'Menonaktifkan...' : 'Nonaktifkan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';

const loading = ref(true);
const status = ref({
  enabled: false,
  remainingBackupCodes: 0,
});

const setupStep = ref<'idle' | 'generate'>('idle');
const generating = ref(false);
const qrData = ref<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
} | null>(null);
const verificationToken = ref('');
const verifyError = ref('');
const enabling = ref(false);

const showDisableModal = ref(false);
const disablePassword = ref('');
const disableError = ref('');
const disabling = ref(false);

const loadStatus = async () => {
  try {
    const response = await api.get('/2fa/status');
    status.value = response.data;
  } catch (error: any) {
    console.error('Error loading 2FA status:', error);
  } finally {
    loading.value = false;
  }
};

const startSetup = async () => {
  setupStep.value = 'generate';
  generating.value = true;
  verifyError.value = '';
  verificationToken.value = '';

  try {
    const response = await api.post('/2fa/generate');
    qrData.value = response.data;
  } catch (error: any) {
    console.error('Error generating 2FA secret:', error);
    verifyError.value = error.response?.data?.message || 'Gagal membuat QR code';
  } finally {
    generating.value = false;
  }
};

const enable2FA = async () => {
  if (verificationToken.value.length !== 6) {
    verifyError.value = 'Token harus 6 digit';
    return;
  }

  enabling.value = true;
  verifyError.value = '';

  try {
    await api.post('/2fa/enable', { token: verificationToken.value });
    await loadStatus();
    setupStep.value = 'idle';
    qrData.value = null;
    verificationToken.value = '';
    
    // Show success message
    alert('2FA berhasil diaktifkan!');
  } catch (error: any) {
    console.error('Error enabling 2FA:', error);
    verifyError.value = error.response?.data?.message || 'Token tidak valid';
  } finally {
    enabling.value = false;
  }
};

const cancelSetup = () => {
  setupStep.value = 'idle';
  qrData.value = null;
  verificationToken.value = '';
  verifyError.value = '';
};

const disable2FA = async () => {
  if (!disablePassword.value) {
    disableError.value = 'Password wajib diisi';
    return;
  }

  disabling.value = true;
  disableError.value = '';

  try {
    await api.post('/2fa/disable', { password: disablePassword.value });
    await loadStatus();
    showDisableModal.value = false;
    disablePassword.value = '';
    
    // Show success message
    alert('2FA berhasil dinonaktifkan');
  } catch (error: any) {
    console.error('Error disabling 2FA:', error);
    disableError.value = error.response?.data?.message || 'Password tidak valid';
  } finally {
    disabling.value = false;
  }
};

const copySecret = () => {
  if (qrData.value) {
    navigator.clipboard.writeText(qrData.value.secret);
    alert('Secret berhasil disalin!');
  }
};

const copyBackupCodes = () => {
  if (qrData.value) {
    navigator.clipboard.writeText(qrData.value.backupCodes.join('\n'));
    alert('Backup codes berhasil disalin!');
  }
};

onMounted(() => {
  loadStatus();
});
</script>

