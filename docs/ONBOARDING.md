# Cẩm Nang Bàn Giao Dự Án (Onboarding Guide) — Task Nomad

Chào mừng bạn gia nhập đội ngũ phát triển của **Task Nomad**! Tài liệu này sẽ giúp bạn nhanh chóng hiểu rõ cấu trúc kiến trúc dự án, các luồng đi cốt lõi và các điểm lưu ý kỹ thuật để có thể bắt đầu đóng góp code một cách tự tin nhất.

---

## 1. 🚀 Tổng Quan Dự Án (Project Overview)

- **Tên dự án**: `Task Nomad`
- **Mục tiêu**: Hệ thống quản lý công việc và dự án cộng tác đa thành viên.
- **Ngôn ngữ chủ đạo**: TypeScript, JavaScript
- **Khung công nghệ (Frameworks)**: Next.js, Express, Prisma
- **Thời gian phân tích**: 08:24:31 26/5/2026
- **Git Commit Hash**: `c5f7d6e4650744e29dae8244808ebfa944ee8106`

---

## 2. 🏛️ Kiến Trúc Hệ Thống (Architecture Layers)

Dự án được thiết kế theo kiến trúc phân lớp rõ ràng gồm **8 lớp** khác nhau. Dưới đây là mô tả chi tiết nhiệm vụ và các tệp tin quan trọng của từng lớp:

