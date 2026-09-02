import './style.css'
import { preloadM4ViewModel } from './assets/weapon/WeaponAsset'
import { Game } from './game/Game'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

// Prevent iOS rubber-band / gesture zoom fighting the shooter
document.addEventListener(
  'gesturestart',
  (e) => e.preventDefault(),
  { passive: false },
)

void preloadM4ViewModel()
new Game(app)
