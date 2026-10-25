import { OrganizerApplication, User } from '../models/index.js';
import { organizerApplicationSchema, rejectApplicationSchema } from '../validators/organizerValidators.js';

/**
 * Submit an application to become an event organizer
 */
export const applyForOrganizer = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'ORGANIZER' || req.user.role === 'ADMIN') {
      res.status(400).json({
        success: false,
        message: `Your account already holds the ${req.user.role} role. No application required.`,
      });
      return;
    }

    const pendingApplication = await OrganizerApplication.findOne({
      userId: req.user.id,
      status: 'PENDING',
    });

    if (pendingApplication) {
      res.status(409).json({
        success: false,
        message: 'You already have an organizer application pending review.',
        application: pendingApplication.toJSON(),
      });
      return;
    }

    const validatedData = organizerApplicationSchema.parse(req.body);

    const application = await OrganizerApplication.create({
      userId: req.user.id,
      organizationName: validatedData.organizationName.trim(),
      collegeOrOrg: validatedData.collegeOrOrg.trim(),
      contactPhone: validatedData.contactPhone.trim(),
      contactEmail: validatedData.contactEmail.trim().toLowerCase(),
      category: validatedData.category || 'TECHNOLOGY',
      reason: validatedData.reason.trim(),
      website: validatedData.website?.trim() || undefined,
      status: 'PENDING',
    });

    const user = await User.findById(req.user.id).select('id name email').lean();

    res.status(201).json({
      success: true,
      message: 'Organizer application submitted successfully. Platform administrators will review your request.',
      application: {
        ...application.toJSON(),
        user: user ? { ...user, id: user._id.toString() } : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's latest application status
 */
export const getMyApplicationStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const application = await OrganizerApplication.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    let reviewedByUser = null;
    if (application && application.reviewedById) {
      reviewedByUser = await User.findById(application.reviewedById).select('name').lean();
    }

    res.status(200).json({
      success: true,
      application: application
        ? {
            ...application,
            id: application._id.toString(),
            reviewedBy: reviewedByUser ? { name: reviewedByUser.name } : undefined,
          }
        : null,
      userRole: req.user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all organizer applications (Admin only)
 */
export const listOrganizerApplications = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const applications = await OrganizerApplication.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const userIds = Array.from(new Set(applications.map((a) => a.userId)));
    const reviewedByIds = Array.from(
      new Set(applications.map((a) => a.reviewedById).filter(Boolean))
    );

    const [users, reviewers, counts] = await Promise.all([
      User.find({ _id: { $in: userIds } })
        .select('id name email avatarUrl role createdAt')
        .lean(),
      User.find({ _id: { $in: reviewedByIds } })
        .select('id name email')
        .lean(),
      OrganizerApplication.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const userMap = new Map(users.map((u) => [u._id.toString(), { ...u, id: u._id.toString() }]));
    const reviewerMap = new Map(reviewers.map((r) => [r._id.toString(), { ...r, id: r._id.toString() }]));

    const statusCounts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      ALL: 0,
    };

    counts.forEach((c) => {
      if (c._id in statusCounts) {
        statusCounts[c._id] = c.count;
      }
      statusCounts.ALL += c.count;
    });

    const formattedApplications = applications.map((a) => {
      const aId = a._id.toString();
      return {
        ...a,
        id: aId,
        user: userMap.get(a.userId),
        reviewedBy: a.reviewedById ? reviewerMap.get(a.reviewedById) : undefined,
      };
    });

    res.status(200).json({
      success: true,
      applications: formattedApplications,
      counts: statusCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve an organizer application (Admin only)
 */
export const approveApplication = async (req, res, next) => {
  try {
    const id = req.params.id;

    const application = await OrganizerApplication.findById(id);

    if (!application) {
      res.status(404).json({ success: false, message: 'Organizer application not found.' });
      return;
    }

    if (application.status === 'APPROVED') {
      res.status(400).json({ success: false, message: 'This application has already been approved.' });
      return;
    }

    application.status = 'APPROVED';
    application.reviewedById = req.user.id;
    application.reviewedAt = new Date();
    application.rejectionReason = undefined;
    await application.save();

    const updatedUser = await User.findByIdAndUpdate(
      application.userId,
      { $set: { role: 'ORGANIZER' } },
      { returnDocument: 'after' }
    ).select('id name email role');

    const reviewer = await User.findById(req.user.id).select('id name email');

    res.status(200).json({
      success: true,
      message: `Organizer application for "${application.organizationName}" approved. User ${updatedUser?.name || ''} promoted to ORGANIZER.`,
      application: {
        ...application.toJSON(),
        user: updatedUser?.toJSON(),
        reviewedBy: reviewer?.toJSON(),
      },
      user: updatedUser?.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject an organizer application (Admin only)
 */
export const rejectApplication = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { reason } = rejectApplicationSchema.parse(req.body);

    const application = await OrganizerApplication.findById(id);

    if (!application) {
      res.status(404).json({ success: false, message: 'Organizer application not found.' });
      return;
    }

    application.status = 'REJECTED';
    application.rejectionReason = reason || 'Application did not meet verification criteria.';
    application.reviewedById = req.user.id;
    application.reviewedAt = new Date();
    await application.save();

    const [user, reviewer] = await Promise.all([
      User.findById(application.userId).select('id name email role'),
      User.findById(req.user.id).select('id name email'),
    ]);

    res.status(200).json({
      success: true,
      message: `Organizer application for "${application.organizationName}" was rejected.`,
      application: {
        ...application.toJSON(),
        user: user?.toJSON(),
        reviewedBy: reviewer?.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};
