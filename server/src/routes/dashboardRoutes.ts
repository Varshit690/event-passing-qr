import { Router } from 'express';
import {
  getOrganizerAnalytics,
  getAdminAnalytics,
  updateUserRole,
  getAllUsers,
} from '../controllers/dashboardController';
import {
  applyForOrganizer,
  getMyApplicationStatus,
  listOrganizerApplications,
  approveApplication,
  rejectApplication,
} from '../controllers/organizerApplicationController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Organizer Analytics
router.get('/organizer/analytics', authenticate, requireRole('ORGANIZER', 'ADMIN'), getOrganizerAnalytics);

// Organizer Applications (Attendee)
router.post('/organizer/apply', authenticate, applyForOrganizer);
router.get('/organizer/application/status', authenticate, getMyApplicationStatus);

// Platform Administration
router.get('/admin/analytics', authenticate, requireRole('ADMIN'), getAdminAnalytics);
router.get('/admin/users', authenticate, requireRole('ADMIN'), getAllUsers);
router.patch('/admin/users/:id/role', authenticate, requireRole('ADMIN'), updateUserRole);

// Organizer Approvals (Admin)
router.get('/admin/organizer-applications', authenticate, requireRole('ADMIN'), listOrganizerApplications);
router.post('/admin/organizer-applications/:id/approve', authenticate, requireRole('ADMIN'), approveApplication);
router.post('/admin/organizer-applications/:id/reject', authenticate, requireRole('ADMIN'), rejectApplication);

export default router;

