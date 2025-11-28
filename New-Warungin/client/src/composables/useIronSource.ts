/**
 * IronSource Ad Integration Composable
 * App Key: 244d3c355
 */

import { ref, onMounted } from 'vue';

interface IronSourceAd {
  show: () => Promise<void>;
  isAvailable: () => boolean;
}

declare global {
  interface Window {
    IronSource?: {
      init: (appKey: string) => void;
      showRewardedVideo: (placementName?: string) => Promise<void>;
      isRewardedVideoAvailable: () => boolean;
      setRewardedVideoListener: (listener: {
        onRewardedVideoAdOpened?: () => void;
        onRewardedVideoAdClosed?: () => void;
        onRewardedVideoAvailabilityChanged?: (available: boolean) => void;
        onRewardedVideoAdStarted?: () => void;
        onRewardedVideoAdEnded?: () => void;
        onRewardedVideoAdRewarded?: (placement: any) => void;
        onRewardedVideoAdShowFailed?: (error: any) => void;
      }) => void;
    };
  }
}

const IRONSOURCE_APP_KEY = '244d3c355';
const IRONSOURCE_PLACEMENT_NAME = '0aoy03hfxtsvzcix'; // Reward placement name
const IRONSOURCE_SDK_URL = 'https://s3.amazonaws.com/ads.ironsrc.com/js/ironsource-sdk.min.js';

