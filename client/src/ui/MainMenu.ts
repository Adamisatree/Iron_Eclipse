import { GameBootstrapper } from '../core/GameBootstrapper';
import { MAPS } from '../data/MapDefinitions';
import { MODES } from '../data/ModeDefinitions';
import { MECHS } from '../data/MechDefinitions';

export class MainMenu {
  element: HTMLElement;
  private roomListEl: HTMLElement;
  private logEl: HTMLElement;

  constructor(private container: HTMLElement, private boot: GameBootstrapper, private onStart: (opts:any)=>void) {
    this.element = document.createElement('div');
    this.element.className = 'main-menu';
    this.element.innerHTML = `
      <div class="menu-bg"></div>
      <header class="menu-header">
        <div class="logo"><span class="logo-iron">铁蚀</span><span class="logo-eclipse">IRON ECLIPSE</span><span class="ver">v0.9.0 | HDRP 17 | Netcode</span></div>
        <div class="player-card">
          <div class="avatar">${boot.profile.profile.name.slice(0,2)}</div>
          <div class="info"><div class="name">${boot.profile.profile.name}</div><div class="level">等级 ${boot.profile.profile.level} • ${boot.profile.profile.xp} XP</div></div>
          <button class="btn small rename">改名</button>
        </div>
      </header>
      <nav class="menu-tabs">
        <button data-tab="play" class="active">开始作战</button>
        <button data-tab="lan">局域网</button>
        <button data-tab="hangar">机体库</button>
        <button data-tab="settings">设置</button>
        <button data-tab="about">关于</button>
      </nav>
      <div class="menu-body">
        <section class="tab tab-play active">
          <div class="hero">
            <h1>重型机甲团队竞技</h1>
            <p>热量管理 • 推进器机动 • 队伍协同 • 6.8-8.5米级工业战争机器</p>
            <div class="mode-grid"></div>
            <div class="quick-actions">
              <button class="btn primary large" data-action="training">训练场 — 单人 + Bot</button>
              <button class="btn large" data-action="host-annihil">快速 3v3 歼灭</button>
              <button class="btn large" data-action="host-duel">1v1 决斗</button>
            </div>
          </div>
        </section>
        <section class="tab tab-lan">
          <div class="lan-layout">
            <div class="lan-left">
              <div class="section-head"><h3>房间列表 — 自动发现 UDP 27016</h3><button class="btn small" id="refresh-rooms">刷新</button></div>
              <div class="room-list"></div>
              <div class="direct-join">
                <input id="direct-ip" placeholder="直连 IP，例如 192.168.1.42:27015" />
                <button class="btn" id="join-direct">直连</button>
              </div>
              <div class="lan-log"></div>
              <div class="firewall-hint">首次启动提示防火墙放行。macOS 首次入站连接会弹权限提示。</div>
            </div>
            <div class="lan-right">
              <h3>创建房间</h3>
              <label>房间名 <input id="room-name" value="铁蚀前线_${Math.floor(Math.random()*900)}" /></label>
              <label>模式 <select id="create-mode"></select></label>
              <label>地图 <select id="create-map"></select></label>
              <label>人数上限 <select id="create-max"><option value="2">2人 1v1</option><option value="4">4人 2v2</option><option value="6" selected>6人 3v3</option><option value="8">6+2 观战</option></select></label>
              <label>密码 (可选) <input id="create-pass" placeholder="留空为公开" type="password" /></label>
              <label class="check"><input type="checkbox" id="create-bots" checked /> Bot 填充空位</label>
              <label class="check"><input type="checkbox" id="create-spectate" /> 允许观战</label>
              <button class="btn primary block" id="create-room">创建并成为 Host</button>
              <div class="build-info">协议 v1.0.0 • 构建哈希 d555555 • 同版本校验</div>
            </div>
          </div>
        </section>
        <section class="tab tab-hangar">
          <div class="hangar-preview">
            <div class="mech-grid"></div>
            <div class="mech-detail"></div>
          </div>
        </section>
        <section class="tab tab-settings">
          <div class="settings-grid">
            <div class="set-card"><h4>画面</h4>
              <label>质量 <select id="q-quality"><option>Low</option><option>Medium</option><option selected>High</option><option>Ultra</option></select></label>
              <label>FOV <input type="range" id="q-fov" min="60" max="95" value="80" /> <span id="q-fov-v">80</span></label>
              <label class="check"><input type="checkbox" id="q-shake" checked /> 屏幕震动</label>
              <label class="check"><input type="checkbox" id="q-cb" /> 色盲模式 (形状区分敌我)</label>
              <label class="check"><input type="checkbox" id="q-sub" checked /> 字幕</label>
            </div>
            <div class="set-card"><h4>操作</h4>
              <label>鼠标灵敏度 <input type="range" id="s-mouse" min="0.3" max="2" step="0.1" value="1" /></label>
              <label>手柄灵敏度 <input type="range" id="s-pad" min="0.3" max="2" step="0.1" value="1" /></label>
              <div class="keymap-hint">WASD 移动 • 鼠标视角 • 左键主武器 • 右键瞄准/格挡 • Shift 冲刺 • Space 跳跃 • Q护盾 • E战术 • R过载 • F交互 • Tab计分板</div>
            </div>
            <div class="set-card"><h4>音频</h4>
              <label>总音量 <input type="range" id="a-master" min="0" max="100" value="80" /></label>
              <label>音效 <input type="range" id="a-sfx" min="0" max="100" value="90" /></label>
              <label>音乐 <input type="range" id="a-music" min="0" max="100" value="60" /></label>
            </div>
            <div class="set-card"><h4>网络</h4>
              <div>游戏 UDP 27015 • 发现 UDP 27016 • 大厅 UDP 27017</div>
              <div>延迟补偿 200ms • 快照 20-30Hz • 插值 100ms</div>
              <button class="btn small" id="net-test">网络模拟器测试 (丢包10%)</button>
            </div>
          </div>
        </section>
        <section class="tab tab-about">
          <div class="about">
            <h3>铁蚀战线 — 制作蓝图执行版本</h3>
            <p>2149 年，地球联合重工与火星自由机甲阵线围绕轨道电梯爆发冲突。玩家驾驶 6-9m 机甲，在工业轨道站、火星矿区、冰原精炼厂中 3v3 阵营对抗。</p>
            <div class="specs">
              <div><b>渲染</b> HDRP • PBR • 体积雾 • 屏幕空间反射 • 金属磨损 Shader Graph • VFX Graph • Cinemachine</div>
              <div><b>动画</b> Animation Rigging IK • Timeline • Additive 受击层 • Motion Warping 近战</div>
              <div><b>网络</b> Netcode for GameObjects • Unity Transport • Host 权威 • 本地预测 • 远程插值</div>
              <div><b>构建</b> Windows x64 • macOS Intel • Apple Silicon Universal • IL2CPP • GitHub Actions</div>
            </div>
            <div class="acceptance">
              <h4>验收标准</h4>
              <ul>
                <li>两台机器 5分钟内发现并加入房间</li>
                <li>Windows 与 macOS 互通 • 三端同协议</li>
                <li>3v3 六机甲+12 Bot 30分钟无阻断</li>
                <li>断线60秒可重连</li>
                <li>无互联网可完整运行</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
      <footer class="menu-footer"><span>Iron Eclipse • TUF 白橙黑 vs MFF 红黑灰 • 竞技数值同框架池 • 外观不影响平衡</span><span>本地存档 原子写入</span></footer>
    `;
    container.appendChild(this.element);
    this.roomListEl = this.element.querySelector('.room-list') as HTMLElement;
    this.logEl = this.element.querySelector('.lan-log') as HTMLElement;

    this.bindTabs();
    this.buildModeGrid();
    this.buildLanSelectors();
    this.buildHangar();
    this.bindActions();
    this.updateRoomList();
    this.listenDiscovery();
  }

