# 🤖 Giải đáp từ Senior AI Agent & Developer

Chào bạn! Với tư cách là một AI Agent chuyên trách về phát triển phần mềm, tôi xin trả lời các thắc mắc của bạn về cơ chế vận hành và tư duy của hệ thống AI hiện đại.

---

### 🧠 Cơ chế ghi nhớ và Trạng thái (State Management)

#### Câu 1: Làm thế nào để AI không bị "quên" hoặc "ngáo" khi cuộc hội thoại kéo dài?
AI sử dụng chiến lược **Ngữ cảnh phân tầng (Layered Context)**:
- **Tóm tắt động (Dynamic Summarization):** Khi hội thoại quá dài, AI sẽ tóm tắt các phần đã qua thành các ý chính để giải phóng bộ nhớ (Token window).
- **Knowledge Retrieval (RAG):** AI không cố nhớ mọi thứ trong RAM. Thay vào đó, nó lưu các thông tin quan trọng vào các file `Knowledge Items` (KIs) và chỉ truy xuất lại khi cần thiết.
- **Pinning:** Những yêu cầu cốt lõi của người dùng luôn được giữ lại trong "System Prompt" để AI không bao giờ quên mục tiêu ban đầu.

#### Câu 2: Trạng thái của dự án được lưu ở đâu? Tắt ứng dụng đi bật lại có bị mất tiến trình không?
Trạng thái dự án được lưu trữ ở hai nơi:
1.  **Mã nguồn thực tế:** Mọi thay đổi code đều được ghi trực tiếp xuống ổ đĩa của bạn.
2.  **Thư mục Brain:** Nằm trong `.gemini/antigravity/brain/<session_id>`. Tại đây lưu trữ:
    -   `task.md`: Danh sách việc cần làm (TODO list).
    -   `implementation_plan.md`: Kế hoạch đã được phê duyệt.
    -   `logs`: Lịch sử các bước đã thực hiện.
> [!IMPORTANT]
> **Không bị mất tiến trình.** Khi khởi động lại, AI sẽ đọc lại các file này để "nhớ" ra mình đang làm đến bước nào.

#### Câu 3: Nếu con người tự sửa code trực tiếp bằng tay, AI có nhận biết được để cập nhật lại không?
**Có.** AI không làm việc dựa trên "ký ức tĩnh". Trước khi thực hiện bất kỳ thay đổi nào, AI thường gọi công cụ `view_file` hoặc `grep` để đọc nội dung mới nhất từ ổ đĩa. Nếu phát hiện code đã thay đổi so với lần cuối nó đọc, nó sẽ tự động cập nhật lại hiểu biết của mình về codebase.

---

### 🛠 Cấu trúc hệ thống và Ra quyết định

#### Câu 4: Hệ thống gồm bao nhiêu Agent và chúng phân chia công việc thế nào?
Thông thường, hệ thống vận hành theo mô hình **Multi-Agent Collaboration**:
-   **Researcher:** Chuyên tìm kiếm tài liệu, đọc code hiện có để hiểu luồng.
-   **Architect/Planner:** Thiết kế giải pháp, đảm bảo tính hệ thống và không phá vỡ kiến trúc cũ.
-   **Coder (Executor):** Viết code chi tiết và thực thi các lệnh terminal.
-   **Verifier/QA:** Chạy test, kiểm tra lỗi và đối chiếu kết quả với yêu cầu ban đầu.

#### Câu 5: Làm thế nào hệ thống chọn đúng Agent và đúng công cụ (tool) cho từng nhiệm vụ?
Hệ thống sử dụng một lớp **Router (Bộ định tuyến)** dựa trên mô hình ngôn ngữ lớn (LLM):
-   Nó phân tích "Intent" (Ý định) từ câu lệnh của bạn.
-   Ví dụ: Nếu lệnh chứa "Fix UI", Router sẽ kích hoạt Skill Frontend. Nếu lệnh là "Install package", nó sẽ gọi Tool Terminal.
-   Mỗi công cụ đều có một bản mô tả (Description) cực kỳ chi tiết để AI biết chính xác khi nào nên dùng cái gì.

---

### 💰 Chi phí và Hiệu suất

