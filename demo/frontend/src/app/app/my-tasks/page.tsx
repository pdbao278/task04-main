'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Task, TaskStatus, Priority } from '@/types/task';

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

export default function MyTasksPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  async function loadTasks() {
    if (!user || !workspace) return;
    try {
      setLoading(true);
      const res = await api.get<{ data: Task[] }>(`/tasks?assigneeId=${user.id}`);
      setTasks(res.data);
    } catch {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [user, workspace]);

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((t) => t.status !== 'DONE')
    .filter((t) => {
      if (filter === 'ALL') return true;
      return t.status === filter;
    })
    .sort((a, b) => {
      // Overdue first
      const aOverdue = a.dueDate && new Date(a.dueDate) < new Date();
      const bOverdue = b.dueDate && new Date(b.dueDate) < new Date();
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      // Then by due date ascending
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return 0;
    });

  return (
    <>
      <Header title="My Tasks" />
      <div>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'TODO', label: 'To Do' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'IN_REVIEW', label: 'In Review' },
          ].map((f) => (
            <button
              key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== 'ALL' && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>
                  ({tasks.filter((t) => t.status !== 'DONE' && (f.key === 'ALL' || t.status === f.key)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-dark" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>Đang tải...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
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
            {filteredTasks.map((task, i) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
              return (
                <div
                  key={task.id}
                  className="card fade-up"
                  onClick={() => router.push(`/app/projects/${task.projectId}`)}
                  style={{
                    cursor: 'pointer',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    borderLeft: isOverdue
                      ? '3px solid var(--c-danger)'
                      : `3px solid ${PRIORITY_COLORS[task.priority]}`,
                    animationDelay: `${i * 40}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(232,168,48,0.08)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      margin: 0,
                      lineHeight: 1.4,
                    }}>{task.title}</h3>
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      marginTop: '0.375rem',
                      fontSize: '0.6875rem',
                      color: 'var(--c-text-3)',
                      fontFamily: 'var(--font-display), Space Mono, monospace',
                    }}>
                      {task.project && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            width: 6, height: 6,
                            borderRadius: '50%',
                            backgroundColor: task.project.color,
                            display: 'inline-block',
                            boxShadow: `0 0 4px ${task.project.color}66`,
                          }} />
                          {task.project.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span style={{
                          color: isOverdue ? 'var(--c-danger)' : 'inherit',
                          fontWeight: isOverdue ? 700 : 400,
                        }}>
                          {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                          {isOverdue && ' ● overdue'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
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
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
