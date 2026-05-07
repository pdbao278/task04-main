# TaskFlow MVP — TODO Checklist

> Auto-generated from `tasks/plan.md` | 2026-05-07
> Tick `[x]` khi task hoàn thành. Không xóa item.

---

## Slice A — Foundation (W1)
> FR-01, FR-02, US-04

### Backend Setup
- [x] Init Node.js + Express + TypeScript project
- [x] Setup Prisma + Neon DB connection
- [x] Schema: `users`, `workspaces`, `workspace_members`, `invite_tokens`
- [x] Run initial migration
- [x] Error handling middleware (`AppError`, global handler)
- [x] Rate limiting middleware (100 req/min per IP)

### Auth (FR-01)
- [x] `POST /auth/register` — Zod validation, bcrypt hash (cost ≥12)
- [x] `POST /auth/login` — JWT 7d + refresh token rotation
- [x] `POST /auth/logout` — invalidate token
- [x] `POST /auth/refresh` — refresh token endpoint
- [x] Lockout logic: 5 failed attempts → 15 min lock
- [x] Auth middleware: verify JWT, attach `req.user`

### Workspace & Members (FR-02)
- [x] `POST /workspaces` — Admin creates workspace
- [x] `POST /workspaces/:id/invite` — send invite email (Brevo)
- [x] `PATCH /members/:id/role` — Admin changes role
- [x] `DELETE /members/:id` — Admin removes member
- [x] Workspace isolation middleware (row-level)

### Frontend Auth
- [x] `/login` page — form + validation + error states
- [x] `/register` page — form + validation + duplicate email error
- [x] `/invite?token=xxx` page — accept invite flow
- [x] 2-tab logout sync (storage event listener)
- [x] Token expiry → auto redirect to `/login`
- [x] API client with interceptor (401 → redirect)

### Frontend Workspace
- [x] `/app/settings/members` — member list + invite form
- [x] Badge "Pending" for unaccepted invites
- [x] Role change dropdown (Admin only)
- [x] Remove member button (Admin only)

### Layout Shell
- [x] Sidebar component (navigation links)
- [x] Header component (user info)
- [x] Auth store (Zustand)

### Tests — Slice A
- [x] Unit: Zod schemas, bcrypt, JWT utils, role checks
- [x] Integration: all auth endpoints (happy + error)
- [x] Integration: all workspace endpoints (happy + error)
- [x] Security: no token → 401, cross-workspace → 403, rate limit → 429

### Review & Demo — Slice A
- [x] Schema review pass
- [x] Auth middleware coverage verified
- [x] Demo: Register → Login → Redirect
- [x] Demo: Invite flow end-to-end
- [x] Demo: Lockout + 2-tab sync

---

## Slice B — Project/Task CRUD (W2)
> FR-03, FR-04, US-01

### Backend
- [x] Schema: `projects`, `tasks` + migration
- [x] `POST /projects` — create project (name, desc, color)
- [x] `PATCH /projects/:id` — update project
- [x] `POST /projects/:id/archive` — archive project
- [x] `GET /projects` — list projects with task counts
- [x] `POST /tasks` — create task + initial activity log
- [x] `PATCH /tasks/:id` — update task fields
- [x] `GET /tasks/:id` — get task detail
- [x] `DELETE /tasks/:id` — soft delete (set deleted_at)
- [x] Input sanitization (XSS prevention)
- [x] Validation: title ≤200, desc ≤5000, project required

### Frontend
- [x] `/app/projects` — project list page
- [x] `/app/projects/[id]` — project detail + task list
- [x] Project card component (name, color, task count)
- [x] Project form (create/edit)
- [x] Task form (slide-over panel from right)
- [x] Task card component
- [x] Task detail (slide-over panel)
- [x] Hooks: `useProjects`, `useTasks`
- [x] Stores: task store (Zustand)

### Tests — Slice B
- [x] Unit: Zod schemas, sanitize util, date utils
- [x] Integration: project endpoints (happy + error)
- [x] Integration: task endpoints (happy + error)
- [x] Component: TaskForm validation, TaskCard render

### Review & Demo — Slice B
- [x] Slide-over panel UX review
- [x] Markdown render safety verified
- [x] Soft delete logic correct
- [x] Demo: Create project → create task → appears in "To Do"
- [x] Demo: Archive project → block new task
- [x] Demo: Validation error (empty title)

---

## Slice C — Status & Audit (W3)
> FR-05, FR-10, US-02

