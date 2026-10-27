const KEY = 'iron-eclipse-settings-v1';
export class SettingsService {
    constructor() {
        Object.defineProperty(this, "settings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const raw = localStorage.getItem(KEY);
        this.settings = raw ? JSON.parse(raw) : this.defaults();
    }
    defaults() {
        // auto-detect Intel Mac low
        const ua = navigator.userAgent;
        const isIntelMac = ua.includes('Intel Mac');
        return {
            quality: isIntelMac ? 'Low' : 'High',
            fov: 80,
            vsync: true,
            mouseSensitivity: 1.0,
            gamepadSensitivity: 1.0,
            masterVolume: 0.8,
            sfxVolume: 0.9,
            musicVolume: 0.6,
            subtitles: true,
            colorBlind: false,
            screenShake: true,
            dynamicRangeCompression: false,
            crosshair: 0,
            language: 'zh'
        };
    }
    save() { localStorage.setItem(KEY, JSON.stringify(this.settings)); }
    applyQuality(renderer) {
        // adjust renderer settings based on quality
        if (!renderer)
            return;
        const q = this.settings.quality;
        if (q === 'Low') {
            renderer.shadowMap.enabled = false;
        }
        else {
            renderer.shadowMap.enabled = true;
        }
    }
}
