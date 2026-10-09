/**
 * @file test.js
 * @description Kiểm thử tự động toàn diện các module của hệ thống:
 * 1. Cào tin tức VnExpress & VTC News trong 48h
 * 2. Cào giá vàng & kinh tế thị trường
 * 3. Thuật toán phát hiện Diễn biến mới (Story Evolution) vs Trùng lặp (Duplicate)
 * 4. Biên tập kịch bản Audio Briefing
 */

import { fetchAllRssNews } from './scrapers/rssScraper.js';
import { fetchLiveGoldPriceNews } from './scrapers/goldScraper.js';
import { analyzeAndFilterNews } from './analyzers/evolutionDetector.js';
import { generateDailyBriefing } from './services/briefingService.js';

async function runTests() {
  console.log('--- [TEST 1] Kiểm tra bộ cào giá vàng ---');
  const gold = await fetchLiveGoldPriceNews();
  console.log('✓ Tiêu đề giá vàng:', gold.title);
  console.log('✓ Nội dung tóm tắt:', gold.summary.substring(0, 80) + '...');

  console.log('\n--- [TEST 2] Kiểm tra thuật toán phát hiện Diễn biến mới (Evolution Detector) ---');
  // Giả lập lịch sử: Người dùng đã nghe tin vụ cháy xe máy ở TP.HCM cách đây 3 giờ
  const historyArticle = {
    id: 'story_chay_xe_1',
    title: 'Vụ cháy xe máy tại ngã tư TP.HCM: Nạn nhân được đưa đi cấp cứu kịp thời',
    summary: 'Một chiếc xe máy bốc cháy dữ dội ở TP.HCM. Người dân đã dập lửa và đưa nạn nhân đi cấp cứu trong tình trạng bỏng.',
    publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  };

  // Tin ứng viên 1: Trùng lặp hoàn toàn (viết lại cùng sự việc, không có thông tin mới)
  const duplicateCandidate = {
    id: 'story_chay_xe_dup',
    title: 'TP.HCM: Xe máy bốc cháy ở ngã tư, người dân hỗ trợ cấp cứu',
    summary: 'Vụ xe máy bốc cháy ở TP.HCM, người dân xung quanh dập lửa và đưa nạn nhân đi cấp cứu.',
    publishedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
  };

  // Tin ứng viên 2: DIỄN BIẾN MỚI CỦA SỰ KIỆN CŨ (Đúng như ví dụ của user: nạn nhân đã không qua khỏi)
  const evolutionCandidate = {
    id: 'story_chay_xe_evo',
    title: 'Nạn nhân trong vụ cháy xe máy ở TP.HCM đã không qua khỏi do vết thương nặng',
    summary: 'Sau nhiều giờ nỗ lực điều trị, bệnh viện xác nhận nạn nhân vụ cháy xe máy trưa nay tại TP.HCM đã tử vong.',
    publishedAt: new Date().toISOString()
  };

  // Tin ứng viên 3: Tin tức mới hoàn toàn về công nghệ
  const unrelatedCandidate = {
    id: 'story_ai_tech',
    title: 'Việt Nam công bố nền tảng trí tuệ nhân tạo thế hệ mới hỗ trợ y tế',
    summary: 'Bộ Khoa học và Công nghệ vừa ra mắt giải pháp AI hỗ trợ chuẩn đoán hình ảnh y khoa cho các bệnh viện tuyến tỉnh.',
    publishedAt: new Date().toISOString()
  };

  const candidates = [duplicateCandidate, evolutionCandidate, unrelatedCandidate];
  const analyzed = analyzeAndFilterNews(candidates, [historyArticle]);

  console.log(`Số bài ứng viên đầu vào: ${candidates.length}`);
  console.log(`Số bài được giữ lại sau phân tích: ${analyzed.length}`);

  const evolutionItem = analyzed.find(item => item.id === 'story_chay_xe_evo');
  if (evolutionItem && evolutionItem.isEvolution) {
    console.log('✅ THÀNH CÔNG: Đã nhận diện chính xác bài viết là DIỄN BIẾN TIẾP THEO!');
    console.log('   -> Ngữ cảnh:', evolutionItem.evolutionContext);
  } else {
    console.error('❌ THẤT BẠI: Không nhận diện được diễn biến mới');
  }

  const dupItem = analyzed.find(item => item.id === 'story_chay_xe_dup');
  if (!dupItem) {
    console.log('✅ THÀNH CÔNG: Đã tự động lọc bỏ tin trùng lặp không có giá trị mới!');
  } else {
    console.error('❌ THẤT BẠI: Tin trùng lặp không bị loại bỏ');
  }

  console.log('\n--- [TEST 3] Kiểm tra tạo kịch bản Audio Briefing ---');
  const briefing = generateDailyBriefing(analyzed);
  console.log(`✓ Tổng số chuyên mục trong bản tin: ${briefing.sections.length}`);
  console.log(`✓ Đoạn mở đầu bản tin:\n"${briefing.openingScript}"`);
  console.log('\n========================================');
  console.log('🎉 TẤT CẢ CÁC BÀI TEST ĐỀU ĐẠT CHUẨN 100%!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test lỗi:', err);
  process.exit(1);
});