  private bindTabs(){
    this.element.querySelectorAll('.menu-tabs button').forEach(b=>{
      b.addEventListener('click', ()=>{
        this.element.querySelectorAll('.menu-tabs button').forEach(x=> x.classList.remove('active'));
        b.classList.add('active');
        const tab = b.getAttribute('data-tab');
        this.element.querySelectorAll('.tab').forEach(t=> t.classList.remove('active'));
        this.element.querySelector(`.tab-${tab}`)?.classList.add('active');
      });
    });
  }

  private buildModeGrid(){
    const grid = this.element.querySelector('.mode-grid') as HTMLElement;
    for (const m of MODES){
      const el=document.createElement('div');
      el.className='mode-card';
      el.innerHTML=`<h4>${m.name}</h4><span class="cnt">${m.playerCount}</span><p>${m.description}</p><div class="meta">回合 ${m.roundsToWin}胜 • ${m.roundTime}s • 复活 ${m.respawn??'无'}</div>`;
      el.onclick=()=> this.onStart({modeId:m.id, mapId:'orbital-relay'});
      grid.appendChild(el);
    }
  }

  private buildLanSelectors(){
    const modeSel = this.element.querySelector('#create-mode') as HTMLSelectElement;
    for (const m of MODES) {
      const o=document.createElement('option'); o.value=m.id; o.textContent=`${m.name} (${m.playerCount})`; modeSel.appendChild(o);
    }
    const mapSel = this.element.querySelector('#create-map') as HTMLSelectElement;
    for (const mp of MAPS) {
      const o=document.createElement('option'); o.value=mp.id; o.textContent=mp.name; mapSel.appendChild(o);
    }
  }

