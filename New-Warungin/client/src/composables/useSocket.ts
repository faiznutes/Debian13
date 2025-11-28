import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth';

let socket: Socket | null = null;

export function useSocket() {
  const authStore = useAuthStore();
  const connected = ref(false);
  const notifications = ref<any[]>([]);

  const connect = () => {
    if (socket?.connected) return;

    const token = authStore.token || localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    // Get base URL for Socket.IO (remove /api path if present)
    // Socket.IO needs the base server URL, not the API path
    let socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Remove /api from the end if present (Socket.IO interprets paths as namespaces)
    if (socketUrl.endsWith('/api')) {
      socketUrl = socketUrl.slice(0, -4);
    } else if (socketUrl.includes('/api/')) {
      // Handle cases like http://example.com/api/v1
      socketUrl = socketUrl.split('/api')[0];
    }
    
    // If no VITE_API_URL is set, try to detect from window location
    if (!import.meta.env.VITE_API_URL && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;
      
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        socketUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
      }
    }
    
    socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      connected.value = true;
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      connected.value = false;
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      connected.value = false;
    });

    socket.on('order:new', (data: any) => {
      notifications.value.unshift({
        type: 'order',
        message: `Pesanan baru: ${data.orderNumber || data.orderId}`,
        data,
        timestamp: new Date(),
      });
    });

    socket.on('order:update', (data: any) => {
      notifications.value.unshift({
        type: 'order',
        message: `Pesanan diperbarui: ${data.orderNumber || data.orderId}`,
        data,
        timestamp: new Date(),
      });
    });

    socket.on('notification', (data: any) => {
      notifications.value.unshift({
        type: 'general',
        message: data.message,
        data,
        timestamp: new Date(),
      });
    });
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      connected.value = false;
    }
  };

  const emit = (event: string, data: any) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  };

  // Auto-connect if authenticated
  if (authStore.isAuthenticated && !socket) {
    connect();
  }

  return {
    connected,
    notifications,
    connect,
    disconnect,
    emit,
    socket,
  };
}
