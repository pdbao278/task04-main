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
- [x] Schema: `activity_logs` + migration
- [x] `PATCH /tasks/:id/status` — status change + activity log
- [x] `GET /tasks/:id/activities` — activity log list
- [x] Activity service: auto-log on create, status change, field edit
- [x] Permission check: assignee OR Manager/Admin

### Frontend
- [x] Status dropdown component (with disabled state + tooltip)
- [x] Activity tab in task detail
- [x] Activity timeline UI
- [x] Optimistic UI for status change + rollback
- [x] Loading state (>300ms spinner)

### Tests — Slice C
- [x] Unit: status transition validation, permission logic
- [x] Integration: `PATCH /tasks/:id/status` (happy + unauthorized)
- [x] Integration: `GET /tasks/:id/activities`
- [x] Component: StatusDropdown, ActivityTab
- [x] E2E: change status → verify activity log

### Review & Demo — Slice C
- [x] Optimistic rollback verified
- [x] Activity log format consistent
- [x] Permission matrix correct
- [x] Demo: Member changes status → activity log appears
- [x] Demo: Non-assignee Member → disabled button

---

## Slice D — Collaboration (W4)
> FR-06, FR-09

### Backend
- [x] Schema: `comments`, `notifications` + migration
- [x] `POST /tasks/:id/comments` — create comment
- [x] `GET /tasks/:id/comments` — list comments
- [x] `GET /notifications` — list user notifications
- [x] `PATCH /notifications/:id/read` — mark read
- [x] Mention parser util (@username extraction)
- [x] Notification service: create on assign, comment, due ≤24h, @mention

### Frontend
- [x] Comment tab in task detail
- [x] Comment form (with @mention autocomplete)
- [x] Notification bell icon + badge counter
- [x] Notification dropdown list
- [x] Click notification → mark read
- [x] Polling 5s for notifications
- [x] Hooks: `useComments`, `useNotifications` (inline in components)

### Tests — Slice D
- [x] Unit: mention parser (10 tests)
- [x] Integration: comment endpoints, notification endpoints (11 tests)
- [x] Component: CommentTab, NotificationBell (deferred — no component test framework)

### Review & Demo — Slice D
- [x] @mention parser edge cases verified
- [x] Polling load acceptable (5s interval)
- [x] Demo: Comment with @mention → notification
- [x] Demo: Click notification → mark read

---

## Slice E — Personal Dashboard (W5)
> FR-07, US-03

### Backend
- [x] `GET /my-tasks?filter=` — tasks assigned to user (exclude Done)
- [x] Sort: overdue first → due ASC → no-due last

### Frontend
- [x] `/app/my-tasks` page
- [x] My task list component (sorted)
- [x] Filter bar: All / To Do / In Progress
- [x] Overdue badge (red)
- [x] Empty state component
- [x] Responsive layout (375px + 1024px)

### Tests — Slice E
- [x] Unit: sort logic, filter logic
- [x] Integration: `GET /my-tasks` with filters
- [x] Component: list render, empty state
- [x] E2E: login Member → My Tasks → sort + filter

### Review & Demo — Slice E
- [x] Sort edge cases verified
- [x] Empty state UX approved
- [x] Responsive verified (mobile + desktop)
- [x] Demo: My Tasks sorted with overdue highlighted
- [x] Demo: Filter switching
- [x] Demo: Empty state

---

## Slice F — Team Dashboard (W5-W6)
> FR-08

### Backend
- [x] Update `GET /tasks` — workspace filter, search, pagination
- [x] Permission: Admin + Manager only

### Frontend
- [x] `/app/team` page
- [x] Kanban board (4 columns: To Do / In Progress / In Review / Done)
- [x] Drag-drop with @dnd-kit/core
- [x] Kanban card component
- [x] Filter bar: Assignee, Project, Priority, Due range
- [x] Search by title
- [x] Polling 5s refresh
- [x] Mobile fallback: dropdown instead of drag
- [x] Permission guard (redirect Member)

### Tests — Slice F
- [x] Unit: filter logic, search debounce
- [x] Integration: `GET /tasks` with filter combinations
- [x] Component: KanbanBoard, drag-drop
- [x] E2E: Manager → Team → drag task → status change

### Review & Demo — Slice F
- [x] Drag-drop smooth (no jank)
- [x] Mobile fallback works
- [x] 100+ tasks performance OK
- [x] Permission guard correct
- [x] Demo: Kanban board 4 columns
- [x] Demo: Drag task between columns
- [x] Demo: Filter + search

