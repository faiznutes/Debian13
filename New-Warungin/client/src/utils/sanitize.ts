/**
 * XSS Protection Utilities
 * Sanitize user input to prevent XSS attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS attacks
 * @param html - HTML string to sanitize
 * @param allowImages - Allow img tags (default: true)
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string, allowImages: boolean = true): string {
  if (!html) return '';
  
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      ...(allowImages ? ['img'] : []),
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'style', 'id',
      ...(allowImages ? ['src', 'alt', 'width', 'height'] : []),
    ],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize text content (strip all HTML)
 * @param text - Text to sanitize
 * @returns Sanitized text without HTML
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitize URL to prevent XSS in href attributes
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  try {
    // Only allow http, https, mailto, tel protocols
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    
    return url;
  } catch {
    // Invalid URL, return empty
    return '';
  }
}

