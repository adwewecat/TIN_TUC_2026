/**
 * @file history.js
 * @description Quản lý tài khoản người dùng, phiên đăng nhập, bộ nhớ đệm (User Cache) và đồng bộ lịch sử tin tức đã nghe.
 */

class UserHistoryManager {
  constructor() {
    this.sessionKey = 'tintuc_user_session';
    this.currentUser = this.getOrInitUser();
  }

  /**
   * Lấy hoặc khởi tạo phiên đăng nhập người dùng mặc định trong LocalStorage.
   * Mặc định là tài khoản "dung.nguyenanh" (mật khẩu: 1)
   * @returns {Object} Thông tin người dùng hiện tại
   */
  getOrInitUser() {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[History Manager] Phiên lưu trữ không hợp lệ, dùng mặc định dung.nguyenanh');
    }

    // Tài khoản mặc định ban đầu
    const defaultUser = {
      id: 'dung.nguyenanh',
      username: 'dung.nguyenanh',
      displayName: 'dung.nguyenanh',
      role: 'user'
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(defaultUser));
    return defaultUser;
  }

  /**
   * Getter lấy mã userId hiện tại
   * @returns {string} Mã người dùng (dung.nguyenanh, admin,...)
   */
  get userId() {
    return this.currentUser ? this.currentUser.id : 'dung.nguyenanh';
  }

  /**
   * Thực hiện đăng nhập với username và password
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<Object>} Kết quả đăng nhập
   */
  async login(username, password) {
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        this.currentUser = data.user;
        localStorage.setItem(this.sessionKey, JSON.stringify(data.user));
        return { success: true, user: data.user, history: data.history };
      } else {
        return { success: false, message: data.message || 'Đăng nhập không thành công' };
      }
    } catch (err) {
      console.error('[History Manager] Lỗi kết nối đăng nhập:', err);
      return { success: false, message: 'Lỗi mạng khi kết nối máy chủ' };
    }
  }

  /**
   * Lấy danh sách tài khoản người dùng có sẵn trên máy chủ
   * @returns {Promise<Array<Object>>} Danh sách tài khoản
   */
  async fetchUsersList() {
    try {
      const res = await fetch('/api/user/list');
      const data = await res.json();
      return data.users || [];
    } catch (err) {
      console.error('[History Manager] Lỗi lấy danh sách user:', err);
      return [];
    }
  }

  /**
   * Chuyển đổi nhanh sang một tài khoản người dùng đã xác thực
   * @param {Object} userObj - Đối tượng người dùng
   */
  setUser(userObj) {
    if (userObj && userObj.id) {
      this.currentUser = userObj;
      localStorage.setItem(this.sessionKey, JSON.stringify(userObj));
    }
  }

  /**
   * Tải toàn bộ thông tin lịch sử nghe của tài khoản hiện tại từ máy chủ
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
   * Gửi cột mốc đã nghe tin tức lên máy chủ theo tài khoản hiện tại
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

