export class MatchDirector {
    constructor() {
        this.modeId = 'annihilation';
        this.mapId = 'orbital-relay';
        this.seed = 0;
    }
    start(modeId, mapId, seed) {
        this.modeId = modeId;
        this.mapId = mapId;
        if (seed)
            this.seed = seed;
        console.log(`[MatchDirector] start mode=${modeId} map=${mapId} seed=${this.seed}`);
    }
}
