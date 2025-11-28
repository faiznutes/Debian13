/**
 * Prometheus Metrics
 * Application metrics for monitoring
 */

let client: any;
let register: any;

// Try to load prom-client, fallback to mock if not available
try {
  client = require('prom-client');
  // Create a Registry to register the metrics
  register = new client.Registry();
  
  // Add default metrics (CPU, memory, etc.)
  client.collectDefaultMetrics({
    register,
    prefix: 'warungin_',
  });
} catch (error) {
  // prom-client not installed, create mock registry
  console.warn('prom-client not installed, metrics will be disabled');
  register = {
    contentType: 'text/plain',
    metrics: async () => '# prom-client not installed\n',
  };
  
  // Create mock metrics objects
  const createMockMetric = () => ({
    observe: () => {},
    inc: () => {},
    set: () => {},
  });
  
  client = {
    Histogram: () => createMockMetric(),
    Counter: () => createMockMetric(),
    Gauge: () => createMockMetric(),
  };
}

// HTTP Request Duration Histogram
const httpRequestDuration = new client.Histogram({
  name: 'warungin_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: client ? [register] : [],
});

// HTTP Request Total Counter
const httpRequestTotal = new client.Counter({
  name: 'warungin_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: client ? [register] : [],
});

// Database Query Duration Histogram
const dbQueryDuration = new client.Histogram({
  name: 'warungin_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: client ? [register] : [],
});

// Database Query Total Counter
const dbQueryTotal = new client.Counter({
  name: 'warungin_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: client ? [register] : [],
});

// Redis Operation Duration Histogram
const redisOperationDuration = new client.Histogram({
  name: 'warungin_redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: client ? [register] : [],
});

// Redis Operation Total Counter
const redisOperationTotal = new client.Counter({
  name: 'warungin_redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
  registers: client ? [register] : [],
});

// Active Users Gauge
const activeUsers = new client.Gauge({
  name: 'warungin_active_users',
  help: 'Number of active users',
  labelNames: ['tenant_id'],
  registers: client ? [register] : [],
});

// Order Count Gauge
const orderCount = new client.Gauge({
  name: 'warungin_orders_total',
  help: 'Total number of orders',
  labelNames: ['tenant_id', 'status'],
  registers: client ? [register] : [],
});

// Transaction Amount Gauge
const transactionAmount = new client.Gauge({
  name: 'warungin_transaction_amount',
  help: 'Transaction amount',
  labelNames: ['tenant_id', 'payment_method', 'status'],
  registers: client ? [register] : [],
});

// Error Counter
const errorTotal = new client.Counter({
  name: 'warungin_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route'],
  registers: client ? [register] : [],
});

export {
  register,
  httpRequestDuration,
  httpRequestTotal,
  dbQueryDuration,
  dbQueryTotal,
  redisOperationDuration,
  redisOperationTotal,
  activeUsers,
  orderCount,
  transactionAmount,
  errorTotal,
};
