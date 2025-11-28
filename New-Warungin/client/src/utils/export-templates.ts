import { formatCurrency, formatDate, formatDateTime } from './formatters';
import { downloadPDFFromHTMLIframe } from './pdf-download';

interface ExportData {
  type: 'report' | 'analytics' | 'both';
  reportData?: any;
  analyticsData?: any;
  reportType?: string;
  startDate: string;
  endDate: string;
  tenantName?: string;
  template?: 'minimalist' | 'modern' | 'classic' | 'colorful' | 'elegant';
  isGlobal?: boolean;
}

const TEMPLATES = {
  minimalist: 'Minimalis',
  modern: 'Modern',
  classic: 'Klasik',
  colorful: 'Berwarna',
  elegant: 'Elegan',
};

export async function generateFlexboxExport(data: ExportData) {
  const template = data.template || 'modern';
  
  // Debug: Log template being used
  console.log(`[PDF Export] Using template: ${template}`);
  
  // Generate filename
  const { type, reportType, startDate, endDate } = data;
  const reportTypeLabel = reportType === 'sales' ? 'Penjualan' :
                          reportType === 'product' ? 'Produk' :
                          reportType === 'customers' ? 'Pelanggan' :
                          reportType === 'inventory' ? 'Inventori' :
                          reportType === 'financial' ? 'Keuangan' :
                          reportType === 'global' ? 'Global' : 'Laporan';
  
  const exportTypeLabel = type === 'report' ? 'Laporan' :
                          type === 'analytics' ? 'Analytics' :
                          'Laporan-Analytics';
  
  const templateLabel = TEMPLATES[template as keyof typeof TEMPLATES] || 'Modern';
  const filename = `${exportTypeLabel}_${reportTypeLabel}_${templateLabel}_${startDate}_${endDate}.pdf`;
  
  try {
    // Use fetch API directly to avoid XMLHttpRequest CORS issues
    // Get API URL - use VITE_API_URL or detect from window location
    let apiBaseURL = import.meta.env.VITE_API_URL;
    if (!apiBaseURL && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        apiBaseURL = `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
      } else {
        apiBaseURL = 'http://localhost:3000/api';
      }
    } else if (!apiBaseURL) {
      apiBaseURL = 'http://localhost:3000/api';
    }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Suppress console errors for this specific request
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    // Temporarily disable console errors for CORS/network issues
    const suppressCorsErrors = () => {
      console.error = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        if (!message.includes('CORS') && 
            !message.includes('Access-Control') && 
            !message.includes('ERR_NETWORK') &&
            !message.includes('ERR_FAILED') &&
            !message.includes('blocked by CORS policy')) {
          originalConsoleError.apply(console, args);
        }
      };
      
      console.warn = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        if (!message.includes('CORS') && !message.includes('Access-Control')) {
          originalConsoleWarn.apply(console, args);
        }
      };
      
      // Suppress XMLHttpRequest errors
      console.log = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        if (!message.includes('pdf/generate') || 
            (!message.includes('CORS') && !message.includes('blocked'))) {
          originalConsoleLog.apply(console, args);
        }
      };
    };
    
    const restoreConsole = () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    };
    
    suppressCorsErrors();
    
    try {
      // Use fetch API instead of axios to avoid XMLHttpRequest CORS issues
      const response = await fetch(`${apiBaseURL}/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          template,
          data: {
            ...data,
            filename,
            title: `${exportTypeLabel} ${reportTypeLabel}`,
          },
        }),
        credentials: 'include',
      });
      
      restoreConsole();
      
      // Check if response is successful
      if (response.ok && response.status >= 200 && response.status < 300) {
        const blob = await response.blob();
        
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          return; // Success, exit early
        }
      }
      
      // If response is not ok, fallback to HTML to PDF
      const html = generateTemplateHTML(data, template);
      await downloadPDFFromHTMLIframe(html, filename);
      
    } catch (requestError: any) {
      restoreConsole();
      
      // Silently fallback to HTML to PDF for any error
      const html = generateTemplateHTML(data, template);
      await downloadPDFFromHTMLIframe(html, filename);
    }
  } catch (error: any) {
    // Outer catch - should rarely happen, but handle it silently
    const html = generateTemplateHTML(data, template);
    await downloadPDFFromHTMLIframe(html, filename);
  }
}

