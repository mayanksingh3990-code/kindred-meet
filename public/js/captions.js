// KINDRED MEET - Live Speech-to-Text & Hugging Face AI Translation Engine (Continuous Keep-Alive)

class LiveCaptionsManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isEnabled = true;
    this.captionContainer = null;
    this.onCaptionGenerated = null;
    this.userName = 'Me';
    this.sourceLanguage = 'en';
    this.targetLanguage = 'en';
    this.activeTimeout = null;
    this.restartTimeout = null;
    this.watchdogInterval = null;
    this.recentCaptions = []; // Store last 2 sentences for smooth reading
    this.hfToken = '';
  }

  init(containerElement, onCaptionCallback) {
    this.captionContainer = containerElement;
    this.onCaptionGenerated = onCaptionCallback;

    this.setupSpeechRecognition();
    this.startWatchdog();
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser. Showing received live subtitles.');
      return;
    }

    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (e) {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.getSpeechLangCode(this.sourceLanguage);

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = async (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const rawText = (finalTranscript || interimTranscript).trim();
        if (rawText.length > 0) {
          let translated = rawText;

          // AI Translation when language differs and we have text
          if (this.sourceLanguage !== this.targetLanguage) {
            translated = await this.translateText(rawText, this.sourceLanguage, this.targetLanguage);
          }

          // Display locally with streaming permanence
          this.displayCaption(this.userName, rawText, translated, !finalTranscript);

          // Broadcast to peers
          if (this.onCaptionGenerated) {
            this.onCaptionGenerated({
              speaker: this.userName,
              text: rawText,
              translatedText: translated,
              sourceLang: this.sourceLanguage,
              targetLang: this.targetLanguage,
              isInterim: !finalTranscript
            });
          }
        }
      };

      this.recognition.onerror = (event) => {
        // Only stop permanently if microphone is blocked by user
        if (event.error === 'not-allowed') {
          this.isListening = false;
          this.isEnabled = false;
        } else {
          // Recover gracefully from no-speech, network, or audio-capture glitches
          this.isListening = false;
          this.scheduleRestart(600);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.isEnabled) {
          this.scheduleRestart(300);
        }
      };
    } catch (e) {
      console.error('Speech recognition setup error:', e);
    }
  }

  // Safe Restart with debouncing
  scheduleRestart(delay = 300) {
    if (!this.isEnabled) return;
    clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      this.safeStart();
    }, delay);
  }

  safeStart() {
    if (!this.isEnabled || this.isListening || !this.recognition) return;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      // If already started or transitioning, recreate
      if (e.name === 'InvalidStateError') {
        this.setupSpeechRecognition();
        try {
          this.recognition.start();
          this.isListening = true;
        } catch (err) {}
      }
    }
  }

  // Watchdog keep-alive runs every 3 seconds to guarantee speech engine never dies
  startWatchdog() {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    this.watchdogInterval = setInterval(() => {
      if (this.isEnabled && !this.isListening) {
        this.safeStart();
      }
    }, 3000);
  }

  getSpeechLangCode(lang) {
    const map = {
      'en': 'en-US',
      'es': 'es-ES',
      'hi': 'hi-IN',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'zh': 'zh-CN',
      'it': 'it-IT',
      'ja': 'ja-JP',
      'ar': 'ar-SA',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'bn': 'bn-IN',
      'pa': 'pa-IN'
    };
    return map[lang] || 'en-US';
  }

  setLanguages(sourceLang, targetLang) {
    this.sourceLanguage = sourceLang;
    this.targetLanguage = targetLang;
    if (this.recognition) {
      this.recognition.lang = this.getSpeechLangCode(sourceLang);
    }
  }

  async translateText(text, src, tgt) {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: src,
          targetLang: tgt,
          hfToken: this.hfToken
        })
      });
      const data = await res.json();
      return data.translated || text;
    } catch (e) {
      return text;
    }
  }

  startListening(userName = 'Me') {
    this.userName = userName;
    this.isEnabled = true;
    this.safeStart();
  }

  stopListening() {
    this.isEnabled = false;
    this.isListening = false;
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  displayCaption(speaker, originalText, translatedText, isInterim = false) {
    if (!this.captionContainer) return;

    this.captionContainer.classList.remove('hidden');

    const badge = speaker === 'Me' || speaker === this.userName ? '🗣️ You' : `👤 ${speaker}`;
    const showTranslation = translatedText && translatedText !== originalText;

    this.captionContainer.innerHTML = `
      <div class="caption-card ${isInterim ? 'caption-interim' : 'caption-final'}">
        <div class="caption-header">
          <span class="caption-speaker">${badge}</span>
          ${showTranslation ? `<span class="caption-ai-tag">✨ AI Translated (${this.targetLanguage.toUpperCase()})</span>` : ''}
        </div>
        ${showTranslation ? `
          <div class="caption-translated">${this.escapeHtml(translatedText)}</div>
          <div class="caption-original">"${this.escapeHtml(originalText)}"</div>
        ` : `
          <div class="caption-text">${this.escapeHtml(originalText)}</div>
        `}
      </div>
    `;

    // Generous reading duration: stays on screen for 25 seconds of silence so seniors never miss it
    if (this.activeTimeout) clearTimeout(this.activeTimeout);
    this.activeTimeout = setTimeout(() => {
      if (this.captionContainer) {
        this.captionContainer.classList.add('hidden');
      }
    }, 25000);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  toggleCaptions(visible) {
    if (this.captionContainer) {
      this.captionContainer.style.display = visible ? 'block' : 'none';
    }
  }
}

window.liveCaptionsManager = new LiveCaptionsManager();
