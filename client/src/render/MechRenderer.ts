import * as THREE from 'three';

export interface MechRenderConfig {
  id: string;
  primary: string;
  secondary: string;
  heightScale: number;
}

export class MechRenderer {
  group = new THREE.Group();
  root = new THREE.Group();
  meshParts: THREE.Mesh[] = [];
  private thrusters: THREE.Mesh[] = [];
  private head: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private backpack: THREE.Group;
  private mixer: THREE.AnimationMixer | null = null;

  constructor(private config: MechRenderConfig) {
    this.group.add(this.root);
    this.root.scale.setScalar(config.heightScale * 0.35); // scale to game size ~6-8m -> 2 units

    this.buildBody();
    this.head = this.buildHead();
    this.leftArm = this.buildArm('left');
    this.rightArm = this.buildArm('right');
    this.backpack = this.buildBackpack();

    // shadow
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), new THREE.MeshStandardMaterial({color:0x000000, transparent:true, opacity:0.35}));
    shadow.rotation.x = -Math.PI/2;
    shadow.position.y = 0.02;
    this.group.add(shadow);
  }

  private buildBody() {
    const primaryMat = new THREE.MeshStandardMaterial({ color: this.config.primary, roughness:0.6, metalness:0.35 });
    const secondaryMat = new THREE.MeshStandardMaterial({ color: this.config.secondary, roughness:0.5, metalness:0.6, emissive: this.config.secondary, emissiveIntensity:0.08 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness:0.8, metalness:0.2 });

    // pelvis
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.6,1.0), darkMat);
    pelvis.position.y = 1.2;
    pelvis.castShadow = true;
    this.root.add(pelvis); this.meshParts.push(pelvis);

    // chest
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.9,1.4,1.2), primaryMat);
    chest.position.y = 2.3;
    chest.castShadow = true;
    this.root.add(chest); this.meshParts.push(chest);

    // chest secondary detail
    const chestDetail = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.5,1.25), secondaryMat);
    chestDetail.position.y = 2.1;
    this.root.add(chestDetail);

    // cockpit glass
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.6,0.2), new THREE.MeshStandardMaterial({color:0x88ccff, emissive:0x0088ff, emissiveIntensity:0.3, transparent:true, opacity:0.85, roughness:0.2, metalness:0.8}));
    cockpit.position.set(0,2.4,0.65);
    this.root.add(cockpit);

    // reactor
    const reactor = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.4,0.3,8), secondaryMat);
    reactor.position.set(0,1.6,0);
    this.root.add(reactor);

    // legs
    this.buildLeg(-0.6, 0x888888);
    this.buildLeg(0.6, 0x888888);

    // shoulders
    for (const side of [-1,1]) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.7), primaryMat);
      shoulder.position.set(side*1.25, 2.8, 0);
      shoulder.castShadow = true;
      this.root.add(shoulder); this.meshParts.push(shoulder);
    }
  }

  private buildLeg(x:number, color:number) {
    const legMat = new THREE.MeshStandardMaterial({color:0x44484e, roughness:0.7, metalness:0.4});
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.32,1.1,8), legMat);
    thigh.position.set(x,0.9,0);
    this.root.add(thigh);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.9,0.5), legMat);
    shin.position.set(x,0.15,0.05);
    this.root.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.2,1.0), new THREE.MeshStandardMaterial({color:0x22252a}));
    foot.position.set(x, -0.05, 0.2);
    this.root.add(foot);
  }

  private buildHead(): THREE.Group {
    const g = new THREE.Group();
    const headMat = new THREE.MeshStandardMaterial({color:this.config.primary, roughness:0.5, metalness:0.3});
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.55,0.7), headMat);
    head.position.y = 3.35;
    head.castShadow=true;
    g.add(head);
    this.root.add(g);
    // eye
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8), new THREE.MeshStandardMaterial({color:this.config.secondary, emissive:this.config.secondary, emissiveIntensity:1.2}));
    eye.position.set(0,3.35,0.38);
    g.add(eye);
    // antenna for TUF
    if (this.config.id.startsWith('tuf')) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.9,4), new THREE.MeshStandardMaterial({color:0x222222}));
      ant.position.set(0.25,3.8,0);
      g.add(ant);
    }
    return g;
  }

  private buildArm(side: 'left'|'right'): THREE.Group {
    const g = new THREE.Group();
    const x = side==='left' ? -1.55 : 1.55;
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.26,0.9,8), new THREE.MeshStandardMaterial({color:0x3a3e44}));
    upper.position.set(x, 2.2, 0.15);
    upper.rotation.z = side==='left' ? 0.1 : -0.1;
    g.add(upper);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.8,0.38), new THREE.MeshStandardMaterial({color:0x2e3238}));
    lower.position.set(x,1.5,0.28);
    g.add(lower);

    // weapon mock
    const isRight = side==='right';
    let weapon: THREE.Mesh;
    if (this.config.id==='tuf-01' && isRight) {
      weapon = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.35,1.8), new THREE.MeshStandardMaterial({color:0x111111, metalness:0.7}));
      weapon.position.set(x,1.55,0.9);
    } else if (this.config.id==='tuf-02' && side==='right') {
      weapon = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,2.2,8), new THREE.MeshStandardMaterial({color:0x3a5a8a, metalness:0.8}));
      weapon.rotation.x = Math.PI/2;
      weapon.position.set(x,2.0,0.2);
    } else if (this.config.id==='mff-01') {
      weapon = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.15,0.9), new THREE.MeshStandardMaterial({color:0xaa2222}));
      weapon.position.set(x,1.5,0.7);
    } else if (this.config.id==='mff-02' && side==='right') {
      weapon = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,0.5), new THREE.MeshStandardMaterial({color:0x5a2a2a}));
      weapon.position.set(x+0.1,2.85,0);
      // missiles
      for(let i=0;i<2;i++){
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.5,6), new THREE.MeshStandardMaterial({color:0xcccccc}));
        m.rotation.x=Math.PI/2;
        m.position.set(x+0.1,2.85,0.3+i*0.2);
        g.add(m);
      }
    } else if (this.config.id==='mff-03' && isRight) {
      weapon = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.32,1.4,8), new THREE.MeshStandardMaterial({color:0xff3b00, emissive:0xff3b00, emissiveIntensity:0.4, metalness:0.5}));
      weapon.rotation.x = Math.PI/2;
      weapon.position.set(x,1.6,0.85);
    } else {
      weapon = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.22,0.8), new THREE.MeshStandardMaterial({color:0x333333}));
      weapon.position.set(x,1.5,0.65);
    }
    g.add(weapon);

    // shield for tuf-01 left
    if (this.config.id==='tuf-01' && side==='left') {
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.5,0.12), new THREE.MeshStandardMaterial({color:0xd0d4d8, metalness:0.4, roughness:0.5}));
      shield.position.set(x,1.7,0.6);
      shield.rotation.y = 0.25;
      g.add(shield);
    }

    this.root.add(g);
    return g;
  }

  private buildBackpack(): THREE.Group {
    const g = new THREE.Group();
    const pack = new THREE.Mesh(new THREE.BoxGeometry(1.1,0.9,0.5), new THREE.MeshStandardMaterial({color:0x2a2e33}));
    pack.position.set(0,2.4,-0.75);
    g.add(pack);
    this.root.add(g);

    // thrusters
    for (const side of [-1,1]) {
      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.45,8), new THREE.MeshStandardMaterial({color:0x111111, emissive:0xff6600, emissiveIntensity:0}));
      thruster.rotation.x = Math.PI/2;
      thruster.position.set(side*0.4, 2.25, -1.05);
      g.add(thruster);
      this.thrusters.push(thruster);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18,0.6,8), new THREE.MeshBasicMaterial({color:0xff7700, transparent:true, opacity:0}));
      flame.rotation.x = -Math.PI/2;
      flame.position.set(side*0.4,2.25,-1.4);
      flame.userData.isFlame = true;
      g.add(flame);
      (thruster as any).flame = flame;
    }

    // extra for support drones
    if (this.config.id==='tuf-03') {
      for(let i=0;i<2;i++){
        const drone = new THREE.Mesh(new THREE.SphereGeometry(0.14,6,6), new THREE.MeshStandardMaterial({color:0x2ecc71, emissive:0x2ecc71, emissiveIntensity:0.8}));
        drone.position.set((Math.random()-0.5)*1.2, 3.2+Math.random()*0.8, -0.6+Math.random()*0.6);
        g.add(drone);
      }
    }

    return g;
  }

  setThruster(active:boolean, intensity=1){
    this.thrusters.forEach(t=>{
      (t.material as THREE.MeshStandardMaterial).emissiveIntensity = active? 2*intensity:0;
      const flame = (t as any).flame as THREE.Mesh;
      if (flame) {
        (flame.material as THREE.MeshBasicMaterial).opacity = active? 0.85*intensity:0;
        flame.scale.setScalar(active? 1+intensity*0.3:0);
      }
    });
  }

  setDamage(level:number){
    // darken based on damage
    const t = Math.max(0, Math.min(1, level));
    this.meshParts.forEach(m=>{
      (m.material as THREE.MeshStandardMaterial).color.lerp(new THREE.Color(0x331111), t*0.4);
    });
  }

  setPose(walkPhase:number, isBoosting:boolean, isStaggered:boolean){
    // simple procedural animation: bob
    const bob = Math.sin(walkPhase*6) * 0.06;
    this.root.position.y = bob;
    if (isBoosting) this.root.rotation.x = -0.12;
    else this.root.rotation.x = 0;
    if (isStaggered) this.root.rotation.z = Math.sin(performance.now()*0.02)*0.12;
    else this.root.rotation.z = 0;
  }

  setAim(yaw:number, pitch:number){
    // rotate upper parts
    this.head.rotation.y = yaw*0.35;
    this.head.rotation.x = pitch*0.3;
  }

  setVisible(v:boolean){ this.group.visible = v; }
}
