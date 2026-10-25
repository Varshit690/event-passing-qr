import { Router } from 'express';
import { verifyTicket, redeemTicket } from '../controllers/checkInController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Scanning and check-in require staff/organizer/admin credentials
router.post('/verify', authenticate, requireRole('ORGANIZER', 'ADMIN'), verifyTicket);
router.post('/redeem', authenticate, requireRole('ORGANIZER', 'ADMIN'), redeemTicket);

export default router;
