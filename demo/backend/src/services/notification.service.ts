import { prisma } from '../lib/prisma';

/**
 * Notification types — FR-09
 */
export const NotificationType = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  COMMENT: 'COMMENT',
  DUE_SOON: 'DUE_SOON',
  MENTION: 'MENTION',
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Create a notification for a user.
 * Skips if userId is the same as excludeUserId (don't notify yourself).
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationTypeValue;
  referenceId?: string | null;
  referenceType?: string | null;
  message: string;
  excludeUserId?: string; // don't notify this user (e.g. comment author)
}) {
  // Don't notify yourself
  if (params.excludeUserId && params.userId === params.excludeUserId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      referenceId: params.referenceId ?? null,
      referenceType: params.referenceType ?? null,
      message: params.message,
    },
  });
}

/**
 * Create notifications for multiple users at once (e.g. mentions).
 */
export async function createBulkNotifications(
  userIds: string[],
  params: {
    type: NotificationTypeValue;
    referenceId?: string | null;
    referenceType?: string | null;
    message: string;
    excludeUserId?: string;
  }
) {
  const filtered = userIds.filter((id) => id !== params.excludeUserId);
  if (filtered.length === 0) return [];

  return prisma.notification.createMany({
    data: filtered.map((userId) => ({
      userId,
      type: params.type,
      referenceId: params.referenceId ?? null,
      referenceType: params.referenceType ?? null,
      message: params.message,
    })),
  });
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/**
 * List notifications for a user, newest first.
 */
export async function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}
