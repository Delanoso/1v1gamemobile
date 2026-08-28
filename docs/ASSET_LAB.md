# Asset Lab workflow

Polish **one asset at a time** before putting it in the game.

## Open the lab

Same dev server as the game:

```
npm run dev
```

Then on iPad Safari:

- **Game:** `http://<your-tunnel>/`
- **Asset Lab:** `http://<your-tunnel>/lab.html`

Or locally: `http://localhost:5173/lab.html`

## Pipeline

```
1. Open Asset Lab → Container
2. Iterate until it matches your reference (100%)
3. Export approved asset (GLB) or approve procedural version
4. Asset is used automatically in Container Yard map
5. Move to next tab: Floor → Fence → Barrel → …
```

## Drop a Tripo/Meshy model

Export **GLB** (1K textures) and save as:

```
public/assets/maps/container-yard/container.glb
```

Reload in the lab — it switches from procedural to GLB automatically.

## Order of work

| # | Asset | Status |
|---|-------|--------|
| 1 | Shipping container | Done — review anytime |
| 2 | Asphalt floor | **Active in lab** |
| 3 | Chain-link fence | Next |
| 4 | Barrel / pallet | Planned |
| 5 | Full map assembly | After props |

## Approval checklist (container)

- [ ] Silhouette reads as real container from all angles
- [ ] Corrugation + rust feels MW-realistic
- [ ] Door detail visible up close
- [ ] Performance OK on iPad (< 30k tris ideal)
- [ ] Colors: red / blue / green / tan variants

## Approval checklist (floor)

- [ ] Asphalt reads dark, wet, and industrial (MW Shipment yard)
- [ ] Parking lines visible but worn — not too clean
- [ ] Puddles catch light without looking like mirrors
- [ ] Cracks / stains feel natural, not repetitive
- [ ] Performance OK on iPad

When you say **"floor approved"**, we lock it and start the fence lab.
