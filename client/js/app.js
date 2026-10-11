/**
 * @file app.js
 * @description Điều khiển giao diện chính của hệ thống tin tức thông minh 48h và Audio briefing
 */

let currentNewsList = [];
let currentBriefing = null;
let activeCategory = 'all';

// Khởi chạy khi tài liệu HTML sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadData();
});

/**
 * Khởi tạo các sự kiện giao diện và gán lắng nghe
 */
function initUI() {
  // Cập nhật thông tin hiển thị tài khoản người dùng
  updateUserHeaderDisplay();

  // Nút bấm mở Modal quản lý tài khoản & chuyển đổi user
  const btnUserAccount = document.getElementById('btn-user-account');
  if (btnUserAccount) {
    btnUserAccount.addEventListener('click', openUserAuthModal);
  }

  // Nút đóng Modal quản lý tài khoản
  const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
  if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener('click', closeUserAuthModal);
  }

  // Chọn nhanh tài khoản mặc định dung.nguyenanh
  const cardDung = document.getElementById('quick-user-dung');
  if (cardDung) {
    cardDung.addEventListener('click', () => switchAndLogin('dung.nguyenanh', '1'));
  }

  // Chọn nhanh tài khoản mặc định admin
  const cardAdmin = document.getElementById('quick-user-admin');
  if (cardAdmin) {
    cardAdmin.addEventListener('click', () => switchAndLogin('admin', '1'));
  }

  // Lắng nghe submit form đăng nhập thủ công
  const formLogin = document.getElementById('form-user-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uInput = document.getElementById('input-login-username');
      const pInput = document.getElementById('input-login-password');
      if (uInput && pInput) {
        await switchAndLogin(uInput.value.trim(), pInput.value);
      }
    });
  }

  // Đóng modal khi bấm ra vùng backdrop ngoài
  window.addEventListener('click', (e) => {
    const authModal = document.getElementById('user-auth-modal');
    if (e.target === authModal) closeUserAuthModal();
    const historyModal = document.getElementById('history-modal');
    if (e.target === historyModal) closeHistoryModal();
  });

  // Nút Phát / Tạm dừng bản tin lớn
  const btnPlayMain = document.getElementById('btn-play-briefing');
  if (btnPlayMain) {
    btnPlayMain.addEventListener('click', togglePlayBriefing);
  }

  // Nút Dừng
  const btnStop = document.getElementById('btn-stop-audio');
  if (btnStop) {
    btnStop.addEventListener('click', () => {
      window.audioPlayer.stop();
      updatePlayerUIState(false);
    });
  }

  // Tua lùi 3 câu
  const btnRewind = document.getElementById('btn-rewind-audio');
  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      window.audioPlayer.seekBySentences(-3);
    });
  }

  // Tua tiến 3 câu
  const btnForward = document.getElementById('btn-forward-audio');
  if (btnForward) {
    btnForward.addEventListener('click', () => {
      window.audioPlayer.seekBySentences(3);
    });
  }

  // Thay đổi tốc độ phát
  const speedSelect = document.getElementById('audio-speed-select');
  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      window.audioPlayer.setSpeed(e.target.value);
    });
  }

  // Nút Quét tin tức mới 48h
  const btnCrawl = document.getElementById('btn-crawl-news');
  if (btnCrawl) {
    btnCrawl.addEventListener('click', triggerCrawlNews);
  }

  // Nút Thử nghiệm diễn biến thực tế
  const btnMock = document.getElementById('btn-mock-scenario');
  if (btnMock) {
    btnMock.addEventListener('click', triggerMockScenario);
  }

  // Nút Xem lịch sử
  const btnHistory = document.getElementById('btn-view-history');
  if (btnHistory) {
    btnHistory.addEventListener('click', openHistoryModal);
  }

  // Nút Đóng Modal Lịch sử
  const btnCloseModal = document.getElementById('btn-close-modal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeHistoryModal);
  }

  // Nút Đặt lại lịch sử (Reset)
  const btnResetHistory = document.getElementById('btn-reset-history-confirm');
  if (btnResetHistory) {
    btnResetHistory.addEventListener('click', handleResetHistory);
  }

  // Chuyển tab chuyên mục
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderNewsGrid();
    });
  });
}

/**
 * Tải dữ liệu tin tức và bản tin Audio từ máy chủ
 */
async function loadData() {
  try {
    showToast('Đang đồng bộ dữ liệu bản tin 48h...', 'info');

    // 1. Tải danh sách bài viết
    const resNews = await fetch(`/api/news?userId=${window.historyManager.userId}`);
    const dataNews = await resNews.json();
    currentNewsList = dataNews.data || [];

    // 2. Tải kịch bản bản tin Audio
    const resBriefing = await fetch(`/api/news/briefing?userId=${window.historyManager.userId}`);
    const dataBriefing = await resBriefing.json();
    currentBriefing = dataBriefing.briefing;

    renderBriefingHeader();
    renderNewsGrid();
  } catch (err) {
    console.error('Lỗi nạp dữ liệu:', err);
    showToast('Không thể kết nối máy chủ tin tức', 'error');
  }
}

