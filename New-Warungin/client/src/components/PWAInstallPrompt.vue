<template>
  <div
    v-if="showPrompt && !isInstalled"
    class="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-6 max-w-sm z-50 border border-gray-200"
  >
    <div class="flex items-start space-x-4">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Install Warungin</h3>
        <p class="text-sm text-gray-600 mb-4">
          Install aplikasi untuk akses lebih cepat dan fitur offline
        </p>
        <div class="flex space-x-2">
          <button
            @click="handleInstall"
            class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm"
          >
            Install
          </button>
          <button
            @click="dismiss"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
          >
            Nanti
          </button>
        </div>
      </div>
      <button
        @click="dismiss"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePWA } from '../composables/usePWA';

const { installPrompt, isInstalled, showInstallPrompt } = usePWA();
const showPrompt = ref(false);

const checkShouldShow = () => {
  // Don't show if already installed
  if (isInstalled.value) {
    return false;
  }

  // Check if user has dismissed before (stored in localStorage)
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed, 10);
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    // Show again after 7 days
    if (daysSinceDismissed < 7) {
      return false;
    }
  }

  // Show if install prompt is available
  return !!installPrompt.value;
};

const handleInstall = async () => {
  await showInstallPrompt();
  showPrompt.value = false;
};

const dismiss = () => {
  showPrompt.value = false;
  localStorage.setItem('pwa-install-dismissed', Date.now().toString());
};

onMounted(() => {
  // Show prompt after 3 seconds
  setTimeout(() => {
    if (checkShouldShow()) {
      showPrompt.value = true;
    }
  }, 3000);
});
</script>

