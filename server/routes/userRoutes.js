/**
 * @file userRoutes.js
 * @description Các API quản lý xác thực tài khoản, danh sách người dùng và lưu trữ lịch sử nghe (User Cache)
 */

import express from 'express';
import {
  getUsers,
  authenticateUser,
  getUserById,
  getUserHistory,
  markNewsAsRead,
  saveListenedBatch,
  resetUserHistory
} from '../storage/database.js';

const router = express.Router();

/**
 * GET /api/user/list
 * Lấy danh sách tài khoản khả dụng trên hệ thống (không lộ mật khẩu)
 */
router.get('/list', (req, res) => {
  try {
    const users = getUsers().map(u => {
      const { password: _, ...safe } = u;
      return safe;
    });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/login
 * Đăng nhập tài khoản người dùng với username và password
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp cả tên đăng nhập và mật khẩu.'
      });
    }

    const user = authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Mặc định: dung.nguyenanh (mật khẩu: 1) hoặc admin (mật khẩu: 1).'
      });
    }

    const history = getUserHistory(user.id);
    res.json({
      success: true,
      message: `Đăng nhập thành công với tài khoản ${user.username}`,
      user,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/user/:userId/history
 * Lấy toàn bộ lịch sử nghe và cache bài viết của một người dùng
 */
router.get('/:userId/history', (req, res) => {
  try {
    const { userId } = req.params;
    const effectiveId = userId || 'dung.nguyenanh';
    const history = getUserHistory(effectiveId);
    const userInfo = getUserById(effectiveId);
    res.json({ success: true, user: userInfo, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/milestone
 * Lưu cột mốc nghe xong bản tin: Đánh dấu các tin đã nghe để làm căn cứ lọc trùng cho lần quét sau
 */
router.post('/milestone', (req, res) => {
  try {
    const { userId = 'dung.nguyenanh', newsIds = [], batchId, summary } = req.body;

    if (!Array.isArray(newsIds) || newsIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách newsIds không hợp lệ' });
    }

    const effectiveId = userId || 'dung.nguyenanh';
    const updatedUser = markNewsAsRead(effectiveId, newsIds);

    if (batchId) {
      saveListenedBatch(effectiveId, {
        batchId,
        newsCount: newsIds.length,
        summary: summary || 'Bản tin tổng hợp 48 giờ'
      });
    }

    res.json({
      success: true,
      message: `Đã lưu thành công mốc nghe cho ${newsIds.length} bài viết vào tài khoản ${effectiveId}`,
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/:userId/reset
 * Đặt lại lịch sử nghe của người dùng về trạng thái ban đầu
 */
router.post('/:userId/reset', (req, res) => {
  try {
    const { userId } = req.params;
    const effectiveId = userId || 'dung.nguyenanh';
    const resetUser = resetUserHistory(effectiveId);
    res.json({
      success: true,
      message: `Đã xóa toàn bộ lịch sử nghe của tài khoản ${effectiveId}`,
      user: resetUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

