# Hướng dẫn áp dụng bộ Agent Skills cho TaskFlow PRD

Dựa trên triết lý của bộ `agent-skills` (đề cao *Vertical Slicing* - cắt dọc tính năng và *Verification* - kiểm chứng liên tục), việc ném toàn bộ 12 Functional Requirements (FR) cùng lúc cho AI là một **anti-pattern**. Điều này sẽ làm tràn context, sinh ra code khó debug và mất kiểm soát.

Thay vào đó, bạn cần chia PRD thành các **cụm tính năng (Vertical Slices)** và áp dụng trọn vẹn vòng đời các lệnh (`/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`) cho từng cụm.

---

## 1. Chiến lược gom nhóm (Vertical Slicing)

Bạn nên gom 12 FR thành các lát cắt nhỏ, có thể test được và mang lại giá trị độc lập. Dựa vào Milestone trong PRD, chúng ta có thể chia như sau:

- **Slice 1: Nền tảng Auth & Workspace** (FR-01, FR-02)
- **Slice 2: Core Task CRUD** (FR-03, FR-04, FR-05)
- **Slice 3: Dashboards & Views** (FR-07, FR-08, FR-12)
- **Slice 4: Team Collaboration** (FR-06, FR-09, FR-10)
- **Slice 5: Reporting** (FR-11)

**Cách làm:** Bạn sẽ chạy toàn bộ quy trình dưới đây cho **Slice 1** cho đến khi hoàn thiện (ship), rồi mới lặp lại quy trình cho **Slice 2**, v.v.

---

## 2. Áp dụng các lệnh theo vòng đời (Workflow)

Với mỗi Slice, bạn sử dụng lần lượt các lệnh sau:

### Bước 1: Lệnh `/spec` (Xác định cấu trúc kỹ thuật)
- **Khi nào dùng:** Mở đầu mỗi Slice. Lúc này bạn đã có PRD (yêu cầu nghiệp vụ), nhưng AI cần thiết kế kỹ thuật (API, DB schema, UI states) trước khi code.
- **Đầu vào (Input):**
  - Nội dung của các FR thuộc Slice đó (VD: nội dung FR-01 và FR-02).
  - User Stories tương ứng.
  - Non-Functional Requirements (NFR-03 về Security rất quan trọng cho Auth).
- **Đầu ra (Output):**
  - Một tài liệu kỹ thuật (VD: `docs/specs/slice-1-auth.md`).
  - Gồm Data Models, API Endpoints, UI Component Tree và danh sách các thay đổi cần thiết.

### Bước 2: Lệnh `/plan` hoặc `/planning` (Chia nhỏ công việc)
- **Khi nào dùng:** Ngay sau khi bản Spec ở Bước 1 được chốt.
- **Đầu vào (Input):**
  - File Spec vừa tạo.
- **Đầu ra (Output):**
  - Một danh sách checklist các task cực nhỏ (VD: `plan.md` hoặc `todo.md`) có đánh dấu checkbox `[ ]`.
  - Các task được sắp xếp theo thứ tự phụ thuộc (ví dụ: Tạo migration DB trước → Viết API backend → Làm UI Frontend → Tích hợp).

### Bước 3: Lệnh `/build` (Triển khai code)
- **Khi nào dùng:** Bắt đầu code từng mục trong checklist của `/plan`.
- **Đầu vào (Input):**
  - Chỉ thị rõ ràng: *"Hãy làm task số 1 và số 2 trong plan.md"*
  - Các file gốc cần sửa.
- **Đầu ra (Output):**
  - Code thực tế được sinh ra.
  - Ghi chú quan trọng: `/build` đòi hỏi *incremental implementation*. Không yêu cầu build cả 5 task cùng lúc. Build xong 1-2 task thì check lại `plan.md`.

### Bước 4: Lệnh `/test` (Kiểm chứng)
- **Khi nào dùng:** 
  - Ngay sau khi `/build` xong một logic quan trọng.
  - Hoặc khi chạy thử thấy lỗi (Bug).
- **Đầu vào (Input):**
  - File code vừa viết.
  - Lỗi sinh ra ở terminal (nếu có).
- **Đầu ra (Output):**
  - Unit/Integration tests chứng minh tính năng hoạt động (TDD).
  - Hoặc bản fix lỗi dựa trên test (Prove-It pattern: viết test để tái hiện lỗi, sau đó sửa code cho test pass).

*(Quy trình `/build` và `/test` sẽ lặp lại liên tục cho đến khi tick hết các ô `[x]` trong bản plan).*

### Bước 5: Lệnh `/review` & `/code-simplify` (Đánh giá & Tối ưu)
- **Khi nào dùng:** Khi checklist của Slice đã hoàn thành, chuẩn bị merge code hoặc chuyển sang Slice tiếp theo.
- **Đầu vào (Input):**
  - Git diff của toàn bộ những file vừa tạo/sửa trong Slice hiện tại.
