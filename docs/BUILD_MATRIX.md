# 构建矩阵

| 目标 | 架构 | 图形 | 工具链 | 产物 | 备注 |
|------|------|------|--------|------|------|
| Windows x64 | x86_64 | DX12/Vulkan (WebGL2 via Electron) | Vite + tsc + electron-builder | `Iron-Eclipse-0.9.0-win-x64.exe` / NSIS | IL2CPP 等效：tsc ESNext |
| macOS Intel | x86_64 | Metal (via Electron) | Vite + tsc + electron-builder | `Iron-Eclipse-0.9.0-mac-intel.dmg` | macOS 12+ |
| macOS Apple Silicon | arm64 | Metal | Vite + tsc + electron-builder | `Iron-Eclipse-0.9.0-mac-arm64.dmg` | macOS 13+ |
| macOS Universal | x86_64+arm64 | Metal | electron-builder --universal | `Iron-Eclipse-0.9.0-mac-universal.dmg` | 推荐发布包 |
| Web (预览) | wasm/JS | WebGL2 | Vite | `client/dist/` | 供 Arena 预览 |
| Server | node x64/arm64 | — | tsc | `server/dist/` | Node WS Host |

## 本地构建

```bash
npm install
npm run build        # 同时构建 client + server
npx tsc --noEmit     # 类型检查
```

### Electron 打包 (需本地安装 electron-builder)

```bash
npm install -D electron electron-builder
# 配置 electron/main.js 指向 client/dist + server/dist
npx electron-builder --win --x64
npx electron-builder --mac --x64
npx electron-builder --mac --arm64
npx electron-builder --mac --universal
```

产物自动签名：Windows (signtool) / macOS (codesign + notarytool)。 三端同协议 `1.0.0` + 构建哈希 `d555555` 校验，版本不一致拒绝加入。

## CI

GitHub Actions 示例 (`.github/workflows/build.yml`)：

```yaml
jobs:
  build:
    strategy:
      matrix: { os: [windows-latest, macos-13, macos-14] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --publish never  # 按矩阵
```

每次提交构建三目标，跑 `启动`、`发现`、`加入房间`、`开始比赛` 冒烟测试。

## 运行要求

- Windows 10/11 x64, macOS 12+ (Intel) / 13+ (Apple Silicon)
- 1080p 60FPS 目标，Intel Mac Low 档自动降级
- 局域网 UDP 端口放行 27015-27017，首次启动提示防火墙
- 无互联网可运行 (训练场/本地大厅)
