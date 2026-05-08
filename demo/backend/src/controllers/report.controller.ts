import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * GET /api/v1/reports
 * Team reports for Manager — FR-11, US-05
 *
 * Returns:
 *   - weeklyCompleted: Array of { week, weekStart, weekEnd, count }
 *     (last 4 weeks of tasks marked DONE)
 *   - memberStats: Array of { userId, name, email, assigned, completed, overdue, completionRate }
 *     (per-member metrics in current workspace)
 *
 * All data scoped to current workspace via middleware.
 */
export async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace!.id;
    const now = new Date();

    // ─── Weekly Completed (last 4 weeks) ────────────────────

    // Calculate start of each of the last 4 weeks (Monday-based)
    const weeks: { weekStart: Date; weekEnd: Date; label: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + 1 - i * 7); // Monday of week
      d.setHours(0, 0, 0, 0);
      const weekStart = new Date(d);

      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Label format: "07/04 - 13/04"
      const fmt = (dt: Date) =>
        `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const label = `${fmt(weekStart)} - ${fmt(weekEnd)}`;

      weeks.push({ weekStart, weekEnd, label });
    }

    // Query completed tasks per week
    const fourWeeksAgo = weeks[0].weekStart;
    const completedTasks = await prisma.task.findMany({
      where: {
        workspaceId,
        status: 'DONE',
        deletedAt: null,
        updatedAt: { gte: fourWeeksAgo },
      },
      select: { id: true, updatedAt: true },
    });

    const weeklyCompleted = weeks.map((w, idx) => {
      const count = completedTasks.filter(
        (t) => t.updatedAt >= w.weekStart && t.updatedAt <= w.weekEnd
      ).length;
      return {
        week: idx + 1,
        label: w.label,
        weekStart: w.weekStart.toISOString(),
        weekEnd: w.weekEnd.toISOString(),
        count,
      };
    });

    // ─── Member Stats ───────────────────────────────────────

    // Get all workspace members
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Get all tasks in workspace (not deleted)
    const allTasks = await prisma.task.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        dueDate: true,
      },
    });

    const memberStats = members.map((m) => {
      const memberTasks = allTasks.filter((t) => t.assigneeId === m.user.id);
      const assigned = memberTasks.length;
      const completed = memberTasks.filter((t) => t.status === 'DONE').length;
      const overdue = memberTasks.filter(
        (t) => t.dueDate && t.dueDate < now && t.status !== 'DONE'
      ).length;
      const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      return {
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        assigned,
        completed,
        overdue,
        completionRate,
      };
    });

    res.json({
      data: {
        weeklyCompleted,
        memberStats,
      },
    });
  } catch (error) {
    next(error);
  }
}
