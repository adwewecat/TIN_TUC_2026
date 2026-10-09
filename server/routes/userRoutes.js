/**
 * @file userRoutes.js
 * @description Các API quản lý trạng thái, mốc lịch sử nghe và cache theo từng người dùng (User Cache)
 */

import express from 'express';
import { getUserHistory, markNewsAsRead, saveListenedBatch, resetUserHistory } from '../storage/database.js';

const router = express.Router();

/**
 * GET /api/user/:userId/history
 * Lấy toàn bộ lịch sử nghe và cache bài viết của một người dùng
 */
router.get('/:userId/history', (req, res) => {
  try {
    const { userId } = req.params;
    const history = getUserHistory(userId);
    res.json({ success: true, history });
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
    const { userId = 'default_user', newsIds = [], batchId, summary } = req.body;

    if (!Array.isArray(newsIds) || newsIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách newsIds không hợp lệ' });
    }

    const updatedUser = markNewsAsRead(userId, newsIds);

    if (batchId) {
      saveListenedBatch(userId, {
        batchId,
        newsCount: newsIds.length,
        summary: summary || 'Bản tin tổng hợp 48 giờ'
      });
    }

    res.json({
      success: true,
      message: `Đã lưu thành công mốc nghe cho ${newsIds.length} bài viết`,
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
    const resetUser = resetUserHistory(userId);
    res.json({
      success: true,
      message: 'Đã xóa toàn bộ lịch sử nghe của người dùng',
      user: resetUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
