export type Team = 'A' | 'B' | 'SPEC';
export interface LobbyPlayer {
  id: string;
  name: string;
  team: Team;
  mechId: string;
  ready: boolean;
  isHost: boolean;
  ping: number;
  isBot?: boolean;
}

export interface LobbyState {
  roomId: string;
  roomName: string;
  mapId: string;
  modeId: string;
  maxPlayers: number;
  hasPassword: boolean;
  players: LobbyPlayer[];
  hostId: string;
  started: boolean;
  seed: number;
}

export type LobbyMessageType = 'HELLO'|'WELCOME'|'VERSION_CHECK'|'LOBBY_STATE'|'PLAYER_JOIN'|'PLAYER_LEAVE'|'SET_READY'|'SWITCH_TEAM'|'SET_LOADOUT'|'CHAT'|'START_MATCH'|'KICK'|'PING';

export class LobbyService {
  state: LobbyState | null = null;
  private listeners: ((s: LobbyState|null)=>void)[] = [];
  private chatListeners: ((msg: {from:string,text:string,time:number})=>void)[] = [];
  chatLog: {from:string,text:string,time:number}[] = [];

  setState(s: LobbyState | null) {
    this.state = s;
    this.listeners.forEach(fn=> fn(s));
  }

  onState(fn: (s: LobbyState|null)=>void){ this.listeners.push(fn); if (this.state) fn(this.state); }
  onChat(fn: (m:any)=>void){ this.chatListeners.push(fn); }

  pushChat(from:string, text:string){
    const e={from,text,time:Date.now()};
    this.chatLog.push(e);
    this.chatListeners.forEach(fn=> fn(e));
  }

  // local helpers when acting as Host
  createRoom(roomId:string, roomName:string, mapId:string, modeId:string, hostPlayer: LobbyPlayer): LobbyState {
    const s: LobbyState = { roomId, roomName, mapId, modeId, maxPlayers:6, hasPassword:false, players:[hostPlayer], hostId:hostPlayer.id, started:false, seed: Math.floor(Math.random()*1e9) };
    this.setState(s);
    return s;
  }

  addPlayer(p: LobbyPlayer){
    if (!this.state) return;
    this.state.players.push(p);
    this.setState(this.state);
  }
  removePlayer(id:string){
    if (!this.state) return;
    this.state.players = this.state.players.filter(p=> p.id!==id);
    this.setState(this.state);
  }
  setReady(id:string, ready:boolean){
    if (!this.state) return;
    const pl = this.state.players.find(p=> p.id===id);
    if (pl) pl.ready = ready;
    this.setState(this.state);
  }
  switchTeam(id:string){
    if (!this.state) return;
    const pl = this.state.players.find(p=> p.id===id);
    if (pl) { pl.team = pl.team==='A' ? 'B' : 'A'; }
    this.setState(this.state);
  }
  setLoadout(id:string, mechId:string){
    if (!this.state) return;
    const pl = this.state.players.find(p=> p.id===id);
    if (pl) pl.mechId = mechId;
    this.setState(this.state);
  }
  canStart(): boolean {
    if (!this.state) return false;
    const readyCount = this.state.players.filter(p=> p.ready || p.isHost).length;
    return readyCount >= 2 && readyCount === this.state.players.length;
  }
}
