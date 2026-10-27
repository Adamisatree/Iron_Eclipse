import * as THREE from 'three';

export interface EntitySnapshot {
  netId: string;
  position: [number,number,number];
  rotation: [number,number,number];
  velocity: [number,number,number];
  armor: number;
  structure: number;
  heat: number;
  state: string;
  animState: string;
  hp: number;
}

export interface WorldSnapshot {
  tick: number;
  time: number;
  entities: EntitySnapshot[];
  events: any[];
}

export class SnapshotInterpolator {
  private buffer: WorldSnapshot[] = [];
  private maxBuffer = 32;
  interpolationDelay = 100; // ms

  push(snap: WorldSnapshot) {
    this.buffer.push(snap);
    if (this.buffer.length > this.maxBuffer) this.buffer.shift();
  }

  // get interpolated entities at render time
  getInterpolated(renderTime: number): Map<string, {pos: THREE.Vector3, rot: THREE.Euler, vel: THREE.Vector3}> {
    const targetTime = renderTime - this.interpolationDelay;
    const res = new Map();
    if (this.buffer.length < 2) return res;
    let a = this.buffer[0], b = this.buffer[1];
    for (let i=0;i<this.buffer.length-1;i++){
      if (this.buffer[i].time <= targetTime && this.buffer[i+1].time >= targetTime) { a=this.buffer[i]; b=this.buffer[i+1]; break; }
    }
    const dt = (b.time - a.time) || 1;
    const t = Math.max(0, Math.min(1, (targetTime - a.time)/dt));

    const mapA = new Map(a.entities.map(e=>[e.netId,e]));
    const mapB = new Map(b.entities.map(e=>[e.netId,e]));
    for (const id of mapB.keys()) {
      const ea = mapA.get(id), eb = mapB.get(id)!;
      if (!ea) continue;
      const pos = new THREE.Vector3(
        THREE.MathUtils.lerp(ea.position[0], eb.position[0], t),
        THREE.MathUtils.lerp(ea.position[1], eb.position[1], t),
        THREE.MathUtils.lerp(ea.position[2], eb.position[2], t)
      );
      const rot = new THREE.Euler(0, THREE.MathUtils.lerp(ea.rotation[1], eb.rotation[1], t), 0);
      const vel = new THREE.Vector3(...eb.velocity);
      res.set(id, {pos, rot, vel});
    }
    return res;
  }

  latest(): WorldSnapshot | null { return this.buffer[this.buffer.length-1] || null; }
}
