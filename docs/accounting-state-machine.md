# Quy tắc trạng thái phân hệ kế toán

Tài liệu này là nguồn tham chiếu cho API, giao diện và kiểm thử. Mọi chuyển trạng
thái phải được thực hiện trong một transaction và ghi audit log.

## Hóa đơn

`Draft -> Unpaid -> Pending Confirmation -> Paid`.

- Chỉ `Draft` được phát hành sang `Unpaid`.
- Chỉ `Unpaid` được nhân viên ghi nhận thu tiền mặt.
- Chỉ `Pending Confirmation` được kế toán duyệt hoặc từ chối.
- Khi từ chối, hóa đơn quay lại `Unpaid` và payment được giữ với trạng thái
  `Rejected`.
- Chỉ `Draft` hoặc `Unpaid` không có payment chờ xử lý mới được hủy (`Canceled`).
- Hóa đơn `Paid` không được sửa hoặc hủy trực tiếp; thay đổi phải được thực hiện
  bằng hóa đơn điều chỉnh/ghi giảm ở giai đoạn tiếp theo.

## Thanh toán

`Pending -> Verified | Rejected`; hoàn tiền được ghi là payment mới có
`Status = Refunded` và `Amount < 0`.

Doanh thu chỉ bao gồm `Verified` và `Refunded`, không bao gồm payment chờ duyệt
hoặc bị từ chối.

## Khiếu nại và vi phạm

- Chỉ `InvoiceDispute` có trạng thái `Pending` mới được giải quyết.
- Tiền hoàn phải dương và không vượt quá giá trị đã thanh toán ròng của hóa đơn.
- Hóa đơn phạt chỉ được lập sau khi vi phạm đã có quyết định cuối cùng. Mỗi vi
  phạm chỉ có một hóa đơn phạt đang hiệu lực.
