import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

// ─── Test Setup ────────────────────────────────────────────

const wsName = `SliceF-${Date.now()}`;
const adminEmail = `slicef-admin-${Date.now()}@test.local`;
const managerEmail = `slicef-mgr-${Date.now()}@test.local`;
const memberEmail = `slicef-member-${Date.now()}@test.local`;

let adminToken: string;
let managerToken: string;
let memberToken: string;
let adminId: string;
let managerId: string;
let memberId: string;
let workspaceId: string;
let projectId: string;
let project2Id: string;

// Task IDs
let taskTodo1: string;
let taskTodo2: string;
let taskInProgress: string;
let taskDone: string;
let taskHighPriority: string;

beforeAll(async () => {
  // Register users
  const adminRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Admin F', email: adminEmail, password: 'testpass123' });
  adminToken = adminRes.body.data.accessToken;
  adminId = adminRes.body.data.user.id;

  const mgrRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Manager F', email: managerEmail, password: 'testpass123' });
  managerToken = mgrRes.body.data.accessToken;
  managerId = mgrRes.body.data.user.id;

  const memberRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Member F', email: memberEmail, password: 'testpass123' });
  memberToken = memberRes.body.data.accessToken;
  memberId = memberRes.body.data.user.id;

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

  // Create projects
  const projRes = await request(app).post('/api/v1/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ name: 'Project Alpha', color: '#e8a830' });
  projectId = projRes.body.data.id;

  const proj2Res = await request(app).post('/api/v1/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ name: 'Project Beta', color: '#60a5fa' });
  project2Id = proj2Res.body.data.id;

  // Create tasks with different statuses, priorities, assignees, projects
  const r1 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Kanban Todo 1', projectId, assigneeId: memberId, priority: 'MEDIUM' });
  taskTodo1 = r1.body.data.id;

  const r2 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Kanban Todo 2', projectId: project2Id, assigneeId: managerId, priority: 'LOW' });
  taskTodo2 = r2.body.data.id;

  // Move one to IN_PROGRESS
  const r3 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Kanban In Progress', projectId, assigneeId: memberId, priority: 'MEDIUM' });
  taskInProgress = r3.body.data.id;
  await request(app).patch(`/api/v1/tasks/${taskInProgress}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ status: 'IN_PROGRESS' });

  // Move one to DONE
  const r4 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Kanban Done Task', projectId, assigneeId: memberId });
  taskDone = r4.body.data.id;
  await request(app).patch(`/api/v1/tasks/${taskDone}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ status: 'DONE' });

  // HIGH priority task
  const r5 = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'High Priority Task', projectId, assigneeId: memberId, priority: 'HIGH' });
  taskHighPriority = r5.body.data.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: [adminEmail, managerEmail, memberEmail] } } } });
  await prisma.comment.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.activityLog.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.task.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.project.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { in: [adminEmail, managerEmail, memberEmail] } } },
  });
  await prisma.workspaceMember.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.workspace.deleteMany({ where: { name: wsName } });
  await prisma.user.deleteMany({
    where: { email: { in: [adminEmail, managerEmail, memberEmail] } },
  });
  await prisma.$disconnect();
});

// ─── FR-08: Team Dashboard / Kanban ─────────────────────────

describe('Team Kanban Board — Manager sees all workspace tasks', () => {
  it('manager should see all tasks across all statuses', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles).toContain('Kanban Todo 1');
    expect(titles).toContain('Kanban Todo 2');
    expect(titles).toContain('Kanban In Progress');
    expect(titles).toContain('Kanban Done Task');
    expect(titles).toContain('High Priority Task');
  });

  it('tasks should have correct statuses for Kanban columns', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const find = (title: string) => res.body.data.find((t: { title: string }) => t.title === title);
    expect(find('Kanban Todo 1').status).toBe('TODO');
    expect(find('Kanban In Progress').status).toBe('IN_PROGRESS');
    expect(find('Kanban Done Task').status).toBe('DONE');
  });

  it('member should also see tasks (board data from GET /tasks)', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    // Member can see workspace tasks
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Team Kanban — Filter by assignee', () => {
  it('should return only tasks assigned to specific member', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?assigneeId=${memberId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.assignee?.id).toBe(memberId);
    }
    // Should not include manager's task
    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles).not.toContain('Kanban Todo 2');
  });
});

describe('Team Kanban — Filter by project', () => {
  it('should return only tasks in specific project', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?projectId=${project2Id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.project.id).toBe(project2Id);
    }
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Kanban Todo 2');
  });
});

describe('Team Kanban — Filter by priority', () => {
  it('should return only HIGH priority tasks', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?priority=HIGH')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.priority).toBe('HIGH');
    }
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject invalid priority', async () => {
    await request(app)
      .get('/api/v1/tasks?priority=INVALID')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(400);
  });
});

describe('Team Kanban — Search by task title', () => {
  it('should find tasks matching search query', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?search=kanban')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.title.toLowerCase()).toContain('kanban');
    }
    // Should not include "High Priority Task"
    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles).not.toContain('High Priority Task');
  });

  it('search should be case-insensitive', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?search=KANBAN')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Team Kanban — Status update reflects on board', () => {
  it('changing status via PATCH should be visible in next GET /tasks', async () => {
    // Change taskTodo1 from TODO → IN_REVIEW (manager can change any task)
    await request(app)
      .patch(`/api/v1/tasks/${taskTodo1}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'IN_REVIEW' })
      .expect(200);

    // Verify it shows up in IN_REVIEW status
    const res = await request(app)
      .get(`/api/v1/tasks?status=IN_REVIEW`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles).toContain('Kanban Todo 1');

    // Also verify it does NOT show up in TODO anymore
    const todoRes = await request(app)
      .get('/api/v1/tasks?status=TODO')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const todoTitles = todoRes.body.data.map((t: { title: string }) => t.title);
    expect(todoTitles).not.toContain('Kanban Todo 1');
  });

  it('status change creates activity log', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${taskTodo1}/activities`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const statusChanges = res.body.data.filter(
      (a: { actionType: string }) => a.actionType === 'STATUS_CHANGED'
    );
    expect(statusChanges.length).toBeGreaterThanOrEqual(1);

    const lastChange = statusChanges[0];
    expect(lastChange.newValue).toBe('IN_REVIEW');
  });

  it('combined filters should work together', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?assigneeId=${memberId}&priority=HIGH`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    for (const task of res.body.data) {
      expect(task.assignee?.id).toBe(memberId);
      expect(task.priority).toBe('HIGH');
    }
  });

  it('invalid status filter should return 400', async () => {
    await request(app)
      .get('/api/v1/tasks?status=INVALID_STATUS')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(400);
  });
});

describe('Team Kanban — Workspace isolation', () => {
  it('should not see tasks from other workspaces', async () => {
    // Create a new workspace for isolation test
    const ws2Res = await request(app).post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: `SliceF-Isolated-${Date.now()}` });
    const ws2Id = ws2Res.body.data.id;

    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', ws2Id)
      .expect(200);

    // New workspace has no tasks
    expect(res.body.data.length).toBe(0);

    // Cleanup
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: ws2Id } });
    await prisma.workspace.delete({ where: { id: ws2Id } });
  });
});
