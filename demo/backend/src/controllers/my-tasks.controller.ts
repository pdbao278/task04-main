import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/v1/my-tasks
 * List tasks assigned to the current user — FR-07
 *
 * Sort logic (per spec):
 *   1. Overdue tasks first (dueDate < now, status ≠ DONE)
 *   2. Tasks with due date, ascending (soonest first)
 *   3. Tasks with no due date last
 *
 * Query params:
 *   - filter: 'ALL' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' (default: ALL, excludes DONE)
 *   - workspaceId: required via x-workspace-id header
 */
export async function getMyTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const workspaceId = req.workspace!.id;
    const filter = (req.query.filter as string)?.toUpperCase();

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      assigneeId: userId,
      workspaceId,
      deletedAt: null,
    };

    // Filter by status (default: exclude DONE)
    if (filter === 'TODO') {
      where.status = 'TODO';
    } else if (filter === 'IN_PROGRESS') {
      where.status = 'IN_PROGRESS';
    } else if (filter === 'IN_REVIEW') {
      where.status = 'IN_REVIEW';
    } else {
      // ALL = everything except DONE
      where.status = { not: 'DONE' };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
      take: 200, // safe guard — paginate in v2 if needed
    });

    // Sort in application layer for complex overdue-first logic
    const now = new Date();
    const sorted = tasks.sort((a, b) => {
      const aOverdue = a.dueDate && a.dueDate < now;
      const bOverdue = b.dueDate && b.dueDate < now;

      // 1. Overdue tasks first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // 2. Both overdue → most overdue first (oldest due date)
      if (aOverdue && bOverdue) {
        return a.dueDate!.getTime() - b.dueDate!.getTime();
      }

      // 3. Has due date before no due date
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // 4. Both have due dates → ascending
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }

      // 5. Neither has due date → by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Add overdue flag for frontend
    const enriched = sorted.map((task) => ({
      ...task,
      isOverdue: !!(task.dueDate && task.dueDate < now && task.status !== 'DONE'),
    }));

    res.json({ data: enriched });
  } catch (error) {
    next(error);
  }
}
