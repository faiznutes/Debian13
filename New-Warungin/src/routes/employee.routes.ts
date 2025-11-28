import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import employeeService from '../services/employee.service';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import { auditLogger } from '../middlewares/audit-logger';

const router = Router();

const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
});

const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Get all employees
router.get(
  '/',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      
      const result = await employeeService.getEmployees(tenantId, page, limit, search, isActive);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get employee statistics
router.get(
  '/stats',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const stats = await employeeService.getEmployeeStats(tenantId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get employee by ID
router.get(
  '/:id',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const employee = await employeeService.getEmployeeById(req.params.id, tenantId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create employee
router.post(
  '/',
  authGuard,
  validate({ body: createEmployeeSchema }),
  auditLogger('CREATE', 'employees'),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const employee = await employeeService.createEmployee(req.body, tenantId);
      res.status(201).json(employee);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

// Update employee
router.put(
  '/:id',
  authGuard,
  validate({ body: updateEmployeeSchema }),
  auditLogger('UPDATE', 'employees'),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const employee = await employeeService.updateEmployee(req.params.id, req.body, tenantId);
      res.json(employee);
    } catch (error: any) {
      if (error.message === 'Employee not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete employee
router.delete(
  '/:id',
  authGuard,
  auditLogger('DELETE', 'employees'),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      await employeeService.deleteEmployee(req.params.id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Employee not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

