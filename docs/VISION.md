# Frontline — Vision & Build Plan

Working title for a modern-military **1v1 FPS** (MW multiplayer feel), **phone/tablet first**, free-to-play, accounts required.

## Locked decisions

| Area | Choice |
|------|--------|
| Perspective | First-person only |
| Pace | Fast |
| Setting | Modern military, realistic art direction |
| Modes | First to X kills · Timed (5 min default) · Objectives |
| Loadouts | Chosen pre-match: primary + secondary + lethal + tactical + perks |
| Maps | Multiple with verticality (warehouse first; urban, container yard next) |
| Destructibles | None for now |
| Matchmaking | Private invite rooms + quick match |
| Network | Cross-region; P2P OK for prototype; move to authoritative servers later |
| Progression | Casual first; ranks later |
| Platforms | Phone + tablet now; installable / native wrappers later |
| Input | Touch + connected gamepad |
| Bots / spectate | Not in early builds |
| Monetization | Free-to-play |

## Recommended tech path

1. **Now — Web (Vite + TypeScript + Three.js)**  
   Fast iteration on iPad Safari / Chrome, one codebase, PWA installable.

2. **Next — PWA “Add to Home Screen”**  
   Fullscreen landscape app on iPad/iPhone without store friction.

3. **Then — Capacitor (iOS / Android)**  
   Same web game shell wrapped for App Store / Play Store when gunfeel + netcode are solid.

4. **Later — Desktop (Tauri or Steam via wrapper)**  
   Same core; mouse/keyboard skin on top of the shared input layer.

Avoid Unity/Unreal until/unless we outgrow web rendering or need console certification. For a two-person build, web keeps the loop tight.

## Quality pillars (all equal)

1. Gunfeel & movement  
2. Net fairness (even while P2P)  
3. Readable realistic presentation  
4. Clean mobile UI / touch targets  

## Phased focus

### Phase 0 — Foundation (current)
- Project scaffold, PWA, mobile HUD
- Touch move/look/fire + gamepad
- Warehouse map with verticality
- One AR, hit feedback, range targets (not AI bots — static plates for feel)
- Menu shell: Range / Private Room (stub) / Quick Match (stub)

### Phase 1 — Real 1v1
- WebRTC P2P room codes
- Kill-race mode
- Spawn, death, scoreboard, rematch

### Phase 2 — Match product
- Timed mode + objective mode
- Accounts (auth)
- Loadout select (small weapon set)
- Quick match + region-agnostic signaling

### Phase 3 — Content & polish
- More maps/weapons/perks
- Audio/VFX pass, animation polish
- Ranking, cosmetics, store packaging

## First playable goal

On an iPad: open the app → enter **Range** → move with left stick, look with right drag, fire, hit plates on the warehouse floor and catwalk — and it already feels like a shooter worth iterating.
