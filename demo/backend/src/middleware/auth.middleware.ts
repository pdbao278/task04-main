import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role } from '@prisma/client';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
      workspace?: {
        id: string;
        role: Role;
      };
    }
  }
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token không hợp lệ');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, secret) as { userId: string; email: string; name: string };

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedError('User không tồn tại');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Phiên làm việc đã hết hạn'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token không hợp lệ'));
    } else {
      next(error);
    }
  }
}

/**
 * Attach workspace context from header x-workspace-id
 * Must be used after authenticate middleware
 */
export async function attachWorkspace(req: Request, _res: Response, next: NextFunction) {
  try {
    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) {
      throw new ForbiddenError('Workspace ID is required');
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('Bạn không thuộc workspace này');
    }

    req.workspace = {
      id: workspaceId,
      role: membership.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require specific roles
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.workspace) {
      return next(new ForbiddenError('Workspace context required'));
    }

    if (!roles.includes(req.workspace.role)) {
      return next(new ForbiddenError('Bạn không có quyền thực hiện hành động này'));
    }

    next();
  };
}
