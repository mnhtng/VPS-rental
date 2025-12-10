# Bắt đầu thanh toán

- Khởi tạo đơn hàng (✔)
- Khởi tạo transaction (✔)

# Thanh toán xong

- Cập nhật transaction (✔)
- Cập nhật trạng thái order (✔)
- Cập nhật promotion cho user (nếu có dùng) (✔)
- Xóa cart (✔)
- Tạo VM
- Gửi mail

# Thanh toán thất bại

- Cập nhật transaction (✔)
- Cập nhật trạng thái order (✔)

# Sử dụng

User mở cart → fetchCart() bắt đầu
User chuyển sang tab khác nhanh → component unmount → controller.abort()
→ Pending request bị cancel ngay lập tức (không chờ 8 phút)
