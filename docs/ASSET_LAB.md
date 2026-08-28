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
5. Move to next tab: Floor → Fence → Barrel → Crate → Pallet → …
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
| 2 | Asphalt floor | Done — review anytime |
| 3 | Chain-link fence | Done — review anytime |
| 4 | Barrel | Done — review anytime |
| 5 | Crate | Done — review anytime |
| 6 | Pallet | **In progress** |
| 7 | Full map assembly | In progress |

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

## Approval checklist (fence)

- [ ] Chain-link weave reads at gameplay distance
- [ ] Posts/rails feel galvanized steel, not flat grey
- [ ] Transparency doesn't z-fight or disappear at angles
- [ ] Height/proportions match container yard perimeter
- [ ] Performance OK on iPad

## Approval checklist (barrel)

- [ ] Metal: dark drum, red bands, skull decal reads at distance
- [ ] Wood: staves, hoops, and lid feel rustic — not plastic
- [ ] Both types sit at same scale for map clusters
- [ ] Performance OK on iPad

When you say **"barrel approved"**, we integrate all lab assets into the container yard map.

## Approval checklist (crate)

- [ ] Wood reads weathered brown — not flat orange
- [ ] Plank lines and frame trim visible up close
- [ ] Size variants feel distinct (small / medium / large / long / flat)
- [ ] Stencils and hardware read at gameplay distance
- [ ] Performance OK on iPad

When you say **"crate approved"**, we add crates to the container yard map scatter.

## Approval checklist (pallet)

- [ ] Wood deck boards read weathered — not flat orange
- [ ] Runner/stringer proportions feel like a real EUR pallet
- [ ] Stacked variant sits naturally (slight offset, not perfect stack)
- [ ] Plastic variant reads industrial blue at gameplay distance
- [ ] Performance OK on iPad

When you say **"pallet approved"**, we scatter pallets into the container yard map.

## Map integration status

The container yard map (`ContainerYardMap.ts`) now uses lab procedural assets:

- [x] Asphalt floor tiles (8×8 m grid)
- [x] Chain-link fence perimeter
- [x] Shipping containers (all colors, stacks, angles)
- [x] Barrel clusters (metal + hazard variants)
- [x] Crate scatters (mixed sizes)

Still placeholder / to build later:

- [ ] Crane backdrop (simple silhouettes — upgrade or GLB)
- [ ] Tarp / cover props as lab assets
- [ ] Additional yard dressing (cones, tires, etc.)
- [ ] GLB swap path when Tripo models are dropped in
