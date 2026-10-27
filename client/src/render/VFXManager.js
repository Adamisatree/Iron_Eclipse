import * as THREE from 'three';
export class VFXManager {
    constructor(scene) {
        Object.defineProperty(this, "scene", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "particles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "muzzlePool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.scene = scene;
    }
    muzzleFlash(pos, dir, color = 0xffaa00) {
        const geo = new THREE.SphereGeometry(0.25, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(pos);
        this.scene.add(m);
        let life = 0.08;
        const tick = (dt) => {
            life -= dt;
            m.scale.multiplyScalar(1.08);
            m.material.opacity = life / 0.08;
            if (life <= 0)
                this.scene.remove(m);
            else
                requestAnimationFrame(() => tick(0.016));
        };
        tick(0.016);
    }
    hitSpark(pos, normal) {
        for (let i = 0; i < 6; i++) {
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
            mesh.position.copy(pos);
            this.scene.add(mesh);
            const vel = new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 6 + 2, (Math.random() - 0.5) * 10);
            if (normal)
                vel.add(normal.clone().multiplyScalar(4));
            let life = 0.35;
            const animate = (dt) => {
                life -= dt;
                mesh.position.addScaledVector(vel, dt);
                vel.y -= 18 * dt;
                if (life <= 0)
                    this.scene.remove(mesh);
                else
                    setTimeout(() => animate(0.016), 16);
            };
            animate(0.016);
        }
    }
    explosion(pos, radius = 1.5) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.85 }));
        mesh.position.copy(pos);
        this.scene.add(mesh);
        let life = 0.35;
        const tick = (dt) => {
            life -= dt;
            mesh.scale.multiplyScalar(1.08);
            mesh.material.opacity = life / 0.35;
            if (life <= 0)
                this.scene.remove(mesh);
            else
                setTimeout(() => tick(0.016), 16);
        };
        tick(0.016);
        // debris
        for (let i = 0; i < 8; i++)
            this.hitSpark(pos, new THREE.Vector3((Math.random() - 0.5), 0.5, (Math.random() - 0.5)).normalize());
    }
    tracer(from, to, color = 0xffff00) {
        const dir = to.clone().sub(from);
        const len = dir.length();
        dir.normalize();
        const geo = new THREE.CylinderGeometry(0.03, 0.03, len, 4);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(from.clone().add(to).multiplyScalar(0.5));
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        this.scene.add(mesh);
        setTimeout(() => this.scene.remove(mesh), 60);
    }
    missileTrail(pos) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.6 }));
        m.position.copy(pos);
        this.scene.add(m);
        let life = 0.4;
        const tick = (dt) => {
            life -= dt;
            m.scale.multiplyScalar(0.96);
            m.material.opacity *= 0.92;
            if (life <= 0)
                this.scene.remove(m);
            else
                setTimeout(() => tick(0.028), 28);
        };
        tick(0.028);
    }
    update(dt) {
        // could manage pooled
    }
}
