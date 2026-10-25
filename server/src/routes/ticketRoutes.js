import { Router } from 'express';
import { getMyTickets, getTicketById } from '../controllers/ticketController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, getMyTickets);
router.get('/:id', authenticate, getTicketById);

export default router;
