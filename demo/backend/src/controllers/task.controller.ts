import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma, TaskStatus, Priority as PriorityEnum } from '@prisma/client';
import { CreateTaskSchema, UpdateTaskSchema, StatusChangeSchema } from '../types/task.types';
import { sanitizeInput } from '../utils/sanitize';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { createActivityLog, getTaskActivities as fetchTaskActivities, ActionType } from '../services/activity.service';

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

/**
 * POST /api/v1/tasks
 * Create a new task
 */
export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = CreateTaskSchema.parse(req.body);
    const data = sanitizeInput(raw);

    // Verify project exists and not archived
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, workspaceId: req.workspace!.id },
    });

    if (!project) throw new NotFoundError('Project không tồn tại');
    if (project.archivedAt) {
      throw new BadRequestError('Không thể tạo task trong project đã archive');
    }

    // Verify assignee is workspace member
    if (data.assigneeId) {
      const isMember = await prisma.workspaceMember.findFirst({
        where: { userId: data.assigneeId, workspaceId: req.workspace!.id },
      });
      if (!isMember) throw new BadRequestError('Assignee không thuộc workspace này');
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          projectId: data.projectId,
          workspaceId: req.workspace!.id,
          priority: data.priority,
          assigneeId: data.assigneeId || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          createdBy: req.user!.id,
          status: 'TODO',
        },
        include: {
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          taskId: created.id,
          userId: req.user!.id,
          actionType: ActionType.CREATED,
        },
      });

      return created;
    });

    res.status(201).json({ data: task });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tasks
 * List tasks in workspace (with filters)
 */
export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, status, assigneeId, priority, search, dueBefore, dueAfter } = req.query;

    const where: Prisma.TaskWhereInput = {
      workspaceId: req.workspace!.id,
      deletedAt: null,
    };

    if (projectId) where.projectId = projectId as string;
    if (status) {
      if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
        throw new BadRequestError(`Status không hợp lệ. Chấp nhận: ${VALID_STATUSES.join(', ')}`);
      }
      where.status = status as TaskStatus;
    }
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (priority) {
      if (!VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number])) {
        throw new BadRequestError(`Priority không hợp lệ. Chấp nhận: ${VALID_PRIORITIES.join(', ')}`);
      }
      where.priority = priority as PriorityEnum;
    }
    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    // Due date range filter — FR-08 Team Dashboard
    if (dueBefore || dueAfter) {
      const dueFilter: Prisma.DateTimeNullableFilter = {};
      if (dueAfter) {
        const d = new Date(dueAfter as string);
        if (isNaN(d.getTime())) throw new BadRequestError('dueAfter không hợp lệ (ISO 8601)');
        dueFilter.gte = d;
      }
      if (dueBefore) {
        const d = new Date(dueBefore as string);
        if (isNaN(d.getTime())) throw new BadRequestError('dueBefore không hợp lệ (ISO 8601)');
        dueFilter.lte = d;
      }
      where.dueDate = dueFilter;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200, // safe guard — paginate in v2 if needed
    });

    res.json({ data: tasks });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tasks/:id
 * Get task detail
 */
export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.id as string;

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: req.workspace!.id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        activityLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) throw new NotFoundError('Task không tồn tại');

    res.json({ data: task });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/tasks/:id
 * Update task fields
 */
export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = UpdateTaskSchema.parse(req.body);
    const data = sanitizeInput(raw);
    const taskId = req.params.id as string;

    const existing = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: req.workspace!.id, deletedAt: null },
    });

    if (!existing) throw new NotFoundError('Task không tồn tại');

    // Verify assignee if changing
    if (data.assigneeId) {
      const isMember = await prisma.workspaceMember.findFirst({
        where: { userId: data.assigneeId, workspaceId: req.workspace!.id },
      });
      if (!isMember) throw new BadRequestError('Assignee không thuộc workspace này');
    }

    // Build update data and track changes for activity log
    const updateData: Record<string, unknown> = {};
    const activityLogs: { fieldChanged: string; oldValue: string | null; newValue: string | null }[] = [];

    if (data.title !== undefined && data.title !== existing.title) {
      updateData.title = data.title;
      activityLogs.push({ fieldChanged: 'title', oldValue: existing.title, newValue: data.title });
    }
    if (data.description !== undefined && data.description !== existing.description) {
      updateData.description = data.description;
      activityLogs.push({ fieldChanged: 'description', oldValue: existing.description, newValue: data.description ?? null });
    }
    if (data.priority !== undefined && data.priority !== existing.priority) {
      updateData.priority = data.priority;
      activityLogs.push({ fieldChanged: 'priority', oldValue: existing.priority, newValue: data.priority });
    }
    // NOTE: status intentionally not handled here — must use PATCH /tasks/:id/status
    if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
      updateData.assigneeId = data.assigneeId;
      activityLogs.push({ fieldChanged: 'assignee', oldValue: existing.assigneeId, newValue: data.assigneeId ?? null });
    }
    if (data.dueDate !== undefined) {
      const newDue = data.dueDate ? new Date(data.dueDate) : null;
      const oldDue = existing.dueDate;
      if (newDue?.toISOString() !== oldDue?.toISOString()) {
        updateData.dueDate = newDue;
        activityLogs.push({
          fieldChanged: 'dueDate',
          oldValue: oldDue?.toISOString() ?? null,
          newValue: newDue?.toISOString() ?? null,
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.json({ data: existing, message: 'Không có thay đổi' });
    }

    const [updated] = await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      ...activityLogs.map((log) =>
        prisma.activityLog.create({
          data: {
            taskId,
            userId: req.user!.id,
            actionType: ActionType.UPDATED,
            ...log,
          },
        })
      ),
    ]);

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/tasks/:id
 * Soft delete task
 */
export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.id as string;

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: req.workspace!.id, deletedAt: null },
    });

    if (!task) throw new NotFoundError('Task không tồn tại');

    await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
      }),
      prisma.activityLog.create({
        data: {
          taskId,
          userId: req.user!.id,
          actionType: ActionType.DELETED,
        },
      }),
    ]);

    res.json({ message: 'Task đã được xóa' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/tasks/:id/status
 * Change task status with permission check:
 * - Admin / Manager: can change any task in workspace
 * - Member: can only change tasks assigned to them
 */
export async function changeTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = StatusChangeSchema.parse(req.body);
    const taskId = req.params.id as string;
    const userId = req.user!.id;
    const role = req.workspace!.role;

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: req.workspace!.id, deletedAt: null },
    });

    if (!task) throw new NotFoundError('Task không tồn tại');

    // Permission check: Admin/Manager can change any task; Member only their own
    if (role === 'MEMBER' && task.assigneeId !== userId) {
      throw new ForbiddenError('Chỉ assignee hoặc Manager mới có thể đổi trạng thái');
    }

    // No change needed
    if (task.status === status) {
      return res.json({ data: task, message: 'Không có thay đổi' });
    }

    const oldStatus = task.status;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: { status },
        include: {
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          taskId,
          userId,
          actionType: ActionType.STATUS_CHANGED,
          fieldChanged: 'status',
          oldValue: oldStatus,
          newValue: status,
        },
      });

      return result;
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tasks/:id/activities
 * List activity logs for a task
 */
export async function getActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.id as string;

    // Verify task exists in workspace
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: req.workspace!.id },
    });

    if (!task) throw new NotFoundError('Task không tồn tại');

    const activities = await fetchTaskActivities(taskId);

    res.json({ data: activities });
  } catch (error) {
    next(error);
  }
}
