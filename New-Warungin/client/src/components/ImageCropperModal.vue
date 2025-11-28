<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">Crop Gambar</h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mb-4">
            <p class="text-sm text-gray-600 text-center mb-4">
              Pilih area gambar yang ingin di-crop. Gambar akan di-upscale menjadi 200x200 pixels.
            </p>
            <div class="flex items-center justify-center mb-4">
              <div class="w-32 h-32 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center bg-gray-50">
                <span class="text-xs text-gray-500 text-center px-2">Output: 200x200<br/>(Auto Upscale)</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 text-center">
              Gambar akan di-upscale menjadi 200x200 pixels, bahkan jika crop box lebih kecil
            </p>
          </div>

          <div class="mb-6">
            <div ref="imageContainer" class="flex justify-center max-h-96 overflow-auto relative">
              <div class="relative inline-block">
                <img
                  ref="imageElement"
                  :src="imageSrc"
                  alt="Crop preview"
                  class="max-w-full max-h-96 cursor-move"
                  @load="initCropper"
                  draggable="false"
                />
                <div
                  ref="cropBox"
                  class="absolute border-2 border-primary-500 bg-primary-500 bg-opacity-20 cursor-move"
                  :style="cropBoxStyle"
                  @mousedown="startDrag"
                >
                  <div class="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 border-2 border-white rounded-full cursor-nwse-resize" @mousedown.stop="startResize('nw')"></div>
                  <div class="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 border-2 border-white rounded-full cursor-nesw-resize" @mousedown.stop="startResize('ne')"></div>
                  <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-500 border-2 border-white rounded-full cursor-nesw-resize" @mousedown.stop="startResize('sw')"></div>
                  <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 border-2 border-white rounded-full cursor-nwse-resize" @mousedown.stop="startResize('se')"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleCrop"
              :disabled="cropping"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ cropping ? 'Memproses...' : 'Crop & Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Teleport } from 'vue';
import { useNotification } from '../composables/useNotification';

const { error: showError } = useNotification();

interface Props {
  show: boolean;
  imageSrc: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  cropped: [imageDataUrl: string];
}>();

const imageElement = ref<HTMLImageElement | null>(null);
const imageContainer = ref<HTMLElement | null>(null);
const cropBox = ref<HTMLElement | null>(null);
const cropping = ref(false);

const cropBoxStyle = ref({
  left: '10%',
  top: '10%',
  width: '80%',
  height: '80%',
});

const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref('');
const dragStart = ref({ x: 0, y: 0 });
const cropStart = ref({ left: 0, top: 0, width: 0, height: 0 });

