/**
 * Pump shotgun — extruded stock/pump silhouettes + cylindrical barrels.
 * Side profile extrusion gives a real comb (not a symmetric lathe "bat").
 */
import * as THREE from 'three'
import { barrelZ, boxW, extrudeYZ, ringZ, triggerGuard } from './WeaponGeometry'
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

export function buildShotgunMeshes(add: Add): void {
  const metal = weaponMetalMat(1)
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(2)
  const woodDark = weaponWoodMat(3)
  const shield = weaponHeatShieldMat()

  const barrelY = 0.052
  const tubeY = 0.016
  const midY = (barrelY + tubeY) / 2

  // ── Stock (extruded side profile — comb on top only) ─────────────────────
  add(
    extrudeYZ(
      [
        [0.1, 0.008],
        [0.1, 0.088],
        [0.22, 0.1],
        [0.34, 0.128],
        [0.48, 0.118],
        [0.58, 0.1],
        [0.62, 0.088],
        [0.62, 0.008],
      ],
      0.078,
      wood,
    ),
  )

  add(boxW(0.08, 0.1, 0.032, weaponRubberMat(), 0, 0.048, 0.636))
  add(boxW(0.058, 0.03, 0.11, dark, -0.01, 0.118, 0.32))
  for (const x of [-0.038, 0.002]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.016, 10), metal)
    knob.position.set(x, 0.136, 0.32)
    add(knob)
  }
  add(boxW(0.078, 0.035, 0.08, weaponTapeMat(), 0, 0.04, 0.46))
  add(boxW(0.042, 0.01, 0.055, weaponTapeMat(0x2e6ec8), 0, 0.1, 0.16))

  // ── Receiver ─────────────────────────────────────────────────────────────
  add(boxW(0.09, 0.098, 0.2, dark, 0, 0.052, 0))
  add(boxW(0.084, 0.016, 0.18, metal, 0, 0.1, -0.01))

  add(boxW(0.01, 0.034, 0.064, weaponPolyMat(0x0a0c10), 0.048, 0.062, 0.01))
  add(boxW(0.048, 0.01, 0.07, weaponPolyMat(0x0a0c10), 0, 0.01, 0))
  add(triggerGuard(dark, 0.02, 1.15))
  add(boxW(0.007, 0.02, 0.01, metal, 0, -0.022, 0.02))
  add(boxW(0.028, 0.01, 0.032, weaponPolyMat(0x1a1c20), 0, 0.108, 0.06))
  add(boxW(0.018, 0.018, 0.01, metal, 0, 0.1, 0.02))

  add(ringZ(0.026, 0.006, metal, -0.1, midY))

  // ── Barrels ──────────────────────────────────────────────────────────────
  add(barrelZ(0.017, 0.017, 0.58, 20, metal, -0.35, barrelY))
  add(barrelZ(0.013, 0.013, 0.54, 18, dark, -0.35, tubeY))
  for (const z of [-0.08, -0.26, -0.44, -0.58]) {
    add(ringZ(0.022, 0.0035, metal, z, midY))
  }
  add(barrelZ(0.014, 0.012, 0.024, 10, metal, -0.62, tubeY))

  const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.018, 0.44), shield)
  shieldMesh.position.set(0, barrelY + 0.018, -0.33)
  add(shieldMesh)

  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), metal)
  bead.position.set(0, barrelY + 0.014, -0.66)
  add(bead)

  // ── Pump (extruded wrap under barrels) ───────────────────────────────────
  add(
    extrudeYZ(
      [
        [-0.09, tubeY - 0.004],
        [-0.09, barrelY + 0.018],
        [-0.28, barrelY + 0.024],
        [-0.33, barrelY + 0.018],
        [-0.33, tubeY - 0.004],
      ],
      0.088,
      wood,
    ),
  )

  for (let i = 0; i < 9; i++) {
    const g = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.0028, 4, 22), woodDark)
    g.rotation.y = Math.PI / 2
    g.position.set(0, midY, -0.2 - i * 0.017)
    add(g)
  }

  add(barrelZ(0.005, 0.005, 0.09, 6, metal, -0.05, tubeY))
  add(barrelZ(0.005, 0.005, 0.09, 6, metal, -0.05, barrelY))

  // ── Side saddle (−X) ───────────────────────────────────────────────────────
  add(boxW(0.012, 0.068, 0.11, metal, -0.052, 0.058, 0))
  const hullColors = [0xc84838, 0xc84838, 0xd8d4cc, 0xd8d4cc]
  for (let i = 0; i < 4; i++) {
    const y = 0.032 + i * 0.016
    const z = 0.012 - i * 0.022
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.04, 10), weaponPolyMat(hullColors[i]))
    hull.rotation.z = Math.PI / 2
    hull.position.set(-0.062, y, z)
    add(hull)
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.009, 8), weaponBrassMat())
    brass.rotation.z = Math.PI / 2
    brass.position.set(-0.065, y, z + 0.022)
    add(brass)
  }
}
