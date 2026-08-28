# Frontline

Modern-military **1v1 FPS** for phone and tablet (MW multiplayer feel). Built as a web app first, installable later (PWA → Capacitor / store builds).

## Current status (Phase 0)

Playable **warehouse range**:
- Touch move / look / fire / ADS / jump / crouch / reload / sprint
- Gamepad support when a controller is connected
- M4A1 fire with recoil, ammo, reload, hitmarkers
- Vertical warehouse map + static range plates (for gunfeel — not AI bots)

Matchmaking, accounts, loadouts, and live 1v1 are next (see `docs/VISION.md`).

## Develop

```bash
npm install
npm run dev
```

- **Game:** `/` → tap **Play**
- **Asset Lab** (one asset at a time): `/lab.html`

See `docs/ASSET_LAB.md` for the polish workflow.

Open the local URL on your iPad (same network). Use landscape.

```bash
npm run build
npm run preview
```

## Working title

**FRONTLINE** — rename anytime once branding is locked.
