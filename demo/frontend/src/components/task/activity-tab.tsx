'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { ActivityLog } from '@/types/task';

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'đã tạo task',
  UPDATED: 'đã cập nhật',
  STATUS_CHANGED: 'đã đổi trạng thái',
  DELETED: 'đã xóa task',
  COMMENTED: 'đã bình luận',
};

const FIELD_LABELS: Record<string, string> = {
  status: 'Trạng thái',
  title: 'Tiêu đề',
  description: 'Mô tả',
  priority: 'Mức ưu tiên',
  assignee: 'Người phụ trách',
  dueDate: 'Ngày hết hạn',
};

const STATUS_DISPLAY: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

interface ActivityTabProps {
  taskId: string;
  /** Trigger a refresh — increment this number to re-fetch */
  refreshTrigger?: number;
}

/**
 * ActivityTab — FR-10 (Slice C)
 * Displays timeline of all task changes: create, edit, status change, comment.
 * Activity logs cannot be deleted (no delete UI provided).
 */
export function ActivityTab({ taskId, refreshTrigger = 0 }: ActivityTabProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadActivities() {
    try {
      setLoading(true);
      const res = await api.get<{ data: ActivityLog[] }>(`/tasks/${taskId}/activities`);
      setActivities(res.data);
    } catch {
      // silently fail — activities are supplementary
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, [taskId, refreshTrigger]);

  function formatValue(field: string | null | undefined, value: string | null | undefined): string {
    if (!value) return '—';
    if (field === 'status') return STATUS_DISPLAY[value] || value;
    if (field === 'dueDate') {
      try {
        return new Date(value).toLocaleDateString('vi-VN');
      } catch {
        return value;
      }
    }
    // Truncate long values
    if (value.length > 60) return value.slice(0, 60) + '…';
    return value;
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <div
          style={{
            width: 20,
            height: 20,
            margin: '0 auto',
            border: '2px solid var(--c-border)',
            borderTopColor: 'var(--c-accent)',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--c-text-3)',
          fontSize: '0.8125rem',
          fontFamily: 'var(--font-display), Space Mono, monospace',
        }}
      >
        Chưa có hoạt động nào
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
      {activities.map((log, i) => (
        <div
          key={log.id}
          className="fade-up"
          style={{
            display: 'flex',
            gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)',
            fontSize: '0.75rem',
            color: 'var(--c-text-3)',
            animationDelay: `${i * 30}ms`,
          }}
        >
          {/* Timeline dot */}
          <div style={{ paddingTop: '0.25rem', flexShrink: 0 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor:
                  log.actionType === 'STATUS_CHANGED'
                    ? 'var(--c-accent)'
                    : log.actionType === 'CREATED'
                      ? '#34d399'
                      : 'var(--c-text-3)',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--c-text-2)' }}>
                {log.user?.name || 'Unknown'}
              </span>{' '}
              {/* Action label */}
              {log.actionType === 'CREATED' && ACTION_LABELS.CREATED}
              {log.actionType === 'DELETED' && ACTION_LABELS.DELETED}
              {log.actionType === 'COMMENTED' && ACTION_LABELS.COMMENTED}
              {(log.actionType === 'UPDATED' || log.actionType === 'STATUS_CHANGED') &&
                log.fieldChanged && (
                  <>
                    {ACTION_LABELS[log.actionType] || 'đã thay đổi'}{' '}
                    <strong style={{ color: 'var(--c-accent)' }}>
                      {FIELD_LABELS[log.fieldChanged] || log.fieldChanged}
                    </strong>
                    {log.oldValue && (
                      <>
                        {' '}
                        từ{' '}
                        <code
                          style={{
                            fontSize: '0.6875rem',
                            background: 'var(--c-surface)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                          }}
                        >
                          {formatValue(log.fieldChanged, log.oldValue)}
                        </code>
                      </>
                    )}
                    {log.newValue && (
                      <>
                        {' '}
                        thành{' '}
                        <code
                          style={{
                            fontSize: '0.6875rem',
                            background: 'var(--c-surface)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            color: 'var(--c-accent)',
                          }}
                        >
                          {formatValue(log.fieldChanged, log.newValue)}
                        </code>
                      </>
                    )}
                  </>
                )}
            </div>
            <div
              style={{
                fontSize: '0.625rem',
                marginTop: '0.125rem',
                fontFamily: 'var(--font-display), Space Mono, monospace',
                opacity: 0.7,
              }}
            >
              {new Date(log.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
