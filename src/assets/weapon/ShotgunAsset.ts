/**
 * Pump shotgun — lathe-based silhouette (not box stacks).
 * +Z rear, −Z front. Receiver z ∈ [−0.11, 0.11].
 */
import * as THREE from 'three'
import { barrelZ, boxW, revolveZ, ringZ, triggerGuard } from './WeaponGeometry'
import {
  weaponBluedMat,
  weaponBrassMat,
  weaponHeatShieldMat,
  weaponMetalMat,
  weaponPolyMat,
  weaponRubberMat,
  weaponTapeMat,
  weaponWoodMat,
} from './WeaponTextures'

type Add = (mesh: THREE.Mesh) => void

/** Single lathe body from a [z, radius] profile. */
function body(profile: ReadonlyArray<readonly [number, number]>, segs: number, mat: THREE.Material, add: Add): void {
  add(revolveZ(profile, segs, mat))
}

export function buildShotgunMeshes(add: Add): void {
  const metal = weaponMetalMat(1)
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(2)
  const woodDark = weaponWoodMat(3)
  const shield = weaponHeatShieldMat()

  // ── Receiver (lathe bulk, merges into stock + barrels) ───────────────────
  body(
    [
      [-0.11, 0.036],
      [-0.04, 0.048],
      [0.04, 0.05],
      [0.11, 0.044],
    ],
    24,
    dark,
    add,
  )

  // Top cover / rail
  const cover = revolveZ(
    [
      [-0.1, 0.012],
      [0.1, 0.014],
    ],
    12,
    metal,
  )
  cover.position.y = 0.048
  add(cover)

  // Barrel cluster collar at receiver front
  add(ringZ(0.028, 0.007, metal, -0.11, 0.032))

  // Ejection port (+X)
  add(boxW(0.012, 0.036, 0.068, weaponPolyMat(0x0a0c10), 0.05, 0.058, 0.01))
  add(boxW(0.008, 0.028, 0.036, metal, 0.046, 0.056, 0.01))

  add(boxW(0.05, 0.01, 0.074, weaponPolyMat(0x0a0c10), 0, 0.012, 0))
  add(triggerGuard(dark, 0.02, 1.2))
  add(boxW(0.007, 0.022, 0.012, metal, 0, -0.02, 0.02))
  add(boxW(0.03, 0.01, 0.036, weaponPolyMat(0x1a1c20), 0, 0.108, 0.07))
  add(boxW(0.02, 0.02, 0.012, metal, 0, 0.1, 0.04))

  // ── Stock (one wood lathe — comb + wrist + butt) ─────────────────────────
  body(
    [
      [0.11, 0.044],
      [0.17, 0.046],
      [0.24, 0.042],
      [0.3, 0.048],
      [0.38, 0.054],
      [0.46, 0.05],
      [0.54, 0.044],
      [0.6, 0.038],
    ],
    28,
    wood,
    add,
  )

  // Rubber buttpad (lathe cap)
  body(
    [
      [0.6, 0.038],
      [0.64, 0.042],
    ],
    16,
    weaponRubberMat(),
    add,
  )

  // Cheek riser (left side sits on comb)
  add(boxW(0.055, 0.032, 0.12, dark, -0.02, 0.1, 0.32))
  for (const x of [-0.042, -0.002]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.018, 10), metal)
    knob.position.set(x, 0.118, 0.32)
    add(knob)
  }

  add(boxW(0.08, 0.038, 0.085, weaponTapeMat(), 0, 0.042, 0.48))
  add(boxW(0.045, 0.01, 0.06, weaponTapeMat(0x2e6ec8), 0, 0.095, 0.17))

  // ── Twin barrels (shared axis, flush to receiver) ────────────────────────
  const barrelY = 0.048
  const tubeY = 0.014
  add(barrelZ(0.017, 0.017, 0.6, 20, metal, -0.36, barrelY))
  add(barrelZ(0.013, 0.013, 0.56, 18, dark, -0.36, tubeY))

  for (const z of [-0.1, -0.28, -0.46, -0.62]) {
    add(ringZ(0.023, 0.004, metal, z, (barrelY + tubeY) / 2))
  }
  add(barrelZ(0.015, 0.013, 0.026, 10, metal, -0.64, tubeY))

  // Heat shield — flat vented channel ON TOP of barrel only
  const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.022, 0.46), shield)
  shieldMesh.position.set(0, barrelY + 0.022, -0.34)
  add(shieldMesh)

  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 7; i++) {
      add(
        boxW(
          0.016,
          0.012,
          0.028,
          weaponPolyMat(0x1a1e22),
          row === 0 ? -0.01 : 0.01,
          barrelY + 0.028,
          -0.16 - i * 0.055,
        ),
      )
    }
  }

  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), metal)
  bead.position.set(0, barrelY + 0.018, -0.68)
  add(bead)

  // ── Pump (wood lathe + grip rings) ───────────────────────────────────────
  body(
    [
      [-0.1, 0.046],
      [-0.18, 0.05],
      [-0.28, 0.048],
      [-0.34, 0.044],
    ],
    24,
    wood,
    add,
  )

  for (let i = 0; i < 10; i++) {
    const g = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.003, 4, 24), woodDark)
    g.rotation.y = Math.PI / 2
    g.position.set(0, (barrelY + tubeY) / 2, -0.22 - i * 0.018)
    add(g)
  }

  add(barrelZ(0.006, 0.006, 0.1, 6, metal, -0.055, tubeY))
  add(barrelZ(0.006, 0.006, 0.1, 6, metal, -0.055, barrelY))

  // ── Side saddle (−X) ─────────────────────────────────────────────────────
  add(boxW(0.014, 0.072, 0.12, metal, -0.054, 0.056, 0))
  const hullColors = [0xc84838, 0xc84838, 0xd8d4cc, 0xd8d4cc]
  for (let i = 0; i < 4; i++) {
    const y = 0.03 + i * 0.017
    const z = 0.015 - i * 0.025
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.044, 12), weaponPolyMat(hullColors[i]))
    hull.rotation.z = Math.PI / 2
    hull.position.set(-0.066, y, z)
    add(hull)
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.01, 10), weaponBrassMat())
    brass.rotation.z = Math.PI / 2
    brass.position.set(-0.07, y, z + 0.024)
    add(brass)
  }
}
