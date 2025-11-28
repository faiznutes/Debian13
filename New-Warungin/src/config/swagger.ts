import swaggerJsdoc from 'swagger-jsdoc';
import env from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Warungin API',
      version: '1.1.0',
      description: 'Multi-Tenant System API Documentation',
      contact: {
        name: 'Warungin',
      },
    },
    servers: [
      {
        url: env.BACKEND_URL,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login endpoint',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
            },
            total: {
              type: 'integer',
              description: 'Total items',
            },
            totalPages: {
              type: 'integer',
              description: 'Total pages',
            },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
            discountValue: { type: 'number' },
            isActive: { type: 'boolean' },
            tenantId: { type: 'string' },
            customerId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Outlet: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            isActive: { type: 'boolean' },
            tenantId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string' },
            amount: { type: 'number' },
            paymentMethod: { type: 'string', enum: ['CASH', 'QRIS', 'BANK_TRANSFER', 'SHOPEEPAY', 'DANA', 'CARD', 'E_WALLET'] },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
            reference: { type: 'string' },
            qrCode: { type: 'string' },
            qrCodeImage: { type: 'string' },
            notes: { type: 'string' },
            servedBy: { type: 'string' },
            userId: { type: 'string' },
            tenantId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'KITCHEN'] },
            isActive: { type: 'boolean' },
            permissions: { type: 'object' },
            tenantId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Unauthorized - Please provide valid JWT token',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Validation failed',
                issues: [
                  {
                    path: ['field'],
                    message: 'Field is required',
                  },
                ],
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

