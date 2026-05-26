---
marp: true
theme: default
paginate: true
---

# Agent Skills KIT & TaskFlow Demo
**Báo cáo Tổng Quan & Hướng dẫn Vận hành**

---

# 1. Tổng Quan Về Agent Skills KIT
- **Vấn đề của AI Agents:** Thường "đốt cháy giai đoạn", bỏ qua test/docs, vi phạm bảo mật và vượt quá phạm vi yêu cầu do xu hướng chọn đường ngắn nhất.
- **Giải pháp:** Agent Skills KIT cung cấp hệ thống quy trình (workflows) "chuẩn kỹ sư phần mềm" ép AI tuân thủ qua các Quality Gates.

---

# 2. Triết Lý Thiết Kế Cốt Lõi
1. **Process, not prose:** Kỹ năng là quy trình bắt buộc, có điểm kiểm tra, không phải là văn xuôi tham khảo.
2. **Anti-rationalization:** Cung cấp sẵn các luận điểm phản bác lại các ngụy biện phổ biến của AI (VD: "Tôi sẽ thêm test sau").
3. **Verification is non-negotiable:** Yêu cầu bằng chứng xác minh thực tế (test passing, build output), không chấp nhận giả định.
4. **Progressive disclosure:** Chỉ load thông tin khi cần thiết, tiết kiệm token.

---

# 3. Sáu Hành Vi Bắt Buộc (Core Behaviors)
Xuyên suốt mọi hành động, AI phải tuân thủ 6 nguyên tắc:
1. **Surface Assumptions:** Nêu rõ các giả định, không âm thầm quyết định.
2. **Manage Confusion Actively:** Dừng lại khi mâu thuẫn, không đoán mò.
3. **Push Back When Warranted:** Phản đối user nếu cách tiếp cận sai lệch.
4. **Enforce Simplicity:** Ưu tiên giải pháp đơn giản nhất.
5. **Maintain Scope Discipline:** Chỉ làm đúng scope, không lan man.
6. **Verify, Don't Assume:** Mọi task chưa xong cho đến khi có bằng chứng.

---

