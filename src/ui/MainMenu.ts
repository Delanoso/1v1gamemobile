import { GAME } from '../config/gameConfig'

export type MenuAction = 'play'

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
        <p class="tagline">Fast duels. Tight maps. No wasted time.</p>
        <div class="menu-actions">
          <button type="button" data-action="play" class="primary">Play</button>
        </div>
        <p class="menu-note">Polishing gunfeel &amp; warehouse map. Multiplayer comes later.</p>
      </div>
    `
    host.appendChild(this.root)

    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.onAction?.('play')
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
