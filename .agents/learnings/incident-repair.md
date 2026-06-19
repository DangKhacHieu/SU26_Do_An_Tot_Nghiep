# Incident & Repair Management
Cập nhật lần cuối: 2026-06-19

## Architecture
- **Service Request & Repair Quotation Workflow Options** (2026-05-29):
  Để tối giản hóa tính năng báo giá và phê duyệt vật tư (MF-12) mà không cần xây dựng hệ thống quản lý kho bãi phức tạp, hệ thống sẽ lưu thông tin báo giá trực tiếp dưới dạng chuỗi văn bản tự do và số tiền ước tính. Hai phương án thiết kế được đề xuất:
  * Phương án A (Duyệt online): Thêm các trường `QuotationText`, `QuotationAmount`, `IsQuoteApproved` (bool?), và `RepairRating` (int?) trực tiếp vào thực thể `Request`. Khách hàng duyệt trực tuyến trước khi giao nhiệm vụ sửa chữa.
  * Phương án B (Duyệt offline): Thỏa thuận báo giá giấy offline, Staff ghi nhận chi phí thực tế và tải ảnh biên bản lên `StaffTask` khi hoàn thành.
  Hóa đơn sẽ được Kế toán tạo vào cuối tháng dựa trên chi phí nghiệm thu từ task hoàn thành (nếu do lỗi Vendor hoặc Vendor yêu cầu). Nếu hỏng tự nhiên, Ban quản lý chịu phí.
  Files: STMM.DataAccess/Entities/Request.cs, STMM.DataAccess/Entities/StaffTask.cs, STMM.DataAccess/Entities/InvoiceDetail.cs

- **Staff Repair Quotation Flow** (2026-06-04):
  Triển khai luồng lập báo giá sửa chữa chi tiết của Staff dưới dạng các dòng vật tư (`task_materials`) liên kết với catalog giá chuẩn (`repair_prices`). Khi báo giá được gửi đi, Task chuyển sang trạng thái `PendingApproval`, cập nhật tổng chi phí thực tế (`ActualCost`) và kích hoạt thông báo hệ thống đến Managers để phê duyệt online.
  *Files liên quan*: [IQuotationService.cs](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.Business/Interfaces/IQuotationService.cs), [QuotationService.cs](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.Business/Services/QuotationService.cs), [QuotationController.cs](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.API/Controllers/QuotationController.cs)

- **Liên kết Tác vụ & Yêu cầu (Task & Customer Request Linking)** (2026-06-19):
  Thiết lập mối quan hệ liên kết trực tiếp giữa tác vụ kỹ thuật (`staff_tasks`) và yêu cầu sửa chữa nguồn của tiểu thương (`requests`). Manager khi tạo tác vụ loại `Repair` hoặc `Maintenance` có thể tích chọn liên kết và tìm kiếm các Yêu cầu đang chờ (`Pending`) thuộc loại `FacilityIssue`. Trang chi tiết tác vụ của Manager và Staff hiển thị mã yêu cầu dưới dạng link bấm được để chuyển hướng nhanh sang trang xem chi tiết yêu cầu đó.
  *Files liên quan*: [CreateTaskModal.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/CreateTaskModal.jsx), [TaskDetailManager.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/TaskDetailManager.jsx)

- **Loại bỏ tác vụ CashCollection thủ công (CashCollection Task Type Removal)** (2026-06-19):
  Loại bỏ hoàn toàn loại tác vụ thu tiền mặt (`CashCollection`) khỏi danh sách các tác vụ có thể tạo thủ công ở frontend (dropdown) và chặn ở tầng API validator của backend. Thay vào đó, Staff chủ động thực hiện thu tiền và đối soát trực tiếp thông qua màn hình Danh bạ sạp (`StallList.jsx`) để tối ưu hóa và đơn giản hóa luồng giao việc của Manager.
  *Files liên quan*: [CreateTaskModal.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/CreateTaskModal.jsx), [CreateTaskValidator.cs](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.Business/Validators/CreateTaskValidator.cs)

