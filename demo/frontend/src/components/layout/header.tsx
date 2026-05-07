'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';

export function Header({ title }: { title: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore logout API errors
    }
    logoutStore();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>

      <div className="header-user">
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--c-text-3)',
          fontFamily: 'var(--font-display), Space Mono, monospace',
        }}>
          {user?.name}
        </span>
        <div className="avatar">{initials}</div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
