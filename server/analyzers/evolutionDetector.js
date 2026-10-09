/**
 * @file evolutionDetector.js
 * @description Bộ phân tích AI thông minh: Phân loại trùng lặp & Nhận diện DIỄN BIẾN TIẾP THEO của tin tức (Story Evolution Tracking).
 * 
 * NGUYÊN TẮC CỐT LÕI:
 * 1. Nếu tin cũ đã được người dùng nghe và không có thông tin gì mới -> Lọc bỏ để tránh trùng lặp.
 * 2. Nếu là sự kiện cũ nhưng có diễn biến tiếp theo (Ví dụ: "Vụ cháy xe máy" -> "Nạn nhân vụ cháy xe máy đã không qua khỏi")
 *    -> BẮT BUỘC GIỮ LẠI, đánh dấu là Diễn biến mới kèm ngữ cảnh vụ việc để đưa vào bản tin Audio.
 */

// Danh sách các từ khóa chỉ diễn biến mới, cập nhật tình tiết tiếp theo trong tiếng Việt
export const EVOLUTION_KEYWORDS = [
  // Hậu quả, tình trạng nạn nhân, sức khỏe
  'không qua khỏi',
  'đã tử vong',
  'tử vong',
  'qua đời',
  'nguy kịch',
  'bị thương nặng',
  'xuất viện',
  'hồi phục',
  'cứu sống',

  // Pháp luật, cơ quan chức năng, điều tra
  'kết quả điều tra',
  'khởi tố',
  'bắt tạm giam',
  'bị bắt',
  'lời khai',
  'nguyên nhân ban đầu',
  'kết luận',
  'truy tìm',
  'danh tính',
  'đã đầu thú',
  'phạt tiền',
  'tước bằng',

  // Cập nhật số liệu & biến động
  'tăng lên',
  'giảm xuống',
  'nạn nhân thứ',
  'cập nhật mới nhất',
  'diễn biến mới',
  'thông tin mới',
  'sau khi',
  'bước ngoặt',
  'chính thức lên tiếng'
];

/**
 * Chuẩn hóa văn bản tiếng Việt: Chữ thường, xóa ký tự đặc biệt, chuẩn hóa khoảng trắng
 * @param {string} text - Chuỗi văn bản
 * @returns {string} Chuỗi đã làm sạch
 */
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Trích xuất tập hợp từ đơn và cụm 2 từ (bigrams) có ý nghĩa
 * @param {string} text - Tiêu đề hoặc nội dung
 * @returns {Set<string>} Tập hợp từ khóa
 */
export function extractKeywords(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(w => w.length > 1);
  const wordSet = new Set(words);

  for (let i = 0; i < words.length - 1; i++) {
    wordSet.add(`${words[i]} ${words[i + 1]}`);
  }

  return wordSet;
}

/**
 * Tính hệ số tương đồng Dice và Overlap giữa hai tập từ khóa
 * @param {Set<string>} setA 
 * @param {Set<string>} setB 
 * @returns {number} Điểm tương đồng từ 0 đến 1
 */
