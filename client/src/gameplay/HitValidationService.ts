import * as THREE from 'three';

export interface HitRequest {
  tick: number;
  shooterId: string;
  weaponId: string;
  origin: [number,number,number];
  direction: [number,number,number];
  clientTime: number;
}

export interface HitResult {
  hit: boolean;
  targetId?: string;
  damage: number;
  isHead: boolean;
  isBack: boolean;
  position: [number,number,number];
}

export class HitValidationService {
  // server-side validation with lag compensation: keep history of positions
  private history: Map<string, {pos: THREE.Vector3, time: number}[]> = new Map();
  private maxHistory = 30; // ~500ms at 60Hz

  recordPosition(netId: string, pos: THREE.Vector3, time = performance.now()) {
    if (!this.history.has(netId)) this.history.set(netId, []);
    const arr = this.history.get(netId)!;
    arr.push({pos: pos.clone(), time});
    if (arr.length > this.maxHistory) arr.shift();
  }

  validate(req: HitRequest, shooterPos: THREE.Vector3, allEntities: Map<string, {pos: THREE.Vector3, radius:number, mechId:string}>): HitResult | null {
    const dir = new THREE.Vector3(...req.direction).normalize();
    const origin = new THREE.Vector3(...req.origin);

    // simplistic hitscan: raycast against spheres
    let closest: {id:string, dist:number, hitPos:THREE.Vector3} | null = null;
    for (const [id, ent] of allEntities) {
      if (id === req.shooterId) continue;
      // lag compensate: find position at clientTime - ping estimate 80ms
      const hist = this.history.get(id);
      let pos = ent.pos;
      if (hist && hist.length) {
        const targetTime = req.clientTime - 80;
        // find closest
        let best = hist[0];
        for (const h of hist) if (Math.abs(h.time - targetTime) < Math.abs(best.time - targetTime)) best = h;
        pos = best.pos;
      }
      // ray-sphere
      const L = pos.clone().sub(origin);
      const tca = L.dot(dir);
      if (tca < 0) continue;
      const d2 = L.dot(L) - tca*tca;
      const r = ent.radius;
      if (d2 > r*r) continue;
      const thc = Math.sqrt(r*r - d2);
      const dist = tca - thc;
      if (closest===null || dist < closest.dist) closest = {id, dist, hitPos: origin.clone().addScaledVector(dir, dist)};
    }
    if (!closest) return { hit:false, damage:0, isHead:false, isBack:false, position: origin.clone().addScaledVector(dir, 80).toArray() as any };

    // damage base
    // distance falloff handled by weapon system; here just return
    const isHead = Math.random() < 0.12;
    const isBack = Math.random() < 0.1;
    return { hit:true, targetId: closest.id, damage: 0, isHead, isBack, position: closest.hitPos.toArray() as any };
  }
}
