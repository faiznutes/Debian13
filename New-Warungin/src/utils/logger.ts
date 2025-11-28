import winston from 'winston';
import env from '../config/env';

// Create logs directory if it doesn't exist (for file transport)
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'warungin' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Console transport with enhanced formatting
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${level}]: ${message}`;
          
          // Add stack trace if available
          if (stack) {
            log += `\n${stack}`;
          }
          
          // Add metadata if available (exclude service name)
          const filteredMeta = { ...meta };
          delete filteredMeta.service;
          
          if (Object.keys(filteredMeta).length > 0) {
            // Format metadata nicely
            try {
              const metaStr = JSON.stringify(filteredMeta, null, 2);
              // Only show first 500 chars of metadata to avoid cluttering console
              if (metaStr.length > 500) {
                log += `\n${metaStr.substring(0, 500)}... (truncated)`;
              } else {
                log += `\n${metaStr}`;
              }
            } catch (e) {
              log += `\n[Metadata could not be stringified]`;
            }
          }
          
          return log;
        })
      ),
    })
  );
} else {
  // Production console transport - simpler format
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Helper function to add request context to logs
export function logWithContext(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context: Record<string, any> = {}
) {
  logger[level](message, context);
}

export default logger;
