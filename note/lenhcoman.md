Đây là toàn bộ 7 lệnh, dịch tiếng Việt:

/spec
Bắt đầu phát triển theo spec — viết spec có cấu trúc trước khi code

Hiểu user muốn build gì. Hỏi làm rõ: mục tiêu, user, feature, acceptance criteria, tech stack, boundaries
Sinh spec gồm 6 phần: objective, commands, project structure, code style, testing strategy, boundaries
Lưu thành SPEC.md → xác nhận với user trước khi tiếp
/plan
Chia nhỏ công việc thành task có acceptance criteria và thứ tự phụ thuộc

Đọc SPEC.md và code hiện có — chế độ chỉ đọc, không sửa code
Xác định dependency graph
Cắt dọc (vertical slicing), không cắt ngang
Viết task có acceptance criteria + verification
Thêm checkpoint giữa các phase
Lưu tasks/plan.md + tasks/todo.md → trình user duyệt
/build
Triển khai task kế tiếp — build, test, verify, commit

Chọn task pending tiếp theo từ plan
Với mỗi task: đọc acceptance criteria → viết test fail (RED) → code tối thiểu (GREEN) → chạy full test → chạy build → commit → chuyển sang task kế
Nếu bước nào fail → chuyển sang skill debugging-and-error-recovery
⚠ Điểm quan trọng: "For each task" + "move to the next one" = AI tự lặp qua tất cả task pending, không cần gọi /build nhiều lần.

/test
Chạy TDD workflow. Bug fix dùng Prove-It pattern.

Feature mới:

Viết test mô tả hành vi mong muốn (phải FAIL)
Code cho test pass
Refactor giữ test xanh
Bug fix (Prove-It):

Viết test reproduce bug (phải FAIL)
Xác nhận test fail
Fix bug
Xác nhận test pass
Chạy full test suite kiểm regression
/review
Review code theo 5 trục

Correctness — khớp spec? Edge case? Test đủ?
Readability — tên rõ? Logic thẳng? Tổ chức tốt?
Architecture — theo pattern hiện có? Boundary sạch?
Security — input validate? Secret an toàn? Auth đủ?
Performance — N+1? Unbounded ops?
Output: review có cấu trúc, ghi rõ file:line, phân loại Critical/Important/Suggestion.

/code-simplify
Đơn giản hóa code — giảm complexity, giữ nguyên behavior

Đọc convention dự án
Xác định target code
Hiểu mục đích, caller, edge case, test coverage TRƯỚC khi sửa
Scan: nesting sâu → guard clause, hàm dài → tách, ternary lồng → if/else, dead code → xóa
Mỗi thay đổi chạy test ngay
Nếu test fail → revert thay đổi đó
/ship
Fan-out song song 3 persona → merge → quyết định GO/NO-GO

Phase A — Fan-out song song:

code-reviewer: review 5 trục
security-auditor: OWASP, secrets, auth, CVE
test-engineer: phân tích coverage, gap
Phase B — Merge: Main agent tổng hợp 6 mảng: Code Quality, Security, Performance, Accessibility, Infrastructure, Documentation

Phase C — Quyết định:

Output: GO / NO-GO + Blockers + Recommended fixes + Rollback plan bắt buộc
Critical finding → mặc định NO-GO
Bỏ qua fan-out chỉ khi đồng thời: ≤2 file, <50 dòng, không chạm auth/payments/data access/config



---
Không có lịch sử chạy. Repo này hoạt động như sau:

Cách nó chạy
Khi mở session Claude Code → hook session-start.sh tự inject meta-skill using-agent-skills vào context
Khi gõ /build, /spec, v.v. → Claude đọc file .claude/commands/xxx.md → đọc skills/xxx/SKILL.md → thực thi theo hướng dẫn trong đó
Mọi thứ chạy trong context window của AI — không có database, không có log file, không có dashboard
Cái gì ĐƯỢC lưu lại
Artifact	Nơi lưu	Ai tạo
SPEC.md	Project root	/spec
tasks/plan.md + tasks/todo.md	Project root	/plan
Git commits	.git/	/build (commit sau mỗi task)
Code + test files	Source code	/build
Review output	Trong chat session	/review, /ship
GO/NO-GO report	Trong chat session	/ship
Cái gì KHÔNG được lưu
❌ Không có log file ghi lại "đã chạy /build lúc 10:00"
❌ Không có history database
❌ Không có dashboard theo dõi
❌ Không có file ghi lại output của /review hay /ship (chỉ hiện trong chat)
Tóm lại: "Lịch sử" duy nhất là git log (commits từ /build) và artifacts trên disk (SPEC.md, tasks/). Ngoài ra mọi thứ chỉ tồn tại trong phiên chat AI — đóng session là mất.