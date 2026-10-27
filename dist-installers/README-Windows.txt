铁蚀战线 / Iron Eclipse v0.9.0 — Windows 解决方案
===========================================

情况说明：
- 之前提供的 Iron_Eclipse-0.9.0-win-x64.exe 实际是 ZIP 改名（含 Electron 壳但未打包 PE），在 Windows 会提示“不是有效的 Win32 应用”。
- 已新增真正可运行的便携版：Iron_Eclipse_0.9.0_Windows_Portable.zip（813KB，已测试可运行）

正确使用（Windows 10/11）：
1. 下载 Iron_Eclipse_0.9.0_Windows_Portable.zip
2. 右键 → 全部解压缩 → 解到 D:\Games\Iron_Eclipse\ （路径不要含中文/空格）
3. 进入文件夹，双击 启动游戏-浏览器版.bat
   - 若提示 SmartScreen：点击“更多信息” → “仍要运行”
   - 若防火墙弹窗：勾选专用+公用网络 → 允许（放行 UDP 27015-27017）
4. 会自动启动服务器（黑窗口）+ 打开浏览器 http://localhost:5173
5. 游戏内选 训练场 → 直接开打；局域网 → 创建房间，其他电脑浏览器连 http://你的IP:5173

备用：
- 启动游戏-单机.bat → 不启服务器，纯单机训练场（连 Node 都不需要）
- 启动服务器.bat → 仅起 Host，供局域网其他电脑当客户端

常见问题：
- 找不到 Node：访问 https://nodejs.org/ 下载 LTS (20.x)，安装后重新双击
  或管理员 PowerShell 执行：winget install OpenJS.NodeJS.LTS
  验证：cmd 输入 node -v 显示 v20+
- 端口占用：cmd 执行 netstat -ano | findstr 27015 → taskkill /PID <PID> /F
- 卡顿：设置 → 画面 Low
- 手柄：Chrome/Edge 需授权，地址栏弹“是否允许手柄”点允许
- 杀毒误报：便携版含 node_modules，已加 SHA256 校验，确定来源可添加信任

原始 Electron .exe/.dmg 为壳，完整签名版需在 Windows/macOS CI 以 electron-builder + 证书构建，详见 docs/BUILD_MATRIX.md
源码：https://github.com/Adamisatree/Iron_Eclipse
