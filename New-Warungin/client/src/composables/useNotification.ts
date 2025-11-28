import { ref } from 'vue';

interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

// Global state
const showNotification = ref(false);
const notificationOptions = ref<NotificationOptions>({
  type: 'info',
  message: '',
});

let resolvePromise: ((value: boolean) => void) | null = null;

// Global handlers (used in App.vue)
export const handleNotificationConfirm = () => {
  if (resolvePromise) {
    resolvePromise(true);
    resolvePromise = null;
  }
  showNotification.value = false;
};

export const handleNotificationCancel = () => {
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
  showNotification.value = false;
};

export const handleNotificationClose = () => {
  if (resolvePromise && notificationOptions.value.type !== 'confirm') {
    resolvePromise(true);
    resolvePromise = null;
  }
  showNotification.value = false;
};

export function useNotification() {
  const notify = (options: NotificationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      notificationOptions.value = {
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
      };
      showNotification.value = true;
      resolvePromise = resolve;
    });
  };

  const success = (message: string, title?: string) => {
    return notify({ type: 'success', message, title });
  };

  const error = (message: string, title?: string) => {
    return notify({ type: 'error', message, title });
  };

  const warning = (message: string, title?: string) => {
    return notify({ type: 'warning', message, title });
  };

  const info = (message: string, title?: string) => {
    return notify({ type: 'info', message, title });
  };

  const confirm = (message: string, title?: string, confirmText = 'Ya', cancelText = 'Batal'): Promise<boolean> => {
    return notify({ type: 'confirm', message, title, confirmText, cancelText });
  };

  return {
    showNotification,
    notificationOptions,
    notify,
    success,
    error,
    warning,
    info,
    confirm,
  };
}

