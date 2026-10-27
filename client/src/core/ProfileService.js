const STORAGE_KEY = 'iron-eclipse-profile-v1';
function genId() { return Math.random().toString(36).slice(2, 9); }
export class ProfileService {
    constructor() {
        Object.defineProperty(this, "profile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                this.profile = JSON.parse(raw);
            }
            catch {
                this.profile = this.createDefault();
            }
        }
        else {
            this.profile = this.createDefault();
        }
        this.save();
    }
    createDefault() {
        return {
            playerId: genId(),
            name: '机师_' + Math.floor(Math.random() * 9000 + 1000),
            level: 1,
            xp: 0,
            unlockedMechs: ['tuf-01', 'tuf-02', 'mff-01', 'mff-02'],
            unlockedSkins: ['default'],
            selectedMech: 'tuf-01',
            selectedSkin: 'default',
            stats: { wins: 0, losses: 0, kills: 0, deaths: 0, damageDealt: 0 },
            recentMatches: []
        };
    }
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    }
    addXp(amount) {
        this.profile.xp += amount;
        const need = this.profile.level * 800;
        if (this.profile.xp >= need) {
            this.profile.level++;
            this.profile.xp -= need;
            // unlock mech every 2 levels
            if (this.profile.level % 2 === 0) {
                const all = ['tuf-01', 'tuf-02', 'tuf-03', 'mff-01', 'mff-02', 'mff-03'];
                const locked = all.filter(id => !this.profile.unlockedMechs.includes(id));
                if (locked.length)
                    this.profile.unlockedMechs.push(locked[0]);
            }
        }
        this.save();
    }
    recordMatch(result) {
        this.profile.recentMatches.unshift(result);
        this.profile.recentMatches = this.profile.recentMatches.slice(0, 20);
        if (result.won)
            this.profile.stats.wins++;
        else
            this.profile.stats.losses++;
        this.save();
    }
}
