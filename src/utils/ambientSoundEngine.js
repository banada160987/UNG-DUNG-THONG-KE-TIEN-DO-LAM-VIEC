/**
 * AMBIENT SOUND SYNTHESIZER (Web Audio API)
 * Bộ tạo âm thanh nền tự nhiên (Mưa, Sóng biển, Lửa trại, Sóng não Alpha)
 * Hoạt động 100% offline, không cần tệp mp3 tải ngoài.
 */

class AmbientSoundEngine {
  constructor() {
    this.audioCtx = null;
    this.currentType = null;
    this.gainNode = null;
    this.activeNodes = [];
    this.volume = 0.5;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  stop() {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.currentType = null;
  }

  play(type) {
    this.init();
    if (this.currentType === type) {
      this.stop();
      return false; // Paused
    }

    this.stop();
    this.currentType = type;

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    this.gainNode.connect(this.audioCtx.destination);

    switch (type) {
      case 'rain':
        this.createRain();
        break;
      case 'waves':
        this.createWaves();
        break;
      case 'campfire':
        this.createCampfire();
        break;
      case 'alpha':
        this.createAlphaWaves();
        break;
      default:
        this.createRain();
    }

    return true; // Playing
  }

  createNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    // Pink-ish noise
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  createRain() {
    const buffer = this.createNoiseBuffer();
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);

    const filter2 = this.audioCtx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.setValueAtTime(150, this.audioCtx.currentTime);

    noise.connect(filter);
    filter.connect(filter2);
    filter2.connect(this.gainNode);

    noise.start();
    this.activeNodes.push(noise, filter, filter2);
  }

  createWaves() {
    const buffer = this.createNoiseBuffer();
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);
    filter.Q.setValueAtTime(1.5, this.audioCtx.currentTime);

    // LFO modulate frequency for wave wash effect
    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.audioCtx.currentTime); // ~8 sec per wave
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.setValueAtTime(250, this.audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.gainNode);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain);
  }

  createCampfire() {
    const buffer = this.createNoiseBuffer();
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    noise.start();
    this.activeNodes.push(noise, filter);

    // Crackle crack pops
    const crackleInterval = setInterval(() => {
      if (this.currentType !== 'campfire' || !this.audioCtx) {
        clearInterval(crackleInterval);
        return;
      }
      if (Math.random() > 0.4) {
        const osc = this.audioCtx.createOscillator();
        const popGain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200 + Math.random() * 2000, this.audioCtx.currentTime);
        popGain.gain.setValueAtTime(this.volume * 0.4, this.audioCtx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
        osc.connect(popGain);
        popGain.connect(this.gainNode);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
      }
    }, 180);
  }

  createAlphaWaves() {
    // Binaural 10Hz beat (alpha state: 8 - 12Hz)
    // Left channel: 216Hz, Right channel: 226Hz => 10Hz Alpha pulse
    const baseFreq = 216;
    const diff = 10;

    const oscLeft = this.audioCtx.createOscillator();
    const oscRight = this.audioCtx.createOscillator();
    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
    oscRight.frequency.setValueAtTime(baseFreq + diff, this.audioCtx.currentTime);

    const merger = this.audioCtx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    const softFilter = this.audioCtx.createBiquadFilter();
    softFilter.type = 'lowpass';
    softFilter.frequency.setValueAtTime(500, this.audioCtx.currentTime);

    merger.connect(softFilter);
    softFilter.connect(this.gainNode);

    oscLeft.start();
    oscRight.start();
    this.activeNodes.push(oscLeft, oscRight, merger, softFilter);
  }
}

export const ambientSound = new AmbientSoundEngine();