export function useIronSource() {
  const isInitialized = ref(false);
  const isAdAvailable = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const trackingPreventionBlocked = ref(false);

  /**
   * Check if tracking prevention is blocking storage access
   */
  const checkTrackingPrevention = (): boolean => {
    try {
      // Try to access localStorage
      const testKey = '__ironsource_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return false;
    } catch (e: any) {
      // If error, tracking prevention might be active
      if (e.name === 'SecurityError' || e.message?.includes('blocked')) {
        console.warn('Tracking Prevention detected - storage access blocked');
        return true;
      }
      return false;
    }
  };

  /**
   * Load IronSource SDK
   */
  const loadSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.IronSource) {
        console.log('IronSource SDK already loaded');
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${IRONSOURCE_SDK_URL}"]`);
      if (existingScript) {
        console.log('IronSource SDK script already exists, waiting for load...');
        // Wait for SDK to load
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.IronSource) {
            clearInterval(checkInterval);
            console.log('IronSource SDK loaded after waiting');
            resolve();
          } else if (attempts > 50) { // 5 seconds timeout
            clearInterval(checkInterval);
            reject(new Error('IronSource SDK gagal dimuat. Pastikan ad blocker dinonaktifkan.'));
          }
        }, 100);
        return;
      }

      console.log('Loading IronSource SDK from:', IRONSOURCE_SDK_URL);
      
      // Create script element
      const script = document.createElement('script');
      script.src = IRONSOURCE_SDK_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      let loaded = false;
      const timeout = setTimeout(() => {
        if (!loaded) {
          reject(new Error('IronSource SDK gagal dimuat (timeout). Pastikan ad blocker dinonaktifkan atau coba refresh halaman.'));
        }
      }, 10000); // 10 second timeout

      script.onload = () => {
        loaded = true;
        clearTimeout(timeout);
        console.log('IronSource SDK script loaded');
        
        // Wait a bit for SDK to initialize
        setTimeout(() => {
          if (window.IronSource) {
            console.log('IronSource SDK available');
            resolve();
          } else {
            reject(new Error('IronSource SDK script dimuat tapi SDK tidak tersedia. Pastikan ad blocker dinonaktifkan.'));
          }
        }, 500);
      };
      
      script.onerror = (err) => {
        loaded = true;
        clearTimeout(timeout);
        console.error('IronSource SDK load error:', err);
        reject(new Error('IronSource SDK gagal dimuat. Error: ERR_BLOCKED_BY_CLIENT. Pastikan ad blocker dinonaktifkan.'));
      };
      
      document.head.appendChild(script);
    });
  };

  /**
   * Initialize IronSource
   */
  const initialize = async (): Promise<void> => {
    if (isInitialized.value) {
      console.log('IronSource already initialized');
      return;
    }

    try {
      isLoading.value = true;
      error.value = null;

      // Check tracking prevention
      trackingPreventionBlocked.value = checkTrackingPrevention();
      if (trackingPreventionBlocked.value) {
        console.warn('Tracking Prevention is active - IronSource may not work properly');
        error.value = 'Tracking Prevention aktif. Silakan nonaktifkan Tracking Prevention di pengaturan browser untuk menggunakan fitur iklan.';
      }

      console.log('Initializing IronSource...');

      // Load SDK if not loaded
      if (!window.IronSource) {
        console.log('SDK not found, loading...');
        await loadSDK();
      } else {
        console.log('SDK already available');
      }

      // Initialize with app key
      if (window.IronSource) {
        console.log('Initializing IronSource with app key:', IRONSOURCE_APP_KEY);
        window.IronSource.init(IRONSOURCE_APP_KEY);

        // Set up listeners
        window.IronSource.setRewardedVideoListener({
          onRewardedVideoAdOpened: () => {
            console.log('IronSource: Ad opened');
          },
          onRewardedVideoAdClosed: () => {
            console.log('IronSource: Ad closed');
            isAdAvailable.value = false;
          },
          onRewardedVideoAvailabilityChanged: (available: boolean) => {
            console.log('IronSource: Ad availability changed', available);
            isAdAvailable.value = available;
            // Force check after a delay to ensure availability is updated
            setTimeout(() => {
              if (window.IronSource) {
                const currentAvailability = window.IronSource.isRewardedVideoAvailable();
                console.log('IronSource: Current availability check:', currentAvailability);
                isAdAvailable.value = currentAvailability;
              }
            }, 1000);
          },
          onRewardedVideoAdStarted: () => {
            console.log('IronSource: Ad started');
          },
          onRewardedVideoAdEnded: () => {
            console.log('IronSource: Ad ended');
          },
          onRewardedVideoAdRewarded: (placement: any) => {
            console.log('IronSource: Ad rewarded', placement);
            // This will be handled by the callback
          },
          onRewardedVideoAdShowFailed: (err: any) => {
            console.error('IronSource: Ad show failed', err);
            error.value = 'Gagal menampilkan iklan';
            isAdAvailable.value = false;
          },
        });

        // Check initial availability after a short delay
        setTimeout(() => {
          if (window.IronSource) {
            const available = window.IronSource.isRewardedVideoAvailable();
            console.log('IronSource: Initial availability check:', available);
            isAdAvailable.value = available;
          }
        }, 2000);

        isInitialized.value = true;
        console.log('IronSource initialized successfully');
      } else {
        throw new Error('IronSource SDK tidak tersedia setelah dimuat. Pastikan ad blocker dinonaktifkan.');
      }
    } catch (err: any) {
      console.error('IronSource initialization error:', err);
      error.value = err.message || 'Gagal menginisialisasi IronSource. Pastikan ad blocker dinonaktifkan.';
      isInitialized.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Show rewarded video ad
   */
  const showAd = (): Promise<{ success: boolean; rewarded: boolean }> => {
    return new Promise((resolve, reject) => {
      if (!isInitialized.value) {
        reject(new Error('IronSource not initialized'));
        return;
      }

      if (!window.IronSource) {
        reject(new Error('IronSource SDK not available'));
        return;
      }

      // Check if ad is available
      if (!window.IronSource.isRewardedVideoAvailable()) {
        reject(new Error('Iklan tidak tersedia saat ini'));
        return;
      }

      let rewarded = false;
      let adClosed = false;

      // Set up one-time listener for this ad
      const listener = {
        onRewardedVideoAdRewarded: (placement: any) => {
          console.log('IronSource: User rewarded', placement);
          rewarded = true;
        },
        onRewardedVideoAdClosed: () => {
          console.log('IronSource: Ad closed');
          adClosed = true;
          // Remove listener
          if (window.IronSource) {
            window.IronSource.setRewardedVideoListener({});
          }
          resolve({ success: true, rewarded });
        },
        onRewardedVideoAdShowFailed: (err: any) => {
          console.error('IronSource: Ad show failed', err);
          // Remove listener
          if (window.IronSource) {
            window.IronSource.setRewardedVideoListener({});
          }
          reject(err);
        },
      };

      // Set listener
      if (window.IronSource) {
        window.IronSource.setRewardedVideoListener(listener);
      }

      // Show ad with placement name
      window.IronSource
        .showRewardedVideo(IRONSOURCE_PLACEMENT_NAME)
        .then(() => {
          console.log('IronSource: Ad shown with placement:', IRONSOURCE_PLACEMENT_NAME);
        })
        .catch((err: any) => {
          console.error('IronSource: Error showing ad', err);
          // Remove listener
          if (window.IronSource) {
            window.IronSource.setRewardedVideoListener({});
          }
          reject(err);
        });
    });
  };

  /**
   * Check if ad is available
   */
  const checkAvailability = (): boolean => {
    if (!window.IronSource) {
      console.log('checkAvailability: SDK not available');
      return false;
    }
    if (!isInitialized.value) {
      console.log('checkAvailability: Not initialized');
      return false;
    }
    const available = window.IronSource.isRewardedVideoAvailable();
    console.log('checkAvailability:', available);
    isAdAvailable.value = available;
    return available;
  };

  /**
   * Force check availability (async)
   */
  const forceCheckAvailability = async (): Promise<boolean> => {
    try {
      if (!isInitialized.value) {
        await initialize();
      }
      
      if (!window.IronSource) {
        console.error('Force check: SDK not available');
        isAdAvailable.value = false;
        return false;
      }

      const available = window.IronSource.isRewardedVideoAvailable();
      console.log('Force check availability:', available);
      isAdAvailable.value = available;
      return available;
    } catch (err: any) {
      console.error('Force check availability error:', err);
      isAdAvailable.value = false;
      return false;
    }
  };

  return {
    isInitialized,
    isAdAvailable,
    isLoading,
    error,
    trackingPreventionBlocked,
    initialize,
    showAd,
    checkAvailability,
    forceCheckAvailability,
  };
}

