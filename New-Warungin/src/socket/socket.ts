import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import env from '../config/env';

let io: Server | null = null;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });

    // Join tenant room
    socket.on('join-tenant', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      console.log(`Client ${socket.id} joined tenant: ${tenantId}`);
    });

    // Leave tenant room
    socket.on('leave-tenant', (tenantId: string) => {
      socket.leave(`tenant:${tenantId}`);
      console.log(`Client ${socket.id} left tenant: ${tenantId}`);
    });
  });

  return io;
};

export const getSocket = (): Server | null => {
  return io;
};

// Emit to tenant room
export const emitToTenant = (tenantId: string, event: string, data: any): void => {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
};

