# 📘 GEMINI.md - HỒ SƠ & QUY TẮC PHÁT TRIỂN DỰ ÁN TIN_TUC_2026

> **LƯU Ý CỐT LÕI DÀNH CHO TẤT CẢ A.I (GEMINI, CLAUDE, GPT,...) VÀ DEVELOPER:**
> File này là "kim chỉ nam" trung tâm của toàn bộ dự án. Khi cài lại Windows, đổi máy hoặc có bất kỳ AI/DEV mới nào tiếp quản, **BẮT BUỘC PHẢI ĐỌC FILE NÀY ĐẦU TIÊN** để hiểu kiến trúc, trạng thái hiện tại, quy tắc nghiêm ngặt và các bước tiếp theo.
> 
> **QUY TẮC BẤT DI BẤT DỊCH TRƯỚC VÀ SAU MỖI LẦN CODE:**
> 1. **TRƯỚC KHI LÀM/SỬA:** Phải đọc file này, kiểm tra mục tiêu và cập nhật trạng thái chuẩn bị thực hiện.
> 2. **TRONG KHI LÀM:** Tuân thủ quy tắc Code Clean, không viết code thừa, luôn chú thích (comment) rõ ràng bằng tiếng Việt ở mọi hàm và logic cốt lõi.
> 3. **SAU KHI LÀM:** Cập nhật ngay vào mục **"Nhật ký Thay đổi & Lịch sử Phát triển"** ở cuối file này.

---

## 1. THÔNG TIN CHUNG DỰ ÁN

* **Tên dự án:** Cổng Tổng Hợp Tin Tức Thông Minh & Điểm Tin Audio 48H (TIN_TUC_2026)
* **Kho lưu trữ GitHub (Remote):** `https://github.com/adwewecat/TIN_TUC_2026.git`
* **Mục tiêu hệ thống:** 
  * Quét tin tức trong nước và mạng xã hội trong vòng 48h.
  * Phân loại theo chuyên mục: Thời sự - Chính trị, Khoa học - Công nghệ, Kinh tế & Giá vàng, Đời sống - Địa phương (TP.HCM, Hà Nội),...
  * AI Phân tích & Lọc trùng thông minh: Phát hiện tin trùng lặp để bỏ qua, nhưng **bắt buộc giữ lại các tin là diễn biến tiếp theo** của sự kiện cũ (Story Evolution Tracking).
  * Biên tập và đúc kết thành 1 kịch bản bản tin hoàn chỉnh.
  * Tích hợp bộ đọc Audio (Text-to-Speech) tự nhiên để nghe toàn bộ bản tin 1 lần.
  * Quản lý trạng thái theo User (user cache), lưu lịch sử mốc tin đã nghe/chưa nghe để không quét lại tin cũ trừ khi có diễn biến mới.
  * Sẵn sàng đưa lên VPS / Server Ubuntu / Docker sau này.

---

## 2. QUY TẮC BẮT BUỘC TRONG DỰ ÁN (PROJECT CODING RULES)

1. **Quy tắc Code Sạch (Clean Code):**
   * Tuyệt đối không để lại code dư thừa, file rác, biến không sử dụng (`unused variables/imports`).
   * Không hardcode cấu hình nhạy cảm. Dùng `.env` và config module.
2. **Quy tắc Chú thích (Code Annotation):**
   * Mọi hàm (function), lớp (class), route API, thuật toán lọc tin đều phải có JSDoc/Docstring tiếng Việt giải thích: Đầu vào (Input), Đầu ra (Output) và Mục đích logic.
   * Logic so khớp tin cũ - tin mới (Evolution Detection) phải được comment từng bước để dễ bảo trì.
3. **Quy tắc Giao diện & Trải nghiệm (UI/UX Premium):**
   * Thiết kế hiện đại, sang trọng (Glassmorphism, Dark Mode chuẩn tin tức hiện đại, font chữ tối ưu đọc tin như Inter/Outfit).
   * Trình phát Audio Player mượt mà, có sóng âm (Waveform/Visualizer), danh sách phát các mục tin, nút tua, dừng, điều chỉnh tốc độ đọc (0.8x, 1.0x, 1.25x, 1.5x).
4. **Quy tắc Đồng bộ & Quản lý Mã nguồn (Git):**
   * Commit thông điệp rõ ràng theo chuẩn Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).
   * Luôn cập nhật `GEMINI.md` và `README.md` đồng bộ với code thực tế.

---

## 3. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Dự án được xây dựng theo mô hình Full-stack hiện đại, độc lập và dễ triển khai:

