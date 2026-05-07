'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { WorkspaceMember, PendingInvite } from '@/types/user';

export default function MembersPage() {
  const workspace = useAuthStore((s) => s.workspace);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (workspace) fetchMembers();
  }, [workspace]);

  async function fetchMembers() {
    if (!workspace) return;
    try {
      const res = await api.get<{
        data: { members: WorkspaceMember[]; pendingInvites: PendingInvite[] };
      }>(`/workspaces/${workspace.id}/members`);
      setMembers(res.data.members);
      setPendingInvites(res.data.pendingInvites);
    } catch (err: unknown) {
      console.error('Failed to fetch members:', err);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post(`/workspaces/${workspace!.id}/invite`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setSuccess(`Đã gửi lời mời đến ${inviteEmail}`);
      setInviteEmail('');
      fetchMembers();
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      setError(apiErr?.error || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    try {
      await api.patch(`/workspaces/${workspace!.id}/members/${memberId}/role`, { role });
      fetchMembers();
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      setError(apiErr?.error || 'Không thể thay đổi role');
    }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Xóa ${memberName} khỏi workspace?`)) return;
    try {
      await api.delete(`/workspaces/${workspace!.id}/members/${memberId}`);
      fetchMembers();
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      setError(apiErr?.error || 'Không thể xóa thành viên');
    }
  }

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <>
      <Header title="Quản lý thành viên" />
      <div>
        {/* Invite Form */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display), Space Mono, monospace',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--c-accent)',
            marginBottom: '1rem',
          }}>
            Mời thành viên mới
          </h2>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              color: 'var(--c-success)',
              borderRadius: 'var(--r-md)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="invite-email" className="label">Email</label>
              <input
                id="invite-email"
                type="email"
                className="input"
                placeholder="member@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="label">Role</label>
              <select
                id="invite-role"
                className="input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'MANAGER' | 'MEMBER')}
              >
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              Gửi lời mời
            </button>
          </form>
        </div>

        {/* Members List */}
        <div className="card">
          <h2 style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display), Space Mono, monospace',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--c-text-2)',
            marginBottom: '1rem',
          }}>
            Thành viên ({members.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="avatar">
                    {member.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{member.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                      {member.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {workspace?.role === 'ADMIN' && member.role !== 'ADMIN' ? (
                    <>
                      <select
                        className="input"
                        style={{ width: 'auto', padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        aria-label={`Role cho ${member.name}`}
                      >
                        <option value="MANAGER">Manager</option>
                        <option value="MEMBER">Member</option>
                      </select>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--c-danger)' }}
                        onClick={() => handleRemove(member.id, member.name)}
                        aria-label={`Xóa ${member.name}`}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className={`badge badge-${member.role.toLowerCase()}`}>
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                Lời mời đang chờ ({pendingInvites.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--r-md)',
                      border: '1px dashed var(--c-border-strong)',
                      background: 'rgba(251, 191, 36, 0.04)',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem' }}>{invite.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-pending">Pending</span>
                      <span className={`badge badge-${invite.role.toLowerCase()}`}>
                        {invite.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
