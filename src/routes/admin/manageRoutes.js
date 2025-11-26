import express from 'express';
import { createAdmin, deleteAdmin, getAdmin, listAdmins, resetPassword, updateAdmin } from '../../controllers/admin/manageController.js';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requireAdminRole } from '../../middleware/adminRoles.js';

const router = express.Router();

// Only superadmin can create/update admins
router.post('/', adminAuth, requireAdminRole(['superadmin']), createAdmin);
router.get('/', adminAuth, requireAdminRole(['superadmin']), listAdmins);
router.get('/:id', adminAuth, requireAdminRole(['superadmin']), getAdmin);
router.put('/:id', adminAuth, requireAdminRole(['superadmin']), updateAdmin);
router.delete('/:id', adminAuth, requireAdminRole(['superadmin']), deleteAdmin);
router.post('/:id/reset-password', adminAuth, requireAdminRole(['superadmin']), resetPassword);

export default router;