- **Ràng buộc quyền duyệt báo giá Task liên kết Request** (2026-06-19):
  Manager không được phép duyệt báo giá (chuyển trạng thái từ `PendingApproval` sang `In_Progress` hoặc `Cancelled`) đối với Task có liên kết với Yêu cầu sửa chữa (`RequestId != null`). Quyền duyệt này thuộc về Vendor phê duyệt online trên Request liên kết. API backend chặn hành động và ném `BadRequestException`, frontend ẩn nút `UPDATE STATUS` của Task, đồng thời hiển thị banner màu vàng cam cảnh báo cùng link chuyển hướng sang Request liên kết.
  *Files liên quan*: [StaffTaskService.cs](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.Business/Services/StaffTaskService.cs), [TaskDetailManager.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/TaskDetailManager.jsx)

## Bugs & Solutions
- **Lỗi lock file DLL khi build/test song song** (2026-06-04):
  *Mô tả*: Khi `STMM.API` đang chạy trong nền giữ lock DLLs, chạy lệnh `dotnet build` trên toàn bộ solution sẽ thất bại.
  *Giải pháp*: Thực hiện build riêng lẻ các project Business (`dotnet build STMM.Business.csproj`) hoặc project test (`dotnet test STMM.Tests.csproj`) để kiểm tra cú pháp và chạy unit tests độc lập mà không bị xung đột tiến trình runtime API.

- **Lỗi crash UI khi xem tác vụ chưa phân công (Unassigned Task Detail Crash)** (2026-06-19):
  *Mô tả*: Giao diện Manager tính toán avatar initials và tên nhân viên từ `task.assignedToName` bằng hàm `.split(' ')`. Khi tác vụ mới tạo chưa được gán cho Staff nào, giá trị này bị `null` dẫn đến crash sập màn hình trắng.
  *Giải pháp*: Thêm kiểm tra an toàn `task.assignedToName ? ... : '??'` để hiển thị avatar mặc định và hiển thị `"Unassigned"` thay vì để trống hoặc ném lỗi.
  *Files liên quan*: [TaskDetailManager.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/TaskDetailManager.jsx)

## How-To
- **Quy trình phối hợp sửa chữa và gạch nợ chi phí** (2026-05-29):
  1. Tiêu thương gửi đơn yêu cầu (`Request`) hoặc Staff báo cáo sự cố (`Issue`).
  2. Khảo sát & Báo giá: Nhập ước tính chi phí và danh sách vật tư vào `Request` (hoặc `StaffTask`).
  3. Phê duyệt: Tiêu thương đồng ý (chuyển trạng thái đơn sang duyệt) hoặc từ chối.
  4. Thi công: Giao task sửa chữa cho Staff kỹ thuật, Staff cập nhật tiến độ và chi phí hoàn thành thực tế.
  5. Đối soát & Lên hóa đơn: Kế toán duyệt task, nếu lỗi thuộc Vendor thì gộp dòng phí sửa chữa vào hóa đơn tháng.
  Files: STMM.DataAccess/Entities/Request.cs, STMM.DataAccess/Entities/StaffTask.cs

- **Quy trình thêm vật tư báo giá cho Task** (2026-06-04):
  1. Lấy danh sách catalog vật tư có sẵn từ `repair_prices`.
  2. Thêm vật tư (`AddMaterialAsync`): Nếu vật tư là "Vật tư khác" (giá chuẩn bằng 0), bắt buộc Staff nhập đơn giá tự do (`CustomUnitPrice`), ngược lại tự động áp đơn giá từ catalog.
  3. Hệ thống kiểm tra quyền sở hữu task (chỉ Staff được giao mới được sửa) và trạng thái task phải là `Pending`.
  *Files liên quan*: [QuotationService.cs](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.Business/Services/QuotationService.cs)

