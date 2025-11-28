import prisma from '../config/database';

export interface DiscountResult {
  discountAmount: number;
  discountDetails: Array<{
    discountId: string;
    discountName: string;
    discountAmount: number;
    appliedTo: string[]; // Product IDs yang mendapat diskon
  }>;
}

export class DiscountService {
  /**
   * Apply automatic discounts based on order items
   */
  async applyDiscounts(
    tenantId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    subtotal: number
  ): Promise<DiscountResult> {
    const discounts = await prisma.discount.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        ],
      },
    });

    let totalDiscount = 0;
    const discountDetails: DiscountResult['discountDetails'] = [];

    for (const discount of discounts) {
      let discountAmount = 0;
      const appliedTo: string[] = [];

      if (discount.discountType === 'AMOUNT_BASED') {
        // Diskon berdasarkan total pembelian (contoh: beli 1 50rb disc 20%)
        const minAmount = discount.minAmount ? Number(discount.minAmount) : 0;
        const minQuantity = discount.minQuantity || 1;

        // Check if order meets minimum requirements
        if (subtotal >= minAmount && items.length >= minQuantity) {
          const applicableProductIds = discount.applicableProducts 
            ? (discount.applicableProducts as string[])
            : items.map(item => item.productId);

          // Calculate discount for applicable products
          for (const item of items) {
            if (applicableProductIds.includes(item.productId)) {
              const itemSubtotal = item.price * item.quantity;
              
              if (discount.discountValueType === 'PERCENTAGE') {
                discountAmount += (itemSubtotal * Number(discount.discountValue)) / 100;
              } else {
                discountAmount += Number(discount.discountValue);
              }
              
              appliedTo.push(item.productId);
            }
          }
        }
      } else if (discount.discountType === 'BUNDLE') {
        // Diskon bundle (contoh: beli produk A + B, diskon 20% hanya untuk produk A)
        const bundleProductIds = discount.bundleProducts 
          ? (discount.bundleProducts as string[])
          : [];
        const discountProductId = discount.bundleDiscountProduct;

        // Check if all bundle products are in the order
        const orderProductIds = items.map(item => item.productId);
        const hasAllBundleProducts = bundleProductIds.every(id => orderProductIds.includes(id));

        if (hasAllBundleProducts && discountProductId) {
          // Find the product that gets the discount
          const discountItem = items.find(item => item.productId === discountProductId);
          
          if (discountItem) {
            const itemSubtotal = discountItem.price * discountItem.quantity;
            
            if (discount.discountValueType === 'PERCENTAGE') {
              discountAmount = (itemSubtotal * Number(discount.discountValue)) / 100;
            } else {
              discountAmount = Number(discount.discountValue);
            }
            
            appliedTo.push(discountProductId);
          }
        }
      } else if (discount.discountType === 'PRODUCT_BASED') {
        // Diskon berdasarkan produk tertentu
        const applicableProductIds = discount.applicableProducts 
          ? (discount.applicableProducts as string[])
          : [];

        for (const item of items) {
          if (applicableProductIds.includes(item.productId)) {
            const itemSubtotal = item.price * item.quantity;
            
            if (discount.discountValueType === 'PERCENTAGE') {
              discountAmount += (itemSubtotal * Number(discount.discountValue)) / 100;
            } else {
              discountAmount += Number(discount.discountValue) * item.quantity;
            }
            
            appliedTo.push(item.productId);
          }
        }
      }

      if (discountAmount > 0) {
        totalDiscount += discountAmount;
        discountDetails.push({
          discountId: discount.id,
          discountName: discount.name,
          discountAmount,
          appliedTo,
        });
      }
    }

    return {
      discountAmount: totalDiscount,
      discountDetails,
    };
  }

  /**
   * Get all discounts for tenant (active and inactive)
   */
  async getDiscounts(tenantId: string, isActive?: boolean) {
    const where: any = {
      tenantId,
    };
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return prisma.discount.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default new DiscountService();

