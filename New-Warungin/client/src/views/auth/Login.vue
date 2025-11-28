<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Logo Section -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex flex-col items-center hover:opacity-90 transition-opacity">
          <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">Warungin</h1>
          <p class="text-gray-600">Sistem Modern untuk UMKM</p>
        </router-link>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 class="text-2xl font-bold text-gray-900 mb-2 text-center">Masuk ke Akun Anda</h2>
        <p class="text-gray-500 text-center mb-6 text-sm">Kelola bisnis Anda dengan lebih mudah</p>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 placeholder-gray-400"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Kata Sandi
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 placeholder-gray-400"
                placeholder="Masukkan kata sandi"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabindex="-1"
              >
                <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="rememberMe"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700 cursor-pointer">
              Ingat saya
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <span v-if="!loading">Masuk</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.418 3.582-8 8-8v4a4 4 0 00-4 4c0 1.104.896 2 2 2h2z"></path>
              </svg>
              Memproses...
            </span>
          </button>
        </form>

        <!-- Footer Links -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Belum punya akun?
            <router-link to="/contact" class="text-primary-600 hover:text-primary-700 font-medium">
              Hubungi kami
            </router-link>
          </p>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500">
          Lupa kata sandi?
          <router-link to="/contact" class="text-primary-600 hover:text-primary-700 font-medium">
            Reset di sini
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';

const router = useRouter();
const { error: showError, warning: showWarning } = useNotification();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const rememberMe = ref(localStorage.getItem('rememberMe') === 'true');

// Initialize on mount
onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // If already authenticated, redirect to dashboard
  if (authStore.isAuthenticated) {
    const redirect = route.query.redirect as string || '/app/dashboard';
    router.push(redirect);
    return;
  }
  
  // Restore email from localStorage if remember me was checked
  if (rememberMe.value) {
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      email.value = storedEmail;
    }
  }
});

const handleLogin = async () => {
  loading.value = true;
  try {
    // Trim email and password to avoid whitespace issues
    const trimmedEmail = email.value.trim();
    const trimmedPassword = password.value.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      await showWarning('Email dan password harus diisi');
      loading.value = false;
      return;
    }
    
    await authStore.login(trimmedEmail, trimmedPassword, rememberMe.value);
    
    // Store email if remember me is checked
    if (rememberMe.value) {
      localStorage.setItem('rememberedEmail', trimmedEmail);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    // Redirect to intended destination or dashboard
    const redirect = route.query.redirect as string || '/app/dashboard';
    router.push(redirect);
  } catch (error: any) {
    // Handle rate limiting (429) errors with better messaging
    if (error.response?.status === 429) {
      const retryAfter = error.response?.data?.retryAfter;
      let message = error.response?.data?.message || error.response?.data?.error || 'Terlalu banyak percobaan login';
      
      if (retryAfter) {
        const minutes = Math.ceil(retryAfter / 60);
        message = `${message}. Silakan coba lagi dalam ${minutes} menit.`;
      } else {
        message = `${message}. Silakan tunggu beberapa saat sebelum mencoba lagi.`;
      }
      
      await showError(message);
    } else if (error.response?.status === 403) {
      // Handle store inactive errors with special alert
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      
      // Check if it's a store-related error
      if (errorMessage && (
        errorMessage.includes('Store') || 
        errorMessage.includes('store') ||
        errorMessage.includes('tidak aktif') ||
        errorMessage.includes('memindahkan') ||
        errorMessage.includes('ditetapkan') ||
        errorMessage.includes('diizinkan')
      )) {
        // Show warning with detailed message
        await showWarning(
          errorMessage,
          'Store Tidak Aktif'
        );
      } else {
        await showError(errorMessage || 'Akses ditolak');
      }
    } else {
      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      
      // Show specific error messages
      if (errorMessage) {
        await showError(errorMessage);
      } else {
        // Fallback to generic message
        await showError('Email atau password salah');
      }
    }
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>
