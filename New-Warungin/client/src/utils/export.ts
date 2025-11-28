/**
 * Export utilities for CSV and PDF with period filters
 */

/**
 * Export data to CSV
 * @param onError Optional callback function to handle errors (replaces alert)
 */
export function exportToCSV(data: any[], filename: string, headers?: string[], onError?: (message: string) => void) {
  if (!data || data.length === 0) {
    const message = 'Tidak ada data untuk diekspor';
    if (onError) {
      onError(message);
    } else {
      // Fallback to console.warn if no callback provided
      console.warn(message);
    }
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => {
      return csvHeaders.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = String(value).replace(/"/g, '""');
        if (stringValue.includes(',') || stringValue.includes('\n')) {
          return `"${stringValue}"`;
        }
        return stringValue;
      }).join(',');
    }),
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import { downloadPDFFromHTMLIframe } from './pdf-download';

/**
 * Export data to PDF (direct download)
 * @param onError Optional callback function to handle errors (replaces alert)
 */
export async function exportToPDF(data: any[], filename: string, title: string, headers?: string[], period?: string, onError?: (message: string) => void) {
  if (!data || data.length === 0) {
    const message = 'Tidak ada data untuk diekspor';
    if (onError) {
      onError(message);
    } else {
      // Fallback to console.warn if no callback provided
      console.warn(message);
    }
    return;
  }

  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create HTML table with better styling
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
          font-size: 14px;
        }
        .info {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th {
          background: linear-gradient(to bottom, #2563eb, #1e40af);
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #1e40af;
        }
        td {
          padding: 10px 8px;
          border: 1px solid #e5e7eb;
          text-align: left;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        tr:hover {
          background-color: #f3f4f6;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .summary {
          margin-top: 20px;
          padding: 15px;
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          border-radius: 4px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-weight: 600;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Warungin - Laporan Bisnis</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <span><strong>Periode:</strong></span>
          <span>${period || 'Semua Data'}</span>
        </div>
        <div class="info-row">
          <span><strong>Tanggal Export:</strong></span>
          <span>${new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div class="info-row">
          <span><strong>Total Data:</strong></span>
          <span>${data.length} record</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${csvHeaders.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${csvHeaders.map(header => {
                const value = row[header] || '';
                // Format currency if it looks like a number
                const formattedValue = typeof value === 'string' && value.includes('Rp') 
                  ? value 
                  : (typeof value === 'number' && header.toLowerCase().includes('harga') || header.toLowerCase().includes('total') || header.toLowerCase().includes('revenue'))
                    ? formatCurrency(value)
                    : value;
                return `<td>${formattedValue}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Dicetak dari Warungin pada ${new Date().toLocaleString('id-ID')}</p>
        <p class="no-print">Gunakan Ctrl+P atau Cmd+P untuk mencetak</p>
      </div>
    </body>
    </html>
  `;

  // Download PDF directly
  try {
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    await downloadPDFFromHTMLIframe(html, pdfFilename);
  } catch (error: any) {
    const message = error.message || 'Gagal membuat PDF. Silakan coba lagi.';
    if (onError) {
      onError(message);
    } else {
      console.error(message, error);
    }
  }
}

/**
 * Format currency for display
 */
function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Format data for export (convert objects to flat structure)
 */
export function formatDataForExport(data: any[], fieldMap?: Record<string, string>) {
  return data.map(item => {
    const formatted: any = {};
    Object.keys(item).forEach(key => {
      const displayKey = fieldMap?.[key] || key;
      let value = item[key];
      
      // Handle nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Try to extract name or id
        if (value.name) {
          value = value.name;
        } else if (value.id) {
          value = value.id;
        } else {
          value = JSON.stringify(value);
        }
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      formatted[displayKey] = value;
    });
    return formatted;
  });
}

/**
 * Export data to Excel (CSV format with .xlsx extension)
 * Note: This creates a CSV file with .xlsx extension for compatibility
 * For true Excel format, consider using a library like xlsx or exceljs
 */
export function exportToExcel(data: any[], filename: string, headers?: string[], onError?: (message: string) => void) {
  // For now, we'll use CSV format which Excel can open
  // In the future, can be enhanced with actual Excel format using xlsx library
  exportToCSV(data, filename, headers, onError);
}

/**
 * Get period label in Indonesian
 */
export function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    all: 'Semua Data',
  };
  return labels[period] || period;
}
