import type { InputManager } from './InputManager'

/** On-screen mobile controls: left stick, right look zone, action cluster. */
export class TouchControls {
  readonly root: HTMLElement
  private stickKnob: HTMLElement
  private stickTouchId: number | null = null
  private lookTouchId: number | null = null
  private stickOrigin = { x: 0, y: 0 }
  private lookLast = { x: 0, y: 0 }
  private readonly maxRadius = 54
  private readonly input: InputManager

  constructor(input: InputManager, host: HTMLElement) {
    this.input = input
    this.root = document.createElement('div')
    this.root.id = 'touch-controls'
    this.root.innerHTML = `
      <div class="stick-base" id="move-stick">
        <div class="stick-knob" id="move-knob"></div>
      </div>
      <div class="look-zone" id="look-zone"></div>
      <div class="action-cluster">
        <button type="button" class="act ads" data-btn="ads">ADS</button>
        <button type="button" class="act fire" data-btn="fire">FIRE</button>
        <button type="button" class="act jump" data-btn="jump">JUMP</button>
        <button type="button" class="act crouch" data-btn="crouch">CROUCH</button>
        <button type="button" class="act reload" data-btn="reload">RELOAD</button>
        <button type="button" class="act sprint" data-btn="sprint">SPRINT</button>
        <button type="button" class="act lethal" data-btn="lethal">LETHAL</button>
        <button type="button" class="act tactical" data-btn="tactical">TAC</button>
      </div>
    `
    host.appendChild(this.root)
    this.stickKnob = this.root.querySelector('#move-knob')!

    this.bindStick()
    this.bindLook()
    this.bindButtons()
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? 'block' : 'none'
  }

  private bindStick(): void {
    const base = this.root.querySelector('#move-stick') as HTMLElement

    const onStart = (e: TouchEvent) => {
      if (this.stickTouchId !== null) return
      const t = e.changedTouches[0]
      this.stickTouchId = t.identifier
      const rect = base.getBoundingClientRect()
      this.stickOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
      this.updateStick(t.clientX, t.clientY)
      e.preventDefault()
    }
    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== this.stickTouchId) continue
        this.updateStick(t.clientX, t.clientY)
        e.preventDefault()
      }
    }
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== this.stickTouchId) continue
        this.stickTouchId = null
        this.input.setTouchMove(0, 0)
        this.stickKnob.style.transform = 'translate(-50%, -50%)'
        e.preventDefault()
      }
    }

    base.addEventListener('touchstart', onStart, { passive: false })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: false })
    window.addEventListener('touchcancel', onEnd, { passive: false })
  }

  private updateStick(clientX: number, clientY: number): void {
    let dx = clientX - this.stickOrigin.x
    let dy = clientY - this.stickOrigin.y
    const mag = Math.hypot(dx, dy)
    if (mag > this.maxRadius) {
      dx = (dx / mag) * this.maxRadius
      dy = (dy / mag) * this.maxRadius
    }
    this.stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    this.input.setTouchMove(dx / this.maxRadius, -dy / this.maxRadius)
  }

  private bindLook(): void {
    const zone = this.root.querySelector('#look-zone') as HTMLElement
    zone.addEventListener(
      'touchstart',
      (e) => {
        if (this.lookTouchId !== null) return
        const t = e.changedTouches[0]
        this.lookTouchId = t.identifier
        this.lookLast = { x: t.clientX, y: t.clientY }
        e.preventDefault()
      },
      { passive: false },
    )
    window.addEventListener(
      'touchmove',
      (e) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier !== this.lookTouchId) continue
          const dx = t.clientX - this.lookLast.x
          const dy = t.clientY - this.lookLast.y
          this.lookLast = { x: t.clientX, y: t.clientY }
          this.input.addTouchLook(dx, dy)
          e.preventDefault()
        }
      },
      { passive: false },
    )
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.lookTouchId) this.lookTouchId = null
      }
    }
    window.addEventListener('touchend', end, { passive: false })
    window.addEventListener('touchcancel', end, { passive: false })
  }

  private bindButtons(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-btn]').forEach((btn) => {
      const key = btn.dataset.btn as Parameters<InputManager['setTouchButton']>[0]
      const down = (e: Event) => {
        e.preventDefault()
        this.input.setTouchButton(key, true)
        btn.classList.add('pressed')
      }
      const up = (e: Event) => {
        e.preventDefault()
        this.input.setTouchButton(key, false)
        btn.classList.remove('pressed')
      }
      btn.addEventListener('touchstart', down, { passive: false })
      btn.addEventListener('touchend', up, { passive: false })
      btn.addEventListener('touchcancel', up, { passive: false })
      btn.addEventListener('mousedown', down)
      btn.addEventListener('mouseup', up)
      btn.addEventListener('mouseleave', up)
    })
  }
}
