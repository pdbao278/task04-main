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
4. **Enforce Simplicity:** Ưu tiên giải pháp đơn giản nhất (Rule of 500).
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
- **`/spec`:** Xác định và chốt Requirement (Source of truth).
- **`/plan`:** Cắt nhỏ dự án thành các lát cắt dọc (Vertical Slices).
- **`/build`:** Code TDD mức tối thiểu theo đúng scope của lát cắt.
- **`/test`:** Kiểm chứng bằng Acceptance Criteria (Prove-It pattern).
- **`/review`:** Rà soát code theo 5 trục (Correctness, Readability, Architecture, Security, Performance).
- **`/code-simplify`:** Đơn giản hóa code (Chesterton's Fence).
- **`/ship`:** Tích hợp 3 Personas để đánh giá GO/NO-GO tổng thể.

---

# 6. Mục Tiêu Demo TaskFlow
- **Dự án:** TaskFlow (Sản phẩm quản lý dự án nội bộ).
- **Mục tiêu:** Áp dụng Agent Skills KIT để triển khai 12 Functional Requirements (FR) và 5 User Stories (US) theo đúng PRD.
- **Tập trung:**
  - Không triển khai dồn một cục.
  - Áp dụng Workflow liên tục: `/build -> /test -> /review`.
  - Có bằng chứng Gatekeeping rõ ràng ở từng chặng.

---

# 7. Khởi tạo: `/spec` và `/plan`
- **`/spec`:** AI đọc `note/PRD.md`. Xác định Ranh giới hệ thống (Boundaries).
  - *Ví dụ:* Không làm SSO, không làm Sub-task, không tích hợp Slack.
  - *Kết quả:* Xuất ra `SPEC.md` làm tiêu chuẩn chất lượng.
- **`/plan`:** Cắt dọc ứng dụng thành 8 **Vertical Slices** (A đến H).
  - Không chia ngang kiểu "Làm BE trước, FE sau". 
  - Mỗi Slice đều là 1 module hoạt động được từ DB lên tới UI.
  - *Kết quả:* Sinh ra `tasks/plan.md` & `tasks/todo.md`.

---

# 8. Lộ Trình Vertical Slices (A-H)
- **Slice A:** Auth, Workspace, Member Invite (Foundation).
- **Slice B:** Project/Task CRUD (Tạo task & validation).
- **Slice C:** Status & Audit (Chuyển trạng thái, Audit log).
- **Slice D:** Collaboration (Comment, notification).
- **Slice E:** Personal Dashboard (Trang My Tasks & sort).
- **Slice F:** Team Dashboard (Kanban board cho Manager).
- **Slice G:** Reports (Biểu đồ tiến độ, member stats).
- **Slice H:** Search & Polish (Tìm kiếm, debounce, UX/Security).

---

# 9. Vòng Lặp Chuẩn Cho Từng Slice (Micro-workflow)
**Quy tắc:** Lỗi chặng nào, dừng lại và sửa ngay tại chặng đó.
1. **`/build Slice X`** 
   - *Prompt yêu cầu:* "Chỉ làm Slice X. Không làm lan sang slice khác. Output evidence cần chạy."
2. **`/test Slice X`**
   - *Prompt yêu cầu:* "Kiểm chứng Acceptance Criteria. Trả PASS/FAIL. Không chuyển Slice nếu FAIL."
3. **`/review Slice X`**
   - *Prompt yêu cầu:* "Review Correctness, Security, Architecture. Trả PASS hoặc NO-GO."

---

# 10. Kịch Bản Fix Lỗi (Gatekeeping)
- Nếu `/test` trả về **FAIL**:
  - Dùng lệnh: `/build Slice X - fix test blockers`
- Nếu `/review` trả về **NO-GO** (Ví dụ phát hiện lộ Isolation data):
  - Dùng lệnh: `/build Slice X - fix review blockers`
- **Kết luận:** Slice sau (X+1) chỉ được bắt đầu khi Slice hiện tại (X) xanh (PASS) toàn bộ.

---

# 11. Giai Đoạn Về Đích: Regression Test
Được thực hiện sau khi Toàn bộ Slice A -> H đều PASS lẻ.
- **Mục tiêu:** Kiểm tra sự toàn vẹn của toàn bộ hệ thống MVP (FR-01 đến FR-12) khi đã ráp nối.
- **Lệnh thực thi:**
  ```text
  /test regression
  Tất cả Slice A-H đã pass. Chạy regression toàn bộ MVP.
  Output PASS/FAIL, danh sách blocker nếu có.
  ```

---

# 12. Quyết Định Triển Khai (`/ship`)
Kích hoạt **Parallel Fan-out** (Giao tiếp song song 3 sub-agents).
- **Thực thi:**
  - `code-reviewer`: Rà soát nợ kỹ thuật.
  - `security-auditor`: Quét Auth/Authz và OWASP.
  - `test-engineer`: Rà soát coverage gaps.
- **Output tổng hợp:**
  - Quyết định **GO** hoặc **NO-GO**.
  - **Rollback Plan:** Điều kiện trigger rollback (VD: Login lỗi, Notification sai người) và kịch bản phục hồi.

---

# 13. Ưu Điểm & Nhược Điểm của Agent Skills KIT
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

# 14. Tóm Lược Giá Trị Nhận Được
1. **Code chất lượng Senior:** Code được bảo hành qua các trục Test/Security liên tục thay vì Review dồn ở cuối.
2. **Không ảo giác & Kỷ luật Scope:** AI tuân thủ chặt 6 Core Behaviors, không tự phát sinh tính năng rác.
3. **Orchestration Patterns thông minh:** Kết hợp các mẫu Sequential (/spec->/plan->/build) và Parallel Fan-out (/ship).
4. **An toàn Production:** Rollback plan và Security Auditor đảm bảo hệ thống chặn đứng mọi "vết nứt" từ trước khi merge.
