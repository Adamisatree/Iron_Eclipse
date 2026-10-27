export type MatchPhase = 'waiting' | 'countdown' | 'active' | 'roundEnd' | 'matchEnd';

export interface ScoreState {
  teamA: number;
  teamB: number;
  round: number;
  roundToWin: number;
  timeLeft: number;
  phase: MatchPhase;
}

export class MatchDirector {
  phase: MatchPhase = 'waiting';
  round = 1;
  teamScore = { A:0, B:0 };
  roundTime = 90;
  timeLeft = 90;
  modeId = 'annihilation';
  mapId = 'orbital-relay';
  roundToWin = 3;
  private timer: any = null;
  private listeners: ((s:ScoreState)=>void)[] = [];
  private onRoundEnd: ((winner:'A'|'B'|null)=>void) | null = null;
  private onMatchEnd: ((winner:'A'|'B')=>void) | null = null;

  configure(modeId:string, mapId:string, roundToWin=3, roundTime=90){
    this.modeId = modeId; this.mapId=mapId; this.roundToWin=roundToWin; this.roundTime=roundTime; this.timeLeft=roundTime;
  }

  onState(fn:(s:ScoreState)=>void){ this.listeners.push(fn); }
  setRoundEnd(fn:(w:any)=>void){ this.onRoundEnd=fn; }
  setMatchEnd(fn:(w:any)=>void){ this.onMatchEnd=fn; }

  startCountdown(){
    this.phase='countdown';
    this.notify();
    let c=3;
    const id=setInterval(()=>{
      c--;
      if(c<=0){ clearInterval(id); this.startRound(); }
    },1000);
  }

  startRound(){
    this.phase='active';
    this.timeLeft=this.roundTime;
    this.notify();
    if (this.timer) clearInterval(this.timer);
    this.timer=setInterval(()=> this.tick(),1000);
  }

  private tick(){
    if (this.phase!=='active') return;
    this.timeLeft--;
    if (this.timeLeft<=0) {
      this.endRound(null);
    }
    this.notify();
  }

  endRound(winner:'A'|'B'|null){
    if (this.timer) clearInterval(this.timer);
    this.phase='roundEnd';
    if (winner) {
      if (winner==='A') this.teamScore.A++; else this.teamScore.B++;
    } else {
      // compare alive? for now draw handled as null
    }
    this.notify();
    if (this.onRoundEnd) this.onRoundEnd(winner);

    if (this.teamScore.A >= this.roundToWin || this.teamScore.B >= this.roundToWin) {
      this.endMatch(this.teamScore.A>this.teamScore.B?'A':'B');
      return;
    }
    setTimeout(()=> { this.round++; this.startCountdown(); }, 3200);
  }

  endMatch(winner:'A'|'B'){
    this.phase='matchEnd';
    if (this.timer) clearInterval(this.timer);
    this.notify();
    if (this.onMatchEnd) this.onMatchEnd(winner);
  }

  private notify(){
    const s: ScoreState = { teamA:this.teamScore.A, teamB:this.teamScore.B, round:this.round, roundToWin:this.roundToWin, timeLeft:this.timeLeft, phase:this.phase };
    this.listeners.forEach(fn=> fn(s));
  }

  reset(){
    if (this.timer) clearInterval(this.timer);
    this.phase='waiting'; this.round=1; this.teamScore={A:0,B:0}; this.timeLeft=this.roundTime;
  }
}
