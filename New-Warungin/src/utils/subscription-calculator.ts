/**
 * Calculate upgrade cost with prorata calculation
 */
export function calculateUpgradeCost({
  currentPlanPrice,
  newPlanPrice,
  endDate,
  upgradeMonths = 1,
}: {
  currentPlanPrice: number;
  newPlanPrice: number;
  endDate: Date;
  upgradeMonths?: number;
}) {
  const now = new Date();
  const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingValue = (currentPlanPrice / 30) * remainingDays;
  const newPlanTotal = newPlanPrice * upgradeMonths;
  const upgradeCost = Math.max(0, newPlanTotal - remainingValue);

  return { remainingDays, remainingValue, upgradeCost };
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get discount percentage based on duration
 */
export function getDiscountForDuration(durationDays: number): number {
  if (durationDays >= 365) {
    return 0.15; // 15% for 12 months
  } else if (durationDays >= 180) {
    return 0.10; // 10% for 6 months
  } else if (durationDays >= 90) {
    return 0.05; // 5% for 3 months
  }
  return 0;
}