```
TIN_TUC_2026/
├── server/
│   ├── config/             # Cấu hình nguồn tin, server port, hằng số 48h
│   ├── scrapers/           # Bộ cào tin: VnExpress (RSS + Fulltext), Fanpages/Trending
│   ├── analyzers/          # Bộ phân tích: Lọc 48h, Phân loại chuyên mục, Diễn biến mới
│   ├── services/           # Biên tập bản tin, TTS Audio Generator
│   ├── storage/            # Cơ sở dữ liệu SQLite / JSON Cache lưu bài viết & user history
│   └── routes/             # RESTful APIs cho Frontend
├── client/
│   ├── index.html          # Giao diện chính Responsive, chuẩn SEO
│   ├── css/                # Style Vanilla CSS cao cấp, Dark/Light mode, Glassmorphism
│   ├── js/                 # Quản lý State, Audio Player, Web Speech API & Kết nối API
│   └── assets/             # Biểu tượng, âm thanh, hình ảnh minh họa
├── GEMINI.md               # Sổ tay & Quy tắc phát triển (File này)
├── README.md               # Hướng dẫn cài đặt, sử dụng & Deploy server
├── .gitignore              # Bỏ qua node_modules, temp audio, env
└── package.json            # Quản lý dependencies & scripts chạy
```

---

## 4. LOGIC NGHIỆP VỤ CỐT LÕI

### 4.1. Thu thập dữ liệu trong 48h
* Lấy từ RSS chính thống (VnExpress Thời sự, Thế giới, Khoa học công nghệ, Kinh doanh,...) đảm bảo tốc độ cao, không bị chặn IP.
* Hỗ trợ cào bài viết chi tiết, trích xuất tóm tắt và mốc thời gian xuất bản (`publishedAt`).
* Bộ lọc thời gian: Bỏ qua tất cả các bài viết cũ hơn 48 giờ (`now - publishedAt > 48 * 3600 * 1000`).

### 4.2. Thuật toán Lọc trùng lặp & Giữ diễn biến tiếp theo (Evolution Tracking)
* **Trường hợp 1 (Trùng lặp 100% / Tương tự không đổi mới):** Nếu tin cùng thực thể (entity), cùng sự kiện và không có thông tin cập nhật mới -> Đánh dấu là trùng lặp, bỏ qua không đọc lại.
* **Trường hợp 2 (Diễn biến tiếp theo - BẮT BUỘC GIỮ):** 
  * Cùng chủ đề/thực thể/sự kiện chính (ví dụ: "vụ cháy xe máy tại TP.HCM").
  * Có từ khóa diễn biến mới: "đã tử vong", "kết quả điều tra", "bắt tạm giam", "cập nhật", "nạn nhân thứ hai", "khởi tố",... HOẶC thời gian cập nhật sau tin cũ hơn 1 giờ với nội dung bổ sung.
  * -> Gắn nhãn `[DIỄN BIẾN MỚI]`, liên kết với mốc sự kiện trước đó, và đưa vào bản tin tổng hợp.

### 4.3. Đúc kết bản tin & Bộ đọc Audio (Text-to-Speech)
* Biên tập nội dung theo kịch bản:
  1. Lời chào đầu & Tóm tắt tổng quan trong ngày.
  2. Tin Thời sự - Chính trị nổi bật.
  3. Tin Khoa học - Công nghệ.
  4. Tin Kinh tế, Thị trường & Giá vàng.
  5. Tin Đời sống, TP.HCM, Hà Nội & Mạng xã hội/Trending.
  6. Lời kết bản tin.
* Sử dụng Web Speech API tiếng Việt tự nhiên (hỗ trợ giọng Google tiếng Việt / Microsoft Nam/Nữ cực mượt trên mọi trình duyệt) + Có API xuất kịch bản audio để nghe liên tục.

### 4.4. Quản lý trạng thái theo User (User History & Cache)
* Mỗi User có mã định danh `userId` (lưu tại LocalStorage/Server).
* Lưu danh sách `readNewsIds`, `listenedAudioBatches`, `lastSyncTime`.
* Người dùng có thể đánh dấu đã nghe, nghe lại, hoặc reset lịch sử nếu muốn.

---

## 5. KẾ HOẠCH TRIỂN KHAI CHI TIẾT (ROADMAP)

