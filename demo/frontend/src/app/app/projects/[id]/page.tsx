'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Project, Task, CreateTaskInput, Priority, TaskStatus } from '@/types/task';
import type { WorkspaceMember } from '@/types/user';

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

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: '#5f5e5b',
  IN_PROGRESS: '#60a5fa',
  IN_REVIEW: '#e8a830',
  DONE: '#34d399',
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const workspace = useAuthStore((s) => s.workspace);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    title: '', description: '', projectId, priority: 'MEDIUM', assigneeId: null, dueDate: null,
  });
  const [taskError, setTaskError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Task detail slide-over
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [projRes, tasksRes, membersRes] = await Promise.all([
        api.get<{ data: Project }>(`/projects/${projectId}`),
        api.get<{ data: Task[] }>(`/tasks?projectId=${projectId}`),
        api.get<{ data: { members: WorkspaceMember[] } }>(`/workspaces/${workspace?.id}/members`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data.members);
    } catch {
      router.push('/app/projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (workspace) loadData();
  }, [workspace, projectId]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setTaskError('');
    setSubmitting(true);
    try {
      await api.post('/tasks', { ...taskForm, projectId });
      setTaskForm({ title: '', description: '', projectId, priority: 'MEDIUM', assigneeId: null, dueDate: null });
      setShowTaskForm(false);
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: { field: string; message: string }[] };
      setTaskError(apiErr?.error || apiErr?.details?.[0]?.message || 'Lỗi khi tạo task');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      loadData();
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask!, status });
      }
    } catch {
      console.error('Status change failed');
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Bạn có chắc muốn xóa task này?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setSelectedTask(null);
      loadData();
    } catch {
      console.error('Delete failed');
    }
  }

  async function openTaskDetail(taskId: string) {
    try {
      const res = await api.get<{ data: Task }>(`/tasks/${taskId}`);
      setSelectedTask(res.data);
    } catch {
      console.error('Failed to load task detail');
    }
  }

  function isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  if (!project) return null;

  const groupedTasks: Record<TaskStatus, Task[]> = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push('/app/projects')}
        >
          ← Back
        </button>
        <div style={{
          width: 8, height: 8,
          borderRadius: '50%',
          backgroundColor: project.color,
          boxShadow: `0 0 8px ${project.color}66`,
        }} />
        <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
        {project.archivedAt && <span className="badge badge-warning">Archived</span>}
      </div>

      {project.description && (
        <p style={{ color: 'var(--c-text-3)', marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
          {project.description}
        </p>
      )}

      {/* New Task button */}
      {!project.archivedAt && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
            {showTaskForm ? '✕ Đóng' : '+ Tạo task'}
          </button>
        </div>
      )}

      {/* Task creation form */}
      {showTaskForm && (
        <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem',
            fontFamily: 'var(--font-display), Space Mono, monospace',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--c-accent)',
          }}>
            Tạo task mới
          </h3>
          {taskError && <div className="error-box">{taskError}</div>}
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label className="label">Title *</label>
              <input
                className="input"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Tiêu đề task..."
                maxLength={200}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Mô tả (Markdown)</label>
              <textarea
                className="input"
                value={taskForm.description || ''}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Mô tả chi tiết..."
                rows={3}
                maxLength={5000}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Assignee</label>
                <select
                  className="input"
                  value={taskForm.assigneeId || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value || null })}
                >
                  <option value="">Chưa giao</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due date</label>
                <input
                  type="date"
                  className="input"
                  value={taskForm.dueDate?.split('T')[0] || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo task'}
            </button>
          </form>
        </div>
      )}

      {/* Kanban columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {(Object.keys(groupedTasks) as TaskStatus[]).map((status) => (
          <div key={status}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.75rem', padding: '0.375rem 0',
              borderBottom: `2px solid ${STATUS_COLORS[status]}`,
            }}>
              <span style={{
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-display), Space Mono, monospace',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}>{STATUS_LABELS[status]}</span>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display), Space Mono, monospace',
                color: STATUS_COLORS[status],
                background: `${STATUS_COLORS[status]}18`,
                padding: '1px 6px',
                borderRadius: 'var(--r-sm)',
              }}>
                {groupedTasks[status].length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', minHeight: 80 }}>
              {groupedTasks[status].map((task, i) => (
                <div
                  key={task.id}
                  className="card fade-up"
                  onClick={() => openTaskDetail(task.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '0.625rem 0.75rem',
                    borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                    animationDelay: `${i * 40}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = PRIORITY_COLORS[task.priority];
                    e.currentTarget.style.boxShadow = `0 0 12px ${PRIORITY_COLORS[task.priority]}22`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <h4 style={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    margin: 0,
                    lineHeight: 1.4,
                  }}>{task.title}</h4>
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge" style={{
                      backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                      color: PRIORITY_COLORS[task.priority],
                    }}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span style={{
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-display), Space Mono, monospace',
                        color: isOverdue(task.dueDate) && task.status !== 'DONE' ? 'var(--c-danger)' : 'var(--c-text-3)',
                        fontWeight: isOverdue(task.dueDate) && task.status !== 'DONE' ? 700 : 400,
                      }}>
                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                        {isOverdue(task.dueDate) && task.status !== 'DONE' && ' ●'}
                      </span>
                    )}
                  </div>
                  {task.assignee && (
                    <div style={{
                      fontSize: '0.6875rem',
                      color: 'var(--c-text-3)',
                      marginTop: '0.25rem',
                      fontFamily: 'var(--font-display), Space Mono, monospace',
                    }}>
                      → {task.assignee.name}
                    </div>
                  )}
                </div>
              ))}
              {groupedTasks[status].length === 0 && (
                <div style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  color: 'var(--c-text-3)',
                  fontSize: '0.6875rem',
                  border: '1px dashed var(--c-border-strong)',
                  borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-display), Space Mono, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Trống
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Slide-over */}
      {selectedTask && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
            onClick={() => setSelectedTask(null)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: '440px', maxWidth: '90vw',
            backgroundColor: 'var(--c-bg-raised)',
            borderLeft: '1px solid var(--c-border)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
            zIndex: 999, overflowY: 'auto', padding: '1.5rem',
            animation: 'slideIn 0.3s var(--ease-out)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: '1.5rem',
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontFamily: 'var(--font-display), Space Mono, monospace',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
                flex: 1,
                paddingRight: '0.5rem',
              }}>{selectedTask.title}</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedTask(null)}
              >✕</button>
            </div>

            {/* Status changer */}
            <div className="form-group">
              <label className="label">Status</label>
              <select
                className="input"
                value={selectedTask.status}
                onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
              >
                {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* Details grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'var(--c-bg)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--c-border)',
            }}>
              <div>
                <span className="label" style={{ marginBottom: '0.25rem' }}>Priority</span>
                <span className="badge" style={{
                  backgroundColor: `${PRIORITY_COLORS[selectedTask.priority]}20`,
                  color: PRIORITY_COLORS[selectedTask.priority],
                }}>
                  {selectedTask.priority}
                </span>
              </div>
              <div>
                <span className="label" style={{ marginBottom: '0.25rem' }}>Assignee</span>
                <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  {selectedTask.assignee?.name || '—'}
                </div>
              </div>
              <div>
                <span className="label" style={{ marginBottom: '0.25rem' }}>Due date</span>
                <div style={{
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  color: selectedTask.dueDate && isOverdue(selectedTask.dueDate) && selectedTask.status !== 'DONE'
                    ? 'var(--c-danger)' : 'var(--c-text)',
                }}>
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString('vi-VN')
                    : '—'}
                  {selectedTask.dueDate && isOverdue(selectedTask.dueDate) && selectedTask.status !== 'DONE' && ' (Overdue)'}
                </div>
              </div>
              <div>
                <span className="label" style={{ marginBottom: '0.25rem' }}>Created by</span>
                <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  {selectedTask.creator?.name}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 className="label">Mô tả</h4>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--c-bg)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-md)',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  color: 'var(--c-text-2)',
                }}>
                  {selectedTask.description}
                </div>
              </div>
            )}

            {/* Activity Log */}
            {selectedTask.activityLogs && selectedTask.activityLogs.length > 0 && (
              <div>
                <h4 className="label">Activity Log</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {selectedTask.activityLogs.map((log) => (
                    <div key={log.id} style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--c-bg)',
                      border: '1px solid var(--c-border)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--c-text-3)',
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--c-text-2)' }}>{log.user?.name}</span>
                      {' '}
                      {log.actionType === 'CREATED' && 'đã tạo task'}
                      {log.actionType === 'UPDATED' && log.fieldChanged && (
                        <>
                          đã đổi <strong style={{ color: 'var(--c-accent)' }}>{log.fieldChanged}</strong>
                          {log.oldValue && <> từ <code style={{
                            fontSize: '0.6875rem',
                            background: 'var(--c-surface)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                          }}>{log.oldValue}</code></>}
                          {log.newValue && <> thành <code style={{
                            fontSize: '0.6875rem',
                            background: 'var(--c-surface)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            color: 'var(--c-accent)',
                          }}>{log.newValue}</code></>}
                        </>
                      )}
                      {log.actionType === 'DELETED' && 'đã xóa task'}
                      <div style={{
                        fontSize: '0.625rem',
                        marginTop: '0.125rem',
                        fontFamily: 'var(--font-display), Space Mono, monospace',
                      }}>
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete button */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--c-border)' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
                ✕ Xóa task
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
