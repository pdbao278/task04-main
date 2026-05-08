import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

// Test data
const testEmail = `sliceb-${Date.now()}@integration.test`;
let accessToken: string;
let workspaceId: string;
let projectId: string;
let taskId: string;

beforeAll(async () => {
  // Register test user
  const regRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Slice B User', email: testEmail, password: 'testpass123' });

  accessToken = regRes.body.data.accessToken;

  // Create workspace
  const wsRes = await request(app)
    .post('/api/v1/workspaces')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Slice B Workspace' });

  workspaceId = wsRes.body.data.id;
});

afterAll(async () => {
  // Cleanup
  await prisma.activityLog.deleteMany({ where: { task: { workspace: { name: 'Slice B Workspace' } } } });
  await prisma.task.deleteMany({ where: { workspace: { name: 'Slice B Workspace' } } });
  await prisma.project.deleteMany({ where: { workspace: { name: 'Slice B Workspace' } } });
  await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.workspaceMember.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.workspace.deleteMany({ where: { name: 'Slice B Workspace' } });
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

// ─── Project Tests ─────────────────────────────────────────

describe('POST /api/v1/projects', () => {
  it('should create a project', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Website Redesign', description: 'New website', color: '#7c3aed' })
      .expect(201);

    expect(res.body.data.name).toBe('Website Redesign');
    expect(res.body.data.color).toBe('#7c3aed');
    expect(res.body.data.creator.name).toBe('Slice B User');
    projectId = res.body.data.id;
  });

  it('should reject empty name', async () => {
    await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: '' })
      .expect(400);
  });

  it('should sanitize XSS in name', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: '<script>alert(1)</script>Safe Name' })
      .expect(201);

    expect(res.body.data.name).not.toContain('<script>');
    expect(res.body.data.name).toContain('Safe Name');
  });
});

describe('GET /api/v1/projects', () => {
  it('should list projects with task counts', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].taskCount).toBeDefined();
    expect(res.body.data[0].doneCount).toBeDefined();
  });
});

describe('PATCH /api/v1/projects/:id', () => {
  it('should update project name', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Website Redesign v2' })
      .expect(200);

    expect(res.body.data.name).toBe('Website Redesign v2');
  });
});

// ─── Task Tests ────────────────────────────────────────────

describe('POST /api/v1/tasks', () => {
  it('should create a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        title: 'Design landing page',
        description: 'Create wireframes and mockups',
        projectId,
        priority: 'HIGH',
      })
      .expect(201);

    expect(res.body.data.title).toBe('Design landing page');
    expect(res.body.data.status).toBe('TODO');
    expect(res.body.data.priority).toBe('HIGH');
    expect(res.body.data.project.name).toBe('Website Redesign v2');
    taskId = res.body.data.id;
  });

  it('should reject empty title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: '', projectId })
      .expect(400);

    expect(res.body.details).toBeDefined();
  });

  it('should reject title over 200 chars', async () => {
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'A'.repeat(201), projectId })
      .expect(400);
  });

  it('should reject invalid projectId', async () => {
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Test', projectId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);
  });

  it('should sanitize XSS in title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: '<script>alert("xss")</script>Clean Title', projectId })
      .expect(201);

    expect(res.body.data.title).not.toContain('<script>');
    expect(res.body.data.title).toContain('Clean Title');
  });

  it('should create activity log on creation', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.activityLogs).toHaveLength(1);
    expect(res.body.data.activityLogs[0].actionType).toBe('CREATED');
  });
});

describe('GET /api/v1/tasks/:id', () => {
  it('should return task detail with activity logs', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.title).toBe('Design landing page');
    expect(res.body.data.activityLogs).toBeDefined();
  });

  it('should 404 for non-existent task', async () => {
    await request(app)
      .get('/api/v1/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(404);
  });
});

describe('PATCH /api/v1/tasks/:id', () => {
  it('should update status via dedicated endpoint and create activity log', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(res.body.data.status).toBe('IN_PROGRESS');

    // Check activity log
    const detail = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId);

    const statusLog = detail.body.data.activityLogs.find(
      (l: { fieldChanged: string }) => l.fieldChanged === 'status'
    );
    expect(statusLog).toBeDefined();
    expect(statusLog.oldValue).toBe('TODO');
    expect(statusLog.newValue).toBe('IN_PROGRESS');
  });

  it('should update priority', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ priority: 'URGENT' })
      .expect(200);

    expect(res.body.data.priority).toBe('URGENT');
  });
});

describe('GET /api/v1/tasks (filters)', () => {
  it('should filter by projectId', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.every((t: { projectId: string }) => t.projectId === projectId)).toBe(true);
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?status=IN_PROGRESS')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.every((t: { status: string }) => t.status === 'IN_PROGRESS')).toBe(true);
  });

  it('should search by title', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?search=landing')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('DELETE /api/v1/tasks/:id (soft delete)', () => {
  it('should soft delete task', async () => {
    await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    // Verify task is hidden from list
    const listRes = await request(app)
      .get(`/api/v1/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId);

    const found = listRes.body.data.find((t: { id: string }) => t.id === taskId);
    expect(found).toBeUndefined();

    // Verify task still in DB with deletedAt
    const dbTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(dbTask?.deletedAt).not.toBeNull();
  });
});

// ─── Archive Project Tests ─────────────────────────────────

describe('POST /api/v1/projects/:id/archive', () => {
  it('should archive project', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/archive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.archivedAt).not.toBeNull();
  });

  it('should block task creation in archived project', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Blocked task', projectId })
      .expect(400);

    expect(res.body.error).toContain('archive');
  });

  it('should unarchive project', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/archive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.archivedAt).toBeNull();
  });
});
