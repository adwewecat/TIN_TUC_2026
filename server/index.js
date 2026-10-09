/**
 * @file index.js
 * @description Máy chủ chính của ứng dụng Cổng Tin Tức Thông Minh & Điểm Tin Audio 48H
 * Phục vụ API backend và máy chủ tệp tĩnh cho giao diện người dùng.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import newsRoutes from './routes/newsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { getAllNews, saveNews } from './storage/database.js';
import { fetchAllRssNews } from './scrapers/rssScraper.js';
import { fetchLiveGoldPriceNews } from './scrapers/goldScraper.js';
import { fetchSocialAndLocalNews } from './scrapers/fanpageScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ giao diện tĩnh từ thư mục client
const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));

// Định tuyến API
app.use('/api/news', newsRoutes);
app.use('/api/user', userRoutes);

// Định tuyến trang chủ giao diện người dùng
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Khởi chạy máy chủ
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 MÁY CHỦ BẢN TIN TIN_TUC_2026 ĐÃ KHỞI CHẠY THÀNH CÔNG!`);
  console.log(`👉 Truy cập giao diện tại: http://localhost:${PORT}`);
  console.log(`=======================================================`);

  // Tự động kiểm tra và quét dữ liệu ban đầu nếu CSDL đang trống
  try {
    const existing = getAllNews();
    if (existing.length === 0) {
      console.log(`[Auto Startup] CSDL đang trống, tiến hành quét tin tức 48h ban đầu...`);
      const [rss, gold, social] = await Promise.all([
        fetchAllRssNews(),
        fetchLiveGoldPriceNews(),
        fetchSocialAndLocalNews()
      ]);
      const initialBatch = [...rss, gold, ...social];
      saveNews(initialBatch);
      console.log(`[Auto Startup] Đã nạp thành công ${initialBatch.length} tin tức 48h vào hệ thống.`);
    } else {
      console.log(`[Auto Startup] CSDL hiện có ${existing.length} bài viết.`);
    }
  } catch (err) {
    console.warn(`[Auto Startup Warning] Khởi tạo dữ liệu nền gặp lỗi:`, err.message);
  }
});
