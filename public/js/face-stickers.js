// KINDRED MEET - Fun Video Frames and Playful Stickers for Kids Mode

class VideoStickersManager {
  constructor() {
    this.currentSticker = 'none';
    this.overlayElement = null;
  }

  init(overlayElement) {
    this.overlayElement = overlayElement;
    this.renderSticker();
  }

  setSticker(stickerType) {
    this.currentSticker = stickerType;
    this.renderSticker();
    if (window.soundEngine && stickerType !== 'none') {
      window.soundEngine.playSparkle();
    }
  }

  renderSticker() {
    if (!this.overlayElement) return;

    this.overlayElement.innerHTML = '';
    if (this.currentSticker === 'none') {
      this.overlayElement.style.display = 'none';
      return;
    }

    this.overlayElement.style.display = 'block';

    switch (this.currentSticker) {
      case 'party':
        this.overlayElement.innerHTML = `
          <div class="sticker-wrapper party-hat-anim">
            <span class="sticker-emoji big-hat">🥳</span>
            <div class="confetti-streamer c1">🎉</div>
            <div class="confetti-streamer c2">✨</div>
            <div class="confetti-streamer c3">🎈</div>
          </div>
        `;
        break;

      case 'crown':
        this.overlayElement.innerHTML = `
          <div class="sticker-wrapper crown-anim">
            <span class="sticker-emoji big-crown">👑</span>
            <div class="sparkle-star s1">✨</div>
            <div class="sparkle-star s2">⭐</div>
          </div>
        `;
        break;

      case 'glasses':
        this.overlayElement.innerHTML = `
          <div class="sticker-wrapper glasses-anim">
            <span class="sticker-emoji cool-glasses">😎</span>
          </div>
        `;
        break;

      case 'cat':
        this.overlayElement.innerHTML = `
          <div class="sticker-wrapper cat-anim">
            <span class="sticker-emoji cat-ears">🐱</span>
            <div class="paws p1">🐾</div>
            <div class="paws p2">🐾</div>
          </div>
        `;
        break;

      case 'space':
        this.overlayElement.innerHTML = `
          <div class="sticker-wrapper space-anim">
            <span class="sticker-emoji astronaut-helmet">🚀</span>
            <div class="planet pl1">🪐</div>
            <div class="planet pl2">⭐</div>
          </div>
        `;
        break;

      default:
        break;
    }
  }
}

window.videoStickersManager = new VideoStickersManager();
