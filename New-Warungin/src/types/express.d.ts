/**
 * Type definitions for Express Request extensions
 */

import { Session } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      session?: Session;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