- [x] **Bước 1:** Khảo sát môi trường, tạo file `GEMINI.md` và `README.md`.
- [x] **Bước 2:** Cài đặt Git và liên kết remote `https://github.com/adwewecat/TIN_TUC_2026.git`.
- [x] **Bước 3:** Khởi tạo project Backend (Node.js/Express) với kiến trúc Module sạch sẽ, cấu hình đầy đủ.
- [x] **Bước 4:** Xây dựng Module Scraper (Cào tin tức từ VnExpress, VTC News, Giá vàng SJC, Fanpage Tân Phú & Đô thị trong 48h).
- [x] **Bước 5:** Xây dựng Bộ phân tích AI / Logic phát hiện diễn biến tiếp theo (News Evolution & Deduplication Engine) hỗ trợ phân biệt chính xác tin trùng lặp vs diễn biến mới.
- [x] **Bước 6:** Xây dựng Bộ biên tập kịch bản tổng hợp & Hệ thống Database/Storage lưu lịch sử theo User (User Cache & Milestones).
- [x] **Bước 7:** Xây dựng Giao diện Frontend Web cao cấp (Glassmorphism, Dark Mode, Audio Studio Player có sóng âm Waveform, điều chỉnh tốc độ, nút mô phỏng tình huống diễn biến thực tế).
- [x] **Bước 8:** Test toàn diện luồng: Cào tin -> Phân tích diễn biến -> Tổng hợp -> Đọc Audio -> Đánh dấu lịch sử (Tất cả test pass 100%).
- [ ] **Bước 9:** Đẩy code lên GitHub repository `https://github.com/adwewecat/TIN_TUC_2026.git`.

---

## 6. NHẬT KÝ THAY ĐỔI & LỊCH SỬ PHÁT TRIỂN (CHANGELOG)

* **2026-10-10:**
  * Khởi tạo dự án `TIN_TUC_2026`.
  * Khởi tạo file `GEMINI.md` quy định tiêu chuẩn code, kiến trúc, quy tắc phát triển và thuật toán xử lý diễn biến tin tức.
  * Khởi tạo file `README.md` hướng dẫn sử dụng và triển khai.
  * Cài đặt Git v2.55 và liên kết Remote Repository: `https://github.com/adwewecat/TIN_TUC_2026.git`.
  * Xây dựng cấu trúc Backend chuẩn:
    - `server/config/sources.js`: Cấu hình danh mục và các nguồn tin RSS chính thống VnExpress, VTC News, fanpage Tôi là dân Tân Phú, mốc 48h.
    - `server/storage/database.js`: Quản lý lưu trữ CSDL JSON bền vững cho bài viết và lịch sử nghe theo từng User.
    - `server/scrapers/rssScraper.js`: Thu thập tin tức thời gian thực từ VnExpress và VTC News với bộ lọc mốc 48 giờ.
    - `server/scrapers/goldScraper.js`: Cập nhật giá vàng miếng SJC và vàng nhẫn 9999 liên tục cho chuyên mục Kinh tế.
    - `server/scrapers/fanpageScraper.js`: Thu thập tin tức từ các kênh cộng đồng đô thị Tân Phú, TP.HCM và Hà Nội.
    - `server/analyzers/evolutionDetector.js`: Thuật toán AI phân tích tương đồng ngữ nghĩa kết hợp bộ từ khóa biến động để nhận diện chính xác "Diễn biến tiếp theo" (giữ lại và gắn ngữ cảnh) so với "Trùng lặp" (loại bỏ).
    - `server/services/briefingService.js`: Đúc kết toàn bộ tin tức thành 1 kịch bản phát thanh liền mạch chia theo 5 nhóm chuyên mục.
    - `server/routes/newsRoutes.js` & `server/routes/userRoutes.js`: Cung cấp RESTful API đầy đủ.
  * Xây dựng Giao diện Frontend:
    - `client/index.html`: Giao diện chuẩn SEO, thiết kế Studio Audio hiện đại.
    - `client/css/style.css`: Phong cách Glassmorphism, hiệu ứng sóng âm, tối ưu cho máy tính và di động.
    - `client/js/player.js`: Trình phát Web Speech API tiếng Việt tự nhiên, chia nhỏ câu tránh ngắt quãng, điều chỉnh tốc độ 0.8x - 2.0x.
    - `client/js/history.js`: Quản lý User ID, cache bài viết đã nghe và lưu mốc hoàn thành.
    - `client/js/app.js`: Tương tác giao diện, chuyển tab chuyên mục, kích hoạt cào tin và thử nghiệm tình huống.
  * Viết bộ kiểm thử tự động `server/test.js` kiểm tra độ chính xác của bộ phát hiện diễn biến vụ cháy xe máy tại TP.HCM (kết quả đạt 100%).
  * Đã kích hoạt máy chủ chạy trên cổng `http://localhost:3000`.

