# TaskFlow MVP — Implementation Plan

> Source: `SPEC.md` v1.0 + `note/PRD.md` v1.0
> Created: 2026-05-07 | Status: Draft

---

## Thứ tự chạy Slice

```
A → B → C → D → E → F → G → H
```

---

## Slice A — Foundation

**FR:** FR-01 (Authentication), FR-02 (Workspace & Member), US-04 (Invite flow)

### Scope In

- Register/Login/Logout (email + password, JWT 7d, refresh token rotation)
- Lockout sau 5 lần sai (15 phút)
- 2-tab logout sync (storage event)
- Workspace CRUD (Admin tạo)
- Invite member qua email (Brevo), link 48h, badge "Pending"
- Role assignment (Admin/Manager/Member) + role change + remove member
- Prisma schema: `users`, `workspaces`, `workspace_members`, `invite_tokens`
- API middleware: auth guard, workspace isolation, rate limiting (100 req/min)
- Frontend: `/login`, `/register`, `/invite?token=xxx`, `/app/settings/members`

### Scope Out

- SSO/Google login, multiple workspaces, password reset email

### Dependencies

- Không (slice đầu tiên)

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| DB | `backend/prisma/schema.prisma` (users, workspaces, workspace_members, invite_tokens) |
| Backend | `routes/auth.ts`, `controllers/auth.controller.ts`, `routes/workspace.ts`, `controllers/workspace.controller.ts`, `middleware/auth.middleware.ts`, `middleware/rate-limit.middleware.ts`, `services/email.service.ts`, `utils/errors.ts`, `lib/prisma.ts` |
| Frontend | `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/invite/page.tsx`, `app/(app)/settings/members/page.tsx`, `lib/api-client.ts`, `lib/auth.ts`, `stores/auth-store.ts`, `components/layout/sidebar.tsx`, `components/layout/header.tsx` |
| Types | `backend/src/types/auth.types.ts`, `frontend/src/types/user.ts` |

### Acceptance Criteria (từ PRD)

- [ ] Register → login → session 7d → logout → redirect `/login`
- [ ] Sai pass 5 lần → khóa 15 phút, hiển thị countdown
- [ ] Token expire → redirect login với thông báo "Phiên làm việc đã hết hạn"
- [ ] 2 tab: logout tab A → tab B auto-redirect login
- [ ] Email đã tồn tại khi register → lỗi "Email này đã được đăng ký"
- [ ] Admin invite → email link 48h → join → badge "Pending" → accept → notify Admin
- [ ] Email trùng member → lỗi "Email này đã là thành viên"
- [ ] Link hết hạn → "Link mời đã hết hạn"
- [ ] Admin đổi role, xóa member
- [ ] Row-level workspace isolation

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Zod schemas (register, login), bcrypt hash verify, JWT sign/verify, role check utils |
| Integration | `POST /auth/register` (happy + duplicate email), `POST /auth/login` (happy + wrong pass + lockout), `POST /auth/logout`, `POST /auth/refresh`, `POST /workspaces`, `POST /workspaces/:id/invite`, `PATCH /members/:id/role`, `DELETE /members/:id` — mỗi endpoint 1 happy + 1 error |
| Security | XSS in name field, access without token → 401, workspace isolation → 403, rate limit 101st → 429, bcrypt verify no plaintext |

### Review Gate

- [ ] Schema review: tất cả table có index phù hợp
- [ ] Auth middleware cover tất cả `/app` routes
- [ ] Email template render đúng trên Gmail/Outlook
- [ ] No secrets committed

### Demo Evidence

1. Screen recording: Register → Login → Redirect `/app/my-tasks`
2. Screen recording: Invite flow (send → email received → accept → member list updated)
3. Screenshot: Lockout countdown sau 5 lần sai
4. Screenshot: 2-tab logout sync
5. Screenshot: Expired invite link message

---

## Slice B — Project/Task CRUD

**FR:** FR-03 (Project), FR-04 (Task CRUD), US-01 (Tạo task mới)

### Scope In

