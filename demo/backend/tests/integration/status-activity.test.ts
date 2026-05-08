import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

// ─── Test Setup ────────────────────────────────────────────
const wsName = `SliceC-${Date.now()}`;
const adminEmail = `slicec-admin-${Date.now()}@test.local`;
const managerEmail = `slicec-manager-${Date.now()}@test.local`;
const memberEmail = `slicec-member-${Date.now()}@test.local`;
const otherMemberEmail = `slicec-other-${Date.now()}@test.local`;

let adminToken: string;
let managerToken: string;
let memberToken: string;
let otherMemberToken: string;
let workspaceId: string;
let projectId: string;
let memberTaskId: string; // task assigned to member
let unassignedTaskId: string; // task assigned to no one
let memberId: string; // userId of member
let managerId: string; // userId of manager

beforeAll(async () => {
  // Register admin
  const adminRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin User', email: adminEmail, password: 'testpass123' });
  adminToken = adminRes.body.data.accessToken;

  // Create workspace
  const wsRes = await request(app)
    .post('/api/v1/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: wsName });
  workspaceId = wsRes.body.data.id;

  // Register manager
  const mgrRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Manager User', email: managerEmail, password: 'testpass123' });
  managerToken = mgrRes.body.data.accessToken;
  managerId = mgrRes.body.data.user.id;

  // Register member
  const memRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Member User', email: memberEmail, password: 'testpass123' });
  memberToken = memRes.body.data.accessToken;
  memberId = memRes.body.data.user.id;

  // Register other member (non-assignee)
  const otherRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Other Member', email: otherMemberEmail, password: 'testpass123' });
  otherMemberToken = otherRes.body.data.accessToken;

  // Add manager to workspace
  await prisma.workspaceMember.create({
    data: { workspaceId, userId: managerId, role: 'MANAGER' },
  });

  // Add member to workspace
  await prisma.workspaceMember.create({
    data: { workspaceId, userId: memberId, role: 'MEMBER' },
  });

  // Add other member to workspace
  const otherUserId = otherRes.body.data.user.id;
  await prisma.workspaceMember.create({
    data: { workspaceId, userId: otherUserId, role: 'MEMBER' },
  });

  // Create project
  const projRes = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ name: 'SliceC Project', color: '#e8a830' });
  projectId = projRes.body.data.id;

  // Create task assigned to member
  const taskRes = await request(app)
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Member Task', projectId, assigneeId: memberId });
  memberTaskId = taskRes.body.data.id;

  // Create unassigned task
  const unassignedRes = await request(app)
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'Unassigned Task', projectId });
  unassignedTaskId = unassignedRes.body.data.id;
});

afterAll(async () => {
  // Cleanup in correct order (foreign keys)
  await prisma.activityLog.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.task.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.project.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { in: [adminEmail, managerEmail, memberEmail, otherMemberEmail] } } },
  });
  await prisma.workspaceMember.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.workspace.deleteMany({ where: { name: wsName } });
  await prisma.user.deleteMany({
    where: { email: { in: [adminEmail, managerEmail, memberEmail, otherMemberEmail] } },
  });
  await prisma.$disconnect();
});

// ─── PATCH /api/v1/tasks/:id/status ─────────────────────────

describe('PATCH /api/v1/tasks/:id/status — Permission & Status Change', () => {
  it('assignee should change TODO → IN_PROGRESS', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${memberTaskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('manager should change status of any task in workspace', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${memberTaskId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'IN_REVIEW' })
      .expect(200);

    expect(res.body.data.status).toBe('IN_REVIEW');
  });

  it('admin should change status of any task', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${unassignedTaskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('non-assignee MEMBER should be rejected (403)', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${memberTaskId}/status`)
      .set('Authorization', `Bearer ${otherMemberToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'DONE' })
      .expect(403);

    expect(res.body.error).toBeDefined();
  });

  it('should reject invalid status value', async () => {
    await request(app)
      .patch(`/api/v1/tasks/${memberTaskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'INVALID' })
      .expect(400);
  });

  it('should reject without auth token', async () => {
    await request(app)
      .patch(`/api/v1/tasks/${memberTaskId}/status`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'DONE' })
      .expect(401);
  });

  it('BUG-1 regression: non-assignee MEMBER cannot bypass via PATCH /tasks/:id', async () => {
    // Get current status before attempt
    const before = await request(app)
      .get(`/api/v1/tasks/${memberTaskId}`)
      .set('Authorization', `Bearer ${otherMemberToken}`)
      .set('x-workspace-id', workspaceId);
    const statusBefore = before.body.data.status;

    // Try to change status through the general update endpoint
    await request(app)
      .patch(`/api/v1/tasks/${memberTaskId}`)
      .set('Authorization', `Bearer ${otherMemberToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'DONE' });

    // Verify status unchanged — Zod strips unknown field 'status' from UpdateTaskSchema
    const after = await request(app)
      .get(`/api/v1/tasks/${memberTaskId}`)
      .set('Authorization', `Bearer ${otherMemberToken}`)
      .set('x-workspace-id', workspaceId);
    expect(after.body.data.status).toBe(statusBefore);
  });
});

// ─── Activity Log Tests ──────────────────────────────────────

describe('Activity log records old_value/new_value/user/timestamp', () => {
  it('status change creates activity log with old/new values', async () => {
    // First set to a known state
    await request(app)
      .patch(`/api/v1/tasks/${memberTaskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'DONE' });

    // Get activities
    const res = await request(app)
      .get(`/api/v1/tasks/${memberTaskId}/activities`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    // Find the latest status change log
    const statusLog = res.body.data.find(
      (l: { actionType: string; fieldChanged: string; newValue: string }) =>
        l.actionType === 'STATUS_CHANGED' && l.newValue === 'DONE'
    );
    expect(statusLog).toBeDefined();
    expect(statusLog.fieldChanged).toBe('status');
    expect(statusLog.oldValue).toBeDefined();
    expect(statusLog.newValue).toBe('DONE');
    expect(statusLog.user).toBeDefined();
    expect(statusLog.user.name).toBe('Member User');
    expect(statusLog.createdAt).toBeDefined();
  });

  it('creation has CREATED activity log', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${memberTaskId}/activities`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const createdLog = res.body.data.find(
      (l: { actionType: string }) => l.actionType === 'CREATED'
    );
    expect(createdLog).toBeDefined();
    expect(createdLog.user.name).toBe('Admin User');
  });
});

// ─── GET /api/v1/tasks/:id/activities ────────────────────────

describe('GET /api/v1/tasks/:id/activities', () => {
  it('should return activities ordered by newest first', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${memberTaskId}/activities`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    const dates = res.body.data.map((l: { createdAt: string }) => new Date(l.createdAt).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it('should 404 for non-existent task', async () => {
    await request(app)
      .get('/api/v1/tasks/00000000-0000-0000-0000-000000000000/activities')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(404);
  });

  it('activity logs cannot be deleted (no DELETE endpoint)', async () => {
    const activitiesRes = await request(app)
      .get(`/api/v1/tasks/${memberTaskId}/activities`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId);

    const firstLogId = activitiesRes.body.data[0]?.id;
    if (firstLogId) {
      // Attempting to delete should get 404 (no route) or 405
      const res = await request(app)
        .delete(`/api/v1/tasks/${memberTaskId}/activities/${firstLogId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .set('x-workspace-id', workspaceId);

      expect([404, 405]).toContain(res.status);
    }
  });
});
