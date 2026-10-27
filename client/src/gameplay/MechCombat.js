import { getWeapon } from '../data/WeaponDefinitions';
import { getMech } from '../data/MechDefinitions';
export class MechCombat {
    constructor(mechId) {
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mechId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastFire", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "reloading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.mechId = mechId;
        const mech = getMech(mechId);
        this.state = {
            armor: mech.armor,
            structure: mech.structure,
            shield: mech.shield || 0,
            heat: 0,
            ammoInMag: new Map(),
            ammoReserve: new Map(),
            isOverheated: false,
            overheatTimer: 0,
            stagger: 0,
            isStaggered: false,
            staggerTimer: 0,
            lastDamageTime: 0
        };
        // init weapons
        for (const slot of mech.weapons) {
            const w = getWeapon(slot.weaponId);
            this.state.ammoInMag.set(slot.weaponId, w.magazine);
            this.state.ammoReserve.set(slot.weaponId, w.reserve);
        }
    }
    setMech(id) { this.mechId = id; const mech = getMech(id); this.state.armor = mech.armor; this.state.structure = mech.structure; this.state.shield = mech.shield || 0; }
    update(dt) {
        const mech = getMech(this.mechId);
        // heat dissipation
        if (this.state.isOverheated) {
            this.state.overheatTimer -= dt;
            if (this.state.overheatTimer <= 0) {
                this.state.isOverheated = false;
                this.state.heat = 70;
            }
            else {
                this.state.heat = Math.min(mech.heatCapacity, this.state.heat + dt * 4);
                return;
            }
        }
        // dissipate
        if (this.state.heat > 0)
            this.state.heat = Math.max(0, this.state.heat - mech.heatDissipation * dt * (this.state.heat > 80 ? 0.4 : 1));
        // shield regen
        const now = performance.now();
        if (mech.shield && this.state.shield < mech.shield && now - this.state.lastDamageTime > 3000) {
            this.state.shield = Math.min(mech.shield, this.state.shield + 85 * dt);
        }
        // stagger recovery
        if (this.state.isStaggered) {
            this.state.staggerTimer -= dt;
            if (this.state.staggerTimer <= 0) {
                this.state.isStaggered = false;
                this.state.stagger = 0;
            }
        }
        else {
            if (this.state.stagger > 0)
                this.state.stagger = Math.max(0, this.state.stagger - 18 * dt);
        }
        // reload timers
        for (const [wid, t] of this.reloading) {
            const nt = t - dt;
            if (nt <= 0) {
                this.reloading.delete(wid);
                const w = getWeapon(wid);
                const need = w.magazine - (this.state.ammoInMag.get(wid) || 0);
                const avail = this.state.ammoReserve.get(wid) || 0;
                const load = Math.min(need, avail);
                this.state.ammoInMag.set(wid, (this.state.ammoInMag.get(wid) || 0) + load);
                this.state.ammoReserve.set(wid, avail - load);
            }
            else
                this.reloading.set(wid, nt);
        }
    }
    canFire(weaponId) {
        if (this.state.isOverheated)
            return false;
        if (this.state.isStaggered)
            return false;
        if (this.reloading.has(weaponId))
            return false;
        const w = getWeapon(weaponId);
        const last = this.lastFire.get(weaponId) || 0;
        if (performance.now() - last < (1000 / w.fireRate))
            return false;
        const ammo = this.state.ammoInMag.get(weaponId) || 0;
        if (ammo <= 0 && w.magazine !== 999) {
            this.startReload(weaponId);
            return false;
        }
        const mech = getMech(this.mechId);
        if (this.state.heat + w.heatPerShot > mech.heatCapacity) {
            // overheat trigger
            this.state.isOverheated = true;
            this.state.overheatTimer = 1.5;
            return false;
        }
        return true;
    }
    fire(weaponId) {
        if (!this.canFire(weaponId))
            return false;
        const w = getWeapon(weaponId);
        this.lastFire.set(weaponId, performance.now());
        if (w.magazine !== 999) {
            this.state.ammoInMag.set(weaponId, (this.state.ammoInMag.get(weaponId) || 0) - 1);
            if ((this.state.ammoInMag.get(weaponId) || 0) === 0)
                this.startReload(weaponId);
        }
        this.state.heat = Math.min(getMech(this.mechId).heatCapacity, this.state.heat + w.heatPerShot);
        return true;
    }
    startReload(weaponId) {
        if (this.reloading.has(weaponId))
            return;
        this.reloading.set(weaponId, 1.6);
    }
    takeDamage(amount, isHead = false, isBack = false, attackerMechId) {
        const mech = getMech(this.mechId);
        const armorReduction = mech.armor ? mech.armor / (mech.armor + 1200) : 0;
        let dmg = amount * (1 - armorReduction * 0.5); // structure not reduced fully
        if (isHead)
            dmg *= 1.25;
        if (isBack)
            dmg *= 1.15;
        // shield first
        if (this.state.shield > 0) {
            const absorb = Math.min(this.state.shield, dmg * 0.7);
            this.state.shield -= absorb;
            dmg -= absorb;
        }
        // armor
        if (this.state.armor > 0) {
            const toArmor = Math.min(this.state.armor, dmg * 0.75);
            this.state.armor -= toArmor;
            dmg -= toArmor * 0.3; // remainder to structure
            this.state.structure -= toArmor * 0.3 + (dmg * 0.5);
        }
        else {
            this.state.structure -= dmg;
        }
        this.state.lastDamageTime = performance.now();
        this.state.stagger += amount * 0.4;
        if (this.state.stagger >= mech.staggerThreshold) {
            this.state.isStaggered = true;
            this.state.staggerTimer = 1.2;
        }
        if (this.state.structure <= 0) {
            this.state.structure = 0;
            return { killed: true, damageDealt: dmg };
        }
        return { killed: false, damageDealt: dmg };
    }
    isAlive() { return this.state.structure > 0; }
    heal(amount) {
        const mech = getMech(this.mechId);
        this.state.armor = Math.min(mech.armor, this.state.armor + amount);
        this.state.structure = Math.min(mech.structure, this.state.structure + amount * 0.6);
    }
    tryExecute(target) {
        if (!target.state.isStaggered)
            return false;
        if (target.state.structure / getMech(target.mechId || 'tuf-01').structure > 0.2)
            return false;
        return true;
    }
}
