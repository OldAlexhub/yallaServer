import express from 'express';
import { getCustomerDiscounts, updateCustomerDiscounts } from '../../controllers/admin/customerDiscountsController.js';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requireAdminRole } from '../../middleware/adminRoles.js';

const router = express.Router();

router.get('/', adminAuth, getCustomerDiscounts);
router.post('/', adminAuth, requireAdminRole(['superadmin']), updateCustomerDiscounts);

export default router;