/**
 * Hiển thị thông tin tổng quan bản tin lên Card Studio Audio
 */
function renderBriefingHeader() {
  if (!currentBriefing) return;

  const countBadge = document.getElementById('briefing-news-count');
  const timeBadge = document.getElementById('briefing-time-text');
  const evolutionBadge = document.getElementById('briefing-evolution-count');

  if (countBadge) countBadge.innerText = `${currentBriefing.totalArticles} tin tức`;
  if (timeBadge) timeBadge.innerText = `Cập nhật: ${currentBriefing.displayTime}`;
  if (evolutionBadge) {
    if (currentBriefing.evolutionArticlesCount > 0) {
      evolutionBadge.style.display = 'inline-flex';
      evolutionBadge.innerText = `🔥 ${currentBriefing.evolutionArticlesCount} Diễn biến mới`;
    } else {
      evolutionBadge.style.display = 'none';
    }
  }

  // Nạp kịch bản vào trình phát audio
  if (currentBriefing.fullScript) {
    window.audioPlayer.loadScript(currentBriefing.fullScript);
  }
}

/**
 * Bật/tắt phát kịch bản bản tin
 */
function togglePlayBriefing() {
  if (!currentBriefing || !currentBriefing.fullScript) {
    showToast('Chưa có kịch bản bản tin sẵn sàng', 'warning');
    return;
  }

  if (window.audioPlayer.isSpeaking && !window.audioPlayer.isPaused) {
    window.audioPlayer.pause();
    updatePlayerUIState(false);
  } else if (window.audioPlayer.isPaused) {
    window.audioPlayer.resume();
    updatePlayerUIState(true);
  } else {
    updatePlayerUIState(true);
    window.audioPlayer.play(
      // Cập nhật tiến trình
      (percent, current, total) => {
        const fill = document.getElementById('audio-progress-fill');
        const percentText = document.getElementById('audio-time-percent');
        if (fill) fill.style.width = `${percent}%`;
        if (percentText) percentText.innerText = `${percent}% (${current}/${total} câu)`;
      },
      // Hoàn tất bản tin
      async () => {
        updatePlayerUIState(false);
        showToast('🎉 Đã phát xong toàn bộ bản tin! Đang lưu cột mốc...', 'success');

        // Lưu cột mốc hoàn thành
        if (currentBriefing.articleIds && currentBriefing.articleIds.length > 0) {
          await window.historyManager.saveMilestone(
            currentBriefing.articleIds,
            currentBriefing.id,
            `Bản tin lúc ${currentBriefing.displayTime}`
          );
          // Tải lại dữ liệu để cập nhật trạng thái đã nghe
          loadData();
        }
      }
    );
  }
}

/**
 * Cập nhật giao diện trạng thái trình phát sóng âm
 * @param {boolean} isPlaying - Đang phát hay không
 */
function updatePlayerUIState(isPlaying) {
  const btnPlay = document.getElementById('btn-play-briefing');
  const waveform = document.getElementById('audio-waveform');
  const speakerIndicator = document.getElementById('current-speaker-status');

  if (isPlaying) {
    if (btnPlay) btnPlay.innerHTML = '⏸️';
    if (waveform) waveform.classList.add('playing');
    if (speakerIndicator) speakerIndicator.innerText = '🎙️ Đang đọc bản tin 48 giờ trực tiếp...';
  } else {
    if (btnPlay) btnPlay.innerHTML = '▶️';
    if (waveform) waveform.classList.remove('playing');
    if (speakerIndicator) speakerIndicator.innerText = 'Trình phát đang sẵn sàng';
  }
}

/**
 * Hiển thị danh sách tin tức lên Grid theo tab đã chọn
 */
