/**
 * @file newsRoutes.js
 * @description Các API RESTful phục vụ thu thập tin tức, phát hiện diễn biến mới và xuất bản tin Audio
 */

import express from 'express';
import { fetchAllRssNews } from '../scrapers/rssScraper.js';
import { fetchLiveGoldPriceNews } from '../scrapers/goldScraper.js';
import { fetchSocialAndLocalNews } from '../scrapers/fanpageScraper.js';
import { analyzeAndFilterNews } from '../analyzers/evolutionDetector.js';
import { generateDailyBriefing } from '../services/briefingService.js';
import { getAllNews, saveNews, getUserHistory } from '../storage/database.js';

const router = express.Router();

/**
 * GET /api/news
 * Lấy danh sách tin tức hiện có trong CSDL (lọc theo 48h)
 */
router.get('/', (req, res) => {
  try {
    const allNews = getAllNews();
    const userId = req.query.userId || 'default_user';
    const userHistory = getUserHistory(userId);
    const listenedSet = new Set(userHistory.listenedNewsIds || []);

    const enriched = allNews.map(item => ({
      ...item,
      isRead: listenedSet.has(item.id)
    }));

    res.json({
      success: true,
      total: enriched.length,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/news/crawl
 * Kích hoạt quá trình cào tin tức từ VnExpress, VTC News, Giá vàng và Fanpage trong 48h
 */
router.post('/crawl', async (req, res) => {
  try {
    const userId = req.body.userId || 'default_user';
    console.log(`[Crawl Engine] Bắt đầu cào dữ liệu cho user: ${userId}...`);

    // 1. Cào song song các nguồn dữ liệu chính
    const [rssArticles, goldArticle, socialArticles] = await Promise.all([
      fetchAllRssNews(),
      fetchLiveGoldPriceNews(),
      fetchSocialAndLocalNews()
    ]);

    const candidates = [...rssArticles, goldArticle, ...socialArticles];
    console.log(`[Crawl Engine] Đã thu thập ${candidates.length} bài viết thô.`);

    // 2. Lấy lịch sử các bài viết đã nghe của user để so sánh diễn biến
    const userHistory = getUserHistory(userId);
    const allStoredNews = getAllNews();
    const historyArticles = allStoredNews.filter(n => (userHistory.listenedNewsIds || []).includes(n.id));

    // 3. Chạy qua bộ phân tích AI để lọc trùng và tìm Diễn biến mới
    const filteredNews = analyzeAndFilterNews(candidates, historyArticles);

    // 4. Lưu dữ liệu vào CSDL bền vững
    saveNews(filteredNews);

    const evolutionCount = filteredNews.filter(n => n.isEvolution).length;
    const duplicateCount = candidates.length - filteredNews.length;

    res.json({
      success: true,
      message: 'Quét tin tức 48h hoàn tất',
      stats: {
        totalScraped: candidates.length,
        savedCount: filteredNews.length,
        evolutionCount: evolutionCount,
        duplicateCount: duplicateCount
      },
      data: filteredNews
    });
  } catch (err) {
    console.error('[Crawl Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/news/briefing
 * Tạo hoặc lấy bản tin tổng hợp Audio được đúc kết từ các tin 48h chưa nghe (hoặc có diễn biến mới)
 */
router.get('/briefing', (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const userHistory = getUserHistory(userId);
    const listenedSet = new Set(userHistory.listenedNewsIds || []);

    const allNews = getAllNews();

    // Lọc ra các bài chưa nghe HOẶC là bài có diễn biến mới
    let targetArticles = allNews.filter(article => {
      if (article.isEvolution) return true; // Luôn luôn phát diễn biến mới
      return !listenedSet.has(article.id);  // Chưa nghe thì phát
    });

    // Nếu người dùng đã nghe hết tất cả tin tức, lấy 10 tin mới nhất để người dùng vẫn có thể nghe lại
    if (targetArticles.length === 0 && allNews.length > 0) {
      targetArticles = allNews.slice(0, 8);
    }

    const briefing = generateDailyBriefing(targetArticles);

    res.json({
      success: true,
      briefing
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/news/mock-scenario
 * Endpoint kiểm thử trực tiếp kịch bản thực tế theo đúng ví dụ của người dùng:
 * "Nạn nhân trong vụ cháy xe máy ở TP.HCM..." -> Sau đó có tin: "Nạn nhân trong vụ cháy xe máy ở TP.HCM đã không qua khỏi"
 */
router.post('/mock-scenario', (req, res) => {
  try {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    // 1. Tạo tin gốc ban đầu cách đây 3 tiếng
    const originalStory = {
      id: 'demo_chay_xe_goc',
      title: 'TP.HCM: Nạn nhân trong vụ cháy xe máy tại ngã tư được đưa đi cấp cứu kịp thời',
      summary: 'Trưa nay, một vụ cháy xe máy bất ngờ xảy ra tại tuyến đường đông đúc ở TP.HCM. Lực lượng tại chỗ đã nhanh chóng dập tắt đám cháy và đưa nạn nhân vào bệnh viện cấp cứu.',
      content: 'Trưa nay, một vụ cháy xe máy bất ngờ xảy ra tại tuyến đường đông đúc ở TP.HCM. Lực lượng tại chỗ đã nhanh chóng dập tắt đám cháy và đưa nạn nhân vào bệnh viện cấp cứu.',
      url: 'https://vnexpress.net/thoi-su/vu-chay-xe-may-hcm',
      source: 'VnExpress Thời sự',
      sourceBrand: 'VnExpress',
      category: 'thoi_su',
      publishedAt: threeHoursAgo.toISOString(),
      scrapedAt: threeHoursAgo.toISOString()
    };

    // 2. Tạo tin diễn biến mới phát sinh cách đây 15 phút
    const evolutionStory = {
      id: 'demo_chay_xe_dien_bien',
      title: 'Diễn biến mới: Nạn nhân trong vụ cháy xe máy ở TP.HCM đã không qua khỏi do bỏng nặng',
      summary: 'Sau nhiều giờ nỗ lực điều trị, đại diện bệnh viện tại TP.HCM xác nhận nạn nhân trong vụ cháy xe máy trưa nay đã không qua khỏi do vết thương quá nặng. Công an đang tiếp tục điều tra nguyên nhân xe bốc cháy.',
      content: 'Sau nhiều giờ nỗ lực điều trị, đại diện bệnh viện tại TP.HCM xác nhận nạn nhân trong vụ cháy xe máy trưa nay đã không qua khỏi do vết thương quá nặng. Công an đang tiếp tục điều tra nguyên nhân xe bốc cháy.',
      url: 'https://vnexpress.net/thoi-su/nan-nhan-vu-chay-xe-may-hcm-qua-doi',
      source: 'VnExpress Thời sự',
      sourceBrand: 'VnExpress',
      category: 'thoi_su',
      publishedAt: now.toISOString(),
      scrapedAt: now.toISOString()
    };

    saveNews([originalStory, evolutionStory]);

    res.json({
      success: true,
      message: 'Đã nạp thành công kịch bản thử nghiệm diễn biến tin tức thực tế',
      originalStory,
      evolutionStory
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
