/**
 * PWA Composable
 * Handles PWA installation and service worker registration
 */

import { ref, onMounted } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null);
  const isInstalled = ref(false);
  const isStandalone = ref(false);
  const isOnline = ref(navigator.onLine);

  // Check if app is installed
  const checkInstallation = () => {
    // Check if running in standalone mode (installed PWA)
    isStandalone.value = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    // Check if app is already installed
    if (isStandalone.value) {
      isInstalled.value = true;
    }
  };

  // Register service worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('New service worker available');
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  // Show install prompt
  const showInstallPrompt = async () => {
    if (installPrompt.value) {
      await installPrompt.value.prompt();
      const choice = await installPrompt.value.userChoice;
      if (choice.outcome === 'accepted') {
        isInstalled.value = true;
        console.log('User accepted PWA install');
      }
      installPrompt.value = null;
    }
  };

  // Update online status
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
  };

  onMounted(() => {
    checkInstallation();
    registerServiceWorker();

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPrompt.value = e as BeforeInstallPromptEvent;
      console.log('PWA install prompt available');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      isInstalled.value = true;
      installPrompt.value = null;
      console.log('PWA installed');
    });

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  });

  return {
    installPrompt,
    isInstalled,
    isStandalone,
    isOnline,
    showInstallPrompt,
    checkInstallation,
  };
}

