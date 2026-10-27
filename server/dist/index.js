import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dgram from 'dgram';
import os from 'os';
import { LobbyService } from './LobbyService.js';
import { MatchDirector } from './MatchDirector.js';
const GAME_PORT = parseInt(process.env.GAME_PORT || '27015');
const DISCOVERY_PORT = parseInt(process.env.DISCOVERY_PORT || '27016');
const CONTROL_PORT = 27017;
// Host authority: whoever creates room is Host (server). LAN discovery via UDP broadcast.
function getLocalIPs() {
    const nets = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal)
                ips.push(net.address);
        }
    }
    return ips.length ? ips : ['127.0.0.1'];
}
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_, res) => res.json({ status: 'ok', version: '0.9.0', buildHash: 'd555555', protocol: '1.0.0', rooms: lobbies.size }));
app.get('/rooms', (_, res) => {
    const list = [...lobbies.values()].map(l => ({
        roomId: l.service.state.roomId,
        roomName: l.service.state.roomName,
        mapId: l.service.state.mapId,
        modeId: l.service.state.modeId,
        currentPlayers: l.service.state.players.length,
        maxPlayers: l.service.state.maxPlayers,
        hostName: l.service.state.players.find((p) => p.isHost)?.name || 'Host',
        protocolVersion: '1.0.0', buildHash: 'd555555', hasPassword: l.service.state.hasPassword, hostIp: '0.0.0.0', gamePort: GAME_PORT
    }));
    res.json(list);
});
app.use(express.static('public'));
const server = createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Map();
const lobbies = new Map();
function broadcastRoomList() {
    const list = [...lobbies.values()].map(l => ({
        roomId: l.service.state.roomId,
        roomName: l.service.state.roomName,
        mapId: l.service.state.mapId,
        modeId: l.service.state.modeId,
        currentPlayers: l.service.state.players.length,
        maxPlayers: l.service.state.maxPlayers,
        hostName: l.service.state.players.find((p) => p.isHost)?.name || 'Host',
        protocolVersion: '1.0.0', buildHash: 'd555555', hasPassword: l.service.state.hasPassword, hostIp: '0.0.0.0', gamePort: GAME_PORT,
        lastSeen: Date.now()
    }));
    const msg = JSON.stringify({ type: 'ROOM_LIST', rooms: list });
    wss.clients.forEach(c => { if (c.readyState === 1)
        c.send(msg); });
}
function broadcastLobby(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby)
        return;
    const msg = JSON.stringify({ type: 'LOBBY_STATE', state: lobby.service.state });
    lobby.clients.forEach(ws => { if (ws.readyState === 1)
        ws.send(msg); });
    broadcastRoomList();
}
wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[WS] connect ${ip} total=${wss.clients.size}`);
    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            handleMessage(ws, msg);
        }
        catch (e) {
            console.error(e);
        }
    });
    ws.on('close', () => {
        const c = clients.get(ws);
        if (c && c.lobbyId) {
            const lobby = lobbies.get(c.lobbyId);
            if (lobby) {
                lobby.service.removePlayer(c.id);
                lobby.clients.delete(ws);
                if (lobby.service.state.players.length === 0) {
                    lobbies.delete(c.lobbyId);
                    console.log(`[Lobby] removed empty ${c.lobbyId}`);
                }
                else {
                    broadcastLobby(c.lobbyId);
                }
                broadcastRoomList();
            }
        }
        clients.delete(ws);
    });
    // send initial room list
    const list = [...lobbies.values()].map(l => ({
        roomId: l.service.state.roomId,
        roomName: l.service.state.roomName,
        mapId: l.service.state.mapId,
        modeId: l.service.state.modeId,
        currentPlayers: l.service.state.players.length,
        maxPlayers: l.service.state.maxPlayers,
        hostName: l.service.state.players.find((p) => p.isHost)?.name || 'Host',
        protocolVersion: '1.0.0', buildHash: 'd555555', hasPassword: l.service.state.hasPassword, hostIp: '0.0.0.0', gamePort: GAME_PORT,
        lastSeen: Date.now()
    }));
    ws.send(JSON.stringify({ type: 'ROOM_LIST', rooms: list }));
});
function handleMessage(ws, msg) {
    switch (msg.type) {
        case 'HELLO': {
            // version check
            if (msg.version !== '1.0.0' || msg.buildHash !== 'd555555') {
                ws.send(JSON.stringify({ type: 'ERROR', message: `版本不一致: 期望 1.0.0/d555555, 收到 ${msg.version}/${msg.buildHash}` }));
                return;
            }
            const client = {
                ws, id: msg.playerId || ('player-' + Math.random().toString(36).slice(2, 7)),
                name: msg.name || '机师',
                token: msg.token || Math.random().toString(36).slice(2, 12),
                lobbyId: null, lastPing: Date.now(), ping: 12 + Math.floor(Math.random() * 18)
            };
            clients.set(ws, client);
            ws.send(JSON.stringify({ type: 'WELCOME', token: client.token, id: client.id }));
            if (msg.asHost && msg.hostRoom) {
                // create lobby
                const lobbyId = msg.hostRoom.roomId;
                const svc = new LobbyService();
                svc.createRoom(lobbyId, msg.hostRoom.roomName, msg.hostRoom.mapId, msg.hostRoom.modeId, { id: client.id, name: client.name, team: 'A', mechId: 'tuf-01', ready: false, isHost: true, ping: client.ping });
                const director = new MatchDirector();
                lobbies.set(lobbyId, { service: svc, director, clients: new Set([ws]) });
                client.lobbyId = lobbyId;
                broadcastLobby(lobbyId);
                console.log(`[Lobby] created ${lobbyId} by ${client.name}`);
            }
            else if (msg.target) {
                // join existing
                const lobby = lobbies.get(msg.target);
                if (!lobby) {
                    ws.send(JSON.stringify({ type: 'ERROR', message: '房间不存在或已关闭' }));
                    return;
                }
                if (lobby.service.state.players.length >= lobby.service.state.maxPlayers) {
                    ws.send(JSON.stringify({ type: 'ERROR', message: '房间已满' }));
                    return;
                }
                // add player
                lobby.service.addPlayer({ id: client.id, name: client.name, team: 'B', mechId: 'mff-01', ready: false, isHost: false, ping: client.ping });
                lobby.clients.add(ws);
                client.lobbyId = msg.target;
                broadcastLobby(msg.target);
                console.log(`[Lobby] ${client.name} joined ${msg.target}`);
            }
            break;
        }
        case 'SET_READY': {
            const c = clients.get(ws);
            if (!c || !c.lobbyId)
                return;
            const lobby = lobbies.get(c.lobbyId);
            lobby.service.setReady(c.id, !!msg.ready);
            broadcastLobby(c.lobbyId);
            break;
        }
        case 'SWITCH_TEAM': {
            const c = clients.get(ws);
            if (!c || !c.lobbyId)
                return;
            const lobby = lobbies.get(c.lobbyId);
            lobby.service.switchTeam(c.id);
            broadcastLobby(c.lobbyId);
            break;
        }
        case 'SET_LOADOUT': {
            const c = clients.get(ws);
            if (!c || !c.lobbyId)
                return;
            const lobby = lobbies.get(c.lobbyId);
            lobby.service.setLoadout(c.id, msg.mechId);
            broadcastLobby(c.lobbyId);
            break;
        }
        case 'CHAT': {
            const c = clients.get(ws);
            if (!c || !c.lobbyId)
                return;
            const lobby = lobbies.get(c.lobbyId);
            const data = { type: 'CHAT', from: c.name, text: msg.text, time: Date.now() };
            lobby.clients.forEach(w => { if (w.readyState === 1)
                w.send(JSON.stringify(data)); });
            break;
        }
        case 'START_MATCH': {
            const c = clients.get(ws);
            if (!c || !c.lobbyId)
                return;
            const lobby = lobbies.get(c.lobbyId);
            if (lobby.service.state.players.length < 2 && lobby.service.state.players[0]?.id !== c.id) {
                ws.send(JSON.stringify({ type: 'ERROR', message: '至少需要2名玩家' }));
                return;
            }
            lobby.service.state.started = true;
            lobby.service.state.seed = Math.floor(Math.random() * 1e9);
            const data = { type: 'START_MATCH', seed: lobby.service.state.seed, mapId: lobby.service.state.mapId, modeId: lobby.service.state.modeId, lobbyId: c.lobbyId };
            lobby.clients.forEach(w => { if (w.readyState === 1)
                w.send(JSON.stringify(data)); });
            lobby.director.start(lobby.service.state.modeId, lobby.service.state.mapId);
            console.log(`[Match] start ${c.lobbyId} seed ${lobby.service.state.seed}`);
            break;
        }
        case 'KICK': {
            const c = clients.get(ws);
            if (!c || !c.lobbyId)
                return;
            const lobby = lobbies.get(c.lobbyId);
            if (!lobby)
                return;
            const isHost = lobby.service.state.hostId === c.id;
            if (!isHost)
                return;
            lobby.service.removePlayer(msg.playerId);
            for (const w of lobby.clients) {
                const cc = clients.get(w);
                if (cc && cc.id === msg.playerId) {
                    w.send(JSON.stringify({ type: 'ERROR', message: '你已被踢出房间' }));
                    w.close();
                    lobby.clients.delete(w);
                    break;
                }
            }
            broadcastLobby(c.lobbyId);
            break;
        }
        case 'PING': {
            const c = clients.get(ws);
            if (c)
                c.lastPing = Date.now();
            ws.send(JSON.stringify({ type: 'PONG', t: msg.t }));
            break;
        }
        case 'ROOM_ANNOUNCE': {
            // rebroadcast to others for discovery
            const out = JSON.stringify({ type: 'ROOM_ANNOUNCE', room: msg.room });
            wss.clients.forEach(w => { if (w !== ws && w.readyState === 1)
                w.send(out); });
            break;
        }
        case 'INPUT':
        case 'SNAPSHOT':
        case 'HIT_REQUEST':
            // In host-authoritative mode, server would validate and relay. For this reference implementation we relay snapshots
            relayToLobby(ws, msg);
            break;
    }
}
function relayToLobby(senderWs, msg) {
    const c = clients.get(senderWs);
    if (!c || !c.lobbyId)
        return;
    const lobby = lobbies.get(c.lobbyId);
    if (!lobby)
        return;
    const out = JSON.stringify(msg);
    lobby.clients.forEach(ws => { if (ws !== senderWs && ws.readyState === 1)
        ws.send(out); });
}
server.listen(GAME_PORT, '0.0.0.0', () => {
    console.log(`[Iron Eclipse] Server listening
  Game WS/UDP  : ${GAME_PORT} (Host authority)
  Discovery UDP: ${DISCOVERY_PORT} (broadcast 255.255.255.255 / LAN segment)
  Control      : ${CONTROL_PORT}
  Health       : http://localhost:${GAME_PORT}/health
  Rooms        : http://localhost:${GAME_PORT}/rooms
  Host IPs     : ${getLocalIPs().join(', ')}
  BuildHash    : d555555 Protocol 1.0.0
  `);
});
// --- UDP LAN Discovery (true zero-config) ---
const udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
udp.on('message', (msg, rinfo) => {
    try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'DISCOVER_REQ') {
            // Host replies with ROOM_ANNOUNCE for each lobby
            for (const [, lobby] of lobbies) {
                const announce = {
                    type: 'ROOM_ANNOUNCE',
                    room: {
                        roomId: lobby.service.state.roomId,
                        roomName: lobby.service.state.roomName,
                        hostIp: rinfo.address === '127.0.0.1' ? getLocalIPs()[0] : getLocalIPs()[0],
                        gamePort: GAME_PORT,
                        protocolVersion: '1.0.0',
                        buildHash: 'd555555',
                        currentPlayers: lobby.service.state.players.length,
                        maxPlayers: lobby.service.state.maxPlayers,
                        mapId: lobby.service.state.mapId,
                        modeId: lobby.service.state.modeId,
                        hasPassword: lobby.service.state.hasPassword,
                        hostName: lobby.service.state.players.find((p) => p.isHost)?.name || 'Host',
                        lastSeen: Date.now()
                    }
                };
                const buf = Buffer.from(JSON.stringify(announce));
                udp.send(buf, rinfo.port, rinfo.address);
                // also broadcast to segment for other listeners
                try {
                    udp.send(buf, DISCOVERY_PORT, '255.255.255.255');
                }
                catch { }
            }
            // If no lobbies, still respond with empty to confirm alive
        }
        else if (data.type === 'ROOM_ANNOUNCE') {
            // Client received announce via UDP, rebroadcast to WS clients for UI
            const out = JSON.stringify(data);
            wss.clients.forEach(c => { if (c.readyState === 1)
                c.send(out); });
        }
    }
    catch { }
});
udp.on('listening', () => {
    try {
        udp.setBroadcast(true);
    }
    catch { }
    const addr = udp.address();
    console.log(`[Discovery] UDP listening ${addr.address}:${addr.port} broadcast enabled`);
    // Periodic broadcast of all lobbies to 255.255.255.255
    setInterval(() => {
        for (const [, lobby] of lobbies) {
            const announce = {
                type: 'ROOM_ANNOUNCE',
                room: {
                    roomId: lobby.service.state.roomId,
                    roomName: lobby.service.state.roomName,
                    hostIp: getLocalIPs()[0],
                    gamePort: GAME_PORT,
                    protocolVersion: '1.0.0',
                    buildHash: 'd555555',
                    currentPlayers: lobby.service.state.players.length,
                    maxPlayers: lobby.service.state.maxPlayers,
                    mapId: lobby.service.state.mapId,
                    modeId: lobby.service.state.modeId,
                    hasPassword: lobby.service.state.hasPassword,
                    hostName: lobby.service.state.players.find((p) => p.isHost)?.name || 'Host',
                    lastSeen: Date.now()
                }
            };
            const buf = Buffer.from(JSON.stringify(announce));
            try {
                udp.send(buf, DISCOVERY_PORT, '255.255.255.255');
            }
            catch { }
            // also per-interface broadcast
            for (const ip of getLocalIPs()) {
                const bcast = ip.split('.').slice(0, 3).join('.') + '.255';
                try {
                    udp.send(buf, DISCOVERY_PORT, bcast);
                }
                catch { }
            }
        }
    }, 2000);
});
try {
    udp.bind(DISCOVERY_PORT);
}
catch (e) {
    console.error('[Discovery] UDP bind failed', e);
}
// Cleanup stale lobbies periodic + WS broadcast
setInterval(() => broadcastRoomList(), 8000);
