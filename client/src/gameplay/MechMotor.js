import * as THREE from 'three';
import { BTN_BOOST, BTN_JUMP } from '../input/InputCollector';
import { getMech } from '../data/MechDefinitions';
export class MechMotor {
    constructor(mechId, startPos) {
        Object.defineProperty(this, "position", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "velocity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "yaw", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "pitch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "onGround", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "boostEnergy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
        Object.defineProperty(this, "boostCooldown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "isBoosting", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "isJumping", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "mechId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // correction
        Object.defineProperty(this, "serverPos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "needsCorrection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.mechId = mechId;
        this.position.copy(startPos);
        this.serverPos.copy(startPos);
    }
    setMech(id) { this.mechId = id; }
    update(dt, input, tick) {
        const mech = getMech(this.mechId);
        if (!mech)
            return { boostTriggered: false, jumpTriggered: false };
        let boostTriggered = false, jumpTriggered = false;
        // ground check simple
        const groundY = 0;
        if (this.position.y <= groundY + 0.01) {
            this.position.y = groundY;
            this.onGround = true;
            this.velocity.y = Math.max(0, this.velocity.y);
        }
        else {
            this.onGround = false;
            this.velocity.y -= 18 * dt;
        } // gravity
        // movement
        const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        let move = new THREE.Vector3();
        move.addScaledVector(forward, input.moveY);
        move.addScaledVector(right, input.moveX);
        if (move.lengthSq() > 1)
            move.normalize();
        let speed = mech.speed;
        // aiming slows? no
        // boost
        if ((input.buttons & BTN_BOOST) && this.boostEnergy > mech.boostCost * dt * 2 && this.boostCooldown <= 0) {
            speed = mech.sprintSpeed;
            this.isBoosting = true;
            this.boostEnergy = Math.max(0, this.boostEnergy - 35 * dt);
            if (this.boostEnergy <= 0)
                this.boostCooldown = 0.8;
            if (!this.isBoosting)
                boostTriggered = true;
        }
        else {
            this.isBoosting = false;
            if (this.boostCooldown > 0)
                this.boostCooldown -= dt;
            else
                this.boostEnergy = Math.min(100, this.boostEnergy + 42 * dt);
        }
        // jump
        if ((input.buttons & BTN_JUMP) && this.onGround && this.boostEnergy > 20) {
            this.velocity.y = 7.5 + (mech.speed > 8 ? 1.2 : 0);
            this.boostEnergy -= 28;
            this.boostCooldown = 0.2;
            this.isJumping = true;
            jumpTriggered = true;
        }
        // apply horizontal velocity
        const targetVel = move.multiplyScalar(speed);
        // inertia / damping
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVel.x, dt * 10);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVel.z, dt * 10);
        // update position
        this.position.addScaledVector(this.velocity, dt);
        // keep inside map bounds
        const bound = 110;
        this.position.x = Math.max(-bound, Math.min(bound, this.position.x));
        this.position.z = Math.max(-bound, Math.min(bound, this.position.z));
        // yaw/pitch follow input
        this.yaw = input.yaw;
        this.pitch = input.pitch;
        // server correction lerp if needed
        if (this.needsCorrection) {
            const dist = this.position.distanceTo(this.serverPos);
            if (dist > 0.25) {
                this.position.lerp(this.serverPos, 0.12);
                if (dist < 0.05)
                    this.needsCorrection = false;
            }
            else
                this.needsCorrection = false;
        }
        return { boostTriggered, jumpTriggered };
    }
    applyServerCorrection(pos, vel) {
        this.serverPos.set(pos[0], pos[1], pos[2]);
        const dist = this.position.distanceTo(this.serverPos);
        if (dist > 5)
            this.position.copy(this.serverPos);
        else if (dist > 0.25)
            this.needsCorrection = true;
        this.velocity.set(vel[0], vel[1], vel[2]);
    }
}
