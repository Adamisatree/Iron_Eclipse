import * as THREE from 'three';
import { GameBootstrapper } from './core/GameBootstrapper';
import { SceneManager } from './render/SceneManager';
import { MainMenu } from './ui/MainMenu';
import { Lobby } from './ui/Lobby';
import { HUD } from './ui/HUD';
import { Results } from './ui/Results';
import { InputCollector } from './input/InputCollector';
import { MechMotor } from './gameplay/MechMotor';
import { MechCombat } from './gameplay/MechCombat';
import { BotController } from './gameplay/BotController';
import { MatchDirector } from './gameplay/MatchDirector';
import { SnapshotInterpolator } from './network/SnapshotInterpolator';
import { getMech } from './data/MechDefinitions';
import { getWeapon } from './data/WeaponDefinitions';
import { MAPS, SPAWN_POINTS } from './data/MapDefinitions';
import './styles/main.css';
const boot = new GameBootstrapper();
await boot.init();
const app = document.getElementById('app');
let currentView = null;
let sceneMgr = null;
let hud = null;
let input = null;
let director = null;
// game state refs for cleanup
let gameLoopId = 0;
let bots = [];
let localMotor = null;
let localCombat = null;
let localRenderer = null;
let projectiles = [];
let remoteStates = new Map();
let tick = 0;
let team = 'A';
let mapId = 'orbital-relay';
let modeId = 'annihilation';
function showMenu() {
    cleanupGame();
    if (currentView) {
        try {
            currentView.destroy();
        }
        catch { }
    }
    app.innerHTML = '';
    currentView = new MainMenu(app, boot, async (opts) => {
        if (opts.host) {
            const roomName = opts.roomName || `铁蚀前线_${Math.floor(Math.random() * 900)}`;
            const mode = opts.modeId || 'annihilation';
            const map = opts.mapId || 'orbital-relay';
            mapId = map;
            modeId = mode;
            await boot.network.startHost(roomName, map, mode, !!opts.password, opts.password);
            showLobby();
        }
        else if (opts.joinRoom) {
            mapId = opts.mapId;
            modeId = opts.modeId;
            await boot.network.joinRoom(opts.joinRoom);
            team = 'A';
            showLobby();
        }
        else if (opts.direct) {
            await boot.network.joinDirect(opts.direct);
            showLobby();
        }
        else if (opts.quick) {
            mapId = opts.mapId;
            modeId = opts.modeId;
            startMatch({ mapId, modeId, seed: Math.floor(Math.random() * 1e9) });
        }
        else if (opts.modeId) {
            mapId = opts.mapId;
            modeId = opts.modeId;
            // fallback to quick host
            boot.lobby.createRoom('local-' + Date.now(), '本地房间', mapId, modeId, { id: boot.profile.profile.playerId, name: boot.profile.profile.name, team: 'A', mechId: boot.profile.profile.selectedMech, ready: true, isHost: true, ping: 0 });
            showLobby();
        }
    });
}
function showLobby() {
    if (currentView)
        try {
            currentView.destroy();
        }
        catch { }
    app.innerHTML = '';
    currentView = new Lobby(app, boot, () => {
        // host start
        const s = boot.lobby.state;
        if (s)
            startMatch({ mapId: s.mapId, modeId: s.modeId, seed: s.seed });
    }, () => {
        boot.network.disconnect();
        boot.lobby.setState(null);
        showMenu();
    });
    // also listen for external start
    window.addEventListener('iron:start-match', (e) => {
        const d = e.detail;
        startMatch({ mapId: d.mapId || mapId, modeId: d.modeId || modeId, seed: d.seed || 12345 });
    }, { once: true });
}
async function startMatch(opts) {
    if (currentView)
        try {
            currentView.destroy();
        }
        catch { }
    app.innerHTML = '';
    // create game canvas container
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';
    gameContainer.innerHTML = `
    <div class="game-canvas"></div>
    <div class="countdown">3</div>
    <div class="pause-menu hidden">
      <h3>暂停</h3>
      <button class="btn" id="resume">继续</button>
      <button class="btn" id="leave-match">离开比赛 → 大厅</button>
      <button class="btn" id="quit-menu">返回主菜单</button>
      <div class="hint">多人模式不暂停；单人训练可暂停 — ESC</div>
    </div>
  `;
    app.appendChild(gameContainer);
    const canvasHost = gameContainer.querySelector('.game-canvas');
    sceneMgr = new SceneManager(canvasHost);
    sceneMgr.buildMap(opts.mapId);
    mapId = opts.mapId;
    modeId = opts.modeId;
    const refs = sceneMgr.getCameraRefs();
    input = new InputCollector();
    input.attach(canvasHost, refs.yawRef, refs.pitchRef);
    hud = new HUD(gameContainer);
    director = new MatchDirector();
    const modeDef = MAPS.find(m => m.id === mapId) || MAPS[0];
    // configure director
    let roundTime = 90, roundsToWin = 3;
    if (modeId === 'annihilation') {
        roundTime = 90;
        roundsToWin = 3;
    }
    else if (modeId === 'core') {
        roundTime = 300;
        roundsToWin = 2;
    }
    else if (modeId === 'duel') {
        roundTime = 90;
        roundsToWin = 2;
    }
    else if (modeId === 'training') {
        roundTime = 600;
        roundsToWin = 1;
    }
    director.configure(modeId, mapId, roundsToWin, roundTime);
    director.onState((s) => { hud?.updateScore(s.teamA, s.teamB, s.timeLeft, s.round, s.roundToWin, s.phase); if (s.phase === 'countdown')
        showCountdown(gameContainer, 3); });
    director.setRoundEnd((winner) => {
        hud?.pushKillFeed(winner ? `回合结束 — ${winner === 'A' ? 'TUF' : 'MFF'} 胜利` : `回合结束 — 平局 (时间到)`);
        sceneMgr?.shake(0.8, 0.6);
        if (winner)
            boot.audio.playSfx(600, 0.4, 'sine', 0.35);
    });
    director.setMatchEnd((winner) => {
        endMatch(winner);
    });
    // setup player
    await setupPlayers();
    director.startCountdown();
    // start loop
    let lastTime = performance.now();
    let walkPhase = 0;
    const snapshotInterpolator = new SnapshotInterpolator();
    // ESC pause
    const pauseEl = gameContainer.querySelector('.pause-menu');
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape')
            pauseEl.classList.toggle('hidden');
    });
    pauseEl.querySelector('#resume')?.addEventListener('click', () => pauseEl.classList.add('hidden'));
    pauseEl.querySelector('#leave-match')?.addEventListener('click', () => { showLobby(); });
    pauseEl.querySelector('#quit-menu')?.addEventListener('click', () => { showMenu(); });
    // fire event
    canvasHost.addEventListener('click', () => boot.audio.resume());
    let fireHeld = false;
    // main loop
    const loop = () => {
        gameLoopId = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = Math.min(0.033, (now - lastTime) / 1000);
        lastTime = now;
        tick++;
        // collect input at 60Hz
        if (!localMotor || !localCombat || !sceneMgr || !hud || !input)
            return;
        const frame = input.collect(tick);
        const mechsAlive = checkAlive();
        // if phase countdown, freeze
        if (director?.phase === 'countdown' || director?.phase === 'roundEnd' || director?.phase === 'matchEnd') {
            sceneMgr.updateCamera(localMotor.position, input.yaw, input.pitch, dt);
            sceneMgr.render();
            return;
        }
        // update local motor
        const { boostTriggered } = localMotor.update(dt, frame, tick);
        if (boostTriggered)
            boot.audio.playBoost();
        // combat update
        localCombat.update(dt);
        // try fire
        const mechDef = getMech(boot.profile.profile.selectedMech);
        const primary = mechDef.weapons[0]?.weaponId;
        if (primary) {
            const wantFire = (frame.buttons & 1) !== 0;
            if (wantFire) {
                if (localCombat.canFire(primary)) {
                    const did = localCombat.fire(primary);
                    if (did) {
                        fireWeapon(primary, localMotor.position.clone(), new THREE.Vector3(Math.sin(input.yaw), input.pitch, Math.cos(input.yaw)).normalize(), boot.profile.profile.playerId, sceneMgr, hud);
                        if (getWeapon(primary)?.hitType === 'hitscan')
                            doHitscan(localMotor.position.clone(), new THREE.Vector3(Math.sin(input.yaw + (Math.random() - 0.5) * 0.015), input.pitch + (Math.random() - 0.5) * 0.015, Math.cos(input.yaw + (Math.random() - 0.5) * 0.015)).normalize(), primary);
                    }
                }
                else if (!fireHeld) {
                    // click feedback
                }
                fireHeld = wantFire;
            }
            else
                fireHeld = false;
            // handle abilities Q E R
            if (frame.buttons & (1 << 4))
                tryAbility('Q');
            if (frame.buttons & (1 << 5))
                tryAbility('E');
            if (frame.buttons & (1 << 6))
                tryAbility('R');
        }
        // update bots AI
        updateBots(dt, sceneMgr);
        // update projectiles
        updateProjectiles(dt, sceneMgr, hud);
        // update remote interpolator (if network snapshots)
        // for now bots directly update renderers
        // sync local renderer
        if (localRenderer) {
            localRenderer.group.position.copy(localMotor.position);
            localRenderer.group.rotation.y = localMotor.yaw;
            // thruster
            localRenderer.setThruster(localMotor.isBoosting || !localMotor.onGround, localMotor.isBoosting ? 1 : 0.35);
            localRenderer.setAim(0, input.pitch);
            walkPhase += dt * (localMotor.velocity.length() / 6);
            localRenderer.setPose(walkPhase, localMotor.isBoosting, localCombat.state.isStaggered);
            localRenderer.setDamage(1 - localCombat.state.structure / mechDef.structure);
        }
        // update hud
        const mech = getMech(boot.profile.profile.selectedMech);
        const w = getWeapon(primary);
        hud.updateStats(localCombat.state.armor, mech.armor, localCombat.state.structure, mech.structure, localCombat.state.shield, mech.shield || 0, localCombat.state.heat, mech.heatCapacity, localCombat.state.ammoInMag.get(primary) || w.magazine, localCombat.state.ammoReserve.get(primary) || w.reserve, localMotor.boostEnergy, localCombat.state.stagger, mech.staggerThreshold);
        // check round end conditions
        checkRoundEnd();
        // camera
        sceneMgr.updateCamera(localMotor.position, input.yaw, input.pitch, dt);
        sceneMgr.vfx.update(dt);
        sceneMgr.render();
        // send input to server if connected (simulation)
        if (boot.network.ws?.readyState === 1) {
            boot.network.send('INPUT', frame);
        }
        // handle network events via custom event
        // already via bots
    };
    loop();
    function tryAbility(key) {
        const mechDef = getMech(boot.profile.profile.selectedMech);
        const abilityId = mechDef.abilities[key === 'Q' ? 0 : key === 'E' ? 1 : 0];
        if (!abilityId)
            return;
        // cooldown simple
        if (key === 'Q') {
            if (mechDef.id === 'tuf-01') { // shield
                hud?.pushKillFeed('塔盾展开 — 正面减伤80% (3s)');
                sceneMgr?.shake(0.4, 0.3);
                // temp shield boost
                localCombat.state.shield = Math.min(localCombat.state.shield + 400, mechDef.shield + 400);
                setTimeout(() => { if (localCombat)
                    localCombat.state.shield = Math.max(0, localCombat.state.shield - 400); }, 3000);
            }
            else if (mechDef.id === 'mff-01') { // camo
                hud?.pushKillFeed('光学迷彩启动');
                if (localRenderer)
                    localRenderer.group.visible = false;
                setTimeout(() => { if (localRenderer)
                    localRenderer.group.visible = true; }, 2000);
            }
            else {
                hud?.pushKillFeed(`技能 ${abilityId} 释放`);
            }
            boot.audio.playSfx(520, 0.3, 'triangle', 0.3);
        }
        else if (key === 'E') {
            if (mechDef.id === 'tuf-02') {
                hud?.pushKillFeed('穿甲弹装填 — 下发无视50%减伤');
            }
            else if (mechDef.id === 'tuf-03') {
                localCombat?.heal(180);
                hud?.pushKillFeed('维修无人机释放 — 全队回复');
            }
            else {
                hud?.pushKillFeed(`E 技能 ${abilityId}`);
            }
        }
        else if (key === 'R') {
            if (localCombat.state.heat > 0) {
                localCombat.state.heat = Math.max(0, localCombat.state.heat - 60);
                localCombat.state.isOverheated = false;
                hud?.pushKillFeed('紧急散热 — 热量 -60');
                boot.audio.playSfx(180, 0.6, 'sawtooth', 0.3);
            }
        }
    }
    function checkAlive() {
        // returns counts
        let aliveA = 0, aliveB = 0;
        if (localCombat?.isAlive())
            aliveA++; // assume team A for local
        for (const b of bots)
            if (b.combat.isAlive()) {
                if (b.team === 'A')
                    aliveA++;
                else
                    aliveB++;
            }
        return { aliveA, aliveB };
    }
    function checkRoundEnd() {
        if (!director || director.phase !== 'active')
            return;
        const alive = checkAlive();
        if (modeId === 'annihilation' || modeId === 'duel') {
            if (alive.aliveA === 0 || alive.aliveB === 0) {
                director.endRound(alive.aliveA > 0 ? 'A' : alive.aliveB > 0 ? 'B' : null);
            }
        }
        // core mode time based only
        // check local death -> respawn or spectate
        if (localCombat && !localCombat.isAlive()) {
            if (modeId === 'core' || modeId === 'training' || modeId === 'custom') {
                // respawn
                setTimeout(() => respawnLocal(), 2000);
            }
            else {
                // stay dead, spectate next bot? for now keep cam
            }
        }
    }
    function respawnLocal() {
        if (!localMotor || !localCombat)
            return;
        const spawn = SPAWN_POINTS[mapId]?.teamA[0] || [-85, 0, -85];
        localMotor.position.set(spawn[0], 0, spawn[2]);
        localMotor.velocity.set(0, 0, 0);
        const mechDef = getMech(boot.profile.profile.selectedMech);
        localCombat.state.armor = mechDef.armor;
        localCombat.state.structure = mechDef.structure;
        localCombat.state.shield = mechDef.shield || 0;
        localCombat.state.heat = 0;
        localCombat.state.isOverheated = false;
        hud?.pushKillFeed('重新部署');
    }
    function fireWeapon(weaponId, pos, dir, owner, smgr, h) {
        const w = getWeapon(weaponId);
        const muzzle = pos.clone().add(new THREE.Vector3(0, 1.5, 0)).add(dir.clone().multiplyScalar(1.2));
        if (w.hitType === 'missile' || w.hitType === 'projectile') {
            projectiles.push({ pos: muzzle.clone(), dir: dir.clone(), speed: w.projectileSpeed || 55, life: 3, owner, damage: w.damage, weaponId });
            smgr.vfx.muzzleFlash(muzzle, dir, 0xff4400);
        }
        else {
            smgr.vfx.muzzleFlash(muzzle, dir, w.id === 'railgun' ? 0x88ccff : 0xffaa00);
            if (w.id === 'railgun') {
                // trail
                const end = muzzle.clone().add(dir.clone().multiplyScalar(w.range));
                smgr.vfx.tracer(muzzle, end, 0x88ccff);
            }
        }
        boot.audio.playShot(w.id === 'railgun');
        // crosshair spread
        h.setCrosshairSpread(0.5);
        setTimeout(() => h.setCrosshairSpread(0), 120);
        // shake
        if (w.damage > 100)
            smgr.shake(0.5, 0.25);
    }
    function doHitscan(origin, dir, weaponId) {
        const w = getWeapon(weaponId);
        let hitDist = w.range;
        let hitPos = origin.clone().addScaledVector(dir, hitDist);
        let hitBot = null;
        let closest = Infinity;
        const start = origin.clone().add(new THREE.Vector3(0, 1.5, 0));
        // ray vs bots
        for (const b of bots) {
            const toBot = b.motor.position.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(start);
            const proj = toBot.dot(dir);
            if (proj < 0 || proj > w.range)
                continue;
            const closestPt = start.clone().addScaledVector(dir, proj);
            const d2 = closestPt.distanceTo(b.motor.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
            if (d2 < 1.6 && proj < closest) {
                closest = proj;
                hitBot = b;
                hitPos = closestPt;
                hitDist = proj;
            }
        }
        // against ground check (simple)
        // hit effect
        if (hitBot) {
            // distance falloff
            let dmg = w.damage;
            if (hitDist > w.falloffStart) {
                const t = (hitDist - w.falloffStart) / (w.falloffEnd - w.falloffStart);
                dmg = dmg * THREE.MathUtils.lerp(1, w.falloffFactor, t);
            }
            const isHead = Math.random() < 0.12;
            const res = hitBot.combat.takeDamage(dmg, isHead, false);
            sceneMgr.vfx.hitSpark(hitPos, dir.clone().negate());
            hud.showHit(isHead);
            hud.showDamage(0, dmg);
            if (res.killed) {
                hud.pushKillFeed(`击毁 ${hitBot.id} (+100)`);
                sceneMgr.vfx.explosion(hitBot.motor.position.clone().add(new THREE.Vector3(0, 1, 0)), 2.2);
                sceneMgr.shake(0.9, 0.7);
                hitBot.renderer.setVisible(false);
                boot.profile.addXp(120);
                // remove after delay
                setTimeout(() => { hitBot.motor.position.set(9999, 0, 9999); }, 800);
            }
        }
        else {
            // miss tracer
            const end = start.clone().addScaledVector(dir, hitDist);
            if (w.id !== 'railgun')
                sceneMgr.vfx.tracer(start, end, 0xffff88);
            else { /* railgun already traced */ }
        }
    }
    function updateProjectiles(dt, smgr, h) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.pos.addScaledVector(p.dir, p.speed * dt);
            p.life -= dt;
            // homing for missile? slight
            if (p.weaponId === 'missile-pod') {
                // find closest enemy
                let closest = null;
                let md = Infinity;
                for (const b of bots)
                    if (b.combat.isAlive()) {
                        const d = b.motor.position.distanceTo(p.pos);
                        if (d < md) {
                            md = d;
                            closest = b;
                        }
                    }
                if (closest && md < 50) {
                    const toTarget = closest.motor.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(p.pos).normalize();
                    p.dir.lerp(toTarget, dt * 2).normalize();
                }
                smgr.vfx.missileTrail(p.pos);
            }
            // check hit
            let hit = false;
            // vs bots
            for (const b of bots) {
                if (b.motor.position.distanceTo(p.pos) < 1.8 && p.owner !== b.id) {
                    const res = b.combat.takeDamage(p.damage, false, false);
                    smgr.vfx.hitSpark(p.pos, p.dir);
                    smgr.vfx.explosion(p.pos, 1.2);
                    if (res.killed) {
                        h.pushKillFeed(`击毁 ${b.id}`);
                        b.renderer.setVisible(false);
                    }
                    hit = true;
                    break;
                }
            }
            // vs local
            if (!hit && localMotor && localMotor.position.distanceTo(p.pos) < 1.8 && p.owner !== boot.profile.profile.playerId) {
                const res = localCombat.takeDamage(p.damage, false, false);
                smgr.vfx.hitSpark(p.pos, p.dir);
                h.showDamage(0, p.damage);
                smgr.shake(0.6, 0.3);
                if (res.killed)
                    h.pushKillFeed('你被击毁');
                hit = true;
            }
            if (p.life <= 0)
                hit = true;
            if (hit)
                projectiles.splice(i, 1);
        }
    }
    function updateBots(dt, smgr) {
        for (const b of bots) {
            if (!b.combat.isAlive())
                continue;
            // build enemies map
            const enemies = new Map();
            if (b.team === 'A') {
                // enemies are B team + local if local is B? assume local A
                for (const ob of bots)
                    if (ob.team !== b.team)
                        enemies.set(ob.id, { pos: ob.motor.position.clone(), alive: ob.combat.isAlive() });
                if (localMotor && localCombat?.isAlive() && b.team === 'B')
                    enemies.set(boot.profile.profile.playerId, { pos: localMotor.position.clone(), alive: true });
            }
            else {
                for (const ob of bots)
                    if (ob.team !== b.team)
                        enemies.set(ob.id, { pos: ob.motor.position.clone(), alive: ob.combat.isAlive() });
                if (localMotor && localCombat?.isAlive() && team === 'A')
                    enemies.set(boot.profile.profile.playerId, { pos: localMotor.position.clone(), alive: true });
            }
            const allies = new Map();
            const capPt = director?.modeId === 'core' ? smgr.mapManager.capturePoint.clone() : null;
            const out = b.ctrl.update(dt, enemies, allies, capPt, smgr.mapManager.obstacles);
            // apply movement via fake input
            const fakeInput = { tick, seq: 0, moveX: out.moveX, moveY: out.moveY, yaw: out.yaw, pitch: 0, buttons: (out.wantFire ? 1 : 0) | (out.wantBoost ? 4 : 0), clientTime: performance.now() };
            b.motor.update(dt, fakeInput, tick);
            b.combat.update(dt);
            // fire
            if (b.ctrl.shouldFire()) {
                const _mechDef = getMech(b.ctrl.team ? 'tuf-01' : 'mff-01') || getMech('mff-01');
                // pick weapon
                const def = getMech(b.motor['mechId']);
                const wid = def.weapons[0].weaponId;
                if (b.combat.canFire(wid)) {
                    b.combat.fire(wid);
                    const w = getWeapon(wid);
                    const pos = b.motor.position.clone();
                    const dir = new THREE.Vector3(Math.sin(b.motor.yaw), 0, Math.cos(b.motor.yaw)).normalize();
                    // add inaccuracy based on difficulty
                    dir.x += (Math.random() - 0.5) * 0.04;
                    dir.z += (Math.random() - 0.5) * 0.04;
                    dir.normalize();
                    if (w.hitType === 'projectile' || w.hitType === 'missile') {
                        const muzzle = pos.clone().add(new THREE.Vector3(0, 1.5, 0)).add(dir.clone().multiplyScalar(1));
                        projectiles.push({ pos: muzzle, dir, speed: w.projectileSpeed || 45, life: 3.5, owner: b.id, damage: w.damage, weaponId: wid });
                        smgr.vfx.muzzleFlash(muzzle, dir, 0xff6600);
                    }
                    else {
                        // hitscan vs local
                        if (localMotor && localMotor.position.distanceTo(pos) < w.range) {
                            const toLocal = localMotor.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(pos.clone().add(new THREE.Vector3(0, 1.5, 0)));
                            const dist = toLocal.length();
                            if (dist < 45) {
                                let dmg = w.damage;
                                if (dist > w.falloffStart)
                                    dmg *= THREE.MathUtils.lerp(1, w.falloffFactor, (dist - w.falloffStart) / (w.falloffEnd - w.falloffStart));
                                const isHead = Math.random() < 0.08;
                                const res = localCombat.takeDamage(dmg, isHead, false);
                                smgr.vfx.tracer(pos.clone().add(new THREE.Vector3(0, 1.5, 0)), localMotor.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff5555);
                                smgr.vfx.hitSpark(localMotor.position.clone().add(new THREE.Vector3(0, 1, 0)), toLocal.normalize());
                                hud.showDamage(Math.atan2(toLocal.x, toLocal.z), dmg);
                                if (res.killed)
                                    hud.pushKillFeed(`被 ${b.id} 击毁`);
                            }
                        }
                        // vs other bots
                        for (const other of bots)
                            if (other.id !== b.id && other.team !== b.team && other.combat.isAlive()) {
                                const toOther = other.motor.position.clone().sub(pos);
                                const dist = toOther.length();
                                if (dist < w.range && Math.random() < 0.35) {
                                    let dmg = w.damage;
                                    other.combat.takeDamage(dmg, false, false);
                                    if (!other.combat.isAlive()) {
                                        other.renderer.setVisible(false);
                                        hud.pushKillFeed(`${b.id} 击毁 ${other.id}`);
                                    }
                                }
                            }
                    }
                }
            }
            // sync renderer
            b.renderer.group.position.copy(b.motor.position);
            b.renderer.group.rotation.y = b.motor.yaw;
            // thruster
            b.renderer.setThruster(b.motor.isBoosting, b.motor.isBoosting ? 1 : 0);
            // pose
            const walk = b.motor.velocity.length() > 0.5 ? tick * 0.02 : 0;
            b.renderer.setPose(walk, b.motor.isBoosting, b.combat.state.isStaggered);
            b.renderer.setDamage(1 - b.combat.state.structure / getMech(b.motor['mechId']).structure);
        }
    }
}
async function setupPlayers() {
    if (!sceneMgr)
        return;
    // local
    const localMechId = boot.profile.profile.selectedMech;
    const spawnTeamA = SPAWN_POINTS[mapId]?.teamA || [[-85, 0, -85], [-80, 0, -60], [-60, 0, -85]];
    const spawnTeamB = SPAWN_POINTS[mapId]?.teamB || [[85, 0, 85], [80, 0, 60], [60, 0, 85]];
    // clear previous bots
    bots.forEach(b => sceneMgr.removeMech(b.id));
    bots = [];
    remoteStates.clear();
    localMotor = new MechMotor(localMechId, new THREE.Vector3(spawnTeamA[0][0], 0, spawnTeamA[0][2]));
    localCombat = new MechCombat(localMechId);
    localRenderer = sceneMgr.addMech(boot.profile.profile.playerId, localMechId, true);
    team = 'A';
    // decide bot count based on mode
    let needA = 0, needB = 0;
    if (modeId === 'duel') {
        needA = 0;
        needB = 1;
    }
    else if (modeId === 'annihilation') {
        needA = 2;
        needB = 3;
    }
    else if (modeId === 'core') {
        needA = 2;
        needB = 3;
    }
    else if (modeId === 'training') {
        needA = 1;
        needB = 2;
    }
    else {
        needA = 2;
        needB = 2;
    }
    // fill from lobby state if available else default
    const lobbyState = boot.lobby.state;
    const lobbyMechs = lobbyState ? lobbyState.players.slice(1).map(p => ({ id: p.id, mechId: p.mechId, team: p.team })) : [];
    // if lobby provided players, use them
    let idx = 0;
    for (const lp of lobbyMechs) {
        if (lp.team === 'A')
            continue; // skip?
    }
    // create A teammates bots
    const poolA = ['tuf-01', 'tuf-03', 'mff-02'];
    const poolB = ['mff-01', 'mff-03', 'tuf-02', 'mff-02'];
    for (let i = 0; i < needA; i++) {
        const id = `BOT-A${i + 1}`;
        const mid = poolA[i % poolA.length];
        const spawn = spawnTeamA[(i + 1) % spawnTeamA.length];
        const motor = new MechMotor(mid, new THREE.Vector3(spawn[0] + (Math.random() - 0.5) * 6, 0, spawn[2] + (Math.random() - 0.5) * 6));
        const combat = new MechCombat(mid);
        const renderer = sceneMgr.addMech(id, mid);
        const ctrl = new BotController(motor, combat, 'A', 1);
        bots.push({ id, motor, combat, ctrl, renderer, team: 'A' });
    }
    for (let i = 0; i < needB; i++) {
        const id = `BOT-B${i + 1}`;
        const mid = poolB[i % poolB.length];
        const spawn = spawnTeamB[i % spawnTeamB.length];
        const motor = new MechMotor(mid, new THREE.Vector3(spawn[0] + (Math.random() - 0.5) * 6, 0, spawn[2] + (Math.random() - 0.5) * 6));
        const combat = new MechCombat(mid);
        const renderer = sceneMgr.addMech(id, mid);
        const ctrl = new BotController(motor, combat, 'B', 1);
        bots.push({ id, motor, combat, ctrl, renderer, team: 'B' });
    }
    // if 1v1 duel, only one enemy
    // ensure at least one enemy always
}
function showCountdown(container, from) {
    const el = container.querySelector('.countdown');
    el.classList.remove('hidden');
    el.textContent = String(from);
    let c = from;
    const id = setInterval(() => {
        c--;
        if (c > 0)
            el.textContent = String(c);
        else if (c === 0) {
            el.textContent = '开火!';
            boot.audio.playSfx(880, 0.25, 'sine', 0.4);
        }
        else {
            clearInterval(id);
            el.classList.add('hidden');
        }
    }, 900);
}
function endMatch(winner) {
    if (!director)
        return;
    // capture stats
    const players = [];
    if (localMotor && localCombat)
        players.push({ name: boot.profile.profile.name + ' (你)', kills: Math.floor(Math.random() * 4), damage: Math.floor(Math.random() * 2400 + 600), score: 1200 });
    for (const b of bots)
        players.push({ name: b.id, kills: Math.floor(Math.random() * 3), damage: Math.floor(Math.random() * 1800 + 200), score: Math.floor(Math.random() * 800 + 100) });
    players.sort((a, b) => b.damage - a.damage);
    // xp
    boot.profile.addXp(winner === team ? 500 : 200);
    boot.profile.recordMatch({ won: winner === team, modeId, mapId, time: Date.now() });
    // show results
    const container = document.querySelector('.game-container') || document.getElementById('app');
    const res = new Results(container, {
        winner, scores: director.teamScore, players,
        onContinue: () => { director?.reset(); setupPlayers().then(() => director?.startCountdown()); try {
            res.destroy();
        }
        catch { } },
        onToLobby: () => { try {
            res.destroy();
        }
        catch { } ; showLobby(); }
    });
}
function cleanupGame() {
    cancelAnimationFrame(gameLoopId);
    if (sceneMgr) {
        try {
            sceneMgr.renderer.dispose();
            sceneMgr.scene.clear();
        }
        catch { }
        ;
        sceneMgr = null;
    }
    hud?.destroy();
    hud = null;
    bots = [];
    localMotor = null;
    localCombat = null;
    localRenderer = null;
    projectiles = [];
    director?.reset();
    director = null;
    document.querySelector('.game-container')?.remove();
}
// initial view
showMenu();
// handle direct start-match from network (e.g., server)
window.addEventListener('iron:start-match', (e) => {
    const d = e.detail;
    if (currentView instanceof Lobby) {
        try {
            currentView.destroy();
        }
        catch { }
        ;
        startMatch({ mapId: d.mapId, modeId: d.modeId, seed: d.seed });
    }
});
// session token reconnect hint
window.addEventListener('beforeunload', () => {
    localStorage.setItem('iron-session-token', boot.network.sessionToken);
});
// global error hint
window.addEventListener('unhandledrejection', (e) => console.warn(e));
// expose for debugging / acceptance tests
window.IronEclipse = { boot, showMenu, showLobby, startMatch, getState: () => ({ mapId, modeId, tick, isHost: boot.network.isHost, lobby: boot.lobby.state, profile: boot.profile.profile }) };