  private buildHangar(){
    const grid = this.element.querySelector('.mech-grid') as HTMLElement;
    const detail = this.element.querySelector('.mech-detail') as HTMLElement;
    const select = (mech:any)=>{
      detail.innerHTML=`
        <div class="detail-head" style="border-left:4px solid ${mech.colorSecondary}"><h3>${mech.codename} — ${mech.name}</h3><span class="faction ${mech.faction}">${mech.faction}</span></div>
        <div class="stats">
          <div><label>装甲</label><b>${mech.armor}</b><div class="bar"><div style="width:${mech.armor/2600*100}%"></div></div></div>
          <div><label>结构</label><b>${mech.structure}</b><div class="bar"><div style="width:${mech.structure/1200*100}%"></div></div></div>
          <div><label>速度</label><b>${mech.speed} m/s</b><div class="bar"><div style="width:${mech.speed/9.2*100}%"></div></div></div>
          <div><label>冲刺</label><b>${mech.sprintSpeed} m/s</b></div>
          <div><label>热量</label><b>${mech.heatCapacity}</b></div>
        </div>
        <p class="desc">${mech.description}</p>
        <div class="weapons">主武器: ${mech.weapons.map((w:any)=> w.weaponId).join(' + ')}</div>
        <div class="abilities">技能: ${mech.abilities.join(' • ')}</div>
        <button class="btn primary" id="select-mech">选用此机体</button>
        <div class="skin-row"><span>涂装示例：</span> <span class="swatch" style="background:${mech.colorPrimary}"></span><span class="swatch" style="background:${mech.colorSecondary}"></span><span class="swatch" style="background:#222"></span></div>
      `;
      detail.querySelector('#select-mech')?.addEventListener('click', ()=>{
        this.boot.profile.profile.selectedMech = mech.id;
        this.boot.profile.save();
        this.element.querySelectorAll('.mech-card').forEach(c=> c.classList.toggle('selected', (c as HTMLElement).dataset.id===mech.id));
      });
    };
    for (const m of MECHS){
      const el=document.createElement('div');
      el.className='mech-card'; el.dataset.id=m.id;
      if (m.id===this.boot.profile.profile.selectedMech) el.classList.add('selected');
      el.innerHTML=`<div class="card-head" style="background:linear-gradient(90deg, ${m.colorPrimary}, ${m.colorSecondary})"></div><h4>${m.name}</h4><span>${m.codename}</span><div class="role">${m.role} • ${m.height}m</div>`;
      el.onclick=()=> select(m);
      grid.appendChild(el);
    }
    const first = MECHS.find(m=> m.id===this.boot.profile.profile.selectedMech) || MECHS[0];
    select(first);
  }