- **Cách thiết lập cục bộ môi trường Test của .NET** (2026-06-19):
  *Mô tả*: Khi thư mục kiểm thử `STMM.Tests` bị `.gitignore` chặn dẫn đến việc tải source code bị thiếu file `.csproj`, ta có thể tạo lại file `STMM.Tests.csproj` thủ công ở local với TargetFramework `net9.0`, reference các project Business, DataAccess và cài đặt các package phụ thuộc để chạy `dotnet test` bình thường ở local.
  *Files liên quan*: [STMM.Tests.csproj](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.Tests/STMM.Tests.csproj)

## Patterns
- **Manual Mapping trong Service cho DTO phức tạp** (2026-06-04):
  Tránh sử dụng AutoMapper cho các DTO tổng hợp dữ liệu từ nhiều bảng (như kết hợp `TaskMaterial` với `RepairPrice` để lấy tên vật tư). Việc thực hiện mapping thủ công (manual projection) trong Service giúp tối ưu số câu truy vấn DB (tránh N+1 query), kiểm soát tốt kiểu dữ liệu và tăng tính dễ hiểu khi viết unit test.
  *Files liên quan*: [QuotationService.cs](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/STMM.Business/Services/QuotationService.cs)

- **Thiết kế ẩn hiển thị theo ngữ cảnh (Context-aware Panel Visibility)** (2026-06-19):
  Để tránh thừa thông tin và tối ưu UI, trang chi tiết tác vụ của Manager chỉ render các panel kỹ thuật như bảng vật tư (`REQUIRED MATERIALS & QUOTATION`) và ảnh nghiệm thu (`EVIDENCE CAPTURES`) khi `task.taskType === 'Repair' || task.taskType === 'Maintenance'`. Với tác vụ đo điện nước (`UtilityReading`), các panel này sẽ được ẩn hoàn toàn.
  *Files liên quan*: [TaskDetailManager.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/TaskDetailManager.jsx)

- **Tích hợp note hoàn thành vào timeline lịch sử (Timeline Completion Note Integration)** (2026-06-19):
  Tích hợp hiển thị ghi chú hoàn thành của nhân viên (`task.completionNotes`) ngay trên timeline lịch sử của Manager khi tác vụ ở trạng thái `Completed`, đồng thời động hóa tiêu đề sự kiện hoàn thành (ví dụ: đổi thành `"Meter Readings Completed"` khi là task `UtilityReading`) để hỗ trợ Manager đối soát thông tin dễ dàng hơn.
  *Files liên quan*: [TaskDetailManager.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/TaskDetailManager.jsx)

- **Tối giản hóa Action trên Danh sách (Minimalist List Actions Pattern)** (2026-06-19):
  Loại bỏ các nút thao tác nhanh (Đổi nhân viên, Cập nhật trạng thái) khỏi cột Actions trên bảng danh sách Task của Manager (`TaskListManager.jsx`), chỉ giữ lại nút `View Details`. Điều này buộc Manager phải vào trang chi tiết trước khi thực hiện hành động, giúp đảm bảo tính an toàn nghiệp vụ, tránh nhầm lẫn và làm sạch code (gỡ bỏ import modal và state dư thừa).
  *Files liên quan*: [TaskListManager.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/TaskListManager.jsx)

- **Đồng nhất định dạng tiền tệ hệ thống (System-wide Currency Formatting consistency)** (2026-06-19):
  Đảm bảo tất cả các màn hình hiển thị số tiền đều sử dụng định dạng `VNĐ` thống nhất thay vì USD (`$`). Định dạng khuyến nghị độc lập với trình duyệt: `new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'`.
  *Files liên quan*: [TaskDetailManager.jsx](file:///d:/Code/Full_Project/SU26_Do_An_Tot_Nghiep/stmm-client/src/pages/FE_Manager/TaskDetailManager.jsx)
