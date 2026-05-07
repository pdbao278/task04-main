import { create } from 'zustand';
import type { User, Workspace } from '@/types/user';

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setWorkspace: (workspace: Workspace | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  selectWorkspace: (workspace: Workspace) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspace: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setWorkspace: (workspace) => set({ workspace }),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('workspaceId');
    // Trigger storage event for cross-tab sync
    localStorage.setItem('logout', Date.now().toString());
    set({ user: null, workspace: null, isAuthenticated: false });
  },

  selectWorkspace: (workspace) => {
    localStorage.setItem('workspaceId', workspace.id);
    set({ workspace });
  },
}));
