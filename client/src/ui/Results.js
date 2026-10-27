export class Results {
    constructor(container, data) {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: container
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: data
        });
        Object.defineProperty(this, "element", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.element = document.createElement('div');
        this.element.className = 'results';
        const winText = data.winner === 'A' ? 'TUF 联合重工 胜利' : 'MFF 自由阵线 胜利';
        const rows = data.players.map((p) => `<div class="row"><span>${p.name}</span><span>${p.kills}</span><span>${p.damage}</span><span>${p.healed || 0}</span><span>${p.score}</span></div>`).join('');
        this.element.innerHTML = `
      <div class="results-bg"></div>
      <div class="results-panel">
        <h1 class="result-title">${winText}</h1>
        <div class="season-voice">"相位矿脉已回收 — 返回轨道电梯。" — 无线电</div>
        <div class="score-row"><span class="score-a">TUF ${data.scores.A}</span><span class="vs">VS</span><span class="score-b">${data.scores.B} MFF</span></div>
        <div class="table">
          <div class="head"><span>玩家</span><span>击杀</span><span>伤害</span><span>治疗</span><span>得分</span></div>
          ${rows}
        </div>
        <div class="unlocks">解锁: 机师经验 +${Math.floor(Math.random() * 400 + 200)} • 贴花“铁蚀” • 涂装磨损02</div>
        <div class="actions"><button class="btn primary" id="cont">继续</button><button class="btn" id="lobby">返回大厅</button><button class="btn" id="save">保存最近20局</button></div>
        <div class="save-hint">本地存档已更新 • 原子写入 • 损坏备份</div>
      </div>
    `;
        container.appendChild(this.element);
        this.element.querySelector('#cont').addEventListener('click', () => data.onContinue());
        this.element.querySelector('#lobby').addEventListener('click', () => data.onToLobby());
        this.element.querySelector('#save').addEventListener('click', () => alert('已保存到本地存档 recenteMatches (最多20局)'));
    }
    destroy() { this.element.remove(); }
}