- Project CRUD: tạo (tên, mô tả, màu), list, update, archive
- Project hiển thị count task tổng / done
- Archive project → chặn tạo task mới, task cũ vẫn update
- Task CRUD: tạo, sửa, xem chi tiết (slide-over panel)
- Task fields: title (≤200), description (markdown ≤5000), assignee (1 người), project (bắt buộc), priority (Low/Medium/High/Urgent), due date, status (default TODO)
- Soft delete (deleted_at, restore 30 ngày)
- Input validation: frontend Zod + backend Zod
- Sanitize HTML/script

### Scope Out

- Drag-drop status change (Slice C), comments (Slice D), activity log UI (Slice C)
- Sub-tasks, file attachments

### Dependencies

- **Slice A:** Auth middleware, workspace context, user/workspace tables

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| DB | `schema.prisma` (thêm projects, tasks) + migration |
| Backend | `routes/project.ts`, `controllers/project.controller.ts`, `routes/task.ts`, `controllers/task.controller.ts`, `types/project.types.ts`, `types/task.types.ts` |
| Frontend | `app/(app)/projects/page.tsx`, `app/(app)/projects/[id]/page.tsx`, `components/project/project-card.tsx`, `components/project/project-form.tsx`, `components/task/task-form.tsx`, `components/task/task-detail.tsx`, `components/task/task-card.tsx`, `stores/task-store.ts`, `hooks/use-tasks.ts`, `hooks/use-projects.ts`, `types/task.ts`, `types/project.ts` |

### Acceptance Criteria (từ PRD)

- [ ] Tạo project (tên, mô tả, màu) → hiển thị count task/done
- [ ] Archive project → không tạo task mới, task cũ vẫn update
- [ ] Tạo task: Title + Project bắt buộc → task hiện ở "To Do"
- [ ] Title trống → lỗi "Title không được để trống", task KHÔNG tạo
- [ ] Title ≤200, Description ≤5000 markdown
- [ ] Assignee 1 người (có thể trống)
- [ ] Priority: Low/Medium/High/Urgent
- [ ] Due date quá khứ → cho phép, hiện badge "Overdue"
- [ ] XSS: `<script>` trong title/desc → sanitize, không execute
- [ ] Soft delete task, không hard delete

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Zod schemas (CreateTask, UpdateTask, CreateProject), sanitize util, date utils |
| Integration | `POST /projects`, `PATCH /projects/:id`, `POST /projects/:id/archive`, `POST /tasks`, `PATCH /tasks/:id`, `GET /tasks/:id` — happy + error paths |
| Component | TaskForm render + validation, TaskCard render, ProjectCard render |

### Review Gate

- [ ] Slide-over panel UX review (mở từ phải, giữ context)
- [ ] Markdown render an toàn (no raw HTML)
- [ ] Soft delete logic correct (deleted_at filter)
- [ ] Permission check: Admin/Manager/Member đều tạo task; chỉ Admin/Manager archive project

### Demo Evidence

1. Screen recording: Tạo project → tạo task trong project → task hiện ở "To Do"
2. Screenshot: Validation error khi title trống
3. Screen recording: Archive project → thử tạo task mới → blocked
4. Screenshot: Task detail slide-over panel

---

## Slice C — Status & Audit

**FR:** FR-05 (Status change), FR-10 (Activity Log), US-02 (Member đổi status)

### Scope In

- Status transition: TODO → IN_PROGRESS → IN_REVIEW → DONE (drag-drop + dropdown fallback)
- Permission: Assignee + Manager/Admin đổi status; Member chỉ task mình
- Optimistic UI + rollback on error
- Activity log: ghi mọi thay đổi (created, status change, field edit)
  - Fields: who, field_changed, old_value → new_value, timestamp
  - Không cho xóa activity log
- Tab "Activity" trong task detail
- Loading state khi API > 300ms

### Scope Out

- Kanban board full (Slice F), notifications (Slice D)

### Dependencies

- **Slice B:** Task model, task detail UI, task CRUD APIs

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| DB | `schema.prisma` (thêm activity_logs) + migration |
| Backend | `routes/task.ts` (thêm PATCH status), `controllers/activity.controller.ts`, `services/activity.service.ts`, `types/activity.types.ts` |
| Frontend | `components/task/status-dropdown.tsx`, `components/task/activity-tab.tsx`, `hooks/use-activity.ts`, `lib/optimistic.ts` |

