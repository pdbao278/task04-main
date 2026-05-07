import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { CreateProjectSchema, UpdateProjectSchema } from '../types/task.types';
import { sanitizeInput } from '../utils/sanitize';
import { BadRequestError, NotFoundError } from '../utils/errors';

/**
 * POST /api/v1/projects
 * Create project (Admin/Manager only)
 */
export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = CreateProjectSchema.parse(req.body);
    const data = sanitizeInput(raw);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#2563eb',
        workspaceId: req.workspace!.id,
        createdBy: req.user!.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
    });

    res.status(201).json({ data: project });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/projects
 * List projects in workspace with task counts
 */
export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await prisma.project.findMany({
      where: { workspaceId: req.workspace!.id },
      include: {
        creator: { select: { id: true, name: true } },
        _count: {
          select: {
            tasks: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: [
        { archivedAt: { sort: 'asc', nulls: 'first' } },
        { createdAt: 'desc' },
      ],
    });

    // Single grouped query for done counts instead of N+1
    const doneCounts = await prisma.task.groupBy({
      by: ['projectId'],
      where: {
        workspaceId: req.workspace!.id,
        deletedAt: null,
        status: 'DONE',
      },
      _count: { id: true },
    });

    const doneMap = new Map(doneCounts.map((d) => [d.projectId, d._count.id]));

    const projectsWithCounts = projects.map((p) => ({
      ...p,
      taskCount: p._count.tasks,
      doneCount: doneMap.get(p.id) ?? 0,
    }));

    res.json({ data: projectsWithCounts });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/projects/:id
 * Update project (Admin/Manager only)
 */
export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = UpdateProjectSchema.parse(req.body);
    const data = sanitizeInput(raw);
    const projectId = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: req.workspace!.id },
    });

    if (!project) throw new NotFoundError('Project không tồn tại');

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/projects/:id/archive
 * Archive/unarchive project (Admin/Manager only)
 */
export async function archiveProject(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: req.workspace!.id },
    });

    if (!project) throw new NotFoundError('Project không tồn tại');

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        archivedAt: project.archivedAt ? null : new Date(),
      },
    });

    res.json({
      data: updated,
      message: updated.archivedAt ? 'Project đã được archive' : 'Project đã được khôi phục',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/projects/:id
 * Get project detail
 */
export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: req.workspace!.id },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
    });

    if (!project) throw new NotFoundError('Project không tồn tại');

    res.json({ data: project });
  } catch (error) {
    next(error);
  }
}
