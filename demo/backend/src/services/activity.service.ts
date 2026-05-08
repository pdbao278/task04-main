import { prisma } from '../lib/prisma';

/**
 * Activity log action types
 */
export const ActionType = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  DELETED: 'DELETED',
  COMMENTED: 'COMMENTED',
} as const;

export type ActionTypeValue = (typeof ActionType)[keyof typeof ActionType];

/**
 * Create an activity log entry
 * This is the single source of truth for creating activity logs.
 */
export async function createActivityLog(params: {
  taskId: string;
  userId: string;
  actionType: ActionTypeValue;
  fieldChanged?: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  return prisma.activityLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      actionType: params.actionType,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  });
}

/**
 * Get activity logs for a task, ordered by newest first
 */
export async function getTaskActivities(taskId: string) {
  return prisma.activityLog.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
