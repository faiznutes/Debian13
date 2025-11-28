<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Accounting & Finance</h2>
        <p class="text-gray-600">Laporan keuangan lengkap: Laba Rugi, Neraca, Cash Flow</p>
      </div>
      <div class="flex space-x-2">
        <button
          @click="showPeriodModal = true"
          class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
        >
          Pilih Periode
        </button>
        <button
          @click="exportFinancialReport"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Export Laporan
        </button>
      </div>
    </div>

    <!-- Financial Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Total Revenue</span>
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(financialSummary.revenue) }}</div>
        <div class="text-sm text-green-600 mt-1">+{{ financialSummary.revenueGrowth }}% vs bulan lalu</div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Total Expenses</span>
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(financialSummary.expenses) }}</div>
        <div class="text-sm text-gray-500 mt-1">Biaya operasional</div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Net Profit</span>
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div class="text-2xl font-bold" :class="financialSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ formatCurrency(financialSummary.profit) }}
        </div>
        <div class="text-sm text-gray-500 mt-1">Laba bersih</div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Profit Margin</span>
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ financialSummary.profitMargin }}%</div>
        <div class="text-sm text-gray-500 mt-1">Margin keuntungan</div>
      </div>
    </div>

    <!-- Financial Reports Tabs -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div class="flex space-x-4 border-b border-gray-200 mb-6">
        <router-link
          to="/app/profit-loss"
          class="px-4 py-2 font-semibold border-b-2 transition"
          :class="activeTab === 'profit-loss' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          Laba Rugi
        </router-link>
        <button
          @click="activeTab = 'profit-loss'"
          class="px-4 py-2 font-semibold border-b-2 transition hidden"
          :class="activeTab === 'profit-loss' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          Laba Rugi (Legacy)
        </button>
        <button
          @click="activeTab = 'balance-sheet'"
          class="px-4 py-2 font-semibold border-b-2 transition"
          :class="activeTab === 'balance-sheet' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          Neraca
        </button>
        <button
          @click="activeTab = 'cash-flow'"
          class="px-4 py-2 font-semibold border-b-2 transition"
          :class="activeTab === 'cash-flow' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          Cash Flow
        </button>
      </div>

      <!-- Profit & Loss -->
      <div v-if="activeTab === 'profit-loss'" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Pendapatan</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Penjualan</span>
                <span class="font-semibold">{{ formatCurrency(profitLoss.revenue) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Diskon</span>
                <span class="font-semibold text-red-600">-{{ formatCurrency(profitLoss.discount) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-semibold">
                <span>Total Pendapatan</span>
                <span>{{ formatCurrency(profitLoss.revenue - profitLoss.discount) }}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Biaya</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">HPP (COGS)</span>
                <span class="font-semibold">{{ formatCurrency(profitLoss.cogs) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Biaya Operasional</span>
                <span class="font-semibold">{{ formatCurrency(profitLoss.operatingExpenses) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-semibold">
                <span>Total Biaya</span>
                <span>{{ formatCurrency(profitLoss.cogs + profitLoss.operatingExpenses) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t-2 pt-4 flex justify-between text-lg font-bold">
          <span>Laba Bersih</span>
          <span :class="profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(profitLoss.netProfit) }}
          </span>
        </div>
      </div>

      <!-- Balance Sheet -->
      <div v-if="activeTab === 'balance-sheet'" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Aktiva</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Kas</span>
                <span class="font-semibold">{{ formatCurrency(balanceSheet.cash) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Piutang</span>
                <span class="font-semibold">{{ formatCurrency(balanceSheet.receivables) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Persediaan</span>
                <span class="font-semibold">{{ formatCurrency(balanceSheet.inventory) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-semibold">
                <span>Total Aktiva</span>
                <span>{{ formatCurrency(balanceSheet.totalAssets) }}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Pasiva</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Hutang</span>
                <span class="font-semibold">{{ formatCurrency(balanceSheet.liabilities) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Modal</span>
                <span class="font-semibold">{{ formatCurrency(balanceSheet.equity) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-semibold">
                <span>Total Pasiva</span>
                <span>{{ formatCurrency(balanceSheet.totalLiabilities) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cash Flow -->
      <div v-if="activeTab === 'cash-flow'" class="space-y-4">
        <div class="space-y-3">
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">Aktivitas Operasi</h4>
            <div class="space-y-2 pl-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Penerimaan dari pelanggan</span>
                <span class="font-semibold text-green-600">{{ formatCurrency(cashFlow.operating.inflow) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Pembayaran ke supplier</span>
                <span class="font-semibold text-red-600">-{{ formatCurrency(cashFlow.operating.outflow) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-semibold">
                <span>Net Cash from Operations</span>
                <span :class="cashFlow.operating.net >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(cashFlow.operating.net) }}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">Aktivitas Investasi</h4>
            <div class="space-y-2 pl-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Pembelian aset</span>
                <span class="font-semibold text-red-600">-{{ formatCurrency(cashFlow.investing.outflow) }}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">Aktivitas Pendanaan</h4>
            <div class="space-y-2 pl-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Modal tambahan</span>
                <span class="font-semibold text-green-600">{{ formatCurrency(cashFlow.financing.inflow) }}</span>
              </div>
            </div>
          </div>
          <div class="border-t-2 pt-4 flex justify-between text-lg font-bold">
            <span>Net Cash Flow</span>
            <span :class="cashFlow.total >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(cashFlow.total) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Period Selection Modal -->
    <Teleport to="body">
      <div
        v-if="showPeriodModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showPeriodModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Pilih Periode Laporan</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
              <input
                v-model="periodForm.startDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
              <input
                v-model="periodForm.endDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div class="flex space-x-3">
              <button
                @click="showPeriodModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                @click="loadFinancialData"
                class="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                Load Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';
import { generateFinancialReportPDF } from '../../utils/financial-report-export';

const { needsTenantSelection } = useTenantCheck();
const { success: showSuccess, error: showError } = useNotification();

interface FinancialSummary {
  revenue: number;
  revenueGrowth: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

interface ProfitLoss {
  revenue: number;
  discount: number;
  cogs: number;
  operatingExpenses: number;
  netProfit: number;
}

interface BalanceSheet {
  cash: number;
  receivables: number;
  inventory: number;
  totalAssets: number;
  liabilities: number;
  equity: number;
  totalLiabilities: number;
}

interface CashFlow {
  operating: { inflow: number; outflow: number; net: number };
  investing: { inflow: number; outflow: number; net: number };
  financing: { inflow: number; outflow: number; net: number };
  total: number;
}

const activeTab = ref('profit-loss');
const loading = ref(false);
const showPeriodModal = ref(false);

const financialSummary = ref<FinancialSummary>({
  revenue: 0,
  revenueGrowth: 0,
  expenses: 0,
  profit: 0,
  profitMargin: 0,
});

const profitLoss = ref<ProfitLoss>({
  revenue: 0,
  discount: 0,
  cogs: 0,
  operatingExpenses: 0,
  netProfit: 0,
});

const balanceSheet = ref<BalanceSheet>({
  cash: 0,
  receivables: 0,
  inventory: 0,
  totalAssets: 0,
  liabilities: 0,
  equity: 0,
  totalLiabilities: 0,
});

const cashFlow = ref<CashFlow>({
  operating: { inflow: 0, outflow: 0, net: 0 },
  investing: { inflow: 0, outflow: 0, net: 0 },
  financing: { inflow: 0, outflow: 0, net: 0 },
  total: 0,
});

const periodForm = ref({
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
});

const loadFinancialData = async () => {
  if (needsTenantSelection.value) return;

  loading.value = true;
  try {
    const [summaryRes, profitLossRes, balanceRes, cashFlowRes] = await Promise.all([
      api.get('/finance/summary', { params: periodForm.value }).catch(() => ({ data: financialSummary.value })),
      api.get('/finance/profit-loss', { params: periodForm.value }).catch(() => ({ data: profitLoss.value })),
      api.get('/finance/balance-sheet', { params: periodForm.value }).catch(() => ({ data: balanceSheet.value })),
      api.get('/finance/cash-flow', { params: periodForm.value }).catch(() => ({ data: cashFlow.value })),
    ]);

    financialSummary.value = summaryRes.data;
    profitLoss.value = profitLossRes.data;
    balanceSheet.value = balanceRes.data;
    cashFlow.value = cashFlowRes.data;
    showPeriodModal.value = false;
  } catch (error: any) {
    console.error('Error loading financial data:', error);
  } finally {
    loading.value = false;
  }
};

const exportFinancialReport = async () => {
  try {
    await generateFinancialReportPDF({
      summary: financialSummary.value,
      profitLoss: profitLoss.value,
      balanceSheet: balanceSheet.value,
      cashFlow: cashFlow.value,
      startDate: periodForm.value.startDate,
      endDate: periodForm.value.endDate,
    });
    await showSuccess('Export berhasil! PDF telah didownload.');
  } catch (error: any) {
    console.error('Error exporting report:', error);
    await showError(error.message || 'Gagal mengekspor laporan');
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!needsTenantSelection.value) {
    loadFinancialData();
  }
});
</script>

