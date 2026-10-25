import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createBooking);
router.get('/me', authenticate, getMyBookings);
router.get('/:id', authenticate, getBookingById);

export default router;
