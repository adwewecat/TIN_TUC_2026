/**
 * @file database.js
 * @description Quản lý lưu trữ dữ liệu tin tức và lịch sử nghe theo từng người dùng (User Cache).
 * Sử dụng cơ chế lưu trữ file JSON bền vững, không phụ thuộc vào dịch vụ bên ngoài,
 * tự động khôi phục và duy trì trạng thái kể cả khi khởi động lại máy chủ.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục chứa dữ liệu vật lý
const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news_db.json');
const USER_HISTORY_FILE = path.join(DATA_DIR, 'user_history.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Danh sách tài khoản người dùng mặc định theo yêu cầu của hệ thống
const DEFAULT_USERS = [
  {
    id: 'dung.nguyenanh',
    username: 'dung.nguyenanh',
    password: '1',
    displayName: 'dung.nguyenanh',
    role: 'user',
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'admin',
    username: 'admin',
    password: '1',
    displayName: 'admin',
    role: 'admin',
    createdAt: '2026-10-11T00:00:00.000Z'
  }
];

// Đảm bảo thư mục lưu trữ luôn tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Đọc dữ liệu từ file an toàn với giá trị mặc định
 * @param {string} filePath - Đường dẫn tới file JSON
 * @param {any} defaultValue - Giá trị mặc định khi file chưa tồn tại hoặc lỗi
 * @returns {any} Dữ liệu đã phân tích cú pháp
 */
function readJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Database Error] Không thể đọc file ${filePath}:`, err.message);
    return defaultValue;
  }
}

/**
 * Ghi dữ liệu ra file JSON an toàn
 * @param {string} filePath - Đường dẫn tới file JSON
 * @param {any} data - Dữ liệu cần lưu
 */
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Database Error] Không thể ghi file ${filePath}:`, err.message);
  }
}

/**
 * Lấy toàn bộ danh sách tin tức đã lưu trong CSDL
 * @returns {Array<Object>} Danh sách bài viết
 */
export function getAllNews() {
  return readJSON(NEWS_FILE, []);
}

/**
 * Lưu danh sách bài viết mới vào CSDL, cập nhật nếu đã có ID tương ứng
 * @param {Array<Object>} newArticles - Danh sách bài viết mới cào về
 * @returns {Array<Object>} Toàn bộ danh sách bài viết sau khi hợp nhất
 */
export function saveNews(newArticles) {
  const currentNews = getAllNews();
  const newsMap = new Map();

  // Đưa tin cũ vào map
  currentNews.forEach(item => {
    newsMap.set(item.id, item);
  });

  // Hợp nhất tin mới (nếu có cập nhật diễn biến thì ghi đè bản mới hơn)
  newArticles.forEach(item => {
    newsMap.set(item.id, item);
  });

  const updatedList = Array.from(newsMap.values()).sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  writeJSON(NEWS_FILE, updatedList);
  return updatedList;
}

/**
 * Tìm bài viết theo mã định danh duy nhất (ID)
 * @param {string} id - Mã bài viết
 * @returns {Object|null} Bài viết hoặc null
 */
export function getNewsById(id) {
  const currentNews = getAllNews();
  return currentNews.find(item => item.id === id) || null;
}

/**
 * Lấy danh sách tất cả người dùng trong hệ thống.
 * Tự động đồng bộ và khởi tạo 2 tài khoản mặc định (dung.nguyenanh / 1 và admin / 1) nếu chưa có.
 * @returns {Array<Object>} Danh sách tài khoản người dùng
 */
export function getUsers() {
  let users = readJSON(USERS_FILE, []);
  let modified = false;

  for (const defUser of DEFAULT_USERS) {
    const existingIndex = users.findIndex(u => u.username.toLowerCase() === defUser.username.toLowerCase());
    if (existingIndex === -1) {
      users.push({ ...defUser });
      modified = true;
    }
  }

  if (modified || !fs.existsSync(USERS_FILE)) {
    writeJSON(USERS_FILE, users);
  }
  return users;
}

/**
 * Tìm người dùng theo tên đăng nhập (không phân biệt chữ hoa, chữ thường)
 * @param {string} username - Tên đăng nhập
 * @returns {Object|null} Thông tin người dùng hoặc null
 */
