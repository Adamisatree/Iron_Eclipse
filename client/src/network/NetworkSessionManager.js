export class NetworkSessionManager {
    constructor(profile, discovery, lobby) {
        Object.defineProperty(this, "profile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: profile
        });
        Object.defineProperty(this, "discovery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: discovery
        });
        Object.defineProperty(this, "lobby", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: lobby
        });
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'disconnected'
        });
        Object.defineProperty(this, "ws", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "sessionToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Math.random().toString(36).slice(2, 12)
        });
        Object.defineProperty(this, "protocolVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '1.0.0'
        });
        Object.defineProperty(this, "buildHash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'd555555'
        });
        Object.defineProperty(this, "isHost", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "hostRoom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "heartbeat", {
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
        window.addEventListener('iron:room-announce', (e) => {
            if (this.ws?.readyState === 1)
                this.ws.send(JSON.stringify({ type: 'ROOM_ANNOUNCE', room: e.detail }));
        });
    }
    onState(fn) { this.listeners.push(fn); }
    setState(s) { this.state = s; this.listeners.forEach(fn => fn(s)); }
    // Host
    async startHost(roomName, mapId, modeId, hasPassword = false, password = '') {
        this.isHost = true;
        this.setState('lobby');
        const roomId = 'room-' + Math.random().toString(36).slice(2, 7);
        const room = {
            roomId, roomName, hostIp: location.hostname || '127.0.0.1',
            gamePort: 27015, protocolVersion: this.protocolVersion, buildHash: this.buildHash,
            currentPlayers: 1, maxPlayers: 6, mapId, modeId, hasPassword, hostName: this.profile.profile.name,
            lastSeen: Date.now()
        };
        this.hostRoom = room;
        this.discovery.becomeHost(room);
        // local lobby
        this.lobby.createRoom(roomId, roomName, mapId, modeId, {
            id: this.profile.profile.playerId, name: this.profile.profile.name, team: 'A', mechId: this.profile.profile.selectedMech, ready: false, isHost: true, ping: 0
        });
        // also try to connect to server as host for cross-device
        this.connectToServer(`Host:${roomId}`, true, room);
        return room;
    }
    // Client join via discovery
    async joinRoom(roomId) {
        const room = this.discovery.getRoomById(roomId);
        if (!room)
            throw new Error('Room not found');
        this.isHost = false;
        this.connectToServer(roomId, false);
    }
    // Direct IP (simulation)
    async joinDirect(ip) {
        this.connectToServer(ip, false);
    }
    getServerUrl() {
        // In preview, server runs on same host port 27015 via proxy
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Try to connect to local server if available, else loopback
        // Use relative host with port 27015? In dev we proxy via vite.
        // We attempt multiple URLs
        if (location.hostname.includes('e2b.dev') || location.hostname.includes('e2b.app')) {
            // preview environment - server port forwarded via 27015 subdomain? fallback to in-memory
            return `${proto}//${location.hostname.replace(/5173/, '27015')}/`;
        }
        return `${proto}//${location.hostname}:27015`;
    }
    connectToServer(target, asHost, hostRoom) {
        this.setState('connecting');
        let url = this.getServerUrl();
        // fallback: try same origin ws
        const fallbackUrls = [url, `ws://${location.hostname}:27015`, `ws://localhost:27015`];
        this.tryConnect(fallbackUrls, 0, target, asHost, hostRoom);
    }
    tryConnect(urls, idx, target, asHost, hostRoom) {
        if (idx >= urls.length) {
            // No server available -> operate in local P2P mode (BroadcastChannel only)
            console.warn('[Network] No server reachable, using local offline lobby');
            this.setState('lobby');
            return;
        }
        const url = urls[idx];
        try {
            const ws = new WebSocket(url);
            this.ws = ws;
            ws.onopen = () => {
                console.log('[Network] connected to', url);
                this.setState('lobby');
                ws.send(JSON.stringify({
                    type: 'HELLO',
                    token: this.sessionToken,
                    name: this.profile.profile.name,
                    playerId: this.profile.profile.playerId,
                    version: this.protocolVersion,
                    buildHash: this.buildHash,
                    target,
                    asHost,
                    hostRoom
                }));
                this.heartbeat = setInterval(() => { if (ws.readyState === 1)
                    ws.send(JSON.stringify({ type: 'PING', t: Date.now() })); }, 4000);
            };
            ws.onmessage = (ev) => this.handleMessage(ev.data);
            ws.onclose = () => {
                clearInterval(this.heartbeat);
                if (this.state !== 'disconnected') {
                    console.warn('[Network] closed, trying fallback');
                    this.tryConnect(urls, idx + 1, target, asHost, hostRoom);
                }
            };
            ws.onerror = () => {
                ws.close();
            };
        }
        catch (e) {
            this.tryConnect(urls, idx + 1, target, asHost, hostRoom);
        }
    }
    handleMessage(raw) {
        try {
            const msg = JSON.parse(raw);
            switch (msg.type) {
                case 'WELCOME':
                    this.sessionToken = msg.token;
                    break;
                case 'LOBBY_STATE':
                    this.lobby.setState(msg.state);
                    break;
                case 'ROOM_LIST':
                    this.discovery.handleRoomList(msg.rooms);
                    break;
                case 'ROOM_ANNOUNCE':
                    this.discovery.handleAnnounce(msg.room);
                    break;
                case 'CHAT':
                    this.lobby.pushChat(msg.from, msg.text);
                    break;
                case 'START_MATCH':
                    window.dispatchEvent(new CustomEvent('iron:start-match', { detail: msg }));
                    this.setState('in-match');
                    break;
                case 'SNAPSHOT':
                case 'HIT_CONFIRM':
                case 'MATCH_EVENT':
                    window.dispatchEvent(new CustomEvent('iron:net', { detail: msg }));
                    break;
                case 'PONG':
                    break;
                case 'ERROR':
                    alert(msg.message);
                    break;
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    send(type, payload = {}) {
        if (this.ws?.readyState === 1)
            this.ws.send(JSON.stringify({ type, ...payload }));
        else {
            // local handling
            if (type === 'SET_READY')
                this.lobby.setReady(this.profile.profile.playerId, payload.ready);
            if (type === 'SWITCH_TEAM')
                this.lobby.switchTeam(this.profile.profile.playerId);
            if (type === 'SET_LOADOUT')
                this.lobby.setLoadout(this.profile.profile.playerId, payload.mechId);
            if (type === 'CHAT')
                this.lobby.pushChat(this.profile.profile.name, payload.text);
            if (type === 'START_MATCH') {
                window.dispatchEvent(new CustomEvent('iron:start-match', { detail: { seed: this.lobby.state?.seed, mapId: this.lobby.state?.mapId, modeId: this.lobby.state?.modeId } }));
                this.setState('in-match');
            }
        }
    }
    disconnect() {
        try {
            this.ws?.close();
        }
        catch { }
        this.ws = null;
        this.setState('disconnected');
        this.isHost = false;
        this.discovery.leaveHost();
    }
    // Host kick
    kick(playerId) { this.send('KICK', { playerId }); }
}
