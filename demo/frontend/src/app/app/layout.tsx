'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { api } from '@/lib/api-client';
import type { Workspace } from '@/types/user';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const selectWorkspace = useAuthStore((s) => s.selectWorkspace);
  const workspace = useAuthStore((s) => s.workspace);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [needsWorkspace, setNeedsWorkspace] = useState(false);
  const [initDone, setInitDone] = useState(false);

  // ─── Create workspace form state ──────────────────────
  const [wsName, setWsName] = useState('');
  const [wsCreating, setWsCreating] = useState(false);
  const [wsError, setWsError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    async function init() {
      try {
        const userRes = await api.get<{ data: { id: string; email: string; name: string } }>('/auth/me');
        setUser(userRes.data);

        const wsRes = await api.get<{ data: Workspace[] }>('/workspaces');
        setWorkspaces(wsRes.data);

        if (wsRes.data.length > 0) {
          const savedWsId = localStorage.getItem('workspaceId');
          const ws = wsRes.data.find((w) => w.id === savedWsId) || wsRes.data[0];
          selectWorkspace(ws);
        } else {
          setNeedsWorkspace(true);
        }
      } catch {
        router.push('/login');
      } finally {
        setInitDone(true);
      }
    }

    init();
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [children]);

  // ─── Create workspace handler ─────────────────────────

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!wsName.trim()) return;
    setWsCreating(true);
    setWsError('');
    try {
      const res = await api.post<{ data: Workspace }>('/workspaces', { name: wsName.trim() });
      selectWorkspace(res.data);
      setWorkspaces((prev) => [...prev, res.data]);
      setNeedsWorkspace(false);
    } catch {
      setWsError('Không thể tạo workspace. Thử lại.');
    } finally {
      setWsCreating(false);
    }
  }

  // ─── Switch workspace ─────────────────────────────────

  function handleSwitchWorkspace(ws: Workspace) {
    selectWorkspace(ws);
    window.location.reload();
  }

  // ─── Create workspace (from sidebar) ──────────────────

  async function handleCreateWorkspaceSidebar(name: string) {
    const res = await api.post<{ data: Workspace }>('/workspaces', { name });
    const newWs = res.data;
    setWorkspaces((prev) => [...prev, newWs]);
    selectWorkspace(newWs);
    window.location.reload();
  }

  // ─── Rename workspace ─────────────────────────────────

  async function handleRenameWorkspace(id: string, name: string) {
    await api.patch(`/workspaces/${id}`, { name });
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
    if (workspace?.id === id) {
      selectWorkspace({ ...workspace, name });
    }
  }

  // ─── Delete workspace ─────────────────────────────────

  async function handleDeleteWorkspace(id: string) {
    await api.delete(`/workspaces/${id}`);
    const remaining = workspaces.filter((w) => w.id !== id);
    setWorkspaces(remaining);
    if (workspace?.id === id) {
      if (remaining.length > 0) {
        selectWorkspace(remaining[0]);
        window.location.reload();
      } else {
        setNeedsWorkspace(true);
      }
    }
  }

  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
    return null;
  }

  // ─── No workspace → creation screen ───────────────────

  if (needsWorkspace) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '440px' }}>
          <h1 className="auth-title">Tạo Workspace</h1>
          <p className="auth-subtitle">
            Tạo workspace đầu tiên để bắt đầu quản lý công việc
          </p>
          {wsError && <div className="error-box">{wsError}</div>}
          <form onSubmit={handleCreateWorkspace}>
            <div className="form-group">
              <label className="label">Tên workspace</label>
              <input
                className="input"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="Ví dụ: Đội phát triển"
                required
                autoFocus
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={wsCreating}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {wsCreating ? 'Đang tạo...' : 'Tạo workspace'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Loading init ─────────────────────────────────────

  if (!initDone) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>Đang khởi tạo...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      {/* Mobile hamburger toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        className={sidebarOpen ? 'open' : ''}
        workspaces={workspaces}
        onSwitchWorkspace={handleSwitchWorkspace}
        onCreateWorkspace={handleCreateWorkspaceSidebar}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