export function findUser(username) {
  if (!username) return null;
  const users = getUsers();
  return users.find(u => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
}

/**
 * Xác thực đăng nhập người dùng với mật khẩu
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @returns {Object|null} Thông tin người dùng an toàn (đã loại bỏ password) hoặc null nếu không khớp
 */
export function authenticateUser(username, password) {
  const user = findUser(username);
  if (!user) return null;

  if (String(user.password) === String(password)) {
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
  return null;
}

/**
 * Lấy thông tin an toàn của người dùng theo mã định danh userId
 * @param {string} userId - Mã người dùng (vd: dung.nguyenanh, admin)
 * @returns {Object} Hồ sơ người dùng
 */
export function getUserById(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId || u.username.toLowerCase() === (userId || '').toLowerCase());
  if (user) {
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
  return {
    id: userId,
    username: userId,
    displayName: userId,
    role: 'user'
  };
}

/**
 * Lấy lịch sử và trạng thái đã nghe của người dùng cụ thể
 * @param {string} userId - Mã định danh người dùng (mặc định: 'dung.nguyenanh')
 * @returns {Object} Thông tin lịch sử nghe của user
 */
export function getUserHistory(userId = 'dung.nguyenanh') {
  const effectiveId = userId || 'dung.nguyenanh';
  const allHistory = readJSON(USER_HISTORY_FILE, {});
  if (!allHistory[effectiveId]) {
    allHistory[effectiveId] = {
      userId: effectiveId,
      listenedNewsIds: [],
      listenedBatches: [],
      lastMilestone: null,
      updatedAt: new Date().toISOString()
    };
    writeJSON(USER_HISTORY_FILE, allHistory);
  }
  return allHistory[effectiveId];
}

/**
 * Đánh dấu danh sách các tin tức mà người dùng đã nghe qua Audio
 * @param {string} userId - Mã người dùng
 * @param {Array<string>} newsIds - Mảng các ID bài viết đã nghe
 * @returns {Object} Lịch sử user đã cập nhật
 */
export function markNewsAsRead(userId = 'dung.nguyenanh', newsIds = []) {
  const effectiveId = userId || 'dung.nguyenanh';
  const allHistory = readJSON(USER_HISTORY_FILE, {});
  const userRecord = allHistory[effectiveId] || {
    userId: effectiveId,
    listenedNewsIds: [],
    listenedBatches: [],
    lastMilestone: null
  };

  const currentSet = new Set(userRecord.listenedNewsIds || []);
  newsIds.forEach(id => currentSet.add(id));

  userRecord.listenedNewsIds = Array.from(currentSet);
  userRecord.lastMilestone = new Date().toISOString();
  userRecord.updatedAt = new Date().toISOString();

  allHistory[effectiveId] = userRecord;
  writeJSON(USER_HISTORY_FILE, allHistory);
  return userRecord;
}

/**
 * Lưu lại thông tin một đợt phát Audio mà người dùng đã nghe hoàn tất
 * @param {string} userId - Mã người dùng
 * @param {Object} batchData - Dữ liệu phiên nghe (batchId, newsCount, summary)
 */
export function saveListenedBatch(userId = 'dung.nguyenanh', batchData = {}) {
  const effectiveId = userId || 'dung.nguyenanh';
  const allHistory = readJSON(USER_HISTORY_FILE, {});
  const userRecord = allHistory[effectiveId] || {
    userId: effectiveId,
    listenedNewsIds: [],
    listenedBatches: [],
    lastMilestone: null
  };

  userRecord.listenedBatches = userRecord.listenedBatches || [];
  userRecord.listenedBatches.unshift({
    ...batchData,
    listenedAt: new Date().toISOString()
  });

  // Giữ lại tối đa 50 lượt phát gần nhất để tiết kiệm bộ nhớ
  if (userRecord.listenedBatches.length > 50) {
    userRecord.listenedBatches = userRecord.listenedBatches.slice(0, 50);
  }

  allHistory[effectiveId] = userRecord;
  writeJSON(USER_HISTORY_FILE, allHistory);
}

/**
 * Xóa sạch lịch sử nghe của một người dùng (hữu ích khi muốn nghe lại từ đầu)
 * @param {string} userId - Mã người dùng
 * @returns {Object} Hồ sơ người dùng sau khi reset
 */
export function resetUserHistory(userId = 'dung.nguyenanh') {
  const effectiveId = userId || 'dung.nguyenanh';
  const allHistory = readJSON(USER_HISTORY_FILE, {});
  allHistory[effectiveId] = {
    userId: effectiveId,
    listenedNewsIds: [],
    listenedBatches: [],
    lastMilestone: null,
    updatedAt: new Date().toISOString()
  };
  writeJSON(USER_HISTORY_FILE, allHistory);
  return allHistory[effectiveId];
}

