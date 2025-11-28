/**
 * Financial Management Enhancement Service
 * Handles cash flow, expense tracking, tax calculation, financial forecasting, bank reconciliation
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import financeService from './finance.service';

interface CashFlowEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  date: Date;
  paymentMethod: string;
  reference?: string; // Invoice, receipt, etc.
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: Date;
  vendor?: string;
  receipt?: string;
  isTaxDeductible: boolean;
}

interface TaxCalculation {
  period: string; // YYYY-MM
  totalRevenue: number;
  totalExpenses: number;
  taxableIncome: number;
  taxRate: number;
  taxAmount: number;
  deductions: number;
}

interface BankReconciliation {
  id: string;
  bankAccount: string;
  statementDate: Date;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  reconciled: boolean;
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    matched: boolean;
  }>;
}

class FinancialManagementEnhancementService {
  /**
   * Record cash flow entry
   */
  async recordCashFlow(
    tenantId: string,
    data: {
      type: 'INCOME' | 'EXPENSE';
      category: string;
      amount: number;
      description: string;
      date: Date;
      paymentMethod: string;
      reference?: string;
    }
  ): Promise<CashFlowEntry> {
    try {
      const entry: CashFlowEntry = {
        id: `cashflow-${Date.now()}`,
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
      };

      logger.info('Cash flow entry recorded:', entry);

      const saved = await prisma.cashFlow.create({
        data: {
          tenantId,
          type: data.type,
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: data.date,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
        },
      });

      return {
        ...entry,
        id: saved.id,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error recording cash flow:', error);
      throw error;
    }
  }

  /**
   * Get cash flow summary
   */
  async getCashFlowSummary(
    tenantId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    byCategory: Record<string, { income: number; expenses: number }>;
    byMonth: Array<{ month: string; income: number; expenses: number; net: number }>;
  }> {
    try {
      const where: any = { tenantId };
      if (dateRange) {
        where.date = {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        };
      }

      const entries = await prisma.cashFlow.findMany({ where });

      const totalIncome = entries
        .filter(e => e.type === 'INCOME')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenses = entries
        .filter(e => e.type === 'EXPENSE')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      // Group by category
      const byCategory: Record<string, { income: number; expenses: number }> = {};
      entries.forEach(e => {
        if (!byCategory[e.category]) {
          byCategory[e.category] = { income: 0, expenses: 0 };
        }
        if (e.type === 'INCOME') {
          byCategory[e.category].income += Number(e.amount);
        } else {
          byCategory[e.category].expenses += Number(e.amount);
        }
      });

      // Group by month
      const byMonthMap: Record<string, { income: number; expenses: number }> = {};
      entries.forEach(e => {
        const month = new Date(e.date).toISOString().slice(0, 7); // YYYY-MM
        if (!byMonthMap[month]) {
          byMonthMap[month] = { income: 0, expenses: 0 };
        }
        if (e.type === 'INCOME') {
          byMonthMap[month].income += Number(e.amount);
        } else {
          byMonthMap[month].expenses += Number(e.amount);
        }
      });

      const byMonth = Object.entries(byMonthMap).map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }));

      return {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        byCategory,
        byMonth,
      };
    } catch (error: any) {
      logger.error('Error getting cash flow summary:', error);
      throw error;
    }
  }

  /**
   * Record expense
   */
  async recordExpense(
    tenantId: string,
    data: {
      category: string;
      amount: number;
      description: string;
      date: Date;
      vendor?: string;
      receipt?: string;
      isTaxDeductible: boolean;
    }
  ): Promise<Expense> {
    try {
      const expense: Expense = {
        id: `expense-${Date.now()}`,
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date,
        vendor: data.vendor,
        receipt: data.receipt,
        isTaxDeductible: data.isTaxDeductible,
      };

      logger.info('Expense recorded:', expense);

      const saved = await prisma.expense.create({
        data: {
          tenantId,
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: data.date,
          vendor: data.vendor,
          receipt: data.receipt,
          isTaxDeductible: data.isTaxDeductible,
        },
      });

      return {
        ...expense,
        id: saved.id,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error recording expense:', error);
      throw error;
    }
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(
    tenantId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<Record<string, number>> {
    try {
      const where: any = { tenantId };
      if (dateRange) {
        where.date = {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        };
      }

      const expenses = await prisma.expense.findMany({ where });
      const byCategory: Record<string, number> = {};

      expenses.forEach(expense => {
        byCategory[expense.category] = (byCategory[expense.category] || 0) + Number(expense.amount);
      });

      return byCategory;
    } catch (error: any) {
      logger.error('Error getting expenses by category:', error);
      throw error;
    }
  }

  /**
   * Calculate tax
   */
  async calculateTax(
    tenantId: string,
    period: string // YYYY-MM
  ): Promise<TaxCalculation> {
    try {
      // Get financial data for the period
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Get revenue and expenses
      const financialSummary = await financeService.getFinancialSummary(tenantId, startDate.toISOString(), endDate.toISOString());
      
      const totalRevenue = parseFloat(financialSummary.totalRevenue.toString());
      const totalExpenses = parseFloat(financialSummary.totalExpenses.toString());
      const taxableIncome = totalRevenue - totalExpenses;

      // Tax calculation (simplified - adjust based on actual tax rules)
      // For Indonesia, typically progressive tax rates
      let taxRate = 0;
      if (taxableIncome <= 50000000) {
        taxRate = 0.05; // 5%
      } else if (taxableIncome <= 250000000) {
        taxRate = 0.15; // 15%
      } else if (taxableIncome <= 500000000) {
        taxRate = 0.25; // 25%
      } else {
        taxRate = 0.30; // 30%
      }

      const taxAmount = taxableIncome * taxRate;
      const deductions = totalExpenses; // All expenses are deductible

      const taxCalculation = {
        period,
        totalRevenue,
        totalExpenses,
        taxableIncome,
        taxRate,
        taxAmount,
        deductions,
      };

      // Save or update tax calculation
      await prisma.taxCalculation.upsert({
        where: {
          tenantId_period: {
            tenantId,
            period,
          },
        },
        create: {
          tenantId,
          period,
          totalRevenue,
          totalExpenses,
          taxableIncome,
          taxRate,
          taxAmount,
        },
        update: {
          totalRevenue,
          totalExpenses,
          taxableIncome,
          taxRate,
          taxAmount,
        },
      });

      return taxCalculation;
    } catch (error: any) {
      logger.error('Error calculating tax:', error);
      throw error;
    }
  }

  /**
   * Financial forecasting
   */
  async getFinancialForecast(
    tenantId: string,
    months: number = 6
  ): Promise<Array<{
    month: string;
    projectedRevenue: number;
    projectedExpenses: number;
    projectedProfit: number;
    confidence: number; // 0-1
  }>> {
    try {
      // Get historical data
      const now = new Date();
      const historicalData = [];
      
      for (let i = months; i > 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const summary = await financeService.getFinancialSummary(
          tenantId,
          date.toISOString(),
          new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
        );
        historicalData.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          revenue: parseFloat(summary.totalRevenue.toString()),
          expenses: parseFloat(summary.totalExpenses.toString()),
        });
      }

      // Simple linear regression for forecasting
      const forecast = [];
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Calculate average growth (simplified)
        const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
        const avgExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length;
        
        // Simple projection (can be enhanced with ML)
        const projectedRevenue = avgRevenue * (1 + 0.05 * i); // 5% growth assumption
        const projectedExpenses = avgExpenses * (1 + 0.03 * i); // 3% growth assumption
        
        forecast.push({
          month: monthStr,
          projectedRevenue,
          projectedExpenses,
          projectedProfit: projectedRevenue - projectedExpenses,
          confidence: Math.max(0, 1 - (i * 0.1)), // Decreasing confidence over time
        });
      }

      // Save forecasts to database
      for (const f of forecast) {
        await prisma.financialForecast.upsert({
          where: {
            tenantId_month: {
              tenantId,
              month: f.month,
            },
          },
          create: {
            tenantId,
            month: f.month,
            projectedRevenue: f.projectedRevenue,
            projectedExpenses: f.projectedExpenses,
            projectedProfit: f.projectedProfit,
            confidence: f.confidence,
            growthRate: 0.05, // 5% growth assumption
            trend: f.projectedProfit > 0 ? 'UP' : 'DOWN',
          },
          update: {
            projectedRevenue: f.projectedRevenue,
            projectedExpenses: f.projectedExpenses,
            projectedProfit: f.projectedProfit,
            confidence: f.confidence,
          },
        });
      }

      return forecast;
    } catch (error: any) {
      logger.error('Error getting financial forecast:', error);
      throw error;
    }
  }

  /**
   * Bank reconciliation
   */
  async reconcileBankStatement(
    tenantId: string,
    data: {
      bankAccount: string;
      statementDate: Date;
      statementBalance: number;
      transactions: Array<{
        date: Date;
        description: string;
        amount: number;
        type: 'DEPOSIT' | 'WITHDRAWAL';
      }>;
    }
  ): Promise<BankReconciliation> {
    try {
      // Calculate book balance from transactions up to statement date
      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId,
          createdAt: {
            lte: data.statementDate,
          },
          status: 'COMPLETED',
          paymentMethod: {
            in: ['BANK_TRANSFER', 'OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA'],
          },
        },
        select: {
          amount: true,
          paymentMethod: true,
          createdAt: true,
          reference: true,
        },
      });

      // Calculate book balance (sum of all completed transactions)
      const bookBalance = transactions.reduce((sum, t) => {
        return sum + parseFloat(t.amount.toString());
      }, 0);

      // Match bank statement transactions with actual transactions
      const matchedTransactions = data.transactions.map(stmtTxn => {
        // Try to match by amount and date (within 1 day tolerance)
        const matched = transactions.find(actualTxn => {
          const amountMatch = Math.abs(parseFloat(actualTxn.amount.toString()) - stmtTxn.amount) < 0.01;
          const dateMatch = Math.abs(
            actualTxn.createdAt.getTime() - stmtTxn.date.getTime()
          ) < 24 * 60 * 60 * 1000; // 1 day tolerance
          return amountMatch && dateMatch;
        });

        return {
          ...stmtTxn,
          matched: !!matched,
          matchedTransactionId: matched ? 'matched' : undefined,
        };
      });

      const reconciliation: BankReconciliation = {
        id: `reconciliation-${Date.now()}`,
        bankAccount: data.bankAccount,
        statementDate: data.statementDate,
        statementBalance: data.statementBalance,
        bookBalance,
        difference: data.statementBalance - bookBalance,
        reconciled: Math.abs(data.statementBalance - bookBalance) < 0.01, // Tolerate small differences
        transactions: matchedTransactions,
      };

      logger.info('Bank reconciliation created:', reconciliation);

      const saved = await prisma.bankReconciliation.create({
        data: {
          tenantId,
          bankAccount: data.bankAccount,
          statementDate: data.statementDate,
          statementBalance: data.statementBalance,
          bookBalance,
          difference: reconciliation.difference,
          reconciled: reconciliation.reconciled,
          transactions: matchedTransactions as any,
        },
      });

      return {
        ...reconciliation,
        id: saved.id,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error reconciling bank statement:', error);
      throw error;
    }
  }
}

export default new FinancialManagementEnhancementService();

