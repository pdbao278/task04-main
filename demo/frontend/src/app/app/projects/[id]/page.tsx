'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Header } from '@/components/layout/header';
import { StatusDropdown } from '@/components/task/status-dropdown';
import { ActivityTab } from '@/components/task/activity-tab';
import { CommentTab } from '@/components/task/comment-tab';
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
  const currentUser = useAuthStore((s) => s.user);
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
  const [activityRefresh, setActivityRefresh] = useState(0);
  const [detailTab, setDetailTab] = useState<'comments' | 'activity'>('comments');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    priority: Priority;
    assigneeId: string | null;
    dueDate: string | null;
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: null,
    dueDate: null,
  });
  const [editError, setEditError] = useState('');
  const [updatingTask, setUpdatingTask] = useState(false);

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
    // Use the dedicated status endpoint with permission check
    await api.patch(`/tasks/${taskId}/status`, { status });
    loadData();
    setActivityRefresh((n) => n + 1);
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask!, status });
    }
  }

  /**
   * FR-05: Permission check — can user change this task's status?
   * Admin / Manager can change any task
   * Member can only change tasks assigned to them
   */
  function canChangeTaskStatus(task: Task): boolean {
    if (!workspace || !currentUser) return false;
    const role = workspace.role;
    if (role === 'ADMIN' || role === 'MANAGER') return true;
    return task.assigneeId === currentUser.id;
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
      setIsEditingTask(false);
    } catch {
      console.error('Failed to load task detail');
    }
  }

  function startEditing() {
    if (!selectedTask) return;
    setEditForm({
      title: selectedTask.title,
      description: selectedTask.description || '',
      priority: selectedTask.priority,
      assigneeId: selectedTask.assigneeId || '',
      dueDate: selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '',
    });
    setEditError('');
    setIsEditingTask(true);
  }

  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTask) return;
    setEditError('');
    setUpdatingTask(true);
    try {
      const res = await api.patch<{ data: Task }>(`/tasks/${selectedTask.id}`, {
        title: editForm.title,
        description: editForm.description || null,
        priority: editForm.priority,
        assigneeId: editForm.assigneeId || null,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
      });
      setSelectedTask(res.data);
      setIsEditingTask(false);
      loadData();
      setActivityRefresh((n) => n + 1);
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: { field: string; message: string }[] };
      setEditError(apiErr?.error || apiErr?.details?.[0]?.message || 'Lỗi khi cập nhật task');
    } finally {
      setUpdatingTask(false);
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
    <>
      <Header title={project.name} />

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
        <h2 style={{
          fontFamily: 'var(--font-display), Space Mono, monospace',
          fontWeight: 700,
          margin: 0,
          fontSize: '1rem',
          letterSpacing: '-0.02em',
        }}>{project.name}</h2>
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
                    minHeight: '2.25rem',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>{task.title}</h4>
                  <div style={{
                    display: 'flex', gap: '0.375rem', marginTop: '0.375rem',
                    alignItems: 'center', minHeight: '1.25rem'
                  }}>
                    <span className="badge" style={{
                      backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                      color: PRIORITY_COLORS[task.priority],
                    }}>
                      {task.priority}
                    </span>
                    {task.dueDate ? (
                      <span style={{
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-display), Space Mono, monospace',
                        color: isOverdue(task.dueDate) && task.status !== 'DONE' ? 'var(--c-danger)' : 'var(--c-text-3)',
                        fontWeight: isOverdue(task.dueDate) && task.status !== 'DONE' ? 700 : 400,
                      }}>
                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                        {isOverdue(task.dueDate) && task.status !== 'DONE' && ' ●'}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-display), Space Mono, monospace',
                        color: 'var(--c-text-3)',
                        opacity: 0.4,
                      }}>
                        Không có hạn
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.6875rem',
                    color: 'var(--c-text-3)',
                    marginTop: '0.25rem',
                    fontFamily: 'var(--font-display), Space Mono, monospace',
                    minHeight: '1rem',
                  }}>
                    {task.assignee ? (
                      <span>→ {task.assignee.name}</span>
                    ) : (
                      <span style={{ opacity: 0.4 }}>→ Chưa giao</span>
                    )}
                  </div>
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
            boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
            zIndex: 999, overflowY: 'auto', padding: '1.5rem',
            animation: 'slideIn 0.3s var(--ease-out)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: '1.5rem',
            }}>
              {isEditingTask ? (
                <h2 style={{
                  fontSize: '1.125rem',
                  fontFamily: 'var(--font-display), Space Mono, monospace',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--c-accent)',
                }}>Chỉnh sửa task</h2>
              ) : (
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
              )}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!isEditingTask && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={startEditing}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      ✏ Sửa
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--c-danger)' }}
                    >
                      ✕ Xóa
                    </button>
                  </>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSelectedTask(null);
                    setIsEditingTask(false);
                  }}
                >✕</button>
              </div>
            </div>

            {isEditingTask ? (
              <form onSubmit={handleUpdateTask}>
                {editError && <div className="error-box" style={{ marginBottom: '1rem' }}>{editError}</div>}
                
                <div className="form-group">
                  <label className="label">Tiêu đề *</label>
                  <input
                    className="input"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Tiêu đề task..."
                    maxLength={200}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Mô tả (Markdown)</label>
                  <textarea
                    className="input"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Mô tả chi tiết..."
                    rows={4}
                    maxLength={5000}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'var(--c-bg)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--c-border)',
                }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Priority</label>
                    <select
                      className="input"
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Priority })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Assignee</label>
                    <select
                      className="input"
                      value={editForm.assigneeId || ''}
                      onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value || null })}
                    >
                      <option value="">Chưa giao</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                    <label className="label">Due date</label>
                    <input
                      type="date"
                      className="input"
                      value={editForm.dueDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value || null })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <button className="btn btn-primary" type="submit" disabled={updatingTask} style={{ flex: 1 }}>
                    {updatingTask ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setIsEditingTask(false)}
                    style={{ border: '1px solid var(--c-border)' }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Status changer — FR-05 with permission check */}
                <div className="form-group">
                  <label className="label">Status</label>
                  <StatusDropdown
                    taskId={selectedTask.id}
                    currentStatus={selectedTask.status}
                    canChangeStatus={canChangeTaskStatus(selectedTask)}
                    onStatusChange={handleStatusChange}
                  />
                  {!canChangeTaskStatus(selectedTask) && (
                    <div style={{
                      fontSize: '0.6875rem',
                      color: 'var(--c-text-3)',
                      marginTop: '0.25rem',
                      fontStyle: 'italic',
                    }}>Chỉ assignee hoặc Manager mới có thể đổi trạng thái</div>
                  )}
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
              </>
            )}

            {/* Tabs: Comments + Activity — FR-06, FR-10 */}
            <div>
              <div style={{
                display: 'flex', gap: '0.25rem', marginBottom: '0.75rem',
                borderBottom: '1px solid var(--c-border)',
              }}>
                {(['comments', 'activity'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: detailTab === tab ? '2px solid var(--c-accent)' : '2px solid transparent',
                      color: detailTab === tab ? 'var(--c-accent)' : 'var(--c-text-3)',
                      fontWeight: detailTab === tab ? 700 : 400,
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-display), Space Mono, monospace',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tab === 'comments' ? 'Comments' : 'Activity Log'}
                  </button>
                ))}
              </div>

              {detailTab === 'comments' ? (
                <CommentTab
                  taskId={selectedTask.id}
                  refreshTrigger={activityRefresh}
                  onCommentCreated={() => setActivityRefresh((n) => n + 1)}
                />
              ) : (
                <ActivityTab taskId={selectedTask.id} refreshTrigger={activityRefresh} />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