function renderNewsGrid() {
  const container = document.getElementById('news-cards-container');
  if (!container) return;

  let filtered = currentNewsList;
  if (activeCategory === 'evolution') {
    filtered = currentNewsList.filter(item => item.isEvolution);
  } else if (activeCategory !== 'all') {
    filtered = currentNewsList.filter(item => item.category === activeCategory);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Không có bài viết nào trong chuyên mục này.</p>
        <p style="font-size: 0.9rem;">Hãy bấm nút <strong>"Quét tin tức 48h"</strong> phía trên để thu thập dữ liệu mới nhất!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isEvolution = item.isEvolution;
    const cardClass = isEvolution ? 'news-card evolution-card' : 'news-card';
    const timeFormatted = formatTimeAgo(item.publishedAt);

    return `
      <article class="${cardClass}">
        <div>
          <div class="card-top-badges">
            <span class="badge-source">${item.sourceBrand || item.source}</span>
            ${isEvolution ? `<span class="badge-evolution-tag">⚡ DIỄN BIẾN MỚI</span>` : ''}
            ${item.isRead ? `<span class="badge-read-status">✓ Đã nghe</span>` : ''}
          </div>

          <h3 class="news-title">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>
          </h3>

          ${isEvolution && item.evolutionContext ? `
            <div class="evolution-context-box">
              <strong>${item.evolutionContext}</strong>
            </div>
          ` : ''}

          <p class="news-summary">${item.summary}</p>
        </div>

        <div class="card-footer">
          <span>🕒 ${timeFormatted}</span>
          <div class="footer-actions">
            <button class="btn-card-listen" onclick="speakSingleArticle('${item.id}')">
              🔊 Nghe tin này
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Đọc riêng một bài viết cụ thể và tự động lưu mốc đã nghe cho tài khoản hiện tại
 * @param {string} articleId - Mã bài viết
 */
window.speakSingleArticle = function(articleId) {
  const article = currentNewsList.find(n => n.id === articleId);
  if (!article) return;

  let textToRead = `${article.title}. ${article.summary}`;
  if (article.isEvolution && article.originalStoryTitle) {
    textToRead = `Về diễn biến tiếp theo của sự việc "${article.originalStoryTitle}": ${article.summary}`;
  }

  window.audioPlayer.stop();
  window.audioPlayer.loadScript(textToRead);
  updatePlayerUIState(true);

  window.audioPlayer.play(
    null,
    async () => {
      updatePlayerUIState(false);
      showToast('Đã đọc xong tin tức! Đang lưu vào lịch sử tài khoản...', 'success');

      // Tự động lưu mốc đã nghe cho tài khoản người dùng hiện tại
      await window.historyManager.saveMilestone([article.id], null, article.title);

      // Cập nhật lại giao diện để hiển thị huy hiệu "✓ Đã nghe"
      await loadData();
    }
  );
};

/**
 * Kích hoạt cào tin tức mới từ máy chủ
 */
async function triggerCrawlNews() {
  const btn = document.getElementById('btn-crawl-news');
  if (btn) {
    btn.disabled = true;
    btn.innerText = '⏳ Đang quét 48h...';
  }

  showToast('Đang quét tin tức từ VnExpress, VTC News, Giá vàng và Fanpage...', 'info');

  try {
    const res = await fetch('/api/news/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: window.historyManager.userId })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Quét thành công! Cập nhật ${data.stats.savedCount} tin (${data.stats.evolutionCount} diễn biến mới, loại ${data.stats.duplicateCount} tin trùng).`, 'success');
      await loadData();
    } else {
      showToast('Quét tin thất bại: ' + data.error, 'error');
    }
  } catch (err) {
    showToast('Lỗi khi gửi yêu cầu quét tin', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '⚡ Quét tin tức 48h';
    }
  }
}

/**
 * Nạp kịch bản thử nghiệm diễn biến thực tế theo đúng yêu cầu đề bài:
 * Vụ cháy xe máy ở TP.HCM -> Diễn biến mới: Nạn nhân không qua khỏi
 */
async function triggerMockScenario() {
  showToast('Đang nạp tình huống mô phỏng vụ cháy xe máy ở TP.HCM...', 'info');
  try {
    const res = await fetch('/api/news/mock-scenario', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã nạp thành công! Hãy xem bài viết có huy hiệu [DIỄN BIẾN MỚI] màu xanh lá!', 'success');
      await loadData();
    }
  } catch (err) {
    showToast('Lỗi khi nạp kịch bản thử nghiệm', 'error');
  }
}

/**
 * Mở modal quản lý tài khoản & chuyển đổi user
 */
async function openUserAuthModal() {
  const modal = document.getElementById('user-auth-modal');
  if (modal) modal.classList.add('active');

  updateUserHeaderDisplay();

  // Cập nhật số tin đã nghe của user hiện tại trong modal
  const statsEl = document.getElementById('auth-current-stats');
  if (statsEl) {
    const history = await window.historyManager.fetchHistory();
    const count = history && history.listenedNewsIds ? history.listenedNewsIds.length : 0;
    statsEl.innerText = `${count} tin đã nghe`;
  }
}

/**
 * Đóng modal quản lý tài khoản
 */
