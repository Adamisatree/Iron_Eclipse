export class MatchDirector {
    constructor() {
        Object.defineProperty(this, "phase", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'waiting'
        });
        Object.defineProperty(this, "round", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "teamScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { A: 0, B: 0 }
        });
        Object.defineProperty(this, "roundTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 90
        });
        Object.defineProperty(this, "timeLeft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 90
        });
        Object.defineProperty(this, "modeId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'annihilation'
        });
        Object.defineProperty(this, "mapId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'orbital-relay'
        });
        Object.defineProperty(this, "roundToWin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        Object.defineProperty(this, "timer", {
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
        Object.defineProperty(this, "onRoundEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "onMatchEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    configure(modeId, mapId, roundToWin = 3, roundTime = 90) {
        this.modeId = modeId;
        this.mapId = mapId;
        this.roundToWin = roundToWin;
        this.roundTime = roundTime;
        this.timeLeft = roundTime;
    }
    onState(fn) { this.listeners.push(fn); }
    setRoundEnd(fn) { this.onRoundEnd = fn; }
    setMatchEnd(fn) { this.onMatchEnd = fn; }
    startCountdown() {
        this.phase = 'countdown';
        this.notify();
        let c = 3;
        const id = setInterval(() => {
            c--;
            if (c <= 0) {
                clearInterval(id);
                this.startRound();
            }
        }, 1000);
    }
    startRound() {
        this.phase = 'active';
        this.timeLeft = this.roundTime;
        this.notify();
        if (this.timer)
            clearInterval(this.timer);
        this.timer = setInterval(() => this.tick(), 1000);
    }
    tick() {
        if (this.phase !== 'active')
            return;
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.endRound(null);
        }
        this.notify();
    }
    endRound(winner) {
        if (this.timer)
            clearInterval(this.timer);
        this.phase = 'roundEnd';
        if (winner) {
            if (winner === 'A')
                this.teamScore.A++;
            else
                this.teamScore.B++;
        }
        else {
            // compare alive? for now draw handled as null
        }
        this.notify();
        if (this.onRoundEnd)
            this.onRoundEnd(winner);
        if (this.teamScore.A >= this.roundToWin || this.teamScore.B >= this.roundToWin) {
            this.endMatch(this.teamScore.A > this.teamScore.B ? 'A' : 'B');
            return;
        }
        setTimeout(() => { this.round++; this.startCountdown(); }, 3200);
    }
    endMatch(winner) {
        this.phase = 'matchEnd';
        if (this.timer)
            clearInterval(this.timer);
        this.notify();
        if (this.onMatchEnd)
            this.onMatchEnd(winner);
    }
    notify() {
        const s = { teamA: this.teamScore.A, teamB: this.teamScore.B, round: this.round, roundToWin: this.roundToWin, timeLeft: this.timeLeft, phase: this.phase };
        this.listeners.forEach(fn => fn(s));
    }
    reset() {
        if (this.timer)
            clearInterval(this.timer);
        this.phase = 'waiting';
        this.round = 1;
        this.teamScore = { A: 0, B: 0 };
        this.timeLeft = this.roundTime;
    }
}
