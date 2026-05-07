# Hướng dẫn demo Agent Skills KIT cho TaskFlow

Tài liệu này là runbook chi tiết để demo workflow dùng **Agent Skills KIT** triển khai TaskFlow theo `note/PRD.md`.

Mục tiêu không phải bảo agent "làm hết 12 FR một lần". Cách chạy đúng là:

```text
/spec  -> chốt source truth cho toàn PRD
/plan  -> chia PRD thành các slice nhỏ

Slice A: /build -> /test -> /review -> PASS thì qua Slice B
Slice B: /build -> /test -> /review -> PASS thì qua Slice C
...
Slice H: /build -> /test -> /review -> PASS thì chạy regression

/test regression
/ship
```

Nếu một slice fail test hoặc review có blocker, quay lại `/build` đúng slice đó để sửa. Không được chuyển sang slice sau khi slice hiện tại chưa pass.

---

## Mục lục

- [1. Luật vận hành bắt buộc](#1-luật-vận-hành-bắt-buộc)
- [2. Mapping PRD thành Slice A-H](#2-mapping-prd-thành-slice-a-h)
- [3. Prompt nền: spec và plan](#3-prompt-nền-spec-và-plan)
- [4. Vòng lặp chuẩn cho mỗi slice](#4-vòng-lặp-chuẩn-cho-mỗi-slice)
- [5. Prompt chi tiết từng slice](#5-prompt-chi-tiết-từng-slice)
- [6. Khi gặp lỗi hoặc blocker](#6-khi-gặp-lỗi-hoặc-blocker)
- [7. Regression và ship](#7-regression-và-ship)
- [8. Checklist demo nhanh](#8-checklist-demo-nhanh)
- [9. Ghi chú dùng Gemini CLI](#9-ghi-chú-dùng-gemini-cli)

---

## 1. Luật vận hành bắt buộc

### 1.1. Source truth

Luôn nhắc agent:

```text
note/PRD.md là source truth duy nhất. Nếu implementation hoặc suy luận của agent mâu thuẫn với PRD, ưu tiên PRD.
```

Không tự thêm scope ngoài PRD:

- Không SSO.
- Không Slack/Zalo integration.
- Không mobile native.
- Không billing.
- Không sub-task.
- Không multiple workspaces.
- Notification trong demo là in-app, trừ invite có thể mock email.

### 1.2. Gate trước khi qua slice sau

Một slice chỉ được coi là pass khi có đủ 3 điều kiện:

- `/build` chỉ sửa đúng scope slice đó.
- `/test` PASS theo acceptance criteria liên quan.
- `/review` không còn blocker hoặc P0/P1 finding.

Nếu thiếu một trong ba điều kiện, không qua slice sau.

### 1.3. Prompt chống agent làm quá scope

Dùng ngay khi agent bắt đầu lan sang feature khác:

```text
Dừng lại. Bạn đang vượt scope.
Chỉ xử lý Slice [X] theo tasks/todo.md.
Không sửa hoặc implement phần thuộc Slice khác.
Hãy liệt kê phần nào đang vượt scope và quay lại đúng Slice [X].
```

---

## 2. Mapping PRD thành Slice A-H

| Slice | Scope | FR | US | Gate chính |
|---|---|---|---|---|
| A | Foundation | FR-01, FR-02 | US-04 | Auth, workspace, invite, role pass. |
| B | Project/Task CRUD | FR-03, FR-04 | US-01 | Tạo project/task, validate title, assign pass. |
| C | Status & Audit | FR-05, FR-10 | US-02 | Đổi status đúng quyền, activity log pass. |
| D | Collaboration | FR-06, FR-09 | US-01, US-02 | Comment, mention, notification pass. |
| E | Personal Dashboard | FR-07 | US-03 | My Tasks sort/empty state pass. |
| F | Team Dashboard | FR-08 | US-02 | Kanban, filter, manager visibility pass. |
| G | Reports | FR-11 | US-05 | Reports đúng metric và workspace isolation pass. |
| H | Global Search & Polish | FR-12 + NFR | US-01, US-03, US-05 | Search, debounce, performance, accessibility, security pass. |

---

## 3. Prompt nền: spec và plan

### 3.1. Prompt `/spec`

Copy prompt này vào agent:

```text
/spec
Đọc note/PRD.md làm source truth duy nhất cho TaskFlow.
Tạo SPEC.md cho MVP, bao phủ FR-01 đến FR-12 và US-01 đến US-05.

Yêu cầu SPEC.md phải có:
- Objective và problem statement lấy từ PRD.
- Roles: Admin, Manager, Member.
- Requirement matrix: FR | user value | UI/API surface | acceptance evidence | test type.
- User story matrix: US | role | flow | acceptance criteria | related FR.
- Boundaries: không làm SSO, mobile native, Slack/Zalo, billing, multiple workspaces, sub-task.
- Open assumptions: mỗi task chỉ có 1 assignee, notification demo là in-app, invite email có thể mock.
- Test strategy: unit, integration, E2E/checklist, security, accessibility, performance.

Không viết code ở bước này.
Nếu PRD mâu thuẫn hoặc thiếu thông tin blocking, dừng và liệt kê câu hỏi.
Output cuối cùng: đường dẫn SPEC.md và tóm tắt các assumption.
```

### 3.2. SPEC pass khi nào?

SPEC pass khi có đủ:

- Requirement matrix có đủ `FR-01` đến `FR-12`.
- User story matrix có đủ `US-01` đến `US-05`.
- Boundaries ghi rõ out-of-scope.
- Assumptions ghi rõ các điểm PRD còn open.
- Không có code change ngoài tài liệu spec.

Nếu fail, dùng prompt:

```text
SPEC chưa pass.
Thiếu: [ghi phần thiếu].
Hãy cập nhật SPEC.md, không viết code, không tạo plan.
```

### 3.3. Prompt `/plan`

Chỉ chạy sau khi SPEC pass.

```text
/plan
Dựa trên SPEC.md và note/PRD.md, tạo tasks/plan.md và tasks/todo.md.

Chia implementation thành các vertical slices tuần tự:
A. Foundation: FR-01, FR-02, US-04.
B. Project/Task CRUD: FR-03, FR-04, US-01.
C. Status & Audit: FR-05, FR-10, US-02.
D. Collaboration: FR-06, FR-09.
E. Personal Dashboard: FR-07, US-03.
F. Team Dashboard: FR-08.
G. Reports: FR-11, US-05.
H. Global Search & Polish: FR-12 + NFR.

Với mỗi slice, ghi rõ:
- Scope in/out.
- Dependency từ slice trước.
- Files/modules dự kiến chạm vào.
- Acceptance criteria lấy từ PRD.
- Test gate phải pass.
- Review gate phải pass.
- Demo evidence cần thu.

Không build code ở bước này.
Output cuối cùng: tasks/plan.md, tasks/todo.md và thứ tự chạy slice.
```

### 3.4. Plan pass khi nào?

Plan pass khi:

- Có đủ Slice A-H.
- Mỗi slice có FR/US cụ thể.
- Mỗi slice có test gate và review gate.
- Plan nói rõ slice sau không được bắt đầu nếu slice trước fail.
- Không chia ngang kiểu "backend hết rồi frontend sau".

Nếu plan gom cục, dùng prompt:

```text
Plan hiện tại vẫn gom cục hoặc chia ngang.
Hãy sửa lại thành vertical slices A-H.
Mỗi slice phải có backend + UI/API consumer + test + review gate.
Không build code.
```

---

## 4. Vòng lặp chuẩn cho mỗi slice

Luôn chạy theo đúng chuỗi:

```text
/build Slice X
/test Slice X
/review Slice X
```

Nếu `/test` fail:

```text
/build Slice X - fix test blockers
/test Slice X
/review Slice X
```

Nếu `/review` NO-GO:

```text
/build Slice X - fix review blockers
/test Slice X
/review Slice X
```

Chỉ khi `/test` PASS và `/review` PASS mới chuyển sang `Slice X+1`.

### 4.1. Prompt build template

```text
/build Slice [X]
Đọc tasks/todo.md phần Slice [X] và note/PRD.md.
Chỉ implement Slice [X]: [ghi scope].

Quy tắc bắt buộc:
- Không làm sang slice khác.
- Không refactor phần không liên quan.
- Viết/cập nhật test hoặc checklist trước khi implement.
- Implement tối thiểu để pass acceptance criteria của Slice [X].
- Nếu phát hiện thiếu dependency từ slice trước, dừng và báo blocker.

Output cuối:
- Files changed.
- Acceptance criteria đã xử lý.
- Test/evidence cần chạy ở /test Slice [X].
- Có hay không có blocker.
```

### 4.2. Prompt test template

```text
/test Slice [X]
Kiểm chứng Slice [X] theo tasks/todo.md, SPEC.md và note/PRD.md.

Output bắt buộc:
- PASS hoặc FAIL.
- Command/checklist đã chạy.
- Evidence cho từng acceptance criteria.
- Nếu FAIL: liệt kê blocker, expected vs actual, file/module nghi ngờ, và prompt sửa đề xuất.

Nếu FAIL, không chuyển sang slice tiếp theo.
```

### 4.3. Prompt review template

```text
/review Slice [X]
Review diff của Slice [X] sau khi /test Slice [X] đã chạy.

Review theo 5 trục:
- Correctness so với PRD.
- Readability.
- Architecture boundary.
- Security/authorization/data isolation.
- Performance và missing tests.

Output:
- PASS nếu không có blocker.
- NO-GO nếu còn blocker.
- Findings theo severity: P0 blocker, P1 phải sửa trước khi qua slice sau, P2 có thể backlog.
- Nếu NO-GO: ghi prompt sửa cụ thể cho /build Slice [X] - fix review blockers.
```

---

## 5. Prompt chi tiết từng slice

### 5.1. Slice A - Foundation: Auth, Workspace, Invite

FR/US:

- FR-01 Authentication.
- FR-02 Workspace & Member Management.
- US-04 Invite thành viên vào workspace.

Prompt build:

```text
/build Slice A
Đọc tasks/todo.md phần Slice A, SPEC.md và note/PRD.md.
Chỉ implement Foundation: FR-01, FR-02, US-04.

Scope:
- Email/password register và login.
- Session/JWT hết hạn thì redirect login.
- Workspace model.
- Admin invite member qua email mock/in-app.
- Invite token hết hạn sau 48 giờ.
- Admin đổi role và xóa member.

Không làm:
- Project, task, comment, notification nâng cao, dashboard, reports, search.

Test-first:
- Register/login happy path.
- Login sai password.
- Expired session.
- Invite valid, invite expired, duplicate member.
- Role update.

Output files changed và test evidence cần chạy.
```

Prompt test:

```text
/test Slice A
Kiểm chứng FR-01, FR-02, US-04.

Gate:
- User đăng ký và đăng nhập được.
- Token/session hết hạn redirect login.
- Admin invite email hợp lệ, token sống 48 giờ.
- Email đã là member thì báo lỗi, không gửi invite.
- Invite expired hiển thị lỗi theo PRD.
- Role Admin/Manager/Member có hiệu lực.

Trả PASS/FAIL, command/checklist đã chạy và evidence.
Nếu FAIL, không qua Slice B.
```

Prompt review:

```text
/review Slice A
Review Slice A.

Tập trung:
- Password hashing và không log password/token.
- Session/JWT expiry đúng PRD.
- Role enforcement server-side.
- Workspace isolation nền tảng.
- Invite token không đoán được, có expiry.
- Missing test cho expired token, duplicate member, invite expired.

PASS nếu không có blocker.
NO-GO nếu còn lỗi auth, role hoặc workspace isolation.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| Login chỉ check ở UI, API không enforce auth | Quay lại `/build Slice A - fix auth middleware`. |
| Role chỉ ẩn nút trên UI | Enforce role ở backend route/middleware. |
| Invite token không expiry | Thêm `expires_at`, test expired token. |
| Password lưu plain text | Thêm bcrypt cost >= 12 hoặc mock tương đương nếu demo không có backend thật. |

### 5.2. Slice B - Project và Task CRUD

FR/US:

- FR-03 Project.
- FR-04 Tạo và chỉnh sửa Task.
- US-01 Tạo task mới.

Prompt build:

```text
/build Slice B
Đọc tasks/todo.md phần Slice B, SPEC.md và note/PRD.md.
Chỉ implement Project/Task CRUD: FR-03, FR-04, US-01.

Scope:
- Manager tạo project với name, description, color label.
- Project hiển thị total task và done task.
- Archive project.
- Manager/Member tạo task với title, description, assignee, project, priority, due date, status.
- Validate title bắt buộc, max 200 ký tự.
- Task tạo mới mặc định To Do.
- Nếu có assignee, tạo notification in-app dạng tối thiểu hoặc event stub cho Slice D hoàn thiện.
- Activity log "Created by..." dạng tối thiểu hoặc event stub cho Slice C hoàn thiện.

Không làm:
- Status transition nâng cao.
- Comment.
- Full notification dropdown.
- My Tasks, Kanban, Reports, Search.

Test-first:
- Tạo project.
- Archive project.
- Tạo task valid.
- Title trống thì lỗi và không tạo task.
- Task thuộc đúng workspace/project.

Output files changed và evidence cần chạy.
```

Prompt test:

```text
/test Slice B
Kiểm chứng FR-03, FR-04, US-01.

Gate:
- Manager tạo project thành công.
- Project hiển thị total/done count đúng.
- Manager/Member tạo task với Title + Project thành công.
- Task mới ở status To Do.
- Title trống hiển thị lỗi, không tạo task.
- Task không bị lộ sang workspace khác.

Trả PASS/FAIL, evidence từng acceptance criteria.
Nếu FAIL, không qua Slice C.
```

Prompt review:

```text
/review Slice B
Review Slice B.

Tập trung:
- Validation title/description.
- Workspace/project ownership.
- Không cho tạo task trong archived project nếu PRD yêu cầu hạn chế.
- API contract rõ ràng.
- Không duplicate business logic giữa UI và backend.
- Test đủ happy path và invalid title.

PASS nếu không có blocker.
NO-GO nếu task có thể tạo sai workspace/project hoặc validate sai.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| Task title trống vẫn tạo được | Sửa validation server-side và UI error. |
| Task không gắn workspace_id | Sửa schema/query, thêm test isolation. |
| Archive project vẫn tạo task mới | Chặn create task vào archived project nếu theo PRD edge case. |
| Notification/activity log làm quá nhiều | Chỉ tạo event/stub tối thiểu, để Slice C/D hoàn thiện. |

### 5.3. Slice C - Status và Activity Log

FR/US:

- FR-05 Chuyển trạng thái Task.
- FR-10 Activity Log.
- US-02 Cập nhật trạng thái task.

Prompt build:

```text
/build Slice C
Đọc tasks/todo.md phần Slice C, SPEC.md và note/PRD.md.
Chỉ implement Status & Audit: FR-05, FR-10, US-02.

Scope:
- Assignee và Manager đổi status.
- User không phải assignee/manager bị chặn.
- Status flow: To Do, In Progress, In Review, Done.
- Optimistic UI hoặc cập nhật trong thời gian kỳ vọng.
- Activity log cho create/edit/status/comment theo khả năng hiện tại.
- Không cho xóa activity log.

Không làm:
- Comment UI đầy đủ nếu chưa tới Slice D.
- Reports.
- Global search.

Test-first:
- Assignee đổi To Do -> In Progress.
- Manager đổi status task bất kỳ trong workspace.
- Non-assignee bị disable hoặc API reject.
- Activity log ghi old_value/new_value/user/timestamp.

Output files changed và evidence cần chạy.
```

Prompt test:

```text
/test Slice C
Kiểm chứng FR-05, FR-10, US-02.

Gate:
- Assignee đổi status thành công.
- Manager đổi status thành công.
- Non-assignee/non-manager không đổi được status.
- Activity log ghi đúng người, thời gian, old status, new status.
- Activity log không xóa được.
- Team Dashboard nếu đã có stub/query thì dữ liệu status không bị sai.

Trả PASS/FAIL.
Nếu FAIL, không qua Slice D.
```

Prompt review:

```text
/review Slice C
Review Slice C.

Tập trung:
- Authorization đổi status ở backend.
- Race condition khi nhiều user đổi status.
- Activity log immutable.
- Audit trail không thiếu old/new value.
- Optimistic UI rollback nếu API fail.

PASS nếu không có blocker.
NO-GO nếu đổi status sai quyền hoặc activity log thiếu.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| UI disable nhưng API vẫn đổi được | Sửa backend authorization. |
| Activity log chỉ ghi text, không có old/new | Thêm structured fields hoặc payload đủ audit. |
| Log có thể xóa | Xóa endpoint delete log hoặc enforce deny. |
| Optimistic UI không rollback | Thêm rollback/toast khi API fail. |

### 5.4. Slice D - Comment, Mention, Notification

FR/US:

- FR-06 Comment.
- FR-09 Notification In-App.

Prompt build:

```text
/build Slice D
Đọc tasks/todo.md phần Slice D, SPEC.md và note/PRD.md.
Chỉ implement Collaboration: FR-06, FR-09.

Scope:
- Member trong workspace comment vào task.
- Plain text comment.
- Mention @username trong comment.
- Notification in-app cho assigned task, comment của người khác, due soon, mention.
- Badge counter, dropdown list, mark-as-read.

Không làm:
- Reports.
- Global search.
- Email notification.

Test-first:
- Comment thành công.
- Mention tạo notification đúng user.
- Comment của chính mình không tạo notification cho chính mình nếu PRD loại trừ.
- Mark notification read.

Output files changed và evidence cần chạy.
```

Prompt test:

```text
/test Slice D
Kiểm chứng FR-06, FR-09.

Gate:
- Member cùng workspace comment được.
- User ngoài workspace không comment được.
- @mention tạo notification đúng người.
- Comment trên task của mình bởi người khác tạo notification.
- Comment do chính mình tạo không tự notify mình.
- Badge/dropdown/read state đúng.

Trả PASS/FAIL.
Nếu FAIL, không qua Slice E.
```

Prompt review:

```text
/review Slice D
Review Slice D.

Tập trung:
- XSS trong comment.
- Mention parser không notify sai user.
- Notification không leak cross-workspace.
- Badge count đúng read/unread.
- Polling 5s nếu có, không gây load quá mức.

PASS nếu không có blocker.
NO-GO nếu comment XSS hoặc notification sai người/workspace.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| Comment render HTML trực tiếp | Sanitize hoặc render plain text. |
| Mention tìm user toàn hệ thống | Scope query theo workspace. |
| Notification tự notify tác giả comment | Thêm rule loại trừ actor. |
| Badge count không theo read_at | Sửa query unread count. |

### 5.5. Slice E - My Tasks

FR/US:

- FR-07 Dashboard cá nhân My Tasks.
- US-03 Xem My Tasks.

Prompt build:

```text
/build Slice E
Đọc tasks/todo.md phần Slice E, SPEC.md và note/PRD.md.
Chỉ implement Personal Dashboard: FR-07, US-03.

Scope:
- Trang /app/my-tasks.
- Hiển thị task assigned cho user hiện tại.
- Loại task Done khỏi danh sách mặc định.
- Sort: overdue lên đầu, sau đó due date tăng dần, task không có due date xuống cuối.
- Badge Overdue nếu due date < hôm nay.
- Filter All / To Do / In Progress.
- Empty state theo PRD.

Không làm:
- Team Kanban.
- Reports.
- Global search.

Test-first:
- User có task thấy đúng danh sách.
- Done bị loại.
- Sort đúng.
- Empty state đúng.

Output files changed và evidence cần chạy.
```

Prompt test:

```text
/test Slice E
Kiểm chứng FR-07, US-03.

Gate:
- My Tasks chỉ hiển thị task assigned cho user.
- Task Done không hiển thị mặc định.
- Overdue lên đầu.
- Due date tăng dần.
- Task không có due date xuống cuối.
- Empty state đúng khi user không có task.
- Filter All / To Do / In Progress đúng.

Trả PASS/FAIL.
Nếu FAIL, không qua Slice F.
```

Prompt review:

```text
/review Slice E
Review Slice E.

Tập trung:
- Sort logic rõ ràng và có test.
- Date comparison không lệch timezone.
- Query không lộ task của user khác.
- Empty/loading/error state.
- Responsive >= 375px.

PASS nếu không có blocker.
NO-GO nếu My Tasks lộ dữ liệu hoặc sort sai PRD.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| Sort overdue sai do timezone | Chuẩn hóa date-only hoặc timezone rõ ràng. |
| Hiển thị cả task Done | Sửa default filter/query. |
| Empty state không đúng text PRD | Sửa UI copy. |
| Query theo assignee client-side | Filter server-side theo user/workspace. |

### 5.6. Slice F - Team Dashboard Kanban

FR/US:

- FR-08 Dashboard Team.
- US-02 liên quan status visibility.

Prompt build:

```text
/build Slice F
Đọc tasks/todo.md phần Slice F, SPEC.md và note/PRD.md.
Chỉ implement Team Dashboard: FR-08.

Scope:
- Manager xem Kanban board theo status.
- Filter theo assignee, project, priority, due date range.
- Search theo task title trong board.
- Status update phản ánh trong board trong thời gian kỳ vọng.
- Drag-and-drop nếu khả thi; fallback click dropdown cho mobile.

Không làm:
- Reports.
- Global header search.

Test-first:
- Manager thấy board.
- Member không có quyền manager view nếu PRD giới hạn.
- Filter đúng.
- Search trong board đúng.
- Status update từ Slice C phản ánh trên board.

Output files changed và evidence cần chạy.
```

Prompt test:

```text
/test Slice F
Kiểm chứng FR-08.

Gate:
- Manager xem tất cả task workspace trên Kanban.
- Các cột theo status đúng.
- Filter assignee/project/priority/due date đúng.
- Search title trong board đúng.
- Status đổi cập nhật trong board.
- Mobile có fallback nếu drag-drop không dùng được.

Trả PASS/FAIL.
Nếu FAIL, không qua Slice G.
```

Prompt review:

```text
/review Slice F
Review Slice F.

Tập trung:
- Query/filter performance.
- Authorization Manager view.
- Drag/drop accessibility hoặc fallback.
- Không duplicate status logic với Slice C.
- Loading/error/empty states.

PASS nếu không có blocker.
NO-GO nếu board lộ data cross-workspace hoặc filter sai.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| Filter chạy client-side trên toàn bộ data | Chuyển filter vào API/query nếu data lớn. |
| Member xem được team board trái PRD | Enforce role. |
| Drag/drop không dùng được mobile | Thêm dropdown fallback. |
| Board không cập nhật sau status change | Invalidate query/poll/refetch. |

### 5.7. Slice G - Reports

FR/US:

- FR-11 Báo cáo Team.
- US-05 Xem báo cáo team.

Prompt build:

```text
/build Slice G
Đọc tasks/todo.md phần Slice G, SPEC.md và note/PRD.md.
Chỉ implement Reports: FR-11, US-05.

Scope:
- Trang /app/reports cho Manager.
- Bar chart Tasks Completed theo 4 tuần gần nhất.
- Bảng Member | Assigned | Completed | Overdue | Completion Rate (%).
- Click member trong bảng mở/lọc task của member đó read-only cho Manager.
- Dữ liệu chỉ tính trong workspace hiện tại.

Không làm:
- Global search.
- Export Excel.
- Time tracking.

Test-first:
- Metric completed theo tuần.
- Completion rate.
- Overdue theo member.
- Workspace isolation.
- Manager-only.

Output files changed và evidence cần chạy.
```

Prompt test:

```text
/test Slice G
Kiểm chứng FR-11, US-05.

Gate:
- Reports chỉ Manager thấy.
- Bar chart có 4 tuần gần nhất.
- Bảng có Assigned, Completed, Overdue, Completion Rate.
- Metric đúng với dữ liệu test.
- Dữ liệu chỉ trong workspace hiện tại.
- Click member mở/lọc My Tasks read-only.

Trả PASS/FAIL.
Nếu FAIL, không qua Slice H.
```

Prompt review:

```text
/review Slice G
Review Slice G.

Tập trung:
- Metric definition rõ ràng.
- Query không N+1.
- Workspace isolation.
- Permission Manager-only.
- Completion rate tránh chia cho 0.
- Chart có fallback/empty state.

PASS nếu không có blocker.
NO-GO nếu metric sai hoặc lộ data workspace khác.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| Completion rate chia 0 | Nếu Assigned = 0, hiển thị 0% hoặc N/A theo quyết định spec. |
| Reports tính mọi workspace | Thêm workspace_id filter vào mọi query. |
| Member xem Reports | Enforce Manager-only. |
| Chart crash khi không có data | Thêm empty state. |

### 5.8. Slice H - Global Search, NFR, Polish

FR/US:

- FR-12 Search toàn cục.
- NFR: performance, security, accessibility, usability, browser support.

Prompt build:

```text
/build Slice H
Đọc tasks/todo.md phần Slice H, SPEC.md và note/PRD.md.
Chỉ implement Global Search & Polish: FR-12 + NFR.

Scope:
- Header global search tìm task theo title trong workspace.
- Debounce 300ms.
- Tối đa 10 kết quả.
- Không lộ task workspace khác.
- Rà edge cases PRD mục 10.
- Accessibility: form labels, keyboard navigation cho Kanban fallback.
- Performance: API read p95 mục tiêu < 500ms ở demo dataset, page load hợp lý.
- Security: input sanitization, authz, rate limit nếu có API public.

Không làm:
- Public API.
- Webhooks.
- Dark mode.

Test-first:
- Search title.
- Debounce.
- Max 10 results.
- Workspace isolation.
- XSS input.
- Accessibility checklist.

Output files changed và evidence cần chạy.
```

Prompt test:

```text
/test Slice H
Kiểm chứng FR-12 và NFR chính.

Gate:
- Global search tìm task theo title.
- Debounce 300ms.
- Tối đa 10 kết quả.
- Không trả task workspace khác.
- Input search/task/comment không gây XSS.
- Core forms có label.
- Kanban có keyboard/fallback interaction.
- Loading state nếu API > 300ms.

Trả PASS/FAIL.
Nếu FAIL, không chạy regression.
```

Prompt review:

```text
/review Slice H
Review Slice H.

Tập trung:
- Search query performance và index nếu cần.
- Debounce không spam API.
- Workspace isolation.
- XSS/input sanitization.
- Accessibility AA cho core forms.
- Không thêm dark mode hoặc feature ngoài PRD.

PASS nếu không có blocker.
NO-GO nếu search lộ data, XSS, hoặc NFR core fail.
```

Blocker thường gặp:

| Blocker | Cách xử lý |
|---|---|
| Search trả quá 10 kết quả | Thêm limit server-side. |
| Debounce chỉ ở UI, API vẫn bị spam qua race | Hủy request cũ hoặc ignore stale response. |
| Search không filter workspace | Thêm workspace_id vào query. |
| XSS trong title/comment | Sanitize/render plain text. |
| Form thiếu label | Thêm label/aria-label rõ ràng. |

---

## 6. Khi gặp lỗi hoặc blocker

### 6.1. Phân loại lỗi

| Loại | Ví dụ | Quyết định |
|---|---|---|
| Test fail | Acceptance criteria không pass | Không qua slice sau. |
| Review blocker P0/P1 | Sai quyền, lộ data, thiếu authz | Không qua slice sau. |
| Scope creep | Agent làm feature slice khác | Dừng, revert/sửa scope nếu cần. |
| Missing context | Agent quên PRD/SPEC/plan | Bắt đọc lại tài liệu. |
| Tool/env fail | Test command lỗi do dependency/env | Phân biệt lỗi môi trường và lỗi code. |
| PRD ambiguity | PRD thiếu quyết định blocking | Dừng, ghi assumption hoặc hỏi người quyết định. |

### 6.2. Prompt khi test fail

```text
/build Slice [X] - fix test blockers
/test Slice [X] vừa FAIL.

Blocking failures:
- [copy lỗi 1]
- [copy lỗi 2]

Yêu cầu:
- Chỉ sửa lỗi trong Slice [X].
- Không mở rộng scope.
- Không làm sang slice khác.
- Giữ behavior đã pass trước đó.
- Sau khi sửa, ghi rõ file changed và yêu cầu chạy lại /test Slice [X].
```

Sau đó chạy lại:

```text
/test Slice [X]
Chạy lại đúng các gate vừa fail và regression nhỏ cho các gate đã pass trong Slice [X].
```

### 6.3. Prompt khi review NO-GO

```text
/build Slice [X] - fix review blockers
/review Slice [X] vừa NO-GO.

Review blockers:
- [copy finding P0/P1]

Yêu cầu:
- Sửa đúng blocker.
- Không refactor rộng.
- Không làm sang slice khác.
- Nếu blocker liên quan security/authorization, thêm test chứng minh.
- Sau khi sửa, yêu cầu chạy lại /test Slice [X] rồi /review Slice [X].
```

### 6.4. Prompt khi agent làm quá scope

```text
Dừng lại. Bạn đang làm quá scope của Slice [X].

Hãy:
1. Liệt kê các thay đổi đang thuộc ngoài Slice [X].
2. Đề xuất cách cô lập hoặc hoãn chúng sang slice đúng.
3. Chỉ tiếp tục phần thuộc Slice [X].

Không tiếp tục implement cho đến khi scope được thu gọn.
```

### 6.5. Prompt khi agent quên context

```text
Bạn đang thiếu context.
Đọc lại theo thứ tự:
1. note/PRD.md
2. SPEC.md
3. tasks/plan.md
4. tasks/todo.md phần Slice [X]

Sau đó tóm tắt lại:
- Slice hiện tại là gì.
- FR/US liên quan.
- Acceptance gate.
- Những việc không được làm trong slice này.

Không viết code trong phản hồi này.
```

### 6.6. Prompt khi lỗi do môi trường

```text
/test Slice [X] bị lỗi môi trường.

Hãy phân loại:
- Lỗi command/dependency/config hay lỗi code?
- Command nào fail?
- Log quan trọng là gì?
- Cách sửa tối thiểu là gì?

Không sửa business logic nếu chưa chứng minh đây là lỗi code.
```

### 6.7. Prompt khi PRD mơ hồ

```text
PRD đang thiếu hoặc mơ hồ ở điểm blocking sau:
- [ghi điểm mơ hồ]

Hãy đề xuất assumption tối thiểu để tiếp tục demo, ghi vào SPEC.md mục Assumptions.
Không implement cho đến khi assumption được ghi rõ.
```

---

## 7. Regression và ship

### 7.1. Chỉ chạy regression khi nào?

Chỉ chạy regression khi:

- Slice A-H đều đã `/test` PASS.
- Slice A-H đều đã `/review` PASS.
- Không còn blocker P0/P1.
- Không còn scope creep chưa xử lý.

### 7.2. Prompt regression

```text
/test regression
Tất cả Slice A-H đã pass riêng lẻ.
Chạy regression toàn bộ MVP theo note/PRD.md:
- FR-01 đến FR-12.
- US-01 đến US-05.
- NFR quan trọng: security, workspace isolation, performance, accessibility, usability.
- Edge cases PRD mục 10.

Output:
- PASS/FAIL tổng.
- Evidence theo từng FR.
- Evidence theo từng US.
- Lệnh test/checklist đã chạy.
- Nếu FAIL, chỉ rõ slice nào phải quay lại sửa.

Nếu regression FAIL, không chạy /ship.
```

### 7.3. Prompt ship

Chỉ chạy sau regression pass.

```text
/ship
Chỉ chạy sau khi Slice A-H đã pass /build, /test, /review và regression đã pass.

Hãy tổng hợp release decision cho staging:
- Scope đã hoàn thành theo FR-01 đến FR-12 và US-01 đến US-05.
- Test evidence chính.
- Review/security/test coverage findings còn lại.
- Residual risks.
- GO/NO-GO.
- Rollback plan: trigger conditions, rollback procedure, recovery goal.

Nếu còn blocker về auth, workspace isolation, permission, activity log, notification, reports hoặc search, kết luận NO-GO.
```

### 7.4. Mẫu GO/NO-GO mong đợi

```text
Release decision: GO hoặc NO-GO

Evidence:
- FR-01 PASS: [command/checklist]
- FR-02 PASS: [command/checklist]
- ...
- US-05 PASS: [command/checklist]

Residual risks:
- [risk nếu có]

Rollback plan:
- Trigger: [điều kiện rollback]
- Procedure: [cách rollback]
- Recovery goal: [mục tiêu khôi phục]
```

---

## 8. Checklist demo nhanh

Trước khi bắt đầu:

- Đã mở `note/PRD.md`.
- Đã biết out-of-scope.
- Đã thống nhất làm Slice A-H, không làm 1 cục.
- Đã có prompt `/spec` và `/plan`.

Sau `/spec`:

- Có đủ FR-01 đến FR-12.
- Có đủ US-01 đến US-05.
- Có assumptions và boundaries.

Sau `/plan`:

- Có Slice A-H.
- Mỗi slice có test gate.
- Mỗi slice có review gate.
- Plan nói rõ fail thì không qua slice sau.

Sau mỗi slice:

- `/build Slice X` không vượt scope.
- `/test Slice X` PASS.
- `/review Slice X` PASS.
- Blocker đã được sửa trong chính slice đó.

Trước `/ship`:

- Regression pass.
- Không còn P0/P1.
- Có rollback plan.

---

## 9. Ghi chú dùng Gemini CLI

Nếu dùng Gemini CLI, quy trình nhập prompt vẫn giống nhau. Chỉ khác cách khởi động:

```powershell
cd D:\tenomad\task04
gemini
```

Nếu muốn dùng model mạnh hơn:

```powershell
gemini -m gemini-2.5-pro
```

Mẹo thao tác:

| Tình huống | Prompt/lệnh |
|---|---|
| Xem slash commands | Gõ `/` rồi Tab |
| Thoát | `/quit` hoặc `Ctrl+C` |
| Tiếp tục session cũ | `gemini --resume latest` |
| Agent quên context | Dùng prompt "Bạn đang thiếu context" ở mục 6.5 |
| Agent làm quá scope | Dùng prompt "Dừng lại. Bạn đang làm quá scope" ở mục 6.4 |
| Test fail | Dùng prompt fix test blockers ở mục 6.2 |
| Review NO-GO | Dùng prompt fix review blockers ở mục 6.3 |

Không khuyến nghị dùng auto-approve/yolo trong demo có sửa code, vì mục tiêu của demo là chứng minh gate và kiểm soát scope.

---

## Kết luận

Điểm cần nhấn trong buổi demo: Agent Skills KIT không làm thay đổi bản chất quản lý dự án. Nó ép agent làm việc giống kỹ sư có kỷ luật:

```text
Chốt yêu cầu -> chia lát nhỏ -> build một lát -> test -> review -> sửa blocker -> pass -> qua lát sau -> regression -> ship
```

Nếu bỏ gate hoặc cho agent làm nhiều slice cùng lúc, demo sẽ mất giá trị chính của KIT.
