<template>
  <ErrorBoundary>
    <div id="app-wrapper" class="w-full min-h-screen">
      <!-- Skip to main content for accessibility -->
      <a href="#main-content" class="skip-to-main">Lompat ke konten utama</a>
      
      <main id="main-content" tabindex="-1">
        <router-view />
      </main>
      
      <NotificationModal
        :show="showNotification"
        :type="notificationOptions.type"
        :title="notificationOptions.title"
        :message="notificationOptions.message"
        :confirm-text="notificationOptions.confirmText"
        :cancel-text="notificationOptions.cancelText"
        @confirm="handleConfirm"
        @cancel="handleCancel"
        @close="handleClose"
      />
      <PWAInstallPrompt />
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import NotificationModal from './components/NotificationModal.vue';
import PWAInstallPrompt from './components/PWAInstallPrompt.vue';
import ErrorBoundary from './components/ErrorBoundary.vue';
import { useNotification } from './composables/useNotification';
import { useAccessibility } from './composables/useAccessibility';
import {
  handleNotificationConfirm as handleConfirm,
  handleNotificationCancel as handleCancel,
  handleNotificationClose as handleClose,
} from './composables/useNotification';

const authStore = useAuthStore();
const { showNotification, notificationOptions } = useNotification();
const { skipToMain } = useAccessibility();

onMounted(async () => {
  // Skip restore if we're on login page (to avoid flash)
  if (window.location.pathname === '/login') {
    return;
  }
  
  // Restore authentication state if token exists (check both localStorage and sessionStorage)
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  
  if (token) {
    // Restore token to store
    if (rememberMe) {
      authStore.token = localStorage.getItem('token');
    } else {
      authStore.token = sessionStorage.getItem('token') || localStorage.getItem('token');
    }
    
    // Restore user from localStorage if available (synchronous, no flash)
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        authStore.user = JSON.parse(storedUser);
      }
      
      // Verify token is still valid by fetching user data (async, but only if not on login)
      // This is done in background to avoid blocking
      authStore.fetchMe().catch((error) => {
        console.error('Failed to restore session:', error);
        // If fetchMe fails, token might be invalid, clear everything
        authStore.clearAuth();
      });
    } catch (error) {
      console.error('Failed to restore user from localStorage:', error);
      authStore.clearAuth();
    }
  } else {
    // No token, ensure auth is cleared
    authStore.clearAuth();
  }
});
</script>

