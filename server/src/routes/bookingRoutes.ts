import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createBooking);
router.get('/me', authenticate, getMyBookings);
router.get('/:id', authenticate, getBookingById);

export default router;
