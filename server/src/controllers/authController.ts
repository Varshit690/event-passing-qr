import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { ENV } from '../config/env';
import { registerSchema, registerOrganizerSchema, loginSchema } from '../validators/authValidators';
import { AuthenticatedRequest } from '../middleware/auth';

const generateToken = (id: string, email: string, role: string) => {
  return jwt.sign({ id, email, role }, ENV.JWT_SECRET, {
    expiresIn: '7d',
  } as any);
};

const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  const token = generateToken(user.id, user.email, user.role);

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    // Public registration strictly assigns ATTENDEE. Arbitrary client roles are rejected.
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        passwordHash,
        role: 'ATTENDEE',
        avatarUrl:
          validatedData.avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validatedData.name)}`,
      },
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const registerOrganizer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerOrganizerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    // Transaction to create ORGANIZER user and linked profile application record for complete audit trail
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email.toLowerCase(),
          passwordHash,
          role: 'ORGANIZER',
          avatarUrl:
            validatedData.avatarUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validatedData.name)}`,
        },
      });

      // Maintain application table record as APPROVED for record keeping
      await tx.organizerApplication.create({
        data: {
          userId: newUser.id,
          organizationName: validatedData.organizationName,
          collegeOrOrg: validatedData.organizationName,
          contactPhone: validatedData.contactPhone,
          contactEmail: validatedData.email.toLowerCase(),
          category: 'TECHNOLOGY',
          reason: 'Direct Organizer Registration (Self-Provisioned)',
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });

      return newUser;
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, portal } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
      return;
    }

    // Portal role-based gateway check
    if (portal === 'ADMIN' && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied: Admin credentials are required for the Admin Portal.',
      });
      return;
    }

    if (portal === 'ORGANIZER' && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied: An Organizer or Admin account is required for the Organizer Portal. Please sign up as an Organizer or switch to Attendee Portal.',
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
