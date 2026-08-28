export type Vec2 = { x: number; y: number }

export interface FrameInput {
  move: Vec2
  lookDelta: Vec2
  fire: boolean
  ads: boolean
  jump: boolean
  crouch: boolean
  reload: boolean
  sprint: boolean
  lethal: boolean
  tactical: boolean
}

export function emptyInput(): FrameInput {
  return {
    move: { x: 0, y: 0 },
    lookDelta: { x: 0, y: 0 },
    fire: false,
    ads: false,
    jump: false,
    crouch: false,
    reload: false,
    sprint: false,
    lethal: false,
    tactical: false,
  }
}

function clampStick(x: number, y: number, deadzone = 0.18): Vec2 {
  const m = Math.hypot(x, y)
  if (m < deadzone) return { x: 0, y: 0 }
  const scale = Math.min(1, (m - deadzone) / (1 - deadzone)) / m
  return { x: x * scale, y: y * scale }
}

/**
 * Merges touch HUD + connected gamepad into one frame of intent.
 * Gamepad overrides sticks when active; buttons OR with touch.
 */
export class InputManager {
  private touchMove: Vec2 = { x: 0, y: 0 }
  private touchLook: Vec2 = { x: 0, y: 0 }
  private mouseLook: Vec2 = { x: 0, y: 0 }
  private keys = new Set<string>()
  private mouseButtons = { left: false, right: false }
  private touchButtons = {
    fire: false,
    ads: false,
    jump: false,
    crouch: false,
    reload: false,
    sprint: false,
    lethal: false,
    tactical: false,
  }
  /** One-frame taps from touch HUD (jump/reload/crouch miss a frame if only touchend fires). */
  private jumpQueued = false
  private reloadQueued = false
  private crouchQueued = false
  /** ADS stays on until toggled off (touch HUD). */
  private touchAdsOn = false

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      if (['Space', 'Tab'].includes(e.code)) e.preventDefault()
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))
    window.addEventListener('blur', () => this.keys.clear())
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.mouseLook.x += e.movementX
        this.mouseLook.y += e.movementY
      }
    })
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseButtons.left = true
      if (e.button === 2) this.mouseButtons.right = true
    })
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseButtons.left = false
      if (e.button === 2) this.mouseButtons.right = false
    })
    window.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  setTouchMove(x: number, y: number): void {
    this.touchMove = clampStick(x, y, 0.08)
  }

  addTouchLook(dx: number, dy: number): void {
    this.touchLook.x += dx
    this.touchLook.y += dy
  }

  setTouchButton(
    button: keyof InputManager['touchButtons'],
    pressed: boolean,
  ): void {
    this.touchButtons[button] = pressed
  }

  queueJump(): void {
    this.jumpQueued = true
  }

  queueReload(): void {
    this.reloadQueued = true
  }

  queueCrouchTap(): void {
    this.crouchQueued = true
  }

  toggleTouchAds(): boolean {
    this.touchAdsOn = !this.touchAdsOn
    return this.touchAdsOn
  }

  setTouchAds(on: boolean): void {
    this.touchAdsOn = on
  }

  resetTouchState(): void {
    this.touchMove = { x: 0, y: 0 }
    this.touchLook = { x: 0, y: 0 }
    this.jumpQueued = false
    this.reloadQueued = false
    this.crouchQueued = false
    this.touchAdsOn = false
    for (const k of Object.keys(this.touchButtons) as (keyof typeof this.touchButtons)[]) {
      this.touchButtons[k] = false
    }
  }

  sample(dt: number): FrameInput {
    const pad = this.readGamepad(dt)
    const kbMove = this.readKeyboardMove()
    const move =
      Math.hypot(pad.move.x, pad.move.y) > 0.01
        ? pad.move
        : Math.hypot(kbMove.x, kbMove.y) > 0.01
          ? kbMove
          : this.touchMove

    const touchSens = 0.0034
    const mouseSens = 0.0022
    const lookDelta = {
      x:
        this.touchLook.x * touchSens +
        this.mouseLook.x * mouseSens +
        pad.lookDelta.x,
      y:
        this.touchLook.y * touchSens +
        this.mouseLook.y * mouseSens +
        pad.lookDelta.y,
    }
    this.touchLook = { x: 0, y: 0 }
    this.mouseLook = { x: 0, y: 0 }

    const kb = this.keys
    const jump = this.touchButtons.jump || pad.jump || kb.has('Space') || this.jumpQueued
    const reload = this.touchButtons.reload || pad.reload || kb.has('KeyR') || this.reloadQueued
    const crouch = this.touchButtons.crouch || pad.crouch || kb.has('KeyC') || this.crouchQueued
    this.jumpQueued = false
    this.reloadQueued = false
    this.crouchQueued = false

    return {
      move,
      lookDelta,
      fire: this.touchButtons.fire || pad.fire || this.mouseButtons.left,
      ads: this.touchAdsOn || pad.ads || this.mouseButtons.right,
      jump,
      crouch,
      reload,
      sprint: this.touchButtons.sprint || pad.sprint || kb.has('ShiftLeft'),
      lethal: this.touchButtons.lethal || pad.lethal || kb.has('KeyG'),
      tactical: this.touchButtons.tactical || pad.tactical || kb.has('KeyQ'),
    }
  }

  private readKeyboardMove(): Vec2 {
    let x = 0
    let y = 0
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1
    return clampStick(x, y, 0.01)
  }

  private readGamepad(dt: number): FrameInput {
    const out = emptyInput()
    const pads = navigator.getGamepads?.() ?? []
    const gp = pads.find((p) => p && p.connected)
    if (!gp) return out

    out.move = clampStick(gp.axes[0] ?? 0, -(gp.axes[1] ?? 0))
    const look = clampStick(gp.axes[2] ?? 0, gp.axes[3] ?? 0, 0.12)
    const padSens = 2.4
    out.lookDelta = { x: look.x * padSens * dt, y: look.y * padSens * dt }

    // Standard mapping: RT fire, LT ADS, A jump, B crouch, X reload, LB sprint
    out.fire = (gp.buttons[7]?.value ?? 0) > 0.3
    out.ads = (gp.buttons[6]?.value ?? 0) > 0.3
    out.jump = !!gp.buttons[0]?.pressed
    out.crouch = !!gp.buttons[1]?.pressed
    out.reload = !!gp.buttons[2]?.pressed
    out.sprint = !!gp.buttons[4]?.pressed
    out.lethal = !!gp.buttons[5]?.pressed
    out.tactical = !!gp.buttons[3]?.pressed
    return out
  }
}
