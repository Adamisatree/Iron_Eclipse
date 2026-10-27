import { ProfileService } from './ProfileService';
import { SettingsService } from './SettingsService';
import { AudioService } from './AudioService';
import { LanDiscoveryService } from '../network/LanDiscoveryService';
import { LobbyService } from '../network/LobbyService';
import { NetworkSessionManager } from '../network/NetworkSessionManager';
export class GameBootstrapper {
    constructor() {
        Object.defineProperty(this, "profile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ProfileService()
        });
        Object.defineProperty(this, "settings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new SettingsService()
        });
        Object.defineProperty(this, "audio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new AudioService()
        });
        Object.defineProperty(this, "discovery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new LanDiscoveryService()
        });
        Object.defineProperty(this, "lobby", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new LobbyService()
        });
        Object.defineProperty(this, "network", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new NetworkSessionManager(this.profile, this.discovery, this.lobby)
        });
    }
    async init() {
        this.audio.init();
        this.discovery.start();
        // apply settings
        console.log('[Iron Eclipse] Bootstrapper init, player:', this.profile.profile.name, 'level', this.profile.profile.level);
        // version check
        const v = '0.9.0';
        window.__IRON_ECLIPSE_VERSION__ = v;
        window.__BUILD_HASH__ = 'd555555';
    }
}
