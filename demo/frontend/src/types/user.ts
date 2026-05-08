export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  joinedAt: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: 'MANAGER' | 'MEMBER';
  expiresAt: string;
  createdAt: string;
  inviteLink?: string;
}

export type ApiError = {
  error: string;
  details?: { field: string; message: string }[];
};
