export type SFXPreset = 'whoosh' | 'ding' | 'boom' | 'pop' | 'camera';

/**
 * Generates an AudioBuffer for popular sound effects in 1-2 milliseconds using OfflineAudioContext
 */
export async function createSFXBuffer(type: SFXPreset): Promise<AudioBuffer> {
  const sampleRate = 44100;
  let duration = 0.5;
  if (type === 'ding') duration = 1.2;
  if (type === 'boom') duration = 1.0;
  if (type === 'whoosh') duration = 0.45;
  if (type === 'pop') duration = 0.15;
  if (type === 'camera') duration = 0.25;

  const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * duration), sampleRate);

  if (type === 'ding') {
    // Crystal bell notification: 1760Hz fundamental (A6) + 3520Hz overtone
    const osc1 = offlineCtx.createOscillator();
    const osc2 = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, 0);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3520, 0);

    gain.gain.setValueAtTime(0.65, 0);
    gain.gain.exponentialRampToValueAtTime(0.0001, duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(offlineCtx.destination);

    osc1.start(0);
    osc2.start(0);
    osc1.stop(duration);
    osc2.stop(duration);
  } else if (type === 'whoosh') {
    // Dynamic transition whoosh: Bandpass sweeping white noise
    const bufferSize = Math.ceil(sampleRate * duration);
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = offlineCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.2, 0);
    filter.frequency.setValueAtTime(280, 0);
    filter.frequency.exponentialRampToValueAtTime(2400, duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(320, duration);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.001, 0);
    gain.gain.linearRampToValueAtTime(0.85, duration * 0.35);
    gain.gain.linearRampToValueAtTime(0.001, duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);

    whiteNoise.start(0);
    whiteNoise.stop(duration);
  } else if (type === 'boom') {
    // Cinematic low boom/impact: Pitch drop sub-bass
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, 0);
    osc.frequency.exponentialRampToValueAtTime(36, duration);

    gain.gain.setValueAtTime(0.9, 0);
    gain.gain.exponentialRampToValueAtTime(0.0001, duration);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(0);
    osc.stop(duration);
  } else if (type === 'pop') {
    // Bubble pop: Fast sine pitch sweep
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, 0);
    osc.frequency.exponentialRampToValueAtTime(1100, 0.04);
    osc.frequency.exponentialRampToValueAtTime(400, duration);

    gain.gain.setValueAtTime(0.75, 0);
    gain.gain.exponentialRampToValueAtTime(0.0001, duration);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(0);
    osc.stop(duration);
  } else if (type === 'camera') {
    // Camera click: Two rapid shutter pulses
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, 0);
    osc.frequency.setValueAtTime(1400, 0.07);

    gain.gain.setValueAtTime(0.4, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.04);
    gain.gain.setValueAtTime(0.5, 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.18);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(0);
    osc.stop(duration);
  }

  return await offlineCtx.startRendering();
}

