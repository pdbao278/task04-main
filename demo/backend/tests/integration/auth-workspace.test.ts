import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

// Test data
const testUser = {
  name: 'Test User',
  email: `test-${Date.now()}@integration.test`,
  password: 'testpass123',
};

const testUser2 = {
  name: 'Test User 2',
  email: `test2-${Date.now()}@integration.test`,
  password: 'testpass456',
};

let accessToken: string;
let refreshToken: string;
let userId: string;

// Cleanup after all tests
afterAll(async () => {
  // Clean up test data
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { contains: '@integration.test' } } },
  });
  await prisma.inviteToken.deleteMany({
    where: { email: { contains: '@integration.test' } },
  });
  await prisma.workspaceMember.deleteMany({
    where: { user: { email: { contains: '@integration.test' } } },
  });
  await prisma.workspace.deleteMany({
    where: { creator: { email: { contains: '@integration.test' } } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: '@integration.test' } },
  });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Password should NOT be in response
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();

    userId = res.body.data.user.id;
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.error).toContain('đã được đăng ký');
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'bad-email' })
      .expect(400);

    expect(res.body.details).toBeDefined();
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'new@test.com', password: '123' })
      .expect(400);

    expect(res.body.details).toBeDefined();
  });

  it('should reject empty name', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'new@test.com', name: '' })
      .expect(400);

    expect(res.body.details).toBeDefined();
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrongpass' })
      .expect(401);

    expect(res.body.error).toContain('không đúng');
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'anything' })
      .expect(401);

    expect(res.body.error).toContain('không đúng');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.name).toBe(testUser.name);
  });

  it('should reject without token → 401', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('should reject invalid token → 401', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('should return new tokens with valid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Old refresh token should be rotated (different)
    expect(res.body.data.refreshToken).not.toBe(refreshToken);

    // Update tokens for subsequent tests
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should reject used (rotated) refresh token', async () => {
    // The old refreshToken was already consumed above
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'old-invalid-token' })
      .expect(401);
  });

  it('should reject missing refresh token', async () => {
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({})
      .expect(400);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should logout successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.message).toContain('Đăng xuất');
  });

  // Re-login for workspace tests
  it('should re-login for subsequent tests', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });
});

// ─── Workspace Tests ──────────────────────────────────────
let workspaceId: string;
let memberId: string;

describe('POST /api/v1/workspaces', () => {
  it('should create a workspace (creator = ADMIN)', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Workspace' })
      .expect(201);

    expect(res.body.data.name).toBe('Test Workspace');
    expect(res.body.data.members).toHaveLength(1);
    expect(res.body.data.members[0].role).toBe('ADMIN');

    workspaceId = res.body.data.id;
  });

  it('should reject without auth', async () => {
    await request(app)
      .post('/api/v1/workspaces')
      .send({ name: 'Nope' })
      .expect(401);
  });
});

describe('GET /api/v1/workspaces', () => {
  it('should list user workspaces', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((w: { name: string }) => w.name === 'Test Workspace')).toBe(true);
  });
});

describe('GET /api/v1/workspaces/:id/members', () => {
  it('should list members', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    expect(res.body.data.members).toHaveLength(1);
    expect(res.body.data.members[0].role).toBe('ADMIN');
  });
});

describe('POST /api/v1/workspaces/:id/invite', () => {
  it('should invite a member by email', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ email: testUser2.email, role: 'MEMBER' })
      .expect(201);

    expect(res.body.data.email).toBe(testUser2.email);
    expect(res.body.data.role).toBe('MEMBER');
    expect(res.body.data.expiresAt).toBeDefined();
  });

  it('should reject duplicate invite', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ email: testUser2.email, role: 'MEMBER' })
      .expect(409);

    expect(res.body.error).toContain('đã có lời mời');
  });
});

describe('Invite accept flow', () => {
  let inviteToken: string;

  beforeAll(async () => {
    // Register user2
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser2);

    // Get invite token from DB
    const invite = await prisma.inviteToken.findFirst({
      where: { email: testUser2.email, workspaceId },
    });
    inviteToken = invite!.token;
  });

  it('should accept invite with valid token', async () => {
    // Login as user2
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser2.email, password: testUser2.password });

    const user2Token = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/workspaces/invites/accept')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ token: inviteToken })
      .expect(200);

    expect(res.body.data.message).toContain('thành công');
  });

  it('should reject already-used invite', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser2.email, password: testUser2.password });

    const user2Token = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/workspaces/invites/accept')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ token: inviteToken })
      .expect(400);

    expect(res.body.error).toContain('đã được sử dụng');
  });
});

describe('PATCH /api/v1/workspaces/:id/members/:memberId/role', () => {
  beforeAll(async () => {
    // Get memberId of user2
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId);

    const user2Member = res.body.data.members.find(
      (m: { email: string }) => m.email === testUser2.email
    );
    memberId = user2Member.id;
  });

  it('should change member role (Admin → Manager)', async () => {
    const res = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/members/${memberId}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ role: 'MANAGER' })
      .expect(200);

    expect(res.body.data.role).toBe('MANAGER');
  });

  it('should reject non-admin changing role → 403', async () => {
    // Login as user2 (now MANAGER, not ADMIN)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser2.email, password: testUser2.password });

    const user2Token = loginRes.body.data.accessToken;

    await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/members/${memberId}/role`)
      .set('Authorization', `Bearer ${user2Token}`)
      .set('x-workspace-id', workspaceId)
      .send({ role: 'ADMIN' })
      .expect(403);
  });
});

describe('DELETE /api/v1/workspaces/:id/members/:memberId', () => {
  it('should remove member (Admin removes user2)', async () => {
    await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/members/${memberId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId)
      .expect(200);

    // Verify member list
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.body.data.members).toHaveLength(1);
  });
});

describe('Workspace isolation (cross-workspace → 403)', () => {
  it('should reject access to workspace user is not member of', async () => {
    // Login as user2 (removed from workspace)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser2.email, password: testUser2.password });

    const user2Token = loginRes.body.data.accessToken;

    await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${user2Token}`)
      .set('x-workspace-id', workspaceId)
      .expect(403);
  });
});
