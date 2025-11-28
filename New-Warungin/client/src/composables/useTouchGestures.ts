/**
 * Touch gestures composable for mobile interactions
 */

import { onMounted, onUnmounted, ref } from 'vue';

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

export function useTouchGestures(
  element: HTMLElement | null,
  options: {
    onSwipe?: (direction: SwipeDirection) => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    minSwipeDistance?: number;
    maxSwipeTime?: number;
  } = {}
) {
  const isSwiping = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const startTime = ref(0);
  const currentX = ref(0);
  const currentY = ref(0);

  const minSwipeDistance = options.minSwipeDistance || 50;
  const maxSwipeTime = options.maxSwipeTime || 300;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    startTime.value = Date.now();
    isSwiping.value = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping.value) return;
    const touch = e.touches[0];
    currentX.value = touch.clientX;
    currentY.value = touch.clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isSwiping.value) return;

    const endTime = Date.now();
    const deltaX = currentX.value - startX.value;
    const deltaY = currentY.value - startY.value;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = endTime - startTime.value;
    const velocity = distance / time;

    isSwiping.value = false;

    // Check if swipe meets minimum requirements
    if (distance < minSwipeDistance || time > maxSwipeTime) {
      return;
    }

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right
        const swipeData: SwipeDirection = {
          direction: 'right',
          distance: absX,
          velocity,
        };
        options.onSwipe?.(swipeData);
        options.onSwipeRight?.();
      } else {
        // Swipe left
        const swipeData: SwipeDirection = {
          direction: 'left',
          distance: absX,
          velocity,
        };
        options.onSwipe?.(swipeData);
        options.onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        // Swipe down
        const swipeData: SwipeDirection = {
          direction: 'down',
          distance: absY,
          velocity,
        };
        options.onSwipe?.(swipeData);
        options.onSwipeDown?.();
      } else {
        // Swipe up
        const swipeData: SwipeDirection = {
          direction: 'up',
          distance: absY,
          velocity,
        };
        options.onSwipe?.(swipeData);
        options.onSwipeUp?.();
      }
    }
  };

  onMounted(() => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
  });

  onUnmounted(() => {
    if (!element) return;

    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  });

  return {
    isSwiping,
    startX,
    startY,
    currentX,
    currentY,
  };
}

