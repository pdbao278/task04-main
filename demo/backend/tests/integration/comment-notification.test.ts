import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

// ─── Test Setup ────────────────────────────────────────────
const wsName = `SliceD-${Date.now()}`;
const userAEmail = `sliced-a-${Date.now()}@test.local`;
const userBEmail = `sliced-b-${Date.now()}@test.local`;
const userCEmail = `sliced-c-${Date.now()}@test.local`;

let tokenA: string;
let tokenB: string;
let tokenC: string;
let userAId: string;
let userBId: string;
let userCId: string;
let workspaceId: string;
let projectId: string;
let taskId: string;

beforeAll(async () => {
  // Register users
  const resA = await request(app).post('/api/v1/auth/register')
    .send({ name: 'User A', email: userAEmail, password: 'testpass123' });
  tokenA = resA.body.data.accessToken;
  userAId = resA.body.data.user.id;

  const resB = await request(app).post('/api/v1/auth/register')
    .send({ name: 'User B', email: userBEmail, password: 'testpass123' });
  tokenB = resB.body.data.accessToken;
  userBId = resB.body.data.user.id;

  const resC = await request(app).post('/api/v1/auth/register')
    .send({ name: 'UserC', email: userCEmail, password: 'testpass123' });
  tokenC = resC.body.data.accessToken;
  userCId = resC.body.data.user.id;

  // Create workspace (A is admin)
  const wsRes = await request(app).post('/api/v1/workspaces')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: wsName });
  workspaceId = wsRes.body.data.id;

  // Add B and C as members
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId, userId: userBId, role: 'MEMBER' },
      { workspaceId, userId: userCId, role: 'MEMBER' },
    ],
  });

  // Create project
  const projRes = await request(app).post('/api/v1/projects')
    .set('Authorization', `Bearer ${tokenA}`)
    .set('x-workspace-id', workspaceId)
    .send({ name: 'SliceD Project', color: '#e8a830' });
  projectId = projRes.body.data.id;

  // Create task assigned to B
  const taskRes = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${tokenA}`)
    .set('x-workspace-id', workspaceId)
    .send({ title: 'SliceD Task', projectId, assigneeId: userBId });
  taskId = taskRes.body.data.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { user: { email: { in: [userAEmail, userBEmail, userCEmail] } } } });
  await prisma.comment.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.activityLog.deleteMany({ where: { task: { workspace: { name: wsName } } } });
  await prisma.task.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.project.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { in: [userAEmail, userBEmail, userCEmail] } } },
  });
  await prisma.workspaceMember.deleteMany({ where: { workspace: { name: wsName } } });
  await prisma.workspace.deleteMany({ where: { name: wsName } });
  await prisma.user.deleteMany({
    where: { email: { in: [userAEmail, userBEmail, userCEmail] } },
  });
  await prisma.$disconnect();
});

// ─── POST /tasks/:id/comments ────────────────────────────

describe('POST /api/v1/tasks/:id/comments', () => {
  it('should create a comment successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceId)
      .send({ content: 'Đây là comment đầu tiên' })
      .expect(201);

    expect(res.body.data.content).toBe('Đây là comment đầu tiên');
    expect(res.body.data.user.name).toBe('User A');
  });

  it('should reject empty comment', async () => {
    await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceId)
      .send({ content: '' })
      .expect(400);
  });

  it('should reject without auth', async () => {
    await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('x-workspace-id', workspaceId)
      .send({ content: 'test' })
      .expect(401);
  });

  it('should 404 for non-existent task', async () => {
    await request(app)
      .post('/api/v1/tasks/00000000-0000-0000-0000-000000000000/comments')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceId)
      .send({ content: 'test' })
      .expect(404);
  });
});

// ─── GET /tasks/:id/comments ─────────────────────────────

describe('GET /api/v1/tasks/:id/comments', () => {
  it('should list comments ordered by oldest first', async () => {
    // Add a second comment
    await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-workspace-id', workspaceId)
      .send({ content: 'Comment thứ 2 từ B' });

    const res = await request(app)
      .get(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    // Oldest first
    const dates = res.body.data.map((c: { createdAt: string }) => new Date(c.createdAt).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i + 1]);
    }
  });
});

// ─── Mention → Notification ──────────────────────────────

describe('Comment @mention creates notification', () => {
  it('mention @User C should create notification for User C', async () => {
    // Clear existing notifications for C
    await prisma.notification.deleteMany({ where: { userId: userCId } });

    // A comments with @mention of C's name (no space)
    await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceId)
      .send({ content: 'Hey @UserC xem giúp task này' });

    // Wait a bit for async notification
    await new Promise((r) => setTimeout(r, 300));

    // Check C's notifications
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenC}`)
      .expect(200);

    const mentionNotif = res.body.data.notifications.find(
      (n: { type: string }) => n.type === 'MENTION'
    );
    expect(mentionNotif).toBeDefined();
    expect(mentionNotif.message).toContain('mention');
  });

  it('comment on task creates COMMENT notification for assignee (B)', async () => {
    // Clear B's notifications
    await prisma.notification.deleteMany({ where: { userId: userBId } });

    // A comments (not B, B is assignee)
    await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', workspaceId)
      .send({ content: 'Update on this task' });

    await new Promise((r) => setTimeout(r, 300));

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const commentNotif = res.body.data.notifications.find(
      (n: { type: string }) => n.type === 'COMMENT'
    );
    expect(commentNotif).toBeDefined();
    expect(commentNotif.message).toContain('comment');
  });

  it('self-comment should NOT create notification for commenter', async () => {
    // Clear B's notifications
    await prisma.notification.deleteMany({ where: { userId: userBId } });

    // B comments on own task (B is assignee)
    await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-workspace-id', workspaceId)
      .send({ content: 'My own comment' });

    await new Promise((r) => setTimeout(r, 300));

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    // B should NOT have COMMENT notification for own comment
    const selfNotif = res.body.data.notifications.find(
      (n: { type: string; message: string }) =>
        n.type === 'COMMENT' && n.message.includes('User B')
    );
    expect(selfNotif).toBeUndefined();
  });
});

// ─── Notification CRUD ───────────────────────────────────

describe('Notification endpoints', () => {
  it('GET /notifications should return notifications with unreadCount', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(res.body.data).toHaveProperty('notifications');
    expect(res.body.data).toHaveProperty('unreadCount');
    expect(typeof res.body.data.unreadCount).toBe('number');
  });

  it('PATCH /notifications/:id/read should mark notification as read', async () => {
    // Get a notification for B
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenB}`);

    const unread = listRes.body.data.notifications.find(
      (n: { readAt: string | null }) => n.readAt === null
    );

    if (unread) {
      await request(app)
        .patch(`/api/v1/notifications/${unread.id}/read`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      // Verify it's now read
      const afterRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenB}`);

      const found = afterRes.body.data.notifications.find(
        (n: { id: string }) => n.id === unread.id
      );
      expect(found.readAt).not.toBeNull();
    }
  });

  it('should reject reading notification without auth', async () => {
    await request(app)
      .get('/api/v1/notifications')
      .expect(401);
  });
});
