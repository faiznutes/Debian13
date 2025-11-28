<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Financial Management</h2>
        <p class="text-gray-600">Cash flow, expenses, tax, forecasting, dan bank reconciliation</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="showCashFlowModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Record Cash Flow</span>
        </button>
        <button
          @click="showExpenseModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Record Expense</span>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex space-x-8">
        <button
          @click="activeTab = 'cashflow'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'cashflow' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Cash Flow
        </button>
        <button
          @click="activeTab = 'expenses'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'expenses' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Expenses
        </button>
        <button
          @click="activeTab = 'tax'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'tax' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Tax
        </button>
        <button
          @click="activeTab = 'forecast'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'forecast' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Forecast
        </button>
        <button
          @click="activeTab = 'reconciliation'"
          class="py-4 px-1 border-b-2 font-medium text-sm"
          :class="activeTab === 'reconciliation' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Bank Reconciliation
        </button>
      </nav>
    </div>

    <!-- Cash Flow Tab -->
    <div v-if="activeTab === 'cashflow'" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <p class="text-sm text-gray-600 mb-1">Total Income</p>
          <p class="text-3xl font-bold text-gray-900">Rp {{ formatCurrency(cashFlowSummary.totalIncome) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <p class="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p class="text-3xl font-bold text-gray-900">Rp {{ formatCurrency(cashFlowSummary.totalExpenses) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <p class="text-sm text-gray-600 mb-1">Net Cash Flow</p>
          <p class="text-3xl font-bold" :class="cashFlowSummary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'">
            Rp {{ formatCurrency(cashFlowSummary.netCashFlow) }}
          </p>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div class="bg-white rounded-lg shadow-lg p-4">
        <div class="flex items-center space-x-4">
          <input
            v-model="dateRange.startDate"
            type="date"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <span class="text-gray-500">to</span>
          <input
            v-model="dateRange.endDate"
            type="date"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            @click="loadCashFlowSummary"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Filter
          </button>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">By Category</h3>
        <div class="space-y-2">
          <div
            v-for="(amount, category) in cashFlowSummary.byCategory"
            :key="category"
            class="flex items-center justify-between p-3 bg-gray-50 rounded"
          >
            <span class="font-medium text-gray-900">{{ category }}</span>
            <span class="text-gray-600">Rp {{ formatCurrency(amount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses Tab -->
    <div v-if="activeTab === 'expenses'" class="space-y-6">
      <!-- Expenses by Category -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
        <div class="space-y-2">
          <div
            v-for="(amount, category) in expensesByCategory"
            :key="category"
            class="flex items-center justify-between p-3 bg-gray-50 rounded"
          >
            <span class="font-medium text-gray-900">{{ category }}</span>
            <span class="text-gray-600">Rp {{ formatCurrency(amount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tax Tab -->
    <div v-if="activeTab === 'tax'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Calculate Tax</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Period (YYYY-MM)</label>
            <input
              v-model="taxPeriod"
              type="month"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="calculateTax"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Calculate
            </button>
          </div>
        </div>

        <div v-if="taxCalculation" class="border-t pt-4 space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Total Revenue</p>
              <p class="text-lg font-semibold text-gray-900">Rp {{ formatCurrency(taxCalculation.totalRevenue) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Total Expenses</p>
              <p class="text-lg font-semibold text-gray-900">Rp {{ formatCurrency(taxCalculation.totalExpenses) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Taxable Income</p>
              <p class="text-lg font-semibold text-gray-900">Rp {{ formatCurrency(taxCalculation.taxableIncome) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Tax Rate</p>
              <p class="text-lg font-semibold text-gray-900">{{ (taxCalculation.taxRate * 100).toFixed(1) }}%</p>
            </div>
            <div class="col-span-2">
              <p class="text-sm text-gray-600">Tax Amount</p>
              <p class="text-2xl font-bold text-red-600">Rp {{ formatCurrency(taxCalculation.taxAmount) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Forecast Tab -->
    <div v-if="activeTab === 'forecast'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Financial Forecast</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Months to Forecast</label>
          <input
            v-model.number="forecastMonths"
            type="number"
            min="1"
            max="12"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <button
          @click="loadForecast"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-6"
        >
          Generate Forecast
        </button>

        <div v-if="forecast.length > 0" class="space-y-4">
          <div
            v-for="item in forecast"
            :key="item.month"
            class="border-l-4 border-blue-500 bg-gray-50 p-4 rounded"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900">{{ item.month }}</h4>
              <span class="text-xs text-gray-500">Confidence: {{ (item.confidence * 100).toFixed(0) }}%</span>
            </div>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p class="text-gray-600">Revenue</p>
                <p class="font-semibold text-green-600">Rp {{ formatCurrency(item.projectedRevenue) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Expenses</p>
                <p class="font-semibold text-red-600">Rp {{ formatCurrency(item.projectedExpenses) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Profit</p>
                <p class="font-semibold" :class="item.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'">
                  Rp {{ formatCurrency(item.projectedProfit) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bank Reconciliation Tab -->
    <div v-if="activeTab === 'reconciliation'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Bank Reconciliation</h3>
        <button
          @click="showReconciliationModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-6"
        >
          New Reconciliation
        </button>

        <div v-if="reconciliations.length > 0" class="space-y-4">
          <div
            v-for="recon in reconciliations"
            :key="recon.id"
            class="border-l-4 rounded p-4"
            :class="recon.reconciled ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900">{{ recon.bankAccount }}</h4>
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="recon.reconciled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
              >
                {{ recon.reconciled ? 'Reconciled' : 'Pending' }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-600">Statement Balance</p>
                <p class="font-semibold">Rp {{ formatCurrency(recon.statementBalance) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Book Balance</p>
                <p class="font-semibold">Rp {{ formatCurrency(recon.bookBalance) }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-gray-600">Difference</p>
                <p class="font-semibold" :class="Math.abs(recon.difference) < 0.01 ? 'text-green-600' : 'text-red-600'">
                  Rp {{ formatCurrency(recon.difference) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cash Flow Modal -->
    <div
      v-if="showCashFlowModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeCashFlowModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Record Cash Flow</h3>
            <button @click="closeCashFlowModal" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveCashFlow" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                v-model="cashFlowForm.type"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Pilih Type</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                v-model="cashFlowForm.category"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                v-model.number="cashFlowForm.amount"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                v-model="cashFlowForm.description"
                rows="3"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  v-model="cashFlowForm.date"
                  type="date"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <input
                  v-model="cashFlowForm.paymentMethod"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeCashFlowModal"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Expense Modal -->
    <div
      v-if="showExpenseModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeExpenseModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Record Expense</h3>
            <button @click="closeExpenseModal" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveExpense" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                v-model="expenseForm.category"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                v-model.number="expenseForm.amount"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                v-model="expenseForm.description"
                rows="3"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  v-model="expenseForm.date"
                  type="date"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  v-model="expenseForm.vendor"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div class="flex items-center">
              <input
                v-model="expenseForm.isTaxDeductible"
                type="checkbox"
                id="taxDeductible"
                class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label for="taxDeductible" class="ml-2 text-sm text-gray-700">Tax Deductible</label>
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeExpenseModal"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Reconciliation Modal -->
    <div
      v-if="showReconciliationModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeReconciliationModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Bank Reconciliation</h3>
            <button @click="closeReconciliationModal" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveReconciliation" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                <input
                  v-model="reconciliationForm.bankAccount"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Statement Date *</label>
                <input
                  v-model="reconciliationForm.statementDate"
                  type="date"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Statement Balance *</label>
              <input
                v-model.number="reconciliationForm.statementBalance"
                type="number"
                step="0.01"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Transactions</label>
              <div class="space-y-2">
                <div
                  v-for="(tx, index) in reconciliationForm.transactions"
                  :key="index"
                  class="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded"
                >
                  <div class="col-span-3">
                    <input
                      v-model="tx.date"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div class="col-span-4">
                    <input
                      v-model="tx.description"
                      type="text"
                      placeholder="Description"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div class="col-span-2">
                    <input
                      v-model.number="tx.amount"
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div class="col-span-2">
                    <select
                      v-model="tx.type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="DEPOSIT">Deposit</option>
                      <option value="WITHDRAWAL">Withdrawal</option>
                    </select>
                  </div>
                  <div class="col-span-1">
                    <button
                      type="button"
                      @click="removeTransaction(index)"
                      class="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  @click="addTransaction"
                  class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                >
                  + Add Transaction
                </button>
              </div>
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeReconciliationModal"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError } = useNotification();

const activeTab = ref('cashflow');
const cashFlowSummary = ref({
  totalIncome: 0,
  totalExpenses: 0,
  netCashFlow: 0,
  byCategory: {} as Record<string, number>,
  byMonth: [] as any[],
});
const expensesByCategory = ref<Record<string, number>>({});
const taxCalculation = ref<any>(null);
const forecast = ref<any[]>([]);
const reconciliations = ref<any[]>([]);
const dateRange = ref({
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
});
const taxPeriod = ref(new Date().toISOString().slice(0, 7));
const forecastMonths = ref(6);
const showCashFlowModal = ref(false);
const showExpenseModal = ref(false);
const showReconciliationModal = ref(false);
const saving = ref(false);

const cashFlowForm = ref({
  type: 'INCOME',
  category: '',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: '',
  reference: '',
});

const expenseForm = ref({
  category: '',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  receipt: '',
  isTaxDeductible: false,
});

const reconciliationForm = ref({
  bankAccount: '',
  statementDate: new Date().toISOString().split('T')[0],
  statementBalance: 0,
  transactions: [{
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'DEPOSIT',
  }],
});

const loadCashFlowSummary = async () => {
  try {
    const params: any = {};
    if (dateRange.value.startDate) params.startDate = dateRange.value.startDate;
    if (dateRange.value.endDate) params.endDate = dateRange.value.endDate;
    const response = await api.get('/financial-management/cash-flow/summary', { params });
    cashFlowSummary.value = response.data;
  } catch (error: any) {
    console.error('Error loading cash flow summary:', error);
    await showError('Gagal memuat cash flow summary');
  }
};

const loadExpensesByCategory = async () => {
  try {
    const params: any = {};
    if (dateRange.value.startDate) params.startDate = dateRange.value.startDate;
    if (dateRange.value.endDate) params.endDate = dateRange.value.endDate;
    const response = await api.get('/financial-management/expenses/by-category', { params });
    expensesByCategory.value = response.data;
  } catch (error: any) {
    console.error('Error loading expenses:', error);
  }
};

const calculateTax = async () => {
  try {
    const response = await api.post('/financial-management/tax/calculate', {
      period: taxPeriod.value,
    });
    taxCalculation.value = response.data;
    await showSuccess('Tax calculation berhasil');
  } catch (error: any) {
    console.error('Error calculating tax:', error);
    await showError('Gagal menghitung tax');
  }
};

const loadForecast = async () => {
  try {
    const response = await api.get('/financial-management/forecast', {
      params: { months: forecastMonths.value },
    });
    forecast.value = response.data;
  } catch (error: any) {
    console.error('Error loading forecast:', error);
    await showError('Gagal memuat forecast');
  }
};

const saveCashFlow = async () => {
  saving.value = true;
  try {
    await api.post('/financial-management/cash-flow', {
      ...cashFlowForm.value,
      date: new Date(cashFlowForm.value.date).toISOString(),
    });
    await showSuccess('Cash flow berhasil direcord');
    closeCashFlowModal();
    await loadCashFlowSummary();
  } catch (error: any) {
    console.error('Error saving cash flow:', error);
    await showError('Gagal menyimpan cash flow');
  } finally {
    saving.value = false;
  }
};

const saveExpense = async () => {
  saving.value = true;
  try {
    await api.post('/financial-management/expenses', {
      ...expenseForm.value,
      date: new Date(expenseForm.value.date).toISOString(),
    });
    await showSuccess('Expense berhasil direcord');
    closeExpenseModal();
    await loadExpensesByCategory();
  } catch (error: any) {
    console.error('Error saving expense:', error);
    await showError('Gagal menyimpan expense');
  } finally {
    saving.value = false;
  }
};

const saveReconciliation = async () => {
  saving.value = true;
  try {
    const data = {
      ...reconciliationForm.value,
      statementDate: new Date(reconciliationForm.value.statementDate).toISOString(),
      transactions: reconciliationForm.value.transactions.map(tx => ({
        ...tx,
        date: new Date(tx.date).toISOString(),
      })),
    };
    const response = await api.post('/financial-management/bank-reconciliation', data);
    reconciliations.value.push(response.data);
    await showSuccess('Bank reconciliation berhasil dibuat');
    closeReconciliationModal();
  } catch (error: any) {
    console.error('Error saving reconciliation:', error);
    await showError('Gagal menyimpan reconciliation');
  } finally {
    saving.value = false;
  }
};

const addTransaction = () => {
  reconciliationForm.value.transactions.push({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'DEPOSIT',
  });
};

const removeTransaction = (index: number) => {
  reconciliationForm.value.transactions.splice(index, 1);
};

const closeCashFlowModal = () => {
  showCashFlowModal.value = false;
  cashFlowForm.value = {
    type: 'INCOME',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    reference: '',
  };
};

const closeExpenseModal = () => {
  showExpenseModal.value = false;
  expenseForm.value = {
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    receipt: '',
    isTaxDeductible: false,
  };
};

const closeReconciliationModal = () => {
  showReconciliationModal.value = false;
  reconciliationForm.value = {
    bankAccount: '',
    statementDate: new Date().toISOString().split('T')[0],
    statementBalance: 0,
    transactions: [{
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'DEPOSIT',
    }],
  };
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

onMounted(() => {
  loadCashFlowSummary();
  loadExpensesByCategory();
});
</script>

