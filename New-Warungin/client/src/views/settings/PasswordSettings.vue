<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Password Settings</h1>
      <p class="text-gray-600">Ubah password dan kelola kebijakan password</p>
    </div>

    <div class="space-y-6">
      <!-- Change Password -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Ubah Password</h2>

        <form @submit.prevent="updatePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password Lama *</label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              required
              placeholder="Masukkan password lama"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password Baru *</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              required
              placeholder="Masukkan password baru"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 mt-1">
              Minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru *</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              placeholder="Konfirmasi password baru"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="text-xs text-red-600 mt-1">
              Password tidak cocok
            </p>
          </div>

          <div v-if="passwordError" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">{{ passwordError }}</p>
          </div>

          <div v-if="passwordSuccess" class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-800">{{ passwordSuccess }}</p>
          </div>

          <button
            type="submit"
            :disabled="updating || passwordForm.newPassword !== passwordForm.confirmPassword"
            class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
          >
            {{ updating ? 'Mengubah...' : 'Ubah Password' }}
          </button>
        </form>
      </div>

      <!-- Password Policy Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-3">Kebijakan Password</h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Minimal 8 karakter</span>
          </li>
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Harus mengandung huruf besar (A-Z)</span>
          </li>
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Harus mengandung huruf kecil (a-z)</span>
          </li>
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Harus mengandung angka (0-9)</span>
          </li>
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Harus mengandung simbol (!@#$%^&*)</span>
          </li>
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Tidak boleh menggunakan password yang pernah digunakan sebelumnya</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '../../api';

const updating = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const updatePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Password tidak cocok';
    return;
  }

  updating.value = true;
  passwordError.value = '';
  passwordSuccess.value = '';

  try {
    await api.post('/password/update', {
      oldPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      confirmPassword: passwordForm.value.confirmPassword,
    });

    passwordSuccess.value = 'Password berhasil diubah';
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  } catch (error: any) {
    console.error('Error updating password:', error);
    passwordError.value = error.response?.data?.message || 'Gagal mengubah password';
  } finally {
    updating.value = false;
  }
};
</script>

