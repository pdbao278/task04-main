# Spec: TaskFlow MVP v1.0

> Source of Truth: `note/PRD.md` v1.0 (2026-04-07)
> Spec version: 1.0 | Created: 2026-05-06

---

## 1. Objective & Problem Statement

**Problem:** Các team nhỏ (5–10 người) dùng chat/spreadsheet để quản lý công việc → task bị bỏ sót, không rõ trách nhiệm, không có lịch sử rõ ràng.

**Solution:** TaskFlow — web platform fullstack cho phép team nhỏ tạo, giao, theo dõi và hoàn thành công việc trong một giao diện duy nhất. Nhẹ hơn Jira, chắc hơn Trello.

**Success Criteria (MVP):**
- FR-01 → FR-12 pass QA
- Page load < 2s, uptime > 99% trong 7 ngày staging
- Không còn blocker Severity 1/2
- Task completion rate ≥ 85% sau 30 ngày
- DAU ≥ 80% team members

---

## 2. Roles & Permissions

| Permission | Admin | Manager | Member |
|---|:---:|:---:|:---:|
| Quản lý workspace, thêm/xóa member | ✅ | ❌ | ❌ |
| Thay đổi role member | ✅ | ❌ | ❌ |
| Tạo/archive project | ✅ | ✅ | ❌ |
| Tạo task, assign task | ✅ | ✅ | ✅ |
| Chuyển status (task mình hoặc team) | ✅ | ✅ | Chỉ task mình |
| Comment trong task | ✅ | ✅ | ✅ |
| Xem My Tasks | ✅ | ✅ | ✅ |
| Xem Team Dashboard (Kanban) | ✅ | ✅ | ❌ |
| Xem Reports | ✅ | ✅ | ❌ |
| Workspace Settings | ✅ | ❌ | ❌ |

---

## 3. Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **State:** Zustand (client) + TanStack Query (server)
- **DnD:** @dnd-kit/core (Kanban)
- **Form:** React Hook Form + Zod
- **Charts:** Recharts (Reports)

### Backend
- **Runtime:** Node.js + Express (hoặc Fastify)
- **ORM:** Prisma
- **Database:** Neon DB (PostgreSQL serverless)
- **Auth:** JWT (7 ngày) + bcrypt (cost ≥ 12) + refresh token rotation
- **Email:** Brevo (invite emails)

### DevOps
- **Backend hosting:** Railway / Render
- **Frontend:** Vercel
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (free tier)

---

## 4. Commands

```
# Install
npm install

# Dev
npm run dev                    # Frontend dev server
npm run dev:api                # Backend dev server

# Build
npm run build                  # Production build

# Test
npm test                       # All tests
npm test -- --coverage         # With coverage report
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:e2e               # E2E tests

# Lint & Format
npm run lint                   # ESLint check
npm run lint --fix             # ESLint auto-fix
npm run format                 # Prettier

# Database
npx prisma migrate dev         # Run migrations (dev)
npx prisma migrate deploy      # Run migrations (prod)
npx prisma generate            # Generate client
npx prisma studio              # DB GUI
```

---

## 5. Project Structure

```
demo/
├── SPEC.md                    # This spec (living document)
├── frontend/                  # Next.js 16 app
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (auth)/        # Login, Register, Invite
│   │   │   └── (app)/         # Authenticated routes
│   │   │       ├── my-tasks/
│   │   │       ├── team/
│   │   │       ├── projects/
│   │   │       ├── reports/
│   │   │       └── settings/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   ├── task/          # Task-related components
│   │   │   ├── project/       # Project components
│   │   │   └── layout/        # Sidebar, Header, etc.
│   │   ├── lib/               # Utilities, API client, auth
│   │   ├── hooks/             # Custom React hooks
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types/interfaces
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── backend/                   # Express/Fastify API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── services/          # Email, notification services
│   │   ├── utils/             # Helpers
│   │   └── types/             # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema
│   │   └── migrations/
│   └── tests/
│       ├── unit/
│       └── integration/
└── note/                      # PRD & docs (read-only reference)
```

---

## 6. Code Style

