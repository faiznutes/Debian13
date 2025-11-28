import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/main.css';
import { offlineStorage } from './utils/offline-storage';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Development mode: Show all errors for debugging
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
const SHOW_ALL_ERRORS = isDevelopment; // Set to true to see all errors in development

// Suppress CORS errors in console for PDF generation (only in production)
const originalError = window.console.error;
const originalWarn = window.console.warn;
const originalLog = window.console.log;

window.console.error = (...args: any[]) => {
  // In development, show all errors for debugging
  if (SHOW_ALL_ERRORS) {
    originalError.apply(window.console, args);
    return;
  }
  
  const message = args[0]?.toString() || '';
  // Don't log CORS errors for PDF generation (production only)
  if (message.includes('CORS') || 
      message.includes('Access-Control') || 
      message.includes('ERR_NETWORK') ||
      message.includes('ERR_FAILED') ||
      message.includes('blocked by CORS policy') ||
      (message.includes('pdf/generate') && (message.includes('blocked') || message.includes('failed')))) {
    // Silently ignore CORS errors for PDF generation
    return;
  }
  originalError.apply(window.console, args);
};

window.console.warn = (...args: any[]) => {
  // In development, show all warnings for debugging
  if (SHOW_ALL_ERRORS) {
    originalWarn.apply(window.console, args);
    return;
  }
  
  const message = args[0]?.toString() || '';
  // Don't log CORS warnings for PDF generation (production only)
  if (message.includes('CORS') || 
      message.includes('Access-Control') ||
      (message.includes('pdf/generate') && message.includes('blocked'))) {
    return;
  }
  originalWarn.apply(window.console, args);
};

// Global error handler - show all errors in development
window.addEventListener('error', (event) => {
  // In development, log all errors for debugging
  if (SHOW_ALL_ERRORS) {
    console.error('🔴 Global Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
    });
    return;
  }
  
  // In production, suppress CORS errors for PDF generation
  const message = event.message || event.error?.message || '';
  if (message.includes('CORS') || 
      message.includes('Access-Control') ||
      message.includes('blocked by CORS policy') ||
      (message.includes('pdf/generate') && message.includes('blocked'))) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

// Unhandled promise rejection handler - show all errors in development
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  
  // In development, log all unhandled rejections for debugging
  if (SHOW_ALL_ERRORS) {
    console.error('🔴 Unhandled Promise Rejection:', {
      reason: error,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      config: error?.config,
    });
    return;
  }
  
  // In production, suppress CORS errors for PDF generation
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code || '';
  
  // Check if it's a CORS error for PDF generation
  if ((errorMessage.includes('CORS') || 
       errorMessage.includes('Access-Control') || 
       errorMessage.includes('blocked by CORS policy') ||
       errorCode === 'ERR_NETWORK' ||
       errorCode === 'ERR_FAILED') &&
      (error?.config?.url?.includes('/pdf/generate') || 
       errorMessage.includes('pdf/generate'))) {
    // Prevent the error from being logged
    event.preventDefault();
    return;
  }
});

// Log development mode status
if (SHOW_ALL_ERRORS) {
  console.log('🔍 Development Mode: All errors will be displayed');
  console.log('📝 Check browser console, network tab, and backend logs for detailed error information');
}

// Initialize offline storage (enhanced version)
import { offlineStorageEnhanced } from './utils/offline-storage-enhanced';
offlineStorageEnhanced.init().catch((error) => {
  console.error('Failed to initialize enhanced offline storage:', error);
  // Fallback to basic offline storage
  offlineStorage.init().catch((err) => {
    console.error('Failed to initialize basic offline storage:', err);
  });
});

app.mount('#app');

