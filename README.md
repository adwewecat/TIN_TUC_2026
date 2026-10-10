# 🎙️ TIN TỨC 2026 - CỔNG BẢN TIN THÔNG MINH & ĐIỂM TIN AUDIO 48H

Hệ thống thu thập, phân tích, đúc kết tin tức trong nước trong vòng 48h và phát bản tin Audio tự động với công nghệ phát hiện diễn biến sự kiện (Story Evolution Tracking).

[![Repository](https://img.shields.io/badge/GitHub-adwewecat%2FTIN__TUC__2026-blue.svg)](https://github.com/adwewecat/TIN_TUC_2026.git)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](#)

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

1. **Quét Tin Tức Tự Động Trong Vòng 48 Giờ:**
   * Thu thập dữ liệu từ các báo chính thống uy tín: **VnExpress** (Khoa học - Công nghệ, Thế giới, Thời sự, Kinh tế - Giá vàng,...).
   * Hỗ trợ tích hợp adapter thu thập tin nóng, fanpage địa phương (TP.HCM, Hà Nội, VTC News, Tôi là dân Tân Phú,...).
   * Bộ lọc thời gian nghiêm ngặt: Ưu tiên lọc tin tức xảy ra trong vòng 48 giờ gần nhất.

2. **Công Nghệ Lọc Trùng & Phát Hiện Diễn Biến Mới (Evolution Tracking):**
   * **Không trùng lặp:** Tự động phát hiện và bỏ qua tin cũ người dùng đã nghe.
   * **Giữ nguyên diễn biến tiếp theo:** Nếu là sự kiện cũ nhưng có thông tin/diễn biến mới phát sinh (ví dụ: *Vụ cháy xe máy ban đầu* ➡️ *Cập nhật tình trạng nạn nhân sau đó*), hệ thống sẽ nhận diện là "Diễn biến tiếp theo" và tiếp tục đưa vào bản tin thay vì loại bỏ.

3. **Biên Tập & Đúc Kết Thành 1 Bản Tin Liền Mạch:**
   * Gom nhóm theo các trụ cột chính: Thời sự - Chính trị, Khoa học - Công nghệ, Kinh tế & Giá vàng, Đời sống - Xã hội địa phương, Thế giới.
   * Tóm tắt súc tích, chuyên nghiệp như một bản tin phát thanh / thời sự buổi sáng.

4. **Trình Phát Audio / Podcast Thông Minh:**
   * Tính năng "Đọc audio cho tôi nghe 1 lần": Tự động phát toàn bộ kịch bản bản tin liền mạch.
   * Hỗ trợ giọng đọc tiếng Việt tự nhiên (Web Speech API và Server TTS).
   * Điều khiển trình phát tiện lợi: Tạm dừng, tiếp tục, tua tiến/lùi, chỉnh tốc độ đọc, hiển thị tiến trình từng phần tin.

5. **Lưu Lịch Sử & Quản Lý Cache Theo Người Dùng (User-based History):**
   * Quản lý trạng thái theo `userId`.
   * Ghi nhận các bài viết đã nghe, các đợt phát đã hoàn thành để làm mốc cho các lần quét tiếp theo.

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
TIN_TUC_2026/
├── server/
│   ├── config/             # Cấu hình nguồn tin, hằng số 48h, cổng mạng
│   ├── scrapers/           # Bộ thu thập tin tức (VnExpress, RSS, Fanpage feeds)
│   ├── analyzers/          # Bộ lọc 48h, Phân loại & Phát hiện diễn biến sự kiện
│   ├── services/           # Biên tập bản tin, Xử lý Text-to-Speech
│   ├── storage/            # Lưu trữ dữ liệu lịch sử và cache theo user
│   ├── routes/             # API cung cấp dữ liệu cho giao diện
│   └── index.js            # Khởi chạy Express Server
├── client/
│   ├── index.html          # Giao diện người dùng chuẩn SEO, trực quan
│   ├── css/
│   │   └── style.css       # CSS phong cách hiện đại, Dark/Light Mode, Glassmorphism
│   ├── js/
│   │   ├── app.js          # Logic giao diện & gọi API
│   │   ├── player.js       # Bộ phát Audio & Voice Synthesis
│   │   └── history.js      # Quản lý User Cache và Lịch sử nghe
├── GEMINI.md               # ⚠️ QUY TẮC CỐT LÕI & NHẬT KÝ PHÁT TRIỂN
├── README.md               # Hướng dẫn dự án (File này)
├── package.json            # Cấu hình gói và thư viện
└── .gitignore              # Danh sách loại trừ khi đẩy lên Git
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu cầu tiên quyết
* Node.js v18 trở lên.
* Trình duyệt hiện đại (Chrome, Edge, Firefox, Safari).

### Cách 1: Khởi động nhanh 1-Click trên Windows (Tiện nhất)
* Nhấp đúp chuột (Double click) vào file **`CHAY_WEB.bat`** trong thư mục dự án.
* Hệ thống sẽ tự động kiểm tra thư viện, mở ngay trình duyệt tại **`http://localhost:3000`** và bật máy chủ.

### Cách 2: Khởi động qua dòng lệnh (CLI):
```bash
# 1. Di chuyển vào thư mục dự án
cd e:/LAPTRINH/tintuc_2

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Khởi động server
npm start
```

Sau khi khởi động, truy cập trình duyệt tại địa chỉ:
👉 **`http://localhost:3000`**


---

## 🌐 HƯỚNG DẪN TRIỂN KHAI LÊN SERVER (VPS / UBUNTU / DOCKER)

1. **Triển khai với PM2:**
```bash
npm install -g pm2
pm2 start server/index.js --name "tintuc-2026"
pm2 save
pm2 startup
```

2. **Cấu hình Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📌 QUY TẮC QUAN TRỌNG KHI PHÁT TRIỂN

* **File `GEMINI.md`:** Là tài liệu bắt buộc phải kiểm tra và cập nhật trước và sau mỗi lần thay đổi mã nguồn.
* **Code Clean:** Toàn bộ code phải được dọn dẹp sạch sẽ, không có code thừa, có chú thích tiếng Việt rõ ràng cho từng chức năng.
* **Remote Git:** https://github.com/adwewecat/TIN_TUC_2026.git
