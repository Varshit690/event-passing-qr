import { Router } from 'express';
import { getMyTickets, getTicketById } from '../controllers/ticketController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, getMyTickets);
router.get('/:id', authenticate, getTicketById);

export default router;
