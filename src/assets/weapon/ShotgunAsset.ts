/**
 * Pump shotgun — extruded stock/pump silhouettes, cylindrical barrels, vent rib.
 * +Z rear, −Z muzzle. All parts share junctions on the receiver hub (z ≈ 0).
 */
import * as THREE from 'three'
import { barrelZ, boxW, extrudeYZ, ringZ, triggerGuard } from './WeaponGeometry'
import {
  weaponBluedMat,
  weaponBrassMat,
  weaponMetalMat,
  weaponPolyMat,
  weaponRubberMat,
  weaponWoodMat,
} from './WeaponTextures'

type Add = (mesh: THREE.Mesh) => void

export function buildShotgunMeshes(add: Add): void {
  const metal = weaponMetalMat(1)
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(2)
  const woodDark = weaponWoodMat(3)
  const rubber = weaponRubberMat()

  const barrelY = 0.054
  const tubeY = 0.018
  const midY = (barrelY + tubeY) / 2

  // ── Stock (extruded side profile — comb + pistol-grip drop) ─────────────
  add(
    extrudeYZ(
      [
        [0.02, 0.014],
        [0.02, 0.084],
        [0.1, 0.088],
        [0.15, 0.05],
        [0.19, 0.036],
        [0.23, 0.04],
        [0.29, 0.074],
        [0.37, 0.114],
        [0.45, 0.11],
        [0.53, 0.098],
        [0.6, 0.086],
        [0.62, 0.014],
        [0.54, 0.008],
        [0.36, 0.006],
        [0.16, 0.008],
      ],
      0.074,
      wood,
    ),
  )

  add(boxW(0.074, 0.088, 0.012, rubber, 0, 0.047, 0.626))

  // ── Receiver (metal hub, overlaps stock at z > 0) ────────────────────────
  add(boxW(0.09, 0.102, 0.2, dark, 0, 0.051, -0.03))
  add(boxW(0.084, 0.012, 0.18, metal, 0, 0.1, -0.03))
  add(boxW(0.086, 0.008, 0.17, metal, 0, 0.008, -0.03))

  // Ejection port (inset panel, flush on right wall)
  add(boxW(0.004, 0.038, 0.072, weaponPolyMat(0x14181c), 0.045, 0.058, -0.05))

  // Bolt housing
  add(boxW(0.032, 0.02, 0.048, metal, 0, 0.106, 0))
  add(boxW(0.026, 0.014, 0.034, dark, 0, 0.102, 0))

  add(triggerGuard(dark, -0.04, 1.08))
  add(boxW(0.005, 0.016, 0.007, metal, 0, -0.017, -0.04))

  add(ringZ(0.027, 0.005, metal, -0.11, midY))

  // ── Twin barrels ─────────────────────────────────────────────────────────
  add(barrelZ(0.018, 0.018, 0.62, 24, metal, -0.4, barrelY))
  add(barrelZ(0.0135, 0.0135, 0.58, 22, dark, -0.38, tubeY))
  add(barrelZ(0.015, 0.013, 0.024, 10, metal, -0.66, tubeY))

  for (const z of [-0.14, -0.3, -0.48, -0.62]) {
    add(ringZ(0.025, 0.0035, metal, z, midY))
  }

  // Vent rib (single strip — slot boxes read as floaters from side angles)
  add(boxW(0.008, 0.005, 0.54, metal, 0, barrelY + 0.022, -0.34))

  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), metal)
  bead.position.set(0, barrelY + 0.026, -0.68)
  add(bead)

  // ── Pump forend (wraps barrels, overlaps receiver front) ─────────────────
  add(
    extrudeYZ(
      [
        [-0.02, tubeY - 0.008],
        [-0.02, barrelY + 0.018],
        [-0.28, barrelY + 0.024],
        [-0.34, barrelY + 0.018],
        [-0.34, tubeY - 0.008],
      ],
      0.088,
      wood,
    ),
  )

  add(barrelZ(0.005, 0.005, 0.11, 6, metal, -0.04, tubeY - 0.014))
  add(barrelZ(0.005, 0.005, 0.11, 6, metal, -0.04, barrelY - 0.014))

  for (let i = 0; i < 11; i++) {
    const g = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.003, 4, 20), woodDark)
    g.position.set(0, midY - 0.012, -0.14 - i * 0.017)
    add(g)
  }

  // ── Side saddle (flush on left receiver wall) ────────────────────────────
  add(boxW(0.006, 0.058, 0.096, metal, -0.047, 0.054, -0.03))
  const hullColors = [0xc84838, 0xc84838, 0xd8d4cc, 0xd8d4cc]
  for (let i = 0; i < 4; i++) {
    const y = 0.028 + i * 0.014
    const z = -0.02 - i * 0.019
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.034, 10), weaponPolyMat(hullColors[i]))
    hull.rotation.z = Math.PI / 2
    hull.position.set(-0.05, y, z)
    add(hull)
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.007, 8), weaponBrassMat())
    brass.rotation.z = Math.PI / 2
    brass.position.set(-0.052, y, z + 0.016)
    add(brass)
  }
}