function generateTemplateHTML(data: ExportData, template: string): string {
  const templateFunctions: Record<string, (data: ExportData) => string> = {
    minimalist: generateMinimalistTemplate,
    modern: generateModernTemplate,
    classic: generateClassicTemplate,
    colorful: generateColorfulTemplate,
    elegant: generateElegantTemplate,
  };

  const templateFunction = templateFunctions[template] || generateModernTemplate;
  return templateFunction(data);
}

// Template 1: Minimalist
function generateMinimalistTemplate(data: ExportData): string {
  const { type, reportData, analyticsData, reportType, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Export ${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 9pt;
      line-height: 1.5;
      color: #1f2937;
      background: #fff;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 20mm 18mm 25mm 18mm;
      min-height: 100vh;
      position: relative;
    }
    .header {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .title {
      font-size: 18pt;
      font-weight: 600;
      color: #111827;
      margin-bottom: 6px;
      line-height: 1.2;
    }
    .subtitle {
      font-size: 8pt;
      color: #6b7280;
      margin-top: 2px;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
      flex: 1;
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      page-break-inside: avoid;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 600;
      color: #111827;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 10px;
    }
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: stretch;
      margin: 0;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      flex: 1 1 calc(50% - 5px);
      min-width: 0;
      max-width: calc(50% - 5px);
      border: 1px solid #e5e7eb;
      padding: 12px;
      background: #fff;
      justify-content: space-between;
      margin: 0;
    }
    .stat-label {
      font-size: 7pt;
      color: #6b7280;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .stat-value {
      font-size: 14pt;
      font-weight: 600;
      color: #111827;
      line-height: 1.2;
    }
    .table-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      margin: 0;
      overflow: hidden;
    }
    table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 8pt;
      line-height: 1.4;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      color: #1f2937;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .footer {
      position: fixed;
      bottom: 15mm;
      left: 18mm;
      right: 18mm;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 7pt;
      color: #9ca3af;
      background: #fff;
    }
    .analytics-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 0;
    }
    .analytics-card {
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
      padding: 12px;
      background: #fff;
      margin: 0;
    }
    .analytics-label {
      font-size: 7pt;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .analytics-value {
      font-size: 12pt;
      font-weight: 600;
      color: #111827;
      line-height: 1.2;
    }
    .positive {
      color: #059669;
    }
    .negative {
      color: #dc2626;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</h1>
      <p class="subtitle">${tenantName || 'Tenant'} | ${formatDate(startDate)} - ${formatDate(endDate)} | ${currentDate}</p>
    </div>
    
    <div class="content">
      ${type === 'report' || type === 'both' ? generateReportSection(reportData, reportType, isGlobal || false) : ''}
      ${type === 'analytics' || type === 'both' ? generateAnalyticsSection(analyticsData) : ''}
    </div>
    
    <div class="footer">
      <p>Dibuat oleh Warungin | ${currentDate}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Template 2: Modern
function generateModernTemplate(data: ExportData): string {
  const { type, reportData, analyticsData, reportType, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Export ${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
    }
    .container {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 30mm);
      position: relative;
      background: #fff;
      border-radius: 8px;
      padding: 20px;
    }
    .header {
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 22pt;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 9pt;
      color: rgba(255, 255, 255, 0.9);
    }
    .content {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 20px;
      margin-bottom: 15px;
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 15px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #111827;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
    }
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      flex: 1 1 calc(50% - 7.5px);
      min-width: 200px;
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .stat-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 18pt;
      font-weight: 700;
      color: #3b82f6;
    }
    .table-container {
      display: flex;
      flex-direction: column;
      overflow-x: auto;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #3b82f6;
      color: white;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
    }
    td {
      font-size: 10pt;
      color: #1f2937;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .footer {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      color: #9ca3af;
      margin-top: auto;
    }
    .analytics-section {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .analytics-card {
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .analytics-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .analytics-value {
      font-size: 16pt;
      font-weight: 700;
      color: #3b82f6;
    }
    .positive {
      color: #059669;
    }
    .negative {
      color: #dc2626;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</h1>
      <p class="subtitle">${tenantName || 'Tenant'} | ${formatDate(startDate)} - ${formatDate(endDate)} | ${currentDate}</p>
    </div>
    
    <div class="content">
      ${type === 'report' || type === 'both' ? generateReportSection(reportData, reportType, isGlobal || false) : ''}
      ${type === 'analytics' || type === 'both' ? generateAnalyticsSection(analyticsData) : ''}
    </div>
    
    <div class="footer">
      <p>Dibuat oleh Warungin | ${currentDate}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Template 3: Colorful
function generateColorfulTemplate(data: ExportData): string {
  const { type, reportData, analyticsData, reportType, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Export ${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 30mm);
      position: relative;
      background: #fff;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    .header {
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 25px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .title {
      font-size: 24pt;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 10pt;
      color: rgba(255, 255, 255, 0.95);
    }
    .content {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 22px;
      margin-bottom: 15px;
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 18px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 15pt;
      font-weight: 700;
      color: #667eea;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      flex: 1 1 calc(50% - 9px);
      min-width: 200px;
      border: none;
      padding: 18px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
    }
    .stat-card:nth-child(2) {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
    }
    .stat-card:nth-child(3) {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      box-shadow: 0 4px 15px rgba(67, 233, 123, 0.3);
    }
    .stat-card:nth-child(4) {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3);
    }
    .stat-label {
      font-size: 9pt;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 8px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 20pt;
      font-weight: 700;
      color: #fff;
    }
    .table-container {
      display: flex;
      flex-direction: column;
      overflow-x: auto;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #667eea;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 700;
      font-size: 9pt;
      text-transform: uppercase;
    }
    td {
      font-size: 10pt;
      color: #1f2937;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .footer {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding-top: 12px;
      border-top: 2px solid #667eea;
      font-size: 8pt;
      color: #667eea;
      margin-top: auto;
      font-weight: 600;
    }
    .analytics-section {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .analytics-card {
      display: flex;
      flex-direction: column;
      border: none;
      padding: 18px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .analytics-label {
      font-size: 9pt;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 8px;
      font-weight: 600;
    }
    .analytics-value {
      font-size: 18pt;
      font-weight: 700;
      color: #fff;
    }
    .positive {
      color: #43e97b;
    }
    .negative {
      color: #f5576c;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</h1>
      <p class="subtitle">${tenantName || 'Tenant'} | ${formatDate(startDate)} - ${formatDate(endDate)} | ${currentDate}</p>
    </div>
    
    <div class="content">
      ${type === 'report' || type === 'both' ? generateReportSection(reportData, reportType, isGlobal || false) : ''}
      ${type === 'analytics' || type === 'both' ? generateAnalyticsSection(analyticsData) : ''}
    </div>
    
    <div class="footer">
      <p>Dibuat oleh Warungin | ${currentDate}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Template 5: Elegant
function generateElegantTemplate(data: ExportData): string {
  const { type, reportData, analyticsData, reportType, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Export ${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 10pt;
      line-height: 1.8;
      color: #2d3748;
      background: #fafafa;
    }
    .container {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 30mm);
      position: relative;
      background: #fff;
      padding: 30px;
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      flex-direction: column;
      border-bottom: 2px solid #cbd5e0;
      padding-bottom: 20px;
      margin-bottom: 30px;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100px;
      height: 2px;
      background: #d4af37;
    }
    .title {
      font-size: 26pt;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 10pt;
      color: #718096;
      font-style: italic;
    }
    .content {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 25px;
      margin-bottom: 15px;
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 20px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 16pt;
      font-weight: 700;
      color: #2d3748;
      padding-bottom: 12px;
      border-bottom: 1px solid #cbd5e0;
      position: relative;
      padding-left: 15px;
    }
    .section-title::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #d4af37;
    }
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      flex: 1 1 calc(50% - 10px);
      min-width: 200px;
      border: 1px solid #e2e8f0;
      padding: 20px;
      background: #fff;
      position: relative;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: #d4af37;
    }
    .stat-label {
      font-size: 9pt;
      color: #718096;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 22pt;
      font-weight: 700;
      color: #2d3748;
    }
    .table-container {
      display: flex;
      flex-direction: column;
      overflow-x: auto;
      border: 1px solid #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f7fafc;
      color: #2d3748;
      font-weight: 700;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    td {
      font-size: 10pt;
      color: #2d3748;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .footer {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #a0aec0;
      margin-top: auto;
      font-style: italic;
    }
    .analytics-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .analytics-card {
      display: flex;
      flex-direction: column;
      border: 1px solid #e2e8f0;
      padding: 20px;
      background: #fff;
      position: relative;
    }
    .analytics-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: #d4af37;
    }
    .analytics-label {
      font-size: 9pt;
      color: #718096;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .analytics-value {
      font-size: 20pt;
      font-weight: 700;
      color: #2d3748;
    }
    .positive {
      color: #38a169;
    }
    .negative {
      color: #e53e3e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</h1>
      <p class="subtitle">${tenantName || 'Tenant'} | ${formatDate(startDate)} - ${formatDate(endDate)} | ${currentDate}</p>
    </div>
    
    <div class="content">
      ${type === 'report' || type === 'both' ? generateReportSection(reportData, reportType, isGlobal || false) : ''}
      ${type === 'analytics' || type === 'both' ? generateAnalyticsSection(analyticsData) : ''}
    </div>
    
    <div class="footer">
      <p>Dibuat oleh Warungin | ${currentDate}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper functions (same as before)
function generateReportSection(reportData: any, reportType?: string, isGlobal: boolean = false): string {
  if (!reportData) return '';
  
  let summaryStats = '';
  let tableContent = '';
  
  // Generate summary stats
  if (reportData.summary) {
    let stats: Array<[string, any]> = [];
    
    if (isGlobal) {
      // Global Report: Show subscription + addon revenue
      const totalGlobalRevenue = (reportData.summary.totalSubscriptionRevenue || 0) + (reportData.summary.totalAddonRevenue || 0);
      stats = [
        ['totalGlobalRevenue', totalGlobalRevenue],
        ['totalSubscriptionRevenue', reportData.summary.totalSubscriptionRevenue || 0],
        ['totalAddonRevenue', reportData.summary.totalAddonRevenue || 0],
        ['activeTenants', reportData.summary.activeTenants || 0],
      ].filter(([_, value]) => value !== undefined && value !== null);
    } else {
      // Tenant Report: Show orders/transactions revenue
      stats = Object.entries(reportData.summary)
        .filter(([key, value]) => {
          // Exclude subscription/addon revenue for tenant reports
          return key !== 'totalSubscriptionRevenue' && 
                 key !== 'totalAddonRevenue' && 
                 key !== 'totalGlobalRevenue' &&
                 key !== 'activeTenants' &&
                 value !== undefined && 
                 value !== null;
        })
        .slice(0, 4);
    }
    
    if (stats.length > 0) {
    summaryStats = `
      <div class="stats-grid">
        ${stats.map(([key, value]) => `
          <div class="stat-card">
            <div class="stat-label">${formatLabel(key)}</div>
            <div class="stat-value">${formatValue(value)}</div>
          </div>
        `).join('')}
      </div>
    `;
    }
  }
  
  // Generate table based on report type
  switch (reportType) {
    case 'global':
      // Global Report: Show subscriptions and addons tables
      if (reportData.subscriptions && reportData.subscriptions.length > 0) {
        tableContent += `
          <div class="section">
            <div class="section-title">Penjualan Subscription</div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Paket</th>
                    <th class="text-right">Jumlah</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.subscriptions.slice(0, 50).map((item: any) => `
                    <tr>
                      <td>${item.tenantName || '-'}</td>
                      <td>${item.plan || '-'}</td>
                      <td class="text-right">${formatCurrency(item.amount || 0)}</td>
                      <td>${formatDate(item.createdAt)}</td>
                      <td>${item.status || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      
      if (reportData.addons && reportData.addons.length > 0) {
        tableContent += `
          <div class="section">
            <div class="section-title">Penjualan Addons</div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Nama Addon</th>
                    <th class="text-right">Jumlah</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.addons.slice(0, 50).map((item: any) => `
                    <tr>
                      <td>${item.tenantName || '-'}</td>
                      <td>${item.addonName || '-'}</td>
                      <td class="text-right">${formatCurrency(item.amount || 0)}</td>
                      <td>${formatDate(item.createdAt)}</td>
                      <td>${item.status || 'active'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      break;
      
    case 'sales':
      if (reportData.byDate && reportData.byDate.length > 0) {
        tableContent = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th class="text-right">Total Pendapatan</th>
                  <th class="text-right">Jumlah Transaksi</th>
                  <th class="text-right">Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.byDate.map((item: any) => `
                  <tr>
                    <td>${formatDate(item.date)}</td>
                    <td class="text-right">${formatCurrency(item.revenue || 0)}</td>
                    <td class="text-right">${item.count || 0}</td>
                    <td class="text-right">${formatCurrency((item.revenue || 0) / (item.count || 1))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      break;
      
    case 'product':
      if (reportData.products && reportData.products.length > 0) {
        tableContent = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th class="text-right">Jumlah Terjual</th>
                  <th class="text-right">Total Pendapatan</th>
                  <th class="text-right">Stok</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.products.slice(0, 50).map((item: any) => `
                  <tr>
                    <td>${item.product?.name || item.name || '-'}</td>
                    <td>${item.product?.category || item.category || '-'}</td>
                    <td class="text-right">${item.totalSold || 0}</td>
                    <td class="text-right">${formatCurrency(item.totalRevenue || 0)}</td>
                    <td class="text-right">${item.stockLevel || item.stock || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      break;
      
    case 'customers':
      const allCustomers = [
        ...(reportData.customers || []),
        ...(reportData.members || []),
      ];
      if (allCustomers.length > 0) {
        tableContent = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama Pelanggan</th>
                  <th>Email</th>
                  <th class="text-right">Jumlah Transaksi</th>
                  <th class="text-right">Total Belanja</th>
                  <th class="text-right">Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                ${allCustomers.slice(0, 50).map((item: any) => `
                  <tr>
                    <td>${item.customer?.name || item.member?.name || '-'}</td>
                    <td>${item.customer?.email || item.member?.email || '-'}</td>
                    <td class="text-right">${item.totalOrders || 0}</td>
                    <td class="text-right">${formatCurrency(item.totalSpent || 0)}</td>
                    <td class="text-right">${formatCurrency(item.averageOrder || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      break;
      
    case 'financial':
      if (reportData.byDate && reportData.byDate.length > 0) {
        tableContent = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th class="text-right">Pendapatan</th>
                  <th class="text-right">Biaya Pokok</th>
                  <th class="text-right">Laba Kotor</th>
                  <th class="text-right">Margin Laba</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.byDate.map((item: any) => `
                  <tr>
                    <td>${formatDate(item.date)}</td>
                    <td class="text-right">${formatCurrency(reportData.revenue || 0)}</td>
                    <td class="text-right">${formatCurrency(reportData.costOfGoods || 0)}</td>
                    <td class="text-right">${formatCurrency(reportData.grossProfit || 0)}</td>
                    <td class="text-right">${(reportData.profitMargin || 0).toFixed(2)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        tableContent = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Keterangan</th>
                  <th class="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pendapatan</td>
                  <td class="text-right">${formatCurrency(reportData.revenue || 0)}</td>
                </tr>
                <tr>
                  <td>Biaya Pokok (COGS)</td>
                  <td class="text-right">${formatCurrency(reportData.costOfGoods || 0)}</td>
                </tr>
                <tr>
                  <td>Laba Kotor</td>
                  <td class="text-right">${formatCurrency(reportData.grossProfit || 0)}</td>
                </tr>
                <tr>
                  <td>Margin Laba</td>
                  <td class="text-right">${(reportData.profitMargin || 0).toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }
      break;
      
    default:
      if (reportData.byDate && reportData.byDate.length > 0) {
        tableContent = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th class="text-right">Total Pendapatan</th>
                  <th class="text-right">Jumlah Transaksi</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.byDate.map((item: any) => `
                  <tr>
                    <td>${formatDate(item.date)}</td>
                    <td class="text-right">${formatCurrency(item.revenue || 0)}</td>
                    <td class="text-right">${item.count || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
  }
  
  const reportTypeLabels: Record<string, string> = {
    sales: 'Penjualan',
    product: 'Produk',
    customers: 'Pelanggan',
    inventory: 'Inventori',
    financial: 'Keuangan',
    global: 'Global',
  };
  
  return `
    <div class="section">
      <h2 class="section-title">Laporan ${reportTypeLabels[reportType || ''] || reportType || 'Penjualan'}</h2>
      ${summaryStats}
      ${tableContent}
    </div>
  `;
}

function generateAnalyticsSection(analyticsData: any): string {
  if (!analyticsData) return '';
  
  let content = '';
  
  if (analyticsData.predictions) {
    content += `
      <div class="analytics-section">
        <h2 class="section-title">Prediksi Penjualan</h2>
        <div class="stats-grid">
          <div class="analytics-card">
            <div class="analytics-label">Prediksi Bulan Depan</div>
            <div class="analytics-value">${formatCurrency(analyticsData.predictions.nextMonth || 0)}</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-label">Trend Penjualan</div>
            <div class="analytics-value ${(analyticsData.predictions.trend || 0) >= 0 ? 'positive' : 'negative'}">
              ${(analyticsData.predictions.trend || 0) >= 0 ? '+' : ''}${(analyticsData.predictions.trend || 0).toFixed(2)}%
            </div>
          </div>
          <div class="analytics-card">
            <div class="analytics-label">Akurasi Prediksi</div>
            <div class="analytics-value">${analyticsData.predictions.accuracy || 0}%</div>
          </div>
        </div>
      </div>
    `;
  }
  
  if (analyticsData.topProducts && analyticsData.topProducts.length > 0) {
    content += `
      <div class="section">
        <h2 class="section-title">Produk Terlaris</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th class="text-right">Total Terjual</th>
              </tr>
            </thead>
            <tbody>
              ${analyticsData.topProducts.map((product: any, index: number) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${product.name}</td>
                  <td class="text-right">${product.sales || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  return content;
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    totalRevenue: 'Total Pendapatan',
    totalOrders: 'Total Pesanan',
    averageOrderValue: 'Rata-rata per Pesanan',
    totalItems: 'Total Item Terjual',
    totalProducts: 'Total Produk',
    totalSold: 'Total Terjual',
    lowStockCount: 'Stok Rendah',
    totalCustomers: 'Total Pelanggan',
    totalMembers: 'Total Member',
    totalStockValue: 'Nilai Stok',
    revenue: 'Pendapatan',
    costOfGoods: 'Biaya Pokok',
    grossProfit: 'Laba Kotor',
    profitMargin: 'Margin Laba',
    totalTenants: 'Total Tenant',
    activeTenants: 'Tenant Aktif',
    totalSubscriptionRevenue: 'Pendapatan Subscription',
    totalAddonRevenue: 'Pendapatan Addons',
    totalGlobalRevenue: 'Total Pendapatan Global',
    averagePerTenant: 'Rata-rata per Tenant',
    totalTransactions: 'Total Transaksi',
  };
  return labels[key] || key;
}

function formatValue(value: any): string {
  if (typeof value === 'number') {
    if (value > 1000000) {
      return formatCurrency(value);
    }
    return value.toLocaleString('id-ID');
  }
  return String(value);
}

// Template 5: Classic (HTML version)
function generateClassicTemplate(data: ExportData): string {
  const { type, reportData, analyticsData, reportType, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Export ${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</title>
  <style>
    @page {
      size: A4;
      margin: 25mm 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.8;
      color: #1f2937;
      background: #fff;
    }
    .header {
      border: 2px solid #1f2937;
      padding: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitle {
      font-size: 10pt;
      color: #4b5563;
      text-align: center;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 25px;
      margin-bottom: 35px;
    }
    .stat-card {
      border: 2px solid #1f2937;
      padding: 20px 25px;
      background: #f9fafb;
    }
    .stat-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .stat-value {
      font-size: 22pt;
      font-weight: 700;
      color: #111827;
    }
    .footer {
      position: fixed;
      bottom: 10mm;
      left: 20mm;
      font-size: 9pt;
      color: #6b7280;
      background: transparent;
    }
    .content {
      margin-bottom: 30px;
      padding-bottom: 20px;
    }
    .table-container {
      border: 2px solid #1f2937;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid #1f2937;
    }
    th {
      background: #1f2937;
      color: white;
      font-weight: 700;
    }
    .text-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${type === 'report' ? 'Laporan' : type === 'analytics' ? 'Analytics' : 'Laporan & Analytics'}</h1>
    <p class="subtitle">${tenantName || 'Tenant'} | ${formatDate(startDate)} - ${formatDate(endDate)} | ${currentDate}</p>
  </div>
  
  <div class="content">
    ${type === 'report' || type === 'both' ? generateReportSection(reportData, reportType, isGlobal || false) : ''}
    ${type === 'analytics' || type === 'both' ? generateAnalyticsSection(analyticsData) : ''}
  </div>
  
  <div class="footer">
    <p>Dibuat oleh Warungin | ${currentDate}</p>
  </div>
</body>
</html>
  `;
}


