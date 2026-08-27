import { GAME } from '../config/gameConfig'

export type MenuAction = 'range' | 'private' | 'quick' | 'loadout'

export class MainMenu {
  readonly root: HTMLElement
  private onAction: ((action: MenuAction) => void) | null = null

  constructor(host: HTMLElement) {
    this.root = document.createElement('div')
    this.root.id = 'main-menu'
    this.root.innerHTML = `
      <div class="menu-bg"></div>
      <div class="menu-panel">
        <p class="eyebrow">1v1 · MODERN WARFARE</p>
        <h1>${GAME.brand}</h1>
        <p class="tagline">Fast duels. Loadouts locked in. No wasted time.</p>
        <div class="menu-actions">
          <button type="button" data-action="range" class="primary">Enter Range</button>
          <button type="button" data-action="private">Private Room</button>
          <button type="button" data-action="quick">Quick Match</button>
          <button type="button" data-action="loadout">Loadouts</button>
        </div>
        <p class="menu-note">Phase 0 — Range is playable. Matchmaking &amp; accounts come next.</p>
      </div>
    `
    host.appendChild(this.root)

    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action as MenuAction
        this.onAction?.(action)
      })
    })
  }

  on(handler: (action: MenuAction) => void): void {
    this.onAction = handler
  }

  setVisible(v: boolean): void {
    this.root.style.display = v ? 'grid' : 'none'
  }

  showToast(message: string): void {
    let toast = this.root.querySelector('.toast') as HTMLElement | null
    if (!toast) {
      toast = document.createElement('div')
      toast.className = 'toast'
      this.root.appendChild(toast)
    }
    toast.textContent = message
    toast.classList.add('show')
    window.setTimeout(() => toast?.classList.remove('show'), 2200)
  }
}