### Backend
- [ ] Schema: `activity_logs` + migration
- [ ] `PATCH /tasks/:id/status` — status change + activity log
- [ ] `GET /tasks/:id/activities` — activity log list
- [ ] Activity service: auto-log on create, status change, field edit
- [ ] Permission check: assignee OR Manager/Admin

### Frontend
- [ ] Status dropdown component (with disabled state + tooltip)
- [ ] Activity tab in task detail
- [ ] Activity timeline UI
- [ ] Optimistic UI for status change + rollback
- [ ] Loading state (>300ms spinner)

### Tests — Slice C
- [ ] Unit: status transition validation, permission logic
- [ ] Integration: `PATCH /tasks/:id/status` (happy + unauthorized)
- [ ] Integration: `GET /tasks/:id/activities`
- [ ] Component: StatusDropdown, ActivityTab
- [ ] E2E: change status → verify activity log

### Review & Demo — Slice C
- [ ] Optimistic rollback verified
- [ ] Activity log format consistent
- [ ] Permission matrix correct
- [ ] Demo: Member changes status → activity log appears
- [ ] Demo: Non-assignee Member → disabled button

---

## Slice D — Collaboration (W4)
> FR-06, FR-09

### Backend
- [ ] Schema: `comments`, `notifications` + migration
- [ ] `POST /tasks/:id/comments` — create comment
- [ ] `GET /tasks/:id/comments` — list comments
- [ ] `GET /notifications` — list user notifications
- [ ] `PATCH /notifications/:id/read` — mark read
- [ ] Mention parser util (@username extraction)
- [ ] Notification service: create on assign, comment, due ≤24h, @mention

### Frontend
- [ ] Comment tab in task detail
- [ ] Comment form (with @mention autocomplete)
- [ ] Notification bell icon + badge counter
- [ ] Notification dropdown list
- [ ] Click notification → mark read
- [ ] Polling 5s for notifications
- [ ] Hooks: `useComments`, `useNotifications`

### Tests — Slice D
- [ ] Unit: mention parser, notification logic
- [ ] Integration: comment endpoints, notification endpoints
- [ ] Component: CommentTab, NotificationBell

### Review & Demo — Slice D
- [ ] @mention parser edge cases verified
- [ ] Polling load acceptable
- [ ] Demo: Comment with @mention → notification
- [ ] Demo: Click notification → mark read

---

## Slice E — Personal Dashboard (W5)
> FR-07, US-03

### Backend
- [ ] `GET /my-tasks?filter=` — tasks assigned to user (exclude Done)
- [ ] Sort: overdue first → due ASC → no-due last

### Frontend
- [ ] `/app/my-tasks` page
- [ ] My task list component (sorted)
- [ ] Filter bar: All / To Do / In Progress
- [ ] Overdue badge (red)
- [ ] Empty state component
- [ ] Responsive layout (375px + 1024px)

### Tests — Slice E
- [ ] Unit: sort logic, filter logic
- [ ] Integration: `GET /my-tasks` with filters
- [ ] Component: list render, empty state
- [ ] E2E: login Member → My Tasks → sort + filter

### Review & Demo — Slice E
- [ ] Sort edge cases verified
- [ ] Empty state UX approved
- [ ] Responsive verified (mobile + desktop)
- [ ] Demo: My Tasks sorted with overdue highlighted
- [ ] Demo: Filter switching
- [ ] Demo: Empty state

---

## Slice F — Team Dashboard (W5-W6)
> FR-08

### Backend
- [ ] Update `GET /tasks` — workspace filter, search, pagination
- [ ] Permission: Admin + Manager only

### Frontend
- [ ] `/app/team` page
- [ ] Kanban board (4 columns: To Do / In Progress / In Review / Done)
- [ ] Drag-drop with @dnd-kit/core
- [ ] Kanban card component
- [ ] Filter bar: Assignee, Project, Priority, Due range
- [ ] Search by title
- [ ] Polling 5s refresh
- [ ] Mobile fallback: dropdown instead of drag
- [ ] Permission guard (redirect Member)

### Tests — Slice F
- [ ] Unit: filter logic, search debounce
- [ ] Integration: `GET /tasks` with filter combinations
- [ ] Component: KanbanBoard, drag-drop
- [ ] E2E: Manager → Team → drag task → status change

### Review & Demo — Slice F
- [ ] Drag-drop smooth (no jank)
- [ ] Mobile fallback works
- [ ] 100+ tasks performance OK
- [ ] Permission guard correct
- [ ] Demo: Kanban board 4 columns
- [ ] Demo: Drag task between columns
- [ ] Demo: Filter + search

