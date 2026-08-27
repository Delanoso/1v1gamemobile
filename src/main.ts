import './style.css'
import { Game } from './game/Game'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

// Prevent iOS rubber-band / gesture zoom fighting the shooter
document.addEventListener(
  'gesturestart',
  (e) => e.preventDefault(),
  { passive: false },
)

new Game(app)
