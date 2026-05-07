'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginResponse } from '@/types/user';

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>('/auth/register', { name, email, password });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/app/my-tasks');
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: { field: string; message: string }[] };
      if (apiErr?.details) {
        const fieldErrors: Record<string, string> = {};
        apiErr.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      } else {
        setGlobalError(apiErr?.error || 'Đã xảy ra lỗi');
      }
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

        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Bắt đầu quản lý công việc hiệu quả</p>

        {globalError && (
          <div className="error-box">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="label">Họ tên</label>
            <input
              id="name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" className="label">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Ít nhất 8 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.625rem' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            Đăng ký
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.8125rem',
          color: 'var(--c-text-3)',
        }}>
          Đã có tài khoản?{' '}
          <Link href="/login" style={{
            color: 'var(--c-accent)',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
