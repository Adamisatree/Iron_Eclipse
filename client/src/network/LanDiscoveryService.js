export class LanDiscoveryService {
    constructor() {
        Object.defineProperty(this, "rooms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "isHost", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "interval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        // simulation of UDP broadcast via localStorage + BroadcastChannel if available, plus WebSocket
        Object.defineProperty(this, "bc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "hostRoom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    start() {
        try {
            this.bc = new BroadcastChannel('iron-eclipse-discovery');
        }
        catch {
            this.bc = null;
        }
        if (this.bc) {
            this.bc.onmessage = (ev) => {
                const msg = ev.data;
                if (msg.type === 'ROOM_ANNOUNCE') {
                    this.handleAnnounce(msg.room);
                }
                else if (msg.type === 'DISCOVER_REQ') {
                    if (this.isHost && this.hostRoom)
                        this.broadcast(this.hostRoom);
                }
            };
        }
        // periodic cleanup
        setInterval(() => this.cleanup(), 5000);
        // local poll every 2s
        this.interval = setInterval(() => this.sendDiscover(), 2000);
        this.sendDiscover();
    }
    stop() { if (this.interval)
        clearInterval(this.interval); }
    becomeHost(room) {
        this.isHost = true;
        this.hostRoom = room;
        // broadcast immediately and every 2s
        this.broadcast(room);
        setInterval(() => { if (this.hostRoom)
            this.broadcast(this.hostRoom); }, 2000);
    }
    leaveHost() { this.isHost = false; this.hostRoom = null; }
    broadcast(room) {
        room.lastSeen = Date.now();
        this.rooms.set(room.roomId, room);
        this.notify();
        try {
            this.bc?.postMessage({ type: 'ROOM_ANNOUNCE', room });
        }
        catch { }
        // also attempt websocket announce if connected
        window.dispatchEvent(new CustomEvent('iron:room-announce', { detail: room }));
    }
    sendDiscover() {
        try {
            this.bc?.postMessage({ type: 'DISCOVER_REQ' });
        }
        catch { }
        window.dispatchEvent(new CustomEvent('iron:discover-req'));
        // if websocket available, server will push rooms
    }
    handleAnnounce(room) {
        room.lastSeen = Date.now();
        this.rooms.set(room.roomId, room);
        this.notify();
    }
    handleRoomList(list) {
        for (const r of list) {
            r.lastSeen = Date.now();
            this.rooms.set(r.roomId, r);
        }
        this.notify();
    }
    cleanup() {
        const now = Date.now();
        for (const [k, v] of this.rooms)
            if (now - v.lastSeen > 12000)
                this.rooms.delete(k);
        this.notify();
    }
    notify() {
        const arr = [...this.rooms.values()].sort((a, b) => b.lastSeen - a.lastSeen);
        this.listeners.forEach(fn => fn(arr));
    }
    onRooms(fn) { this.listeners.push(fn); fn([...this.rooms.values()]); }
    // helpers for direct IP
    getRoomById(id) { return this.rooms.get(id); }
}
