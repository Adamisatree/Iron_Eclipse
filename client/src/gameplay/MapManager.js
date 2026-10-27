import * as THREE from 'three';
import { MAPS } from '../data/MapDefinitions';
export class MapManager {
    constructor() {
        Object.defineProperty(this, "group", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Group()
        });
        Object.defineProperty(this, "mapId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'orbital-relay'
        });
        Object.defineProperty(this, "bounds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 110
        });
        Object.defineProperty(this, "obstacles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "capturePoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3(0, 0, 0)
        });
        Object.defineProperty(this, "hazards", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    build(mapId, scene) {
        this.group.clear();
        this.obstacles = [];
        this.hazards = [];
        this.mapId = mapId;
        const def = MAPS.find(m => m.id === mapId) || MAPS[0];
        // ground
        const groundMat = new THREE.MeshStandardMaterial({
            color: this.getGroundColor(def.theme),
            roughness: 0.85, metalness: 0.2
        });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(def.size * 1.2, def.size * 1.2), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.group.add(ground);
        // grid decal
        const grid = new THREE.GridHelper(def.size, 20, 0x444444, 0x222222);
        grid.position.y = 0.02;
        this.group.add(grid);
        // theme-specific structures
        this.addStructures(def.theme, def.size);
        // cover groups: 6 groups
        for (let i = 0; i < 6; i++)
            this.addCoverGroup();
        // high points 2
        this.addHighPoint(-40, -40);
        this.addHighPoint(40, 40);
        // central objective
        const capGeo = new THREE.CylinderGeometry(6, 6, 0.5, 16);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.4 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, 0.25, 0);
        this.group.add(cap);
        this.capturePoint.set(0, 0, 0);
        // spawn markers
        this.addSpawnMarkers();
        // environmental fog and lights
        this.addEnvironment(def.theme, scene);
        scene.add(this.group);
    }
    getGroundColor(theme) {
        switch (theme) {
            case 'orbital': return 0x2a2e35;
            case 'mars': return 0x5a2a1a;
            case 'ice': return 0xdde3e8;
            case 'shipyard': return 0x3a3d40;
            default: return 0x2a2e35;
        }
    }
    addStructures(theme, size) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.7, metalness: 0.5 });
        const emissiveMat = new THREE.MeshStandardMaterial({ color: theme === 'orbital' ? 0x0a1a2a : 0x222222, emissive: theme === 'orbital' ? 0x0088ff : 0x000000, emissiveIntensity: 0.15 });
        // perimeter walls
        const wallH = theme === 'mars' ? 8 : 12;
        const createWall = (x, z, w, d, h) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            m.position.set(x, h / 2, z);
            m.castShadow = true;
            m.receiveShadow = true;
            this.group.add(m);
            this.obstacles.push(new THREE.Vector3(x, 0, z));
        };
        if (theme === 'orbital') {
            // elevator shaft central
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 28, 12), emissiveMat);
            shaft.position.set(0, 14, 0);
            this.group.add(shaft);
            // arms
            createWall(0, -70, 40, 4, 6);
            createWall(0, 70, 40, 4, 6);
            createWall(-70, 0, 4, 40, 8);
            createWall(70, 0, 4, 40, 8);
        }
        else if (theme === 'mars') {
            for (let i = 0; i < 3; i++)
                createWall(-50 + i * 50, 30, 18, 3, wallH);
            for (let i = 0; i < 3; i++)
                createWall(-50 + i * 50, -30, 18, 3, wallH);
        }
        else if (theme === 'ice') {
            createWall(-60, 0, 6, 50, 10);
            createWall(60, 0, 6, 50, 10);
            // cooling towers
            const tower = new THREE.Mesh(new THREE.CylinderGeometry(10, 14, 18, 12), mat);
            tower.position.set(-30, 9, 50);
            this.group.add(tower);
            this.obstacles.push(new THREE.Vector3(-30, 0, 50));
            const tower2 = tower.clone();
            tower2.position.set(30, 9, -50);
            this.group.add(tower2);
            this.obstacles.push(new THREE.Vector3(30, 0, -50));
        }
        else if (theme === 'shipyard') {
            createWall(0, -60, 80, 6, 9);
            createWall(0, 60, 80, 6, 9);
            // crane
            const crane = new THREE.Mesh(new THREE.BoxGeometry(4, 22, 4), mat);
            crane.position.set(40, 11, 0);
            this.group.add(crane);
            this.obstacles.push(new THREE.Vector3(40, 0, 0));
        }
    }
    addCoverGroup() {
        const x = (Math.random() - 0.5) * 160;
        const z = (Math.random() - 0.5) * 160;
        if (Math.abs(x) < 20 && Math.abs(z) < 20)
            return;
        const mat = new THREE.MeshStandardMaterial({ color: 0x6a6e73, roughness: 0.8, metalness: 0.3 });
        const h = 3 + Math.random() * 4;
        const w = 4 + Math.random() * 8;
        const d = 2 + Math.random() * 4;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, h / 2, z);
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.castShadow = true;
        this.group.add(mesh);
        this.obstacles.push(new THREE.Vector3(x, 0, z));
        // barrels
        if (Math.random() > 0.5) {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x8a3a0a }));
            barrel.position.set(x + 2, 0.8, z + 1);
            this.group.add(barrel);
        }
    }
    addHighPoint(x, z) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x4a4e53 });
        const plat = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 14), mat);
        plat.position.set(x, 2.5, z);
        this.group.add(plat);
        this.obstacles.push(new THREE.Vector3(x, 0, z));
        // ramp
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 10), mat);
        ramp.position.set(x, 0.5, z + 12);
        ramp.rotation.x = 0.2;
        this.group.add(ramp);
    }
    addSpawnMarkers() {
        const aMat = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0088ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.4 });
        const bMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 0.6, transparent: true, opacity: 0.4 });
        const a = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.3, 16), aMat);
        a.position.set(-85, 0.15, -85);
        this.group.add(a);
        const b = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.3, 16), bMat);
        b.position.set(85, 0.15, 85);
        this.group.add(b);
    }
    addEnvironment(theme, scene) {
        // fog
        if (theme === 'orbital') {
            scene.fog = new THREE.FogExp2(0x0a0f1a, 0.008);
        }
        else if (theme === 'mars') {
            scene.fog = new THREE.Fog(0x4a2010, 40, 220);
        }
        else if (theme === 'ice') {
            scene.fog = new THREE.Fog(0xd0d8e0, 30, 260);
        }
        else {
            scene.fog = new THREE.Fog(0x1a1e22, 35, 240);
        }
        // lights
        // existing lights cleared? add
        const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, theme === 'ice' ? 1.2 : 0.8);
        this.group.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, theme === 'orbital' ? 1.0 : 1.4);
        dir.position.set(40, 60, 30);
        dir.castShadow = true;
        dir.shadow.mapSize.set(2048, 2048);
        dir.shadow.camera.left = -100;
        dir.shadow.camera.right = 100;
        dir.shadow.camera.top = 100;
        dir.shadow.camera.bottom = -100;
        this.group.add(dir);
    }
}
