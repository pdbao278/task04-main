import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema, InviteMemberSchema, ChangeRoleSchema, CreateWorkspaceSchema } from '../../src/types/auth.types';

describe('RegisterSchema', () => {
  it('should accept valid input', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
      name: 'Nguyễn Văn A',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Nguyễn Văn A');
    }
  });

  it('should reject invalid email', () => {
    const result = RegisterSchema.safeParse({
      email: 'not-an-email',
      password: '12345678',
      name: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password (< 8 chars)', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: '1234567',
      name: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should trim whitespace from name', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
      name: '  Nguyễn Văn A  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Nguyễn Văn A');
    }
  });

  it('should reject name over 100 chars', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
      name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('should reject password over 100 chars', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'A'.repeat(101),
      name: 'Test',
    });
    expect(result.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('should accept valid credentials', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'mypassword',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty password', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = LoginSchema.safeParse({
      email: 'invalid',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });
});

describe('InviteMemberSchema', () => {
  it('should accept valid invite with default role', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'invite@example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('MEMBER');
    }
  });

  it('should accept MANAGER role', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'invite@example.com',
      role: 'MANAGER',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('MANAGER');
    }
  });

  it('should reject ADMIN role (cannot invite as ADMIN)', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'invite@example.com',
      role: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'not-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('ChangeRoleSchema', () => {
  it('should accept ADMIN role', () => {
    const result = ChangeRoleSchema.safeParse({ role: 'ADMIN' });
    expect(result.success).toBe(true);
  });

  it('should accept MANAGER role', () => {
    const result = ChangeRoleSchema.safeParse({ role: 'MANAGER' });
    expect(result.success).toBe(true);
  });

  it('should accept MEMBER role', () => {
    const result = ChangeRoleSchema.safeParse({ role: 'MEMBER' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid role', () => {
    const result = ChangeRoleSchema.safeParse({ role: 'SUPERADMIN' });
    expect(result.success).toBe(false);
  });
});

describe('CreateWorkspaceSchema', () => {
  it('should accept valid name', () => {
    const result = CreateWorkspaceSchema.safeParse({ name: 'Team Alpha' });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = CreateWorkspaceSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should trim whitespace', () => {
    const result = CreateWorkspaceSchema.safeParse({ name: '  My Team  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Team');
    }
  });

  it('should reject name over 100 chars', () => {
    const result = CreateWorkspaceSchema.safeParse({ name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });
});
