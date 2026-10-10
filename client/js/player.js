/**
 * @file player.js
 * @description Trình phát Audio tiếng Việt chất lượng cao.
 * Sử dụng công nghệ phát trực tuyến âm thanh tiếng Việt chuẩn 100% (Native Vietnamese Audio),
 * phát âm tự nhiên, êm tai, hoàn toàn không bị giọng tiếng Anh kể cả khi máy tính chưa cài gói tiếng Việt.
 */

class AudioBriefingPlayer {
  constructor() {
    this.audioElement = new Audio();
    this.nextAudioElement = null; // Tải trước câu tiếp theo để phát liền mạch
    this.isSpeaking = false;
    this.isPaused = false;
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.rate = 1.0;
    this.onProgressCallback = null;
    this.onCompleteCallback = null;

    // Lắng nghe sự kiện kết thúc câu hiện tại để phát tiếp
    this.audioElement.addEventListener('ended', () => {
      this.handleSentenceEnded();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('[Audio Player] Lỗi tải câu audio:', e);
      // Nếu có sự cố mạng nhẹ, tự động nhảy sang câu tiếp theo sau 300ms
      setTimeout(() => {
        if (this.isSpeaking && !this.isPaused) {
          this.handleSentenceEnded();
        }
      }, 300);
    });
  }

  /**
   * Tải toàn bộ kịch bản bản tin và chuẩn bị danh sách câu ngắn
   * @param {string} fullScript - Kịch bản phát thanh bản tin
   */
  loadScript(fullScript) {
    this.stop();
    if (!fullScript) return;

    // Phân tách câu theo dấu chấm, chấm than, hỏi chấm hoặc ngắt dòng
    const rawSentences = fullScript
      .split(/(?<=[.?!;\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Nếu câu nào dài quá 170 ký tự, tách tiếp theo dấu phẩy hoặc liên từ để âm thanh đọc mượt mà
    this.sentences = [];
    rawSentences.forEach(sentence => {
      if (sentence.length > 170) {
        const subParts = sentence.split(/(?<=[,])\s+/);
        subParts.forEach(sp => {
          if (sp.trim()) this.sentences.push(sp.trim());
        });
      } else {
        this.sentences.push(sentence);
      }
    });

    this.currentSentenceIndex = 0;
  }

  /**
   * Tạo đường dẫn âm thanh phát thanh tiếng Việt chuẩn từ máy chủ
   * @param {string} text - Nội dung câu tiếng Việt
   * @returns {string} URL API
   */
  getAudioUrl(text) {
    return `/api/news/tts?text=${encodeURIComponent(text)}`;
  }

  /**
   * Bắt đầu hoặc tiếp tục phát bản tin
   * @param {Function} onProgress - Callback cập nhật phần trăm tiến độ
   * @param {Function} onComplete - Callback khi phát xong toàn bộ bản tin
   */
  play(onProgress, onComplete) {
    if (this.sentences.length === 0) return;

    if (onProgress) this.onProgressCallback = onProgress;
    if (onComplete) this.onCompleteCallback = onComplete;

    if (this.isPaused) {
      this.isPaused = false;
      this.isSpeaking = true;
      this.audioElement.play().catch(err => console.warn('[Audio] Resume error:', err));
      return;
    }

    this.isSpeaking = true;
    this.isPaused = false;
    this.playCurrentSentence();
  }

  /**
   * Phát câu hiện tại trong danh sách
   */
  playCurrentSentence() {
    if (!this.isSpeaking || this.currentSentenceIndex >= this.sentences.length) {
      this.isSpeaking = false;
      this.isPaused = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return;
    }

    const text = this.sentences[this.currentSentenceIndex];
    const url = this.getAudioUrl(text);

    // Cập nhật tiến độ giao diện
    if (this.onProgressCallback) {
      const percent = Math.round(((this.currentSentenceIndex + 1) / this.sentences.length) * 100);
      this.onProgressCallback(percent, this.currentSentenceIndex + 1, this.sentences.length);
    }

    this.audioElement.src = url;
    this.audioElement.playbackRate = this.rate;

    this.audioElement.play().catch(err => {
      console.warn('[Audio Player] Play error:', err);
    });

    // Tải trước câu kế tiếp để khi câu hiện tại đọc xong sẽ chuyển tiếp ngay lập tức
    this.preloadNextSentence();
  }

  /**
   * Tải trước âm thanh câu kế tiếp vào bộ nhớ đệm
   */
  preloadNextSentence() {
    const nextIndex = this.currentSentenceIndex + 1;
    if (nextIndex < this.sentences.length) {
      const nextText = this.sentences[nextIndex];
      this.nextAudioElement = new Audio();
      this.nextAudioElement.src = this.getAudioUrl(nextText);
      this.nextAudioElement.load();
    }
  }

  /**
   * Xử lý khi một câu đọc xong
   */
  handleSentenceEnded() {
    if (!this.isSpeaking || this.isPaused) return;

    this.currentSentenceIndex++;
    if (this.currentSentenceIndex < this.sentences.length) {
      this.playCurrentSentence();
    } else {
      this.isSpeaking = false;
      this.isPaused = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  }

  /**
   * Tạm dừng phát
   */
  pause() {
    if (this.isSpeaking && !this.isPaused) {
      this.audioElement.pause();
      this.isPaused = true;
    }
  }

  /**
   * Tiếp tục phát
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.audioElement.play().catch(err => console.warn('[Audio] Resume error:', err));
    }
  }

  /**
   * Dừng hoàn toàn và quay về đầu
   */
  stop() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentSentenceIndex = 0;
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.audioElement.src = '';
  }

  /**
   * Tua tiến hoặc lùi theo số câu
   * @param {number} deltaSentences - Số câu muốn nhảy (vd: +3 hoặc -3)
   */
  seekBySentences(deltaSentences) {
    if (this.sentences.length === 0) return;
    this.audioElement.pause();
    this.currentSentenceIndex = Math.max(0, Math.min(this.sentences.length - 1, this.currentSentenceIndex + deltaSentences));
    if (this.isSpeaking && !this.isPaused) {
      this.playCurrentSentence();
    } else if (this.onProgressCallback) {
      const percent = Math.round(((this.currentSentenceIndex + 1) / this.sentences.length) * 100);
      this.onProgressCallback(percent, this.currentSentenceIndex + 1, this.sentences.length);
    }
  }

  /**
   * Đặt tốc độ đọc (0.8x, 1.0x, 1.2x, 1.5x)
   * @param {number|string} rate - Tốc độ phát
   */
  setSpeed(rate) {
    this.rate = parseFloat(rate) || 1.0;
    this.audioElement.playbackRate = this.rate;
  }
}

// Khởi tạo đối tượng dùng chung
window.audioPlayer = new AudioBriefingPlayer();
