# Kế hoạch đồng bộ nhánh ngày 2026-08-04

## Phạm vi đã xác nhận

- Nhánh làm việc và nhánh đích: `field_task_coordination_for_manager`.
- Nhánh cần lấy code mới: `origin/Merge_Code`.
- Toàn bộ thay đổi chưa commit trong worktree hiện tại được đưa vào một commit trước khi merge.
- Kết quả cuối cùng được push lên cả hai nhánh remote để hai nhánh trỏ tới cùng một merge commit.
- Không force-push và không viết lại lịch sử đã chia sẻ.
- Giữ chức năng của cả hai bên khi giải quyết xung đột; xác minh bằng build/test phù hợp trước khi đồng bộ nhánh thứ hai.

## Giả định và yêu cầu phi chức năng

- Bảo toàn dữ liệu và khả năng khôi phục quan trọng hơn lịch sử tuyến tính.
- Không loại bỏ thay đổi cục bộ nếu chưa có bằng chứng rõ ràng rằng thay đổi đó sai.
- Việc đồng bộ được thực hiện tuần tự để tránh hai remote branch lệch nhau trong lúc kiểm tra.
- Thông tin nhạy cảm không được bổ sung vào commit; các file đã được theo dõi sẽ được kiểm tra trước khi commit.
- Sau khi hoàn tất, worktree phải sạch và hai nhánh remote phải có cùng mã commit.

## Phương án đã chọn

1. Commit toàn bộ thay đổi hiện tại trên `field_task_coordination_for_manager`.
2. Push commit này lên `origin/field_task_coordination_for_manager` làm điểm khôi phục.
3. Merge `origin/Merge_Code` vào nhánh hiện tại.
4. Giải quyết xung đột theo ngữ nghĩa, loại bỏ toàn bộ conflict marker và chạy kiểm tra.
5. Push merge commit lên `origin/field_task_coordination_for_manager`.
6. Cập nhật `Merge_Code` theo kiểu fast-forward đến cùng commit và push.
7. Fetch lại, xác minh hai remote branch cùng commit và worktree sạch.

## Rủi ro và cách kiểm soát

- **Thay đổi cục bộ chưa được lưu:** commit và push trước khi merge.
- **Xung đột được giải quyết sai ngữ nghĩa:** đọc cả hai phiên bản, kiểm tra luồng liên quan và chạy build/test.
- **Remote thay đổi trong lúc thao tác:** fetch và kiểm tra lại trước mỗi lần push quan trọng; không force-push.
- **Hai nhánh chỉ đồng bộ một chiều:** xác minh mã commit remote sau lần push cuối.

## Nhật ký quyết định

- Chọn merge commit thay cho rebase để không viết lại lịch sử dùng chung.
- Chọn làm trực tiếp trên nhánh chức năng thay cho nhánh tích hợp tạm vì đã có bước push điểm khôi phục trước merge.
- Chỉ cập nhật `Merge_Code` sau khi kết quả hợp nhất vượt qua kiểm tra, để tránh phát tán trạng thái chưa xác minh.
