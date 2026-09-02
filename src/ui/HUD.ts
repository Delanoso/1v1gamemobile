import { GAME } from '../config/gameConfig'

export class HUD {
  readonly root: HTMLElement
  private healthFill: HTMLElement
  private ammoEl: HTMLElement
  private feedEl: HTMLElement
  private crosshair: HTMLElement
  private scopeOverlay: HTMLElement
  private scopeFrame: HTMLElement
  private scopeVignette: HTMLElement
  private hitmarker: HTMLElement
  private modeEl: HTMLElement
  private sprintEl: HTMLElement

  constructor(host: HTMLElement) {
    this.root = document.createElement('div')
    this.root.id = 'hud'
    this.root.innerHTML = `
      <div class="top-bar">
        <div class="brand">${GAME.brand}</div>
        <div class="mode" id="hud-mode">WAREHOUSE</div>
      </div>
      <div class="sprint-tag" id="sprint-tag">SPRINT</div>
      <div class="crosshair" id="crosshair">
        <span class="ch h"></span><span class="ch v"></span>
      </div>
      <div class="scope-overlay" id="scope-overlay" aria-hidden="true">
        <div class="scope-vignette"></div>
        <div class="scope-frame">
          <div class="scope-lens"></div>
          <div class="scope-dot"></div>
        </div>
      </div>
      <div class="hitmarker" id="hitmarker"></div>
      <div class="kill-feed" id="kill-feed"></div>
      <div class="bottom-left">
        <div class="health">
          <div class="health-fill" id="health-fill"></div>
        </div>
      </div>
      <div class="bottom-right">
        <div class="weapon" id="weapon-name">${GAME.weapon.name}</div>
        <div class="ammo" id="ammo">30 / 90</div>
      </div>
    `
    host.appendChild(this.root)
    this.healthFill = this.root.querySelector('#health-fill')!
    this.ammoEl = this.root.querySelector('#ammo')!
    this.feedEl = this.root.querySelector('#kill-feed')!
    this.crosshair = this.root.querySelector('#crosshair')!
    this.scopeOverlay = this.root.querySelector('#scope-overlay')!
    this.scopeFrame = this.root.querySelector('.scope-frame')!
    this.scopeVignette = this.root.querySelector('.scope-vignette')!
    this.hitmarker = this.root.querySelector('#hitmarker')!
    this.modeEl = this.root.querySelector('#hud-mode')!
    this.sprintEl = this.root.querySelector('#sprint-tag')!
  }

  setVisible(v: boolean): void {
    this.root.style.display = v ? 'block' : 'none'
  }

  setMode(label: string): void {
    this.modeEl.textContent = label
  }

  setHealth(current: number, max = GAME.combat.maxHealth): void {
    const pct = Math.max(0, Math.min(100, (current / max) * 100))
    this.healthFill.style.width = `${pct}%`
  }

  setAmmo(mag: number, reserve: number, reloading: boolean): void {
    this.ammoEl.textContent = reloading ? 'RELOADING…' : `${mag} / ${reserve}`
    this.ammoEl.classList.toggle('low', !reloading && mag <= 8)
  }

  setSprinting(sprinting: boolean): void {
    this.sprintEl.classList.toggle('show', sprinting)
  }

  setAds(ads: boolean, blend = ads ? 1 : 0, scopeFramePx = 180): void {
    const amount = ads ? Math.max(blend, 0.35) : blend
    this.crosshair.classList.toggle('ads', amount > 0.5)
    this.scopeOverlay.classList.toggle('active', amount > 0.08)
    this.scopeOverlay.style.opacity = String(Math.min(1, amount))
    this.scopeOverlay.setAttribute('aria-hidden', amount > 0.08 ? 'false' : 'true')

    const size = `${scopeFramePx}px`
    this.scopeFrame.style.width = size
    this.scopeFrame.style.height = size
    this.scopeVignette.style.setProperty('--scope-inner', `${scopeFramePx * 0.5}px`)
    this.scopeVignette.style.setProperty('--scope-outer', `${scopeFramePx * 0.95}px`)
  }

  flashHitmarker(killed = false): void {
    this.hitmarker.classList.remove('show', 'kill')
    void this.hitmarker.offsetWidth
    this.hitmarker.classList.add('show')
    if (killed) this.hitmarker.classList.add('kill')
  }

  pushFeed(text: string): void {
    const row = document.createElement('div')
    row.className = 'feed-row'
    row.textContent = text
    this.feedEl.prepend(row)
    setTimeout(() => row.remove(), 3200)
    while (this.feedEl.children.length > 4) {
      this.feedEl.lastElementChild?.remove()
    }
  }
}
