import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

// ─── Test Setup ────────────────────────────────────────────

const wsName = `SliceG-${Date.now()}`;
const adminEmail = `sliceg-admin-${Date.now()}@test.local`;
const managerEmail = `sliceg-mgr-${Date.now()}@test.local`;
const memberEmail = `sliceg-member-${Date.now()}@test.local`;
const member2Email = `sliceg-member2-${Date.now()}@test.local`;

let adminToken: string;
let managerToken: string;
let memberToken: string;
let member2Token: string;
let adminId: string;
let managerId: string;
let memberId: string;
let member2Id: string;
let workspaceId: string;
let projectId: string;

beforeAll(async () => {
  // Register users
  const adminRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Admin G', email: adminEmail, password: 'testpass123' });
  adminToken = adminRes.body.data.accessToken;
  adminId = adminRes.body.data.user.id;

  const mgrRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Manager G', email: managerEmail, password: 'testpass123' });
  managerToken = mgrRes.body.data.accessToken;
  managerId = mgrRes.body.data.user.id;

  const memRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Member G', email: memberEmail, password: 'testpass123' });
  memberToken = memRes.body.data.accessToken;
  memberId = memRes.body.data.user.id;

  const mem2Res = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Member2 G', email: member2Email, password: 'testpass123' });
  member2Token = mem2Res.body.data.accessToken;
  member2Id = mem2Res.body.data.user.id;

  // Create workspace
  const wsRes = await request(app).post('/api/v1/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: wsName });
  workspaceId = wsRes.body.data.id;

  // Add members
  await prisma.workspaceMember.create({
    data: { workspaceId, userId: managerId, role: 'MANAGER' },
  });
  await prisma.workspaceMember.create({
    data: { workspaceId, userId: memberId, role: 'MEMBER' },
  });
  await prisma.workspaceMember.create({
    data: { workspaceId, userId: member2Id, role: 'MEMBER' },
  });

  // Create project
  const projRes = await request(app).post('/api/v1/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ name: 'Report Project', color: '#e8a830' });
  projectId = projRes.body.data.id;

  // Create tasks for member1:
  // - 3 tasks total, 2 completed (DONE), 1 overdue
  const t1 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Done Task 1', projectId, assigneeId: memberId, priority: 'MEDIUM' });
  await request(app).patch(`/api/v1/tasks/${t1.body.data.id}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ status: 'DONE' });

  const t2 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Done Task 2', projectId, assigneeId: memberId, priority: 'HIGH' });
  await request(app).patch(`/api/v1/tasks/${t2.body.data.id}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ status: 'DONE' });

  // Overdue task (due yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({
      title: 'Overdue Task',
      projectId,
      assigneeId: memberId,
      priority: 'URGENT',
      dueDate: yesterday.toISOString(),
    });

  // Create tasks for member2:
  // - 2 tasks total, 0 completed, 0 overdue
  await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Todo Task Member2', projectId, assigneeId: member2Id, priority: 'LOW' });

  await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Todo Task 2 Member2', projectId, assigneeId: member2Id, priority: 'MEDIUM' });
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: [adminEmail, managerEmail, memberEmail, member2Email] } } } });
  await prisma.comment.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.activityLog.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.task.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.project.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { in: [adminEmail, managerEmail, memberEmail, member2Email] } } },
  });
  await prisma.workspaceMember.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.workspace.deleteMany({ where: { name: wsName } });
  await prisma.user.deleteMany({
    where: { email: { in: [adminEmail, managerEmail, memberEmail, member2Email] } },
  });
  await prisma.$disconnect();
});

// ─── Tests ──────────────────────────────────────────────────

describe('GET /api/v1/reports — Weekly Completed', () => {
  it('should return 4 weeks of completion data', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const { weeklyCompleted } = res.body.data;
    expect(weeklyCompleted).toHaveLength(4);
    expect(weeklyCompleted[0]).toHaveProperty('week');
    expect(weeklyCompleted[0]).toHaveProperty('label');
    expect(weeklyCompleted[0]).toHaveProperty('count');
    expect(weeklyCompleted[0]).toHaveProperty('weekStart');
    expect(weeklyCompleted[0]).toHaveProperty('weekEnd');
  });

  it('current week should include completed tasks', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const { weeklyCompleted } = res.body.data;
    // The last week (current) should have our 2 completed tasks
    const currentWeek = weeklyCompleted[3]; // week 4 = current
    expect(currentWeek.count).toBeGreaterThanOrEqual(2);
  });

  it('week labels should be in dd/mm format', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const { weeklyCompleted } = res.body.data;
    for (const w of weeklyCompleted) {
      expect(w.label).toMatch(/^\d{2}\/\d{2} - \d{2}\/\d{2}$/);
    }
  });
});

describe('GET /api/v1/reports — Member Stats', () => {
  it('should return stats for all workspace members', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const { memberStats } = res.body.data;
    expect(memberStats.length).toBeGreaterThanOrEqual(4); // admin + manager + 2 members
    const names = memberStats.map((m: { name: string }) => m.name);
    expect(names).toContain('Member G');
    expect(names).toContain('Member2 G');
  });

  it('member1 should have correct completion metrics', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const member1 = res.body.data.memberStats.find(
      (m: { userId: string }) => m.userId === memberId
    );
    expect(member1).toBeDefined();
    expect(member1.assigned).toBe(3);    // 2 done + 1 overdue
    expect(member1.completed).toBe(2);
    expect(member1.overdue).toBe(1);
    expect(member1.completionRate).toBe(67); // round(2/3 * 100)
  });

  it('member2 should have 0% completion rate', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const member2 = res.body.data.memberStats.find(
      (m: { userId: string }) => m.userId === member2Id
    );
    expect(member2).toBeDefined();
    expect(member2.assigned).toBe(2);
    expect(member2.completed).toBe(0);
    expect(member2.overdue).toBe(0);
    expect(member2.completionRate).toBe(0);
  });

  it('member with no tasks should have 0 across all metrics', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const manager = res.body.data.memberStats.find(
      (m: { userId: string }) => m.userId === managerId
    );
    expect(manager).toBeDefined();
    expect(manager.assigned).toBe(0);
    expect(manager.completed).toBe(0);
    expect(manager.overdue).toBe(0);
    expect(manager.completionRate).toBe(0);
  });
});

describe('GET /api/v1/reports — Authorization', () => {
  it('should require auth', async () => {
    await request(app)
      .get('/api/v1/reports')
      .set('x-workspace-id', workspaceId)
      .expect(401);
  });

  it('should require workspace header', async () => {
    await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);
  });

  it('member can access reports (data scoped to workspace)', async () => {
    // PRD OQ-05 not resolved — for now all workspace members can access
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.memberStats).toBeDefined();
  });
});

describe('GET /api/v1/reports — Workspace Isolation', () => {
  it('should not include tasks from other workspaces', async () => {
    // Create isolated workspace
    const ws2Res = await request(app).post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: `SliceG-Isolated-${Date.now()}` });
    const ws2Id = ws2Res.body.data.id;

    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', ws2Id)
      .expect(200);

    // No tasks in new workspace
    const { weeklyCompleted, memberStats } = res.body.data;
    const totalCompleted = weeklyCompleted.reduce(
      (sum: number, w: { count: number }) => sum + w.count, 0
    );
    expect(totalCompleted).toBe(0);

    // Only manager is a member
    expect(memberStats.length).toBe(1);
    expect(memberStats[0].assigned).toBe(0);

    // Cleanup
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: ws2Id } });
    await prisma.workspace.delete({ where: { id: ws2Id } });
  });
});
