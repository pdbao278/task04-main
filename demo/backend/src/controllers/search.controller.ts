import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * GET /api/v1/search?q=
 * Global search across workspace tasks — FR-12
 *
 * Search title (case-insensitive), returns max 10 results.
 * Frontend should debounce 300ms.
 *
 * Query params:
 *   - q: search query (min 1 char)
 *   - workspaceId: via x-workspace-id header
 */
export async function globalSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q as string)?.trim();

    if (!query || query.length === 0) {
      return res.json({ data: [] });
    }

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId: req.workspace!.id,
        deletedAt: null,
        title: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    res.json({ data: tasks });
  } catch (error) {
    next(error);
  }
}
