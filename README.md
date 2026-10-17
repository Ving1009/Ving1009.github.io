# V HUB Cinema

Website phim tĩnh tối ưu cho trình duyệt Smart TV, máy tính và điện thoại.

## Điều khiển Smart TV
- ↑ ↓ ← →: di chuyển focus. OK/Enter: chọn. Back/Escape: quay lại.
- Trong trình phát: N tập tiếp, P tập trước, F toàn màn hình.
- Với video nhúng: nút "Điều khiển video" chuyển focus vào iframe. Khi đó phím Back phụ thuộc trình phát bên thứ ba.

## Hiệu năng và cấu trúc
- `movies.js`: dữ liệu phim, gom các seri thành `seasons[]`.
- `app.js`: điều hướng, xem phim, lịch sử, lọc, tìm kiếm và AI.
- `styles.css`: giao diện cơ bản; `tv.css`: giao diện Cinema tối ưu TV.
- `logo.svg`, `icon-192.svg`, `icon-512.svg`: nhận diện SVG nhẹ, không font ngoài.
- Ảnh poster tải lazy; HLS.js chỉ nạp khi thực sự phát .m3u8 và trình duyệt thiếu HLS gốc.
- Không dùng service worker caching để tránh nội dung cũ.

## Lưu ý
Lịch sử xem được lưu bằng localStorage trên từng thiết bị. Tự chuyển tập chỉ đáng tin cậy với video gốc gửi sự kiện kết thúc; iframe khác nguồn không có tín hiệu kết thúc chắc chắn. Tính năng phát phụ thuộc codec và nhà cung cấp video; chỉ dùng nguồn có quyền phân phối.