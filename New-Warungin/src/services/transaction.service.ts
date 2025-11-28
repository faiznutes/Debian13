import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export interface CreateTransactionInput {
  orderId: string;
  amount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'BANK_TRANSFER' | 'SHOPEEPAY' | 'DANA' | 'CARD' | 'E_WALLET';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  reference?: string;
  qrCode?: string; // QR Code string untuk QRIS manual
  qrCodeImage?: string; // URL gambar QR Code (opsional)
  notes?: string;
  servedBy?: string; // Nama kasir/admin yang melayani
}

export class TransactionService {
  async createTransaction(
    data: CreateTransactionInput,
    userId: string,
    tenantId: string
  ) {
    // Use transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Verify order exists and belongs to tenant
      const order = await tx.order.findFirst({
        where: {
          id: data.orderId,
          tenantId,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if transaction already exists
      const existingTransaction = await tx.transaction.findUnique({
        where: { orderId: data.orderId },
      });

      if (existingTransaction) {
        throw new Error('Transaction already exists for this order');
      }

      // Get user name for servedBy if not provided
      let servedByName = data.servedBy;
      if (!servedByName) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        servedByName = user?.name || 'Unknown';
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          orderId: data.orderId,
          userId,
          amount: data.amount.toString(),
          paymentMethod: data.paymentMethod as any,
          status: (data.status || 'COMPLETED') as any,
          reference: data.reference,
          qrCode: data.qrCode,
          qrCodeImage: data.qrCodeImage,
          notes: data.notes,
          servedBy: servedByName,
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Update order status to COMPLETED if payment is completed
      if (data.status === 'COMPLETED') {
        await tx.order.update({
          where: { id: data.orderId },
          data: { status: 'COMPLETED' },
        });
      }

      return transaction;
    }, {
      timeout: 15000, // 15 seconds timeout
      isolationLevel: 'ReadCommitted',
    });
  }

  async getTransactions(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where: { tenantId } }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(id: string, tenantId: string) {
    return prisma.transaction.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export default new TransactionService();