### Acceptance Criteria (từ PRD)

- [ ] Đổi status → optimistic UI (không reload)
- [ ] Activity log ghi "[Tên] changed status from X → Y at [timestamp]"
- [ ] Member cố đổi status task không phải mình → disabled + tooltip
- [ ] Tab Activity hiển thị: created, status change, edit, comment
- [ ] Activity log không thể xóa
- [ ] Loading state hiển thị khi API > 300ms

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Status transition validation, activity log creation logic, permission check |
| Integration | `PATCH /tasks/:id/status` (happy + unauthorized), `GET /tasks/:id/activities` |
| Component | StatusDropdown render + disabled state, ActivityTab render timeline |
| E2E | Drag/click đổi status → activity log xuất hiện |

### Review Gate

- [ ] Optimistic UI rollback khi API fail
- [ ] Activity log format nhất quán
- [ ] Permission matrix đúng theo SPEC bảng Roles

### Demo Evidence

1. Screen recording: Member đổi status task → optimistic update → activity log
2. Screenshot: Disabled status button cho non-assignee Member
3. Screenshot: Activity tab timeline

---

## Slice D — Collaboration

**FR:** FR-06 (Comment), FR-09 (Notification In-App)

### Scope In

- Comment trong task: plain text + @mention
- Không edit/delete comment (MVP)
- Notification in-app: assign mới, comment (trừ self), due ≤24h, @mention
- Bell icon + badge counter + dropdown list
- Click notification → mark read
- Polling 5s

### Scope Out

- Email notification, edit/delete comment, WebSocket real-time

### Dependencies

- **Slice C:** Activity log service (comment tạo activity entry), task detail UI

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| DB | `schema.prisma` (thêm comments, notifications) + migration |
| Backend | `routes/comment.ts`, `controllers/comment.controller.ts`, `routes/notification.ts`, `controllers/notification.controller.ts`, `services/notification.service.ts`, `utils/mention-parser.ts` |
| Frontend | `components/task/comment-tab.tsx`, `components/task/comment-form.tsx`, `components/layout/notification-bell.tsx`, `components/layout/notification-dropdown.tsx`, `hooks/use-comments.ts`, `hooks/use-notifications.ts` |

### Acceptance Criteria (từ PRD)

- [ ] Comment text + @mention → notification cho người được mention
- [ ] Comment không edit/delete
- [ ] Notify: assign mới, comment (trừ self), due ≤24h, @mention
- [ ] Bell icon + badge counter + dropdown
- [ ] Click → đánh dấu đã đọc
- [ ] Polling 5s cập nhật

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Mention parser, notification creation logic, comment Zod schema |
| Integration | `POST /tasks/:id/comments`, `GET /tasks/:id/comments`, `GET /notifications`, `PATCH /notifications/:id/read` |
| Component | CommentTab render, NotificationBell badge count, dropdown list |

### Review Gate

- [ ] @mention parser chính xác (edge cases: username có dấu, trùng prefix)
- [ ] Polling không gây excessive load
- [ ] Notification message format rõ ràng

### Demo Evidence

1. Screen recording: Comment với @mention → notification xuất hiện cho mentioned user
2. Screenshot: Bell icon với badge count
3. Screen recording: Click notification → mark read → badge giảm

---

## Slice E — Personal Dashboard

**FR:** FR-07 (My Tasks), US-03 (Xem My Tasks)

### Scope In

- `/app/my-tasks`: danh sách task assigned cho user (trừ Done)
- Sort: Overdue (đỏ) → due ASC → no-due cuối
- Filter: All / To Do / In Progress
- Badge "Overdue" nếu due_date < today
- Empty state: icon + text hướng dẫn
- Responsive: mobile ≥375px + desktop ≥1024px

### Scope Out

- Team view, Kanban board

### Dependencies

- **Slice C:** Status logic, task data
- **Slice D:** Notification integration (due ≤24h)

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| Backend | `routes/my-tasks.ts`, `controllers/my-tasks.controller.ts` |
| Frontend | `app/(app)/my-tasks/page.tsx`, `components/task/my-task-list.tsx`, `components/task/my-task-filters.tsx`, `components/ui/empty-state.tsx` |

### Acceptance Criteria (từ PRD)

