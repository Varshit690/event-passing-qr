import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticate, requireRole('ORGANIZER', 'ADMIN'), createEvent);
router.patch('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), deleteEvent);

export default router;
