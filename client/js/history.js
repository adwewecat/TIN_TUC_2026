/**
 * @file history.js
 * @description Quản lý bộ nhớ đệm người dùng (User Cache), trạng thái đã nghe và đồng bộ cột mốc lên máy chủ.
 */

class UserHistoryManager {
  constructor() {
    this.storageKey = 'tintuc_user_id';
    this.userId = this.getOrInitUserId();
  }

  /**
   * Lấy hoặc tạo mới mã người dùng trong LocalStorage
   * @returns {string} Mã định danh user
   */
  getOrInitUserId() {
    let id = localStorage.getItem(this.storageKey);
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(this.storageKey, id);
    }
    return id;
  }

  /**
   * Đổi sang tài khoản người dùng khác
   * @param {string} newId - Mã người dùng mới
   */
  setUserId(newId) {
    if (newId && newId.trim()) {
      this.userId = newId.trim();
      localStorage.setItem(this.storageKey, this.userId);
    }
  }

  /**
   * Tải toàn bộ thông tin lịch sử nghe từ máy chủ
   * @returns {Promise<Object>} Dữ liệu lịch sử user
   */
  async fetchHistory() {
    try {
      const res = await fetch(`/api/user/${this.userId}/history`);
      const data = await res.json();
      return data.history || null;
    } catch (err) {
      console.error('[History Manager] Lỗi tải lịch sử:', err);
      return null;
    }
  }

  /**
   * Gửi cột mốc đã nghe xong bản tin lên máy chủ
   * @param {Array<string>} newsIds - Danh sách ID các bài viết đã nghe
   * @param {string} batchId - Mã đợt phát
   * @param {string} summary - Tóm tắt đợt phát
   */
  async saveMilestone(newsIds, batchId, summary) {
    try {
      const res = await fetch('/api/user/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          newsIds,
          batchId,
          summary
        })
      });
      return await res.json();
    } catch (err) {
      console.error('[History Manager] Lỗi lưu mốc nghe:', err);
      return null;
    }
  }

  /**
   * Đặt lại lịch sử nghe của người dùng hiện tại
   */
  async resetHistory() {
    try {
      const res = await fetch(`/api/user/${this.userId}/reset`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err) {
      console.error('[History Manager] Lỗi reset lịch sử:', err);
      return null;
    }
  }
}

window.historyManager = new UserHistoryManager();
