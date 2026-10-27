export interface InputFrame {
  tick: number;
  seq: number;
  moveX: number;
  moveY: number;
  yaw: number;
  pitch: number;
  buttons: number; // bitmask
  clientTime: number;
}

export const BTN_FIRE = 1 << 0;
export const BTN_AIM = 1 << 1;
export const BTN_BOOST = 1 << 2;
export const BTN_JUMP = 1 << 3;
export const BTN_Q = 1 << 4;
export const BTN_E = 1 << 5;
export const BTN_R = 1 << 6;
export const BTN_RELOAD = 1 << 7;
export const BTN_MELEE = 1 << 8;

export class InputCollector {
  moveX = 0; moveY = 0;
  yaw = 0; pitch = 0;
  buttons = 0;
  mouseDown = false;
  aimDown = false;

  private keys = new Set<string>();
  private seq = 0;
  private pointerLocked = false;
  element: HTMLElement | null = null;

  attach(element: HTMLElement, cameraYawRef: { value: number }, cameraPitchRef: { value: number }) {
    this.element = element;
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.code.toLowerCase());
      this.updateButtons();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code.toLowerCase());
      this.updateButtons();
      if (e.code === 'Tab') e.preventDefault();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) this.mouseDown = true;
      if (e.button === 2) this.aimDown = true;
      this.updateButtons();
      if (!this.pointerLocked && element.requestPointerLock) element.requestPointerLock();
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) this.mouseDown = false;
      if (e.button === 2) this.aimDown = false;
      this.updateButtons();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!this.pointerLocked) return;
      const sens = 0.0025;
      cameraYawRef.value -= e.movementX * sens;
      cameraPitchRef.value = Math.max(-0.6, Math.min(0.8, cameraPitchRef.value - e.movementY * sens));
      this.yaw = cameraYawRef.value;
      this.pitch = cameraPitchRef.value;
    };
    const onLockChange = () => { this.pointerLocked = document.pointerLockElement === element; };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    element.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    element.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onLockChange);
    element.addEventListener('contextmenu', onContextMenu);

    // gamepad poll
    setInterval(()=> this.pollGamepad(cameraYawRef, cameraPitchRef), 16);
  }

  private pollGamepad(yawRef: {value:number}, pitchRef:{value:number}) {
    const pads = navigator.getGamepads();
    const pad = pads[0];
    if (!pad) return;
    const dead = 0.2;
    let lx = Math.abs(pad.axes[0])>dead? pad.axes[0]:0;
    let ly = Math.abs(pad.axes[1])>dead? pad.axes[1]:0;
    let rx = Math.abs(pad.axes[2])>dead? pad.axes[2]:0;
    let ry = Math.abs(pad.axes[3])>dead? pad.axes[3]:0;
    if (lx || ly) { this.moveX = lx; this.moveY = -ly; }
    if (rx || ry) {
      yawRef.value -= rx*0.04;
      pitchRef.value = Math.max(-0.6, Math.min(0.8, pitchRef.value - ry*0.04));
      this.yaw = yawRef.value; this.pitch = pitchRef.value;
    }
    // map buttons
    this.buttons = 0;
    if (pad.buttons[7]?.pressed || pad.buttons[5]?.pressed) this.buttons |= BTN_FIRE;
    if (pad.buttons[6]?.pressed) this.buttons |= BTN_AIM;
    if (pad.buttons[0]?.pressed) this.buttons |= BTN_JUMP;
    if (pad.buttons[1]?.pressed) this.buttons |= BTN_BOOST;
  }

  private updateButtons() {
    this.buttons = 0;
    if (this.keys.has('keyw')) this.moveY = 1;
    else if (this.keys.has('keys')) this.moveY = -1;
    else if (!this.isGamepadMovingY()) this.moveY = 0;

    if (this.keys.has('keya')) this.moveX = -1;
    else if (this.keys.has('keyd')) this.moveX = 1;
    else if (!this.isGamepadMovingX()) this.moveX = 0;

    // normalize diagonal
    if (this.moveX && this.moveY) { this.moveX *= 0.707; this.moveY *= 0.707; }

    if (this.mouseDown) this.buttons |= BTN_FIRE;
    if (this.aimDown || this.keys.has('capslock') || this.keys.has('shiftleft') && false) this.buttons |= BTN_AIM;
    if (this.keys.has('shiftleft') || this.keys.has('shift')) this.buttons |= BTN_BOOST;
    if (this.keys.has('space')) this.buttons |= BTN_JUMP;
    if (this.keys.has('keyq')) this.buttons |= BTN_Q;
    if (this.keys.has('keye')) this.buttons |= BTN_E;
    if (this.keys.has('keyr')) this.buttons |= BTN_R;
    if (this.keys.has('keyf')) this.buttons |= BTN_MELEE;
  }

  private isGamepadMovingX(){ return false; }
  private isGamepadMovingY(){ return false; }

  collect(tick: number): InputFrame {
    return {
      tick, seq: this.seq++,
      moveX: this.moveX, moveY: this.moveY,
      yaw: this.yaw, pitch: this.pitch,
      buttons: this.buttons,
      clientTime: performance.now()
    };
  }

  setMove(x:number,y:number){ this.moveX=x; this.moveY=y; }
}
