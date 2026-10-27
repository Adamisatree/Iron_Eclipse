export type Quality = 'Low' | 'Medium' | 'High' | 'Ultra';
export type GraphicsAPI = 'auto' | 'webgl2';

export interface Settings {
  quality: Quality;
  fov: number;
  vsync: boolean;
  mouseSensitivity: number;
  gamepadSensitivity: number;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  subtitles: boolean;
  colorBlind: boolean;
  screenShake: boolean;
  dynamicRangeCompression: boolean;
  crosshair: number;
  language: 'zh' | 'en';
}

const KEY = 'iron-eclipse-settings-v1';

export class SettingsService {
  settings: Settings;

  constructor() {
    const raw = localStorage.getItem(KEY);
    this.settings = raw ? JSON.parse(raw) : this.defaults();
  }

  defaults(): Settings {
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

  applyQuality(renderer: any) {
    // adjust renderer settings based on quality
    if (!renderer) return;
    const q = this.settings.quality;
    if (q === 'Low') {
      renderer.shadowMap.enabled = false;
    } else {
      renderer.shadowMap.enabled = true;
    }
  }
}
