export class Lobby {
    constructor(container, boot, onStart, onLeave) {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: container
        });
        Object.defineProperty(this, "boot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: boot
        });
        Object.defineProperty(this, "onStart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: onStart
        });
        Object.defineProperty(this, "onLeave", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: onLeave
        });
        Object.defineProperty(this, "element", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "teamAEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "teamBEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "specEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "chatEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settingsEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.element = document.createElement('div');
        this.element.className = 'lobby';
        this.element.innerHTML = `
      <div class="lobby-header">
        <h2 class="room-title">房间</h2>
        <div class="lobby-meta"><span class="map">地图: —</span><span class="mode">模式: —</span><span class="seed">种子: —</span></div>
        <button class="btn small" id="leave-lobby">离开房间</button>
      </div>
      <div class="lobby-body">
        <div class="teams">
          <div class="team team-a"><h3>队伍 A — TUF <span class="count">0/3</span></h3><div class="list"></div><button class="btn small join-a">加入A</button></div>
          <div class="team team-b"><h3>队伍 B — MFF <span class="count">0/3</span></h3><div class="list"></div><button class="btn small join-b">加入B</button></div>
          <div class="team spec"><h3>观战 <span class="count">0/2</span></h3><div class="list"></div></div>
        </div>
        <div class="lobby-right">
          <div class="room-settings">
            <h4>房间设置</h4>
            <div class="setting-row"><span>地图</span><select id="lobby-map"><option value="orbital-relay">轨道电梯中继站</option><option value="mars-mine">火星矿井</option><option value="ice-refinery">冰原精炼厂</option><option value="shipyard">废弃船坞</option></select></div>
            <div class="setting-row"><span>模式</span><select id="lobby-mode"><option value="annihilation">3v3 歼灭</option><option value="core">核心争夺</option><option value="duel">1v1 决斗</option><option value="custom">自定义</option></select></div>
            <div class="setting-row"><span>密码</span><input id="lobby-pass" placeholder="无" type="password" style="width:120px" /></div>
            <label class="check"><input type="checkbox" id="lobby-bots" checked /> Bot 填充</label>
            <label class="check"><input type="checkbox" id="lobby-spec" /> 允许观战</label>
          </div>
          <div class="ready-area">
            <button class="btn primary large" id="ready-btn">准备</button>
            <button class="btn primary large host-only" id="start-btn">Host 开始比赛</button>
            <div class="ready-hint">全员准备后 Host 可开始</div>
          </div>
          <div class="chat">
            <div class="chat-log"></div>
            <div class="chat-input"><input id="chat-text" placeholder="按回车发送聊天..." /><button id="chat-send" class="btn small">发送</button></div>
          </div>
        </div>
      </div>
      <div class="lobby-footer"><span>Host 权威同步 • 版本校验一致方可加入 • 断线60秒重连保留机体</span><span class="ping">PING 12ms</span></div>
    `;
        container.appendChild(this.element);
        this.teamAEl = this.element.querySelector('.team-a .list');
        this.teamBEl = this.element.querySelector('.team-b .list');
        this.specEl = this.element.querySelector('.spec .list');
        this.chatEl = this.element.querySelector('.chat-log');
        this.settingsEl = this.element.querySelector('.lobby-meta');
        this.bind();
        this.listenState();
    }
    bind() {
        this.element.querySelector('#leave-lobby')?.addEventListener('click', () => this.onLeave());
        this.element.querySelector('#ready-btn')?.addEventListener('click', () => {
            const me = this.boot.profile.profile.playerId;
            const state = this.boot.lobby.state;
            const pl = state?.players.find(p => p.id === me);
            const ready = !pl?.ready;
            this.boot.network.send('SET_READY', { ready });
            this.element.querySelector('#ready-btn').textContent = ready ? '取消准备' : '准备';
            this.element.querySelector('#ready-btn').classList.toggle('active', ready);
        });
        this.element.querySelector('#start-btn')?.addEventListener('click', () => {
            if (!this.boot.lobby.canStart()) {
                alert('需至少2人且全员准备');
                return;
            }
            this.boot.network.send('START_MATCH', {});
            this.onStart();
        });
        this.element.querySelector('.join-a')?.addEventListener('click', () => this.boot.network.send('SWITCH_TEAM', { team: 'A' }));
        this.element.querySelector('.join-b')?.addEventListener('click', () => this.boot.network.send('SWITCH_TEAM', { team: 'B' }));
        const sendChat = () => {
            const inp = this.element.querySelector('#chat-text');
            const text = inp.value.trim();
            if (!text)
                return;
            this.boot.network.send('CHAT', { text });
            inp.value = '';
        };
        this.element.querySelector('#chat-send')?.addEventListener('click', sendChat);
        this.element.querySelector('#chat-text')?.addEventListener('keydown', (e) => { if (e.key === 'Enter')
            sendChat(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Enter' && document.activeElement?.tagName !== 'INPUT') {
            this.element.querySelector('#chat-text')?.focus();
        } });
        // map/mode change
        this.element.querySelector('#lobby-map')?.addEventListener('change', (e) => { this.boot.lobby.state.mapId = e.target.value; this.render(); });
        this.element.querySelector('#lobby-mode')?.addEventListener('change', (e) => { this.boot.lobby.state.modeId = e.target.value; this.render(); });
    }
    listenState() {
        this.boot.lobby.onState(() => this.render());
        this.boot.lobby.onChat((msg) => this.pushChat(msg));
        this.render();
    }
    render() {
        const s = this.boot.lobby.state;
        if (!s)
            return;
        this.element.querySelector('.room-title').textContent = s.roomName;
        this.element.querySelector('.lobby-meta .map').textContent = `地图: ${s.mapId}`;
        this.element.querySelector('.lobby-meta .mode').textContent = `模式: ${s.modeId}`;
        this.element.querySelector('.lobby-meta .seed').textContent = `种子: ${s.seed}`;
        const renderList = (el, team) => {
            el.innerHTML = '';
            const players = s.players.filter(p => p.team === team);
            for (const p of players) {
                const row = document.createElement('div');
                row.className = 'player-row' + (p.isHost ? ' host' : '') + (p.ready ? ' ready' : '');
                row.innerHTML = `<span class="name">${p.isHost ? '👑' : ''} ${p.name} ${p.isBot ? '[BOT]' : ''}</span><span class="mech">${p.mechId}</span><span class="status">${p.ready ? '✓ 准备' : '○ 未准备'}</span><span class="ping">${p.ping}ms</span>`;
                if (this.boot.profile.profile.playerId === s.hostId && p.id !== s.hostId) {
                    const kick = document.createElement('button');
                    kick.textContent = '踢出';
                    kick.className = 'btn small danger';
                    kick.onclick = () => this.boot.network.kick(p.id);
                    row.appendChild(kick);
                }
                el.appendChild(row);
            }
        };
        renderList(this.teamAEl, 'A');
        renderList(this.teamBEl, 'B');
        renderList(this.specEl, 'SPEC');
        const aCount = s.players.filter(p => p.team === 'A').length;
        const bCount = s.players.filter(p => p.team === 'B').length;
        this.element.querySelector('.team-a .count').textContent = `${aCount}/3`;
        this.element.querySelector('.team-b .count').textContent = `${bCount}/3`;
        this.element.querySelector('.spec .count').textContent = `${s.players.filter(p => p.team === 'SPEC').length}/2`;
        const isHost = this.boot.profile.profile.playerId === s.hostId;
        this.element.querySelector('#start-btn').classList.toggle('hidden', !isHost);
        this.element.querySelector('#lobby-map').value = s.mapId;
        this.element.querySelector('#lobby-mode').value = s.modeId;
    }
    pushChat(msg) {
        const el = document.createElement('div');
        el.textContent = `[${new Date(msg.time).toLocaleTimeString()}] ${msg.from}: ${msg.text}`;
        this.chatEl.appendChild(el);
        this.chatEl.scrollTop = this.chatEl.scrollHeight;
    }
    destroy() { this.element.remove(); }
}
