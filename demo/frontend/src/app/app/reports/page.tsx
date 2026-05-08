'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

// ─── Types ──────────────────────────────────────────────

interface WeekData {
  week: number;
  label: string;
  weekStart: string;
  weekEnd: string;
  count: number;
}

interface MemberStat {
  userId: string;
  name: string;
  email: string;
  role: string;
  assigned: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

interface ReportsData {
  weeklyCompleted: WeekData[];
  memberStats: MemberStat[];
}

// ─── Component ──────────────────────────────────────────

export default function ReportsPage() {
  const workspace = useAuthStore((s) => s.workspace);

  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // ─── Data loading ─────────────────────────────────────

  const loadReports = useCallback(async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: ReportsData }>('/reports');
      setData(res.data);
    } catch {
      setError('Không thể tải báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // ─── Bar chart helpers ────────────────────────────────

  const maxCount = data
    ? Math.max(...data.weeklyCompleted.map((w) => w.count), 1)
    : 1;

  // ─── Render ───────────────────────────────────────────

  if (error) {
    return (
      <>
        <Header title="Reports" />
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
          <button className="btn btn-primary btn-sm" onClick={loadReports}>Thử lại</button>
        </div>
      </>
    );
  }

  if (loading || !data) {
    return (
      <>
        <Header title="Reports" />
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>Đang tải báo cáo...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Reports" />
      <div className="reports-page">

        {/* ─── Bar Chart: Tasks Completed ──────────────── */}
        <div className="card report-card">
          <h2 className="report-card-title">Tasks Completed</h2>
          <p className="report-card-subtitle">4 tuần gần nhất</p>

          <div className="bar-chart">
            {data.weeklyCompleted.map((week) => {
              const height = maxCount > 0 ? (week.count / maxCount) * 100 : 0;
              return (
                <div key={week.week} className="bar-chart-col">
                  <div className="bar-chart-value">{week.count}</div>
                  <div className="bar-chart-track">
                    <div
                      className="bar-chart-fill"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <div className="bar-chart-label">{week.label}</div>
                </div>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="report-summary-row">
            <div className="report-summary-item">
              <span className="report-summary-value">
                {data.weeklyCompleted.reduce((s, w) => s + w.count, 0)}
              </span>
              <span className="report-summary-label">Tổng completed</span>
            </div>
            <div className="report-summary-item">
              <span className="report-summary-value">
                {data.memberStats.reduce((s, m) => s + m.overdue, 0)}
              </span>
              <span className="report-summary-label" style={{ color: 'var(--c-danger)' }}>
                Task overdue
              </span>
            </div>
            <div className="report-summary-item">
              <span className="report-summary-value">
                {data.memberStats.length > 0
                  ? Math.round(
                      data.memberStats.reduce((s, m) => s + m.completionRate, 0) /
                      data.memberStats.filter((m) => m.assigned > 0).length || 1
                    )
                  : 0}%
              </span>
              <span className="report-summary-label">Avg completion rate</span>
            </div>
          </div>
        </div>

        {/* ─── Member Stats Table ─────────────────────── */}
        <div className="card report-card">
          <h2 className="report-card-title">Member Performance</h2>
          <p className="report-card-subtitle">Thống kê theo thành viên trong workspace</p>

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                  <th>Overdue</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.memberStats.map((member) => (
                  <tr
                    key={member.userId}
                    className={`report-table-row ${selectedMember === member.userId ? 'active' : ''}`}
                    onClick={() =>
                      setSelectedMember(
                        selectedMember === member.userId ? null : member.userId
                      )
                    }
                    style={{ cursor: 'pointer' }}
                    title="Click để xem task của thành viên"
                  >
                    <td>
                      <div className="report-member-cell">
                        <span className="report-member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="report-member-name">{member.name}</div>
                          <div className="report-member-role">{member.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="report-num">{member.assigned}</td>
                    <td className="report-num">{member.completed}</td>
                    <td className="report-num" style={{
                      color: member.overdue > 0 ? 'var(--c-danger)' : 'inherit',
                      fontWeight: member.overdue > 0 ? 700 : 400,
                    }}>
                      {member.overdue}
                    </td>
                    <td>
                      <div className="report-rate-cell">
                        <div className="report-rate-bar-track">
                          <div
                            className="report-rate-bar-fill"
                            style={{
                              width: `${member.completionRate}%`,
                              backgroundColor:
                                member.completionRate >= 80
                                  ? '#34d399'
                                  : member.completionRate >= 50
                                  ? '#e8a830'
                                  : '#f87171',
                            }}
                          />
                        </div>
                        <span className="report-rate-text">{member.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Member Task Detail (click to expand) ───── */}
        {selectedMember && (
          <MemberTaskList
            memberId={selectedMember}
            memberName={data.memberStats.find((m) => m.userId === selectedMember)?.name || ''}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </div>
    </>
  );
}

// ─── Sub-component: Member's Tasks (read-only) ──────────

interface MemberTaskListProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  project?: { name: string; color: string };
}

function MemberTaskList({ memberId, memberName, onClose }: MemberTaskListProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: TaskItem[] }>(`/tasks?assigneeId=${memberId}`)
      .then((res) => setTasks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId]);

  const STATUS_LABELS: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
  };

  const STATUS_COLORS: Record<string, string> = {
    TODO: '#5f5e5b',
    IN_PROGRESS: '#60a5fa',
    IN_REVIEW: '#e8a830',
    DONE: '#34d399',
  };

  return (
    <div className="card report-card" style={{ animation: 'fadeUp 0.3s var(--ease-out) forwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="report-card-title" style={{ marginBottom: 0 }}>
          Tasks của {memberName}
        </h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Đóng danh sách task"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : tasks.length === 0 ? (
        <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
          Không có task nào.
        </p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Project</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                return (
                  <tr key={task.id} className="report-table-row">
                    <td style={{ fontWeight: 500, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: `${STATUS_COLORS[task.status]}20`,
                        color: STATUS_COLORS[task.status],
                      }}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {task.priority}
                    </td>
                    <td style={{
                      color: isOverdue ? 'var(--c-danger)' : 'inherit',
                      fontWeight: isOverdue ? 700 : 400,
                      fontSize: '0.75rem',
                    }}>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {task.project ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: task.project.color, display: 'inline-block',
                          }} />
                          {task.project.name}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
