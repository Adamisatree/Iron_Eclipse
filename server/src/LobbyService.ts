export type Team = 'A'|'B'|'SPEC';
export interface LobbyPlayer {
  id:string; name:string; team:Team; mechId:string; ready:boolean; isHost:boolean; ping:number; isBot?:boolean;
}
export interface LobbyState {
  roomId:string; roomName:string; mapId:string; modeId:string; maxPlayers:number; hasPassword:boolean; players:LobbyPlayer[]; hostId:string; started:boolean; seed:number;
}

export class LobbyService {
  state!: LobbyState;
  createRoom(roomId:string, roomName:string, mapId:string, modeId:string, hostPlayer:LobbyPlayer): LobbyState{
    this.state = { roomId, roomName, mapId, modeId, maxPlayers:6, hasPassword:false, players:[hostPlayer], hostId:hostPlayer.id, started:false, seed: Math.floor(Math.random()*1e9)};
    return this.state;
  }
  addPlayer(p:LobbyPlayer){
    this.state.players.push(p);
    // auto-balance
    const a=this.state.players.filter(x=>x.team==='A').length;
    const b=this.state.players.filter(x=>x.team==='B').length;
    if (b < a) p.team='B'; else if (a < b) p.team='A';
  }
  removePlayer(id:string){
    this.state.players = this.state.players.filter(p=> p.id!==id);
    if (this.state.hostId===id && this.state.players.length) { this.state.players[0].isHost=true; this.state.hostId=this.state.players[0].id; }
  }
  setReady(id:string, ready:boolean){
    const pl=this.state.players.find(p=>p.id===id); if(pl) pl.ready=ready;
  }
  switchTeam(id:string){
    const pl=this.state.players.find(p=>p.id===id); if(pl) pl.team = pl.team==='A'?'B':'A';
  }
  setLoadout(id:string, mechId:string){
    const pl=this.state.players.find(p=>p.id===id); if(pl) pl.mechId=mechId;
  }
}
