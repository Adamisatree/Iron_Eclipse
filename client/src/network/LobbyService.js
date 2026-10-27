export class LobbyService {
    constructor() {
        Object.defineProperty(this, "state", {
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
        Object.defineProperty(this, "chatListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "chatLog", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    setState(s) {
        this.state = s;
        this.listeners.forEach(fn => fn(s));
    }
    onState(fn) { this.listeners.push(fn); if (this.state)
        fn(this.state); }
    onChat(fn) { this.chatListeners.push(fn); }
    pushChat(from, text) {
        const e = { from, text, time: Date.now() };
        this.chatLog.push(e);
        this.chatListeners.forEach(fn => fn(e));
    }
    // local helpers when acting as Host
    createRoom(roomId, roomName, mapId, modeId, hostPlayer) {
        const s = { roomId, roomName, mapId, modeId, maxPlayers: 6, hasPassword: false, players: [hostPlayer], hostId: hostPlayer.id, started: false, seed: Math.floor(Math.random() * 1e9) };
        this.setState(s);
        return s;
    }
    addPlayer(p) {
        if (!this.state)
            return;
        this.state.players.push(p);
        this.setState(this.state);
    }
    removePlayer(id) {
        if (!this.state)
            return;
        this.state.players = this.state.players.filter(p => p.id !== id);
        this.setState(this.state);
    }
    setReady(id, ready) {
        if (!this.state)
            return;
        const pl = this.state.players.find(p => p.id === id);
        if (pl)
            pl.ready = ready;
        this.setState(this.state);
    }
    switchTeam(id) {
        if (!this.state)
            return;
        const pl = this.state.players.find(p => p.id === id);
        if (pl) {
            pl.team = pl.team === 'A' ? 'B' : 'A';
        }
        this.setState(this.state);
    }
    setLoadout(id, mechId) {
        if (!this.state)
            return;
        const pl = this.state.players.find(p => p.id === id);
        if (pl)
            pl.mechId = mechId;
        this.setState(this.state);
    }
    canStart() {
        if (!this.state)
            return false;
        const readyCount = this.state.players.filter(p => p.ready || p.isHost).length;
        return readyCount >= 2 && readyCount === this.state.players.length;
    }
}
