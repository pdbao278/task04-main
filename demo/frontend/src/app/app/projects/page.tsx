'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import type { Project, CreateProjectInput } from '@/types/task';
import { useAuthStore } from '@/stores/auth-store';

const COLORS = ['#c8891a', '#3b82f6', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#ea580c'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateProjectInput>({ name: '', description: '', color: '#c8891a' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const workspace = useAuthStore((s) => s.workspace);

  async function loadProjects() {
    try {
      setLoading(true);
      const res = await api.get<{ data: Project[] }>('/projects');
      setProjects(res.data);
    } catch {
      console.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (workspace) loadProjects();
  }, [workspace]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '', color: '#c8891a' });
      setShowForm(false);
      loadProjects();
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: { field: string; message: string }[] };
      setError(apiErr?.error || apiErr?.details?.[0]?.message || 'Lỗi khi tạo project');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(projectId: string) {
    try {
      await api.post(`/projects/${projectId}/archive`);
      loadProjects();
    } catch {
      console.error('Archive failed');
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Projects" />
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>Đang tải...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Projects" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        {workspace && ['ADMIN', 'MANAGER'].includes(workspace.role) && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Đóng' : '+ Tạo project'}
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display), Space Mono, monospace',
            fontSize: '0.875rem',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--c-accent)',
          }}>
            Tạo project mới
          </h3>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Tên project *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Website Redesign"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Mô tả</label>
              <textarea
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về project..."
                rows={2}
              />
            </div>
            <div className="form-group">
              <label className="label">Màu</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--r-sm)',
                      backgroundColor: c,
                      border: form.color === c
                        ? '2px solid var(--c-text)'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.15s var(--ease-spring)',
                      transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo project'}
            </button>
          </form>
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            opacity: 0.3,
          }}>◧</div>
          <h3 style={{
            fontFamily: 'var(--font-display), Space Mono, monospace',
            fontWeight: 700,
            marginBottom: '0.5rem',
            fontSize: '1rem',
          }}>Chưa có project nào</h3>
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>
            Tạo project đầu tiên để bắt đầu quản lý công việc.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '0.75rem',
        }}>
          {projects.map((p, i) => (
            <Link
              key={p.id}
              href={`/app/projects/${p.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="card fade-up"
                style={{
                  borderLeft: `3px solid ${p.color}`,
                  opacity: p.archivedAt ? 0.5 : 1,
                  cursor: 'pointer',
                  animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={(e) => {
                  if (!p.archivedAt) {
                    e.currentTarget.style.borderColor = p.color;
                    e.currentTarget.style.boxShadow = `0 0 20px ${p.color}22`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.transform = '';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display), Space Mono, monospace',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}>{p.name}</h3>
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    {p.archivedAt && <span className="badge badge-warning">Archived</span>}
                    {workspace && ['ADMIN', 'MANAGER'].includes(workspace.role) && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => { e.preventDefault(); handleArchive(p.id); }}
                      >
                        {p.archivedAt ? 'Khôi phục' : 'Archive'}
                      </button>
                    )}
                  </div>
                </div>
                {p.description && (
                  <p style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
                    {p.description.slice(0, 100)}{p.description.length > 100 ? '...' : ''}
                  </p>
                )}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--c-text-3)',
                  fontFamily: 'var(--font-display), Space Mono, monospace',
                }}>
                  <span>◉ {p.taskCount ?? p._count?.tasks ?? 0} tasks</span>
                  <span style={{ color: 'var(--c-success)' }}>✓ {p.doneCount ?? 0} done</span>
                  <span>⊡ {p.creator?.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
