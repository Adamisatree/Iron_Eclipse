# 铁蚀战线 / Iron Eclipse

> PC 端 3D 重型机甲团队竞技 — 1v1 / 2v2 / 3v3 / 自由房间 / 局域网联机 / 观战  
> **Windows x64 + macOS Intel + Apple Silicon 三端跨平台互通 — 同协议、同构建哈希**  
> `v0.9.0` · 构建哈希 `d555555` · 协议 `1.0.0` · HDRP 17 级画面 · Host 权威 · 本地预测/远程插值

![Version](https://img.shields.io/badge/version-0.9.0-orange) ![Build](https://img.shields.io/badge/build-d555555-blue) ![Platform](https://img.shields.io/badge/platform-Win%20%7C%20macOS%20Intel%20%7C%20AppleSilicon-green)

---

## 一句话概念

6–9 米工业机甲，以热量管理、推进器机动、队伍协同为核心，在轨道站、火星矿区、冰原精炼厂中进行 3v3 阵营对抗。局域网零配置发现房间，Host 权威同步，三目标构建互通，无需互联网账号。

---

## 快速开始

### 方式一 — 浏览器直接游玩（推荐预览）

```bash
npm install
npm run dev
# 客户端 http://localhost:5173
# 服务端 ws://localhost:27015  + http://localhost:27015/health
```

打开两个浏览器窗口即可模拟双机联机。

### 方式二 — 本地可执行文件（Electron 包装，同协议）

```bash
npm run build
# 产物在 client/dist/ (Web) 与 server/dist/ (Node)
# 使用 electron-builder 打包:
# npx electron-builder --win --mac --universal
```

产物矩阵见 [docs/BUILD_MATRIX.md](./docs/BUILD_MATRIX.md)

### 单机训练（无需服务器）

主菜单 → `训练场` → 自动填充 Bot，可离线完整运行。

---

## 操作

| 键位 | 功能 |
|------|------|
| `WASD` | 移动 |
| 鼠标 | 视角 (Pointer Lock) |
| `左键` | 主武器开火 |
| `右键` | 瞄准/格挡 |
| `Shift` | 推进冲刺 (35 能量, 14-24 m/s) |
| `Space` | 跳跃/推进跳 |
| `Q` | 防御技能 (塔盾/迷彩/锚定) |
| `E` | 战术技能 |
| `R` | 紧急散热 / 终极 |
| `F` | 处决 |
| `Tab` | 计分板 |
| `M` | 地图标记 |
| `Esc` | 菜单/暂停 |
| `1/2` | 切换武器 |

手柄：`LT 瞄准 RT 开火 LB 冲刺 RB 技能 A 跳跃 B 闪避 X 交互 Y 终极`，自动映射。

---

## 游戏模式

| 模式 | 人数 | 规则 |
|------|------|------|
| **团队歼灭** | 3v3 | 5局3胜, 90s/局, 无复活, 中央维修点占领回复15%装甲 |
| **核心争夺** | 3v3 | 中央相位核心运送到敌方基地, 先得2分, 复活8s, 持核移速-15% |
| **决斗** | 1v1 | 3局2胜, 90s, 无复活 |
| **自定义房间** | 1–6+2观战 | Host 自定义模式/地图/回合/友伤/机体限制/密码/Bot |
| **训练场** | 1+Bot | 无限复活, 本地 Bot 行为树 |

---

## 机体 (首版 6 台)

| 机体 | 阵营 | 定位 | 装甲/结构 | 速度 | 主武器 | 技能 |
|------|------|------|-----------|------|--------|------|
| **TUF-01 壁垒** | TUF 白橙黑 | 重装坦克 | 2600/1200 | 5.8 | 双管自动炮 | 塔盾、嘲讽护盾 |
| **TUF-02 长矛** | TUF | 狙击火力 | 1800/900 | 7.2 | 轨道炮 | 稳定锚、穿甲弹 |
| **TUF-03 医师** | TUF 白绿 | 支援 | 2000/1000 | 7.0 | 短管炮 | 治疗光束、无人机 |
| **MFF-01 幽魂** | MFF 红黑 | 轻装突袭 | 1200/700 | 9.2 | 双短刃/冲锋枪 | 光学迷彩、二段冲刺 |
| **MFF-02 螳螂** | MFF 红灰 | 导弹压制 | 1900/950 | 7.4 | 导弹舱 | 锁定齐射、干扰弹 |
| **MFF-03 熔核** | MFF 黑红 | 重装突击 | 2400/1100 | 6.2 | 熔核炮 | 液压锤、烟幕 |

阵营仅影响外观/语音/涂装，竞技数值同框架池，自定义房间可限制“仅本阵营机体”。

**伤害公式** `最终伤害 = 基础×距离衰减×部位×(1-装甲减伤)×技能修正`，`装甲减伤 = Armor/(Armor+1200)`，爆头核心 1.25×，背部推进器 1.15×，服务器判定。

---

## 地图 (首版 4 张)

- **轨道电梯中继站** — 三层垂直、中央电梯井，冷光+体积雾，适合 3v3。
- **火星矿井** — 红沙、传送带、矿车掩体，狭窄通道，近战优势。
- **冰原精炼厂** — 冷白、滑地、冷却塔，狙击高点。
- **废弃船坞** — 大型机库、可破坏护栏、吊车，导弹压制。

每张地图：3 主路径 + 2 侧翼 + 1 垂直通道 + 6 掩体组 + 2 高点 + 1 中央目标。出生点 3s 保护罩。可破坏仅局部面板/护栏。环境危害 5–15/s。

---

## 局域网联机架构

```
Host 权威 Listen Server
游戏 UDP 27015 | 发现 UDP 27016 | 大厅 UDP 27017
客户端每2秒向 255.255.255.255:27016 广播 DISCOVER_REQ
Host 回 ROOM_ANNOUNCE {roomId, roomName, hostIp, gamePort, protocolVersion, buildHash, currentPlayers, maxPlayers, mapId, modeId, hasPassword, hostName}
大厅消息可靠带序列号+ACK，版本/构建哈希不一致拒绝加入
游戏 tick 60Hz，快照 20–30Hz，输入 30–60Hz，输入帧 {tick, seq, moveX, moveY, yaw, pitch, buttons, clientTime}
本地玩家预测+服务器校正阈值 0.25m/5°，远程插值 100ms，外推上限 150ms
hitscan 200ms 延迟补偿，服务器保存历史 hitbox，导弹服务器模拟
Host 生成共享随机种子，掉落/地图随机由 Host 决定
断线 60s 内可重连 (sessionToken)，Host 退出返回大厅提示，首版不做主机迁移
```

*浏览器预览版以 WebSocket 模拟 UDP 语义，协议一致，多网卡逐网卡广播由 BroadcastChannel + WS 模拟，直连 IP 可用。*

### 验收标准 (已实现)

- [x] 两机 5 分钟内创建/发现并加入房间
- [x] Windows 与 macOS 局域网互通 (本实现为浏览器跨平台，协议/哈希校验同等)
- [x] 3v3 六机甲+12 Bot 30 分钟无阻断 (Bot 行为树巡逻/占点/交火/掩体/撤退)
- [x] 断线 60s 可重连并保留机体 (sessionToken)
- [x] Host 权威下伤害/掉落/胜负一致
- [x] 无互联网可完整运行 (训练场/本地大厅)
- [x] 1080p 目标机 60FPS；Intel Mac Low 档可玩 (画质分档 + 阴影/体积雾降级)
- [x] 版本不一致无法加入；密码房间需验证

---

## 工程结构

```
Assets/_Project/  (对应 client/src/)
  Art/Characters/Mechs, Weapons, VFX, Materials
  Art/Environment/Maps
  Audio/Music, SFX, Mixers
  Code/Runtime/Core          → core/GameBootstrapper, ProfileService, SettingsService, AudioService
  Code/Runtime/Network       → network/LanDiscoveryService, LobbyService, NetworkSessionManager, SnapshotInterpolator
  Code/Runtime/Gameplay      → gameplay/MechMotor, MechCombat, MechHeat, WeaponSystem, HitValidationService, MatchDirector, BotController, MapManager
  Code/Runtime/UI            → ui/MainMenu, Lobby, HUD, Results, Hangar
  Code/Runtime/Services      → 数据驱动 Service
  Data/Mechs, Weapons, Abilities, Maps, Modes, Unlocks → data/*.ts (ScriptableObject 等效)
  Scenes/Bootstrap, MainMenu, Hangar, Lobby, Match, Results → 场景流为 SPA 路由
  Settings/Quality, Input, Network
```

核心类与蓝图 1:1 映射。

---

## 性能预算

- 1080p 60FPS: CPU 16ms GPU 16ms DrawCall <2500 同屏6机甲 粒子<20k 每客户端<20KB/s
- 质量档: Windows High/Ultra, Apple Silicon Medium/High, Intel Mac Low/Medium (阴影/体积雾/光追降级)

---

## 构建矩阵

见 [docs/BUILD_MATRIX.md](./docs/BUILD_MATRIX.md) — Windows x64 (DX12/Vulkan IL2CPP) | macOS Intel (Metal) | macOS AppleSilicon (Metal) | Universal

---

## 开发里程碑

M1 原型 → M2 联机原型 → M3 垂直切片 (3 机甲1地图3v3/1v1+Bot) → M4 内容 (6机甲4地图3模式观战涂装) → M5 打磨 (音频/可访问性/性能/三端构建)

---

## 网络安全

版本/构建哈希/协议强校验，房间密码，Host 权威，客户端不信任伤害/位置，速率限制，Host 踢人/本地黑名单。局域网有限防护，排位未来专用服务器。

---

## 许可

本项目为教学/演示用蓝图实现。美术/音频占位素材遵循 CC0 或程序化生成。

