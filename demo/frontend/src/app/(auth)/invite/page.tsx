'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'needsRegister' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link mời không hợp lệ.');
      return;
    }

    if (!isAuthenticated) {
      // Encode full invite URL so query params aren't lost
      const returnUrl = encodeURIComponent(`/invite?token=${token}`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    acceptInvite();
  }, [token, isAuthenticated]);

  async function acceptInvite() {
    try {
      const res = await api.post<{
        data: {
          needsRegistration?: boolean;
          email?: string;
          workspaceName?: string;
          message?: string;
          workspace?: { id: string; name: string };
        };
      }>('/workspaces/invites/accept', { token });

      if (res.data.needsRegistration) {
        setStatus('needsRegister');
        setInviteEmail(res.data.email || '');
        setWorkspaceName(res.data.workspaceName || '');
      } else {
        setStatus('success');
        setMessage(res.data.message || 'Đã tham gia workspace thành công!');
        setWorkspaceName(res.data.workspace?.name || '');

        // Auto-select the joined workspace so layout picks it up
        if (res.data.workspace) {
          const { selectWorkspace } = useAuthStore.getState();
          selectWorkspace(res.data.workspace as any);
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      setStatus('error');
      setMessage(apiErr?.error || 'Đã xảy ra lỗi');
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display), Space Mono, monospace',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: 'var(--c-accent)',
          marginBottom: '1.5rem',
        }}>
          ✦ TaskFlow
        </div>

        {status === 'loading' && (
          <div>
            <div className="spinner spinner-dark" style={{ margin: '2rem auto' }} />
            <p style={{ color: 'var(--c-text-3)' }}>Đang xử lý lời mời...</p>
          </div>
        )}

        {status === 'needsRegister' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Bạn được mời tham gia {workspaceName}
            </h2>
            <p style={{ color: 'var(--c-text-3)', marginBottom: '1.5rem' }}>
              Vui lòng đăng ký tài khoản với email <strong>{inviteEmail}</strong> để tiếp tục.
            </p>
            <Link
              href={`/register?email=${encodeURIComponent(inviteEmail)}&token=${token}`}
              className="btn btn-primary"
            >
              Đăng ký ngay
            </Link>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Chào mừng bạn!
            </h2>
            <p style={{ color: 'var(--c-text-3)', marginBottom: '1.5rem' }}>
              Bạn đã tham gia workspace <strong>{workspaceName}</strong> thành công.
            </p>
            <Link href="/app/my-tasks" className="btn btn-primary">
              Bắt đầu làm việc
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--c-danger)' }}>
              Không thể chấp nhận lời mời
            </h2>
            <p style={{ color: 'var(--c-text-3)', marginBottom: '1.5rem' }}>
              {message}
            </p>
            <Link href="/login" className="btn btn-outline">
              Về trang đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="spinner spinner-dark" style={{ margin: '2rem auto' }} />
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
