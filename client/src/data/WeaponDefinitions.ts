export type HitType = 'hitscan' | 'projectile' | 'melee' | 'beam' | 'missile';

export interface WeaponDefinition {
  id: string;
  name: string;
  hitType: HitType;
  damage: number;
  fireRate: number; // rounds per second
  magazine: number;
  reserve: number;
  heatPerShot: number;
  range: number;
  falloffStart: number;
  falloffEnd: number;
  falloffFactor: number; // 0-1
  projectileSpeed?: number;
  description: string;
}

export const WEAPONS: WeaponDefinition[] = [
  {
    id: 'autocannon-x2',
    name: '双管自动炮',
    hitType: 'hitscan',
    damage: 32,
    fireRate: 6.5,
    magazine: 40,
    reserve: 240,
    heatPerShot: 4.5,
    range: 80,
    falloffStart: 45,
    falloffEnd: 80,
    falloffFactor: 0.55,
    description: '双管连射，近中距离压制。'
  },
  {
    id: 'railgun',
    name: '电磁轨道炮',
    hitType: 'hitscan',
    damage: 220,
    fireRate: 0.6,
    magazine: 4,
    reserve: 16,
    heatPerShot: 38,
    range: 120,
    falloffStart: 80,
    falloffEnd: 120,
    falloffFactor: 0.85,
    description: '长前摇充能，穿甲，爆头1.25x。'
  },
  {
    id: 'defense-cannon',
    name: '短管防御炮',
    hitType: 'hitscan',
    damage: 24,
    fireRate: 8,
    magazine: 60,
    reserve: 360,
    heatPerShot: 3,
    range: 60,
    falloffStart: 35,
    falloffEnd: 60,
    falloffFactor: 0.5,
    description: '高射速自卫武器。'
  },
  {
    id: 'twin-blades',
    name: '双短刃',
    hitType: 'melee',
    damage: 85,
    fireRate: 2.2,
    magazine: 999,
    reserve: 999,
    heatPerShot: 6,
    range: 3.5,
    falloffStart: 3.5,
    falloffEnd: 3.5,
    falloffFactor: 1,
    description: '三段连击，处决硬直目标。'
  },
  {
    id: 'smg-burst',
    name: '冲锋枪',
    hitType: 'hitscan',
    damage: 16,
    fireRate: 12,
    magazine: 36,
    reserve: 180,
    heatPerShot: 2.2,
    range: 55,
    falloffStart: 30,
    falloffEnd: 55,
    falloffFactor: 0.45,
    description: '近距离爆发。'
  },
  {
    id: 'missile-pod',
    name: '导弹舱',
    hitType: 'missile',
    damage: 42,
    fireRate: 1.8,
    magazine: 12,
    reserve: 48,
    heatPerShot: 9,
    range: 90,
    falloffStart: 20,
    falloffEnd: 90,
    falloffFactor: 0.9,
    description: '锁定齐射4发，可被干扰弹偏转。'
  },
  {
    id: 'molten-cannon',
    name: '熔核炮',
    hitType: 'projectile',
    damage: 140,
    fireRate: 1.1,
    magazine: 6,
    reserve: 24,
    heatPerShot: 22,
    range: 75,
    falloffStart: 40,
    falloffEnd: 75,
    falloffFactor: 0.7,
    projectileSpeed: 55,
    description: '高温弹道，命中附加燃烧。'
  },
  {
    id: 'hydro-hammer',
    name: '液压锤',
    hitType: 'melee',
    damage: 160,
    fireRate: 0.9,
    magazine: 999,
    reserve: 999,
    heatPerShot: 14,
    range: 4.2,
    falloffStart: 4.2,
    falloffEnd: 4.2,
    falloffFactor: 1,
    description: '重击眩晕，可处决。'
  },
  {
    id: 'heal-beam',
    name: '维修光束',
    hitType: 'beam',
    damage: -18, // heal per tick
    fireRate: 10,
    magazine: 999,
    reserve: 999,
    heatPerShot: 1.5,
    range: 45,
    falloffStart: 45,
    falloffEnd: 45,
    falloffFactor: 1,
    description: '持续治疗友方装甲。'
  },
  {
    id: 'tower-shield',
    name: '塔盾',
    hitType: 'melee',
    damage: 25,
    fireRate: 1.0,
    magazine: 999,
    reserve: 999,
    heatPerShot: 0,
    range: 3.0,
    falloffStart: 3.0,
    falloffEnd: 3.0,
    falloffFactor: 1,
    description: '格挡减伤80%，盾击。'
  },
  {
    id: 'shield-buckler',
    name: '臂盾',
    hitType: 'melee',
    damage: 20,
    fireRate: 1.2,
    magazine: 999,
    reserve: 999,
    heatPerShot: 0,
    range: 2.8,
    falloffStart: 2.8,
    falloffEnd: 2.8,
    falloffFactor: 1,
    description: '轻量护盾。'
  },
  {
    id: 'anchor-claw',
    name: '稳定锚',
    hitType: 'melee',
    damage: 30,
    fireRate: 1.0,
    magazine: 999,
    reserve: 999,
    heatPerShot: 0,
    range: 3.2,
    falloffStart: 3.2,
    falloffEnd: 3.2,
    falloffFactor: 1,
    description: '部署后提升精度。'
  }
];

export function getWeapon(id: string) {
  return WEAPONS.find(w => w.id === id);
}
