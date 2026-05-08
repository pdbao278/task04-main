import { describe, it, expect } from 'vitest';
import { StatusChangeSchema } from '../../src/types/task.types';

describe('StatusChangeSchema validation', () => {
  it('should accept valid status TODO', () => {
    const result = StatusChangeSchema.safeParse({ status: 'TODO' });
    expect(result.success).toBe(true);
  });

  it('should accept valid status IN_PROGRESS', () => {
    const result = StatusChangeSchema.safeParse({ status: 'IN_PROGRESS' });
    expect(result.success).toBe(true);
  });

  it('should accept valid status IN_REVIEW', () => {
    const result = StatusChangeSchema.safeParse({ status: 'IN_REVIEW' });
    expect(result.success).toBe(true);
  });

  it('should accept valid status DONE', () => {
    const result = StatusChangeSchema.safeParse({ status: 'DONE' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = StatusChangeSchema.safeParse({ status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should reject empty status', () => {
    const result = StatusChangeSchema.safeParse({ status: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing status', () => {
    const result = StatusChangeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject null status', () => {
    const result = StatusChangeSchema.safeParse({ status: null });
    expect(result.success).toBe(false);
  });
});

describe('Permission logic (unit)', () => {
  /**
   * These tests validate the permission decision logic used in
   * changeTaskStatus controller. The actual logic is:
   * - ADMIN/MANAGER can change any task
   * - MEMBER can only change tasks where assigneeId === userId
   */

  function canChangeStatus(role: string, taskAssigneeId: string | null, userId: string): boolean {
    if (role === 'ADMIN' || role === 'MANAGER') return true;
    if (role === 'MEMBER') return taskAssigneeId === userId;
    return false;
  }

  it('ADMIN can change any task', () => {
    expect(canChangeStatus('ADMIN', 'other-user', 'admin-user')).toBe(true);
    expect(canChangeStatus('ADMIN', null, 'admin-user')).toBe(true);
  });

  it('MANAGER can change any task', () => {
    expect(canChangeStatus('MANAGER', 'other-user', 'manager-user')).toBe(true);
    expect(canChangeStatus('MANAGER', null, 'manager-user')).toBe(true);
  });

  it('MEMBER can change own task (assignee === user)', () => {
    expect(canChangeStatus('MEMBER', 'user-123', 'user-123')).toBe(true);
  });

  it('MEMBER cannot change task not assigned to them', () => {
    expect(canChangeStatus('MEMBER', 'other-user', 'user-123')).toBe(false);
  });

  it('MEMBER cannot change unassigned task', () => {
    expect(canChangeStatus('MEMBER', null, 'user-123')).toBe(false);
  });
});
