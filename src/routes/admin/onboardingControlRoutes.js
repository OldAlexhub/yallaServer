import express from 'express';
import { getControl, lock, toggleOverride, unlock, updateThreshold } from '../../controllers/admin/onboardingControlController.js';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requireAdminRole } from '../../middleware/adminRoles.js';

const router = express.Router();

router.get('/', adminAuth, getControl);
router.post('/update', adminAuth, requireAdminRole(['superadmin']), updateThreshold);
router.post('/override', adminAuth, requireAdminRole(['superadmin']), toggleOverride);
router.post('/lock', adminAuth, requireAdminRole(['superadmin']), lock);
router.post('/unlock', adminAuth, requireAdminRole(['superadmin']), unlock);

export default router;