---

## Slice G — Reports (W6)
> FR-11, US-05

### Backend
- [ ] `GET /reports/completion` — weekly completion data (4 weeks)
- [ ] `GET /reports/members` — member stats table
- [ ] Permission: Admin + Manager only

### Frontend
- [ ] `/app/reports` page
- [ ] Bar chart: Tasks Completed per week (Recharts)
- [ ] Member stats table (Assigned/Completed/Overdue/Rate%)
- [ ] Click member → My Tasks read-only view
- [ ] Permission guard

### Tests — Slice G
- [ ] Unit: aggregation logic, rate calculation
- [ ] Integration: report endpoints with test data
- [ ] Component: chart render, table render

### Review & Demo — Slice G
- [ ] Chart data accuracy verified (manual calc)
- [ ] Rate % rounding correct
- [ ] Read-only mode works
- [ ] Demo: Reports page with chart + table
- [ ] Demo: Click member → read-only My Tasks

---

## Slice H — Global Search & Polish (W7-W8)
> FR-12 + NFR-01→08

### Search (FR-12)
- [ ] `GET /search?q=` — search tasks by title
- [ ] Global search bar in header
- [ ] Debounce 300ms
- [ ] Max 10 results
- [ ] Click result → task detail

### Performance (NFR-01)
- [ ] LCP <2.5s (Lighthouse check)
- [ ] API p95 <500ms read, <1s write
- [ ] CLS <0.1
- [ ] Search debounce 300ms (no excessive calls)
- [ ] Kanban 100+ tasks: no lag

### Security (NFR-03)
- [ ] XSS scan: `<script>` in title/desc/comment → NOT executed
- [ ] Prisma parameterized queries (no raw SQL)
- [ ] Access without token → 401
- [ ] Cross-workspace access → 403
- [ ] Rate limit: 101st request → 429
- [ ] bcrypt hash verified, no plaintext
- [ ] JWT expired → 401, invalid sig → 401

### Accessibility (NFR-06)
- [ ] axe-core scan: 0 critical violations
- [ ] Keyboard nav: Kanban, forms, modals
- [ ] All form elements have labels
- [ ] Color contrast ≥4.5:1

### UX Polish (NFR-05)
- [ ] Toast error + Retry button on API fail
- [ ] Offline banner
- [ ] Loading states when API >300ms
- [ ] Empty states with guidance
- [ ] Responsive final pass (375px + 1024px)

### Browser (NFR-08)
- [ ] Chrome ≥110 verified
- [ ] Firefox ≥110 verified
- [ ] Safari ≥16 verified
- [ ] Edge ≥110 verified

### E2E Final Checklist
- [ ] Register → Login → Redirect to My Tasks
- [ ] Create task → Appears on Kanban board
- [ ] Drag task to In Progress → Activity log created
- [ ] Comment with @mention → Notification appears
- [ ] Invite member → Accept invite → Appears in member list
- [ ] View Reports → Charts render with data
- [ ] Search task by title → Results appear
- [ ] Logout tab A → Tab B auto-redirect to login

### Tests — Slice H
- [ ] Unit: search debounce, result limiting
- [ ] Integration: `GET /search?q=` (happy + empty + special chars)
- [ ] E2E: full US-01→US-05 pass
- [ ] Security checklist all pass
- [ ] Performance: Lighthouse report
- [ ] Accessibility: axe-core report

### Review & Demo — Slice H
- [ ] Lighthouse report attached
- [ ] axe-core: 0 critical
- [ ] Security checklist green
- [ ] Cross-browser log
- [ ] Demo: Global search flow
- [ ] Demo: Full E2E recording
- [ ] Demo: Lighthouse + axe-core screenshots

---

## Summary

| Slice | Status | Started | Completed |
|-------|--------|---------|-----------|
| A. Foundation | ✅ Completed | 2026-05-07 | 2026-05-07 |
| B. Project/Task CRUD | ✅ Completed | 2026-05-07 | 2026-05-08 |
| C. Status & Audit | ⬜ Not Started | | |
| D. Collaboration | ⬜ Not Started | | |
| E. Personal Dashboard | ⬜ Not Started | | |
| F. Team Dashboard | ⬜ Not Started | | |
| G. Reports | ⬜ Not Started | | |
| H. Search & Polish | ⬜ Not Started | | |
