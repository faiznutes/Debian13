import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeHTML } from './sanitize';

/**
 * Convert HTML to PDF and download directly
 * Note: HTML is sanitized to prevent XSS attacks
 */
export async function downloadPDFFromHTML(
  html: string,
  filename: string = 'export.pdf',
  options?: {
    width?: number;
    height?: number;
    format?: 'a4' | 'a3' | 'letter';
  }
): Promise<void> {
  try {
    // Sanitize HTML to prevent XSS attacks
    const sanitizedHTML = sanitizeHTML(html, true); // Allow images for PDF
    
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = `${options?.width || 210}mm`; // A4 width
    container.innerHTML = sanitizedHTML;
    document.body.appendChild(container);

    // Wait for images to load
    await waitForImages(container);

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Calculate PDF dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pdfWidth = options?.format === 'a4' ? 210 : options?.format === 'a3' ? 297 : 216; // mm
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: options?.format || 'a4',
    });

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Download PDF
    pdf.save(filename);
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    throw new Error('Gagal membuat PDF. Silakan coba lagi.');
  }
}

/**
 * Wait for all images in container to load
 */
function waitForImages(container: HTMLElement): Promise<void> {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Continue even if image fails
      setTimeout(() => resolve(), 5000); // Timeout after 5 seconds
    });
  });
  return Promise.all(promises).then(() => {});
}

/**
 * Alternative: Use iframe method for better rendering
 */
export async function downloadPDFFromHTMLIframe(
  html: string,
  filename: string = 'export.pdf'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        reject(new Error('Failed to access iframe document'));
        return;
      }

      // Sanitize HTML to prevent XSS attacks
      const sanitizedHTML = sanitizeHTML(html, true); // Allow images for PDF
      
      // Write HTML to iframe
      iframeDoc.open();
      iframeDoc.write(sanitizedHTML);
      iframeDoc.close();

      // Wait for content to load
      iframe.onload = async () => {
        try {
          await new Promise((r) => setTimeout(r, 500)); // Wait for rendering

          // Convert to canvas
          const canvas = await html2canvas(iframeDoc.body, {
            scale: 2,
            useCORS: true,
            logging: false,
            width: iframeDoc.body.scrollWidth,
            height: iframeDoc.body.scrollHeight,
          });

          // Remove iframe
          document.body.removeChild(iframe);

          // Create PDF
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const pdfWidth = 210; // A4 width in mm
          const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

          const pdf = new jsPDF({
            orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
            unit: 'mm',
            format: 'a4',
          });

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

          // Download
          pdf.save(filename);
          resolve();
        } catch (error: any) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };
    } catch (error: any) {
      reject(error);
    }
  });
}

