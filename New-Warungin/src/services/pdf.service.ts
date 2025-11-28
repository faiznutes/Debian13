import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

interface ReportData {
  title?: string;
  filename?: string;
  reportData?: any;
  analyticsData?: any;
  reportType?: string;
  startDate?: string;
  endDate?: string;
  tenantName?: string;
  isGlobal?: boolean;
  profitLoss?: {
    revenue?: number;
    discount?: number;
    cogs?: number;
    grossProfit?: number;
    operatingExpenses?: number;
    netProfit?: number;
    grossProfitMargin?: number;
    netProfitMargin?: number;
  };
  tenantId?: string;
}

// Fonts configuration
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

function formatCurrencyValue(value: any): string {
  if (typeof value === 'string') {
    try {
      value = parseFloat(value);
    } catch {
      return value;
    }
  }
  if (value == null || isNaN(value)) {
    return 'Rp 0';
  }
  return `Rp ${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}

function formatDateValue(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function createSummaryCards(summary: any, colors: { bg: string; text: string; border: string }, isGlobal: boolean = false): any[] {
  const cards: any[] = [];
  
  // For Global Report: Total Revenue = Subscription + Addon Revenue
  // For Tenant Report: Total Revenue = Orders/Transactions Revenue
  if (isGlobal) {
    // Global Report: Calculate total from subscription + addon revenue
    const totalGlobalRevenue = (summary.totalSubscriptionRevenue || 0) + (summary.totalAddonRevenue || 0);
    if (totalGlobalRevenue > 0 || summary.totalSubscriptionRevenue || summary.totalAddonRevenue) {
      cards.push({
        stack: [
          { text: 'Total Pendapatan Global', style: 'summaryLabel', color: colors.text },
          { text: formatCurrencyValue(totalGlobalRevenue), style: 'summaryValue', color: colors.text }
        ],
        fillColor: colors.bg,
        border: [true, true, true, true],
        borderColor: colors.border,
        borderWidth: 1,
        margin: [0, 0, 8, 8],
        alignment: 'center',
        padding: [12, 8]
      });
    }
  } else {
    // Tenant Report: Use totalRevenue from orders/transactions
    if (summary.totalRevenue) {
      cards.push({
        stack: [
          { text: 'Total Pendapatan', style: 'summaryLabel', color: colors.text },
          { text: formatCurrencyValue(summary.totalRevenue), style: 'summaryValue', color: colors.text }
        ],
        fillColor: colors.bg,
        border: [true, true, true, true],
        borderColor: colors.border,
        borderWidth: 1,
        margin: [0, 0, 8, 8],
        alignment: 'center',
        padding: [12, 8]
      });
    }
  }
  
  if (summary.totalOrders) {
    cards.push({
      stack: [
        { text: 'Total Pesanan', style: 'summaryLabel', color: colors.text },
        { text: summary.totalOrders.toString(), style: 'summaryValue', color: colors.text }
      ],
      fillColor: colors.bg,
      border: [true, true, true, true],
      borderColor: colors.border,
      borderWidth: 1,
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  
  // Only show totalGlobalRevenue if not already calculated above (for backward compatibility)
  if (!isGlobal && summary.totalGlobalRevenue) {
    cards.push({
      stack: [
        { text: 'Pendapatan Global', style: 'summaryLabel', color: colors.text },
        { text: formatCurrencyValue(summary.totalGlobalRevenue), style: 'summaryValue', color: colors.text }
      ],
      fillColor: colors.bg,
      border: [true, true, true, true],
      borderColor: colors.border,
      borderWidth: 1,
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  
  // Active Tenants only for Global Report
  if (isGlobal && summary.activeTenants) {
    cards.push({
      stack: [
        { text: 'Tenant Aktif', style: 'summaryLabel', color: colors.text },
        { text: summary.activeTenants.toString(), style: 'summaryValue', color: colors.text }
      ],
      fillColor: colors.bg,
      border: [true, true, true, true],
      borderColor: colors.border,
      borderWidth: 1,
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  
  // Subscription Revenue only for Global Report
  if (isGlobal && summary.totalSubscriptionRevenue) {
    cards.push({
      stack: [
        { text: 'Pendapatan Subscription', style: 'summaryLabel', color: colors.text },
        { text: formatCurrencyValue(summary.totalSubscriptionRevenue), style: 'summaryValue', color: colors.text }
      ],
      fillColor: colors.bg,
      border: [true, true, true, true],
      borderColor: colors.border,
      borderWidth: 1,
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  
  // Addon Revenue only for Global Report
  if (isGlobal && summary.totalAddonRevenue) {
    cards.push({
      stack: [
        { text: 'Pendapatan Addon', style: 'summaryLabel', color: colors.text },
        { text: formatCurrencyValue(summary.totalAddonRevenue), style: 'summaryValue', color: colors.text }
      ],
      fillColor: colors.bg,
      border: [true, true, true, true],
      borderColor: colors.border,
      borderWidth: 1,
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  
  return cards;
}

// Template 1: Minimalis - Clean & Simple (Based on pdfkit-contoh)
function createMinimalistTemplate(data: ReportData): TDocumentDefinitions {
  const { title = 'Laporan Penjualan', reportData, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subtitle = `Periode: ${formatDateValue(startDate)} - ${formatDateValue(endDate)}`;

  const content: any[] = [
    // Header - centered, clean
    { text: title, style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
    { text: subtitle, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 30] },
  ];

  if (tenantName && !isGlobal) {
    content.push({ 
      text: `Tenant: ${tenantName}`, 
      style: 'subheader', 
      alignment: 'center', 
      margin: [0, 0, 0, 30] 
    });
  }

  // Summary cards
  if (reportData?.summary) {
    const cards = createSummaryCards(reportData.summary, {
      bg: '#f9fafb',
      text: '#374151',
      border: '#e5e7eb'
    }, isGlobal || false);
    
    if (cards.length > 0) {
      const cardsPerRow = 2;
      const rows: any[] = [];
      for (let i = 0; i < cards.length; i += cardsPerRow) {
        const rowCards = cards.slice(i, i + cardsPerRow);
        rows.push({
          columns: rowCards,
          columnGap: 12,
          margin: [0, 0, 0, 12]
        });
      }
      content.push({
        stack: rows,
        margin: [0, 0, 0, 30]
      });
    }
  }

  // Tables - Only show orders for tenant reports
  if (!isGlobal && reportData?.orders && reportData.orders.length > 0) {
    content.push({ text: 'Data Pesanan', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*'],
        body: [
          ['No. Pesanan', 'Tanggal', 'Total', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.orders.slice(0, 50).map((order: any, index: number) => [
            order.orderNumber || '-',
            formatDateValue(order.createdAt),
            formatCurrencyValue(order.total),
            order.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#e5e7eb',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.subscriptions && reportData.subscriptions.length > 0) {
    content.push({ text: 'Penjualan Subscription', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Paket', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.subscriptions.slice(0, 50).map((sub: any) => [
            sub.tenantName || '-',
            sub.plan || '-',
            formatCurrencyValue(sub.amount),
            formatDateValue(sub.createdAt),
            sub.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#e5e7eb',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.addons && reportData.addons.length > 0) {
    content.push({ text: 'Penjualan Addons', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Nama Addon', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.addons.slice(0, 50).map((addon: any) => [
            addon.tenantName || '-',
            addon.addonName || '-',
            formatCurrencyValue(addon.amount),
            formatDateValue(addon.createdAt),
            addon.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#e5e7eb',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Footer
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 30, 0, 10]
  });
  content.push({ 
    text: `Warungin POS - Generated Report | Dibuat pada: ${currentDate}`, 
    style: 'footer', 
    alignment: 'center',
    margin: [0, 5, 0, 0]
  });

  return {
    content,
    styles: {
      header: { fontSize: 20, bold: true, color: '#000000', margin: [0, 0, 0, 5] },
      subheader: { fontSize: 12, color: '#666666' },
      sectionTitle: { fontSize: 14, bold: true, color: '#374151', margin: [0, 5, 0, 8] },
      summaryLabel: { fontSize: 9, color: '#6b7280' },
      summaryValue: { fontSize: 14, bold: true, margin: [0, 4, 0, 0] },
      tableHeader: { fontSize: 10, bold: true, color: '#000000', fillColor: '#f9fafb' },
      footer: { fontSize: 10, color: '#999999', italics: true }
    },
    defaultStyle: { fontSize: 10, font: 'Roboto', color: '#000000' },
    pageMargins: [50, 50, 50, 50],
    pageSize: 'A4'
  };
}

// Template 2: Modern - Blue Theme with Header Block (Based on pdfkit-contoh)
function createModernTemplate(data: ReportData): TDocumentDefinitions {
  const { title = 'Laporan Penjualan', reportData, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subtitle = `Periode: ${formatDateValue(startDate)} - ${formatDateValue(endDate)}`;

  const content: any[] = [
    // Header with blue background block
    {
      stack: [
        { text: title, style: 'header', alignment: 'left', margin: [20, 20, 20, 8] },
        { text: subtitle, style: 'subheader', alignment: 'left', margin: [20, 0, 20, 20] },
      ],
      fillColor: '#4F46E5',
      color: '#ffffff',
      margin: [-40, -40, -40, 30]
    },
  ];

  if (tenantName && !isGlobal) {
    content.push({ 
      text: `Tenant: ${tenantName}`, 
      style: 'tenantName', 
      alignment: 'left', 
      margin: [0, 0, 0, 20] 
    });
  }

  // Summary cards with blue theme
  if (reportData?.summary) {
    const cards = createSummaryCards(reportData.summary, {
      bg: '#E0E7FF',
      text: '#111827',
      border: '#4F46E5'
    }, isGlobal || false);
    
    if (cards.length > 0) {
      const cardsPerRow = 2;
      const rows: any[] = [];
      for (let i = 0; i < cards.length; i += cardsPerRow) {
        const rowCards = cards.slice(i, i + cardsPerRow);
        rows.push({
          columns: rowCards,
          columnGap: 12,
          margin: [0, 0, 0, 12]
        });
      }
      content.push({
        stack: rows,
        margin: [0, 0, 0, 30]
      });
    }
  }

  // Tables with blue header
  // Only show orders for tenant reports
  if (!isGlobal && reportData?.orders && reportData.orders.length > 0) {
    content.push({ text: 'Data Pesanan', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*'],
        body: [
          ['No. Pesanan', 'Tanggal', 'Total', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.orders.slice(0, 50).map((order: any) => [
            order.orderNumber || '-',
            formatDateValue(order.createdAt),
            formatCurrencyValue(order.total),
            order.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#4F46E5' : '#E0E7FF',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.subscriptions && reportData.subscriptions.length > 0) {
    content.push({ text: 'Penjualan Subscription', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Paket', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.subscriptions.slice(0, 50).map((sub: any) => [
            sub.tenantName || '-',
            sub.plan || '-',
            formatCurrencyValue(sub.amount),
            formatDateValue(sub.createdAt),
            sub.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#4F46E5' : '#E0E7FF',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.addons && reportData.addons.length > 0) {
    content.push({ text: 'Penjualan Addons', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Nama Addon', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.addons.slice(0, 50).map((addon: any) => [
            addon.tenantName || '-',
            addon.addonName || '-',
            formatCurrencyValue(addon.amount),
            formatDateValue(addon.createdAt),
            addon.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#4F46E5' : '#E0E7FF',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Footer with blue background
  content.push({
    stack: [
      { text: `Warungin POS - Generated Report | Dibuat pada: ${currentDate}`, style: 'footer', alignment: 'center' }
    ],
    fillColor: '#4F46E5',
    color: '#ffffff',
    margin: [-40, 30, -40, 0]
  });

  return {
    content,
    styles: {
      header: { fontSize: 22, bold: true, color: '#ffffff' },
      subheader: { fontSize: 12, color: '#e0e0ff' },
      tenantName: { fontSize: 12, color: '#1e40af', bold: true },
      sectionTitle: { fontSize: 16, bold: true, color: '#1e40af', margin: [0, 5, 0, 10] },
      summaryLabel: { fontSize: 9, color: '#3b82f6' },
      summaryValue: { fontSize: 16, bold: true, color: '#111827', margin: [0, 4, 0, 0] },
      tableHeader: { fontSize: 10, bold: true, color: '#ffffff', fillColor: '#4F46E5' },
      footer: { fontSize: 10, color: '#ffffff', italics: true }
    },
    defaultStyle: { fontSize: 10, font: 'Roboto', color: '#1f2937' },
    pageMargins: [40, 40, 40, 40],
    pageSize: 'A4'
  };
}

// Template 3: Klasik - Outer Border with Times Font (Based on pdfkit-contoh)
function createClassicTemplate(data: ReportData): TDocumentDefinitions {
  const { title = 'Laporan Penjualan', reportData, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subtitle = `Periode: ${formatDateValue(startDate)} - ${formatDateValue(endDate)}`;

  const content: any[] = [
    // Outer border simulation (using margin and border)
    {
      stack: [
        // Header
        { text: title, style: 'header', alignment: 'center', margin: [0, 20, 0, 5] },
        { text: subtitle, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
        // Border line
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: '#333333' }],
          margin: [0, 0, 0, 20]
        },
      ],
      border: [true, true, true, true],
      borderColor: '#999999',
      borderWidth: 1,
      margin: [-30, -30, -30, 0]
    },
  ];

  if (tenantName && !isGlobal) {
    content.push({ 
      text: `Tenant: ${tenantName}`, 
      style: 'subheader', 
      alignment: 'center', 
      margin: [0, 20, 0, 20] 
    });
  }

  // Summary cards
  if (reportData?.summary) {
    const cards = createSummaryCards(reportData.summary, {
      bg: '#ffffff',
      text: '#000000',
      border: '#999999'
    }, isGlobal || false);
    
    if (cards.length > 0) {
      const cardsPerRow = 2;
      const rows: any[] = [];
      for (let i = 0; i < cards.length; i += cardsPerRow) {
        const rowCards = cards.slice(i, i + cardsPerRow);
        rows.push({
          columns: rowCards,
          columnGap: 12,
          margin: [0, 0, 0, 12]
        });
      }
      content.push({
        stack: rows,
        margin: [0, 0, 0, 30]
      });
    }
  }

  // Tables
  // Only show orders for tenant reports
  if (!isGlobal && reportData?.orders && reportData.orders.length > 0) {
    content.push({ text: 'Data Pesanan', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*'],
        body: [
          ['No. Pesanan', 'Tanggal', 'Total', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.orders.slice(0, 50).map((order: any) => [
            order.orderNumber || '-',
            formatDateValue(order.createdAt),
            formatCurrencyValue(order.total),
            order.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#333333',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.subscriptions && reportData.subscriptions.length > 0) {
    content.push({ text: 'Penjualan Subscription', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Paket', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.subscriptions.slice(0, 50).map((sub: any) => [
            sub.tenantName || '-',
            sub.plan || '-',
            formatCurrencyValue(sub.amount),
            formatDateValue(sub.createdAt),
            sub.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#333333',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.addons && reportData.addons.length > 0) {
    content.push({ text: 'Penjualan Addons', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Nama Addon', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.addons.slice(0, 50).map((addon: any) => [
            addon.tenantName || '-',
            addon.addonName || '-',
            formatCurrencyValue(addon.amount),
            formatDateValue(addon.createdAt),
            addon.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#333333',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Footer
  content.push({ 
    text: `Warungin POS - Generated Report | Dibuat pada: ${currentDate}`, 
    style: 'footer', 
    alignment: 'center',
    margin: [0, 20, 0, 0]
  });

  return {
    content,
    styles: {
      header: { fontSize: 22, bold: true, color: '#000000' },
      subheader: { fontSize: 12, color: '#333333' },
      sectionTitle: { fontSize: 14, bold: true, color: '#000000' },
      summaryLabel: { fontSize: 9, color: '#666666' },
      summaryValue: { fontSize: 14, bold: true, margin: [0, 4, 0, 0] },
      tableHeader: { fontSize: 10, bold: true, color: '#000000', fillColor: '#f9fafb' },
      footer: { fontSize: 10, color: '#555555', italics: true }
    },
    defaultStyle: { fontSize: 10, font: 'Roboto', color: '#000000' },
    pageMargins: [60, 60, 60, 60],
    pageSize: 'A4'
  };
}

// Template 5: Berwarna (UI Style) - Blue Header with Striped Rows (Based on pdfkit-contoh)
function createColorfulTemplate(data: ReportData): TDocumentDefinitions {
  const { title = 'Laporan Penjualan', reportData, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subtitle = `Periode: ${formatDateValue(startDate)} - ${formatDateValue(endDate)}`;

  const content: any[] = [
    // Header with blue background
    {
      stack: [
        { text: title, style: 'header', alignment: 'left', margin: [20, 20, 20, 8] },
        { text: subtitle, style: 'subheader', alignment: 'left', margin: [20, 0, 20, 20] },
      ],
      fillColor: '#0f62fe',
      color: '#ffffff',
      margin: [-40, -40, -40, 30]
    },
  ];

  if (tenantName && !isGlobal) {
    content.push({ 
      text: `Tenant: ${tenantName}`, 
      style: 'tenantName', 
      alignment: 'left', 
      margin: [0, 0, 0, 20] 
    });
  }

  // Summary cards
  if (reportData?.summary) {
    const cards = createSummaryCards(reportData.summary, {
      bg: '#f4f7ff',
      text: '#0f62fe',
      border: '#0f62fe'
    }, isGlobal || false);
    
    if (cards.length > 0) {
      const cardsPerRow = 2;
      const rows: any[] = [];
      for (let i = 0; i < cards.length; i += cardsPerRow) {
        const rowCards = cards.slice(i, i + cardsPerRow);
        rows.push({
          columns: rowCards,
          columnGap: 12,
          margin: [0, 0, 0, 12]
        });
      }
      content.push({
        stack: rows,
        margin: [0, 0, 0, 30]
      });
    }
  }

  // Tables with striped rows
  // Only show orders for tenant reports
  if (!isGlobal && reportData?.orders && reportData.orders.length > 0) {
    content.push({ text: 'Data Pesanan', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    
    const tableBody: any[] = [
      ['No. Pesanan', 'Tanggal', 'Total', 'Status'].map(h => ({ text: h, style: 'tableHeader' }))
    ];
    
    reportData.orders.slice(0, 50).forEach((order: any, index: number) => {
      const row = [
        order.orderNumber || '-',
        formatDateValue(order.createdAt),
        formatCurrencyValue(order.total),
        order.status || '-'
      ];
      
      // Add striped background for even rows
      if (index % 2 === 0) {
        row.forEach((cell, i) => {
          if (typeof cell === 'object') {
            cell.fillColor = '#f4f7ff';
          }
        });
      }
      
      tableBody.push(row);
    });
    
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*'],
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#0f62fe' : '#d0e0ff',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.subscriptions && reportData.subscriptions.length > 0) {
    content.push({ text: 'Penjualan Subscription', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    
    const tableBody: any[] = [
      ['Tenant', 'Paket', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' }))
    ];
    
    reportData.subscriptions.slice(0, 50).forEach((sub: any, index: number) => {
      const row = [
        sub.tenantName || '-',
        sub.plan || '-',
        formatCurrencyValue(sub.amount),
        formatDateValue(sub.createdAt),
        sub.status || '-'
      ];
      
      if (index % 2 === 0) {
        row.forEach((cell, i) => {
          if (typeof cell === 'object') {
            cell.fillColor = '#f4f7ff';
          }
        });
      }
      
      tableBody.push(row);
    });
    
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#0f62fe' : '#d0e0ff',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.addons && reportData.addons.length > 0) {
    content.push({ text: 'Penjualan Addons', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    
    const tableBody: any[] = [
      ['Tenant', 'Nama Addon', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' }))
    ];
    
    reportData.addons.slice(0, 50).forEach((addon: any, index: number) => {
      const row = [
        addon.tenantName || '-',
        addon.addonName || '-',
        formatCurrencyValue(addon.amount),
        formatDateValue(addon.createdAt),
        addon.status || '-'
      ];
      
      if (index % 2 === 0) {
        row.forEach((cell, i) => {
          if (typeof cell === 'object') {
            cell.fillColor = '#f4f7ff';
          }
        });
      }
      
      tableBody.push(row);
    });
    
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: tableBody
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#0f62fe' : '#d0e0ff',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Footer with blue background
  content.push({
    stack: [
      { text: `Warungin POS - Generated Report | Dibuat pada: ${currentDate}`, style: 'footer', alignment: 'center' }
    ],
    fillColor: '#0f62fe',
    color: '#ffffff',
    margin: [-40, 30, -40, 0]
  });

  return {
    content,
    styles: {
      header: { fontSize: 22, bold: true, color: '#ffffff' },
      subheader: { fontSize: 12, color: '#d0e0ff' },
      tenantName: { fontSize: 12, color: '#0f62fe', bold: true },
      sectionTitle: { fontSize: 16, bold: true, color: '#0f62fe', margin: [0, 5, 0, 10] },
      summaryLabel: { fontSize: 9, color: '#0f62fe' },
      summaryValue: { fontSize: 16, bold: true, color: '#0f62fe', margin: [0, 4, 0, 0] },
      tableHeader: { fontSize: 10, bold: true, color: '#0f62fe', fillColor: '#ffffff' },
      footer: { fontSize: 10, color: '#ffffff', italics: true }
    },
    defaultStyle: { fontSize: 10, font: 'Roboto', color: '#111111' },
    pageMargins: [40, 40, 40, 40],
    pageSize: 'A4'
  };
}

// Template 6: Elegant - Green/Emerald Theme (Keep existing)
function createElegantTemplate(data: ReportData): TDocumentDefinitions {
  const { title = 'Laporan Penjualan', reportData, startDate, endDate, tenantName, isGlobal } = data;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subtitle = `Periode: ${formatDateValue(startDate)} - ${formatDateValue(endDate)}`;

  const content: any[] = [
    {
      stack: [
        { text: title, style: 'header', alignment: 'center', margin: [0, 20, 0, 8] },
        { text: subtitle, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
      ],
      fillColor: '#059669',
      color: '#ffffff',
      margin: [-40, -40, -40, 25],
      border: [false, false, false, true],
      borderColor: '#047857',
      borderWidth: 4
    },
  ];

  if (tenantName && !isGlobal) {
    content.push({ 
      text: `Tenant: ${tenantName}`, 
      style: 'tenantName', 
      alignment: 'center', 
      margin: [0, 0, 0, 20] 
    });
  }

  if (reportData?.summary) {
    const cards = createSummaryCards(reportData.summary, {
      bg: '#d1fae5',
      text: '#047857',
      border: '#10b981'
    }, isGlobal || false);
    
    if (cards.length > 0) {
      const cardsPerRow = 2;
      const rows: any[] = [];
      for (let i = 0; i < cards.length; i += cardsPerRow) {
        const rowCards = cards.slice(i, i + cardsPerRow);
        rows.push({
          columns: rowCards,
          columnGap: 12,
          margin: [0, 0, 0, 12]
        });
      }
      content.push({
        stack: rows,
        margin: [0, 0, 0, 30]
      });
    }
  }

  // Only show orders for tenant reports
  if (!isGlobal && reportData?.orders && reportData.orders.length > 0) {
    content.push({ text: 'Data Pesanan', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*'],
        body: [
          ['No. Pesanan', 'Tanggal', 'Total', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.orders.slice(0, 50).map((order: any) => [
            order.orderNumber || '-',
            formatDateValue(order.createdAt),
            formatCurrencyValue(order.total),
            order.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#10b981' : '#d1fae5',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.subscriptions && reportData.subscriptions.length > 0) {
    content.push({ text: 'Penjualan Subscription', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Paket', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.subscriptions.slice(0, 50).map((sub: any) => [
            sub.tenantName || '-',
            sub.plan || '-',
            formatCurrencyValue(sub.amount),
            formatDateValue(sub.createdAt),
            sub.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#10b981' : '#d1fae5',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  // Only show subscriptions/addons for global reports
  if (isGlobal && reportData?.addons && reportData.addons.length > 0) {
    content.push({ text: 'Penjualan Addons', style: 'sectionTitle', margin: [0, 20, 0, 12] });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['Tenant', 'Nama Addon', 'Jumlah', 'Tanggal', 'Status'].map(h => ({ text: h, style: 'tableHeader' })),
          ...reportData.addons.slice(0, 50).map((addon: any) => [
            addon.tenantName || '-',
            addon.addonName || '-',
            formatCurrencyValue(addon.amount),
            formatDateValue(addon.createdAt),
            addon.status || '-'
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number) => i === 0 || i === 1 ? 2 : 0.5,
        vLineWidth: () => 0,
        hLineColor: (i: number) => i === 0 || i === 1 ? '#10b981' : '#d1fae5',
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10,
      },
      margin: [0, 0, 0, 30]
    });
  }

  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 30, 0, 10]
  });
  content.push({ 
    text: `Warungin POS - Generated Report | Dibuat pada: ${currentDate}`, 
    style: 'footer', 
    alignment: 'center',
    margin: [0, 5, 0, 0]
  });

  return {
    content,
    styles: {
      header: { fontSize: 26, bold: true, color: '#ffffff' },
      subheader: { fontSize: 12, color: '#d1fae5' },
      tenantName: { fontSize: 12, color: '#047857', bold: true },
      sectionTitle: { fontSize: 16, bold: true, color: '#059669', margin: [0, 5, 0, 10] },
      summaryLabel: { fontSize: 9, color: '#10b981' },
      summaryValue: { fontSize: 16, bold: true, color: '#047857', margin: [0, 4, 0, 0] },
      tableHeader: { fontSize: 10, bold: true, color: '#ffffff', fillColor: '#10b981' },
      footer: { fontSize: 10, color: '#9ca3af', italics: true }
    },
    defaultStyle: { fontSize: 10, font: 'Roboto', color: '#1f2937' },
    pageMargins: [40, 40, 40, 40],
    pageSize: 'A4'
  };
}


function createProfitLossTemplate(data: ReportData): TDocumentDefinitions {
  const profitLoss: {
    revenue?: number;
    discount?: number;
    cogs?: number;
    grossProfit?: number;
    operatingExpenses?: number;
    netProfit?: number;
    grossProfitMargin?: number;
    netProfitMargin?: number;
  } = data.profitLoss || {};
  const startDate = data.startDate ? formatDateValue(data.startDate) : 'Semua Waktu';
  const endDate = data.endDate ? formatDateValue(data.endDate) : 'Semua Waktu';
  const currentDate = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const content: any[] = [];

  // Header
  content.push({
    stack: [
      { text: 'LAPORAN LABA RUGI', style: 'header', alignment: 'center' },
      { text: `Periode: ${startDate} - ${endDate}`, style: 'subheader', alignment: 'center', margin: [0, 5, 0, 0] }
    ],
    fillColor: '#059669',
    margin: [0, 0, 0, 20],
    padding: [15, 10]
  });

  // Tenant Name (if available)
  if (data.tenantName) {
    content.push({
      text: `Tenant: ${data.tenantName}`,
      style: 'tenantName',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    });
  }

  // Summary Cards
  const summaryCards: any[] = [];
  if (profitLoss.revenue) {
    summaryCards.push({
      stack: [
        { text: 'Revenue', style: 'summaryLabel' },
        { text: formatCurrencyValue(profitLoss.revenue), style: 'summaryValue' }
      ],
      fillColor: '#d1fae5',
      border: [true, true, true, true],
      borderColor: '#10b981',
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  if (profitLoss.grossProfit !== undefined) {
    summaryCards.push({
      stack: [
        { text: 'Gross Profit', style: 'summaryLabel' },
        { text: formatCurrencyValue(profitLoss.grossProfit), style: 'summaryValue' }
      ],
      fillColor: '#dbeafe',
      border: [true, true, true, true],
      borderColor: '#3b82f6',
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  if (profitLoss.netProfit !== undefined) {
    summaryCards.push({
      stack: [
        { text: 'Net Profit', style: 'summaryLabel' },
        { text: formatCurrencyValue(profitLoss.netProfit), style: 'summaryValue', color: profitLoss.netProfit >= 0 ? '#059669' : '#dc2626' }
      ],
      fillColor: profitLoss.netProfit >= 0 ? '#d1fae5' : '#fee2e2',
      border: [true, true, true, true],
      borderColor: profitLoss.netProfit >= 0 ? '#10b981' : '#ef4444',
      margin: [0, 0, 8, 8],
      alignment: 'center',
      padding: [12, 8]
    });
  }
  if (summaryCards.length > 0) {
    content.push({
      columns: summaryCards,
      margin: [0, 0, 0, 20]
    });
  }

  // Detail Table
  content.push({ text: 'Detail Laporan Laba Rugi', style: 'sectionTitle' });
  
  const detailRows: any[] = [
    [
      { text: 'Keterangan', style: 'tableHeader' },
      { text: 'Jumlah', style: 'tableHeader', alignment: 'right' }
    ]
  ];

  // Revenue Section
  detailRows.push([
    { text: 'Revenue', bold: true, fontSize: 11 },
    { text: formatCurrencyValue(profitLoss.revenue || 0), alignment: 'right' }
  ]);
  detailRows.push([
    { text: '  Penjualan', fontSize: 10 },
    { text: formatCurrencyValue(profitLoss.revenue || 0), alignment: 'right', fontSize: 10 }
  ]);
  if (profitLoss.discount) {
    detailRows.push([
      { text: '  Diskon', fontSize: 10, color: '#dc2626' },
      { text: `-${formatCurrencyValue(profitLoss.discount)}`, alignment: 'right', fontSize: 10, color: '#dc2626' }
    ]);
  }
  const netRevenue = (profitLoss.revenue || 0) - (profitLoss.discount || 0);
  detailRows.push([
    { text: '  Net Revenue', bold: true, fontSize: 10 },
    { text: formatCurrencyValue(netRevenue), alignment: 'right', bold: true, fontSize: 10 }
  ]);

  // COGS Section
  detailRows.push([
    { text: 'Cost of Goods Sold (COGS)', bold: true, fontSize: 11, margin: [0, 10, 0, 0] },
    { text: formatCurrencyValue(profitLoss.cogs || 0), alignment: 'right', color: '#dc2626' }
  ]);

  // Gross Profit
  if (profitLoss.grossProfit !== undefined) {
    detailRows.push([
      { text: 'Gross Profit', bold: true, fontSize: 11, fillColor: '#d1fae5', margin: [0, 10, 0, 0] },
      { text: formatCurrencyValue(profitLoss.grossProfit), alignment: 'right', bold: true, fillColor: '#d1fae5' }
    ]);
    if (profitLoss.grossProfitMargin !== undefined) {
      detailRows.push([
        { text: '  Gross Profit Margin', fontSize: 10 },
        { text: `${profitLoss.grossProfitMargin.toFixed(2)}%`, alignment: 'right', fontSize: 10 }
      ]);
    }
  }

  // Operating Expenses
  detailRows.push([
    { text: 'Operating Expenses', bold: true, fontSize: 11, margin: [0, 10, 0, 0] },
    { text: formatCurrencyValue(profitLoss.operatingExpenses || 0), alignment: 'right', color: '#dc2626' }
  ]);

  // Net Profit
  if (profitLoss.netProfit !== undefined) {
    detailRows.push([
      { text: 'Net Profit', bold: true, fontSize: 12, fillColor: profitLoss.netProfit >= 0 ? '#d1fae5' : '#fee2e2', margin: [0, 10, 0, 0] },
      { text: formatCurrencyValue(profitLoss.netProfit), alignment: 'right', bold: true, fontSize: 12, fillColor: profitLoss.netProfit >= 0 ? '#d1fae5' : '#fee2e2', color: profitLoss.netProfit >= 0 ? '#059669' : '#dc2626' }
    ]);
    if (profitLoss.netProfitMargin !== undefined) {
      detailRows.push([
        { text: '  Net Profit Margin', fontSize: 10 },
        { text: `${profitLoss.netProfitMargin.toFixed(2)}%`, alignment: 'right', fontSize: 10, color: profitLoss.netProfitMargin >= 0 ? '#059669' : '#dc2626' }
      ]);
    }
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto'],
      body: detailRows
    },
    layout: {
      hLineWidth: (i: number) => i === 0 || i === detailRows.length ? 1 : 0.5,
      vLineWidth: () => 0,
      hLineColor: () => '#e5e7eb',
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6
    },
    margin: [0, 0, 0, 20]
  });

  // Footer
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 30, 0, 10]
  });
  content.push({
    text: `Warungin POS - Laporan Laba Rugi | Dibuat pada: ${currentDate}`,
    style: 'footer',
    alignment: 'center',
    margin: [0, 5, 0, 0]
  });

  return {
    content,
    styles: {
      header: { fontSize: 24, bold: true, color: '#ffffff' },
      subheader: { fontSize: 11, color: '#d1fae5' },
      tenantName: { fontSize: 12, color: '#047857', bold: true },
      sectionTitle: { fontSize: 14, bold: true, color: '#059669', margin: [0, 15, 0, 10] },
      summaryLabel: { fontSize: 9, color: '#047857' },
      summaryValue: { fontSize: 16, bold: true, color: '#047857', margin: [0, 4, 0, 0] },
      tableHeader: { fontSize: 10, bold: true, color: '#ffffff', fillColor: '#10b981' },
      footer: { fontSize: 10, color: '#9ca3af', italics: true }
    },
    defaultStyle: { fontSize: 10, font: 'Roboto', color: '#1f2937' },
    pageMargins: [40, 40, 40, 40],
    pageSize: 'A4'
  };
}

export function generatePDF(template: string, data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const templateFunctions: Record<string, (data: ReportData) => TDocumentDefinitions> = {
        minimalist: createMinimalistTemplate,
        modern: createModernTemplate,
        classic: createClassicTemplate,
        colorful: createColorfulTemplate,
        elegant: createElegantTemplate,
        'profit-loss': createProfitLossTemplate,
      };

      const templateFunction = templateFunctions[template] || createModernTemplate;
      
      // Debug: Log template being used
      if (!templateFunctions[template]) {
        console.warn(`Template "${template}" not found, using default (modern)`);
      } else {
        console.log(`Using template: ${template}`);
      }
      
      const docDefinition = templateFunction(data);

      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfDoc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      pdfDoc.on('error', (error: Error) => {
        reject(error);
      });

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}
