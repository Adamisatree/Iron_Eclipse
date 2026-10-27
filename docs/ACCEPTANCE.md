# 验收测试清单

> 对应蓝图第十章验收标准，已可自动化/手工验证

## 1. 5分钟内创建/发现并加入房间
- 启动 server (`npm run dev --workspace=server`)，两客户端 `npm run dev --workspace=client`
- 客户端A：主菜单 → 局域网 → 输入房间名 → 创建并成为 Host
- 客户端B：局域网页面自动刷新 (每2s广播) → 列表出现房间 → 点击加入
- 预期：<3s 内发现，加入后进入大厅能看到对方，聊天互通

## 2. Windows 与 macOS 跨平台互通
- 协议 `1.0.0` + 构建哈希 `d555555` 强校验
- 在不同 OS 打开同一版本构建 (`client/dist` via Electron)，尝试加入
- 预期：同版本可联机；故意改 `buildHash` 后提示“版本不一致无法加入”

## 3. 3v3 六机甲+12 Bot 30分钟无阻断
- 主菜单 → 训练场或自定义房间 6人+2观战 + Bot填充
- 让 BotController 行为树持续巡逻/占点/交火，观察内存与帧率
- 预期：1080p 60FPS 维持 (CPU<16ms/GPU<16ms)，无崩溃

## 4. 断线60秒可重连
- 局域网对战中，关闭客户端B标签页，Host 保留角色60s
- 重新打开 → 输入直连 IP 或从列表重连，携带 `sessionToken`
- 预期：保留机体与队伍，重返战场

## 5. Host 权威下伤害/掉落/胜负一致
- 手工测试：射击同一目标，两端血量一致
- 查看 server 日志 `MatchDirector start` 与客户端 `HIT_CONFIRM` 回发
- 胜负由 Host `MatchDirector` 判定，客户端仅显示

## 6. 无互联网可完整运行
- 断网，`npm run dev` → 训练场/Bot/本地大厅仍可用
- 预期：不依赖外网账号，完成单局

## 7. 1080p 60FPS；Intel Mac Low 档可玩
- 设置 → 质量 Low，验证 Intel Mac 自动降级 (体积雾/阴影距离减半/无光追)
- 预期：Low 档 DrawCall<2500，同屏6机甲流畅

## 8. 版本/密码校验
- 创建密码房，B不输密码 → 报错
- 客户端改 protocolVersion → 报错 “版本不一致无法加入”

## 自动化冒烟

```bash
curl http://localhost:27015/health
# {status:ok, version:0.9.0, buildHash:d555555, protocol:1.0.0}
npm run build  # 三目标构建通过
```

已通过：`npm run build --workspace=client` ✓ 557kB / gzip 146kB；`--workspace=server` ✓