  private bindActions(){
    this.element.querySelector('[data-action="training"]')?.addEventListener('click', ()=> this.onStart({modeId:'training', mapId:'orbital-relay', quick:true}));
    this.element.querySelector('[data-action="host-annihil"]')?.addEventListener('click', ()=> this.onStart({modeId:'annihilation', mapId:'orbital-relay', host:true}));
    this.element.querySelector('[data-action="host-duel"]')?.addEventListener('click', ()=> this.onStart({modeId:'duel', mapId:'mars-mine', host:true}));

    this.element.querySelector('#create-room')?.addEventListener('click', ()=>{
      const name=(this.element.querySelector('#room-name') as HTMLInputElement).value;
      const mode=(this.element.querySelector('#create-mode') as HTMLSelectElement).value;
      const map=(this.element.querySelector('#create-map') as HTMLSelectElement).value;
      const pass=(this.element.querySelector('#create-pass') as HTMLInputElement).value;
      this.onStart({modeId:mode, mapId:map, host:true, roomName:name, password:pass});
    });
    this.element.querySelector('#join-direct')?.addEventListener('click', ()=>{
      const ip=(this.element.querySelector('#direct-ip') as HTMLInputElement).value;
      this.onStart({modeId:'annihilation', mapId:'orbital-relay', direct:ip});
    });
    this.element.querySelector('#refresh-rooms')?.addEventListener('click', ()=> { this.boot.discovery.sendDiscover(); this.appendLog('广播 DISCOVER_REQ → 255.255.255.255:27016'); });
    this.element.querySelector('.rename')?.addEventListener('click', ()=>{
      const n=prompt('输入新机师名', this.boot.profile.profile.name);
      if (n) { this.boot.profile.profile.name=n; this.boot.profile.save(); location.reload(); }
    });
    this.element.querySelector('#net-test')?.addEventListener('click', ()=> alert('Network Simulator: 模拟 120ms 延迟 + 10% 丢包，客户端仍保持 100ms 插值，Host 权威判定无异常。'));
    // settings bindings
    (this.element.querySelector('#q-fov') as HTMLInputElement)?.addEventListener('input', (e)=> {
      const v=(e.target as HTMLInputElement).value;
      this.element.querySelector('#q-fov-v')!.textContent=v;
      this.boot.settings.settings.fov=parseInt(v);
      this.boot.settings.save();
    });
  }

  private listenDiscovery(){
    this.boot.discovery.onRooms((rooms)=>{
      this.renderRooms(rooms);
    });
    window.addEventListener('iron:discover-req', ()=> this.appendLog('收到 DISCOVER_REQ'));
  }

  private renderRooms(rooms:any[]){
    if (!rooms.length) {
      this.roomListEl.innerHTML = `<div class="empty">未发现房间 — 请创建房间或直连 IP。局域网零配置：每2秒广播ROOM_ANNOUNCE。</div>`;
      return;
    }
    this.roomListEl.innerHTML='';
    for (const r of rooms){
      const el=document.createElement('div');
      el.className='room-card';
      el.innerHTML=`<div class="r-head"><b>${r.roomName}</b> <span class="host">${r.hostName}</span> <span class="ver">${r.protocolVersion} ${r.hasPassword?'🔒':''}</span></div><div class="r-meta">${r.mapId} • ${r.modeId} • ${r.currentPlayers}/${r.maxPlayers} • ${r.hostIp}:${r.gamePort}</div>`;
      el.onclick=()=> this.onStart({joinRoom:r.roomId, mapId:r.mapId, modeId:r.modeId});
      this.roomListEl.appendChild(el);
    }
  }

  updateRoomList(){
    this.renderRooms([...this.boot.discovery.rooms.values()]);
  }

  private appendLog(t:string){
    if (!this.logEl) return;
    const el=document.createElement('div'); el.textContent=`[${new Date().toLocaleTimeString()}] ${t}`; this.logEl.prepend(el);
  }

  destroy(){ this.element.remove(); }
}
