export interface RoomAnnounce {
  roomId: string;
  roomName: string;
  hostIp: string;
  gamePort: number;
  protocolVersion: string;
  buildHash: string;
  currentPlayers: number;
  maxPlayers: number;
  mapId: string;
  modeId: string;
  hasPassword: boolean;
  hostName: string;
  lastSeen: number;
}

export class LanDiscoveryService {
  rooms: Map<string, RoomAnnounce> = new Map();
  isHost = false;
  private interval: any = null;
  private listeners: ((rooms: RoomAnnounce[])=>void)[] = [];

  // simulation of UDP broadcast via localStorage + BroadcastChannel if available, plus WebSocket
  private bc: BroadcastChannel | null = null;

  start() {
    try { this.bc = new BroadcastChannel('iron-eclipse-discovery'); } catch { this.bc = null; }
    if (this.bc) {
      this.bc.onmessage = (ev) => {
        const msg = ev.data;
        if (msg.type === 'ROOM_ANNOUNCE') {
          this.handleAnnounce(msg.room);
        } else if (msg.type === 'DISCOVER_REQ') {
          if (this.isHost && this.hostRoom) this.broadcast(this.hostRoom);
        }
      };
    }
    // periodic cleanup
    setInterval(()=> this.cleanup(), 5000);
    // local poll every 2s
    this.interval = setInterval(()=> this.sendDiscover(), 2000);
    this.sendDiscover();
  }

  stop() { if (this.interval) clearInterval(this.interval); }

  private hostRoom: RoomAnnounce | null = null;

  becomeHost(room: RoomAnnounce) {
    this.isHost = true;
    this.hostRoom = room;
    // broadcast immediately and every 2s
    this.broadcast(room);
    setInterval(()=> { if (this.hostRoom) this.broadcast(this.hostRoom); }, 2000);
  }

  leaveHost() { this.isHost = false; this.hostRoom = null; }

  private broadcast(room: RoomAnnounce) {
    room.lastSeen = Date.now();
    this.rooms.set(room.roomId, room);
    this.notify();
    try { this.bc?.postMessage({ type: 'ROOM_ANNOUNCE', room }); } catch {}
    // also attempt websocket announce if connected
    window.dispatchEvent(new CustomEvent('iron:room-announce', { detail: room }));
  }

  sendDiscover() {
    try { this.bc?.postMessage({ type: 'DISCOVER_REQ' }); } catch {}
    window.dispatchEvent(new CustomEvent('iron:discover-req'));
    // if websocket available, server will push rooms
  }

  handleAnnounce(room: RoomAnnounce) {
    room.lastSeen = Date.now();
    this.rooms.set(room.roomId, room);
    this.notify();
  }

  handleRoomList(list: RoomAnnounce[]) {
    for (const r of list) { r.lastSeen = Date.now(); this.rooms.set(r.roomId, r); }
    this.notify();
  }

  private cleanup() {
    const now = Date.now();
    for (const [k,v] of this.rooms) if (now - v.lastSeen > 12000) this.rooms.delete(k);
    this.notify();
  }

  private notify() {
    const arr = [...this.rooms.values()].sort((a,b)=> b.lastSeen - a.lastSeen);
    this.listeners.forEach(fn=> fn(arr));
  }

  onRooms(fn: (rooms: RoomAnnounce[])=>void) { this.listeners.push(fn); fn([...this.rooms.values()]); }

  // helpers for direct IP
  getRoomById(id: string) { return this.rooms.get(id); }
}