### Naming Conventions
- **Files:** kebab-case (`task-card.tsx`, `auth-middleware.ts`)
- **Components:** PascalCase (`TaskCard`, `KanbanBoard`)
- **Functions/variables:** camelCase (`createTask`, `isOverdue`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_TITLE_LENGTH`)
- **DB tables:** snake_case (`workspace_members`)
- **API endpoints:** kebab-case (`/api/v1/my-tasks`)

### Example — API Controller

```typescript
// backend/src/controllers/task.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { CreateTaskSchema } from '../types/task.types';
import { AppError } from '../utils/errors';

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...data,
        createdBy: req.user.id,
        workspaceId: req.workspace.id,
        status: 'TODO',
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        userId: req.user.id,
        actionType: 'CREATED',
      },
    });

    return res.status(201).json({ data: task });
  } catch (error) {
    next(error);
  }
}
```

### Example — React Component

```tsx
// frontend/src/components/task/task-card.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';
import { formatDueDate, isOverdue } from '@/lib/date-utils';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: string) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
      <h3 className="font-medium text-sm">{task.title}</h3>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant={task.priority === 'URGENT' ? 'destructive' : 'secondary'}>
          {task.priority}
        </Badge>
        {task.dueDate && (
          <span className={isOverdue(task.dueDate) ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## 7. Functional Requirement Matrix

| FR ID | Requirement | P | User Value | UI Surface | API Surface | Acceptance Evidence | Test Type |
|---|---|:---:|---|---|---|---|---|
| FR-01 | Authentication | P0 | Truy cập an toàn | `/login`, `/register` | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` | Register → login → session 7d → logout → redirect. Sai pass 5x → khóa 15'. Token expire → redirect login. 2 tab logout sync. | Unit, Integ, E2E |
| FR-02 | Workspace & Member Mgmt | P0 | Tổ chức team | `/app/settings/members` | `POST /workspaces`, `POST /workspaces/:id/invite`, `PATCH /members/:id/role`, `DELETE /members/:id` | Admin invite → link 48h → join → đổi role → xóa member. Email trùng → lỗi. Link hết hạn → thông báo. | Unit, Integ, E2E |
| FR-03 | Quản lý Project | P0 | Nhóm task theo dự án | `/app/projects`, `/app/projects/:id` | `POST /projects`, `PATCH /projects/:id`, `POST /projects/:id/archive` | Tạo project (tên, mô tả, màu) → count task/done → archive → chặn tạo task mới, task cũ vẫn update. | Unit, Integ |
| FR-04 | Tạo & Chỉnh sửa Task | P0 | Phân công rõ ràng | Task form (slide-over) | `POST /tasks`, `PATCH /tasks/:id`, `GET /tasks/:id` | Tạo task (title≤200, desc≤5000 markdown, assignee, project, priority, due date) → activity log. Title trống → error. | Unit, Integ, E2E |
| FR-05 | Chuyển trạng thái Task | P0 | Biết tiến độ | Kanban drag-drop + dropdown | `PATCH /tasks/:id/status` | Drag/click đổi status → optimistic UI → activity log. Non-assignee Member → disabled. | Unit, Integ, E2E |
| FR-06 | Comment trong Task | P0 | Trao đổi ngữ cảnh | Tab Comment trong task detail | `POST /tasks/:id/comments`, `GET /tasks/:id/comments` | Comment text + @mention → notification cho người được mention. Không edit/delete (MVP). | Unit, Integ |
| FR-07 | Dashboard My Tasks | P0 | Biết việc cần làm | `/app/my-tasks` | `GET /my-tasks?filter=` | Task assigned (trừ Done), sort: overdue(đỏ) → due ASC → no-due cuối. Filter All/To Do/In Progress. Empty state. | Unit, Integ, E2E |
| FR-08 | Dashboard Team | P0 | Nắm tiến độ tổng | `/app/team` | `GET /tasks?workspace=&filter=` | Kanban 4 cột → filter Assignee/Project/Priority/Due range → search title → drag đổi status. Update ≤5s. | Unit, Integ, E2E |
| FR-09 | Thông báo In-App | P1 | Không bỏ lỡ | Bell icon + badge + dropdown | `GET /notifications`, `PATCH /notifications/:id/read` | Notify: assign mới, comment (trừ self), due ≤24h, @mention. Click → đánh dấu đã đọc. Polling 5s. | Unit, Integ |
| FR-10 | Activity Log | P1 | Truy vết thay đổi | Tab Activity trong task | `GET /tasks/:id/activities` | Ghi: ai, field, old→new, timestamp. Không cho xóa. Show: created, status change, edit, comment. | Unit, Integ |
| FR-11 | Báo cáo Team | P1 | Đánh giá năng suất | `/app/reports` | `GET /reports/completion`, `GET /reports/members` | Bar chart 4 tuần. Bảng Member/Assigned/Completed/Overdue/Rate(%). Click member → My Tasks read-only. Admin+Manager xem. | Unit, Integ |
| FR-12 | Search toàn cục | P2 | Tìm task nhanh | Search bar header | `GET /search?q=` | Search title toàn workspace → debounce 300ms → max 10 kết quả → click → task detail. | Unit, Integ |

---

## 8. User Story Matrix

| US | Role | Flow | Acceptance Criteria | Related FR |
|---|---|---|---|---|
| US-01 | Manager | Click "+ New Task" → điền Title+Project → Submit | ✅ Task hiện ở "To Do" ✅ Assignee nhận notification ✅ Activity log "Created by" ❌ Title trống → lỗi, task KHÔNG tạo | FR-04, FR-09, FR-10 |
| US-02 | Member | Xem task → đổi status | ✅ Optimistic UI ✅ Activity log ghi change ✅ Team dashboard update ≤5s ❌ Không phải task mình → disabled | FR-05, FR-10, FR-08 |
| US-03 | Member | Vào /app/my-tasks | ✅ Sort: Overdue(đỏ) → due ASC → no-due cuối ✅ Filter All/To Do/In Progress ✅ Empty state có hướng dẫn | FR-07 |
| US-04 | Admin | Settings>Members → nhập email → Send Invite | ✅ Email invite link 48h ✅ Badge "Pending" ✅ Notify khi accept ❌ Email trùng → lỗi ❌ Link hết hạn → thông báo | FR-02, FR-09 |
| US-05 | Manager | Vào /app/reports | ✅ Bar chart 4 tuần ✅ Bảng member stats ✅ Click member → My Tasks read-only | FR-11 |

---

## 9. Boundaries

### ✅ Always Do
- Chạy lint + test trước commit
- Validate input: frontend Zod + backend Zod
- Sanitize HTML/script (chống XSS)
- Soft delete task (deleted_at, restore 30 ngày)
- Activity log mọi thay đổi task (không xóa)
- Loading state khi API > 300ms
- Empty state có hướng dẫn
- Row-level workspace isolation
- HTTPS/TLS 1.2+
- Rate limiting: 100 req/phút per IP

### ⚠️ Ask First
- Thay đổi database schema (migration)
- Thêm dependency mới
- Thay đổi CI/CD config
- Thay đổi API response format
- Thay đổi permission matrix

### 🚫 Never Do
- Commit secrets/API keys vào repo
- Hard delete task
- Xóa activity log
- Render raw HTML từ user input
- Xóa failing tests không approval
- Implement Out of Scope: SSO, mobile native, Slack/Zalo, billing, multiple workspaces, sub-task

---

## 10. Testing Strategy

### 10.1 Unit Tests
- **Framework:** Vitest (frontend + backend)
- **Scope:** Pure functions, utils, Zod schemas, hooks, Zustand stores, controllers (mocked DB)
- **Coverage target:** ≥ 80% lines cho business logic
- **Location:** `frontend/tests/unit/`, `backend/tests/unit/`

### 10.2 Integration Tests
- **Framework:** Vitest + Supertest (backend API), Testing Library (frontend)
- **Scope:** API endpoints with test DB, component rendering with mocked API, middleware chains
- **Coverage:** Mỗi API endpoint ít nhất 1 happy path + 1 error path
- **DB:** Neon DB branch hoặc local PostgreSQL container cho CI
- **Location:** `backend/tests/integration/`, `frontend/tests/integration/`

### 10.3 E2E / Checklist Tests
- **Framework:** Playwright
- **Scope:** Critical user flows (US-01 → US-05), cross-page navigation
- **Checklist (manual fallback nếu chưa automate):**
  - [ ] Register → Login → Redirect to My Tasks
  - [ ] Create task → Appears on Kanban board
  - [ ] Drag task to In Progress → Activity log created
  - [ ] Comment with @mention → Notification appears
  - [ ] Invite member → Accept invite → Appears in member list
  - [ ] View Reports → Charts render with data
  - [ ] Search task by title → Results appear
  - [ ] Logout tab A → Tab B auto-redirect to login

### 10.4 Security Tests
- [ ] XSS: Submit `<script>alert(1)</script>` in title/description/comment → NOT executed
- [ ] SQL Injection: Prisma parameterized queries (verify no raw SQL)
- [ ] Auth: Access /api/tasks without token → 401
- [ ] Auth: Access workspace B data with workspace A token → 403
- [ ] Rate limit: 101st request in 1 minute → 429
- [ ] Password: Verify bcrypt hash, never stored plaintext
- [ ] JWT: Expired token → 401, invalid signature → 401

### 10.5 Accessibility Tests
- [ ] Axe-core scan trên mỗi page → 0 critical violations
- [ ] Keyboard navigation: Tab through Kanban board, forms, modals
- [ ] All form elements have associated labels
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Screen reader: Task cards, notifications readable

### 10.6 Performance Tests
- [ ] LCP < 2.5s trên 4G (Lighthouse)
- [ ] API read endpoints p95 < 500ms
- [ ] API write endpoints p95 < 1s
- [ ] Search debounce 300ms (no excessive API calls)
- [ ] Kanban board with 100+ tasks: no visible lag
- [ ] CLS < 0.1 (no layout shift during load)

---

## 11. Open Assumptions

| # | Assumption | Rationale | Impact nếu sai |
|---|---|---|---|
| A-01 | 1 task = 1 assignee | PRD FR-04 ghi "1 người", OQ-01 chưa resolve | Cần thêm junction table `task_assignees` |
| A-02 | Notification chỉ in-app (polling 5s) | OQ-02 chưa resolve, budget < $20/tháng | Cần integrate email notification, tăng Brevo quota |
| A-03 | Invite email qua Brevo | User yêu cầu, thay thế Resend/SendGrid | Cần đổi SDK nếu switch provider |
| A-04 | Comment không edit/delete | OQ-03 chưa resolve, MVP simplicity | Cần thêm API + UI cho edit/delete + history |
| A-05 | Giữ 4 status: To Do → In Progress → In Review → Done | OQ-04 chưa resolve, theo PRD mặc định | Cần config dynamic status per workspace |
| A-06 | Reports: Admin + Manager xem | User xác nhận Admin full quyền. OQ-05 resolved | N/A |
| A-07 | Không có sub-task | OQ-06 chưa resolve, ảnh hưởng lớn data model | Cần thêm parent_id, recursive queries |
| A-08 | Database: Neon DB | User yêu cầu, PostgreSQL serverless | Connection pooling qua Neon proxy |
| A-09 | Real-time = Polling 5s, không WebSocket | PRD R-06, MVP simplicity | Cần WebSocket (Socket.io) cho V2 |
| A-10 | UI tiếng Việt | PRD constraint, chưa i18n | Cần i18n framework nếu multi-language |

---

## 12. Database Schema

```
users             — id, email, name, password_hash, created_at, updated_at
workspaces        — id, name, created_by, created_at, updated_at
workspace_members  — id, workspace_id, user_id, role(ADMIN/MANAGER/MEMBER), joined_at
projects          — id, workspace_id, name, description, color, archived_at, created_by, created_at, updated_at
tasks             — id, project_id, workspace_id, title, description, status(TODO/IN_PROGRESS/IN_REVIEW/DONE),
                    priority(LOW/MEDIUM/HIGH/URGENT), assignee_id, due_date, created_by,
                    created_at, updated_at, deleted_at(soft delete)
comments          — id, task_id, user_id, content, created_at
activity_logs     — id, task_id, user_id, field_changed, old_value, new_value, action_type, created_at
notifications     — id, user_id, type, reference_id, reference_type, message, read_at, created_at
invite_tokens     — id, workspace_id, email, token, role, expires_at, accepted_at, created_at
```

---

## 13. Navigation (URL Structure)

```
/login                  → Login page
/register               → Register page
/invite?token=xxx       → Accept invite

/app                    → Redirect to /app/my-tasks
/app/my-tasks           → My Tasks (Member default)
/app/team               → Kanban board (Admin/Manager)
/app/projects           → Project list
/app/projects/:id       → Project detail + tasks
/app/tasks/:id          → Task detail (slide-over panel)
/app/reports            → Reports (Admin/Manager)
/app/settings           → Workspace settings (Admin)
/app/settings/members   → Member management (Admin)
```

---

## 14. Success Criteria (Definition of Done)

- [ ] FR-01 → FR-12 tất cả pass QA
- [ ] Unit test coverage ≥ 80% business logic
- [ ] Mỗi API endpoint có integration test (happy + error path)
- [ ] E2E checklist (US-01 → US-05) pass
- [ ] Security checklist pass (XSS, auth, rate limit)
- [ ] Accessibility: 0 critical violations (axe-core)
- [ ] Performance: LCP < 2.5s, API p95 < 500ms (read) / < 1s (write)
- [ ] Không còn blocker Severity 1/2
- [ ] Spec file committed trong repo

---

> **Living Document:** Spec này sẽ được cập nhật khi có thay đổi scope hoặc quyết định mới. Mọi thay đổi phải được review trước khi implement.
