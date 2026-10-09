/**
 * @file rssScraper.js
 * @description Thu thập tin tức từ các luồng RSS báo chính thống (VnExpress, VTC News)
 * Tự động lọc chỉ lấy bài viết xuất bản trong vòng 48 giờ gần nhất.
 */

import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { RSS_SOURCES, TIME_WINDOW_48_HOURS_MS } from '../config/sources.js';

// Khởi tạo bộ đọc RSS với headers tùy biến tránh bị chặn
const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
  }
});

/**
 * Tạo mã hash MD5 duy nhất cho mỗi bài viết dựa trên URL hoặc tựa đề
 * @param {string} input - Chuỗi URL hoặc tiêu đề bài viết
 * @returns {string} Chuỗi hash ngắn gọn
 */
function generateId(input) {
  return crypto.createHash('md5').update(input || '').digest('hex').substring(0, 16);
}

/**
 * Làm sạch văn bản HTML, loại bỏ thẻ thừa và ký tự đặc biệt
 * @param {string} htmlText - Nội dung HTML thô
 * @returns {string} Văn bản thuần túy sạch sẽ
 */
function cleanText(htmlText) {
  if (!htmlText) return '';
  const $ = cheerio.load(htmlText);
  return $.text().replace(/\s+/g, ' ').trim();
}

/**
 * Trích xuất link ảnh đại diện từ chuỗi HTML (thẻ <img> hoặc thẻ enclosure)
 * @param {string} htmlContent - Nội dung HTML của thẻ tóm tắt
 * @param {Object} item - Đối tượng bài viết từ parser
 * @returns {string|null} Đường dẫn ảnh đại diện
 */
function extractThumbnail(htmlContent, item) {
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  if (!htmlContent) return null;
  const $ = cheerio.load(htmlContent);
  const src = $('img').first().attr('src');
  return src || null;
}

/**
 * Thu thập tin tức từ toàn bộ các nguồn RSS chính thống đã cấu hình
 * @returns {Promise<Array<Object>>} Danh sách bài viết trong vòng 48 giờ
 */
export async function fetchAllRssNews() {
  const articles = [];
  const now = Date.now();

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      if (!feed || !feed.items) continue;

      for (const item of feed.items) {
        const pubDate = new Date(item.pubDate || item.isoDate || now);
        const pubTime = pubDate.getTime();

        // Kiểm tra điều kiện mốc thời gian: Chỉ lấy tin trong vòng 48 giờ gần nhất
        if (now - pubTime > TIME_WINDOW_48_HOURS_MS) {
          continue; // Bỏ qua các tin tức cũ hơn 48 giờ
        }

        const rawSummary = item.contentSnippet || item.summary || item.content || '';
        const summary = cleanText(rawSummary);
        const title = cleanText(item.title);
        const link = item.link || item.guid || '';
        const thumbnail = extractThumbnail(item.content || item['content:encoded'] || '', item);

        if (!title || !link) continue;

        const articleId = generateId(link || title);

        articles.push({
          id: articleId,
          title: title,
          summary: summary,
          content: summary, // Bản tóm tắt đầy đủ phục vụ đọc audio
          url: link,
          thumbnail: thumbnail,
          source: source.name,
          sourceBrand: source.sourceBrand,
          category: source.category,
          publishedAt: pubDate.toISOString(),
          scrapedAt: new Date().toISOString(),
          isOfficial: true
        });
      }
    } catch (err) {
      console.warn(`[RSS Scraper Warning] Không thể tải nguồn ${source.name} (${source.url}): ${err.message}`);
    }
  }

  return articles;
}
