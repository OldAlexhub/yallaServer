import express from "express";
import {
    approveShift,
    getShift,
    listPendingShifts,
    requestShiftCheckout,
    startShift
} from "../../controllers/admin/shiftController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.post('/start', adminAuth, startShift);
router.get('/:id', adminAuth, getShift);
router.post('/:id/checkout', adminAuth, requestShiftCheckout); // admin requests checkout with reported cash
router.post('/:id/approve', adminAuth, requireAdminRole(['superadmin','finance']), approveShift); // supervisor approves
// list pending shifts for supervisors
router.get('/pending/list', adminAuth, requireAdminRole(['superadmin','finance']), listPendingShifts);

export default router;
