import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return format(dateObj, 'dd MMMM yyyy', { locale: id });
  } catch (error) {
    return '-';
  }
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return format(dateObj, 'dd MMMM yyyy HH:mm', { locale: id });
  } catch (error) {
    return '-';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format remaining time for subscription/addon
 * If > 1 day: show in days
 * If <= 1 day: show in hours:minutes:seconds
 */
export const formatRemainingTime = (
  daysRemaining: number,
  hoursRemaining?: number,
  minutesRemaining?: number,
  secondsRemaining?: number
): string => {
  if (daysRemaining > 1) {
    return `${daysRemaining} hari`;
  } else if (daysRemaining === 1 || (hoursRemaining !== undefined && hoursRemaining > 0)) {
    // Show hours:minutes:seconds if <= 1 day
    const hours = hoursRemaining !== undefined ? hoursRemaining : 0;
    const minutes = minutesRemaining !== undefined ? minutesRemaining : 0;
    const seconds = secondsRemaining !== undefined ? secondsRemaining : 0;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${seconds} detik`;
    }
  } else if (minutesRemaining !== undefined && minutesRemaining > 0) {
    const minutes = minutesRemaining;
    const seconds = secondsRemaining !== undefined ? secondsRemaining : 0;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (secondsRemaining !== undefined && secondsRemaining > 0) {
    return `${secondsRemaining} detik`;
  } else {
    return '0 hari';
  }
};

