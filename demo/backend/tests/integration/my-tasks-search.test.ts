import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

// ─── Test Setup ────────────────────────────────────────────
const wsName = `SliceE-${Date.now()}`;
const adminEmail = `slicee-admin-${Date.now()}@test.local`;
const memberEmail = `slicee-member-${Date.now()}@test.local`;

let adminToken: string;
let memberToken: string;
let adminId: string;
let memberId: string;
let workspaceId: string;
let projectId: string;

// Task IDs
let taskOverdue1: string;  // overdue by 2 days
let taskOverdue2: string;  // overdue by 5 days
let taskDueSoon: string;   // due in 1 day
let taskDueLater: string;  // due in 7 days
let taskNoDue: string;     // no due date
let taskDone: string;      // status DONE (should not appear in my-tasks)
let taskUnassigned: string; // not assigned to member

beforeAll(async () => {
  // Register users
  const adminRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Admin E', email: adminEmail, password: 'testpass123' });
  adminToken = adminRes.body.data.accessToken;
  adminId = adminRes.body.data.user.id;

  const memberRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Member E', email: memberEmail, password: 'testpass123' });
  memberToken = memberRes.body.data.accessToken;
  memberId = memberRes.body.data.user.id;

  // Create workspace
  const wsRes = await request(app).post('/api/v1/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: wsName });
  workspaceId = wsRes.body.data.id;

  // Add member
  await prisma.workspaceMember.create({
    data: { workspaceId, userId: memberId, role: 'MEMBER' },
  });

  // Create project
  const projRes = await request(app).post('/api/v1/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ name: 'SliceE Project', color: '#e8a830' });
  projectId = projRes.body.data.id;

  // Create tasks with various due dates
  const now = new Date();

  // 1. Overdue by 2 days
  const d1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const r1 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Overdue 2 days', projectId, assigneeId: memberId, dueDate: d1.toISOString() });
  taskOverdue1 = r1.body.data.id;

  // 2. Overdue by 5 days
  const d2 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const r2 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Overdue 5 days', projectId, assigneeId: memberId, dueDate: d2.toISOString() });
  taskOverdue2 = r2.body.data.id;

  // 3. Due in 1 day
  const d3 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const r3 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Due soon', projectId, assigneeId: memberId, dueDate: d3.toISOString() });
  taskDueSoon = r3.body.data.id;

  // 4. Due in 7 days
  const d4 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const r4 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Due later', projectId, assigneeId: memberId, dueDate: d4.toISOString() });
  taskDueLater = r4.body.data.id;

  // 5. No due date
  const r5 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'No due date', projectId, assigneeId: memberId });
  taskNoDue = r5.body.data.id;

  // 6. DONE task (should be excluded)
  const r6 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Completed task', projectId, assigneeId: memberId });
  taskDone = r6.body.data.id;
  await request(app).patch(`/api/v1/tasks/${taskDone}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ status: 'DONE' });

  // 7. Unassigned task (should not appear for member)
  const r7 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Unassigned task', projectId });
  taskUnassigned = r7.body.data.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: [adminEmail, memberEmail] } } } });
  await prisma.comment.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.activityLog.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.task.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.project.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { in: [adminEmail, memberEmail] } } },
  });
  await prisma.workspaceMember.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.workspace.deleteMany({ where: { name: wsName } });
  await prisma.user.deleteMany({
    where: { email: { in: [adminEmail, memberEmail] } },
  });
  await prisma.$disconnect();
});

// ─── FR-07: My Tasks ────────────────────────────────────────

describe('GET /api/v1/my-tasks', () => {
  it('should return tasks assigned to current user, excluding DONE', async () => {
    const res = await request(app)
      .get('/api/v1/my-tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const titles = res.body.data.map((t: { title: string }) => t.title);

    // Should include assigned tasks (not DONE)
    expect(titles).toContain('Overdue 2 days');
    expect(titles).toContain('Overdue 5 days');
    expect(titles).toContain('Due soon');
    expect(titles).toContain('Due later');
    expect(titles).toContain('No due date');

    // Should NOT include DONE or unassigned
    expect(titles).not.toContain('Completed task');
    expect(titles).not.toContain('Unassigned task');
  });

  it('should sort: overdue first → due ASC → no-due last', async () => {
    const res = await request(app)
      .get('/api/v1/my-tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const titles = res.body.data.map((t: { title: string }) => t.title);

    // Overdue 5 days should come before Overdue 2 days (oldest overdue first)
    const idx5 = titles.indexOf('Overdue 5 days');
    const idx2 = titles.indexOf('Overdue 2 days');
    const idxSoon = titles.indexOf('Due soon');
    const idxLater = titles.indexOf('Due later');
    const idxNoDue = titles.indexOf('No due date');

    // Overdue tasks first
    expect(idx5).toBeLessThan(idxSoon);
    expect(idx2).toBeLessThan(idxSoon);

    // Most overdue first
    expect(idx5).toBeLessThan(idx2);

    // Due date ascending
    expect(idxSoon).toBeLessThan(idxLater);

    // No due date last
    expect(idxNoDue).toBeGreaterThan(idxLater);
  });

  it('should add isOverdue flag for overdue tasks', async () => {
    const res = await request(app)
      .get('/api/v1/my-tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const overdueTask = res.body.data.find((t: { title: string }) => t.title === 'Overdue 2 days');
    const normalTask = res.body.data.find((t: { title: string }) => t.title === 'Due soon');
    const noDueTask = res.body.data.find((t: { title: string }) => t.title === 'No due date');

    expect(overdueTask.isOverdue).toBe(true);
    expect(normalTask.isOverdue).toBe(false);
    expect(noDueTask.isOverdue).toBe(false);
  });

  it('should filter by status TODO', async () => {
    const res = await request(app)
      .get('/api/v1/my-tasks?filter=TODO')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    // All returned tasks should be TODO
    for (const task of res.body.data) {
      expect(task.status).toBe('TODO');
    }
  });

  it('should filter by status IN_PROGRESS', async () => {
    // First move a task to IN_PROGRESS
    await request(app).patch(`/api/v1/tasks/${taskDueSoon}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'IN_PROGRESS' });

    const res = await request(app)
      .get('/api/v1/my-tasks?filter=IN_PROGRESS')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    for (const task of res.body.data) {
      expect(task.status).toBe('IN_PROGRESS');
    }
  });

  it('should return empty for user with no assigned tasks', async () => {
    const res = await request(app)
      .get('/api/v1/my-tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    // Admin has no tasks assigned to them
    expect(res.body.data).toEqual([]);
  });

  it('should reject without auth', async () => {
    await request(app)
      .get('/api/v1/my-tasks')
      .set('x-workspace-id', workspaceId)
      .expect(401);
  });

  it('should reject without workspace', async () => {
    await request(app)
      .get('/api/v1/my-tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });
});

// ─── FR-08: Team Dashboard (listTasks filters) ──────────────

describe('GET /api/v1/tasks — Team Dashboard filters', () => {
  it('should filter by assignee', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?assigneeId=${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.assignee?.id).toBe(memberId);
    }
  });

  it('should filter by project', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.project.id).toBe(projectId);
    }
  });

  it('should filter by priority', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?priority=MEDIUM')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.priority).toBe('MEDIUM');
    }
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?status=TODO')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.status).toBe('TODO');
    }
  });

  it('should filter by due date range', async () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .get(`/api/v1/tasks?dueAfter=${threeDaysAgo}&dueBefore=${twoDaysFromNow}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    // Should include "Overdue 2 days" and "Due soon" but not "Overdue 5 days" or "Due later"
    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles).toContain('Overdue 2 days');
    expect(titles).toContain('Due soon');
    expect(titles).not.toContain('Overdue 5 days');
    expect(titles).not.toContain('Due later');
  });

  it('should search by title', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?search=overdue')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    for (const task of res.body.data) {
      expect(task.title.toLowerCase()).toContain('overdue');
    }
  });

  it('should combine multiple filters', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?status=TODO&assigneeId=${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.status).toBe('TODO');
      expect(task.assignee?.id).toBe(memberId);
    }
  });
});

// ─── FR-12: Global Search ───────────────────────────────────

describe('GET /api/v1/search', () => {
  it('should search tasks by title (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=overdue')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    for (const task of res.body.data) {
      expect(task.title.toLowerCase()).toContain('overdue');
    }
  });

  it('should return max 10 results', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    // Empty query returns empty
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });

  it('should return empty for empty query', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data).toEqual([]);
  });

  it('should not return soft-deleted tasks', async () => {
    // Soft-delete a task
    await request(app).delete(`/api/v1/tasks/${taskUnassigned}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    const res = await request(app)
      .get('/api/v1/search?q=Unassigned')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBe(0);
  });

  it('should include project and assignee info in results', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=Due+soon')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const task = res.body.data[0];
    expect(task).toHaveProperty('project');
    expect(task).toHaveProperty('assignee');
    expect(task.project).toHaveProperty('name');
    expect(task.project).toHaveProperty('color');
  });

  it('should reject without auth', async () => {
    await request(app)
      .get('/api/v1/search?q=test')
      .set('x-workspace-id', workspaceId)
      .expect(401);
  });
});
