'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Task, TaskStatus, Priority } from '@/types/task';

/** Task with isOverdue flag from backend */
interface MyTask extends Task {
  isOverdue?: boolean;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#5f5e5b',
  MEDIUM: '#60a5fa',
  HIGH: '#e8a830',
  URGENT: '#f87171',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const FILTER_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
] as const;

export default function MyTasksPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  // B1 fix: Call /my-tasks with filter param — backend handles sort + exclude DONE
  const loadTasks = useCallback(async () => {
    if (!user || !workspace) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: MyTask[] }>(`/my-tasks?filter=${filter}`);
      setTasks(res.data);
    } catch {
      setError('Không thể tải danh sách task. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [user, workspace, filter]); // M3 fix: filter in deps

  // M3 fix: re-fetch when filter changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Count tasks per filter (for badges) — use current loaded tasks for ALL counts
  const countByStatus = (status: string) => {
    if (status === 'ALL') return tasks.length;
    return tasks.filter((t) => t.status === status).length;
  };

  return (
    <>
      <Header title="My Tasks" />
      <div>
        {/* Filter tabs */}
        <div className="my-tasks-filters">
          {FILTER_TABS.map((f) => (
            <button
              key={f.key}
              id={`filter-${f.key.toLowerCase()}`}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* M1 fix: Error state with retry */}
        {error ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              opacity: 0.4,
            }}>⚠</div>
            <h2 style={{
              fontSize: '1rem',
              fontFamily: 'var(--font-display), Space Mono, monospace',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: 'var(--c-danger)',
            }}>
              Lỗi tải dữ liệu
            </h2>
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {error}
            </p>
            <button className="btn btn-primary btn-sm" onClick={loadTasks}>
              Thử lại
            </button>
          </div>
        ) : loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-dark" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>Đang tải...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              opacity: 0.3,
            }}>◉</div>
            <h2 style={{
              fontSize: '1rem',
              fontFamily: 'var(--font-display), Space Mono, monospace',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}>
              {filter === 'ALL' ? 'Bạn chưa có task nào' : `Không có task "${STATUS_LABELS[filter as TaskStatus]}"`}
            </h2>
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>
              Hãy liên hệ Manager để được assign công việc.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {/* B1 fix: tasks already sorted by backend, use isOverdue from API */}
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className="card fade-up task-card"
                onClick={() => router.push(`/app/projects/${task.projectId}`)}
                style={{
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  borderLeft: task.isOverdue
                    ? '3px solid var(--c-danger)'
                    : `3px solid ${PRIORITY_COLORS[task.priority]}`,
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    margin: 0,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{task.title}</h3>
                  <div className="task-meta">
                    {task.project && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          width: 6, height: 6,
                          borderRadius: '50%',
                          backgroundColor: task.project.color,
                          display: 'inline-block',
                          flexShrink: 0,
                          boxShadow: `0 0 4px ${task.project.color}66`,
                        }} />
                        {task.project.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span style={{
                        color: task.isOverdue ? 'var(--c-danger)' : 'inherit',
                        fontWeight: task.isOverdue ? 700 : 400,
                      }}>
                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                        {task.isOverdue && ' ● overdue'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-badges">
                  <span className="badge" style={{
                    backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                    color: PRIORITY_COLORS[task.priority],
                  }}>
                    {task.priority}
                  </span>
                  <span className="badge" style={{
                    background: 'var(--c-bg)',
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text-2)',
                  }}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
