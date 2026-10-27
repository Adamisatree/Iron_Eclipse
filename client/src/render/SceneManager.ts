import * as THREE from 'three';
import { MapManager } from '../gameplay/MapManager';
import { MechRenderer } from './MechRenderer';
import { VFXManager } from './VFXManager';
import { getMech } from '../data/MechDefinitions';

export class SceneManager {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  mapManager: MapManager;
  vfx: VFXManager;
  mechs = new Map<string, MechRenderer>();
  private cameraYaw = 0;
  private cameraPitch = 0.25;
  private cameraDistance = 8.5;
  private targetPos = new THREE.Vector3();
  private shakeIntensity = 0;
  private shakeTime = 0;

  constructor(private container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f14);

    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 600);
    this.camera.position.set(0,4,8);

    this.renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
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
    window.addEventListener('resize', ()=> {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // expose yaw/pitch for input
    (this as any).cameraYawRef = { value: this.cameraYaw };
    (this as any).cameraPitchRef = { value: this.cameraPitch };
  }

  getCameraRefs(){ return { yawRef: (this as any).cameraYawRef, pitchRef: (this as any).cameraPitchRef }; }

  buildMap(mapId: string){
    // clear previous map but keep mechs
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse((o:any)=> { if ((o as any).isMapGroup) toRemove.push(o); });
    (this.mapManager.group as any).userData.isMapGroup = true;
    this.mapManager.build(mapId, this.scene);
  }

  addMech(netId: string, mechId: string, isLocal=false){
    const def = getMech(mechId);
    if (!def) return null;
    const renderer = new MechRenderer({ id: mechId, primary: def.colorPrimary, secondary: def.colorSecondary, heightScale: def.height/8 });
    this.scene.add(renderer.group);
    this.mechs.set(netId, renderer);
    return renderer;
  }

  removeMech(netId: string){
    const m = this.mechs.get(netId);
    if (m) { this.scene.remove(m.group); this.mechs.delete(netId); }
  }

  updateCamera(target: THREE.Vector3, yaw:number, pitch:number, dt:number){
    this.cameraYaw = yaw;
    this.cameraPitch = pitch;
    this.targetPos.copy(target);

    // chase camera
    const offset = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch) * -this.cameraDistance,
      2.8 + pitch*6,
      Math.cos(yaw) * Math.cos(pitch) * -this.cameraDistance
    );
    // collision ray
    const camPos = target.clone().add(offset);
    // simple ground clip
    camPos.y = Math.max(camPos.y, target.y + 1.0);

    if (this.shakeTime>0) {
      camPos.x += (Math.random()-0.5)*this.shakeIntensity;
      camPos.y += (Math.random()-0.5)*this.shakeIntensity;
      camPos.z += (Math.random()-0.5)*this.shakeIntensity;
      this.shakeTime -= dt;
    }

    this.camera.position.lerp(camPos, dt*8);
    this.camera.lookAt(target.clone().add(new THREE.Vector3(0,1.4,0)));
  }

  setFov(fov:number){ this.camera.fov = fov; this.camera.updateProjectionMatrix(); }

  shake(intensity:number, duration:number){ this.shakeIntensity=intensity; this.shakeTime=duration; }

  render(){ this.renderer.render(this.scene, this.camera); }
}