- **Đầu ra (Output):**
  - Đánh giá theo 5 trục: tính chính xác, dễ đọc, kiến trúc, bảo mật và hiệu năng.
  - Nếu code quá phức tạp, bạn gọi thêm `/code-simplify` để AI refactor code cho ngắn gọn, dễ hiểu hơn nhưng **không thay đổi hành vi**.

### Bước 6: Lệnh `/ship` (Nghiệm thu và Triển khai)
- **Khi nào dùng:** Hoàn thành xong một Slice lớn (hoặc một Milestone như M1, M2 trong PRD), chuẩn bị đẩy lên staging/production.
- **Đầu vào (Input):**
  - Toàn bộ changeset.
- **Đầu ra (Output):**
  - Orchestration chạy song song 3 subagents: `code-reviewer`, `security-auditor`, `test-engineer`.
  - Một báo cáo tổng hợp Quyết định GO hay NO-GO.
  - Rollback plan (kế hoạch lùi lại nếu lên production bị sập).

---

## 3. Ví dụ áp dụng thực tế (Chạy Milestone 1 - Core CRUD)

1. **Khởi tạo:** `Claude, tôi muốn bắt đầu Milestone 1. Chạy /spec cho FR-03, FR-04, FR-05 (Quản lý Project và Task CRUD).`
2. **Lên kế hoạch:** `Spec trông ổn rồi, hãy chạy /plan để chia nhỏ các bước thực hiện.`
3. **Bắt đầu code:** `Chạy /build cho task số 1 trong plan (Tạo Prisma schema cho Project và Task).`
4. **Viết Test:** `Chạy /test để đảm bảo backend thao tác DB CRUD đúng.`
5. **Lặp lại:** `Tiếp tục /build task số 2 (Tạo API route) ...`
6. **Kiểm duyệt:** Sau khi xong cả API và UI: `Chạy /review cho các file vừa thay đổi.`
7. **Đẩy code:** `Chạy /ship để đánh giá rủi ro trước khi merge nhánh này vào main.`

---

## 4. Kịch bản thực chiến chi tiết: 1 repo, 1 FR với Slice 5: Reporting (FR-11)

Phần này mô phỏng cách làm **trên một repo thật**, nhưng chỉ xử lý **một FR duy nhất** theo đúng tinh thần của repo `agent-skills`: đi tuần tự `/spec -> /plan -> /build -> /test -> /review`, làm theo **incremental slices**, và không coi task là xong nếu chưa có bằng chứng verify.

Trong repo demo này, Reporting đang có dấu vết rõ ở:
- `demo/SPEC.md`
- `tasks/plan.md`
- `tasks/todo.md`
- `demo/backend/src/routes/report.ts`
- `demo/backend/src/controllers/report.controller.ts`
- `demo/backend/tests/integration/reports.test.ts`

Lưu ý: trong `tasks/plan.md` và `tasks/todo.md`, phần này đang được đặt tên là **Slice G — Reports**; còn trong tài liệu tổng quan ở đây, nó tương ứng với **Slice 5: Reporting (FR-11)**.

### Bản prompt rút gọn

Nếu agent đã có context repo, bạn có thể dùng bản ngắn như sau:

1. `/spec FR-11 only. Reports only.`
2. `/plan Split FR-11 into small verifiable tasks.`
3. `/build Task 1 only.`
4. `/test Reports Task 1.`
5. `/review FR-11 backend.`
6. `/build Task 2 only.`
7. `/test Reports Task 2.`
8. `/review FR-11.`
9. `/ship FR-11.`

Nếu muốn tối giản hơn nữa, có thể chỉ dùng `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship`, nhưng chỉ an toàn khi agent đã bám đúng `SPEC.md`, `tasks/plan.md`, `tasks/todo.md` và không bị trôi scope.

### Bước 1: Khởi tạo `/spec`
**Bạn gõ lệnh:** `/spec FR-11 only. Reports page + reports APIs. No Search. No other dashboards.`
- **Kết quả mong muốn:** AI cập nhật hoặc sinh ra spec nhỏ cho đúng scope của FR-11:
  - UI: `/app/reports`
  - API: `GET /reports/completion`, `GET /reports/members`
  - Quyền: chỉ `Admin` và `Manager` được xem
  - Acceptance evidence: bar chart 4 tuần, bảng member stats, click member để xem `My Tasks` ở chế độ read-only, dữ liệu chỉ trong workspace hiện tại

