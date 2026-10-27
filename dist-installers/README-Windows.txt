铁蚀战线 / Iron Eclipse v0.9.1 — Windows 安装说明
===========================================

【推荐】一键安装版（真正的 Windows exe）：
  - Iron_Eclipse_0.9.0_Windows_Setup.exe（818KB，真 PE32+ x64 Installer）
  - 双击 → 弹出确认 → 点“是” → 自动解压到 %USERPROFILE%\Games\Iron Eclipse
    自动创建桌面快捷方式 “Iron Eclipse.lnk” + 开始菜单
    安装后自动运行 Launch.bat（启动服务器 + 浏览器）
  - 无需管理员（写到用户目录），企业/网吧也可用

便携版（备用）：
  - Iron_Eclipse_0.9.0_Windows_Portable.zip（815KB）
  - 右键全部解压到 D:\Games\Iron_Eclipse\ → 双击 Launch.bat

联机说明（Host 即服务器 + 局域网搜房）：
  - 谁建房谁是房主/服务器（Host authoritative，端口 27015 WS/UDP）
  - 房主：游戏内 → 联机 → 创建房间（可设密码、选图选模式）→ 等人加入 → 开始
  - 客人：同一 WiFi/局域网 → 搜索房间 → 自动 UDP 27016 广播发现 → 加入
  - 若搜不到：房主把本机 IP 发给客人（房主机器执行 ipconfig 看 IPv4），客人手动输 IP:27015 直连

防火墙/网络：
  - 首次运行放行 UDP 27015-27017（专用+公用都勾）
  - 网吧/受限网络：用手机热点同网 + 直连 IP 最稳

验证：
  SHA256SUMS.txt 含所有发行文件哈希，PowerShell 执行：
    Get-FileHash Iron_Eclipse_0.9.0_Windows_Setup.exe -Algorithm SHA256
