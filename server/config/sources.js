/**
 * @file sources.js
 * @description Cấu hình danh mục nguồn tin tức, các luồng RSS chính thống, mạng xã hội và thời gian lọc 48h.
 */

// Hằng số thời gian giới hạn thu thập tin tức: 48 giờ tính bằng mili-giây
export const TIME_WINDOW_48_HOURS_MS = 48 * 60 * 60 * 1000;

// Danh mục chuyên mục tin tức tiêu chuẩn của hệ thống
export const CATEGORIES = {
  THOI_SU: {
    id: 'thoi_su',
    name: 'Thời sự - Chính trị',
    order: 1,
    icon: '🏛️'
  },
  CONG_NGHE: {
    id: 'cong_nghe',
    name: 'Khoa học - Công nghệ',
    order: 2,
    icon: '💻'
  },
  GIA_VANG_KINH_TE: {
    id: 'gia_vang_kinh_te',
    name: 'Kinh tế & Giá vàng',
    order: 3,
    icon: '💰'
  },
  DOI_SONG_LOCAL: {
    id: 'doi_song_local',
    name: 'Đời sống, TP.HCM & Hà Nội',
    order: 4,
    icon: '🏙️'
  },
  THE_GIOI: {
    id: 'the_gioi',
    name: 'Thế giới nổi bật',
    order: 5,
    icon: '🌍'
  }
};

// Danh sách các nguồn tin RSS chính thống có độ ổn định và uy tín cao
export const RSS_SOURCES = [
  // Nguồn VnExpress (Báo chính thống lớn nhất Việt Nam)
  {
    name: 'VnExpress Thời sự',
    url: 'https://vnexpress.net/rss/thoi-su.rss',
    category: CATEGORIES.THOI_SU.id,
    type: 'official',
    sourceBrand: 'VnExpress'
  },
  {
    name: 'VnExpress Khoa học Công nghệ',
    url: 'https://vnexpress.net/rss/khoa-hoc.rss',
    category: CATEGORIES.CONG_NGHE.id,
    type: 'official',
    sourceBrand: 'VnExpress'
  },
  {
    name: 'VnExpress Kinh doanh - Giá vàng',
    url: 'https://vnexpress.net/rss/kinh-doanh.rss',
    category: CATEGORIES.GIA_VANG_KINH_TE.id,
    type: 'official',
    sourceBrand: 'VnExpress'
  },
  {
    name: 'VnExpress Thế giới',
    url: 'https://vnexpress.net/rss/the-gioi.rss',
    category: CATEGORIES.THE_GIOI.id,
    type: 'official',
    sourceBrand: 'VnExpress'
  },
  {
    name: 'VnExpress Đời sống',
    url: 'https://vnexpress.net/rss/gia-dinh.rss',
    category: CATEGORIES.DOI_SONG_LOCAL.id,
    type: 'official',
    sourceBrand: 'VnExpress'
  },
  // Nguồn VTC News (Cơ quan báo chí chính thức quản lý fanpage VTC News)
  {
    name: 'VTC News Thời sự',
    url: 'https://vtcnews.vn/rss/thoi-su.rss',
    category: CATEGORIES.THOI_SU.id,
    type: 'official',
    sourceBrand: 'VTC News'
  }
];

// Danh sách cấu hình Fanpage / Mạng xã hội / Tin tức cộng đồng địa phương
export const SOCIAL_SOURCES = [
  {
    name: 'VTC News Fanpage',
    url: 'https://www.facebook.com/vtcnewsvn',
    location: 'Toàn quốc',
    category: CATEGORIES.THOI_SU.id,
    sourceBrand: 'Facebook / VTC News'
  },
  {
    name: 'Tôi là dân Tân Phú',
    url: 'https://www.facebook.com/tuiladantanphu',
    location: 'TP. Hồ Chí Minh / Tân Phú',
    category: CATEGORIES.DOI_SONG_LOCAL.id,
    sourceBrand: 'Facebook / Tân Phú'
  },
  {
    name: 'Tin tức TP. Hồ Chí Minh & Hà Nội 24h',
    url: 'https://www.facebook.com/tintuconline',
    location: 'TP.HCM - Hà Nội',
    category: CATEGORIES.DOI_SONG_LOCAL.id,
    sourceBrand: 'Cộng đồng Đô thị'
  }
];