export function calculateSimilarity(setA, setB) {
  if (!setA || !setB || setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  // Sử dụng Overlap Coefficient và Dice Coefficient kết hợp
  const minSize = Math.min(setA.size, setB.size);
  const overlapScore = minSize > 0 ? intersectionCount / minSize : 0;
  const diceScore = (2 * intersectionCount) / (setA.size + setB.size);

  return Math.max(overlapScore, diceScore);
}

/**
 * Kiểm tra xem bài viết mới có chứa các dấu hiệu của Diễn biến tiếp theo hay không
 * @param {string} newText - Nội dung bài viết mới
 * @param {string} oldText - Nội dung bài viết cũ đã đọc
 * @returns {{hasEvolution: boolean, keywordFound: string}} Kết quả nhận diện
 */
export function detectEvolutionIndicators(newText, oldText) {
  const lowerNew = (newText || '').toLowerCase();
  const lowerOld = (oldText || '').toLowerCase();

  for (const kw of EVOLUTION_KEYWORDS) {
    if (lowerNew.includes(kw) && !lowerOld.includes(kw)) {
      return { hasEvolution: true, keywordFound: kw };
    }
  }

  return { hasEvolution: false, keywordFound: '' };
}

/**
 * Phân tích danh sách tin tức mới so với lịch sử tin đã đọc của người dùng
 * Phân biệt chính xác giữa: Tin trùng lặp, Tin mới hoàn toàn, và DIỄN BIẾN MỚI của tin cũ.
 * 
 * @param {Array<Object>} candidateArticles - Danh sách bài viết mới cào về
 * @param {Array<Object>} historyArticles - Danh sách các bài viết người dùng đã nghe trước đó
 * @returns {Array<Object>} Danh sách bài viết đủ điều kiện đưa vào bản tin
 */
export function analyzeAndFilterNews(candidateArticles, historyArticles = []) {
  if (!historyArticles || historyArticles.length === 0) {
    return candidateArticles.map(article => ({
      ...article,
      isEvolution: false,
      evolutionStatus: 'NEW_STORY',
      evolutionContext: null
    }));
  }

  const result = [];

  for (const newArticle of candidateArticles) {
    const newTitleSet = extractKeywords(newArticle.title);
    const newFullSet = extractKeywords(`${newArticle.title} ${newArticle.summary}`);

    let highestSim = 0;
    let matchedOldArticle = null;

    // So sánh bài viết mới với từng bài viết đã lưu trong lịch sử
    for (const oldArticle of historyArticles) {
      const oldTitleSet = extractKeywords(oldArticle.title);
      const oldFullSet = extractKeywords(`${oldArticle.title} ${oldArticle.summary}`);

      // Tính tương đồng tiêu đề và toàn văn
      const titleSim = calculateSimilarity(newTitleSet, oldTitleSet);
      const fullSim = calculateSimilarity(newFullSet, oldFullSet);
      const combinedSim = Math.max(titleSim, fullSim);

      if (combinedSim > highestSim) {
        highestSim = combinedSim;
        matchedOldArticle = oldArticle;
      }
    }

    // NGƯỠNG PHÂN TÍCH:
    // Nếu điểm tương đồng >= 0.28 -> Đang cùng nói về một vụ việc / thực thể
    if (highestSim >= 0.28 && matchedOldArticle) {
      const newFull = `${newArticle.title} ${newArticle.summary}`;
      const oldFull = `${matchedOldArticle.title} ${matchedOldArticle.summary}`;
      const evolutionCheck = detectEvolutionIndicators(newFull, oldFull);

      const timeDiffHours = (new Date(newArticle.publishedAt).getTime() - new Date(matchedOldArticle.publishedAt).getTime()) / (1000 * 60 * 60);

      // Điều kiện xác định Diễn biến mới:
      // 1. Chứa từ khóa biến động mới (không qua khỏi, tử vong, khởi tố, đã bắt giữ...)
      // HOẶC 2. Xuất bản sau tin cũ hơn 1 giờ và có thêm thông tin mới
      const isEvolution = evolutionCheck.hasEvolution || (timeDiffHours >= 1.0 && highestSim < 0.90);

      if (isEvolution) {
        // ĐÂY LÀ DIỄN BIẾN TIẾP THEO -> BẮT BUỘC GIỮ LẠI!
        const reason = evolutionCheck.hasEvolution 
          ? `Cập nhật tình tiết mới: "${evolutionCheck.keywordFound}"` 
          : `Diễn biến phát sinh sau ${Math.round(timeDiffHours)} giờ`;

        result.push({
          ...newArticle,
          isEvolution: true,
          evolutionStatus: 'EVOLUTION',
          originalStoryId: matchedOldArticle.id,
          originalStoryTitle: matchedOldArticle.title,
          evolutionContext: `[DIỄN BIẾN TIẾP THEO] Cập nhật cho sự việc: "${matchedOldArticle.title}" (${reason})`,
          keyUpdate: reason
        });
      } else {
        // TRÙNG LẶP NỘI DUNG CŨ -> BỎ QUA ĐỂ TRÁNH ĐỌC LẶP
        continue;
      }
    } else {
      // ĐÂY LÀ TIN TỨC MỚI HOÀN TOÀN -> GIỮ LẠI
      result.push({
        ...newArticle,
        isEvolution: false,
        evolutionStatus: 'NEW_STORY',
        evolutionContext: null
      });
    }
  }

  return result;
}
