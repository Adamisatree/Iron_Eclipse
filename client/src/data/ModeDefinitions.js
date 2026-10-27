export const MODES = [
    {
        id: 'annihilation',
        name: '团队歼灭',
        playerCount: '3v3',
        roundsToWin: 3,
        roundTime: 90,
        respawn: null,
        description: '5局3胜，每局90秒无复活，全灭或血量高者胜。中央维修点占领回复15%装甲。'
    },
    {
        id: 'core',
        name: '核心争夺',
        playerCount: '3v3',
        roundsToWin: 2,
        roundTime: 300,
        respawn: 8,
        description: '地图中央相位核心，运送到敌方基地得分，先得2分胜。持核移速-15%。'
    },
    {
        id: 'duel',
        name: '决斗',
        playerCount: '1v1',
        roundsToWin: 2,
        roundTime: 90,
        respawn: null,
        description: '3局2胜，90秒无复活。'
    },
    {
        id: 'custom',
        name: '自定义房间',
        playerCount: '1-6',
        roundsToWin: 3,
        roundTime: 120,
        respawn: 8,
        description: '自由设置人数、模式、地图、回合、友伤、机体限制、密码、Bot。'
    },
    {
        id: 'training',
        name: '训练场',
        playerCount: '1',
        roundsToWin: 1,
        roundTime: 600,
        respawn: 2,
        description: '本地Bot填充，无限复活，练习操作。'
    }
];
