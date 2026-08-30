// Web Audio Engine for OZI Webtoon Studio
// Provides synthesized immersive ambient OSTs for presets and real-time audio streaming/playback
// Supports soundwave visualization, loop, and auto-scroll synchronization

import { AmbientAudioPreset } from '../types';

export class AmbientAudioEngine {
  private static instance: AmbientAudioEngine | null = null;
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private currentSource: AudioNode | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private activePreset: AmbientAudioPreset = 'none';
  private isCurrentlyPlaying: boolean = false;
  private synthIntervalId: number | null = null;
  private currentVolume: number = 0.7;
  private isLooping: boolean = true;
  private listeners: Set<(isPlaying: boolean) => void> = new Set();

  private constructor() {
    // Lazy init audio context on user interaction
  }

  public static getInstance(): AmbientAudioEngine {
    if (!AmbientAudioEngine.instance) {
      AmbientAudioEngine.instance = new AmbientAudioEngine();
    }
    return AmbientAudioEngine.instance;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
      
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public subscribeState(callback: (isPlaying: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isCurrentlyPlaying);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.isCurrentlyPlaying));
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setTargetAtTime(this.currentVolume, this.audioCtx.currentTime, 0.05);
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.currentVolume;
    }
  }

  public setLoop(loop: boolean) {
    this.isLooping = loop;
    if (this.customAudioElement) {
      this.customAudioElement.loop = loop;
    }
  }

  public stop() {
    this.isCurrentlyPlaying = false;

    if (this.synthIntervalId !== null) {
      window.clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }

    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement.currentTime = 0;
      this.customAudioElement = null;
    }

    if (this.currentSource) {
      try {
        (this.currentSource as AudioBufferSourceNode).stop?.();
        this.currentSource.disconnect();
      } catch {
        // Source might already be stopped
      }
      this.currentSource = null;
    }

    this.notifyListeners();
  }

  public pause() {
    if (!this.isCurrentlyPlaying) return;
    this.isCurrentlyPlaying = false;

    if (this.customAudioElement) {
      this.customAudioElement.pause();
    }

    if (this.synthIntervalId !== null) {
      window.clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }

    this.notifyListeners();
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public getCurrentPreset(): AmbientAudioPreset {
    return this.activePreset;
  }

  public async playCustomUrl(url: string, volume: number = 0.7, loop: boolean = true) {
    this.stop();
    this.initAudioContext();
    this.currentVolume = volume;
    this.isLooping = loop;
    this.activePreset = 'none';

    try {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = url;
      audio.loop = loop;
      audio.volume = this.currentVolume;

      // Connect to Web Audio Analyser if possible
      if (this.audioCtx && this.gainNode) {
        try {
          const source = this.audioCtx.createMediaElementSource(audio);
          source.connect(this.gainNode);
        } catch {
          // Cross-origin fallback without WebAudio node
        }
      }

      this.customAudioElement = audio;
      await audio.play();
      this.isCurrentlyPlaying = true;
      this.notifyListeners();
    } catch {
      // Fallback: generate high-quality ambient synth if remote URL fails or CORS blocks
      console.warn('Audio streaming blocked or format unsupported, falling back to dynamic atmospheric synthesis.');
      this.playPreset('mystery_suspense', volume, loop);
    }
  }

  public playPreset(preset: AmbientAudioPreset, volume: number = 0.7, loop: boolean = true) {
    if (preset === 'none') {
      this.stop();
      return;
    }

    this.stop();
    const ctx = this.initAudioContext();
    this.currentVolume = volume;
    this.isLooping = loop;
    this.activePreset = preset;
    this.isCurrentlyPlaying = true;
    this.notifyListeners();

    switch (preset) {
      case 'epic_action':
        this.startEpicActionSynth(ctx);
        break;
      case 'romance_soft':
        this.startRomanceSynth(ctx);
        break;
      case 'mystery_suspense':
        this.startMysterySynth(ctx);
        break;
      case 'cyberpunk_urban':
        this.startCyberpunkSynth(ctx);
        break;
      case 'traditional_fantasy':
        this.startTraditionalSynth(ctx);
        break;
    }
  }

  // 1. Épique / Action : Cuivres puissants, tambours de guerre rythmés et tension cinématique
  private startEpicActionSynth(ctx: AudioContext) {
    let step = 0;
    const bassNotes = [65.41, 73.42, 82.41, 55.0]; // C2, D2, E2, A1
    const brassNotes = [130.81, 196.0, 261.63, 329.63];

    const playLoopStep = () => {
      if (!this.isCurrentlyPlaying || !this.gainNode) return;
      const now = ctx.currentTime;

      // War Drum Impact
      if (step % 2 === 0) {
        const osc = ctx.createOscillator();
        const drumGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

        drumGain.gain.setValueAtTime(0.6 * this.currentVolume, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(drumGain);
        drumGain.connect(this.gainNode);
        osc.start(now);
        osc.stop(now + 0.45);
      }

      // Epic Brass Chord
      if (step % 4 === 0) {
        const rootFreq = bassNotes[(step / 4) % bassNotes.length];
        [1, 1.5, 2].forEach(mult => {
          const osc = ctx.createOscillator();
          const brassGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(rootFreq * mult, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, now);
          filter.frequency.exponentialRampToValueAtTime(2400, now + 0.5);
          filter.frequency.exponentialRampToValueAtTime(800, now + 1.8);

          brassGain.gain.setValueAtTime(0.001, now);
          brassGain.gain.linearRampToValueAtTime(0.25 * this.currentVolume, now + 0.15);
          brassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

          osc.connect(filter);
          filter.connect(brassGain);
          brassGain.connect(this.gainNode!);
          osc.start(now);
          osc.stop(now + 2.0);
        });
      }

      // Fast tension hi-hat / cymbal tick
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 6000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08 * this.currentVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.gainNode);
      whiteNoise.start(now);

      step++;
    };

    playLoopStep();
    this.synthIntervalId = window.setInterval(playLoopStep, 250);
  }

  // 2. Romance / Douceur : Piano chaleureux, cordes émotionnelles et nappe céleste
  private startRomanceSynth(ctx: AudioContext) {
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7 (C4, E4, G4, B4)
      [220.0, 261.63, 329.63, 392.0],  // Am7 (A3, C4, E4, G4)
      [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [196.0, 246.94, 293.66, 392.0]   // Gsus4 -> G (G3, B3, D4, G4)
    ];
    let chordIndex = 0;

    const playChord = () => {
      if (!this.isCurrentlyPlaying || !this.gainNode) return;
      const currentChord = chords[chordIndex % chords.length];
      const now = ctx.currentTime;

      // Warm String Pad
      currentChord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const chordGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        chordGain.gain.setValueAtTime(0.001, now);
        chordGain.gain.linearRampToValueAtTime(0.18 * this.currentVolume, now + 0.8 + idx * 0.1);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.connect(chordGain);
        chordGain.connect(this.gainNode!);
        osc.start(now);
        osc.stop(now + 4.0);
      });

      // Melodic Piano Arpeggio
      currentChord.forEach((freq, i) => {
        const noteTime = now + (i * 0.45);
        const osc = ctx.createOscillator();
        const pGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 2, noteTime); // Octave higher

        pGain.gain.setValueAtTime(0.001, noteTime);
        pGain.gain.linearRampToValueAtTime(0.15 * this.currentVolume, noteTime + 0.02);
        pGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.4);

        osc.connect(pGain);
        pGain.connect(this.gainNode!);
        osc.start(noteTime);
        osc.stop(noteTime + 1.5);
      });

      chordIndex++;
    };

    playChord();
    this.synthIntervalId = window.setInterval(playChord, 3500);
  }

  // 3. Mystère / Suspense : Sub-bass sombre, nappe detuned cinématique et battement angoissant
  private startMysterySynth(ctx: AudioContext) {
    let tick = 0;
    const playMysteryStep = () => {
      if (!this.isCurrentlyPlaying || !this.gainNode) return;
      const now = ctx.currentTime;

      // Dark Sub Drone
      if (tick % 8 === 0) {
        const droneOsc = ctx.createOscillator();
        const droneGain = ctx.createGain();
        droneOsc.type = 'sawtooth';
        droneOsc.frequency.setValueAtTime(45, now); // F#1

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now);
        filter.frequency.linearRampToValueAtTime(260, now + 2.5);
        filter.frequency.linearRampToValueAtTime(140, now + 5.0);

        droneGain.gain.setValueAtTime(0.001, now);
        droneGain.gain.linearRampToValueAtTime(0.28 * this.currentVolume, now + 1.2);
        droneGain.gain.exponentialRampToValueAtTime(0.001, now + 5.8);

        droneOsc.connect(filter);
        filter.connect(droneGain);
        droneGain.connect(this.gainNode);
        droneOsc.start(now);
        droneOsc.stop(now + 6.0);
      }

      // Detuned Suspense Sine
      if (tick % 4 === 0) {
        [-3, 0, 4].forEach(detune => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(293.66 + detune, now); // D4

          g.gain.setValueAtTime(0.001, now);
          g.gain.linearRampToValueAtTime(0.12 * this.currentVolume, now + 0.6);
          g.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

          osc.connect(g);
          g.connect(this.gainNode!);
          osc.start(now);
          osc.stop(now + 3.0);
        });
      }

      // Clock tick tension
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tickOsc.type = 'sine';
      tickOsc.frequency.setValueAtTime(tick % 2 === 0 ? 1200 : 950, now);
      tickGain.gain.setValueAtTime(0.06 * this.currentVolume, now);
      tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      tickOsc.connect(tickGain);
      tickGain.connect(this.gainNode);
      tickOsc.start(now);
      tickOsc.stop(now + 0.04);

      tick++;
    };

    playMysteryStep();
    this.synthIntervalId = window.setInterval(playMysteryStep, 700);
  }

  // 4. Cyberpunk / Urbain : Bass synthwave 80s, arpeggiateur néon et groove électronique
  private startCyberpunkSynth(ctx: AudioContext) {
    let step = 0;
    const bassline = [55.0, 55.0, 65.41, 55.0, 73.42, 55.0, 49.0, 55.0]; // A1 groove
    const leadNotes = [220, 261.63, 329.63, 392.0, 440, 523.25, 392.0, 329.63];

    const playBeat = () => {
      if (!this.isCurrentlyPlaying || !this.gainNode) return;
      const now = ctx.currentTime;

      // Heavy Saw Bassline
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassline[step % bassline.length], now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + 0.16);

      bassGain.gain.setValueAtTime(0.3 * this.currentVolume, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.gainNode);
      bassOsc.start(now);
      bassOsc.stop(now + 0.2);

      // Neon Synth Arp
      if (step % 2 === 0) {
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadNotes[(step / 2) % leadNotes.length] * 2, now);

        leadGain.gain.setValueAtTime(0.08 * this.currentVolume, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        leadOsc.connect(leadGain);
        leadGain.connect(this.gainNode);
        leadOsc.start(now);
        leadOsc.stop(now + 0.28);
      }

      // Cyber Kick on 1 and 3
      if (step % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        kickGain.gain.setValueAtTime(0.5 * this.currentVolume, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(this.gainNode);
        kickOsc.start(now);
        kickOsc.stop(now + 0.18);
      }

      step++;
    };

    playBeat();
    this.synthIntervalId = window.setInterval(playBeat, 180);
  }

  // 5. Traditionnel / Fantastique : Kalimba afro-fantastique, flûtes douces et percussion bois
  private startTraditionalSynth(ctx: AudioContext) {
    let step = 0;
    const kalimbaScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]; // Pentatonic / Major afro scale
    const melodyPattern = [0, 2, 4, 1, 3, 5, 2, 6, 4, 1, 0, 3];

    const playStep = () => {
      if (!this.isCurrentlyPlaying || !this.gainNode) return;
      const now = ctx.currentTime;

      // Kalimba / Mbira Wooden Strike
      const noteFreq = kalimbaScale[melodyPattern[step % melodyPattern.length]];
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(noteFreq * 2.01, now); // Metallic overtone

      noteGain.gain.setValueAtTime(0.24 * this.currentVolume, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(noteGain);
      subOsc.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 0.65);
      subOsc.stop(now + 0.65);

      // Wooden Djembe Heartbeat
      if (step % 3 === 0) {
        const drumOsc = ctx.createOscillator();
        const drumGain = ctx.createGain();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(90, now);
        drumOsc.frequency.exponentialRampToValueAtTime(48, now + 0.2);

        drumGain.gain.setValueAtTime(0.35 * this.currentVolume, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        drumOsc.connect(drumGain);
        drumGain.connect(this.gainNode);
        drumOsc.start(now);
        drumOsc.stop(now + 0.3);
      }

      step++;
    };

    playStep();
    this.synthIntervalId = window.setInterval(playStep, 320);
  }

  // Soundwave / Frequency data for real-time animated wave rendering
  public getWaveformData(outputArray?: Uint8Array): Uint8Array {
    if (!this.analyserNode) {
      const empty = outputArray || new Uint8Array(32);
      if (this.isCurrentlyPlaying) {
        // Synthesize gentle wave if analyser is detached
        for (let i = 0; i < empty.length; i++) {
          empty[i] = 128 + Math.round(Math.sin(Date.now() * 0.01 + i * 0.4) * 45);
        }
      } else {
        empty.fill(128);
      }
      return empty;
    }

    const data = outputArray || new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }
}

export const ambientAudio = AmbientAudioEngine.getInstance();
