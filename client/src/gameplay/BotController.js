import * as THREE from 'three';
export class BotController {
    constructor(motor, combat, team, difficulty = 1) {
        Object.defineProperty(this, "team", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: team
        });
        Object.defineProperty(this, "difficulty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: difficulty
        });
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'patrol'
        });
        Object.defineProperty(this, "targetPos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "targetEnemy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "motor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "combat", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "thinkTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "strafeDir", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Math.random() > 0.5 ? 1 : -1
        });
        Object.defineProperty(this, "coverPos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.motor = motor;
        this.combat = combat;
        this.pickNewPatrol();
    }
    pickNewPatrol() {
        this.targetPos.set((Math.random() - 0.5) * 140, 0, (Math.random() - 0.5) * 140);
    }
    update(dt, enemies, allies, capturePoint, obstacles) {
        this.thinkTimer -= dt;
        if (this.thinkTimer <= 0) {
            this.thinkTimer = 0.6 + Math.random() * 0.8;
            this.evaluate(enemies, capturePoint);
        }
        // simple steering
        let desiredMove = new THREE.Vector3();
        let targetYaw = this.motor.yaw;
        if (this.state === 'engage' && this.targetEnemy && enemies.has(this.targetEnemy)) {
            const epos = enemies.get(this.targetEnemy).pos;
            const toEnemy = epos.clone().sub(this.motor.position);
            const dist = toEnemy.length();
            targetYaw = Math.atan2(toEnemy.x, toEnemy.z);
            if (dist > 45) {
                desiredMove.copy(toEnemy.normalize());
            }
            else if (dist < 18) {
                // strafe
                desiredMove.copy(toEnemy.normalize().multiplyScalar(-0.6));
                desiredMove.add(new THREE.Vector3(Math.cos(targetYaw + Math.PI / 2) * this.strafeDir, 0, -Math.sin(targetYaw + Math.PI / 2) * this.strafeDir).multiplyScalar(0.8));
            }
            else {
                desiredMove.add(new THREE.Vector3(Math.cos(targetYaw + Math.PI / 2) * this.strafeDir * 0.5, 0, 0));
            }
            // occasionally switch strafe
            if (Math.random() < 0.01)
                this.strafeDir *= -1;
        }
        else if (this.state === 'capture' && capturePoint) {
            const toCap = capturePoint.clone().sub(this.motor.position);
            targetYaw = Math.atan2(toCap.x, toCap.z);
            desiredMove.copy(toCap.normalize());
        }
        else if (this.state === 'cover' && this.coverPos) {
            const toCover = this.coverPos.clone().sub(this.motor.position);
            targetYaw = Math.atan2(toCover.x, toCover.z);
            desiredMove.copy(toCover.normalize());
            if (toCover.length() < 3)
                this.state = 'engage';
        }
        else if (this.state === 'retreat') {
            const away = this.motor.position.clone().sub(enemies.values().next().value?.pos || new THREE.Vector3()).normalize();
            desiredMove.copy(away);
            targetYaw = Math.atan2(away.x, away.z);
            if (this.combat.state.armor > 800)
                this.state = 'engage';
        }
        else {
            // patrol
            const toPatrol = this.targetPos.clone().sub(this.motor.position);
            if (toPatrol.length() < 5)
                this.pickNewPatrol();
            targetYaw = Math.atan2(toPatrol.x, toPatrol.z);
            desiredMove.copy(toPatrol.normalize());
        }
        // avoid obstacles simple
        for (const obs of obstacles) {
            const d = this.motor.position.distanceTo(obs);
            if (d < 12) {
                const push = this.motor.position.clone().sub(obs).normalize().multiplyScalar((12 - d) / 12);
                desiredMove.add(push);
            }
        }
        desiredMove.normalize();
        // convert to local input
        const forward = new THREE.Vector3(Math.sin(this.motor.yaw), 0, Math.cos(this.motor.yaw));
        const right = new THREE.Vector3(Math.cos(this.motor.yaw), 0, -Math.sin(this.motor.yaw));
        const moveX = desiredMove.dot(right);
        const moveY = desiredMove.dot(forward);
        // smooth yaw
        const yawDiff = Math.atan2(Math.sin(targetYaw - this.motor.yaw), Math.cos(targetYaw - this.motor.yaw));
        this.motor.yaw += yawDiff * dt * 3;
        return { moveX, moveY, yaw: this.motor.yaw, pitch: 0, wantFire: this.state === 'engage', wantBoost: Math.random() < 0.02 };
    }
    evaluate(enemies, capturePoint) {
        // find closest enemy
        let closest = null;
        let minD = Infinity;
        for (const [id, e] of enemies) {
            const d = e.pos.distanceTo(this.motor.position);
            if (d < minD && e.alive) {
                minD = d;
                closest = id;
            }
        }
        if (closest) {
            this.targetEnemy = closest;
            if (this.combat.state.armor < 400 || this.combat.state.structure < 300) {
                this.state = 'retreat';
                // find cover: opposite of enemy
                const enemyPos = enemies.get(closest).pos;
                this.coverPos = this.motor.position.clone().sub(enemyPos.clone().sub(this.motor.position).normalize().multiplyScalar(20));
            }
            else if (minD < 60) {
                this.state = 'engage';
            }
            else if (capturePoint && capturePoint.distanceTo(this.motor.position) < minD * 0.8) {
                this.state = 'capture';
            }
            else {
                this.state = 'engage';
            }
        }
        else if (capturePoint) {
            this.state = 'capture';
        }
        else {
            this.state = 'patrol';
        }
    }
    shouldFire() { return this.state === 'engage' && Math.random() < 0.12; }
}
