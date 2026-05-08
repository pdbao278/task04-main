import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { escapeHtml } from '../utils/sanitize';
import { NotFoundError } from '../utils/errors';
import { extractMentions } from '../utils/mention';
import { createNotification, createBulkNotifications, NotificationType } from '../services/notification.service';
import { ActionType } from '../services/activity.service';

const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống').max(5000, 'Nội dung tối đa 5000 ký tự').trim(),
});

/**
 * POST /api/v1/tasks/:id/comments
 * Create a comment on a task — FR-06
 */
export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { content } = CreateCommentSchema.parse(req.body);
    const escapedContent = escapeHtml(content);
    const taskId = req.params.id as string;
    const userId = req.user!.id;

    // Verify task exists in workspace
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: req.workspace!.id, deletedAt: null },
      include: { assignee: { select: { id: true, name: true } } },
    });
    if (!task) throw new NotFoundError('Task không tồn tại');

    // Create comment + activity log in transaction
    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          taskId,
          userId,
          content: escapedContent,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      // Activity log for comment
      await tx.activityLog.create({
        data: {
          taskId,
          userId,
          actionType: ActionType.COMMENTED,
          newValue: escapedContent.length > 100
            ? escapedContent.slice(0, 100) + '…'
            : escapedContent,
        },
      });

      return created;
    });

    // ── Notifications (async, don't block response) ──

    // 1. Notify task assignee about new comment (if not self)
    if (task.assigneeId && task.assigneeId !== userId) {
      createNotification({
        userId: task.assigneeId,
        type: NotificationType.COMMENT,
        referenceId: taskId,
        referenceType: 'task',
        message: `${req.user!.name} đã comment trong task "${task.title}"`,
        excludeUserId: userId,
      }).catch((err) => {
        console.error('[Notification] Failed to create COMMENT notification:', err.message, { userId: task.assigneeId, taskId });
      });
    }

    // 2. Notify mentioned users
    const mentionedNames = extractMentions(escapedContent);
    if (mentionedNames.length > 0) {
      // Find users by name in workspace
      const mentionedMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: req.workspace!.id,
          user: { name: { in: mentionedNames, mode: 'insensitive' } },
        },
        select: { userId: true },
      });

      const mentionedUserIds = mentionedMembers
        .map((m) => m.userId)
        .filter((id) => id !== userId); // exclude self

      if (mentionedUserIds.length > 0) {
        // Don't double-notify assignee if they're also mentioned
        const uniqueIds = mentionedUserIds.filter((id) => id !== task.assigneeId);
        if (uniqueIds.length > 0) {
          createBulkNotifications(uniqueIds, {
            type: NotificationType.MENTION,
            referenceId: taskId,
            referenceType: 'task',
            message: `${req.user!.name} đã mention bạn trong task "${task.title}"`,
            excludeUserId: userId,
          }).catch((err) => {
            console.error('[Notification] Failed to create MENTION notifications:', err.message, { userIds: uniqueIds, taskId });
          });
        }
      }
    }

    res.status(201).json({ data: comment });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tasks/:id/comments
 * List comments for a task — FR-06
 */
export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.id as string;

    // Verify task exists in workspace (exclude soft-deleted)
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: req.workspace!.id, deletedAt: null },
    });
    if (!task) throw new NotFoundError('Task không tồn tại');

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' }, // oldest first (chat-like)
      take: 100, // cap to prevent unbounded queries
    });

    res.json({ data: comments });
  } catch (error) {
    next(error);
  }
}
