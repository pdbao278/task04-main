import { Request, Response, NextFunction } from 'express';
import { listNotifications, markAsRead, getUnreadCount } from '../services/notification.service';
import { NotFoundError } from '../utils/errors';

/**
 * GET /api/v1/notifications
 * List notifications for the current user — FR-09
 */
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(userId),
      getUnreadCount(userId),
    ]);

    res.json({ data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read — FR-09
 */
export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notificationId = req.params.id as string;
    const userId = req.user!.id;

    const result = await markAsRead(notificationId, userId);
    if (result.count === 0) {
      throw new NotFoundError('Notification không tồn tại');
    }

    res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    next(error);
  }
}
