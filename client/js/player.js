/**
 * @file player.js
 * @description Trình phát Audio thông minh sử dụng Web Speech API Tiếng Việt chất lượng cao.
 * Tự động chia nhỏ kịch bản thành câu, tránh ngắt quãng trình duyệt, đồng bộ sóng âm và tiến trình.
 */

class AudioBriefingPlayer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.vietnameseVoice = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.rate = 1.0;
    this.onProgressCallback = null;
    this.onCompleteCallback = null;

    this.initVoices();
  }

  /**
   * Khởi tạo và tìm giọng đọc Tiếng Việt tự nhiên nhất trên trình duyệt
   */
  initVoices() {
    const pickVoice = () => {
      const voices = this.synth.getVoices();
      // Ưu tiên các giọng đọc trực tuyến mượt mà của Google hoặc Microsoft Tiếng Việt
      this.vietnameseVoice = voices.find(v => v.lang === 'vi-VN' && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online'))) ||
        voices.find(v => v.lang === 'vi-VN' || v.lang.startsWith('vi')) ||
        voices[0];
    };

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = pickVoice;
    }
    pickVoice();
  }

  /**
   * Tải toàn bộ kịch bản bản tin và chuẩn bị hàng đợi câu
   * @param {string} fullScript - Toàn bộ kịch bản bản tin tổng hợp
   */
  loadScript(fullScript) {
    this.stop();
    // Phân tách thành các câu ngắn theo dấu câu để SpeechSynthesis đọc trơn tru và không bị timeout
    this.sentences = fullScript
      .split(/(?<=[.?!;:\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    this.currentSentenceIndex = 0;
  }

  /**
   * Bắt đầu phát bản tin
   * @param {Function} onProgress - Hàm gọi lại cập nhật phần trăm tiến trình
   * @param {Function} onComplete - Hàm gọi lại khi phát xong toàn bộ bản tin
   */
  play(onProgress, onComplete) {
    if (this.sentences.length === 0) return;

    this.onProgressCallback = onProgress;
    this.onCompleteCallback = onComplete;

    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.isSpeaking = true;
      return;
    }

    this.isSpeaking = true;
    this.isPaused = false;
    this.speakCurrentSentence();
  }

  /**
   * Đọc câu hiện tại trong hàng đợi
   */
  speakCurrentSentence() {
    if (!this.isSpeaking || this.currentSentenceIndex >= this.sentences.length) {
      this.isSpeaking = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return;
    }

    const sentence = this.sentences[this.currentSentenceIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.voice = this.vietnameseVoice;
    utterance.rate = this.rate;
    utterance.lang = 'vi-VN';

    utterance.onend = () => {
      if (this.isSpeaking && !this.isPaused) {
        this.currentSentenceIndex++;
        if (this.onProgressCallback) {
          const progressPercent = Math.round((this.currentSentenceIndex / this.sentences.length) * 100);
          this.onProgressCallback(progressPercent, this.currentSentenceIndex, this.sentences.length);
        }
        this.speakCurrentSentence();
      }
    };

    utterance.onerror = (e) => {
      console.warn('[Audio Player] Utterance error:', e);
      if (this.isSpeaking) {
        this.currentSentenceIndex++;
        this.speakCurrentSentence();
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Tạm dừng phát
   */
  pause() {
    if (this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Tiếp tục phát
   */
  resume() {
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.isSpeaking = true;
    }
  }

  /**
   * Dừng hoàn toàn và quay về đầu
   */
  stop() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentSentenceIndex = 0;
    this.synth.cancel();
  }

  /**
   * Tua tiến hoặc lùi theo số câu
   * @param {number} deltaSentences - Số câu muốn nhảy (ví dụ: +3 hoặc -3)
   */
  seekBySentences(deltaSentences) {
    if (this.sentences.length === 0) return;
    this.synth.cancel();
    this.currentSentenceIndex = Math.max(0, Math.min(this.sentences.length - 1, this.currentSentenceIndex + deltaSentences));
    if (this.isSpeaking && !this.isPaused) {
      this.speakCurrentSentence();
    }
  }

  /**
   * Đặt tốc độ đọc (0.8x, 1.0x, 1.25x, 1.5x, 2.0x)
   * @param {number} rate - Hệ số tốc độ
   */
  setSpeed(rate) {
    this.rate = parseFloat(rate) || 1.0;
  }
}

// Xuất đối tượng dùng chung
window.audioPlayer = new AudioBriefingPlayer();