# 4. Kiến Trúc 3 Tầng (3 Orchestration Layers)
- **Commands (The When):** 7 lệnh điều phối quy trình (`/spec`, `/plan`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`).
- **Personas (The Who):** 3 Sub-agents chuyên gia:
  - `code-reviewer`: Staff Engineer (Đánh giá 5 trục chất lượng).
  - `security-auditor`: Security Engineer (Rà quét OWASP).
  - `test-engineer`: QA Specialist (Chiến lược Test).
- **Skills (The How):** Hệ thống 20+1 Kỹ năng (20 kỹ năng kỹ thuật cụ thể cùng 1 Meta-skill `using-agent-skills`).

---

# 5. Phân Tích Các Slash Commands Cốt Lõi
- **`/spec`:** Hỏi rõ yêu cầu → sinh `SPEC.md` (6 phần chuẩn). **Gate: User duyệt**.
- **`/plan`:** Đọc `SPEC.md` → vẽ dependency graph → cắt dọc. Sinh `tasks/plan.md`. **Gate: User duyệt**.
- **`/build`:** Gọi 1 lần → AI lặp qua các task pending (RED → GREEN → Commit).
- **`/test`:** TDD cho tính năng mới / Prove-It pattern cho bug fix.
- **`/review`:** Rà soát 5 trục (Correctness, Readability, Architecture, Security, Performance).
- **`/code-simplify`:** Đơn giản hóa có test bảo vệ, tự revert nếu test fail.
- **`/ship`:** Fan-out song song 3 persona → GO/NO-GO + Rollback Plan.

---

# 6. Meta-skill `using-agent-skills`
- **Vai trò:** Không phải skill kỹ thuật — là **bộ điều phối** giúp agent chọn đúng skill theo intent.
- **Cây quyết định chọn skill:**
  - Ý tưởng mơ hồ → `idea-refine`
  - Feature/change mới → `spec-driven-development`
  - Có spec, cần chia việc → `planning-and-task-breakdown`
  - Đang code → `incremental-implementation`
  - Viết/chạy test → `test-driven-development`
  - Lỗi/breakage → `debugging-and-error-recovery`
  - Review → `code-review-and-quality`
  - Deploy → `shipping-and-launch`
  -...

---

# 7. Phân Nhóm 20 Skills Theo Lifecycle
| Nhóm | Số lượng | Mô tả |
|------|----------|-------|
| **Define** | 2 skills | Làm rõ ý tưởng và viết spec |
| **Plan** | 1 skill | Chia spec thành task nhỏ |
| **Build** | 6 skills | Triển khai từng lát cắt |
| **Verify** | 2 skills | Kiểm chứng runtime và xử lý lỗi |
| **Review** | 4 skills | Quality gate trước merge |
| **Ship** | 5 skills | Hoàn tất và release |

**Tổng: 20 core skills + 1 meta-skill = 21**

---

# 8. Mục Tiêu Demo TaskFlow
- **Dự án:** TaskFlow (Sản phẩm quản lý dự án nội bộ).
- **Mục tiêu demo:** Áp dụng Agent Skills KIT trên **1 repo thật** với **1 FR cụ thể**.
- **Tập trung:**
  - Không ném cả PRD vào một prompt.
  - Đi tuần tự: `/spec -> /plan -> /build -> /test -> /review -> /ship`.
  - Có Gatekeeping rõ ràng ở từng chặng.

---

# 9. Khởi tạo: `/spec` và `/plan`
- `note/PRD.md` gồm **12 FR**. Cần **chia nhỏ (vertical slicing)** để tránh tràn context.
- **`/spec`:** Xác định ranh giới & sinh `SPEC.md` chuẩn.
  - *Ví dụ Boundaries:* Không làm SSO, không làm Sub-task.
  - **Gate:** User duyệt `SPEC.md`.
- **`/plan`:** Chỉ đọc → Vẽ dependency graph → Cắt lát dọc (từ DB lên UI).
  - *Kết quả:* `tasks/plan.md` & `tasks/todo.md`.
  - **Gate:** User duyệt Plan.

---

# 10. Cắt PRD Thành Các Lát Cắt (Slices)
*Ví dụ minh họa — đây là thiết kế demo, không phải output mặc định của `/plan`.*
- **Slice A:** `FR-01`, `FR-02` -> Auth, Workspace, Member Invite
- **Slice B:** `FR-03`, `FR-04` -> Project, Task CRUD
- **Slice C:** `FR-05`, `FR-10` -> Status change, Activity Log
- **Slice D:** `FR-06`, `FR-09` -> Comment, In-app Notification
- **Slice E:** `FR-07` -> My Tasks
- **Slice F:** `FR-08` -> Team Dashboard
- **Slice G:** `FR-11` -> Reports
- **Slice H:** `FR-12` + NFR -> Search, debounce, polish

---
# 11. Workflow Chuẩn Cho 1 Slice
**Quy tắc:** lỗi ở chặng nào thì quay lại sửa ngay chặng đó.
1. `/spec` → sinh `SPEC.md`, user duyệt
2. `/plan` → sinh `tasks/plan.md` + `tasks/todo.md`, user duyệt
3. `/build` → **AI tự lặp qua tất cả task pending** (RED→GREEN→commit→task kế)
4. `/test` → kiểm chứng hoặc reproduce bug (Prove-It)
5. `/review` → 5-axis review, phân loại Critical/Important/Suggestion
6. `/code-simplify` (nếu code rối nhưng behavior đã đúng, revert nếu test fail)
7. `/ship` → fan-out 3 persona song song → GO/NO-GO + rollback plan

**Gate:** chưa PASS test và chưa qua review thì không được qua bước sau.
**Lưu ý:** `/build` chỉ cần gọi **1 lần** — AI tự đọc plan và lặp qua từng task.

---




# 12. Giới Thiệu FR-11: Báo Cáo Team (P1)
**Từ PRD:** Manager xem trang Reports với:
- Số task completed theo tuần (bar chart, 4 tuần gần nhất)
- Task completion rate theo từng member (bảng)
- Số task overdue hiện tại theo member

**User Story US-05:**
- Manager vào `/app/reports` → thấy bar chart + bảng member stats
- Click tên member → xem My Tasks của người đó ở chế độ **read-only**
- Dữ liệu chỉ tính trong workspace hiện tại (isolation)

**Phân quyền:** chỉ `Admin` và `Manager` mới truy cập được `/app/reports`
**Milestone:** M3 (W5–W6), cùng nhóm với FR-07 (My Tasks) và FR-08 (Team Dashboard)

---

# 13. `/spec` FR-11 — Khóa Scope Trước Khi Code
- **Input:** `PRD.md` (chỉ FR-11).
- **Output:** `SPEC.md` (6 phần chuẩn):
  - *Objective:* Thống kê 4 tuần, list member read-only.
  - *Boundaries:* **In-scope** (`/reports`), **Out-scope** (Export PDF), **Rule** (Cách ly workspace).
  - *Các phần khác:* Commands, Structure, Style, Testing (TDD Prove-It).
- **Gate:** Duyệt `SPEC.md` → Mới được gọi `/plan`.

---

# 14. `/plan` FR-11 — Chia Task Có Acceptance Criteria
- **Input:** `SPEC.md` của FR-11
- **Output:** `tasks/plan.md` & `tasks/todo.md` gồm 6 task:

| Task | Nội dung | Acceptance Criteria | Phụ thuộc |
|------|----------|---------------------|-----------|
| 1 | Weekly completion API | Trả đúng 4 tuần, label đúng format, count tuần hiện tại chính xác | — |
| 2 | Member stats table | Thống kê đúng số task theo member | Task 1 |
| 3 | Permission + workspace isolation | Admin/Manager xem được, Member bị 403; không lọt data cross-workspace | Task 1 |
| 4 | Reports UI (chart + table) | Chart render đúng, table hiển thị đúng stats | Task 1, 2, 3 |
| 5 | Click member → My Tasks read-only | Điều hướng đúng, không chỉnh được filter/hành vi | Task 4 |
| 6 | Regression FR-11 | Toàn bộ test Task 1-5 vẫn pass | Task 1-5 |

- **Nguyên tắc:** `/build` gọi **1 lần** — AI tự lặp qua từng task theo thứ tự phụ thuộc. Mỗi task: viết test fail → code tối thiểu → chạy full test → commit → chuyển task kế. Nếu bước nào fail → tự chuyển sang `debugging-and-error-recovery`.
- **Gate:** chưa có plan được duyệt → không được chạy `/build`

---

# 15. Các Trường Hợp Lỗi Hay Gặp (FR-11)
*Ví dụ thực tế khi áp dụng workflow — không phải checklist có sẵn trong repo. Repo cung cấp skill `debugging-and-error-recovery` với quy trình tổng quát: reproduce → localize → fix → guard.*
- **Lỗi dữ liệu tuần:** API trả 3 tuần hoặc count tuần hiện tại sai.
  - Nguyên nhân thường gặp: grouping sai mốc thời gian.
  - Cách xử lý: giữ test fail, fix aggregation, chạy lại test.
- **Lỗi phân quyền:** `Member` vẫn gọi được `/reports`.
  - Nguyên nhân thường gặp: thiếu role guard ở route/controller.
  - Cách xử lý: chặn `Member` (403/redirect), test lại matrix role.
- **Lỗi workspace isolation:** dữ liệu workspace B lọt sang workspace A.
  - Nguyên nhân thường gặp: query thiếu `workspaceId`.
  - Cách xử lý: thêm filter workspace vào mọi truy vấn report.
- **Lỗi completion rate:** % làm tròn không đúng (vd 2/3).
  - Nguyên nhân thường gặp: format ở FE và BE không thống nhất.
  - Cách xử lý: chốt rule làm tròn ở một nơi, test snapshot/value.
- **Lỗi read-only:** click member mở My Tasks nhưng vẫn chỉnh được filter/hành vi như owner.
  - Nguyên nhân thường gặp: thiếu cờ `readOnly` trong flow điều hướng.
  - Cách xử lý: truyền mode read-only + test click-through.

---

# 16. Gatekeeping: Khi Nào Tiếp, Khi Nào Dừng
- Nếu `/test` trả **FAIL** → quay lại `/build` đúng task đang làm
- Nếu `/review` trả **NO-GO** → chỉ sửa đúng blocker reviewer nêu ra
- Nếu pass test nhưng code quá rối → `/code-simplify`, rồi bắt buộc `/test` + `/review` lại
- **Được tiếp tục** khi: test PASS, review không còn blocker P0/P1, không trôi scope
- **Phải dừng** khi: test đỏ, review NO-GO, phát hiện sai isolation/role/read-only
- **Không mở rộng sang FR khác** nếu FR-11 chưa xanh toàn bộ

---

# 17. Regression Và `/ship`
- Sau khi toàn bộ task của FR-11 đã qua `/test` và `/review`:
  - nếu có `/code-simplify` thì phải re-test trước khi ship
  - `/test FR-11 regression.`
  - `/ship FR-11.`
- `/ship` sẽ **fan-out** sang 3 persona:
  - `code-reviewer` · `security-auditor` · `test-engineer`
- **Khi nào bắt buộc fan-out?** Repo chỉ cho phép bỏ qua fan-out khi **đồng thời** thỏa cả 3:
  - diff ≤ 2 file
  - diff < 50 dòng
  - không chạm auth, payments, data access, config/env
- *FR-11 chạm role guard + data access → fan-out là bắt buộc.*
- Output cuối: **GO / NO-GO** + **Rollback Plan**

---

# 18. Playbook Từ PRD Đến Release
- `/spec` + `/plan` ở mức PRD tổng.
- Mục tiêu: khóa boundary, mapping 12 FR thành slices, thứ tự làm.
- **Chú thích:** agent tự đọc PRD để **đề xuất** lát cắt; người dùng **duyệt/chỉnh** lại trước khi build (user là orchestrator — §2.1 repo).
- **Không auto 100%:** nếu slice quá to thì tách nhỏ, nếu 2 slice phụ thuộc chặt thì gộp lại.
- Chọn 1 FR (hoặc 1 nhóm FR nhỏ).
- Chạy: `/spec` FR đó -> `/plan` FR đó -> `/build` -> `/test` -> `/review` -> `/code-simplify` (nếu cần) -> `/test` lại -> `/ship` FR đó.
- Lặp đến khi xong 12 FR.
- Cuối cùng chạy `/test regression` toàn hệ thống, rồi `/ship` bản tổng.

---

# 19. Ưu Điểm & Nhược Điểm của Agent Skills KIT
**Ưu điểm:**
- **Chất lượng Senior:** Code bảo hành qua TDD, 5-axis code review, và OWASP.
- **Tính nhất quán:** AI tuân thủ workflow, hạn chế tối đa tình trạng "ảo giác".
- **An toàn triển khai:** Yêu cầu Fan-out đánh giá và có sẵn Rollback Plan trước khi Ship.
- **Tối ưu Token trên từng lệnh:** Nhờ cơ chế *Progressive disclosure* (chỉ load kỹ năng cần thiết thay vì đẩy toàn bộ rulebook vào context).

**Nhược điểm:**
- **Tổng chi phí Token cả dự án cao hơn:** Việc chia nhỏ chu trình, sinh thêm artifacts và gọi nhiều agents (như lúc `/ship`) khiến tổng lượng token tiêu thụ nhiều hơn đáng kể so với cách "prompt làm tắt" 1 bước thông thường.
- **Độ cứng nhắc với Task nhỏ:** Quy trình bắt buộc `/spec -> /plan -> /build` có thể trở nên nặng nề với các thay đổi/sửa lỗi quá nhỏ.
- **Rào cản công nghệ (Hooks):** Yêu cầu Bash, jq, curl để chạy bộ Hook cache nên chưa thực sự thân thiện với môi trường Windows thuần túy.

---

# 20. Cảm ơn đã lắng nghe
