import * as THREE from 'three';
import { MapManager } from '../gameplay/MapManager';
import { MechRenderer } from './MechRenderer';
import { VFXManager } from './VFXManager';
import { getMech } from '../data/MechDefinitions';
export class SceneManager {
    constructor(container) {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: container
        });
        Object.defineProperty(this, "scene", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "renderer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mapManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "vfx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mechs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "cameraYaw", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "cameraPitch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.25
        });
        Object.defineProperty(this, "cameraDistance", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 8.5
        });
        Object.defineProperty(this, "targetPos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "shakeIntensity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "shakeTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f14);
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 600);
        this.camera.position.set(0, 4, 8);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        container.appendChild(this.renderer.domElement);
        // post placeholder: volumetric
        this.mapManager = new MapManager();
        this.vfx = new VFXManager(this.scene);
        // resize
        window.addEventListener('resize', () => {
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
        // expose yaw/pitch for input
        this.cameraYawRef = { value: this.cameraYaw };
        this.cameraPitchRef = { value: this.cameraPitch };
    }
    getCameraRefs() { return { yawRef: this.cameraYawRef, pitchRef: this.cameraPitchRef }; }
    buildMap(mapId) {
        // clear previous map but keep mechs
        const toRemove = [];
        this.scene.traverse((o) => { if (o.isMapGroup)
            toRemove.push(o); });
        this.mapManager.group.userData.isMapGroup = true;
        this.mapManager.build(mapId, this.scene);
    }
    addMech(netId, mechId, isLocal = false) {
        const def = getMech(mechId);
        if (!def)
            return null;
        const renderer = new MechRenderer({ id: mechId, primary: def.colorPrimary, secondary: def.colorSecondary, heightScale: def.height / 8 });
        this.scene.add(renderer.group);
        this.mechs.set(netId, renderer);
        return renderer;
    }
    removeMech(netId) {
        const m = this.mechs.get(netId);
        if (m) {
            this.scene.remove(m.group);
            this.mechs.delete(netId);
        }
    }
    updateCamera(target, yaw, pitch, dt) {
        this.cameraYaw = yaw;
        this.cameraPitch = pitch;
        this.targetPos.copy(target);
        // chase camera
        const offset = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch) * -this.cameraDistance, 2.8 + pitch * 6, Math.cos(yaw) * Math.cos(pitch) * -this.cameraDistance);
        // collision ray
        const camPos = target.clone().add(offset);
        // simple ground clip
        camPos.y = Math.max(camPos.y, target.y + 1.0);
        if (this.shakeTime > 0) {
            camPos.x += (Math.random() - 0.5) * this.shakeIntensity;
            camPos.y += (Math.random() - 0.5) * this.shakeIntensity;
            camPos.z += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeTime -= dt;
        }
        this.camera.position.lerp(camPos, dt * 8);
        this.camera.lookAt(target.clone().add(new THREE.Vector3(0, 1.4, 0)));
    }
    setFov(fov) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    shake(intensity, duration) { this.shakeIntensity = intensity; this.shakeTime = duration; }
    render() { this.renderer.render(this.scene, this.camera); }
}
