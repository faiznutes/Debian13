/**
 * Password Validation
 * Enhanced password policy with strength requirements
 */

import { z } from 'zod';

export interface PasswordStrength {
  score: number; // 0-4 (0=weak, 4=very strong)
  feedback: string[];
  meetsRequirements: boolean;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password harus minimal 8 karakter');
  } else {
    score++;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password harus mengandung huruf besar');
  } else {
    score++;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Password harus mengandung huruf kecil');
  } else {
    score++;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    feedback.push('Password harus mengandung angka');
  } else {
    score++;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password harus mengandung karakter khusus');
  } else {
    score++;
  }

  // Common password check (basic)
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    feedback.push('Password terlalu umum, gunakan password yang lebih unik');
    score = Math.max(0, score - 1);
  }

  return {
    score: Math.min(4, score),
    feedback,
    meetsRequirements: score >= 4 && password.length >= 8,
  };
}

/**
 * Password schema with strength validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password harus minimal 8 karakter')
  .refine(
    (password) => {
      const strength = checkPasswordStrength(password);
      return strength.meetsRequirements;
    },
    {
      message: 'Password tidak memenuhi persyaratan keamanan',
    }
  );

/**
 * Create user password schema
 */
export const createPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi password tidak sama',
  path: ['confirmPassword'],
});

/**
 * Update password schema (with old password)
 */
export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi password tidak sama',
  path: ['confirmPassword'],
}) as unknown as z.ZodObject<any>;

