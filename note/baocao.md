# Báo cáo Nghiên cứu Chuyên sâu: Agent Skills

## Mục lục nhanh
- [1. Tổng quan dự án](#sec-1-overview)
- [2. Kiến trúc hệ thống](#sec-2-architecture)
- [3. Meta-skill `using-agent-skills`](#sec-3-meta-skill)
- [4. Hệ thống kỹ năng](#sec-4-skills)
- [5. Cấu trúc chuẩn của một skill](#sec-5-skill-anatomy)
- [6. Hệ thống commands](#sec-6-commands)
- [7. Hệ thống personas](#sec-7-personas)
- [8. Orchestration patterns](#sec-8-orchestration)
- [9. Hooks system](#sec-9-hooks)
- [10. Tương thích đa nền tảng](#sec-10-platforms)
- [11. Tổng kết theo repo](#sec-11-summary)

---

<a id="sec-1-overview"></a>
## 1. Tổng quan dự án

### 1.1. Repo này là gì
`Agent Skills` tự mô tả là bộ **production-grade engineering skills for AI coding agents**. Repo đóng gói các workflow, quality gates và best practices để AI agent làm việc theo quy trình nhất quán trong toàn bộ vòng đời phát triển phần mềm.

Repo tổ chức trải nghiệm quanh:
- **7 slash commands**: `/spec`, `/plan`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`
- **Hệ thống 20 core skills + 1 meta-skill (`using-agent-skills`)**
- **3 specialist personas**

Nguồn: `agent-skills/README.md:1`, `agent-skills/README.md:18`, `agent-skills/README.md:128`, `agent-skills/README.md:184`

### 1.2. Triết lý thiết kế mà repo nhấn mạnh
Repo lặp lại 4 ý chính:
- **Process, not prose**: skill là workflow phải làm theo, không phải tài liệu tham khảo thuần đọc
- **Anti-rationalization**: mỗi skill có phần phản biện các lý do AI hay dùng để bỏ bước
- **Verification is non-negotiable**: mọi skill đều cần bằng chứng xác minh
- **Progressive disclosure**: chỉ load thêm tài liệu hỗ trợ khi thực sự cần

Nguồn: `agent-skills/README.md:231`, `agent-skills/README.md:233`, `agent-skills/README.md:235`, `agent-skills/README.md:236`

### 1.3. Vấn đề repo muốn giải quyết
Repo nêu thẳng rằng AI coding agents thường đi theo “shortest path”, tức là bỏ qua spec, tests, security review và các bước kỷ luật kỹ thuật. Agent Skills được tạo để ép agent đi theo quy trình gần với cách senior engineers làm việc.

Nguồn: `agent-skills/README.md:276`, `agent-skills/README.md:278`, `agent-skills/README.md:280`

---

<a id="sec-2-architecture"></a>
## 2. Kiến trúc hệ thống

### 2.1. Ba lớp điều phối
Repo tách rõ 3 lớp:

| Lớp | Đường dẫn | Vai trò |
|---|---|---|
| **Skills** | `skills/<name>/SKILL.md` | Workflow, steps, exit criteria — “the how” |
| **Personas** | `agents/<role>.md` | Vai trò, góc nhìn, output format — “the who” |
| **Commands** | `.claude/commands/*.md` | Điểm vào cho người dùng — “the when” |

Quy tắc composition quan trọng:
- User hoặc slash command là orchestrator
- Persona **không** gọi persona khác
- Persona có thể gọi skill

Nguồn: `agent-skills/AGENTS.md:68`, `agent-skills/AGENTS.md:76`, `agent-skills/agents/README.md:13`, `agent-skills/agents/README.md:21`

### 2.2. Cấu trúc thư mục chính
- `skills/`: hệ thống 20 core skills + 1 meta-skill (`using-agent-skills`)
- `agents/`: 3 persona chuyên trách và `README.md`
- `references/`: hiện có **5 file**; trong đó gồm 4 file checklist/pattern bổ trợ (`accessibility-checklist.md`, `performance-checklist.md`, `security-checklist.md`, `testing-patterns.md`), còn `orchestration-patterns.md` là tài liệu pattern riêng
- `hooks/`: chứa script và tài liệu hook
- `.claude/commands/`: 7 command cho Claude Code
- `.gemini/commands/`: 7 command cho Gemini CLI
- `docs/`: tài liệu setup theo từng nền tảng

Nguồn: `agent-skills/README.md:240`, `agent-skills/README.md:266`, `agent-skills/README.md:268`, `agent-skills/README.md:269`, `agent-skills/README.md:270`, thư mục `agent-skills/references`

### 2.3. Một số chi tiết cần ghi đúng theo repo
- `.opencode/skills` trong repo hiện là **file trỏ tương đối** sang `../skills/`, không phải thư mục chứa bản sao skills
- `hooks/hooks.json` chỉ đăng ký sẵn `SessionStart`
- `SDD-Cache` và `Simplify-Ignore` có trong repo nhưng là hook **cần cấu hình thêm**, không phải đã tự bật mặc định

Nguồn: `agent-skills/.opencode/skills:1`, `agent-skills/hooks/hooks.json:1`, `agent-skills/hooks/SDD-CACHE.md:13`, `agent-skills/hooks/SIMPLIFY-IGNORE.md:19`

---

<a id="sec-3-meta-skill"></a>
## 3. Meta-skill `using-agent-skills`

### 3.1. Vai trò
`using-agent-skills` là meta-skill dùng để:
- phát hiện task hiện tại thuộc loại nào
- chọn skill phù hợp
- áp các quy tắc chung xuyên suốt mọi workflow

Nguồn: `agent-skills/skills/using-agent-skills/SKILL.md:1`, `agent-skills/skills/using-agent-skills/SKILL.md:10`

### 3.2. Cây quyết định chọn skill
Meta-skill định nghĩa flow chọn skill theo loại việc:
- ý tưởng mơ hồ → `idea-refine`
- feature/change mới → `spec-driven-development`
- có spec, cần chia việc → `planning-and-task-breakdown`
- đang code → `incremental-implementation`
- viết/chạy test → `test-driven-development`
- lỗi/breakage → `debugging-and-error-recovery`
- review → `code-review-and-quality`
- commit/branch → `git-workflow-and-versioning`
- CI/CD → `ci-cd-and-automation`
- docs/ADR → `documentation-and-adrs`
- deploy → `shipping-and-launch`

Ý nghĩa của flow này là agent không nên dùng một prompt chung cho mọi loại việc. Repo muốn agent xác định đúng ngữ cảnh hiện tại trước, rồi mới kích hoạt workflow phù hợp để tránh bỏ bước hoặc chọn sai cách làm.

Nguồn: `agent-skills/skills/using-agent-skills/SKILL.md:12`

### 3.3. Sáu hành vi vận hành bắt buộc
Meta-skill nêu 6 hành vi áp dụng cho mọi task:
1. Surface Assumptions
2. Manage Confusion Actively
3. Push Back When Warranted
4. Enforce Simplicity
5. Maintain Scope Discipline
6. Verify, Don’t Assume

Giải thích ngắn theo nội dung repo:
- **Surface Assumptions**: trước khi làm task không tầm thường, agent phải nói rõ các giả định đang dùng thay vì tự lấp chỗ mơ hồ.
- **Manage Confusion Actively**: nếu gặp mâu thuẫn hoặc spec không rõ, agent phải dừng lại, nêu đúng điểm đang rối, rồi xin làm rõ thay vì đoán.
- **Push Back When Warranted**: agent không được “yes-machine”; nếu cách làm có vấn đề rõ ràng thì phải chỉ ra downside và đề xuất hướng khác.
- **Enforce Simplicity**: repo yêu cầu agent chủ động chống over-engineering, ưu tiên cách làm đơn giản, trực tiếp và đủ dùng.
- **Maintain Scope Discipline**: chỉ chạm vào phần được yêu cầu; không tự dọn code ngoài phạm vi, không xóa thứ chưa hiểu rõ.
- **Verify, Don’t Assume**: task chưa được xem là xong nếu chưa có bằng chứng xác minh như test, build output hoặc runtime data.

Nguồn: `agent-skills/skills/using-agent-skills/SKILL.md:39`, `agent-skills/skills/using-agent-skills/SKILL.md:43`, `agent-skills/skills/using-agent-skills/SKILL.md:57`, `agent-skills/skills/using-agent-skills/SKILL.md:69`, `agent-skills/skills/using-agent-skills/SKILL.md:80`, `agent-skills/skills/using-agent-skills/SKILL.md:91`, `agent-skills/skills/using-agent-skills/SKILL.md:104`

### 3.4. Lifecycle sequence
Repo mô tả chuỗi lifecycle điển hình:
1. `idea-refine`
2. `spec-driven-development`
3. `planning-and-task-breakdown`
4. `context-engineering`
5. `source-driven-development`
6. `incremental-implementation`
7. `test-driven-development`
8. `code-review-and-quality`
9. `git-workflow-and-versioning`
10. `documentation-and-adrs`
11. `shipping-and-launch`

Chuỗi này cho thấy repo ưu tiên cách làm tuần tự theo vòng đời kỹ thuật: xác định vấn đề trước, chia nhỏ việc, triển khai từng lát, kiểm chứng, rồi mới review và ship.

Nguồn: `agent-skills/skills/using-agent-skills/SKILL.md:133`

---

<a id="sec-4-skills"></a>
## 4. Hệ thống kỹ năng

### 4.1. Define
- `idea-refine`
- `spec-driven-development`

Nhóm này dùng để làm rõ mình đang xây cái gì trước khi bắt đầu code. `idea-refine` xử lý ý tưởng còn mơ hồ, còn `spec-driven-development` biến yêu cầu thành spec có cấu trúc.

Nguồn: `agent-skills/README.md:132`

### 4.2. Plan
- `planning-and-task-breakdown`

Nhóm này chuyển spec thành các task nhỏ, có acceptance criteria và thứ tự phụ thuộc rõ ràng để triển khai được.

Nguồn: `agent-skills/README.md:139`

### 4.3. Build
- `incremental-implementation`
- `test-driven-development`
- `context-engineering`
- `source-driven-development`
- `frontend-ui-engineering`
- `api-and-interface-design`

Đây là nhóm skill lớn nhất vì nó bao phủ phần triển khai:
- `incremental-implementation`: xây từng lát nhỏ, dễ verify
- `test-driven-development`: viết test để chứng minh hành vi mong muốn
- `context-engineering`: nạp đúng context đúng lúc cho agent
- `source-driven-development`: bám docs chính thức khi đụng framework/library
- `frontend-ui-engineering`: dành cho UI, accessibility, component architecture
- `api-and-interface-design`: dành cho contract, boundary và public interface

Nguồn: `agent-skills/README.md:145`

### 4.4. Verify
- `browser-testing-with-devtools`
- `debugging-and-error-recovery`

Nhóm này tập trung vào kiểm chứng và xử lý sai lệch:
- `browser-testing-with-devtools`: kiểm tra runtime trong môi trường trình duyệt
- `debugging-and-error-recovery`: đi theo quy trình reproduce → localize → fix → guard

Nguồn: `agent-skills/README.md:156`

### 4.5. Review
- `code-review-and-quality`
- `code-simplification`
- `security-and-hardening`
- `performance-optimization`

Nhóm này là quality gate trước khi merge hoặc trước khi coi thay đổi là đủ tốt:
- `code-review-and-quality`: review theo 5 trục
- `code-simplification`: giảm độ phức tạp nhưng giữ nguyên hành vi
- `security-and-hardening`: rà soát rủi ro bảo mật
- `performance-optimization`: đo và tối ưu hiệu năng khi có nhu cầu rõ ràng

Nguồn: `agent-skills/README.md:163`

### 4.6. Ship
- `git-workflow-and-versioning`
- `ci-cd-and-automation`
- `deprecation-and-migration`
- `documentation-and-adrs`
- `shipping-and-launch`

Nhóm này bao phủ phần hoàn tất và đưa thay đổi ra môi trường thật:
- quản lý commit/lịch sử thay đổi
- tự động hóa kiểm tra qua CI/CD
- xử lý migration hoặc deprecation
- ghi lại quyết định kỹ thuật
- chuẩn bị launch và rollback

Nguồn: `agent-skills/README.md:172`

### 4.7. Meta-skill
- `using-agent-skills`

Đây không phải skill để build feature trực tiếp, mà là skill điều phối giúp agent biết khi nào phải dùng skill nào.

Nguồn: `agent-skills/README.md:264`, `agent-skills/skills/using-agent-skills/SKILL.md:1`

### 4.8. Điểm không nhất quán hiện có trong repo
Repo hiện chưa hoàn toàn nhất quán ở vị trí của `test-driven-development`:
- `README.md` và `CLAUDE.md` xếp skill này ở **Build**
- `using-agent-skills` quick reference lại xếp skill này ở **Verify**

Vì vậy khi mô tả repo cần ghi đúng là repo có điểm chưa thống nhất này, thay vì tự chuẩn hóa một phía.

Nguồn: `agent-skills/README.md:149`, `agent-skills/CLAUDE.md:20`, `agent-skills/skills/using-agent-skills/SKILL.md:165`

---

<a id="sec-5-skill-anatomy"></a>
## 5. Cấu trúc chuẩn của một skill

### 5.1. Frontmatter bắt buộc
Mỗi `SKILL.md` có YAML frontmatter:
- `name`: lowercase, hyphen-separated, phải khớp tên thư mục
- `description`: mô tả skill làm gì và “Use when” trong trường hợp nào

Frontmatter quan trọng vì agent discovery dựa vào chính phần mô tả ngắn này để quyết định có nên kích hoạt skill hay không.

Nguồn: `agent-skills/docs/skill-anatomy.md:18`, `agent-skills/docs/skill-anatomy.md:27`

### 5.2. Các phần tiêu chuẩn
Repo khuyến nghị một skill nên có:
- `Overview`
- `When to Use`
- `Core Process` / `Workflow`
- `Common Rationalizations`
- `Red Flags`
- `Verification`

Mỗi phần phục vụ một vai trò khác nhau: `Overview` để hiểu mục đích, `When to Use` để chọn đúng lúc, `Workflow` để biết phải làm gì, còn `Verification` để biết khi nào mới được xem là hoàn tất.

Nguồn: `agent-skills/docs/skill-anatomy.md:33`, `agent-skills/docs/skill-anatomy.md:54`, `agent-skills/docs/skill-anatomy.md:59`, `agent-skills/docs/skill-anatomy.md:63`

### 5.3. Sáu nguyên tắc viết skill
1. Process over knowledge
2. Specific over general
3. Evidence over assumption
4. Anti-rationalization
5. Progressive disclosure
6. Token-conscious

Các nguyên tắc này cho thấy repo không muốn skill biến thành bài viết dài để đọc, mà phải là hướng dẫn đủ cụ thể để agent làm theo được và đủ gọn để không lãng phí context.

Nguồn: `agent-skills/docs/skill-anatomy.md:103`

### 5.4. Quy tắc supporting files
Repo chỉ khuyến nghị tách supporting files khi:
- phần reference vượt khoảng 100 dòng
- cần script/tool
- checklist đủ dài để tách riêng

Mục tiêu ở đây là giữ `SKILL.md` gọn, còn nội dung tham khảo dài thì chỉ mở thêm khi thật sự cần.

Nguồn: `agent-skills/docs/skill-anatomy.md:94`, `agent-skills/CONTRIBUTING.md:39`

---

<a id="sec-6-commands"></a>
## 6. Hệ thống commands

### 6.1. Claude Code commands
Repo có 7 command trong `.claude/commands/`:
- `/spec`
- `/plan`
- `/build`
- `/test`
- `/review`
- `/code-simplify`
- `/ship`

Đây là các điểm vào trực tiếp cho người dùng Claude Code. Thay vì yêu cầu người dùng nhớ từng skill, command đóng vai trò kích hoạt đúng workflow theo pha công việc.

Nguồn: `agent-skills/README.md:18`, thư mục `agent-skills/.claude/commands`

### 6.2. Mục đích từng command
- `/spec`: viết structured spec trước khi code
- `/plan`: chia việc thành task nhỏ, verifiable
- `/build`: implement incrementally, kết hợp TDD
- `/test`: chạy TDD workflow; bug fix dùng Prove-It pattern
- `/review`: five-axis code review
- `/code-simplify`: giảm độ phức tạp mà không đổi hành vi
- `/ship`: parallel fan-out tới 3 persona rồi hợp nhất thành quyết định GO/NO-GO

Có thể xem 7 command này như giao diện thao tác ở mức cao, còn skills là lớp workflow nằm phía dưới.

Nguồn: `agent-skills/.claude/commands/spec.md:5`, `agent-skills/.claude/commands/plan.md:5`, `agent-skills/.claude/commands/build.md:5`, `agent-skills/.claude/commands/test.md:5`, `agent-skills/.claude/commands/review.md:5`, `agent-skills/.claude/commands/code-simplify.md:5`, `agent-skills/.claude/commands/ship.md:5`

### 6.3. Điểm đặc biệt của `/ship`
`/ship` là orchestrator theo pattern:
- Phase A: chạy song song `code-reviewer`, `security-auditor`, `test-engineer`
- Phase B: merge trong main context
- Phase C: đưa ra quyết định GO/NO-GO và rollback plan

Repo cũng ghi rõ chỉ bỏ qua fan-out khi đồng thời thỏa cả 3 điều kiện:
- diff chạm **2 file trở xuống**
- diff **dưới 50 dòng**
- không chạm **auth, payments, data access, config/env**

Nguồn: `agent-skills/.claude/commands/ship.md:9`, `agent-skills/.claude/commands/ship.md:28`, `agent-skills/.claude/commands/ship.md:39`, `agent-skills/.claude/commands/ship.md:66`

### 6.4. Gemini CLI commands
Repo cũng có 7 command trong `.gemini/commands/`, nhưng có một khác biệt cần ghi đúng:
- Gemini dùng `/planning`
- Claude dùng `/plan`

Điểm này cho thấy repo cố giữ trải nghiệm tương đương giữa các nền tảng, nhưng vẫn chấp nhận khác biệt nhỏ theo ràng buộc của từng tool.

Nguồn: thư mục `agent-skills/.gemini/commands`, `agent-skills/docs/gemini-cli-setup.md:108`, `agent-skills/docs/gemini-cli-setup.md:124`

---

<a id="sec-7-personas"></a>
## 7. Hệ thống personas

### 7.1. Ba persona hiện có
| Persona | Vai trò | Trọng tâm |
|---|---|---|
| `code-reviewer` | Senior Staff Engineer | Five-axis review |
| `security-auditor` | Security Engineer | Vulnerability detection, threat modeling |
| `test-engineer` | QA Specialist / QA Engineer | Test strategy, coverage, Prove-It pattern |

Ba persona này không thay thế skills. Chúng bổ sung góc nhìn chuyên sâu cho các tình huống cần review, audit hoặc đánh giá chất lượng test.

Nguồn: `agent-skills/README.md:188`, `agent-skills/agents/README.md:5`

### 7.2. Quy tắc composition
- Persona là single role, single output format
- Persona không gọi persona khác
- Persona có thể invoke skills
- Mỗi persona kết thúc bằng block `Composition`

Thiết kế này giúp tránh việc một persona tự ý biến thành “router” và gọi lung tung sang persona khác, vốn là anti-pattern mà repo cấm.

Nguồn: `agent-skills/agents/README.md:96`

### 7.3. Claude Code interop
Repo mô tả personas dùng được theo 2 cách:
- làm Claude Code subagents
- làm Agent Teams teammates

Repo cũng ghi rõ:
- subagents không spawn subagents
- Agent Teams là experimental
- plugin agents bỏ qua `hooks`, `mcpServers`, `permissionMode`

Nói ngắn gọn, repo viết personas theo cách có thể tái dùng ở nhiều chế độ cộng tác, nhưng vẫn tôn trọng các giới hạn kỹ thuật của Claude Code.

Nguồn: `agent-skills/agents/README.md:103`, `agent-skills/agents/README.md:107`, `agent-skills/agents/README.md:108`, `agent-skills/agents/README.md:112`

---

<a id="sec-8-orchestration"></a>
## 8. Orchestration patterns

### 8.1. Năm pattern được repo chấp nhận
1. Direct invocation
2. Single-persona command
3. Parallel fan-out + merge
4. Sequential pipeline
5. Research isolation

Giải thích ngắn:
- `Direct invocation`: gọi thẳng một persona cho một nhu cầu cụ thể
- `Single-persona command`: bọc persona vào command để dùng lặp lại
- `Parallel fan-out + merge`: cho nhiều persona độc lập chạy song song rồi hợp nhất kết quả
- `Sequential pipeline`: người dùng điều phối theo từng bước `/spec → /plan → /build...`
- `Research isolation`: tách tác vụ đọc nhiều/context lớn sang một nhánh riêng để main context không bị phình

Nguồn: `agent-skills/references/orchestration-patterns.md`

### 8.2. Bốn anti-pattern bị cấm
- Router persona
- Persona gọi persona
- Sequential orchestrator tự paraphrase
- Deep persona trees

Điểm chung của các anti-pattern này là làm tăng token, tăng paraphrase trung gian và làm mất rõ ràng trách nhiệm điều phối.

Nguồn: `agent-skills/references/orchestration-patterns.md`

### 8.3. Subagents và Agent Teams
Repo phân biệt:
- **Subagents**: báo cáo ngược về main agent
- **Agent Teams**: teammates có thể trao đổi trực tiếp với nhau

Repo khuyến nghị:
- dùng subagents cho review / pre-deploy
- dùng Agent Teams cho các bài toán tranh luận hoặc competing hypotheses phức tạp hơn

Khác biệt cốt lõi là subagents chủ yếu trả báo cáo về cho agent chính, còn Agent Teams phù hợp khi nhiều tác nhân cần trao đổi qua lại với nhau.

Nguồn: `agent-skills/agents/README.md:105`, `agent-skills/agents/README.md:110`, `agent-skills/references/orchestration-patterns.md`

---

<a id="sec-9-hooks"></a>
## 9. Hooks system

### 9.1. SessionStart
Trong repo, `hooks/hooks.json` đăng ký `SessionStart` để chạy `hooks/session-start.sh`. Script này:
- tìm meta-skill `using-agent-skills`
- yêu cầu `jq` phải có trên PATH
- trả về JSON message để nhắc agent dùng flow discovery

Điểm cần ghi đúng: đây là hook được repo đăng ký sẵn; phạm vi áp dụng phụ thuộc môi trường đang dùng plugin/hook đó.

Nguồn: `agent-skills/hooks/hooks.json:1`, `agent-skills/hooks/session-start.sh:1`, `agent-skills/hooks/session-start.sh:9`, `agent-skills/hooks/session-start.sh:14`

### 9.2. SDD-Cache
`SDD-Cache` là hook bổ sung cho `source-driven-development`:
- cache theo URL
- luôn revalidate với `ETag` hoặc `Last-Modified`
- chỉ trả cache khi origin xác nhận `304 Not Modified`
- không cache nếu server không có validator

Yêu cầu được repo ghi rõ:
- `jq`
- `curl`
- `shasum` hoặc `sha256sum`
- Bash 3.2+

Điểm cần ghi đúng: đây là hook **phải tự cấu hình thêm** qua `.claude/settings.json` hoặc `.claude/settings.local.json`.

Nguồn: `agent-skills/hooks/SDD-CACHE.md:13`, `agent-skills/hooks/SDD-CACHE.md:59`, `agent-skills/hooks/SDD-CACHE.md:68`, `agent-skills/hooks/SDD-CACHE.md:162`

### 9.3. Simplify-Ignore
`Simplify-Ignore` cho phép đánh dấu block code không muốn model nhìn thấy khi chạy `/code-simplify`:
- block được thay bằng placeholder
- model chỉnh phần xung quanh
- hook sẽ restore lại code thật sau đó

Điểm cần ghi đúng: hook này cũng **không auto bật**, mà phải tự khai báo trong hook config.

Nguồn: `agent-skills/hooks/SIMPLIFY-IGNORE.md:1`, `agent-skills/hooks/SIMPLIFY-IGNORE.md:19`, `agent-skills/hooks/SIMPLIFY-IGNORE.md:49`

---

<a id="sec-10-platforms"></a>
## 10. Tương thích đa nền tảng

### 10.1. Claude Code
Repo ưu tiên Claude Code:
- có plugin packaging
- có `.claude/commands/`
- có hooks
- có persona interop

Đây là môi trường mà repo hỗ trợ đầy đủ nhất vì có cả command, plugin metadata, hook và mô hình subagent.

Nguồn: `agent-skills/README.md:38`, `agent-skills/.claude-plugin/plugin.json`, `agent-skills/hooks/hooks.json`

### 10.2. Cursor
Repo hướng dẫn 3 cách dùng với Cursor:
1. `.cursor/rules/`
2. `.cursorrules`
3. Notepads

Repo cũng khuyên không nên load tất cả skills cùng lúc.

Nói cách khác, với Cursor repo ưu tiên cách dùng skill như rules hoặc context bổ sung theo tình huống, không phải bật toàn bộ một lần.

Nguồn: `agent-skills/docs/cursor-setup.md:5`, `agent-skills/docs/cursor-setup.md:21`, `agent-skills/docs/cursor-setup.md:32`, `agent-skills/docs/cursor-setup.md:64`

### 10.3. Gemini CLI
Repo hỗ trợ:
- cài skills native để auto-discovery
- đưa skill vào `GEMINI.md` nếu muốn persistent context
- có bộ `.gemini/commands/`

Gemini CLI được hỗ trợ khá sâu vì repo không chỉ có skills mà còn có command map riêng cho môi trường này.

Nguồn: `agent-skills/README.md:70`, `agent-skills/docs/gemini-cli-setup.md:5`, `agent-skills/docs/gemini-cli-setup.md:38`, `agent-skills/docs/gemini-cli-setup.md:108`

### 10.4. OpenCode
Repo mô tả OpenCode theo hướng:
- dùng `AGENTS.md`
- dùng `skill` tool
- không dựa vào native plugin system
- không có native slash commands như Claude Code

Với OpenCode, repo đi theo hướng “agent-driven workflow”, tức là để agent tự map intent sang skill thay vì trông chờ command/plugin native.

Nguồn: `agent-skills/README.md:96`, `agent-skills/docs/opencode-setup.md:7`, `agent-skills/docs/opencode-setup.md:11`, `agent-skills/docs/opencode-setup.md:148`

### 10.5. Các nền tảng khác
Repo còn có hướng dẫn hoặc nhắc đến:
- Windsurf
- GitHub Copilot
- Kiro IDE & CLI
- Codex / Other Agents

Mức hỗ trợ ở nhóm này chủ yếu là hướng dẫn tích hợp hoặc cách tái sử dụng nội dung Markdown của skills/personas trong môi trường tương ứng.

Nguồn: `agent-skills/README.md:89`, `agent-skills/README.md:105`, `agent-skills/README.md:112`, `agent-skills/README.md:117`

---

<a id="sec-11-summary"></a>
## 11. Tổng kết theo repo

### 11.1. Những gì repo nhấn mạnh rõ ràng
- Agent Skills là bộ workflow cho AI coding agents, không phải bộ prompt rời rạc
- Skill phải được chọn đúng theo intent và làm theo đầy đủ workflow
- Verification là phần bắt buộc
- Repo ưu tiên quy trình phát triển có spec, plan, build, test, review, ship
- Repo hỗ trợ nhiều môi trường, nhưng trọng tâm rõ nhất là Claude Code

Nguồn: `agent-skills/README.md:20`, `agent-skills/README.md:130`, `agent-skills/README.md:233`, `agent-skills/AGENTS.md:18`, `agent-skills/README.md:38`

### 11.2. Ưu điểm của bộ KIT này
- Có cấu trúc workflow rõ theo vòng đời phát triển: spec, plan, build, test, review, ship
- Tách lớp hợp lý giữa skills, personas và commands nên dễ hiểu vai trò từng phần
- Nhấn mạnh verification, anti-rationalization và process discipline thay vì chỉ prompt tự do
- Có meta-skill `using-agent-skills` để chọn skill theo intent
- Có persona chuyên trách cho review, security và test
- Có tài liệu setup cho nhiều môi trường: Claude Code, Cursor, Gemini CLI, OpenCode, Windsurf, Copilot, Kiro
- Thiết kế theo `progressive disclosure`, tức là chỉ nạp thêm skill hoặc tài liệu hỗ trợ khi cần, giúp tiết kiệm token theo từng ngữ cảnh làm việc

Nguồn: `agent-skills/README.md:18`, `agent-skills/README.md:128`, `agent-skills/README.md:184`, `agent-skills/README.md:231`, `agent-skills/skills/using-agent-skills/SKILL.md:12`

### 11.3. Nhược điểm và lưu ý của bộ KIT này
- OpenCode không có native slash commands và không có plugin system như Claude Code
- Agent Teams mới ở trạng thái experimental
- Plugin agents bỏ qua `hooks`, `mcpServers`, `permissionMode`
- Một số hook yêu cầu Bash và công cụ dòng lệnh phụ trợ như `jq`, `curl`, `shasum`
- `SDD-Cache` và `Simplify-Ignore` không tự bật sẵn, phải cấu hình thêm
- Repo hiện có điểm chưa nhất quán về vị trí lifecycle của `test-driven-development`
- Nếu áp dụng đầy đủ nhiều skill và nhiều pha orchestration, tổng lượng token sử dụng có thể tăng hơn so với cách prompt trực tiếp; đây là hệ quả của cấu trúc workflow nhiều bước trong repo

Nguồn: `agent-skills/docs/opencode-setup.md:148`, `agent-skills/agents/README.md:108`, `agent-skills/agents/README.md:112`, `agent-skills/hooks/SDD-CACHE.md:13`, `agent-skills/hooks/SDD-CACHE.md:162`, `agent-skills/hooks/SIMPLIFY-IGNORE.md:19`, `agent-skills/hooks/SIMPLIFY-IGNORE.md:88`, `agent-skills/README.md:149`, `agent-skills/skills/using-agent-skills/SKILL.md:165`

### 11.4. Khi nào nên sử dụng bộ KIT này
Theo các mô tả trong `README.md`, `AGENTS.md` và `using-agent-skills`, repo này phù hợp với các tình huống như:
- bắt đầu feature hoặc project mới cần spec trước khi code
- chia spec thành task nhỏ, có acceptance criteria
- implement theo incremental slices
- viết test hoặc prove bug fix
- review trước merge
- ship với pre-launch checklist và rollback plan

Nguồn: `agent-skills/README.md:24`, `agent-skills/README.md:25`, `agent-skills/README.md:26`, `agent-skills/README.md:27`, `agent-skills/README.md:28`, `agent-skills/README.md:30`, `agent-skills/skills/using-agent-skills/SKILL.md:125`

---

**Kết luận ngắn:** nếu chỉ bám theo repo, `agent-skills` là một bộ workflow engineering cho AI agents với trọng tâm là chọn đúng skill theo intent, bắt buộc verification, và điều phối bằng commands/personas/hooks theo từng môi trường hỗ trợ.