const initCropper = () => {
  if (!imageElement.value) return;
  
  const img = imageElement.value;
  const imgWidth = img.offsetWidth;
  const imgHeight = img.offsetHeight;
  
  // Set initial crop box to center 80% of image
  const cropSize = Math.min(imgWidth, imgHeight) * 0.8;
  const left = (imgWidth - cropSize) / 2;
  const top = (imgHeight - cropSize) / 2;
  
  cropBoxStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${cropSize}px`,
    height: `${cropSize}px`,
  };
};

const startDrag = (e: MouseEvent) => {
  if (!cropBox.value || !imageElement.value) return;
  
  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  
  const rect = cropBox.value.getBoundingClientRect();
  const imgRect = imageElement.value.getBoundingClientRect();
  
  cropStart.value = {
    left: rect.left - imgRect.left,
    top: rect.top - imgRect.top,
    width: rect.width,
    height: rect.height,
  };
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value || !imageElement.value) return;
  
  const imgRect = imageElement.value.getBoundingClientRect();
  const deltaX = e.clientX - dragStart.value.x;
  const deltaY = e.clientY - dragStart.value.y;
  
  let newLeft = cropStart.value.left + deltaX;
  let newTop = cropStart.value.top + deltaY;
  
  // Constrain to image bounds
  newLeft = Math.max(0, Math.min(newLeft, imgRect.width - cropStart.value.width));
  newTop = Math.max(0, Math.min(newTop, imgRect.height - cropStart.value.height));
  
  cropBoxStyle.value = {
    ...cropBoxStyle.value,
    left: `${newLeft}px`,
    top: `${newTop}px`,
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const startResize = (direction: string) => {
  if (!cropBox.value || !imageElement.value) return;
  
  isResizing.value = true;
  resizeDirection.value = direction;
  dragStart.value = { x: 0, y: 0 };
  
  const rect = cropBox.value.getBoundingClientRect();
  const imgRect = imageElement.value.getBoundingClientRect();
  
  cropStart.value = {
    left: rect.left - imgRect.left,
    top: rect.top - imgRect.top,
    width: rect.width,
    height: rect.height,
  };
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value || !imageElement.value) return;
  
  const imgRect = imageElement.value.getBoundingClientRect();
  const deltaX = dragStart.value.x ? e.clientX - dragStart.value.x : 0;
  const deltaY = dragStart.value.y ? e.clientY - dragStart.value.y : 0;
  
  if (!dragStart.value.x && !dragStart.value.y) {
    dragStart.value = { x: e.clientX, y: e.clientY };
    return;
  }
  
  dragStart.value = { x: e.clientX, y: e.clientY };
  
  let newLeft = cropStart.value.left;
  let newTop = cropStart.value.top;
  let newWidth = cropStart.value.width;
  let newHeight = cropStart.value.height;
  
  const dir = resizeDirection.value;
  
  if (dir.includes('e')) {
    newWidth = Math.max(100, Math.min(cropStart.value.width + deltaX, imgRect.width - cropStart.value.left));
  }
  if (dir.includes('w')) {
    const widthChange = Math.max(-cropStart.value.width + 100, Math.min(deltaX, cropStart.value.left));
    newWidth = cropStart.value.width - widthChange;
    newLeft = cropStart.value.left + widthChange;
  }
  if (dir.includes('s')) {
    newHeight = Math.max(100, Math.min(cropStart.value.height + deltaY, imgRect.height - cropStart.value.top));
  }
  if (dir.includes('n')) {
    const heightChange = Math.max(-cropStart.value.height + 100, Math.min(deltaY, cropStart.value.top));
    newHeight = cropStart.value.height - heightChange;
    newTop = cropStart.value.top + heightChange;
  }
  
  // Maintain aspect ratio 1:1
  const size = Math.min(newWidth, newHeight);
  newWidth = size;
  newHeight = size;
  
  // Constrain to image bounds
  if (newLeft + newWidth > imgRect.width) {
    newWidth = imgRect.width - newLeft;
    newHeight = newWidth;
  }
  if (newTop + newHeight > imgRect.height) {
    newHeight = imgRect.height - newTop;
    newWidth = newHeight;
  }
  if (newLeft < 0) {
    newWidth += newLeft;
    newHeight = newWidth;
    newLeft = 0;
  }
  if (newTop < 0) {
    newHeight += newTop;
    newWidth = newHeight;
    newTop = 0;
  }
  
  cropBoxStyle.value = {
    left: `${newLeft}px`,
    top: `${newTop}px`,
    width: `${newWidth}px`,
    height: `${newHeight}px`,
  };
};

const stopResize = () => {
  isResizing.value = false;
  resizeDirection.value = '';
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
};

const handleCrop = async () => {
  if (!imageElement.value || !cropBox.value) return;

  cropping.value = true;

  try {
    const img = imageElement.value;
    const rect = cropBox.value.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calculate crop coordinates relative to image
    const cropX = rect.left - imgRect.left;
    const cropY = rect.top - imgRect.top;
    const cropWidth = rect.width;
    const cropHeight = rect.height;
    
    // Create canvas - upscale to 200x200
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Enable image smoothing for better upscaling quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw cropped and upscaled image to 200x200
    ctx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight, // Source
      0, 0, 200, 200 // Destination (upscaled)
    );
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    emit('cropped', dataUrl);
    emit('close');
  } catch (error) {
    console.error('Error cropping image:', error);
    await showError('Gagal memproses gambar. Silakan coba lagi.');
  } finally {
    cropping.value = false;
  }
};

watch(() => props.show, (newShow) => {
  if (newShow && imageElement.value) {
    setTimeout(() => {
      initCropper();
    }, 100);
  }
});

watch(() => props.imageSrc, () => {
  if (props.show && imageElement.value) {
    setTimeout(() => {
      initCropper();
    }, 100);
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
/* Cropper styles are imported globally in main.ts */
</style>