#### Câu 6: Chi phí tiền API sẽ tăng lên như thế nào khi dự án phình to? Có cách nào để tiết kiệm không?
Chi phí tăng tỷ lệ thuận với số lượng Token gửi đi. Dự án càng to, "Context" càng nặng.
**Cách tiết kiệm:**
-   **Surgical Reading:** Chỉ đọc những file liên quan trực tiếp đến task thay vì đọc cả dự án.
-   **Knowledge Base:** Thay vì gửi 100 file code, AI chỉ trích xuất các "Interface" hoặc "Documentation" quan trọng vào KIs để tham chiếu.
-   **Caching:** Các mô hình hiện đại (như Gemini) hỗ trợ cache prompt hệ thống để giảm phí cho các phần text lặp lại.

---

### 🛡 An toàn và Bảo mật

#### Câu 7: AI tự kiểm tra chất lượng code của chính nó viết ra bằng cách nào?
AI thực hiện quy trình **Self-Reflect & Verify**:
1.  **Linter check:** Chạy các lệnh kiểm tra cú pháp (ESLint, Prettier).
2.  **Unit Test:** Tự viết và chạy các bộ test để đảm bảo logic đúng.
3.  **Review Pass:** Sau khi viết code, một "Agent Reviewer" (hoặc chính nó ở một trạng thái suy nghĩ khác) sẽ đọc lại diff để tìm sơ hở logic.

#### Câu 8: Làm thế nào để ngăn AI cài đặt thư viện mã độc hoặc thư viện ảo (hallucination)?
AI có danh sách **Trusted Sources** và cơ chế xác thực:
-   Nó ưu tiên các thư viện phổ biến và có documentation.
-   Trước khi cài đặt, AI có thể dùng công cụ `search_web` để verify xem thư viện đó có tồn tại thật không và có cảnh báo bảo mật nào không.

#### Câu 9: AI chạy các lệnh terminal trực tiếp trên máy có an toàn không?
> [!CAUTION]
> **Quyền quyết định cuối cùng là ở bạn.**
> Mọi lệnh terminal được đánh dấu là "Unsafe" (như `rm -rf`, `npm install`) đều sẽ hiện thông báo chờ bạn phê duyệt. AI không bao giờ được phép thực hiện các hành động có tính phá hủy mà không có sự đồng ý của con người.

---

### 🔄 Khả năng thích nghi và Học tập

#### Câu 10: Khi nào AI được tự quyết định, và khi nào bắt buộc phải dừng lại xin ý kiến?
-   **Tự quyết:** Các thay đổi nhỏ (fix typo), nghiên cứu (read file), hoặc các bước đã được bạn đồng ý trong `implementation_plan.md`.
-   **Dừng lại xin ý kiến:** Khi gặp lỗi không thể tự giải quyết, khi cần thay đổi lớn về kiến trúc, hoặc khi phát hiện ra yêu cầu của bạn có điểm mâu thuẫn.

#### Câu 11: Làm thế nào để AI không bị kẹt trong vòng lặp sửa lỗi vô tận?
AI có cơ chế **Loop Detection**:
- Nếu sau một số lần thử (thường là 3-5 lần) mà lỗi vẫn không đổi, AI sẽ tự động kích hoạt chế độ "Deep Research" để tìm nguyên nhân gốc rễ hoặc dừng lại báo cáo để xin sự hỗ trợ từ con người thay vì cứ "đâm đầu vào tường".

#### Câu 12: Sau khi làm xong một task khó, AI có tự rút kinh nghiệm không?
**Có, thông qua Knowledge Base.**
AI sẽ ghi lại các "Lesson Learned" vào thư mục `knowledge`. Ví dụ: "Dự án này sử dụng bản Next.js cũ nên không dùng được App Router". Lần sau khi làm task mới, AI sẽ đọc lại file này đầu tiên để tránh lặp lại sai lầm.

#### Câu 13: Làm thế nào hệ thống thích nghi với phong cách lập trình riêng của từng người?
AI thực hiện **Style Matching**:
- Nó phân tích code hiện có trong dự án (cách đặt tên, cấu trúc folder, tab/space) và cố gắng bắt chước chính xác phong cách đó để code mới viết ra trông như thể do chính bạn viết.

#### Câu 14: Hệ thống prompt khổng lồ có thể tự tối ưu hóa theo thời gian không?
**Đang trong quá trình phát triển.**
Hiện tại, việc tối ưu prompt hệ thống (System Prompt) vẫn do con người đảm nhận. Tuy nhiên, AI có khả năng tự cải thiện "User-specific instructions" thông qua việc thu thập các quy tắc mà bạn đặt ra trong quá trình làm việc (như các file `.rules` của bạn).

---

> [!TIP]
> Bạn có thể tận dụng các file `.md` trong thư mục `note` để "dạy" tôi những quy trình riêng của bạn. Tôi sẽ luôn đọc chúng trước khi bắt đầu!
