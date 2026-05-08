'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginResponse } from '@/types/user';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const expired = searchParams.get('expired');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      const redirectTo = searchParams.get('redirect') || '/app/my-tasks';
      router.push(redirectTo);
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      setError(apiErr?.error || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display), Space Mono, monospace',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: 'var(--c-accent)',
            marginBottom: '0.5rem',
          }}>
            ✦ TaskFlow
          </div>
          <div style={{
            width: '40px',
            height: '2px',
            background: 'var(--c-accent)',
            margin: '0 auto',
          }} />
        </div>

        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn quay lại</p>

        {expired && (
          <div className="error-box" style={{
            background: 'rgba(251, 191, 36, 0.08)',
            borderColor: 'rgba(251, 191, 36, 0.2)',
            color: 'var(--c-warning)',
          }}>
            Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.
          </div>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" className="label">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.625rem' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            Đăng nhập
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.8125rem',
          color: 'var(--c-text-3)',
        }}>
          Chưa có tài khoản?{' '}
          <Link href="/register" style={{
            color: 'var(--c-accent)',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="spinner spinner-dark" style={{ margin: '2rem auto' }} />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
