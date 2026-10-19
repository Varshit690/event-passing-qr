import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { organizerApplicationSchema, rejectApplicationSchema } from '../validators/organizerValidators';

/**
 * Submit an application to become an event organizer
 */
export const applyForOrganizer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Role check: already organizer or admin
    if (req.user.role === 'ORGANIZER' || req.user.role === 'ADMIN') {
      res.status(400).json({
        success: false,
        message: `Your account already holds the ${req.user.role} role. No application required.`,
      });
      return;
    }

    // Prevent duplicate pending applications
    const pendingApplication = await prisma.organizerApplication.findFirst({
      where: {
        userId: req.user.id,
        status: 'PENDING',
      },
    });

    if (pendingApplication) {
      res.status(409).json({
        success: false,
        message: 'You already have an organizer application pending review.',
        application: pendingApplication,
      });
      return;
    }

    const validatedData = organizerApplicationSchema.parse(req.body);

    const application = await prisma.organizerApplication.create({
      data: {
        userId: req.user.id,
        organizationName: validatedData.organizationName.trim(),
        collegeOrOrg: validatedData.collegeOrOrg.trim(),
        contactPhone: validatedData.contactPhone.trim(),
        contactEmail: validatedData.contactEmail.trim().toLowerCase(),
        category: validatedData.category || 'TECHNOLOGY',
        reason: validatedData.reason.trim(),
        website: validatedData.website?.trim() || null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Organizer application submitted successfully. Platform administrators will review your request.',
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's latest application status
 */
export const getMyApplicationStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const application = await prisma.organizerApplication.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
          select: { name: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      application,
      userRole: req.user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all organizer applications (Admin only)
 */
export const listOrganizerApplications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const [applications, counts] = await Promise.all([
      prisma.organizerApplication.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              createdAt: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.organizerApplication.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const statusCounts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      ALL: 0,
    };

    counts.forEach((c) => {
      if (c.status in statusCounts) {
        (statusCounts as any)[c.status] = c._count.status;
      }
      statusCounts.ALL += c._count.status;
    });

    res.status(200).json({
      success: true,
      applications,
      counts: statusCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve an organizer application (Admin only)
 */
export const approveApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const application = await prisma.organizerApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Organizer application not found.' });
      return;
    }

    if (application.status === 'APPROVED') {
      res.status(400).json({ success: false, message: 'This application has already been approved.' });
      return;
    }

    // Atomic transaction: Update application status + Promote user role to ORGANIZER
    const result = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.organizerApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: application.userId },
        data: { role: 'ORGANIZER' },
        select: { id: true, name: true, email: true, role: true },
      });

      return { application: updatedApp, user: updatedUser };
    });

    res.status(200).json({
      success: true,
      message: `Organizer application for "${application.organizationName}" approved. User ${result.user.name} promoted to ORGANIZER.`,
      application: result.application,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject an organizer application (Admin only)
 */
export const rejectApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = rejectApplicationSchema.parse(req.body);

    const application = await prisma.organizerApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Organizer application not found.' });
      return;
    }

    const updatedApp = await prisma.organizerApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Application did not meet verification criteria.',
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Organizer application for "${application.organizationName}" was rejected.`,
      application: updatedApp,
    });
  } catch (error) {
    next(error);
  }
};
