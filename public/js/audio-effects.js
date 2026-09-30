// KINDRED MEET - Web Audio Synthesizer & Audio Accessibility Engine

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.isBoosted = false;
    this.analyser = null;
    this.micStreamSource = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Gentle 2-tone doorbell chime
  playChime() {
    this.init();
    const now = this.ctx.currentTime;
    
    // Note 1: E5 (659.25 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // Note 2: C5 (523.25 Hz)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.35);
    gain2.gain.setValueAtTime(0.35, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.35);
    osc2.stop(now + 1.4);
  }

  // Cheerful party fanfare / horn
  playPartyHorn() {
    this.init();
    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const startTime = now + index * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Magic sparkles / star chime
  playSparkle() {
    this.init();
    const now = this.ctx.currentTime;
    const frequencies = [880, 1108.73, 1318.51, 1760, 2217.46];
    frequencies.forEach((freq, i) => {
      const startTime = now + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // Heart beat / warm pop
  playHeartPop() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Synthesized applause / clapping
  playApplause() {
    this.init();
    const now = this.ctx.currentTime;
    const duration = 1.2;
    for (let i = 0; i < 18; i++) {
      const clapTime = now + (Math.random() * duration * 0.85);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 300, clapTime);
      gain.gain.setValueAtTime(0.18 + Math.random() * 0.1, clapTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(clapTime);
      osc.stop(clapTime + 0.08);
    }
  }

  // Puppy / playful boing sound
  playPuppySound() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.28);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Gentle Helper Alert sound for Senior "I Need Help" button
  playHelpAlert() {
    this.init();
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const startTime = now + i * 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // Setup Microphone Level Meter (for pre-call audio check & speaking indicator)
  setupMicMeter(mediaStream, onLevelUpdate) {
    try {
      this.init();
      if (!mediaStream || mediaStream.getAudioTracks().length === 0) return;

      const audioTrack = mediaStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = this.ctx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let isRunning = true;
      const checkLevel = () => {
        if (!isRunning) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        onLevelUpdate(normalized);
        requestAnimationFrame(checkLevel);
      };
      checkLevel();

      return () => {
        isRunning = false;
        try {
          source.disconnect();
        } catch (e) {}
      };
    } catch (e) {
      console.warn('Mic meter setup skipped:', e);
      return () => {};
    }
  }

  // Audio Booster for hard-of-hearing users (1.0x -> 2.5x gain)
  attachVolumeBooster(videoOrAudioElement, boostFactor = 2.0) {
    try {
      this.init();
      if (videoOrAudioElement._boostGainNode) {
        videoOrAudioElement._boostGainNode.gain.setValueAtTime(boostFactor, this.ctx.currentTime);
        return;
      }

      const source = this.ctx.createMediaElementSource(videoOrAudioElement);
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(boostFactor, this.ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      videoOrAudioElement._boostGainNode = gainNode;
    } catch (e) {
      console.warn('Volume booster attached natively:', e);
    }
  }

  setVolumeBoost(videoOrAudioElement, isBoosted) {
    this.isBoosted = isBoosted;
    const factor = isBoosted ? 2.5 : 1.0;
    if (videoOrAudioElement) {
      this.attachVolumeBooster(videoOrAudioElement, factor);
    }
    return factor;
  }
}

window.soundEngine = new SoundEngine();
