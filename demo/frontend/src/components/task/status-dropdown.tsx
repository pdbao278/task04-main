'use client';

import { useState } from 'react';
import type { TaskStatus } from '@/types/task';

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

interface StatusDropdownProps {
  taskId: string;
  currentStatus: TaskStatus;
  canChangeStatus: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

/**
 * StatusDropdown — FR-05 (Slice C)
 * - Assignee or Manager/Admin can change status
 * - Non-assignee Members see disabled dropdown with tooltip
 * - Optimistic UI: updates immediately, rolls back on failure
 */
export function StatusDropdown({
  taskId,
  currentStatus,
  canChangeStatus,
  onStatusChange,
}: StatusDropdownProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(currentStatus);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when currentStatus changes externally
  if (currentStatus !== optimisticStatus && !isChanging) {
    setOptimisticStatus(currentStatus);
  }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as TaskStatus;
    if (newStatus === optimisticStatus) return;

    const previousStatus = optimisticStatus;
    setError(null);

    // Optimistic update
    setOptimisticStatus(newStatus);
    setIsChanging(true);

    try {
      await onStatusChange(taskId, newStatus);
    } catch {
      // Rollback on failure
      setOptimisticStatus(previousStatus);
      setError('Không thể đổi trạng thái. Thử lại sau.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
        title={
          !canChangeStatus
            ? 'Chỉ assignee hoặc Manager mới có thể đổi trạng thái'
            : undefined
        }
      >
        {/* Status dot indicator */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: STATUS_COLORS[optimisticStatus],
            boxShadow: `0 0 6px ${STATUS_COLORS[optimisticStatus]}88`,
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
        />

        <select
          id="status-dropdown"
          className="input"
          value={optimisticStatus}
          onChange={handleChange}
          disabled={!canChangeStatus || isChanging}
          style={{
            opacity: canChangeStatus ? 1 : 0.5,
            cursor: canChangeStatus ? 'pointer' : 'not-allowed',
            borderColor: STATUS_COLORS[optimisticStatus],
            minWidth: 120,
            transition: 'border-color 0.3s ease',
          }}
        >
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {/* Spinner during change */}
        {isChanging && (
          <div
            style={{
              width: 14,
              height: 14,
              border: '2px solid var(--c-border)',
              borderTopColor: 'var(--c-accent)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '0.25rem',
            padding: '0.375rem 0.625rem',
            backgroundColor: 'var(--c-danger)',
            color: '#fff',
            fontSize: '0.6875rem',
            borderRadius: 'var(--r-sm)',
            whiteSpace: 'nowrap',
            animation: 'fadeIn 0.2s ease',
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
