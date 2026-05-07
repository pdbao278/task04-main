'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user info and workspaces
    async function init() {
      try {
        const userRes = await api.get<{ data: { id: string; email: string; name: string } }>('/auth/me');
        setUser(userRes.data);

        // Load workspaces
        const wsRes = await api.get<{ data: Workspace[] }>('/workspaces');
        if (wsRes.data.length > 0) {
          // Select saved workspace or first one
          const savedWsId = localStorage.getItem('workspaceId');
          const ws = wsRes.data.find((w) => w.id === savedWsId) || wsRes.data[0];
          selectWorkspace(ws);
        }
      } catch {
        router.push('/login');
      }
    }

    init();
  }, []);

  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
    return null; // Will redirect
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
