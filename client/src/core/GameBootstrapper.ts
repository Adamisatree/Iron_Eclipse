import { ProfileService } from './ProfileService';
import { SettingsService } from './SettingsService';
import { AudioService } from './AudioService';
import { LanDiscoveryService } from '../network/LanDiscoveryService';
import { LobbyService } from '../network/LobbyService';
import { NetworkSessionManager } from '../network/NetworkSessionManager';

export class GameBootstrapper {
  profile = new ProfileService();
  settings = new SettingsService();
  audio = new AudioService();
  discovery = new LanDiscoveryService();
  lobby = new LobbyService();
  network = new NetworkSessionManager(this.profile, this.discovery, this.lobby);

  async init() {
    this.audio.init();
    this.discovery.start();
    // apply settings
    console.log('[Iron Eclipse] Bootstrapper init, player:', this.profile.profile.name, 'level', this.profile.profile.level);
    // version check
    const v = '0.9.0';
    (window as any).__IRON_ECLIPSE_VERSION__ = v;
    (window as any).__BUILD_HASH__ = 'd555555';
  }
}
