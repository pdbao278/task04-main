'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Task, TaskStatus, Priority, Project } from '@/types/task';
import type { WorkspaceMember } from '@/types/user';

// ─── Constants ──────────────────────────────────────────

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'TODO', label: 'To Do', color: '#5f5e5b' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#60a5fa' },
  { key: 'IN_REVIEW', label: 'In Review', color: '#e8a830' },
  { key: 'DONE', label: 'Done', color: '#34d399' },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#5f5e5b',
  MEDIUM: '#60a5fa',
  HIGH: '#e8a830',
  URGENT: '#f87171',
};

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// ─── Component ──────────────────────────────────────────

export default function TeamBoardPage() {
  const workspace = useAuthStore((s) => s.workspace);

  // Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null); // taskId being updated

  // Filters
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Drag state
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // ─── M2: Debounce search 300ms ────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── M3: Load members & projects once ─────────────────

  useEffect(() => {
    if (!workspace) return;
    Promise.all([
      api.get<{ data: { members: WorkspaceMember[] } }>(`/workspaces/${workspace.id}/members`),
      api.get<{ data: Project[] }>('/projects'),
    ]).then(([membersRes, projectsRes]) => {
      setMembers(membersRes.data.members || []);
      setProjects(projectsRes.data);
    }).catch(() => {});
  }, [workspace]);

  // ─── Load tasks (on filter/search change) ─────────────

  const loadTasks = useCallback(async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterAssignee) params.set('assigneeId', filterAssignee);
      if (filterProject) params.set('projectId', filterProject);
      if (filterPriority) params.set('priority', filterPriority);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const qs = params.toString();
      const res = await api.get<{ data: Task[] }>(`/tasks${qs ? `?${qs}` : ''}`);
      setTasks(res.data);
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [workspace, filterAssignee, filterProject, filterPriority, debouncedSearch]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Auto-refresh every 5 seconds (PRD: "cập nhật trong vòng 5 giây")
  useEffect(() => {
    if (!workspace) return;
    const interval = setInterval(() => {
      const params = new URLSearchParams();
      if (filterAssignee) params.set('assigneeId', filterAssignee);
      if (filterProject) params.set('projectId', filterProject);
      if (filterPriority) params.set('priority', filterPriority);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const qs = params.toString();

      api.get<{ data: Task[] }>(`/tasks${qs ? `?${qs}` : ''}`)
        .then((res) => setTasks(res.data))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [workspace, filterAssignee, filterProject, filterPriority, debouncedSearch]);


  // ─── Status change (click dropdown or drag) ───────────

  const changeStatus = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setUpdating(taskId);

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch {
      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
    } finally {
      setUpdating(null);
    }
  };

  // ─── Drag & Drop handlers ────────────────────────────

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Make drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTask) {
      changeStatus(draggedTask, status);
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // ─── Group tasks by status ────────────────────────────

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  // ─── Render ───────────────────────────────────────────

  const hasActiveFilters = filterAssignee || filterProject || filterPriority || searchQuery;

  return (
    <>
      <Header title="Team Board" />
      <div>
        {/* ─── Filters ──────────────────────────────────── */}
        <div className="board-filters">
          {/* Search */}
          <div className="board-filter-item board-search">
            <input
              id="board-search"
              type="search"
              className="input"
              placeholder="Tìm task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
              aria-label="Tìm task trong board"
            />
          </div>

          {/* Assignee filter */}
          <div className="board-filter-item">
            <select
              id="filter-assignee"
              className="input"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
              aria-label="Lọc theo thành viên"
            >
              <option value="">Tất cả thành viên</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Project filter */}
          <div className="board-filter-item">
            <select
              id="filter-project"
              className="input"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
              aria-label="Lọc theo project"
            >
              <option value="">Tất cả project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div className="board-filter-item">
            <select
              id="filter-priority"
              className="input"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
              aria-label="Lọc theo priority"
            >
              <option value="">Tất cả priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setFilterAssignee('');
                setFilterProject('');
                setFilterPriority('');
                setSearchQuery('');
              }}
            >
              ✕ Xóa filter
            </button>
          )}
        </div>

        {/* ─── Board ────────────────────────────────────── */}
        {error ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}>⚠</div>
            <h2 style={{
              fontSize: '1rem',
              fontFamily: 'var(--font-display), Space Mono, monospace',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: 'var(--c-danger)',
            }}>Lỗi tải dữ liệu</h2>
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {error}
            </p>
            <button className="btn btn-primary btn-sm" onClick={loadTasks}>Thử lại</button>
          </div>
        ) : loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-dark" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>Đang tải board...</p>
          </div>
        ) : (
          <div className="kanban-board">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus(col.key);
              const isDragOver = dragOverColumn === col.key;

              return (
                <div
                  key={col.key}
                  className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {/* Column header */}
                  <div className="kanban-column-header">
                    <span
                      className="kanban-column-dot"
                      style={{ backgroundColor: col.color, boxShadow: `0 0 6px ${col.color}44` }}
                    />
                    <span className="kanban-column-title">{col.label}</span>
                    <span className="kanban-column-count">{colTasks.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="kanban-cards">
                    {colTasks.length === 0 ? (
                      <div className="kanban-empty">
                        Chưa có task
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                        const isDragging = draggedTask === task.id;
                        const isUpdating = updating === task.id;

                        return (
                          <div
                            key={task.id}
                            className={`kanban-card ${isDragging ? 'dragging' : ''} ${isUpdating ? 'updating' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            style={{
                              borderLeft: isOverdue
                                ? '3px solid var(--c-danger)'
                                : `3px solid ${PRIORITY_COLORS[task.priority]}`,
                            }}
                          >
                            {/* Title */}
                            <div className="kanban-card-title">{task.title}</div>

                            {/* Meta row */}
                            <div className="kanban-card-meta">
                              {task.project && (
                                <span className="kanban-card-project">
                                  <span
                                    className="kanban-card-dot"
                                    style={{
                                      backgroundColor: task.project.color,
                                      boxShadow: `0 0 3px ${task.project.color}66`,
                                    }}
                                  />
                                  {task.project.name}
                                </span>
                              )}
                              {task.dueDate && (
                                <span style={{
                                  color: isOverdue ? 'var(--c-danger)' : 'inherit',
                                  fontWeight: isOverdue ? 700 : 400,
                                }}>
                                  {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>

                            {/* Bottom row: assignee + priority + status dropdown (mobile fallback) */}
                            <div className="kanban-card-footer">
                              {task.assignee && (
                                <span className="kanban-card-assignee" title={task.assignee.name}>
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </span>
                              )}

                              <span className="badge" style={{
                                backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                                color: PRIORITY_COLORS[task.priority],
                                fontSize: '0.5625rem',
                              }}>
                                {task.priority}
                              </span>

                              {/* Mobile fallback: click dropdown to change status */}
                              <select
                                className="kanban-status-select"
                                value={task.status}
                                onChange={(e) => changeStatus(task.id, e.target.value as TaskStatus)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Change status for ${task.title}`}
                              >
                                {COLUMNS.map((c) => (
                                  <option key={c.key} value={c.key}>{c.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
