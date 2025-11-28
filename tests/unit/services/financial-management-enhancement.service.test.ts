/**
 * Financial Management Enhancement Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import financialManagementService from '../../../src/services/financial-management-enhancement.service';
import prisma from '../../../src/config/database';

// Mock Prisma
vi.mock('../../../src/config/database', () => ({
  default: {
    cashFlow: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    expense: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    taxCalculation: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    financialForecast: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    bankReconciliation: {
      create: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

describe('FinancialManagementEnhancementService', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordCashFlow', () => {
    it('should record a cash flow entry', async () => {
      const mockCashFlow = {
        id: 'cashflow-123',
        tenantId: mockTenantId,
        type: 'INCOME',
        category: 'SALES',
        amount: 1000000,
        description: 'Sales revenue',
        date: new Date(),
        paymentMethod: 'CASH',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.cashFlow.create as any).mockResolvedValue(mockCashFlow);

      const result = await financialManagementService.recordCashFlow(
        mockTenantId,
        {
          type: 'INCOME',
          category: 'SALES',
          amount: 1000000,
          description: 'Sales revenue',
          date: new Date(),
          paymentMethod: 'CASH',
        }
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('INCOME');
      expect(result.amount).toBe(1000000);
      expect(prisma.cashFlow.create).toHaveBeenCalled();
    });
  });

  describe('getCashFlowSummary', () => {
    it('should get cash flow summary by category and month', async () => {
      const mockCashFlows = [
        {
          type: 'INCOME',
          category: 'SALES',
          amount: 1000000,
          date: new Date('2024-11-01'),
        },
        {
          type: 'EXPENSE',
          category: 'OPERATIONAL',
          amount: 500000,
          date: new Date('2024-11-01'),
        },
      ];

      (prisma.cashFlow.findMany as any).mockResolvedValue(mockCashFlows);

      const result = await financialManagementService.getCashFlowSummary(
        mockTenantId,
        new Date('2024-11-01'),
        new Date('2024-11-30')
      );

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(prisma.cashFlow.findMany).toHaveBeenCalled();
    });
  });

  describe('recordExpense', () => {
    it('should record an expense', async () => {
      const mockExpense = {
        id: 'expense-123',
        tenantId: mockTenantId,
        category: 'OPERATIONAL',
        amount: 500000,
        description: 'Office supplies',
        date: new Date(),
        isTaxDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.expense.create as any).mockResolvedValue(mockExpense);

      const result = await financialManagementService.recordExpense(
        mockTenantId,
        {
          category: 'OPERATIONAL',
          amount: 500000,
          description: 'Office supplies',
          date: new Date(),
          isTaxDeductible: true,
        }
      );

      expect(result).toBeDefined();
      expect(result.category).toBe('OPERATIONAL');
      expect(result.isTaxDeductible).toBe(true);
      expect(prisma.expense.create).toHaveBeenCalled();
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax for a period', async () => {
      const mockTaxCalculation = {
        id: 'tax-123',
        tenantId: mockTenantId,
        period: '2024-11',
        totalRevenue: 10000000,
        totalExpenses: 3000000,
        taxableIncome: 7000000,
        taxRate: 0.05,
        taxAmount: 350000,
        deductions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.taxCalculation.upsert as any).mockResolvedValue(mockTaxCalculation);

      const result = await financialManagementService.calculateTax(
        mockTenantId,
        {
          period: '2024-11',
          totalRevenue: 10000000,
          totalExpenses: 3000000,
        }
      );

      expect(result).toBeDefined();
      expect(result.taxAmount).toBe(350000);
      expect(prisma.taxCalculation.upsert).toHaveBeenCalled();
    });
  });

  describe('reconcileBankStatement', () => {
    it('should reconcile bank statement with book balance', async () => {
      const mockTransactions = [
        {
          amount: '1000000',
          paymentMethod: 'BANK_TRANSFER',
          createdAt: new Date('2024-11-01'),
          reference: 'TXN-001',
        },
      ];

      (prisma.transaction.findMany as any).mockResolvedValue(mockTransactions);

      const mockReconciliation = {
        id: 'reconciliation-123',
        tenantId: mockTenantId,
        bankAccount: 'BCA-123',
        statementDate: new Date('2024-11-30'),
        statementBalance: 1000000,
        bookBalance: 1000000,
        difference: 0,
        reconciled: true,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.bankReconciliation.create as any).mockResolvedValue(mockReconciliation);

      const result = await financialManagementService.reconcileBankStatement(
        mockTenantId,
        {
          bankAccount: 'BCA-123',
          statementDate: new Date('2024-11-30'),
          statementBalance: 1000000,
          transactions: [
            {
              date: new Date('2024-11-01'),
              description: 'Payment',
              amount: 1000000,
              type: 'DEPOSIT',
            },
          ],
        }
      );

      expect(result).toBeDefined();
      expect(result.reconciled).toBe(true);
      expect(prisma.transaction.findMany).toHaveBeenCalled();
      expect(prisma.bankReconciliation.create).toHaveBeenCalled();
    });
  });
});

