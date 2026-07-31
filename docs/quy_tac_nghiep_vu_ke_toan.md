# Quy Tắc Nghiệp Vụ Kế Toán - Smart Market

Tài liệu này xác định các quy tắc chuẩn về trạng thái và luồng dữ liệu cho phân hệ Kế toán của hệ thống Smart Market.

## 1. Sơ Đồ Trạng Thái Hóa Đơn (Invoice)

Các hóa đơn trong hệ thống có vòng đời trạng thái như sau:

- `Draft`: Hóa đơn nháp, chưa thông báo cho tiểu thương, có thể sửa đổi tự do.
- `Unpaid`: Hóa đơn đã phát hành/đến hạn, tiểu thương có thể nhìn thấy, đang chờ thanh toán.
- `Pending Confirmation`: Đã nhận được thanh toán (bằng tiền mặt qua Staff hoặc qua MoMo) nhưng chưa được Kế toán duyệt (đối với tiền mặt).
- `Paid`: Kế toán đã duyệt hoặc hệ thống đối soát (Momo) thành công. Hóa đơn đã hoàn thành.
- `Canceled`: Hóa đơn bị hủy (chỉ áp dụng từ trạng thái `Draft` hoặc `Unpaid`). Không thể hủy hóa đơn đã có giao dịch chờ xử lý hoặc đã thanh toán.
- `Adjusted`: Trạng thái dùng cho hóa đơn cũ khi xuất hóa đơn điều chỉnh thay thế (thông qua `AdjustedFromId`).

**Quy tắc:**
- Không sửa trực tiếp hóa đơn đã `Paid`. Phải tạo hóa đơn điều chỉnh (Adjustment / Credit Note).
- Hóa đơn phạt chỉ được tạo khi vi phạm đã ở trạng thái quyết định cuối cùng.

## 2. Sơ Đồ Trạng Thái Giao Dịch (Payment)

- `Pending`: Giao dịch vừa được khởi tạo (Momo IPN chưa về hoặc Staff vừa thu tiền mặt).
- `Verified`: Kế toán đã kiểm tra và duyệt khoản tiền mặt, hoặc IPN Momo báo thành công.
- `Rejected`: Kế toán từ chối khoản thanh toán tiền mặt (do sai lệch/giả mạo). Ghi nhận lý do và thời gian từ chức. KHÔNG XÓA record thanh toán.
- `Refunded`: Giao dịch hoàn tiền cho một payment đã thanh toán thành công trước đó (dùng cho khiếu nại).

## 3. Khiếu Nại & Hoàn Tiền (Dispute & Refund)

- Khiếu nại (Request Type: `InvoiceDispute`): `Pending` -> `Approved` | `Rejected`.
- Chỉ xử lý khiếu nại 1 lần cho mỗi Request.
- Hoàn tiền phải được ghi nhận thành một bản ghi Payment riêng biệt, liên kết đến Payment gốc thông qua `OriginalPaymentId`, với số tiền âm hoặc dương tùy thiết kế, trạng thái là `Refunded`.

## 4. Vi Phạm (Violation)

Vòng đời vi phạm:
- `Pending`: Staff tạo vi phạm, chờ duyệt.
- `Notified`: Đã gửi thông báo cho tiểu thương, có thời gian để khiếu nại.
- `Appealed`: Tiểu thương khiếu nại, chờ quản lý xem xét.
- `FinalApproved`: Quyết định cuối cùng (giữ nguyên hoặc thay đổi mức phạt).
- `Invoiced`: Kế toán đã xuất hóa đơn phạt cho vi phạm này.
- `Paid`: Hóa đơn phạt đã được thanh toán xong.

## 5. Cô Lập Dữ Liệu Chợ (Market Isolation)

- Kế toán (`Role = Accountant`) CHỈ được phép thao tác trên các bản ghi (Invoice, Payment, FeeType, RepairPrice, Violation, v.v.) thuộc chợ mà họ được phân công (`MarketId`).
- Tất cả truy vấn, cập nhật, xóa phải kiểm tra `MarketId`.
- Quản trị viên (`Role = Admin` hoặc `SystemAdmin`) nếu không bị gán cố định một chợ (MarketId = null) thì có quyền xem/thao tác trên toàn hệ thống.
