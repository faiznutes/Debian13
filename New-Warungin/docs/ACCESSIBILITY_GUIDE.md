# Accessibility Guide

## Overview

This guide covers accessibility features and best practices for the Warungin application.

## Features

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus indicators are visible
- Skip to main content link available

### Screen Reader Support

- ARIA labels on all interactive elements
- Semantic HTML structure
- Live regions for dynamic content
- Alt text for images

### Visual Accessibility

- High contrast mode support
- Reduced motion support
- Minimum touch target sizes (44x44px)
- Color contrast meets WCAG AA standards

## Usage

### useAccessibility Composable

```vue
<script setup>
import { useAccessibility } from '@/composables/useAccessibility';

const { skipToMain, announce, trapFocus } = useAccessibility();

// Announce to screen readers
announce('Order berhasil dibuat', 'polite');

// Skip to main content
skipToMain();

// Trap focus in modal
const cleanup = trapFocus(modalElement.value);
</script>
```

### ARIA Labels

Always provide ARIA labels for interactive elements:

```vue
<button aria-label="Tutup dialog">
  <svg>...</svg>
</button>

<input
  type="text"
  aria-label="Cari produk"
  aria-describedby="search-help"
/>
<p id="search-help" class="sr-only">
  Gunakan untuk mencari produk berdasarkan nama atau SKU
</p>
```

### Semantic HTML

Use semantic HTML elements:

```vue
<main>
  <header>
    <nav aria-label="Main navigation">
      ...
    </nav>
  </header>
  <section aria-labelledby="products-heading">
    <h2 id="products-heading">Products</h2>
    ...
  </section>
</main>
```

### Focus Management

```vue
<script setup>
import { ref, nextTick } from 'vue';

const modalRef = ref<HTMLElement>();

async function openModal() {
  showModal.value = true;
  await nextTick();
  modalRef.value?.focus();
}
</script>

<template>
  <div ref="modalRef" tabindex="-1" role="dialog" aria-modal="true">
    ...
  </div>
</template>
```

## Testing

### Keyboard Testing

1. Navigate entire page using only Tab key
2. All interactive elements should be reachable
3. Focus should be visible
4. No keyboard traps

### Screen Reader Testing

Test with:
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (macOS/iOS, built-in)
- TalkBack (Android, built-in)

### Automated Testing

Use tools like:
- axe DevTools
- WAVE
- Lighthouse accessibility audit

## Checklist

- [ ] All images have alt text
- [ ] All buttons have accessible labels
- [ ] Forms have labels and error messages
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible
- [ ] ARIA labels are used appropriately
- [ ] Semantic HTML is used
- [ ] No keyboard traps
- [ ] Screen reader testing completed

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

