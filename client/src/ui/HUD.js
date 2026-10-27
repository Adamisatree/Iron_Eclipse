export class HUD {
    constructor(container) {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: container
        });
        Object.defineProperty(this, "element", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "armorBar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "structBar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "shieldBar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "heatBar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ammoEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "boostEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "staggerEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scoreEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "killFeed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "hitMarker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "centerDot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.element = document.createElement('div');
        this.element.className = 'hud';
        this.element.innerHTML = `
      <div class="hud-top">
        <div class="team-scores"><span class="team-a">TUF 0</span><span class="timer">01:30</span><span class="team-b">0 MFF</span></div>
        <div class="round-indicator">ROUND 1 / 3</div>
      </div>
      <div class="hud-center">
        <div class="crosshair"></div>
        <div class="hit-marker"></div>
        <div class="damage-dir"></div>
      </div>
      <div class="hud-bottom">
        <div class="left-panel">
          <div class="bar-row"><label>装甲</label><div class="bar armor"><div class="fill"></div><span class="val">2600</span></div></div>
          <div class="bar-row"><label>结构</label><div class="bar structure"><div class="fill"></div><span class="val">1200</span></div></div>
          <div class="bar-row shield-row"><label>护盾</label><div class="bar shield"><div class="fill"></div><span class="val">800</span></div></div>
          <div class="stagger-bar"><div class="fill"></div></div>
        </div>
        <div class="center-panel">
          <div class="interact-hint">按 F 处决 | 占领中 45%</div>
          <div class="kill-feed"></div>
        </div>
        <div class="right-panel">
          <div class="bar-row"><label>热量</label><div class="bar heat"><div class="fill"></div><span class="val">0%</span></div></div>
          <div class="ammo">40 / 240</div>
          <div class="boost"><div class="fill"></div><span>推进</span></div>
          <div class="abilities">
            <div class="ab q"><span>Q</span><div class="cd"></div><label>塔盾</label></div>
            <div class="ab e"><span>E</span><div class="cd"></div><label>技能</label></div>
            <div class="ab r"><span>R</span><div class="cd"></div><label>散热</label></div>
          </div>
        </div>
      </div>
      <div class="scoreboard hidden">
        <div class="board-header"><span>玩家</span><span>击杀</span><span>伤害</span><span>状态</span></div>
        <div class="board-rows"></div>
        <div class="board-footer">按 Tab 查看计分板 | M 地图标记 | Esc 菜单</div>
      </div>
      <div class="hit-feedback"></div>
    `;
        container.appendChild(this.element);
        this.armorBar = this.element.querySelector('.bar.armor .fill');
        this.structBar = this.element.querySelector('.bar.structure .fill');
        this.shieldBar = this.element.querySelector('.bar.shield .fill');
        this.heatBar = this.element.querySelector('.bar.heat .fill');
        this.ammoEl = this.element.querySelector('.ammo');
        this.boostEl = this.element.querySelector('.boost .fill');
        this.staggerEl = this.element.querySelector('.stagger-bar .fill');
        this.scoreEl = this.element.querySelector('.team-scores');
        this.killFeed = this.element.querySelector('.kill-feed');
        this.hitMarker = this.element.querySelector('.hit-marker');
        this.centerDot = this.element.querySelector('.crosshair');
        // tab scoreboard
        window.addEventListener('keydown', (e) => { if (e.code === 'Tab') {
            this.element.querySelector('.scoreboard')?.classList.remove('hidden');
            e.preventDefault();
        } });
        window.addEventListener('keyup', (e) => { if (e.code === 'Tab') {
            this.element.querySelector('.scoreboard')?.classList.add('hidden');
        } });
    }
    updateStats(armor, armorMax, struct, structMax, shield, shieldMax, heat, heatCap, ammoMag, ammoReserve, boost, stagger, staggerMax) {
        this.armorBar.parentElement.querySelector('.val').textContent = Math.max(0, Math.floor(armor)).toString();
        this.armorBar.style.width = Math.max(0, armor / armorMax * 100) + '%';
        this.structBar.parentElement.querySelector('.val').textContent = Math.max(0, Math.floor(struct)).toString();
        this.structBar.style.width = Math.max(0, struct / structMax * 100) + '%';
        if (shieldMax > 0) {
            this.shieldBar.parentElement.querySelector('.val').textContent = Math.max(0, Math.floor(shield)).toString();
            this.shieldBar.style.width = Math.max(0, shield / shieldMax * 100) + '%';
            this.element.querySelector('.shield-row').classList.remove('hidden');
        }
        else
            this.element.querySelector('.shield-row').classList.add('hidden');
        this.heatBar.style.width = (heat / heatCap * 100) + '%';
        this.heatBar.parentElement.querySelector('.val').textContent = Math.floor(heat / heatCap * 100) + '%';
        this.heatBar.parentElement.classList.toggle('overheat', heat / heatCap > 0.95);
        this.ammoEl.textContent = `${ammoMag} / ${ammoReserve}`;
        this.boostEl.style.width = boost + '%';
        this.staggerEl.style.width = (stagger / staggerMax * 100) + '%';
    }
    updateScore(teamA, teamB, timeLeft, round, roundToWin, phase) {
        const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const ss = String(timeLeft % 60).padStart(2, '0');
        this.scoreEl.querySelector('.team-a').textContent = `TUF ${teamA}`;
        this.scoreEl.querySelector('.team-b').textContent = `${teamB} MFF`;
        this.scoreEl.querySelector('.timer').textContent = `${mm}:${ss}`;
        this.element.querySelector('.round-indicator').textContent = phase === 'countdown' ? '准备' : `回合 ${round} / ${roundToWin * 2 - 1}`;
    }
    showHit(isHead = false) {
        this.hitMarker.classList.add('active');
        this.hitMarker.classList.toggle('head', isHead);
        setTimeout(() => this.hitMarker.classList.remove('active'), 140);
    }
    showDamage(dir, amount) {
        const el = document.createElement('div');
        el.className = 'dmg';
        el.textContent = `-${Math.floor(amount)}`;
        el.style.left = 50 + Math.cos(dir) * 14 + '%';
        el.style.top = 50 + Math.sin(dir) * 8 + '%';
        this.element.querySelector('.hit-feedback').appendChild(el);
        setTimeout(() => el.remove(), 800);
    }
    pushKillFeed(text) {
        const el = document.createElement('div');
        el.textContent = text;
        this.killFeed.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
    setAbilityCooldown(key, pct) {
        const el = this.element.querySelector(`.ab.${key} .cd`);
        if (el)
            el.style.height = (100 - pct * 100) + '%';
    }
    setCrosshairSpread(spread) {
        this.centerDot.style.transform = `scale(${1 + spread})`;
    }
    destroy() { this.element.remove(); }
}
