export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  archivedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string };
  taskCount?: number;
  doneCount?: number;
  _count?: { tasks: number };
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  project?: { id: string; name: string; color: string };
  assignee?: { id: string; name: string; email: string } | null;
  creator?: { id: string; name: string };
  activityLogs?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  actionType: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  priority?: Priority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  assigneeId?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
}
