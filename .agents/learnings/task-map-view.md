# Task Map View (Bản đồ Tác vụ Nhân viên)
Cập nhật lần cuối: 2026-06-21

## Architecture
- **Tích hợp Bản đồ Tác vụ (Task Map View)** (2026-06-21):
  Bản đồ mặt bằng chợ được render động phía Client dựa trên dữ liệu blueprint (từ API `getMarketMap(1)`) nhân với tỉ lệ `MAP_SCALE = 0.65`. Component lọc và nhóm các tác vụ chưa hoàn thành (trừ `Completed`, `Cancelled`) của Staff theo `stallId` để hiển thị trực quan các sạp có tác vụ hoạt động cần xử lý.
  *Files liên quan*: [TaskMapView.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.jsx), [TaskMapView.css](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.css)

- **Semantic HTML & SEO Metadata** (2026-06-21):
  Cấu trúc layout bản đồ sử dụng các thẻ HTML5 ngữ nghĩa (`<main>`, `<section>`, `<aside>`) và tiêu đề chính `<h1>`. `document.title` và thẻ `meta description` được cập nhật động khi mở bản đồ và khôi phục chính xác về trạng thái ban đầu khi người dùng rời đi.
  *Files liên quan*: [TaskMapView.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.jsx)

- **Unique IDs cho Kiểm thử tự động (Automation Testing)** (2026-06-21):
  Tất cả các phần tử tương tác (như nút Back, sạp hàng trên bản đồ, nút "Go to Details") được gán thuộc tính `id` duy nhất và mô tả rõ ràng để phục vụ việc viết kịch bản test tự động định vị node dễ dàng.
  *Files liên quan*: [TaskMapView.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.jsx)

## Bugs & Solutions
- **Lỗi cú pháp do ghi đè file không kiểm soát** (2026-06-21):
  *Mô tả*: File `TaskMapView.jsx` bị lỗi cú pháp `Expected ',' or ')' but found '}'` do ghi đè nhầm dấu ngoặc đóng của lệnh `return` ở cuối file thành `}`.
  *Giải pháp*: Bổ sung lại `);` đóng return trước dấu ngoặc đóng component `}` và chạy build production `npm run build` để kiểm tra.
  *Files liên quan*: [TaskMapView.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.jsx)

## How-To
- **Quy trình đồng bộ và hiển thị dữ liệu bản đồ tác vụ** (2026-06-21):
  1. Fetch dữ liệu blueprint của chợ và tính toán kích thước canvas (`canvasWidth`, `canvasHeight`) dựa trên toạ độ khu vực tối đa.
  2. Tải danh sách tác vụ của nhân viên hiện tại qua API Staff.
  3. Lọc bỏ các task đã hoàn thành/hủy, nhóm số task còn lại theo `stallId`.
  4. Hiển thị sạp hàng có task hoạt động với viền nổi bật và icon `🛠️`.
  5. Click vào sạp hàng để hiển thị panel chi tiết bên phải (Aside) cùng nút shortcut mở chi tiết task.
  *Files liên quan*: [TaskMapView.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.jsx)

## Patterns
- **Tối ưu SEO Metadata động bằng Hook Cleanup** (2026-06-21):
  Để quản lý title và description động, dùng `useEffect` lưu giá trị cũ của `document.title` và nội dung của thẻ `meta[name="description"]` (hoặc tạo mới nếu chưa có). Khi component unmount, cleanup function sẽ trả lại giá trị ban đầu giúp giữ trang sạch sẽ và chuẩn SEO.
  *Files liên quan*: [TaskMapView.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.jsx)

- **Gán ID động cho các Node lặp** (2026-06-21):
  Khi render các sạp hàng và nút bấm lặp qua map, gán ID động dạng `id={`map-stall-node-${stall.code}`}` và `id={`btn-go-task-details-${task.taskId}`}` giúp kịch bản test tự động hóa dễ dàng tương tác chính xác với node mong muốn.
  *Files liên quan*: [TaskMapView.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskMapView.jsx)

- **Layout Động 1 cột / 2 cột Theo Trạng Thái Nội Dung (Dynamic Content-aware Column Layout)** (2026-06-21):
  Khi giao diện chi tiết phân chia 2 cột nhưng cột phụ (như sidebar) có thể bị trống theo trạng thái dữ liệu, ta tính toán boolean `hasRightColContent` để tự động chuyển đổi sang layout 1 cột trung tâm (`one-col` max-width 800px), đảm bảo cân bằng bố cục trực quan và tránh khoảng trắng trống mất thẩm mỹ.
  *Files liên quan*: [TaskDetail.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskDetail.jsx), [TaskDetail.css](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Staff/TaskDetail.css)

