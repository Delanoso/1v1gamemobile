import { GAME } from '../config/gameConfig'

export class HUD {
  readonly root: HTMLElement
  private healthFill: HTMLElement
  private ammoEl: HTMLElement
  private feedEl: HTMLElement
  private crosshair: HTMLElement
  private hitmarker: HTMLElement
  private modeEl: HTMLElement

  constructor(host: HTMLElement) {
    this.root = document.createElement('div')
    this.root.id = 'hud'
    this.root.innerHTML = `
      <div class="top-bar">
        <div class="brand">${GAME.brand}</div>
        <div class="mode" id="hud-mode">RANGE</div>
      </div>
      <div class="crosshair" id="crosshair">
        <span class="ch h"></span><span class="ch v"></span>
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
    this.hitmarker = this.root.querySelector('#hitmarker')!
    this.modeEl = this.root.querySelector('#hud-mode')!
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
  }

  setAds(ads: boolean): void {
    this.crosshair.classList.toggle('ads', ads)
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
