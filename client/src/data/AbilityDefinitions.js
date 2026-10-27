export const ABILITIES = [
    { id: 'tower-shield', name: '塔盾展开', key: 'Q', cooldown: 8, duration: 3.0, heatCost: 12, description: '展开塔盾，正面减伤80%，可移动', type: 'shield' },
    { id: 'taunt-barrier', name: '嘲讽护障', key: 'E', cooldown: 14, duration: 5.0, heatCost: 18, description: '生成护障吸引火力，自身装甲回复15%', type: 'shield' },
    { id: 'anchor', name: '稳定锚', key: 'Q', cooldown: 6, duration: 4.0, heatCost: 8, description: '锚定地面，轨道炮后坐归零，精度提升', type: 'utility' },
    { id: 'armor-piercing', name: '穿甲弹', key: 'E', cooldown: 10, heatCost: 10, description: '下一发无视50%装甲减伤', type: 'attack' },
    { id: 'heal-beam', name: '治疗光束', key: 'Q', cooldown: 0.5, heatCost: 2, description: '持续治疗友方', type: 'support' },
    { id: 'repair-drones', name: '维修无人机', key: 'E', cooldown: 18, duration: 8.0, heatCost: 20, description: '释放3架无人机跟随治疗', type: 'support' },
    { id: 'optic-camo', name: '光学迷彩', key: 'Q', cooldown: 12, duration: 4.0, heatCost: 16, description: '近距离隐身，移动显形', type: 'mobility' },
    { id: 'double-dash', name: '二段冲刺', key: 'E', cooldown: 7, heatCost: 12, description: '空中可二次推进', type: 'mobility' },
    { id: 'missile-volley', name: '锁定齐射', key: 'Q', cooldown: 9, heatCost: 15, description: '锁定目标发射6枚导弹', type: 'attack' },
    { id: 'chaff', name: '干扰弹', key: 'E', cooldown: 12, duration: 3.0, heatCost: 10, description: '释放干扰云，偏转导弹', type: 'utility' },
    { id: 'molten-cannon', name: '熔核过载', key: 'Q', cooldown: 11, heatCost: 18, description: '下次熔核炮范围爆炸', type: 'attack' },
    { id: 'hydraulic-hammer', name: '液压重锤', key: 'E', cooldown: 7, heatCost: 14, description: '重锤冲击，造成硬直', type: 'attack' },
    { id: 'vent', name: '紧急散热', key: 'R', cooldown: 20, heatCost: -60, description: '强制散热，清空60热量，1.5s无法开火', type: 'utility' }
];