### Bước 2: Chia nhỏ bằng `/plan`
**Bạn gõ lệnh:** `/plan Split FR-11 into small verifiable tasks.`
- **Kết quả:** AI tạo checklist kiểu này trong `tasks/todo.md`:
  - `[ ]` Task 1: Backend `GET /reports/completion` trả dữ liệu completed theo 4 tuần
  - `[ ]` Task 2: Backend `GET /reports/members` trả bảng Assigned / Completed / Overdue / Rate(%)
  - `[ ]` Task 3: Permission guard + workspace isolation cho Reports
  - `[ ]` Task 4: Frontend `/app/reports` render chart + member table
  - `[ ]` Task 5: Click member -> mở `My Tasks` read-only
  - `[ ]` Task 6: Regression cho toàn bộ FR-11

Điểm quan trọng: **không build cả 6 task cùng lúc**. Repo này ưu tiên làm từng lát nhỏ, test xong rồi mới sang lát tiếp theo.

### Bước 3: `/build` lát backend đầu tiên
**Bạn gõ lệnh:** `/build Task 1 only. Backend weekly completion. No frontend.`
- **Phạm vi file hợp lý:**
  - `demo/backend/src/routes/report.ts`
  - `demo/backend/src/controllers/report.controller.ts`
  - nếu cần thì thêm helper aggregation nhỏ ở backend

### Bước 4: `/test` ngay sau lát backend
**Bạn gõ lệnh:** `/test Reports Task 1: 4 weeks, correct labels, correct current-week count.`

💥 **Sự cố 1 (Test Fail):** Test đỏ vì:
- API chỉ trả 3 tuần thay vì 4 tuần
- label tuần sai format
- hoặc count của tuần hiện tại bị lệch do grouping sai mốc thời gian

- **Cách xử lý theo Prove-It pattern:** giữ nguyên test lỗi để chứng minh bug tồn tại, rồi gõ:
  > *"Test của `reports` đang fail do weekly grouping sai. Hãy dùng workflow `/test` theo Prove-It pattern: reproduce rõ bug, localize logic tính tuần, fix code, rồi chạy lại test cho đến khi pass."*

AI sửa aggregation logic và chỉ khi test xanh mới được qua bước tiếp.

### Bước 5: `/review` cho lát backend
**Bạn gõ lệnh:** `/review FR-11 backend.`

`code-reviewer` sẽ soi theo five-axis review. Một phản hồi thực tế có thể là:
1. **Correctness:** completion rate chưa làm tròn đúng quy tắc mong muốn.
2. **Security:** thiếu guard nên `Member` vẫn gọi được endpoint reports.
3. **Architecture:** đang trộn permission check, query và formatting vào một hàm quá dài.

- **Cách xử lý:** quay lại `/build` đúng scope reviewer bắt lỗi, ví dụ:
  > *`/build Fix review findings only: role guard + small helper split. Keep response contract.`*

Sau đó chạy lại `/test` rồi `/review`. Chỉ khi hết blocker mới sang task tiếp theo.

### Bước 6: `/build` lát backend thứ hai và UI
Khi phần backend pass, bạn tiếp tục từng lát:

1. `/build Task 2 + Task 3 only. Member stats + permission + workspace isolation.`
2. `/test Reports Task 2: stats + rate + cross-workspace isolation.`
3. `/review FR-11 backend again.`
4. `/build Task 4 + Task 5 only. Reports page + chart + member table + read-only click-through.`
5. `/test Reports UI: chart render + table render + permission guard + click-through.`

💥 **Sự cố 2 (Review NO):** reviewer trả về NO-GO vì:
1. Chart hiển thị đúng nhưng bảng rate % bị làm tròn sai.
2. Click member điều hướng sang view có thể chỉnh filter như member thường, không phải read-only.

- **Cách xử lý:** quay lại `/build` đúng 2 lỗi đó, không tranh thủ sửa thêm phần khác. Đây là chỗ repo nhấn mạnh **Maintain Scope Discipline**.

### Bước 7: `/code-simplify` nếu UI bắt đầu phình to
**Bạn gõ lệnh:** `/code-simplify Reports page too large. Split logic without changing behavior.`

Lúc này AI có thể tách thành các component/hook nhỏ hơn như:
- `completion-chart`
- `member-table`
- `member-tasks-view`

Sau đó phải chạy lại `/test` để chứng minh refactor không làm lệch hành vi.

### Bước 8: Chốt FR-11 bằng regression và `/ship`
Khi tất cả task của Slice 5 đều đã qua `/test` và `/review`, bạn mới gõ:

1. `/test FR-11 regression.`
2. `/ship FR-11.`

Ở bước `/ship`, hệ thống sẽ fan-out sang `code-reviewer`, `security-auditor`, `test-engineer`, rồi hợp nhất kết quả thành **GO/NO-GO** và **Rollback Plan**.

Nếu `/ship` còn blocker, bạn quay lại đúng lát liên quan để sửa. Nếu **GO**, lúc đó mới coi FR-11 đã hoàn tất theo đúng workflow của repo.
