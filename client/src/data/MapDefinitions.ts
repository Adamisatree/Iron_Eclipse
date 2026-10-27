export interface MapDefinition {
  id: string;
  name: string;
  theme: 'orbital' | 'mars' | 'ice' | 'shipyard';
  size: number; // meters
  description: string;
  spawnProtection: number;
  hazards: { type: string; damage: number }[];
}

export const MAPS: MapDefinition[] = [
  {
    id: 'orbital-relay',
    name: '轨道电梯中继站',
    theme: 'orbital',
    size: 220,
    description: '三层垂直，中央电梯井，两侧掩体，适合3v3。冷光+体积雾。',
    spawnProtection: 3,
    hazards: [{ type: 'steam', damage: 8 }]
  },
  {
    id: 'mars-mine',
    name: '火星矿井',
    theme: 'mars',
    size: 180,
    description: '红沙、传送带、矿车掩体、狭窄通道，近战优势。',
    spawnProtection: 3,
    hazards: [{ type: 'electro-floor', damage: 12 }]
  },
  {
    id: 'ice-refinery',
    name: '冰原精炼厂',
    theme: 'ice',
    size: 260,
    description: '冷白、蒸汽管、滑地、冷却塔，狙击高点。',
    spawnProtection: 3,
    hazards: [{ type: 'cryo-vent', damage: 10 }]
  },
  {
    id: 'shipyard',
    name: '废弃船坞',
    theme: 'shipyard',
    size: 240,
    description: '大型机库、可破坏护栏、吊车，导弹压制优势。',
    spawnProtection: 3,
    hazards: [{ type: 'fall', damage: 15 }]
  }
];

export const SPAWN_POINTS: Record<string, { teamA: [number, number, number][], teamB: [number, number, number][] }> = {
  'orbital-relay': {
    teamA: [[-85, 0, -85], [-80, 0, -60], [-60, 0, -85]],
    teamB: [[85, 0, 85], [80, 0, 60], [60, 0, 85]]
  },
  'mars-mine': {
    teamA: [[-70, 0, -60], [-75, 0, -40], [-60, 0, -50]],
    teamB: [[70, 0, 60], [75, 0, 40], [60, 0, 50]]
  },
  'ice-refinery': {
    teamA: [[-90, 0, -20], [-85, 0, 0], [-80, 0, 20]],
    teamB: [[90, 0, -20], [85, 0, 0], [80, 0, 20]]
  },
  'shipyard': {
    teamA: [[-80, 0, -70], [-70, 0, -80], [-90, 0, -60]],
    teamB: [[80, 0, 70], [70, 0, 80], [90, 0, 60]]
  }
};
