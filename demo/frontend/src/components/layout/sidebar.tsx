'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const NAV_ITEMS = [
  { href: '/app/my-tasks', label: 'My Tasks', icon: '◉', roles: ['ADMIN', 'MANAGER', 'MEMBER'] },
  { href: '/app/team', label: 'Team Board', icon: '◫', roles: ['ADMIN', 'MANAGER'] },
  { href: '/app/projects', label: 'Projects', icon: '◧', roles: ['ADMIN', 'MANAGER', 'MEMBER'] },
  { href: '/app/reports', label: 'Reports', icon: '◈', roles: ['ADMIN', 'MANAGER'] },
  { href: '/app/settings/members', label: 'Settings', icon: '⚙', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const workspace = useAuthStore((s) => s.workspace);
  const userRole = workspace?.role || 'MEMBER';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">✦ TaskFlow</div>

      {workspace && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--c-border)',
          fontSize: '0.75rem',
        }}>
          <div style={{
            fontWeight: 600,
            color: 'var(--c-text)',
            marginBottom: '0.25rem',
            fontFamily: 'var(--font-display), Space Mono, monospace',
            letterSpacing: '-0.01em',
          }}>
            {workspace.name}
          </div>
          <span className={`badge badge-${userRole.toLowerCase()}`}>
            {userRole}
          </span>
        </div>
      )}

      <nav className="sidebar-nav">
        {visibleItems.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname?.startsWith(item.href) ? 'active' : ''}`}
            style={{
              animationDelay: `${i * 50}ms`,
            }}
          >
            <span style={{
              fontSize: '0.875rem',
              opacity: 0.7,
              width: '1rem',
              textAlign: 'center',
            }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom ambient */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--c-border)',
        fontSize: '0.625rem',
        color: 'var(--c-text-3)',
        fontFamily: 'var(--font-display), Space Mono, monospace',
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
      }}>
        v1.0 — MVP
      </div>
    </aside>
  );
}
