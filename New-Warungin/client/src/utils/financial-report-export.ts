interface FinancialData {
  summary: {
    revenue: number;
    revenueGrowth: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  };
  profitLoss: {
    revenue: number;
    discount: number;
    cogs: number;
    operatingExpenses: number;
    netProfit: number;
  };
  balanceSheet: {
    cash: number;
    receivables: number;
    inventory: number;
    totalAssets: number;
    liabilities: number;
    equity: number;
    totalLiabilities: number;
  };
  cashFlow: {
    operating: { inflow: number; outflow: number; net: number };
    investing: { inflow: number; outflow: number; net: number };
    financing: { inflow: number; outflow: number; net: number };
    total: number;
  };
  startDate: string;
  endDate: string;
}

import { downloadPDFFromHTMLIframe } from './pdf-download';

export async function generateFinancialReportPDF(data: FinancialData) {
  const html = generateFinancialReportHTML(data);
  
  // Generate filename
  const { startDate, endDate } = data;
  const filename = `Laporan_Keuangan_${startDate}_${endDate}.pdf`;
  
  await downloadPDFFromHTMLIframe(html, filename);
}

function generateFinancialReportHTML(data: FinancialData): string {
  const { summary, profitLoss, balanceSheet, cashFlow, startDate, endDate } = data;
  const date = new Date().toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan Keuangan</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
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
      background: #fff;
    }
    .header {
      border-bottom: 2px solid #1f2937;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .title {
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 10pt;
      color: #6b7280;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    .summary-card {
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 4px;
      background: #f9fafb;
    }
    .summary-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 16pt;
      font-weight: 700;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
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
    .text-bold {
      font-weight: 700;
    }
    .positive {
      color: #059669;
    }
    .negative {
      color: #dc2626;
    }
    .footer {
      position: fixed;
      bottom: 10mm;
      left: 20mm;
      font-size: 9pt;
      color: #9ca3af;
      background: transparent;
    }
    .content {
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">Laporan Keuangan</h1>
    <p class="subtitle">Periode: ${formatDate(startDate)} - ${formatDate(endDate)} | ${date}</p>
  </div>
  
  <div class="content">
    <!-- Financial Summary -->
    <div class="section">
      <h2 class="section-title">Ringkasan Keuangan</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Revenue</div>
          <div class="summary-value">${formatCurrency(summary.revenue)}</div>
          <div style="font-size: 8pt; color: #059669; margin-top: 5px;">
            +${summary.revenueGrowth}% vs bulan lalu
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Expenses</div>
          <div class="summary-value">${formatCurrency(summary.expenses)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Net Profit</div>
          <div class="summary-value ${summary.profit >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(summary.profit)}
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Profit Margin</div>
          <div class="summary-value">${summary.profitMargin}%</div>
        </div>
      </div>
    </div>

    <!-- Profit & Loss -->
    <div class="section">
      <h2 class="section-title">Laba Rugi</h2>
      <table>
        <thead>
          <tr>
            <th>Keterangan</th>
            <th class="text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Revenue</td>
            <td class="text-right">${formatCurrency(profitLoss.revenue)}</td>
          </tr>
          <tr>
            <td>Discount</td>
            <td class="text-right negative">(${formatCurrency(profitLoss.discount)})</td>
          </tr>
          <tr>
            <td>Cost of Goods Sold (COGS)</td>
            <td class="text-right negative">(${formatCurrency(profitLoss.cogs)})</td>
          </tr>
          <tr>
            <td>Operating Expenses</td>
            <td class="text-right negative">(${formatCurrency(profitLoss.operatingExpenses)})</td>
          </tr>
          <tr class="text-bold" style="background: #f9fafb;">
            <td>Net Profit</td>
            <td class="text-right ${profitLoss.netProfit >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(profitLoss.netProfit)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Balance Sheet -->
    <div class="section">
      <h2 class="section-title">Neraca</h2>
      <table>
        <thead>
          <tr>
            <th>Keterangan</th>
            <th class="text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Assets</strong></td>
            <td></td>
          </tr>
          <tr>
            <td style="padding-left: 20px;">Cash</td>
            <td class="text-right">${formatCurrency(balanceSheet.cash)}</td>
          </tr>
          <tr>
            <td style="padding-left: 20px;">Receivables</td>
            <td class="text-right">${formatCurrency(balanceSheet.receivables)}</td>
          </tr>
          <tr>
            <td style="padding-left: 20px;">Inventory</td>
            <td class="text-right">${formatCurrency(balanceSheet.inventory)}</td>
          </tr>
          <tr class="text-bold" style="background: #f9fafb;">
            <td>Total Assets</td>
            <td class="text-right">${formatCurrency(balanceSheet.totalAssets)}</td>
          </tr>
          <tr>
            <td><strong>Liabilities & Equity</strong></td>
            <td></td>
          </tr>
          <tr>
            <td style="padding-left: 20px;">Liabilities</td>
            <td class="text-right">${formatCurrency(balanceSheet.liabilities)}</td>
          </tr>
          <tr>
            <td style="padding-left: 20px;">Equity</td>
            <td class="text-right">${formatCurrency(balanceSheet.equity)}</td>
          </tr>
          <tr class="text-bold" style="background: #f9fafb;">
            <td>Total Liabilities & Equity</td>
            <td class="text-right">${formatCurrency(balanceSheet.totalLiabilities)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cash Flow -->
    <div class="section">
      <h2 class="section-title">Cash Flow</h2>
      <table>
        <thead>
          <tr>
            <th>Keterangan</th>
            <th class="text-right">Inflow</th>
            <th class="text-right">Outflow</th>
            <th class="text-right">Net</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Operating Activities</strong></td>
            <td class="text-right">${formatCurrency(cashFlow.operating.inflow)}</td>
            <td class="text-right negative">(${formatCurrency(cashFlow.operating.outflow)})</td>
            <td class="text-right ${cashFlow.operating.net >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(cashFlow.operating.net)}
            </td>
          </tr>
          <tr>
            <td><strong>Investing Activities</strong></td>
            <td class="text-right">${formatCurrency(cashFlow.investing.inflow)}</td>
            <td class="text-right negative">(${formatCurrency(cashFlow.investing.outflow)})</td>
            <td class="text-right ${cashFlow.investing.net >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(cashFlow.investing.net)}
            </td>
          </tr>
          <tr>
            <td><strong>Financing Activities</strong></td>
            <td class="text-right">${formatCurrency(cashFlow.financing.inflow)}</td>
            <td class="text-right negative">(${formatCurrency(cashFlow.financing.outflow)})</td>
            <td class="text-right ${cashFlow.financing.net >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(cashFlow.financing.net)}
            </td>
          </tr>
          <tr class="text-bold" style="background: #f9fafb;">
            <td>Total Cash Flow</td>
            <td></td>
            <td></td>
            <td class="text-right ${cashFlow.total >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(cashFlow.total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <div class="footer">
    <p>Dibuat oleh Warungin | ${date}</p>
  </div>
</body>
</html>
  `;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

