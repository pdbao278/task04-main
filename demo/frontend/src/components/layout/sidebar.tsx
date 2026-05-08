'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import type { Workspace } from '@/types/user';

const NAV_ITEMS = [
  { href: '/app/my-tasks', label: 'My Tasks', icon: '◉', roles: ['ADMIN', 'MANAGER', 'MEMBER'] },
  { href: '/app/team', label: 'Team Board', icon: '◫', roles: ['ADMIN', 'MANAGER'] },
  { href: '/app/projects', label: 'Projects', icon: '◧', roles: ['ADMIN', 'MANAGER', 'MEMBER'] },
  { href: '/app/reports', label: 'Reports', icon: '◈', roles: ['ADMIN', 'MANAGER'] },
  { href: '/app/settings/members', label: 'Settings', icon: '⚙', roles: ['ADMIN'] },
];

interface SidebarProps {
  className?: string;
  workspaces?: Workspace[];
  onSwitchWorkspace?: (ws: Workspace) => void;
  onCreateWorkspace?: (name: string) => Promise<void>;
}

export function Sidebar({
  className = '',
  workspaces = [],
  onSwitchWorkspace,
  onCreateWorkspace,
}: SidebarProps) {
  const pathname = usePathname();
  const workspace = useAuthStore((s) => s.workspace);
  const userRole = workspace?.role || 'MEMBER';

  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  async function handleCreate() {
    if (!createName.trim() || creating) return;
    setCreating(true);
    try {
      await onCreateWorkspace?.(createName.trim());
      setCreateName('');
      setShowCreate(false);
    } catch { /* handled in parent */ }
    setCreating(false);
  }

  return (
    <aside className={`sidebar ${className}`}>
      <div className="sidebar-logo">✦ TaskFlow</div>

      {/* ─── Workspace Switcher ──────────────────────── */}
      {workspace && (
        <div className="ws-section">
          <button
            className="ws-current"
            onClick={() => setShowSwitcher(!showSwitcher)}
            aria-label="Chuyển workspace"
          >
            <div className="ws-avatar">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="ws-info">
              <div className="ws-name">{workspace.name}</div>
              <span className={`badge badge-${userRole.toLowerCase()}`} style={{ fontSize: '0.5rem' }}>
                {userRole}
              </span>
            </div>
            <span className="ws-chevron" style={{
              transform: showSwitcher ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              ▾
            </span>
          </button>

          {/* Workspace dropdown */}
          {showSwitcher && (
            <div className="ws-dropdown">
              {/* Other workspaces */}
              {workspaces
                .filter((w) => w.id !== workspace.id)
                .map((w) => (
                  <button
                    key={w.id}
                    className="ws-dropdown-item"
                    onClick={() => {
                      onSwitchWorkspace?.(w);
                      setShowSwitcher(false);
                    }}
                  >
                    <div className="ws-avatar ws-avatar-sm">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ flex: 1 }}>{w.name}</span>
                    <span className={`badge badge-${(w.role || 'member').toLowerCase()}`} style={{ fontSize: '0.4375rem' }}>
                      {w.role}
                    </span>
                  </button>
                ))}

              {/* Create new workspace */}
              <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '0.375rem', marginTop: '0.25rem' }}>
                {showCreate ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                    style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                  >
                    <input
                      className="input"
                      placeholder="Tên workspace..."
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      style={{ fontSize: '0.6875rem', padding: '0.25rem 0.375rem', flex: 1 }}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={creating}
                      style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}>
                      {creating ? '...' : '✓'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.625rem' }}
                      onClick={() => { setShowCreate(false); setCreateName(''); }}>
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    className="ws-dropdown-item"
                    onClick={() => setShowCreate(true)}
                  >
                    <span style={{ fontSize: '0.875rem', color: 'var(--c-accent)' }}>+</span>
                    <span style={{ color: 'var(--c-accent)' }}>Tạo workspace mới</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        {visibleItems.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname?.startsWith(item.href) ? 'active' : ''}`}
            style={{ animationDelay: `${i * 50}ms` }}
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
