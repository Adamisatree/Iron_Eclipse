# 网络协议 — Host 权威 Listen Server

## 端口
- 27015 游戏 WS (模拟 UDP)  : 可靠/不可靠通道，MTU≤1200，分片
- 27016 发现 UDP (模拟 via BroadcastChannel + WS ROOM_ANNOUNCE)
- 27017 大厅控制 UDP (模拟 via WS)

## 发现
```
客户端每2s → 255.255.255.255:27016  DISCOVER_REQ
Host 回 → ROOM_ANNOUNCE {roomId, roomName, hostIp, gamePort, protocolVersion, buildHash, currentPlayers, maxPlayers, mapId, modeId, hasPassword, hostName}
多网卡逐网卡广播，支持手动直连 IP
```

## 大厅协议 (可靠+序列+ACK)
`HELLO WELCOME VERSION_CHECK LOBBY_STATE PLAYER_JOIN PLAYER_LEAVE SET_READY SWITCH_TEAM SET_LOADOUT CHAT START_MATCH KICK PING`

## 游戏同步
- tick 60Hz 快照 20–30Hz 输入 30–60Hz
- 输入帧 `tick, seq, moveX, moveY, yaw, pitch, buttons, clientTime`
- 快照 `tick, entities[] {netId, position, rotation, velocity, armor, structure, heat, state, animState}`
- 本地预测移动/冲刺/跳跃，服务器校正阈值 0.25m/5° 平滑回正
- 远程插值100ms，外推150ms，动画由服务器状态驱动
- 射击客户端预测弹道/枪口火光，服务器模拟命中回发 HIT_CONFIRM，hitscan 200ms延迟补偿，历史hitbox
- 投射物服务器模拟，客户端显示视觉弹道，导弹锁定服务器验证

## 重连与主机
- 加入时发 sessionToken，断线60s保留角色/机体
- Host退出 → 全员返回大厅提示“Host已离开”，首版不做迁移
- 单人训练可暂停，多人不暂停

## 安全
版本/构建哈希/协议强校验，密码房，Host权威，不信任客户端伤害/位置，速率限制，踢人/黑名单，局域网有限防护，排位未来专用服务器
