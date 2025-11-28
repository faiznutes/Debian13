import { formatCurrency, formatDate, formatDateTime } from './formatters';

interface ExportData {
  type: 'report' | 'analytics' | 'both';
  reportData?: any;
  analyticsData?: any;
  reportType?: string;
  startDate: string;
  endDate: string;
  tenantName?: string;
}

/**
 * Generate PDF using flexbox layout (no HTML templates)
 */
import { downloadPDFFromHTMLIframe } from './pdf-download';

export async function generateFlexboxExport(data: ExportData) {
  const html = generateFlexboxHTML(data);
  
  // Generate filename
  const { type, reportType, startDate, endDate } = data;
  const reportTypeLabel = reportType === 'sales' ? 'Penjualan' :
                          reportType === 'product' ? 'Produk' :
                          reportType === 'customers' ? 'Pelanggan' :
                          reportType === 'inventory' ? 'Inventori' :
                          reportType === 'financial' ? 'Keuangan' : 'Laporan';
  
  const exportTypeLabel = type === 'report' ? 'Laporan' :
                          type === 'analytics' ? 'Analytics' :
                          'Laporan-Analytics';
  
  const filename = `${exportTypeLabel}_${reportTypeLabel}_${startDate}_${endDate}.pdf`;
  
  await downloadPDFFromHTMLIframe(html, filename);
}

function generateFlexboxHTML(data: ExportData): string {
  const { type, reportData, analyticsData, reportType, startDate, endDate, tenantName } = data;
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
      line-height: 1.5;
      color: #1f2937;
      background: #fff;
    }
    .container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .header {
      display: flex;
      flex-direction: column;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .title {
      font-size: 22pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 9pt;
      color: #6b7280;
    }
    .content {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 20px;
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
      border-bottom: 1px solid #e5e7eb;
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
      background: #f9fafb;
    }
    .stat-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 18pt;
      font-weight: 700;
      color: #111827;
    }
    .table-container {
      display: flex;
      flex-direction: column;
      overflow-x: auto;
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
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 9pt;
      text-transform: uppercase;
    }
    td {
      font-size: 10pt;
      color: #1f2937;
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
      margin-top: auto;
      padding-top: 20px;
      font-size: 9pt;
      color: #9ca3af;
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
      background: #f9fafb;
    }
    .analytics-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .analytics-value {
      font-size: 16pt;
      font-weight: 700;
      color: #111827;
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
      ${type === 'report' || type === 'both' ? generateReportSection(reportData, reportType) : ''}
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

function generateReportSection(reportData: any, reportType?: string): string {
  if (!reportData) return '';
  
  let summaryStats = '';
  let tableContent = '';
  
  // Generate summary stats
  if (reportData.summary) {
    const stats = Object.entries(reportData.summary).slice(0, 4);
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
  
  // Generate table based on report type
  switch (reportType) {
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
      
    case 'inventory':
      if (reportData.inventory && reportData.inventory.length > 0) {
        tableContent = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th class="text-right">Stok Saat Ini</th>
                  <th class="text-right">Stok Minimum</th>
                  <th class="text-right">Nilai Stok</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.inventory.slice(0, 50).map((item: any) => `
                  <tr>
                    <td>${item.product?.name || item.name || '-'}</td>
                    <td>${item.product?.category || item.category || '-'}</td>
                    <td class="text-right">${item.currentStock || 0}</td>
                    <td class="text-right">${item.minStock || 0}</td>
                    <td class="text-right">${formatCurrency(item.stockValue || 0)}</td>
                    <td>${item.isLowStock ? 'Stok Rendah' : 'Normal'}</td>
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
        // Show summary if no byDate
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
      // Fallback for unknown types
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

