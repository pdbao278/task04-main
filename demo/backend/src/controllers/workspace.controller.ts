import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  CreateWorkspaceSchema,
  InviteMemberSchema,
  ChangeRoleSchema,
} from '../types/auth.types';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendInviteEmail } from '../services/email.service';

const INVITE_EXPIRY_HOURS = 48;

/**
 * POST /api/v1/workspaces
 * Create a new workspace. The creator becomes ADMIN.
 */
export async function createWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateWorkspaceSchema.parse(req.body);

    const workspace = await prisma.workspace.create({
      data: {
        name: data.name,
        createdBy: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });

    res.status(201).json({ data: workspace });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/workspaces
 * List workspaces the current user belongs to
 */
export async function listWorkspaces(req: Request, res: Response, next: NextFunction) {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user!.id },
      include: {
        workspace: {
          select: { id: true, name: true, createdAt: true },
        },
      },
    });

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));

    res.json({ data: workspaces });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/workspaces/:id/members
 * List members of a workspace
 */
export async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.workspace!.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // Also get pending invites
    const pendingInvites = await prisma.inviteToken.findMany({
      where: {
        workspaceId: req.workspace!.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, email: true, role: true, token: true, expiresAt: true, createdAt: true },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    res.json({
      data: {
        members: members.map((m) => ({
          id: m.id,
          userId: m.user.id,
          email: m.user.email,
          name: m.user.name,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        pendingInvites: pendingInvites.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
          inviteLink: `${appUrl}/invite?token=${inv.token}`,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/workspaces/:id/invite
 * Invite a new member by email (Admin only)
 */
export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = InviteMemberSchema.parse(req.body);
    const workspaceId = req.workspace!.id;

    // Check if email is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email: data.email },
      },
    });

    if (existingMember) {
      throw new ConflictError('Email này đã là thành viên của workspace.');
    }

    // Check for existing pending invite
    const existingInvite = await prisma.inviteToken.findFirst({
      where: {
        workspaceId,
        email: data.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictError('Email này đã có lời mời đang chờ.');
    }

    // Create invite token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

    const invite = await prisma.inviteToken.create({
      data: {
        workspaceId,
        email: data.email,
        token,
        role: data.role,
        expiresAt,
      },
    });

    // Get workspace name for email
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    // Send invite email
    await sendInviteEmail(data.email, token, workspace!.name);

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/invite?token=${token}`;

    res.status(201).json({
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        inviteLink,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/invites/accept
 * Accept an invite token
 */
export async function acceptInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) {
      throw new BadRequestError('Token is required');
    }

    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { workspace: { select: { id: true, name: true } } },
    });

    if (!invite) {
      throw new NotFoundError('Link mời không hợp lệ.');
    }

    if (invite.acceptedAt) {
      throw new BadRequestError('Link mời đã được sử dụng.');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestError('Link mời đã hết hạn. Vui lòng liên hệ Admin để được mời lại.');
    }

    // Check if user exists with this email
    const user = await prisma.user.findUnique({ where: { email: invite.email } });
    if (!user) {
      // User needs to register first — return info for frontend
      res.json({
        data: {
          needsRegistration: true,
          email: invite.email,
          workspaceName: invite.workspace.name,
          token: invite.token,
        },
      });
      return;
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('Bạn đã là thành viên của workspace này.');
    }

    // Add member and mark invite as accepted
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
        },
      }),
      prisma.inviteToken.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    res.json({
      data: {
        message: 'Đã tham gia workspace thành công.',
        workspace: { ...invite.workspace, role: invite.role },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/workspaces/:id/members/:memberId/role
 * Change a member's role (Admin only)
 */
export async function changeMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const data = ChangeRoleSchema.parse(req.body);
    const memberId = req.params.memberId as string;

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: req.workspace!.id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!member) {
      throw new NotFoundError('Thành viên không tồn tại');
    }

    // Cannot change own role
    if (member.userId === req.user!.id) {
      throw new ForbiddenError('Không thể thay đổi role của chính mình');
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: data.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    res.json({
      data: {
        id: updated.id,
        userId: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        role: updated.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/workspaces/:id/members/:memberId
 * Remove a member from workspace (Admin only)
 */
export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const memberId = req.params.memberId as string;

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: req.workspace!.id },
    });

    if (!member) {
      throw new NotFoundError('Thành viên không tồn tại');
    }

    // Cannot remove self
    if (member.userId === req.user!.id) {
      throw new ForbiddenError('Không thể xóa chính mình khỏi workspace');
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });

    res.json({ message: 'Đã xóa thành viên khỏi workspace' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/workspaces/:id
 * Update workspace name (Admin only)
 */
export async function updateWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateWorkspaceSchema.parse(req.body);

    const updated = await prisma.workspace.update({
      where: { id: req.workspace!.id },
      data: { name: data.name },
      select: { id: true, name: true, createdAt: true },
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/workspaces/:id
 * Delete workspace and all related data (Admin only)
 */
export async function deleteWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace!.id;

    // Delete in order: invites, members, then workspace (cascade handles tasks etc.)
    await prisma.$transaction([
      prisma.inviteToken.deleteMany({ where: { workspaceId } }),
      prisma.workspaceMember.deleteMany({ where: { workspaceId } }),
      prisma.workspace.delete({ where: { id: workspaceId } }),
    ]);

    res.json({ message: 'Đã xóa workspace' });
  } catch (error) {
    next(error);
  }
}
