/**
 * Accessibility composable for keyboard navigation and ARIA attributes
 */

import { onMounted, onUnmounted, ref } from 'vue';

export function useAccessibility() {
  const isKeyboardUser = ref(false);
  const focusVisible = ref(false);

  // Detect keyboard navigation
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      isKeyboardUser.value = true;
      focusVisible.value = true;
      document.body.classList.add('keyboard-user');
    }
  };

  // Detect mouse usage
  const handleMouseDown = () => {
    isKeyboardUser.value = false;
    focusVisible.value = false;
    document.body.classList.remove('keyboard-user');
  };

  // Skip to main content
  const skipToMain = () => {
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main) {
      (main as HTMLElement).focus();
      (main as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Trap focus within element
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  };

  // Announce to screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleMouseDown);
  });

  return {
    isKeyboardUser,
    focusVisible,
    skipToMain,
    trapFocus,
    announce,
  };
}

