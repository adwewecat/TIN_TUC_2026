/**
 * @file briefingService.js
 * @description Biên tập và đúc kết toàn bộ tin tức 48h thành 1 bản tin hoàn chỉnh
 * Phân chia theo các phần: Thời sự, Công nghệ, Kinh tế & Giá vàng, Đời sống - Đô thị, Thế giới.
 * Chuẩn bị kịch bản phát thanh Audio liền mạch cho người dùng nghe 1 lần.
 */

import { CATEGORIES } from '../config/sources.js';

/**
 * Tạo kịch bản văn bản hoàn chỉnh cho một bản tin phát thanh tổng hợp
 * @param {Array<Object>} articles - Danh sách các bài viết đã qua bộ lọc 48h và lọc diễn biến
 * @returns {Object} Kịch bản bản tin chi tiết kèm các phần phân đoạn
 */
export function generateDailyBriefing(articles = []) {
  const now = new Date();
  const timeString = `${now.getHours()} giờ ${now.getMinutes() > 9 ? now.getMinutes() : '0' + now.getMinutes()} phút, ngày ${now.getDate()} tháng ${now.getMonth() + 1}`;

  // Phân nhóm tin tức theo các chuyên mục chính
  const grouped = {
    [CATEGORIES.THOI_SU.id]: [],
    [CATEGORIES.CONG_NGHE.id]: [],
    [CATEGORIES.GIA_VANG_KINH_TE.id]: [],
    [CATEGORIES.DOI_SONG_LOCAL.id]: [],
    [CATEGORIES.THE_GIOI.id]: []
  };

  articles.forEach(article => {
    const cat = article.category || CATEGORIES.THOI_SU.id;
    if (grouped[cat]) {
      grouped[cat].push(article);
    } else {
      grouped[CATEGORIES.THOI_SU.id].push(article);
    }
  });

  const evolutionCount = articles.filter(a => a.isEvolution).length;
  const newCount = articles.length - evolutionCount;

  // 1. Lời mở đầu bản tin
  let openingScript = `Kính chào quý thính giả. Đây là bản tin tổng hợp thông minh 48 giờ phát lúc ${timeString}. Hôm nay, hệ thống đã đúc kết và tổng hợp được ${articles.length} tin tức quan trọng`;
  if (evolutionCount > 0) {
    openingScript += `, trong đó có ${evolutionCount} tin là diễn biến cập nhật mới của các vụ việc mà quý vị đã theo dõi trước đó.`;
  } else {
    openingScript += `. Sau đây là nội dung chi tiết.`;
  }

  const sections = [];
  let scriptParts = [openingScript];

  // Danh mục thứ tự các phần
  const categoryConfigs = [
    { id: CATEGORIES.THOI_SU.id, title: 'Thời sự và Chính trị', icon: '🏛️' },
    { id: CATEGORIES.CONG_NGHE.id, title: 'Khoa học và Công nghệ', icon: '💻' },
    { id: CATEGORIES.GIA_VANG_KINH_TE.id, title: 'Kinh tế, Thị trường và Giá vàng', icon: '💰' },
    { id: CATEGORIES.DOI_SONG_LOCAL.id, title: 'Đời sống, Đô thị TP.HCM và Hà Nội', icon: '🏙️' },
    { id: CATEGORIES.THE_GIOI.id, title: 'Tin tức Thế giới nổi bật', icon: '🌍' }
  ];

  categoryConfigs.forEach(cfg => {
    const items = grouped[cfg.id];
    if (items && items.length > 0) {
      let sectionScript = `Chuyển sang phần ${cfg.title}. `;

      items.forEach((item, idx) => {
        if (item.isEvolution) {
          // Lời dẫn radio đặc biệt cho tin tức là diễn biến tiếp theo
          sectionScript += `Về diễn biến tiếp theo của sự việc "${item.originalStoryTitle}": ${item.summary} `;
        } else {
          sectionScript += `Tin thứ ${idx + 1}: ${item.title}. ${item.summary} `;
        }
      });

      sections.push({
        id: cfg.id,
        title: cfg.title,
        icon: cfg.icon,
        itemsCount: items.length,
        items: items,
        script: sectionScript
      });

      scriptParts.push(sectionScript);
    }
  });

  // 2. Lời kết bản tin
  const closingScript = `Bản tin tổng hợp 48 giờ xin phép được khép lại tại đây. Toàn bộ các mốc tin tức vừa phát đã được lưu lại để tránh đọc lặp trong lần quét tiếp theo. Chúc quý vị một ngày làm việc tràn đầy năng lượng và hiệu quả.`;
  scriptParts.push(closingScript);

  const fullScript = scriptParts.join('\n\n');

  return {
    id: `briefing_${now.getTime()}`,
    createdAt: now.toISOString(),
    displayTime: timeString,
    totalArticles: articles.length,
    newArticlesCount: newCount,
    evolutionArticlesCount: evolutionCount,
    openingScript,
    closingScript,
    sections,
    fullScript,
    articleIds: articles.map(a => a.id)
  };
}
