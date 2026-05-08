'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { Notification } from '@/types/task';

const NOTIFICATION_ICONS: Record<string, string> = {
  COMMENT: '💬',
  TASK_ASSIGNED: '📋',
  DUE_SOON: '⏰',
  MENTION: '@',
};

const POLL_INTERVAL = 5000; // 5s per PRD FR-09

/**
 * NotificationBell — FR-09 (Slice D)
 * - Badge counter for unread
 * - Dropdown list
 * - Mark-as-read on click
 * - Polling every 5s
 */
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ data: { notifications: Notification[]; unreadCount: number } }>('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silent — supplementary feature
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  async function handleMarkRead(notifId: string) {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }

  function formatTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={toggleDropdown}
        style={{
          position: 'relative',
          background: 'transparent',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-sm)',
          padding: '0.375rem 0.5rem',
          cursor: 'pointer',
          color: 'var(--c-text)',
          fontSize: '1rem',
          lineHeight: 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--c-accent)';
          e.currentTarget.style.backgroundColor = 'var(--c-surface)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--c-border)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        🔔
        {/* Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: 'var(--c-danger, #ef4444)',
              color: '#fff',
              fontSize: '0.5625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              fontFamily: 'var(--font-display), Space Mono, monospace',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            backgroundColor: 'var(--c-bg-raised)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-md)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--c-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-display), Space Mono, monospace',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--c-accent)',
              }}
            >
              Thông báo
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--c-text-3)',
                  fontFamily: 'var(--font-display), Space Mono, monospace',
                }}
              >
                {unreadCount} chưa đọc
              </span>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
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
          ) : notifications.length === 0 ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--c-text-3)',
                fontSize: '0.8125rem',
              }}
            >
              Không có thông báo
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.readAt) handleMarkRead(n.id);
                  }}
                  style={{
                    display: 'flex',
                    gap: '0.625rem',
                    width: '100%',
                    padding: '0.625rem 1rem',
                    background: n.readAt ? 'transparent' : 'var(--c-surface)',
                    border: 'none',
                    borderBottom: '1px solid var(--c-border)',
                    cursor: n.readAt ? 'default' : 'pointer',
                    textAlign: 'left',
                    color: 'var(--c-text)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!n.readAt) e.currentTarget.style.backgroundColor = 'var(--c-bg)';
                  }}
                  onMouseLeave={(e) => {
                    if (!n.readAt) e.currentTarget.style.backgroundColor = 'var(--c-surface)';
                  }}
                >
                  {/* Icon */}
                  <span
                    style={{
                      fontSize: '0.875rem',
                      flexShrink: 0,
                      marginTop: '0.125rem',
                      opacity: n.readAt ? 0.5 : 1,
                    }}
                  >
                    {NOTIFICATION_ICONS[n.type] || '📌'}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.4,
                        fontWeight: n.readAt ? 400 : 500,
                        opacity: n.readAt ? 0.6 : 1,
                      }}
                    >
                      {n.message}
                    </div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        color: 'var(--c-text-3)',
                        marginTop: '0.125rem',
                        fontFamily: 'var(--font-display), Space Mono, monospace',
                        opacity: 0.7,
                      }}
                    >
                      {formatTime(n.createdAt)}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.readAt && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'var(--c-accent)',
                        flexShrink: 0,
                        marginTop: '0.375rem',
                        boxShadow: '0 0 6px var(--c-accent)',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