function closeUserAuthModal() {
  const modal = document.getElementById('user-auth-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Đăng nhập hoặc chuyển đổi sang người dùng khác
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 */
async function switchAndLogin(username, password) {
  showToast(`Đang đăng nhập vào tài khoản ${username}...`, 'info');
  const res = await window.historyManager.login(username, password);

  if (res.success) {
    showToast(`🎉 Đã đăng nhập thành công: ${res.user.username}!`, 'success');
    updateUserHeaderDisplay();
    closeUserAuthModal();

    // Dừng âm thanh nếu đang phát dở của user cũ
    window.audioPlayer.stop();
    updatePlayerUIState(false);

    // Tải lại toàn bộ dữ liệu tin tức và kịch bản phát thanh riêng cho user mới này
    await loadData();
  } else {
    showToast(`❌ ${res.message}`, 'error');
  }
}

/**
 * Cập nhật thông tin tài khoản hiển thị trên thanh Header và Modal
 */
function updateUserHeaderDisplay() {
  const user = window.historyManager.currentUser;
  const username = user.username || user.id;
  const isAdmin = user.role === 'admin' || username === 'admin';

  const userDisplay = document.getElementById('user-id-display');
  const avatarDisplay = document.getElementById('user-avatar-display');
  const roleDisplay = document.getElementById('user-role-display');

  if (userDisplay) userDisplay.innerText = username;
  if (avatarDisplay) avatarDisplay.innerText = isAdmin ? '🛡️' : '👤';
  if (roleDisplay) roleDisplay.innerText = isAdmin ? 'Quản trị viên' : 'Người dùng';

  // Modal display
  const authUsername = document.getElementById('auth-current-username');
  const authRole = document.getElementById('auth-current-role');
  if (authUsername) authUsername.innerText = username;
  if (authRole) authRole.innerText = isAdmin ? 'Quản trị viên' : 'Người dùng';

  // Đánh dấu active trong card chọn nhanh
  const cardDung = document.getElementById('quick-user-dung');
  const cardAdmin = document.getElementById('quick-user-admin');
  if (cardDung) {
    if (username === 'dung.nguyenanh') cardDung.classList.add('active');
    else cardDung.classList.remove('active');
  }
  if (cardAdmin) {
    if (username === 'admin') cardAdmin.classList.add('active');
    else cardAdmin.classList.remove('active');
  }
}

/**
 * Mở modal lịch sử nghe
 */
async function openHistoryModal() {
  const modal = document.getElementById('history-modal');
  const listContainer = document.getElementById('modal-history-list');
  const countSpan = document.getElementById('modal-read-count');
  const userSpan = document.getElementById('modal-user-name');

  if (modal) modal.classList.add('active');
  if (userSpan) userSpan.innerText = window.historyManager.userId;

  const history = await window.historyManager.fetchHistory();
  if (history && listContainer) {
    const count = (history.listenedNewsIds || []).length;
    if (countSpan) countSpan.innerText = `${count} bài viết`;

    if (history.listenedBatches && history.listenedBatches.length > 0) {
      listContainer.innerHTML = history.listenedBatches.map(b => `
        <div style="background: rgba(255,255,255,0.03); padding: 0.85rem; border-radius: 8px; margin-bottom: 0.6rem; border: 1px solid rgba(255,255,255,0.06);">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #93c5fd; font-weight: 600;">
            <span>${b.summary}</span>
            <span>${new Date(b.listenedAt).toLocaleTimeString('vi-VN')}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            Đã hoàn thành nghe toàn bộ ${b.newsCount} mục tin tức
          </div>
        </div>
      `).join('');
    } else {
      listContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Tài khoản này chưa có phiên nghe trọn vẹn nào được hoàn thành.</p>`;
    }
  }
}

/**
 * Đóng modal lịch sử
 */
function closeHistoryModal() {
  const modal = document.getElementById('history-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Đặt lại lịch sử nghe
 */
async function handleResetHistory() {
  const username = window.historyManager.userId;
  if (confirm(`Bạn có chắc chắn muốn đặt lại toàn bộ lịch sử nghe của tài khoản "${username}"?`)) {
    await window.historyManager.resetHistory();
    closeHistoryModal();
    showToast(`Đã đặt lại lịch sử nghe của "${username}" thành công!`, 'success');
    await loadData();
  }
}

/**
 * Định dạng thời gian trước (vd: 30 phút trước, 2 giờ trước)
 * @param {string} isoString - Thời gian dạng ISO
 * @returns {string} Chuỗi hiển thị thân thiện
 */
function formatTimeAgo(isoString) {
  if (!isoString) return 'Vừa xong';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${Math.floor(diffHours / 24)} ngày trước`;
}

/**
 * Hiển thị thông báo Toast góc màn hình
 * @param {string} msg - Nội dung thông báo
 * @param {string} type - 'info' | 'success' | 'warning' | 'error'
 */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
