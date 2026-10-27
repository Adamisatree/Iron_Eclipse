export class AudioService {
    constructor() {
        Object.defineProperty(this, "ctx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "masterGain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "sfxGain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "musicGain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "musicOsc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.8;
            this.sfxGain.gain.value = 0.9;
            this.musicGain.gain.value = 0.3;
        }
        catch { }
    }
    resume() { this.ctx?.resume(); }
    setVolumes(master, sfx, music) {
        if (this.masterGain)
            this.masterGain.gain.value = master;
        if (this.sfxGain)
            this.sfxGain.gain.value = sfx;
        if (this.musicGain)
            this.musicGain.gain.value = music;
    }
    playSfx(freq, dur = 0.2, type = 'square', vol = 0.25) {
        if (!this.ctx || !this.sfxGain)
            return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = vol;
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.stop(this.ctx.currentTime + dur);
    }
    playShot(isRail = false) {
        if (isRail) {
            this.playSfx(180, 0.25, 'sawtooth', 0.4);
            setTimeout(() => this.playSfx(440, 0.15, 'sine', 0.3), 80);
        }
        else {
            this.playSfx(120 + Math.random() * 40, 0.08, 'square', 0.35);
        }
    }
    playHit() { this.playSfx(880, 0.07, 'triangle', 0.4); }
    playBoost() { this.playSfx(60, 0.5, 'sawtooth', 0.25); }
    playStep() { this.playSfx(80, 0.1, 'square', 0.15); }
    playOverheat() { this.playSfx(220, 0.8, 'sawtooth', 0.3); }
    startMusic() {
        if (!this.ctx || this.musicGain || this.musicOsc)
            return;
        // simple drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 55;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start();
        this.musicOsc = osc;
    }
    stopMusic() {
        try {
            this.musicOsc?.stop();
        }
        catch { }
        this.musicOsc = null;
    }
}