### 🔹 Lớp: Giao diện người dùng (Frontend UI) (`layer:ui`)
- **Nhiệm vụ**: Các thành phần React, trang hiển thị, custom hooks và styles xây dựng nên giao diện người dùng tương tác.
- **Tệp tin tiêu biểu**:
  - [`demo/frontend/eslint.config.mjs`](file:///d:/tenomad/task_04/demo/frontend/eslint.config.mjs) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho eslint.config.* (`simple`)
  - [`demo/frontend/postcss.config.mjs`](file:///d:/tenomad/task_04/demo/frontend/postcss.config.mjs) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho postcss.config.* (`simple`)
  - [`demo/frontend/src/app/(auth)/invite/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/invite/page.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page.* (`moderate`)
  - [`demo/frontend/src/app/(auth)/layout.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/layout.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho layout.* (`simple`)
  - [`demo/frontend/src/app/(auth)/login/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/login/page.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page.* (`moderate`)
  - [`demo/frontend/src/app/(auth)/register/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/register/page.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page.* (`moderate`)
  - [`demo/frontend/src/app/app/layout.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/layout.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho layout.* (`moderate`)
  - [`demo/frontend/src/app/app/my-tasks/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/my-tasks/page.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page.* (`moderate`)
  - *Và 18 tệp tin khác...*

### 🔹 Lớp: Quản lý trạng thái (State Management) (`layer:state`)
- **Nhiệm vụ**: Các kho lưu trữ Zustand quản lý trạng thái phản hồi phía client, phiên đăng nhập và đồng bộ hóa REST.
- **Tệp tin tiêu biểu**:
  - [`demo/frontend/src/stores/auth-store.ts`](file:///d:/tenomad/task_04/demo/frontend/src/stores/auth-store.ts) — *Kho lưu trữ quản lý trạng thái sử dụng Zustand để cập nhật phản hồi và duy trì trạng thái ứng dụng.* (`simple`)

### 🔹 Lớp: Lớp xử lý API (API Controllers) (`layer:api`)
- **Nhiệm vụ**: Các tuyến đường Express và trình xử lý điểm cuối tiếp nhận và điều phối các yêu cầu HTTP từ máy khách.
- **Tệp tin tiêu biểu**:
  - [`demo/backend/src/controllers/auth.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/auth.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho auth.controller.* (`moderate`)
  - [`demo/backend/src/controllers/comment.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/comment.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho comment.controller.* (`moderate`)
  - [`demo/backend/src/controllers/my-tasks.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/my-tasks.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho my-tasks.controller.* (`moderate`)
  - [`demo/backend/src/controllers/notification.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/notification.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho notification.controller.* (`simple`)
  - [`demo/backend/src/controllers/project.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/project.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho project.controller.* (`moderate`)
  - [`demo/backend/src/controllers/report.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/report.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho report.controller.* (`moderate`)
  - [`demo/backend/src/controllers/search.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/search.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho search.controller.* (`simple`)
  - [`demo/backend/src/controllers/task.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/task.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho task.controller.* (`complex`)
  - *Và 9 tệp tin khác...*

### 🔹 Lớp: Nghiệp vụ cốt lõi (Business Logic) (`layer:service`)
- **Nhiệm vụ**: Dịch vụ xử lý logic nghiệp vụ hệ thống, mã hóa thông tin bảo mật và điều phối luồng dữ liệu.
- **Tệp tin tiêu biểu**:
  - [`demo/backend/src/app.ts`](file:///d:/tenomad/task_04/demo/backend/src/app.ts) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho app.* (`simple`)
  - [`demo/backend/src/server.ts`](file:///d:/tenomad/task_04/demo/backend/src/server.ts) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho server.* (`simple`)
  - [`demo/backend/src/services/activity.service.ts`](file:///d:/tenomad/task_04/demo/backend/src/services/activity.service.ts) — *Lớp dịch vụ thực hiện các logic nghiệp vụ cốt lõi, thông báo hoặc giao dịch cơ sở dữ liệu cho activity.service.* (`simple`)
  - [`demo/backend/src/services/email.service.ts`](file:///d:/tenomad/task_04/demo/backend/src/services/email.service.ts) — *Lớp dịch vụ thực hiện các logic nghiệp vụ cốt lõi, thông báo hoặc giao dịch cơ sở dữ liệu cho email.service.* (`moderate`)
  - [`demo/backend/src/services/notification.service.ts`](file:///d:/tenomad/task_04/demo/backend/src/services/notification.service.ts) — *Lớp dịch vụ thực hiện các logic nghiệp vụ cốt lõi, thông báo hoặc giao dịch cơ sở dữ liệu cho thông báo.service.* (`moderate`)
  - [`demo/backend/src/types/auth.types.ts`](file:///d:/tenomad/task_04/demo/backend/src/types/auth.types.ts) — *Mô-đun xuất khẩu các giao diện, sơ đồ cấu trúc hoặc thành phần công khai để đơn giản hóa việc import.* (`simple`)
  - [`demo/backend/src/types/task.types.ts`](file:///d:/tenomad/task_04/demo/backend/src/types/task.types.ts) — *Mô-đun xuất khẩu các giao diện, sơ đồ cấu trúc hoặc thành phần công khai để đơn giản hóa việc import.* (`simple`)
  - [`demo/backend/src/utils/errors.ts`](file:///d:/tenomad/task_04/demo/backend/src/utils/errors.ts) — *Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho errors.* (`simple`)
  - *Và 14 tệp tin khác...*

### 🔹 Lớp: Kiểm soát trung gian (API Middleware) (`layer:middleware`)
- **Nhiệm vụ**: Các chuỗi middleware Express thực hiện kiểm tra quyền truy cập, xác thực phiên và bắt lỗi toàn cục.
- **Tệp tin tiêu biểu**:
  - [`demo/backend/src/middleware/auth.middleware.ts`](file:///d:/tenomad/task_04/demo/backend/src/middleware/auth.middleware.ts) — *Middleware Express thực hiện kiểm tra dữ liệu yêu cầu, xác thực và xử lý lỗi cho xác thực.middleware.* (`moderate`)
  - [`demo/backend/src/middleware/error.middleware.ts`](file:///d:/tenomad/task_04/demo/backend/src/middleware/error.middleware.ts) — *Middleware Express thực hiện kiểm tra dữ liệu yêu cầu, xác thực và xử lý lỗi cho error.middleware.* (`simple`)

### 🔹 Lớp: Cơ sở dữ liệu & ORM (Database ORM) (`layer:data`)
- **Nhiệm vụ**: Sơ đồ dữ liệu Prisma, các bộ kết nối cơ sở dữ liệu và các tệp di cư SQL quản lý hoạt động lưu trữ.
- **Tệp tin tiêu biểu**:
  - [`demo/backend/prisma/migrations/20260507152419_init_slice_a/migration.sql`](file:///d:/tenomad/task_04/demo/backend/prisma/migrations/20260507152419_init_slice_a/migration.sql) — *Tệp di cư cơ sở dữ liệu SQL để cập nhật sơ đồ trong migration.sql.* (`moderate`)
  - [`demo/backend/prisma/migrations/20260507155133_add_projects_tasks/migration.sql`](file:///d:/tenomad/task_04/demo/backend/prisma/migrations/20260507155133_add_projects_tasks/migration.sql) — *Tệp di cư cơ sở dữ liệu SQL để cập nhật sơ đồ trong migration.sql.* (`moderate`)
  - [`demo/backend/prisma/migrations/20260508023041_add_comments_notifications/migration.sql`](file:///d:/tenomad/task_04/demo/backend/prisma/migrations/20260508023041_add_comments_notifications/migration.sql) — *Tệp di cư cơ sở dữ liệu SQL để cập nhật sơ đồ trong migration.sql.* (`simple`)
  - [`demo/backend/prisma/schema.prisma`](file:///d:/tenomad/task_04/demo/backend/prisma/schema.prisma) — *Sơ đồ cơ sở dữ liệu Prisma ORM chỉ định các mô hình dữ liệu, mối quan hệ bảng và cấu hình trình tạo client cơ sở dữ liệu.* (`complex`)
  - [`demo/backend/src/lib/prisma.ts`](file:///d:/tenomad/task_04/demo/backend/src/lib/prisma.ts) — *Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho prisma.* (`simple`)

### 🔹 Lớp: Cấu hình hệ thống (System Config) (`layer:config`)
- **Nhiệm vụ**: Các tệp khai báo dự án, cấu hình TypeScript, môi trường phát triển và trình biên dịch hệ thống.
- **Tệp tin tiêu biểu**:
  - [`.agents/workflows/build.toml`](file:///d:/tenomad/task_04/.agents/workflows/build.toml) — *Tệp cấu hình thiết lập cho build.toml.* (`simple`)
  - [`.agents/workflows/code-simplify.toml`](file:///d:/tenomad/task_04/.agents/workflows/code-simplify.toml) — *Tệp cấu hình thiết lập cho code-simplify.toml.* (`simple`)
  - [`.agents/workflows/planning.toml`](file:///d:/tenomad/task_04/.agents/workflows/planning.toml) — *Tệp cấu hình thiết lập cho planning.toml.* (`simple`)
  - [`.agents/workflows/review.toml`](file:///d:/tenomad/task_04/.agents/workflows/review.toml) — *Tệp cấu hình thiết lập cho review.toml.* (`simple`)
  - [`.agents/workflows/ship.toml`](file:///d:/tenomad/task_04/.agents/workflows/ship.toml) — *Tệp cấu hình thiết lập cho ship.toml.* (`simple`)
  - [`.agents/workflows/spec.toml`](file:///d:/tenomad/task_04/.agents/workflows/spec.toml) — *Tệp cấu hình thiết lập cho spec.toml.* (`simple`)
  - [`.agents/workflows/test.toml`](file:///d:/tenomad/task_04/.agents/workflows/test.toml) — *Tệp cấu hình thiết lập cho test.toml.* (`simple`)
  - [`.agents/workflows/understand-chat.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-chat.toml) — *Tệp cấu hình thiết lập cho understand-chat.toml.* (`simple`)
  - *Và 22 tệp tin khác...*

### 🔹 Lớp: Tài liệu hướng dẫn (Documentation) (`layer:documentation`)
- **Nhiệm vụ**: Tài liệu mô tả yêu cầu sản phẩm (PRD), hướng dẫn thiết kế và cẩm nang lập trình dự án.
- **Tệp tin tiêu biểu**:
  - [`.agents/workflows/build.md`](file:///d:/tenomad/task_04/.agents/workflows/build.md) — *Tài liệu dự án bao gồm build.md.* (`simple`)
  - [`.agents/workflows/code-simplify.md`](file:///d:/tenomad/task_04/.agents/workflows/code-simplify.md) — *Tài liệu dự án bao gồm code-simplify.md.* (`simple`)
  - [`.agents/workflows/planning.md`](file:///d:/tenomad/task_04/.agents/workflows/planning.md) — *Tài liệu dự án bao gồm planning.md.* (`simple`)
  - [`.agents/workflows/review.md`](file:///d:/tenomad/task_04/.agents/workflows/review.md) — *Tài liệu dự án bao gồm review.md.* (`simple`)
  - [`.agents/workflows/ship.md`](file:///d:/tenomad/task_04/.agents/workflows/ship.md) — *Tài liệu dự án bao gồm ship.md.* (`simple`)
  - [`.agents/workflows/spec.md`](file:///d:/tenomad/task_04/.agents/workflows/spec.md) — *Tài liệu dự án bao gồm spec.md.* (`simple`)
  - [`.agents/workflows/test.md`](file:///d:/tenomad/task_04/.agents/workflows/test.md) — *Tài liệu dự án bao gồm test.md.* (`simple`)
  - [`.agents/workflows/understand-chat.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-chat.md) — *Tài liệu dự án bao gồm understand-chat.md.* (`simple`)
  - *Và 25 tệp tin khác...*

---

## 3. 🎯 Lộ Trình Tìm Hiểu Từng Bước (Guided Tour)

Dưới đây là lộ trình học tập gồm **7 bước** được đề xuất giúp lập trình viên mới nắm vững luồng hoạt động từ Frontend đến Database:

### 📍 Bước 1: 1. Tổng quan Kiến trúc & Yêu cầu
- **Mục tiêu**: Chào mừng bạn đến với Task Nomad! Bắt đầu từ đây để hiểu rõ sứ mệnh cốt lõi của dự án: quản lý công việc và dự án cộng tác. Tài liệu hướng dẫn này chi tiết cấu trúc thư mục và các chức năng chính của hệ thống.
- **Tệp tin cần đọc**:
  - [`demo/frontend/README.md`](file:///d:/tenomad/task_04/demo/frontend/README.md) — *Tài liệu hướng dẫn chính của dự án cung cấp tổng quan, hướng dẫn thiết lập và mô tả kiến trúc.*

### 📍 Bước 2: 2. Điểm khởi đầu & Xác thực Giao diện
- **Mục tiêu**: Các trang này đóng vai trò là điểm truy cập cho khách và thành viên, hiển thị giao diện trang chủ và các biểu mẫu nhập thông tin xác thực an toàn để đăng ký và đăng nhập.
- **Tệp tin cần đọc**:
  - [`demo/frontend/src/app/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/page.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page.*
  - [`demo/frontend/src/app/(auth)/login/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/login/page.tsx) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page.*

### 📍 Bước 3: 3. Bảng công việc cộng tác tương tác
- **Mục tiêu**: Các thành phần này hiển thị tab bình luận cộng tác và dòng hoạt động của công việc, hỗ trợ cập nhật không gian làm việc theo thời gian thực và lọc dữ liệu đầu vào chống tấn công XSS.
- **Tệp tin cần đọc**:
  - [`demo/frontend/src/components/task/comment-tab.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/task/comment-tab.tsx) — *Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho tab bình luận.*
  - [`demo/frontend/src/components/task/activity-tab.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/task/activity-tab.tsx) — *Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho tab hoạt động.*
- **💡 Bài học/Kỹ năng**: *Các thành phần React sử dụng các custom hooks liên kết trực tiếp với kho lưu trữ có thể cập nhật trạng thái phản hồi mà không gây ra hiện tượng render lại toàn bộ component cha.*

### 📍 Bước 4: 4. Quản lý phiên hoạt động với Zustand
- **Mục tiêu**: Kho lưu trữ React trung tâm này đồng bộ hóa phiên làm việc của người dùng hiện tại, trạng thái đăng nhập và không gian điều hướng, cung cấp các hành động cập nhật trạng thái tiện lợi.
- **Tệp tin cần đọc**:
  - [`demo/frontend/src/stores/auth-store.ts`](file:///d:/tenomad/task_04/demo/frontend/src/stores/auth-store.ts) — *Kho lưu trữ quản lý trạng thái sử dụng Zustand để cập nhật phản hồi và duy trì trạng thái ứng dụng.*
- **💡 Bài học/Kỹ năng**: *Zustand cung cấp một bộ chứa trạng thái pub-sub gọn nhẹ với lượng code boilerplate tối giản, cực kỳ thích hợp cho việc dựng các màn hình phức tạp.*

### 📍 Bước 5: 5. Khởi tạo Backend & Cổng API
- **Mục tiêu**: Tệp tin này khởi động máy chủ backend Express, cấu hình các middleware toàn cục (CORS, phân tích yêu cầu JSON) và đăng ký các router API để tiếp nhận các yêu cầu xác thực.
- **Tệp tin cần đọc**:
  - [`demo/backend/src/app.ts`](file:///d:/tenomad/task_04/demo/backend/src/app.ts) — *Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho app.*

### 📍 Bước 6: 6. Tuyến đường API & Trình điều khiển Task
- **Mục tiêu**: Các tệp định tuyến và bộ xử lý controller này đăng ký các điểm cuối HTTP phục vụ các thao tác quản lý công việc, kiểm tra phạm vi phiên làm việc và ủy thác truy vấn đến các lớp dịch vụ.
- **Tệp tin cần đọc**:
  - [`demo/backend/src/routes/task.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/task.ts) — *Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho công việc.*
  - [`demo/backend/src/controllers/task.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/task.controller.ts) — *Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho task.controller.*

### 📍 Bước 7: 7. Lưu trữ dữ liệu cốt lõi & Prisma Schema
- **Mục tiêu**: Tệp này mô tả chi tiết các thực thể cơ sở dữ liệu (User, Task, Project, Workspace, Comment) sử dụng sơ đồ Prisma ORM. Bộ công cụ khởi tạo kết nối PrismaClient duy nhất để truy vấn.
- **Tệp tin cần đọc**:
  - [`demo/backend/prisma/schema.prisma`](file:///d:/tenomad/task_04/demo/backend/prisma/schema.prisma) — *Sơ đồ cơ sở dữ liệu Prisma ORM chỉ định các mô hình dữ liệu, mối quan hệ bảng và cấu hình trình tạo client cơ sở dữ liệu.*
  - [`demo/backend/src/lib/prisma.ts`](file:///d:/tenomad/task_04/demo/backend/src/lib/prisma.ts) — *Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho prisma.*
- **💡 Bài học/Kỹ năng**: *Sơ đồ Prisma ORM hỗ trợ mô hình hóa quan hệ thực thể với các khóa ngoại tự động xóa dây chuyền. Trình tạo mã sẽ biên dịch các kiểu dữ liệu an toàn để truy vấn.*

---

## 4. 🗺️ Sơ Đồ Ánh Xạ Tệp Tin (File Map)

Dưới đây là bảng tra cứu nhanh nhiệm vụ của các tệp tin quan trọng trong dự án, được tổ chức theo lớp kiến trúc:

| Tệp tin | Lớp kiến trúc | Độ phức tạp | Tóm tắt chức năng |
| :--- | :--- | :--- | :--- |
| [`.agents/workflows/build.md`](file:///d:/tenomad/task_04/.agents/workflows/build.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm build.md. |
| [`.agents/workflows/build.toml`](file:///d:/tenomad/task_04/.agents/workflows/build.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho build.toml. |
| [`.agents/workflows/code-simplify.md`](file:///d:/tenomad/task_04/.agents/workflows/code-simplify.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm code-simplify.md. |
| [`.agents/workflows/code-simplify.toml`](file:///d:/tenomad/task_04/.agents/workflows/code-simplify.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho code-simplify.toml. |
| [`.agents/workflows/planning.md`](file:///d:/tenomad/task_04/.agents/workflows/planning.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm planning.md. |
| [`.agents/workflows/planning.toml`](file:///d:/tenomad/task_04/.agents/workflows/planning.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho planning.toml. |
| [`.agents/workflows/review.md`](file:///d:/tenomad/task_04/.agents/workflows/review.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm review.md. |
| [`.agents/workflows/review.toml`](file:///d:/tenomad/task_04/.agents/workflows/review.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho review.toml. |
| [`.agents/workflows/ship.md`](file:///d:/tenomad/task_04/.agents/workflows/ship.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm ship.md. |
| [`.agents/workflows/ship.toml`](file:///d:/tenomad/task_04/.agents/workflows/ship.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho ship.toml. |
| [`.agents/workflows/spec.md`](file:///d:/tenomad/task_04/.agents/workflows/spec.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm spec.md. |
| [`.agents/workflows/spec.toml`](file:///d:/tenomad/task_04/.agents/workflows/spec.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho spec.toml. |
| [`.agents/workflows/test.md`](file:///d:/tenomad/task_04/.agents/workflows/test.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm test.md. |
| [`.agents/workflows/test.toml`](file:///d:/tenomad/task_04/.agents/workflows/test.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho test.toml. |
| [`.agents/workflows/understand-chat.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-chat.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand-chat.md. |
| [`.agents/workflows/understand-chat.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-chat.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand-chat.toml. |
| [`.agents/workflows/understand-dashboard.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-dashboard.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand-dashboard.md. |
| [`.agents/workflows/understand-dashboard.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-dashboard.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand-dashboard.toml. |
| [`.agents/workflows/understand-diff.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-diff.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand-diff.md. |
| [`.agents/workflows/understand-diff.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-diff.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand-diff.toml. |
| [`.agents/workflows/understand-domain.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-domain.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand-domain.md. |
| [`.agents/workflows/understand-domain.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-domain.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand-domain.toml. |
| [`.agents/workflows/understand-explain.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-explain.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand-explain.md. |
| [`.agents/workflows/understand-explain.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-explain.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand-explain.toml. |
| [`.agents/workflows/understand-knowledge.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-knowledge.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand-knowledge.md. |
| [`.agents/workflows/understand-knowledge.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-knowledge.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand-knowledge.toml. |
| [`.agents/workflows/understand-onboard.md`](file:///d:/tenomad/task_04/.agents/workflows/understand-onboard.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand-onboard.md. |
| [`.agents/workflows/understand-onboard.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand-onboard.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand-onboard.toml. |
| [`.agents/workflows/understand.md`](file:///d:/tenomad/task_04/.agents/workflows/understand.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm understand.md. |
| [`.agents/workflows/understand.toml`](file:///d:/tenomad/task_04/.agents/workflows/understand.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho understand.toml. |
| [`demo/backend/.env.example`](file:///d:/tenomad/task_04/demo/backend/.env.example) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho .env.example. |
| [`demo/backend/package.json`](file:///d:/tenomad/task_04/demo/backend/package.json) | Cấu hình hệ thống (System Config) | `moderate` | Tệp khai báo cấu hình Node.js định nghĩa các thư viện phụ thuộc, kịch bản lệnh và siêu dữ liệu không gian làm việc. |
| [`demo/backend/tsconfig.json`](file:///d:/tenomad/task_04/demo/backend/tsconfig.json) | Cấu hình hệ thống (System Config) | `simple` | Cấu hình trình biên dịch TypeScript định nghĩa các tùy chọn đầu ra, ánh xạ đường dẫn và quy tắc kiểm tra nghiêm ngặt. |
| [`demo/frontend/AGENTS.md`](file:///d:/tenomad/task_04/demo/frontend/AGENTS.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu hướng dẫn chỉ ra các điểm khác biệt đặc biệt của kiến trúc Next.js trong dự án này. |
| [`demo/frontend/CLAUDE.md`](file:///d:/tenomad/task_04/demo/frontend/CLAUDE.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm CLAUDE.md. |
| [`demo/frontend/README.md`](file:///d:/tenomad/task_04/demo/frontend/README.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu hướng dẫn chính của dự án cung cấp tổng quan, hướng dẫn thiết lập và mô tả kiến trúc. |
| [`demo/frontend/package.json`](file:///d:/tenomad/task_04/demo/frontend/package.json) | Cấu hình hệ thống (System Config) | `simple` | Tệp khai báo cấu hình Node.js định nghĩa các thư viện phụ thuộc, kịch bản lệnh và siêu dữ liệu không gian làm việc. |
| [`demo/frontend/tsconfig.json`](file:///d:/tenomad/task_04/demo/frontend/tsconfig.json) | Cấu hình hệ thống (System Config) | `simple` | Cấu hình trình biên dịch TypeScript định nghĩa các tùy chọn đầu ra, ánh xạ đường dẫn và quy tắc kiểm tra nghiêm ngặt. |
| [`note/PRD.md`](file:///d:/tenomad/task_04/note/PRD.md) | Tài liệu hướng dẫn (Documentation) | `complex` | Tài liệu Yêu cầu Sản phẩm (PRD) chi tiết các tính năng mục tiêu, câu chuyện người dùng và lựa chọn kiến trúc. |
| [`note/SKILL_FE.md`](file:///d:/tenomad/task_04/note/SKILL_FE.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm cẩm nang Frontend SKILL_FE.md. |
| [`note/baocao.md`](file:///d:/tenomad/task_04/note/baocao.md) | Tài liệu hướng dẫn (Documentation) | `complex` | Documentation file outlining Báo cáo Nghiên cứu Chuyên sâu: Agent Skills. |
| [`note/cauhoi.md`](file:///d:/tenomad/task_04/note/cauhoi.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm cauhoi.md. |
| [`note/huongdandemo.md`](file:///d:/tenomad/task_04/note/huongdandemo.md) | Tài liệu hướng dẫn (Documentation) | `complex` | Documentation file outlining Hướng dẫn demo Agent Skills KIT cho TaskFlow. |
| [`note/lenhcoman.md`](file:///d:/tenomad/task_04/note/lenhcoman.md) | Tài liệu hướng dẫn (Documentation) | `moderate` | Tài liệu dự án bao gồm lenhcoman.md. |
| [`note/package.json`](file:///d:/tenomad/task_04/note/package.json) | Cấu hình hệ thống (System Config) | `simple` | Tệp khai báo cấu hình Node.js định nghĩa các thư viện phụ thuộc, kịch bản lệnh và siêu dữ liệu không gian làm việc. |
| [`note/slide.md`](file:///d:/tenomad/task_04/note/slide.md) | Tài liệu hướng dẫn (Documentation) | `complex` | Documentation file outlining Agent Skills KIT & TaskFlow Demo. |
| [`note/task.md`](file:///d:/tenomad/task_04/note/task.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm task.md. |
| [`note/traloi.md`](file:///d:/tenomad/task_04/note/traloi.md) | Tài liệu hướng dẫn (Documentation) | `moderate` | Documentation file outlining 🤖 Giải đáp từ Senior AI Agent & Developer. |
| [`note/understand_guide.md`](file:///d:/tenomad/task_04/note/understand_guide.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Documentation file outlining Hướng dẫn nhanh sử dụng "Understand Anything". |
| [`note/workflow.md`](file:///d:/tenomad/task_04/note/workflow.md) | Tài liệu hướng dẫn (Documentation) | `moderate` | Documentation file outlining Hướng dẫn áp dụng bộ Agent Skills cho TaskFlow PRD. |
| [`.agents/rules/fe.md`](file:///d:/tenomad/task_04/.agents/rules/fe.md) | Tài liệu hướng dẫn (Documentation) | `simple` | Tài liệu dự án bao gồm fe.md. |
| [`.gitattributes`](file:///d:/tenomad/task_04/.gitattributes) | Cấu hình hệ thống (System Config) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho . |
| [`.understand-anything/.understandignore`](file:///d:/tenomad/task_04/.understand-anything/.understandignore) | Cấu hình hệ thống (System Config) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho . |
| [`.understand-anything/tmp/generate-ignore.cjs`](file:///d:/tenomad/task_04/.understand-anything/tmp/generate-ignore.cjs) | Cấu hình hệ thống (System Config) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho generate-ignore. |
| [`demo/backend/prisma/migrations/20260507152419_init_slice_a/migration.sql`](file:///d:/tenomad/task_04/demo/backend/prisma/migrations/20260507152419_init_slice_a/migration.sql) | Cơ sở dữ liệu & ORM (Database ORM) | `moderate` | Tệp di cư cơ sở dữ liệu SQL để cập nhật sơ đồ trong migration.sql. |
| [`demo/backend/prisma/migrations/20260507155133_add_projects_tasks/migration.sql`](file:///d:/tenomad/task_04/demo/backend/prisma/migrations/20260507155133_add_projects_tasks/migration.sql) | Cơ sở dữ liệu & ORM (Database ORM) | `moderate` | Tệp di cư cơ sở dữ liệu SQL để cập nhật sơ đồ trong migration.sql. |
| [`demo/backend/prisma/migrations/20260508023041_add_comments_notifications/migration.sql`](file:///d:/tenomad/task_04/demo/backend/prisma/migrations/20260508023041_add_comments_notifications/migration.sql) | Cơ sở dữ liệu & ORM (Database ORM) | `simple` | Tệp di cư cơ sở dữ liệu SQL để cập nhật sơ đồ trong migration.sql. |
| [`demo/backend/prisma/migrations/migration_lock.toml`](file:///d:/tenomad/task_04/demo/backend/prisma/migrations/migration_lock.toml) | Cấu hình hệ thống (System Config) | `simple` | Tệp cấu hình thiết lập cho migration_lock.toml. |
| [`demo/backend/prisma/schema.prisma`](file:///d:/tenomad/task_04/demo/backend/prisma/schema.prisma) | Cơ sở dữ liệu & ORM (Database ORM) | `complex` | Sơ đồ cơ sở dữ liệu Prisma ORM chỉ định các mô hình dữ liệu, mối quan hệ bảng và cấu hình trình tạo client cơ sở dữ liệu. |
| [`demo/backend/src/app.ts`](file:///d:/tenomad/task_04/demo/backend/src/app.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho app. |
| [`demo/backend/src/controllers/auth.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/auth.controller.ts) | Lớp xử lý API (API Controllers) | `moderate` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho auth.controller. |
| [`demo/backend/src/controllers/comment.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/comment.controller.ts) | Lớp xử lý API (API Controllers) | `moderate` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho comment.controller. |
| [`demo/backend/src/controllers/my-tasks.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/my-tasks.controller.ts) | Lớp xử lý API (API Controllers) | `moderate` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho my-tasks.controller. |
| [`demo/backend/src/controllers/notification.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/notification.controller.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho notification.controller. |
| [`demo/backend/src/controllers/project.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/project.controller.ts) | Lớp xử lý API (API Controllers) | `moderate` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho project.controller. |
| [`demo/backend/src/controllers/report.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/report.controller.ts) | Lớp xử lý API (API Controllers) | `moderate` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho report.controller. |
| [`demo/backend/src/controllers/search.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/search.controller.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho search.controller. |
| [`demo/backend/src/controllers/task.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/task.controller.ts) | Lớp xử lý API (API Controllers) | `complex` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho task.controller. |
| [`demo/backend/src/controllers/workspace.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/workspace.controller.ts) | Lớp xử lý API (API Controllers) | `complex` | Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho workspace.controller. |
| [`demo/backend/src/lib/prisma.ts`](file:///d:/tenomad/task_04/demo/backend/src/lib/prisma.ts) | Cơ sở dữ liệu & ORM (Database ORM) | `simple` | Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho prisma. |
| [`demo/backend/src/middleware/auth.middleware.ts`](file:///d:/tenomad/task_04/demo/backend/src/middleware/auth.middleware.ts) | Kiểm soát trung gian (API Middleware) | `moderate` | Middleware Express thực hiện kiểm tra dữ liệu yêu cầu, xác thực và xử lý lỗi cho xác thực.middleware. |
| [`demo/backend/src/middleware/error.middleware.ts`](file:///d:/tenomad/task_04/demo/backend/src/middleware/error.middleware.ts) | Kiểm soát trung gian (API Middleware) | `simple` | Middleware Express thực hiện kiểm tra dữ liệu yêu cầu, xác thực và xử lý lỗi cho error.middleware. |
| [`demo/backend/src/routes/auth.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/auth.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho xác thực. |
| [`demo/backend/src/routes/my-tasks.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/my-tasks.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho my-tasks. |
| [`demo/backend/src/routes/notification.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/notification.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho thông báo. |
| [`demo/backend/src/routes/project.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/project.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho dự án. |
| [`demo/backend/src/routes/report.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/report.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho báo cáo. |
| [`demo/backend/src/routes/search.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/search.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho tìm kiếm. |
| [`demo/backend/src/routes/task.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/task.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho công việc. |
| [`demo/backend/src/routes/workspace.ts`](file:///d:/tenomad/task_04/demo/backend/src/routes/workspace.ts) | Lớp xử lý API (API Controllers) | `simple` | Bộ định tuyến định nghĩa các tuyến API, phương thức HTTP, middleware và bộ điều khiển cho không gian làm việc. |
| [`demo/backend/src/server.ts`](file:///d:/tenomad/task_04/demo/backend/src/server.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho server. |
| [`demo/backend/src/services/activity.service.ts`](file:///d:/tenomad/task_04/demo/backend/src/services/activity.service.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Lớp dịch vụ thực hiện các logic nghiệp vụ cốt lõi, thông báo hoặc giao dịch cơ sở dữ liệu cho activity.service. |
| [`demo/backend/src/services/email.service.ts`](file:///d:/tenomad/task_04/demo/backend/src/services/email.service.ts) | Nghiệp vụ cốt lõi (Business Logic) | `moderate` | Lớp dịch vụ thực hiện các logic nghiệp vụ cốt lõi, thông báo hoặc giao dịch cơ sở dữ liệu cho email.service. |
| [`demo/backend/src/services/notification.service.ts`](file:///d:/tenomad/task_04/demo/backend/src/services/notification.service.ts) | Nghiệp vụ cốt lõi (Business Logic) | `moderate` | Lớp dịch vụ thực hiện các logic nghiệp vụ cốt lõi, thông báo hoặc giao dịch cơ sở dữ liệu cho thông báo.service. |
| [`demo/backend/src/types/auth.types.ts`](file:///d:/tenomad/task_04/demo/backend/src/types/auth.types.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Mô-đun xuất khẩu các giao diện, sơ đồ cấu trúc hoặc thành phần công khai để đơn giản hóa việc import. |
| [`demo/backend/src/types/task.types.ts`](file:///d:/tenomad/task_04/demo/backend/src/types/task.types.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Mô-đun xuất khẩu các giao diện, sơ đồ cấu trúc hoặc thành phần công khai để đơn giản hóa việc import. |
| [`demo/backend/src/utils/errors.ts`](file:///d:/tenomad/task_04/demo/backend/src/utils/errors.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho errors. |
| [`demo/backend/src/utils/mention.ts`](file:///d:/tenomad/task_04/demo/backend/src/utils/mention.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho mention. |
| [`demo/backend/src/utils/sanitize.ts`](file:///d:/tenomad/task_04/demo/backend/src/utils/sanitize.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho sanitize. |
| [`demo/backend/tests/integration/auth-workspace.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/auth-workspace.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho auth-workspace. |
| [`demo/backend/tests/integration/comment-notification.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/comment-notification.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho comment-notification. |
| [`demo/backend/tests/integration/global-search-polish.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/global-search-polish.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho global-search-polish. |
| [`demo/backend/tests/integration/my-tasks-search.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/my-tasks-search.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho my-tasks-search. |
| [`demo/backend/tests/integration/project-task.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/project-task.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho project-task. |
| [`demo/backend/tests/integration/reports.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/reports.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho reports. |
| [`demo/backend/tests/integration/status-activity.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/status-activity.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho status-activity. |
| [`demo/backend/tests/integration/team-kanban.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/team-kanban.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `complex` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho team-kanban. |
| [`demo/backend/tests/unit/errors.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/unit/errors.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho errors. |
| [`demo/backend/tests/unit/mention-parser.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/unit/mention-parser.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `simple` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho mention-parser. |
| [`demo/backend/tests/unit/schemas.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/unit/schemas.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `moderate` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho schemas. |
| [`demo/backend/tests/unit/status-permission.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/unit/status-permission.test.ts) | Nghiệp vụ cốt lõi (Business Logic) | `moderate` | Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho status-permission. |
| [`demo/backend/vitest.config.ts`](file:///d:/tenomad/task_04/demo/backend/vitest.config.ts) | Cấu hình hệ thống (System Config) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho vitest.config. |
| [`demo/frontend/eslint.config.mjs`](file:///d:/tenomad/task_04/demo/frontend/eslint.config.mjs) | Giao diện người dùng (Frontend UI) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho eslint.config. |
| [`demo/frontend/next.config.ts`](file:///d:/tenomad/task_04/demo/frontend/next.config.ts) | Cấu hình hệ thống (System Config) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho next.config. |
| [`demo/frontend/postcss.config.mjs`](file:///d:/tenomad/task_04/demo/frontend/postcss.config.mjs) | Giao diện người dùng (Frontend UI) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho postcss.config. |
| [`demo/frontend/src/app/(auth)/invite/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/invite/page.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/(auth)/layout.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/layout.tsx) | Giao diện người dùng (Frontend UI) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho layout. |
| [`demo/frontend/src/app/(auth)/login/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/login/page.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/(auth)/register/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/(auth)/register/page.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/app/layout.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/layout.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho layout. |
| [`demo/frontend/src/app/app/my-tasks/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/my-tasks/page.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/app/projects/[id]/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/projects/[id]/page.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/app/projects/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/projects/page.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/app/reports/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/reports/page.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/app/settings/members/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/settings/members/page.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/app/team/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/app/team/page.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/globals.css`](file:///d:/tenomad/task_04/demo/frontend/src/app/globals.css) | Giao diện người dùng (Frontend UI) | `complex` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho globals. |
| [`demo/frontend/src/app/layout.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/layout.tsx) | Giao diện người dùng (Frontend UI) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho layout. |
| [`demo/frontend/src/app/page.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/page.tsx) | Giao diện người dùng (Frontend UI) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho page. |
| [`demo/frontend/src/app/providers.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/app/providers.tsx) | Giao diện người dùng (Frontend UI) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho providers. |
| [`demo/frontend/src/components/layout/header.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/layout/header.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho thanh đầu trang. |
| [`demo/frontend/src/components/layout/notification-bell.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/layout/notification-bell.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho chuông thông báo. |
| [`demo/frontend/src/components/layout/sidebar.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/layout/sidebar.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho thanh bên. |
| [`demo/frontend/src/components/task/activity-tab.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/task/activity-tab.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho tab hoạt động. |
| [`demo/frontend/src/components/task/comment-tab.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/task/comment-tab.tsx) | Giao diện người dùng (Frontend UI) | `complex` | Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho tab bình luận. |
| [`demo/frontend/src/components/task/status-dropdown.tsx`](file:///d:/tenomad/task_04/demo/frontend/src/components/task/status-dropdown.tsx) | Giao diện người dùng (Frontend UI) | `moderate` | Thành phần React hiển thị các phần tử giao diện người dùng và quản lý trạng thái cục bộ cho menu trạng thái thả xuống. |
| [`demo/frontend/src/lib/api-client.ts`](file:///d:/tenomad/task_04/demo/frontend/src/lib/api-client.ts) | Giao diện người dùng (Frontend UI) | `moderate` | Các tiện ích trợ giúp và thư viện đóng gói cung cấp công cụ dùng chung cho api-client. |
| [`demo/frontend/src/stores/auth-store.ts`](file:///d:/tenomad/task_04/demo/frontend/src/stores/auth-store.ts) | Quản lý trạng thái (State Management) | `simple` | Kho lưu trữ quản lý trạng thái sử dụng Zustand để cập nhật phản hồi và duy trì trạng thái ứng dụng. |
| [`demo/frontend/src/types/task.ts`](file:///d:/tenomad/task_04/demo/frontend/src/types/task.ts) | Giao diện người dùng (Frontend UI) | `moderate` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho task. |
| [`demo/frontend/src/types/user.ts`](file:///d:/tenomad/task_04/demo/frontend/src/types/user.ts) | Giao diện người dùng (Frontend UI) | `simple` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho user. |
| [`demo/package.json`](file:///d:/tenomad/task_04/demo/package.json) | Cấu hình hệ thống (System Config) | `simple` | Tệp khai báo cấu hình Node.js định nghĩa các thư viện phụ thuộc, kịch bản lệnh và siêu dữ liệu không gian làm việc. |
| [`demo/SPEC.md`](file:///d:/tenomad/task_04/demo/SPEC.md) | Tài liệu hướng dẫn (Documentation) | `complex` | Documentation file outlining Spec: TaskFlow MVP v1.0. |
| [`note/md-to-pdf.js`](file:///d:/tenomad/task_04/note/md-to-pdf.js) | Cấu hình hệ thống (System Config) | `moderate` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho md-to-pdf. |
| [`note/task04.pptx`](file:///d:/tenomad/task_04/note/task04.pptx) | Cấu hình hệ thống (System Config) | `complex` | Tệp logic ứng dụng thực hiện các hoạt động mã nguồn cho task04. |
| [`tasks/plan.md`](file:///d:/tenomad/task_04/tasks/plan.md) | Tài liệu hướng dẫn (Documentation) | `complex` | Documentation file outlining TaskFlow MVP — Implementation Plan. |
| [`tasks/todo.md`](file:///d:/tenomad/task_04/tasks/todo.md) | Tài liệu hướng dẫn (Documentation) | `complex` | Documentation file outlining TaskFlow MVP — TODO Checklist. |

---

## 5. ⚠️ Các Điểm Nóng Độ Phức Tạp (Complexity Hotspots)

Đây là những tệp tin có cấu trúc hoặc logic phức tạp nhất trong hệ thống. Lập trình viên mới nên **tiếp cận một cách cẩn thận** và tham vấn các thành viên lâu năm trước khi chỉnh sửa:

### ⚡ [`note/PRD.md`](file:///d:/tenomad/task_04/note/PRD.md)
- **Lớp kiến trúc**: Tài liệu hướng dẫn (Documentation)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Tài liệu Yêu cầu Sản phẩm (PRD) chi tiết các tính năng mục tiêu, câu chuyện người dùng và lựa chọn kiến trúc.
- **Tags**: `#documentation` `#markdown` `#requirements` `#specification`

### ⚡ [`note/baocao.md`](file:///d:/tenomad/task_04/note/baocao.md)
- **Lớp kiến trúc**: Tài liệu hướng dẫn (Documentation)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Documentation file outlining Báo cáo Nghiên cứu Chuyên sâu: Agent Skills.
- **Tags**: `#documentation` `#markdown` `#codebase`

### ⚡ [`note/huongdandemo.md`](file:///d:/tenomad/task_04/note/huongdandemo.md)
- **Lớp kiến trúc**: Tài liệu hướng dẫn (Documentation)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Documentation file outlining Hướng dẫn demo Agent Skills KIT cho TaskFlow.
- **Tags**: `#documentation` `#markdown` `#codebase`

### ⚡ [`note/slide.md`](file:///d:/tenomad/task_04/note/slide.md)
- **Lớp kiến trúc**: Tài liệu hướng dẫn (Documentation)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Documentation file outlining Agent Skills KIT & TaskFlow Demo.
- **Tags**: `#documentation` `#markdown` `#codebase`

### ⚡ [`demo/backend/prisma/schema.prisma`](file:///d:/tenomad/task_04/demo/backend/prisma/schema.prisma)
- **Lớp kiến trúc**: Cơ sở dữ liệu & ORM (Database ORM)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Sơ đồ cơ sở dữ liệu Prisma ORM chỉ định các mô hình dữ liệu, mối quan hệ bảng và cấu hình trình tạo client cơ sở dữ liệu.
- **Tags**: `#database` `#schema-definition` `#prisma` `#orm`

### ⚡ [`demo/backend/src/controllers/task.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/task.controller.ts)
- **Lớp kiến trúc**: Lớp xử lý API (API Controllers)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho task.controller.
- **Tags**: `#source-code` `#typescript` `#api-handler` `#controller`

### ⚡ [`demo/backend/src/controllers/workspace.controller.ts`](file:///d:/tenomad/task_04/demo/backend/src/controllers/workspace.controller.ts)
- **Lớp kiến trúc**: Lớp xử lý API (API Controllers)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Bộ điều khiển xử lý định tuyến API, kiểm tra dữ liệu yêu cầu và logic nghiệp vụ cho workspace.controller.
- **Tags**: `#source-code` `#typescript` `#api-handler` `#controller`

### ⚡ [`demo/backend/tests/integration/auth-workspace.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/auth-workspace.test.ts)
- **Lớp kiến trúc**: Nghiệp vụ cốt lõi (Business Logic)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho auth-workspace.
- **Tags**: `#source-code` `#typescript` `#test` `#quality-assurance`

### ⚡ [`demo/backend/tests/integration/comment-notification.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/comment-notification.test.ts)
- **Lớp kiến trúc**: Nghiệp vụ cốt lõi (Business Logic)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho comment-notification.
- **Tags**: `#source-code` `#typescript` `#test` `#quality-assurance`

### ⚡ [`demo/backend/tests/integration/global-search-polish.test.ts`](file:///d:/tenomad/task_04/demo/backend/tests/integration/global-search-polish.test.ts)
- **Lớp kiến trúc**: Nghiệp vụ cốt lõi (Business Logic)
- **Mức độ phức tạp**: `COMPLEX`
- **Mô tả logic**: Bộ kiểm thử đơn vị và tích hợp xác thực chức năng cho global-search-polish.
- **Tags**: `#source-code` `#typescript` `#test` `#quality-assurance`


---

## 💡 Đề Xuất Cho Lập Trình Viên Mới

1. **Khởi chạy Web Dashboard**:
   Chạy lệnh để khởi tạo dashboard sơ đồ 2D trực quan bằng cách mở liên kết cục bộ của máy chủ phụ trợ để có cái nhìn toàn cảnh.
2. **Commit tài liệu này**:
   Đề xuất lưu tệp tin này vào thư mục `docs/ONBOARDING.md` và commit lên repository để làm tài liệu chuẩn hóa cho toàn đội ngũ phát triển.

Chúc bạn có những trải nghiệm lập trình tuyệt vời tại dự án! 🚀
