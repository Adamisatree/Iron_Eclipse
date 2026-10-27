export class MatchDirector {
  modeId='annihilation'; mapId='orbital-relay'; seed=0;
  start(modeId:string, mapId:string, seed?:number){
    this.modeId=modeId; this.mapId=mapId; if(seed) this.seed=seed;
    console.log(`[MatchDirector] start mode=${modeId} map=${mapId} seed=${this.seed}`);
  }
}
