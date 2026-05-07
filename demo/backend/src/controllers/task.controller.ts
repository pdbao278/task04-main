import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { CreateTaskSchema, UpdateTaskSchema } from '../types/task.types';
import { sanitizeInput } from '../utils/sanitize';
import { BadRequestError, NotFoundError } from '../utils/errors';

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
          actionType: 'CREATED',
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
    const { projectId, status, assigneeId, priority, search } = req.query;

    const where: Record<string, unknown> = {
      workspaceId: req.workspace!.id,
      deletedAt: null,
    };

    if (projectId) where.projectId = projectId as string;
    if (status) where.status = status as string;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (priority) where.priority = priority as string;
    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
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
    if (data.status !== undefined && data.status !== existing.status) {
      updateData.status = data.status;
      activityLogs.push({ fieldChanged: 'status', oldValue: existing.status, newValue: data.status });
    }
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
            actionType: 'UPDATED',
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
          actionType: 'DELETED',
        },
      }),
    ]);

    res.json({ message: 'Task đã được xóa' });
  } catch (error) {
    next(error);
  }
}
