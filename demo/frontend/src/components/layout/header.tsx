'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';
import { NotificationBell } from './notification-bell';

interface SearchResult {
  id: string;
  title: string;
  status: string;
  priority: string;
  project?: { id: string; name: string; color: string };
  assignee?: { id: string; name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#5f5e5b',
  IN_PROGRESS: '#60a5fa',
  IN_REVIEW: '#e8a830',
  DONE: '#34d399',
};

export function Header({ title }: { title: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);

  // Search state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Debounce 300ms ────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ─── Fetch search results ─────────────────────────────

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    api.get<{ data: SearchResult[] }>(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then((res) => {
        setResults(res.data);
        setIsOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // ─── Click outside to close ───────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Keyboard navigation ─────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  // ─── Logout ───────────────────────────────────────────

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

      {/* ─── Global Search ─────────────────────────────── */}
      <div className="global-search" ref={searchRef}>
        <div className="global-search-input-wrap">
          <span className="global-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            id="global-search"
            type="search"
            className="global-search-input"
            placeholder="Tìm task... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Tìm kiếm task trong workspace"
            aria-expanded={isOpen}
            aria-controls="search-results"
            role="combobox"
          />
          {loading && <span className="global-search-spinner" />}
        </div>

        {/* Dropdown results */}
        {isOpen && (
          <div
            id="search-results"
            className="global-search-dropdown"
            role="listbox"
            aria-label="Kết quả tìm kiếm"
          >
            {results.length === 0 ? (
              <div className="global-search-empty">
                Không tìm thấy task nào
              </div>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  className="global-search-item"
                  role="option"
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                    // Navigate to task's project (or my-tasks for now)
                    router.push(`/app/projects`);
                  }}
                >
                  <span
                    className="global-search-status-dot"
                    style={{ backgroundColor: STATUS_COLORS[r.status] }}
                  />
                  <div className="global-search-item-content">
                    <span className="global-search-item-title">{r.title}</span>
                    <span className="global-search-item-meta">
                      {r.project?.name}
                      {r.assignee ? ` · ${r.assignee.name}` : ''}
                    </span>
                  </div>
                  <span className="global-search-item-priority" style={{
                    fontSize: '0.5625rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    opacity: 0.6,
                  }}>
                    {r.priority}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="header-user">
        <NotificationBell />
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--c-text-2)',
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
