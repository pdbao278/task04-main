'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Comment } from '@/types/task';
import type { WorkspaceMember } from '@/types/user';

interface CommentTabProps {
  taskId: string;
  refreshTrigger?: number;
  onCommentCreated?: () => void;
}

/** Escape HTML entities to prevent XSS when using dangerouslySetInnerHTML */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * CommentTab — FR-06 (Slice D)
 * - Any workspace member can comment
 * - Plain text + @mention
 * - @mention autocomplete dropdown
 * - Comments are append-only (no edit/delete per spec A-04)
 */
export function CommentTab({ taskId, refreshTrigger = 0, onCommentCreated }: CommentTabProps) {
  const currentUser = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load comments
  async function loadComments() {
    try {
      setLoading(true);
      const res = await api.get<{ data: Comment[] }>(`/tasks/${taskId}/comments`);
      setComments(res.data);
    } catch {
      // supplementary
    } finally {
      setLoading(false);
    }
  }

  // Load workspace members for mention autocomplete
  async function loadMembers() {
    if (!workspace) return;
    try {
      const res = await api.get<{ data: { members: WorkspaceMember[] } }>(`/workspaces/${workspace.id}/members`);
      setMembers(res.data.members);
    } catch {
      // best effort
    }
  }

  useEffect(() => {
    loadComments();
    loadMembers();
  }, [taskId, refreshTrigger]);

  // Handle text input with @ detection
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);

    // Detect if user is typing @mention
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowMentions(true);
      setMentionFilter(atMatch[1].toLowerCase());
    } else {
      setShowMentions(false);
    }
  }

  function insertMention(memberName: string) {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = content.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;

    const before = content.slice(0, atIndex);
    const after = content.slice(cursorPos);
    const newContent = `${before}@${memberName} ${after}`;
    setContent(newContent);
    setShowMentions(false);

    // Focus back
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = atIndex + memberName.length + 2;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: content.trim() });
      setContent('');
      setShowMentions(false);
      loadComments();
      onCommentCreated?.();
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false);
    }
  }

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionFilter) &&
    m.userId !== currentUser?.id
  );

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Comment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {comments.length === 0 && (
          <div
            style={{
              padding: '1rem',
              textAlign: 'center',
              color: 'var(--c-text-3)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-display), Space Mono, monospace',
            }}
          >
            Chưa có comment nào
          </div>
        )}
        {comments.map((c, i) => (
          <div
            key={c.id}
            className="fade-up"
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: c.userId === currentUser?.id
                ? 'var(--c-accent-transparent, rgba(139, 92, 246, 0.08))'
                : 'var(--c-bg)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
              animationDelay: `${i * 30}ms`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'var(--c-text-2)',
                }}
              >
                {c.user?.name || 'Unknown'}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  color: 'var(--c-text-3)',
                  fontFamily: 'var(--font-display), Space Mono, monospace',
                  opacity: 0.7,
                }}
              >
                {new Date(c.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                color: 'var(--c-text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              dangerouslySetInnerHTML={{
                __html: escapeHtml(c.content).replace(
                  /@([a-zA-Z0-9._-]+)/g,
                  '<span style="color: var(--c-accent); font-weight: 600;">@$1</span>'
                ),
              }}
            />
          </div>
        ))}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          className="input"
          value={content}
          onChange={handleInput}
          placeholder="Nhập comment... (dùng @ để mention)"
          rows={2}
          maxLength={5000}
          style={{
            resize: 'vertical',
            minHeight: 56,
            fontSize: '0.8125rem',
          }}
        />

        {/* Mention autocomplete dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '0.25rem',
              backgroundColor: 'var(--c-bg-raised)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              maxHeight: 160,
              overflowY: 'auto',
              zIndex: 20,
            }}
          >
            {filteredMembers.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => insertMention(m.name)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.375rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--c-text)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--c-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontWeight: 600 }}>@{m.name}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.375rem' }}>
          <button
            className="btn btn-primary btn-sm"
            type="submit"
            disabled={!content.trim() || submitting}
          >
            {submitting ? 'Đang gửi...' : 'Gửi comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