/**
 * Encodes an AudioBuffer into a WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  out.setUint8(pos++, 0x52); out.setUint8(pos++, 0x49); out.setUint8(pos++, 0x46); out.setUint8(pos++, 0x46); // 'RIFF'
  setUint32(length - 8);
  out.setUint8(pos++, 0x57); out.setUint8(pos++, 0x41); out.setUint8(pos++, 0x56); out.setUint8(pos++, 0x45); // 'WAVE'
  out.setUint8(pos++, 0x66); out.setUint8(pos++, 0x6d); out.setUint8(pos++, 0x74); out.setUint8(pos++, 0x20); // 'fmt '
  setUint32(16); // SubChunk1Size (16 for PCM)
  setUint16(1);  // AudioFormat (1 = PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2); // BlockAlign
  setUint16(16); // BitsPerSample
  out.setUint8(pos++, 0x64); out.setUint8(pos++, 0x61); out.setUint8(pos++, 0x74); out.setUint8(pos++, 0x61); // 'data'
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export class BackgroundMusicPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private masterGain: GainNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private clipAudios: Map<string, HTMLAudioElement> = new Map();
  public currentTheme: string = 'none';

  public masterVolume = 1.0;
  public isMuted = false;

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  stopStandalone() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.currentTheme = 'none';
  }

  constructor() {
    // Lazy init audio context on user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1.5, vol));
    const effectiveGain = this.isMuted ? 0 : this.masterVolume;
    const clampedGain = Math.max(0, Math.min(1.0, effectiveGain));

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
    if (this.audioEl) {
      this.audioEl.muted = this.isMuted || this.masterVolume === 0;
      this.audioEl.volume = clampedGain;
    }
    // Instantly apply to all playing clip audio elements
    this.clipAudios.forEach((audio) => {
      audio.muted = this.isMuted || this.masterVolume === 0;
      audio.volume = clampedGain;
    });
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    const effectiveGain = muted ? 0 : this.masterVolume;
    const clampedGain = Math.max(0, Math.min(1.0, effectiveGain));

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
    if (this.audioEl) {
      this.audioEl.muted = muted;
      this.audioEl.volume = clampedGain;
    }
    this.clipAudios.forEach((audio) => {
      audio.muted = muted;
      audio.volume = clampedGain;
    });
  }

  applyDucking(isSpeaking: boolean, baseVolume: number) {
    const targetVol = isSpeaking ? baseVolume * 0.25 : baseVolume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.2);
    }
    if (this.audioEl) {
      this.audioEl.volume = Math.max(0, Math.min(1.0, targetVol));
    }
  }

  async previewSFX(type: SFXPreset, volume: number) {
    this.initContext();
    if (!this.ctx) return;
    try {
      const sfxBuffer = await createSFXBuffer(type);
      const source = this.ctx.createBufferSource();
      source.buffer = sfxBuffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(Math.max(0, Math.min(1.5, volume)), this.ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start(0);
    } catch (err) {
      console.warn('Could not preview SFX:', err);
    }
  }

  playCustomAudio(url: string, volume: number, startTime = 0, loop = false) {
    this.stopAllClips();
    if (!this.audioEl) {
      this.audioEl = new Audio();
    }
    this.audioEl.loop = loop;
    if (this.audioEl.src !== url) {
      this.audioEl.src = url;
    }
    if (Math.abs(this.audioEl.currentTime - startTime) > 0.5) {
      try {
        this.audioEl.currentTime = startTime;
      } catch (e) {
        // ignore if not ready
      }
    }
    this.audioEl.volume = Math.max(0, Math.min(1.0, volume));
    this.audioEl.play().catch(console.error);
    this.isPlaying = true;
    this.currentTheme = 'none';
  }

  /**
   * Synchronizes all active audio clips on the timeline simultaneously (multitrack overlay)
   */
  syncClips(clips: Array<{ id: string; url: string | null; start: number; duration: number; volume: number; isLoop: boolean; isMuted?: boolean }>, currentTime: number, isPlaying: boolean) {
    if (!isPlaying) {
      this.pauseAllClips();
      return;
    }

    // Crucial: When timeline audio clips are active, silence any standalone preview audio element
    // or synthetic chords to prevent duplicate audio streams / echo!
    if (clips.length > 0) {
      this.stopStandalone();
    }

    clips.forEach((clip) => {
      if (!clip.url) return;
      const clipEnd = clip.isLoop ? Infinity : clip.start + clip.duration;
      const isActive = currentTime >= clip.start && currentTime < clipEnd;

      let audio = this.clipAudios.get(clip.id);
      if (!audio) {
        audio = new Audio(clip.url);
        audio.loop = clip.isLoop;
        this.clipAudios.set(clip.id, audio);
      } else if (audio.src !== clip.url) {
        audio.src = clip.url;
        audio.loop = clip.isLoop;
      }

      if (isActive) {
        const relTime = clip.isLoop ? (currentTime - clip.start) % clip.duration : (currentTime - clip.start);
        const clipMuted = clip.isMuted || this.isMuted || this.masterVolume === 0;
        const clipBaseVol = typeof clip.volume === 'number' ? clip.volume : 1.0;
        const effectiveVol = clipMuted ? 0 : Math.max(0, Math.min(1.0, clipBaseVol * (this.masterVolume > 1.0 ? 1.0 : this.masterVolume)));

        audio.muted = clipMuted;
        audio.volume = effectiveVol;
        audio.loop = clip.isLoop;

        if (audio.paused) {
          try {
            audio.currentTime = Math.max(0, relTime);
          } catch (e) {}
          audio.play().catch(() => {});
        } else if (Math.abs(audio.currentTime - relTime) > 0.35) {
          // Re-seek if scrubbed or jumped on timeline
          try {
            audio.currentTime = Math.max(0, relTime);
          } catch (e) {}
        }
      } else {
        if (!audio.paused) {
          audio.pause();
          try {
            audio.currentTime = 0;
          } catch (e) {}
        }
      }
    });

    // Clean up deleted clips
    const activeIds = new Set(clips.map((c) => c.id));
    this.clipAudios.forEach((audio, id) => {
      if (!activeIds.has(id)) {
        audio.pause();
        audio.src = '';
        this.clipAudios.delete(id);
      }
    });
  }

  seekClips(clips: Array<{ id: string; url: string | null; start: number; duration: number; isLoop: boolean }>, time: number) {
    clips.forEach((clip) => {
      const audio = this.clipAudios.get(clip.id);
      if (audio) {
        const relTime = clip.isLoop ? (time - clip.start) % clip.duration : (time - clip.start);
        if (relTime >= 0 && (clip.isLoop || relTime < clip.duration)) {
          try {
            audio.currentTime = relTime;
          } catch (e) {}
        } else {
          audio.pause();
          try {
            audio.currentTime = 0;
          } catch (e) {}
        }
      }
    });
  }

  pauseAllClips() {
    this.clipAudios.forEach((audio) => {
      if (!audio.paused) {
        try {
          audio.pause();
        } catch (e) {}
      }
    });
  }

  stopAllClips() {
    this.clipAudios.forEach((audio) => {
      if (!audio.paused) {
        try {
          audio.pause();
        } catch (e) {}
      }
      try {
        audio.currentTime = 0;
      } catch (e) {}
    });
  }

  seek(time: number) {
    if (this.audioEl) {
      try {
        this.audioEl.currentTime = time;
      } catch (e) {
        // ignore
      }
    }
  }

  playTheme(theme: 'lofi' | 'cinematic' | 'upbeat' | 'nature' | 'none', volume = 0.5) {
    if (theme === 'none') {
      this.stop();
      return;
    }
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();
    this.currentTheme = theme;
    this.isPlaying = true;
    this.setVolume(volume);

    let step = 0;
    const lofiChords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];

    const cinematicChords = [
      [130.81, 196.00, 261.63, 311.13], // C minor deep
      [116.54, 174.61, 233.08, 293.66], // Bb major deep
      [103.83, 155.56, 207.65, 261.63], // Ab major deep
      [98.00, 146.83, 196.00, 246.94],  // G deep
    ];

    const chords = theme === 'cinematic' ? cinematicChords : lofiChords;

    const playChordStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const currentChord = chords[step % chords.length];
      const now = this.ctx.currentTime;

      currentChord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = theme === 'cinematic' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(theme === 'cinematic' ? 450 : 600, now);

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 3.0);
      });

      step++;
      this.timer = window.setTimeout(playChordStep, 2400);
    };

    playChordStep();
  }

  /**
   * Schedules synthetic theme chords directly into an export AudioContext destination node
   */
  renderThemeToContext(
    ctx: AudioContext,
    destination: AudioNode,
    theme: 'lofi' | 'cinematic' | 'upbeat' | 'nature',
    volume: number,
    duration: number
  ) {
    const lofiChords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];

    const cinematicChords = [
      [130.81, 196.00, 261.63, 311.13], // C minor deep
      [116.54, 174.61, 233.08, 293.66], // Bb major deep
      [103.83, 155.56, 207.65, 261.63], // Ab major deep
      [98.00, 146.83, 196.00, 246.94],  // G deep
    ];

    const chords = theme === 'cinematic' ? cinematicChords : lofiChords;
    const stepDuration = 2.4;
    const themeGain = ctx.createGain();
    themeGain.gain.setValueAtTime(Math.max(0, Math.min(1.5, volume)), ctx.currentTime);
    themeGain.connect(destination);

    let step = 0;
    for (let t = 0; t < duration; t += stepDuration) {
      const currentChord = chords[step % chords.length];
      const chordStart = ctx.currentTime + t;

      currentChord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = theme === 'cinematic' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, chordStart);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(theme === 'cinematic' ? 450 : 600, chordStart);

        noteGain.gain.setValueAtTime(0, chordStart);
        noteGain.gain.linearRampToValueAtTime(0.08 / (idx + 1), chordStart + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, chordStart + 2.8);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(themeGain);

        osc.start(chordStart);
        osc.stop(chordStart + 3.0);
      });
      step++;
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.pauseAllClips();
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.stopAllClips();
  }

  getAudioContext(): AudioContext | null {
    return this.ctx;
  }
}

export const musicPlayer = new BackgroundMusicPlayer();
