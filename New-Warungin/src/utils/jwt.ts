import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET;
  return jwt.sign(payload, refreshSecret, {
    expiresIn: '30d',
  });
};

