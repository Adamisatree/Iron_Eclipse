# 铁蚀战线 TDD — 技术设计文档

## 引擎选型
Unity 6 LTS + HDRP 17.x + C# + Netcode for GameObjects + Unity Transport。  
本仓库以 Three.js + TypeScript + Node/WS 实现等效逻辑，保持模块与协议一致，便于在无 Unity 环境下完成可玩交付与三端验证。

## 技术栈映射
| Unity 蓝图 | 本实现 |
|------------|--------|
| HDRP, Shader Graph, VFX Graph, Cinemachine | Three.js ACESFilm, MeshStandard/PBR, 自定义磨损/emissive, 程序化 VFX |
| Animation Rigging, Timeline, Playable | MechRenderer procedural pose + group transform |
| Input System 1.7+ | InputCollector (键鼠+Gamepad) |
| Netcode for GO + Unity Transport (UDP) | WS (模拟可靠/不可靠通道) + BroadcastChannel (发现) |
| Addressables, ScriptableObject | data/*.ts (Mech/Weapon/Ability/Map/Mode) |
| UI Toolkit + UGUI | HTML/CSS HUD + UI 组件 |
| FMOD/Wwise | AudioService (WebAudio) |
| IL2CPP Build | Vite + tsc (Web) + Electron 包装 (桌面) |

## 网络架构
Host 权威 Listen Server。端口 27015/27016/27017。零配置发现：客户端每2s广播 DISCOVER_REQ → Host 回 ROOM_ANNOUNCE。 大厅消息可靠+序列+ACK。 游戏 tick 60Hz 快照 20–30Hz 输入 30–60Hz。本地预测+服务器校正 0.25m/5°，远程插值100ms 外推150ms。hitscan 200ms 延迟补偿，保存历史 hitbox。 投射物服务器模拟。 随机种子 Host 生成。

本实现：WS 模拟 UDP，server/src/index.ts 为权威Host，client SnapshotInterpolator 插值。

## 核心模块
GameBootstrapper, LanDiscoveryService, LobbyService, NetworkSessionManager, MatchDirector, MechMotor, MechCombat, MechHeat, HitValidationService, SnapshotInterpolator, BotController, ProfileService, SettingsService, AudioService。

## 数据表
MechDefinition, WeaponDefinition, AbilityDefinition, MapDefinition, ModeDefinition, UnlockDefinition 均为 TS 常量，等效 ScriptableObject，原子写入 JSON 存档。

## 构建
Windows x64 (DX12/Vulkan IL2CPP), macOS Intel (Metal), macOS Apple Silicon (Metal), Universal。 本仓库提供 Web + Node 构建，Electron 包装即三目标包，流程见 BUILD_MATRIX.md。

## 性能与测试
预算 CPU16/GPU16, DrawCall<2500, 同屏6, 粒子20k, 带宽20KB/s/客户端。 质量档分级，Intel Mac 降档。 测试矩阵双机/三机手工 + Network Simulator 丢包延迟模拟。
