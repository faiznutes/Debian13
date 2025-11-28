<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="handleClose"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
          :class="modalClass"
        >
          <!-- Icon & Title -->
          <div class="p-6 text-center">
            <div
              class="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4"
              :class="iconBgClass"
            >
              <component
                :is="iconComponent"
                class="h-8 w-8"
                :class="iconClass"
              />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">
              {{ title || defaultTitle }}
            </h3>
            <p class="text-gray-600 text-sm">
              {{ message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="px-6 pb-6 flex gap-3">
            <button
              v-if="type === 'confirm'"
              @click="handleCancel"
              class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="flex-1 px-4 py-2.5 rounded-lg font-medium transition"
              :class="confirmButtonClass"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

interface Props {
  show: boolean;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  confirmText: 'OK',
  cancelText: 'Batal',
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

const modalClass = computed(() => {
  const classes: Record<string, string> = {
    success: 'border-t-4 border-green-500',
    error: 'border-t-4 border-red-500',
    warning: 'border-t-4 border-yellow-500',
    info: 'border-t-4 border-blue-500',
    confirm: 'border-t-4 border-blue-500',
  };
  return classes[props.type] || '';
});

const iconBgClass = computed(() => {
  const classes: Record<string, string> = {
    success: 'bg-green-100',
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100',
    confirm: 'bg-blue-100',
  };
  return classes[props.type] || '';
});

const iconClass = computed(() => {
  const classes: Record<string, string> = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    confirm: 'text-blue-600',
  };
  return classes[props.type] || '';
});

const confirmButtonClass = computed(() => {
  const classes: Record<string, string> = {
    success: 'bg-green-600 text-white hover:bg-green-700',
    error: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    info: 'bg-blue-600 text-white hover:bg-blue-700',
    confirm: 'bg-blue-600 text-white hover:bg-blue-700',
  };
  return classes[props.type] || '';
});

const iconComponent = computed(() => {
  const icons: Record<string, any> = {
    success: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M5 13l4 4L19 7',
      }),
    ]),
    error: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M6 18L18 6M6 6l12 12',
      }),
    ]),
    warning: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      }),
    ]),
    info: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      }),
    ]),
    confirm: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      }),
    ]),
  };
  return icons[props.type] || icons.info;
});

const defaultTitle = computed(() => {
  const titles: Record<string, string> = {
    success: 'Berhasil!',
    error: 'Terjadi Kesalahan',
    warning: 'Peringatan',
    info: 'Informasi',
    confirm: 'Konfirmasi',
  };
  return props.title || titles[props.type] || '';
});

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};

const handleCancel = () => {
  emit('cancel');
  emit('close');
};

const handleClose = () => {
  if (props.type !== 'confirm') {
    emit('close');
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.9);
  opacity: 0;
}
</style>