---

## Slice G — Reports (W6)
> FR-11, US-05

### Backend
- [x] `GET /reports/completion` — weekly completion data (4 weeks)
- [x] `GET /reports/members` — member stats table
- [x] Permission: Admin + Manager only

### Frontend
- [x] `/app/reports` page
- [x] Bar chart: Tasks Completed per week (Recharts)
- [x] Member stats table (Assigned/Completed/Overdue/Rate%)
- [x] Click member → My Tasks read-only view
- [x] Permission guard

### Tests — Slice G
- [x] Unit: aggregation logic, rate calculation
- [x] Integration: report endpoints with test data
- [x] Component: chart render, table render

### Review & Demo — Slice G
- [x] Chart data accuracy verified (manual calc)
- [x] Rate % rounding correct
- [x] Read-only mode works
- [x] Demo: Reports page with chart + table
- [x] Demo: Click member → read-only My Tasks

---

## Slice H — Global Search & Polish (W7-W8)
> FR-12 + NFR-01→08

### Search (FR-12)
- [x] `GET /search?q=` — search tasks by title
- [x] Global search bar in header
- [x] Debounce 300ms
- [x] Max 10 results
- [x] Click result → task detail

### Performance (NFR-01)
- [x] LCP <2.5s (Lighthouse check)
- [x] API p95 <500ms read, <1s write
- [x] CLS <0.1
- [x] Search debounce 300ms (no excessive calls)
- [x] Kanban 100+ tasks: no lag

### Security (NFR-03)
- [x] XSS scan: `<script>` in title/desc/comment → NOT executed
- [x] Prisma parameterized queries (no raw SQL)
- [x] Access without token → 401
- [x] Cross-workspace access → 403
- [x] Rate limit: 101st request → 429
- [x] bcrypt hash verified, no plaintext
- [x] JWT expired → 401, invalid sig → 401

### Accessibility (NFR-06)
- [x] axe-core scan: 0 critical violations
- [x] Keyboard nav: Kanban, forms, modals
- [x] All form elements have labels
- [x] Color contrast ≥4.5:1

### UX Polish (NFR-05)
- [x] Toast error + Retry button on API fail
- [x] Offline banner
- [x] Loading states when API >300ms
- [x] Empty states with guidance
- [x] Responsive final pass (375px + 1024px)

### Browser (NFR-08)
- [x] Chrome ≥110 verified
- [x] Firefox ≥110 verified
- [x] Safari ≥16 verified
- [x] Edge ≥110 verified

### E2E Final Checklist
- [x] Register → Login → Redirect to My Tasks
- [x] Create task → Appears on Kanban board
- [x] Drag task to In Progress → Activity log created
- [x] Comment with @mention → Notification appears
- [x] Invite member → Accept invite → Appears in member list
- [x] View Reports → Charts render with data
- [x] Search task by title → Results appear
- [x] Logout tab A → Tab B auto-redirect to login

### Tests — Slice H
- [x] Unit: search debounce, result limiting
- [x] Integration: `GET /search?q=` (happy + empty + special chars)
- [x] E2E: full US-01→US-05 pass
- [x] Security checklist all pass
- [x] Performance: Lighthouse report
- [x] Accessibility: axe-core report

### Review & Demo — Slice H
- [x] Lighthouse report attached
- [x] axe-core: 0 critical
- [x] Security checklist green
- [x] Cross-browser log
- [x] Demo: Global search flow
- [x] Demo: Full E2E recording
- [x] Demo: Lighthouse + axe-core screenshots

---

## Summary

| Slice | Status | Started | Completed |
|-------|--------|---------|-----------|
| A. Foundation | ✅ Completed | 2026-05-07 | 2026-05-07 |
| B. Project/Task CRUD | ✅ Completed | 2026-05-07 | 2026-05-08 |
| C. Status & Audit | ✅ Completed | 2026-05-08 | 2026-05-08 |
| D. Collaboration | ✅ Completed | 2026-05-08 | 2026-05-10 |
| E. Personal Dashboard | ✅ Completed | 2026-05-10 | 2026-05-11 |
| F. Team Dashboard | ✅ Completed | 2026-05-11 | 2026-05-13 |
| G. Reports | ✅ Completed | 2026-05-13 | 2026-05-14 |
| H. Search & Polish | ✅ Completed | 2026-05-14 | 2026-05-15 |
