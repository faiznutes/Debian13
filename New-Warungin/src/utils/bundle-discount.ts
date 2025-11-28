/**
 * Bundle Discount Calculator
 * Menghitung diskon bundle untuk paket + addon
 * 
 * Logika:
 * - Paket BASIC (200rb) + Addon tertentu = dapat diskon 150rb
 * - Total lebih murah dari BOOST (275rb) tapi dapat fitur BOOST
 */

import { AVAILABLE_ADDONS } from '../services/addon.service';

const PLAN_PRICES: Record<string, number> = {
  BASIC: 200000,
  PRO: 350000,
  ENTERPRISE: 500000,
};

const BUNDLE_DISCOUNT_AMOUNT = 150000; // Diskon 150rb untuk bundle

/**
 * Check if addon qualifies for bundle discount
 * Addon yang qualify: Tambah Outlet, Tambah Pengguna, Tambah Produk
 */
export function qualifiesForBundleDiscount(addonId: string): boolean {
  const bundleEligibleAddons = ['add_outlets', 'add_users', 'add_products'];
  return bundleEligibleAddons.includes(addonId);
}

/**
 * Calculate bundle discount price
 * @param currentPlan - Current subscription plan (BASIC, PRO, ENTERPRISE)
 * @param addonId - Addon ID
 * @param addonPrice - Addon price
 * @returns Object with originalPrice, discount, finalPrice, and shouldUpgradeToBoost
 */
export function calculateBundleDiscount(
  currentPlan: string,
  addonId: string,
  addonPrice: number
): {
  originalPrice: number;
  discount: number;
  finalPrice: number;
  shouldUpgradeToBoost: boolean;
} {
  // Only apply bundle discount if:
  // 1. Current plan is BASIC
  // 2. Addon qualifies for bundle discount
  if (currentPlan !== 'BASIC' || !qualifiesForBundleDiscount(addonId)) {
    return {
      originalPrice: addonPrice,
      discount: 0,
      finalPrice: addonPrice,
      shouldUpgradeToBoost: false,
    };
  }

  // Calculate bundle price
  // Logika: Paket BASIC (200rb) + Addon = dapat diskon 150rb
  // Total lebih murah dari BOOST (350rb) tapi dapat fitur BOOST
  const planPrice = PLAN_PRICES.BASIC; // 200rb
  const originalPrice = planPrice + addonPrice; // Total normal
  const discount = BUNDLE_DISCOUNT_AMOUNT; // 150rb
  const finalPrice = Math.max(0, originalPrice - discount); // Total setelah diskon

  // Selalu upgrade ke BOOST jika bundle discount diterapkan
  // Karena total lebih murah dari BOOST (350rb) tapi dapat fitur BOOST
  const shouldUpgradeToBoost = true;

  return {
    originalPrice,
    discount,
    finalPrice,
    shouldUpgradeToBoost,
  };
}

/**
 * Get bundle discount info for display
 */
export function getBundleDiscountInfo(
  currentPlan: string,
  addonId: string
): {
  eligible: boolean;
  discountAmount: number;
  message: string;
} {
  if (currentPlan !== 'BASIC' || !qualifiesForBundleDiscount(addonId)) {
    return {
      eligible: false,
      discountAmount: 0,
      message: '',
    };
  }

  const addonInfo = AVAILABLE_ADDONS.find(a => a.id === addonId);
  const addonPrice = addonInfo?.price || 0;
  const bundleInfo = calculateBundleDiscount(currentPlan, addonId, addonPrice);

  return {
    eligible: true,
    discountAmount: bundleInfo.discount,
    message: `Dapat diskon bundle Rp ${(bundleInfo.discount / 1000).toFixed(0)}rb! Total hanya Rp ${(bundleInfo.finalPrice / 1000).toFixed(0)}rb (lebih murah dari BOOST) dan otomatis upgrade ke paket BOOST.`,
  };
}

