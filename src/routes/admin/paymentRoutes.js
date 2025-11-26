import express from 'express';
import { reconcilePayment } from '../../controllers/admin/paymentController.js';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requireAdminRole } from '../../middleware/adminRoles.js';

const router = express.Router();

// Only finance or superadmin can reconcile
router.post('/:id/reconcile', adminAuth, requireAdminRole(['superadmin','finance']), reconcilePayment);

export default router;