- [ ] Hiển thị task assigned cho user, trừ Done
- [ ] Sort: Overdue (đỏ) lên đầu → due ASC → no-due cuối
- [ ] Filter All / To Do / In Progress hoạt động
- [ ] Badge "Overdue" khi due_date < today
- [ ] Empty state: "Bạn chưa có task nào. Hãy liên hệ Manager để được assign công việc."
- [ ] Responsive mobile + desktop

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Sort logic (overdue first, due ASC, no-due last), filter logic |
| Integration | `GET /my-tasks?filter=` (all, todo, in_progress, empty result) |
| Component | MyTaskList render + sort order, empty state render |
| E2E | Login as Member → navigate My Tasks → verify sort + filter |

### Review Gate

- [ ] Sort order chính xác với edge cases (multiple overdue, mixed dates)
- [ ] Empty state UX review
- [ ] Responsive layout trên 375px và 1024px

### Demo Evidence

1. Screen recording: Member vào My Tasks → task sorted đúng (overdue đỏ đầu)
2. Screenshot: Filter switching (All → To Do → In Progress)
3. Screenshot: Empty state
4. Screenshot: Mobile responsive view

---

## Slice F — Team Dashboard

**FR:** FR-08 (Kanban Board)

### Scope In

- `/app/team`: Kanban board 4 cột (To Do / In Progress / In Review / Done)
- Drag-drop đổi status (@dnd-kit/core)
- Filter: Assignee, Project, Priority, Due date range
- Search task by title
- Update ≤5s (polling)
- Permission: Admin + Manager xem; Member không truy cập

### Scope Out

- Reports, analytics

### Dependencies

- **Slice C:** Status change API + optimistic UI
- **Slice E:** Task data fetching patterns

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| Backend | Update `GET /tasks` with workspace filter + search + pagination |
| Frontend | `app/(app)/team/page.tsx`, `components/task/kanban-board.tsx`, `components/task/kanban-column.tsx`, `components/task/kanban-card.tsx`, `components/task/task-filters.tsx`, `components/task/task-search.tsx`, `hooks/use-kanban.ts` |

### Acceptance Criteria (từ PRD)

- [ ] Kanban 4 cột hiển thị đúng status
- [ ] Drag-drop đổi status → optimistic UI → activity log
- [ ] Filter Assignee / Project / Priority / Due range hoạt động
- [ ] Search title → kết quả filter real-time
- [ ] Update ≤5s (polling)
- [ ] Member truy cập → redirect hoặc 403

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Filter logic, search debounce |
| Integration | `GET /tasks?workspace=&filter=&search=` combinations |
| Component | KanbanBoard render 4 columns, drag-drop interaction |
| E2E | Login Manager → Team → drag task → verify status change + activity log |

### Review Gate

- [ ] Drag-drop UX smooth (no jank)
- [ ] Mobile fallback: dropdown thay drag
- [ ] Kanban với 100+ tasks: no visible lag
- [ ] Permission guard đúng

### Demo Evidence

1. Screen recording: Manager vào Team → Kanban board 4 cột
2. Screen recording: Drag task từ To Do → In Progress
3. Screen recording: Filter + search combination
4. Screenshot: Mobile dropdown fallback

---

## Slice G — Reports

**FR:** FR-11 (Báo cáo Team), US-05 (Xem báo cáo)

### Scope In

- `/app/reports`: Admin + Manager only
- Bar chart: Tasks Completed theo 4 tuần gần nhất (Recharts)
- Bảng: Member | Assigned | Completed | Overdue | Completion Rate (%)
- Click member → My Tasks read-only view
- Data chỉ trong workspace hiện tại

### Scope Out

- Export CSV/PDF, custom date range, advanced analytics

### Dependencies

- **Slice E:** My Tasks view (read-only reuse)
- **Slice F:** Task data aggregation patterns

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| Backend | `routes/report.ts`, `controllers/report.controller.ts` |
| Frontend | `app/(app)/reports/page.tsx`, `components/report/completion-chart.tsx`, `components/report/member-table.tsx`, `components/report/member-tasks-view.tsx` |

### Acceptance Criteria (từ PRD)

- [ ] Bar chart 4 tuần, mỗi tuần 1 cột
- [ ] Bảng: Member / Assigned / Completed / Overdue / Rate(%)
- [ ] Data chỉ workspace hiện tại
- [ ] Click member → My Tasks read-only
- [ ] Admin + Manager xem; Member → redirect/403

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Aggregation logic (weekly grouping, rate calculation) |
| Integration | `GET /reports/completion`, `GET /reports/members` with test data |
| Component | Chart render with mock data, table render, click-through navigation |

### Review Gate

- [ ] Chart data chính xác (verify manual calculation)
- [ ] Rate % làm tròn đúng
- [ ] Read-only mode cho member tasks view

### Demo Evidence

1. Screenshot: Reports page với bar chart + member table
2. Screen recording: Click member name → My Tasks read-only
3. Screenshot: Permission denied cho Member role

---

## Slice H — Global Search & Polish

**FR:** FR-12 (Search), NFR-01→08

### Scope In

- Search bar ở header: tìm task by title toàn workspace
- Debounce 300ms, max 10 kết quả, click → task detail
- NFR polish:
  - Performance: LCP <2.5s, API p95 <500ms read / <1s write, CLS <0.1
  - Accessibility: axe-core 0 critical, keyboard nav Kanban, labels, contrast ≥4.5:1
  - Security audit: XSS scan, auth check, rate limit verify
  - Browser support: Chrome/Firefox/Safari/Edge ≥110
  - Responsive final pass
  - Error states: toast retry, offline banner
  - Loading states khi API >300ms

### Scope Out

- Full-text search (Elasticsearch), advanced filters in search

### Dependencies

- **Tất cả slices trước** (polish toàn app)

### Files/Modules dự kiến

| Layer | Files |
|-------|-------|
| Backend | `routes/search.ts`, `controllers/search.controller.ts` |
| Frontend | `components/layout/global-search.tsx`, `hooks/use-search.ts`, `components/ui/offline-banner.tsx`, `components/ui/error-toast.tsx` |
| Config | Lighthouse CI config, axe-core setup |

### Acceptance Criteria (từ PRD)

- [ ] Search title → debounce 300ms → max 10 results → click → task detail
- [ ] LCP <2.5s trên 4G
- [ ] API p95 <500ms read, <1s write
- [ ] axe-core: 0 critical violations
- [ ] Keyboard nav qua Kanban, forms, modals
- [ ] Color contrast ≥4.5:1
- [ ] Toast error + Retry button khi API fail
- [ ] Offline banner
- [ ] CLS <0.1

### Test Gate

| Type | Criteria |
|------|----------|
| Unit | Search debounce, result limiting |
| Integration | `GET /search?q=` (happy + empty + special chars) |
| E2E | Full US-01→US-05 checklist pass |
| Security | XSS scan, SQL injection verify, auth without token → 401, cross-workspace → 403, rate limit → 429 |
| Performance | Lighthouse score, API benchmark |
| Accessibility | axe-core scan all pages |

### Review Gate

- [ ] Lighthouse report attached
- [ ] axe-core report: 0 critical
- [ ] Security checklist all pass
- [ ] Cross-browser testing log
- [ ] E2E checklist US-01→US-05 all green

### Demo Evidence

1. Screen recording: Global search → type → results appear → click → task detail
2. Screenshot: Lighthouse report
3. Screenshot: axe-core report
4. Screen recording: Full E2E flow (Register → Create task → Kanban → Report)
5. Screenshot: Offline banner + error toast

---

## Tổng kết

| Slice | FRs | Priority | Est. Week |
|-------|-----|----------|-----------|
| A. Foundation | FR-01, FR-02, US-04 | P0 | W1 |
| B. Project/Task CRUD | FR-03, FR-04, US-01 | P0 | W2 |
| C. Status & Audit | FR-05, FR-10, US-02 | P0+P1 | W3 |
| D. Collaboration | FR-06, FR-09 | P0+P1 | W4 |
| E. Personal Dashboard | FR-07, US-03 | P0 | W5 |
| F. Team Dashboard | FR-08 | P0 | W5-W6 |
| G. Reports | FR-11, US-05 | P1 | W6 |
| H. Search & Polish | FR-12 + NFR | P2+NFR | W7-W8 |
