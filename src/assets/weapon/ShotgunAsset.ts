/**
 * Pump shotgun — procedural hero mesh for Asset Lab.
 * Layout: receiver hub z ∈ [-0.11, 0.11], stock +Z, barrels −Z.
 */
import * as THREE from 'three'
import { barrelZ, boxW, ringZ, triggerGuard, ventedHeatShield } from './WeaponGeometry'
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
  const woodGroove = weaponWoodMat(3)
  const shieldMat = weaponHeatShieldMat()

  // ── Receiver ──────────────────────────────────────────────────────────────
  add(boxW(0.092, 0.102, 0.22, dark, 0, 0.052, 0))
  add(boxW(0.088, 0.018, 0.2, metal, 0, 0.102, 0))
  add(boxW(0.07, 0.012, 0.16, metal, 0, 0.112, -0.02))

  // Ejection port (right +X)
  add(boxW(0.01, 0.04, 0.072, weaponPolyMat(0x0c0e12), 0.048, 0.062, 0.01))
  add(boxW(0.008, 0.03, 0.038, metal, 0.044, 0.06, 0.01))

  // Loading port (bottom)
  add(boxW(0.052, 0.01, 0.078, weaponPolyMat(0x0c0e12), 0, 0.008, 0))
  add(boxW(0.044, 0.006, 0.06, metal, 0, 0.012, 0))

  // Tang safety
  add(boxW(0.032, 0.01, 0.038, weaponPolyMat(0x1a1c20), 0, 0.108, 0.08))

  add(triggerGuard(dark, 0.02, 1.18))
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.024, 0.012), metal)
  trigger.position.set(0, -0.018, 0.02)
  add(trigger)

  // Rear sight
  add(boxW(0.022, 0.022, 0.014, metal, 0, 0.112, 0.04))

  // ── Stock (wood, z 0.11 → 0.58) ─────────────────────────────────────────
  add(boxW(0.084, 0.105, 0.12, wood, 0, 0.052, 0.52))
  add(boxW(0.08, 0.048, 0.17, wood, 0, 0.108, 0.36))
  add(boxW(0.082, 0.088, 0.1, wood, 0, 0.048, 0.22))
  add(boxW(0.086, 0.118, 0.038, weaponRubberMat(), 0, 0.052, 0.598))

  // Cheek riser
  add(boxW(0.068, 0.036, 0.13, dark, 0, 0.128, 0.32))
  for (const x of [-0.026, 0.026]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 10), metal)
    knob.position.set(x, 0.148, 0.32)
    add(knob)
  }
  for (const z of [0.28, 0.32, 0.36]) {
    add(boxW(0.004, 0.022, 0.012, weaponPolyMat(0x14181c), 0.036, 0.12, z))
  }

  // Duct tape + blue tape
  add(boxW(0.086, 0.042, 0.09, weaponTapeMat(), 0, 0.048, 0.46))
  add(boxW(0.048, 0.012, 0.065, weaponTapeMat(0x2e6ec8), 0, 0.1, 0.17))

  // Sling swivel (stock)
  add(ringZ(0.008, 0.003, metal, 0.5, 0.01))

  // ── Barrels (z −0.11 → −0.72) ─────────────────────────────────────────
  add(barrelZ(0.018, 0.018, 0.62, 16, metal, -0.36, 0.05))
  add(barrelZ(0.014, 0.014, 0.58, 14, dark, -0.36, 0.014))

  for (const z of [-0.06, -0.28, -0.5, -0.66]) {
    add(ringZ(0.024, 0.0045, metal, z, 0.032))
  }

  // Magazine tube cap
  add(barrelZ(0.016, 0.014, 0.028, 10, metal, -0.66, 0.014))

  // Perforated heat shield
  add(ventedHeatShield(0.48, 0.04, shieldMat, -0.34, 0.068))
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 7; i++) {
      add(boxW(0.018, 0.014, 0.034, weaponPolyMat(0x1a1e22), row === 0 ? -0.012 : 0.012, 0.092, -0.16 - i * 0.058))
    }
  }

  // Front bead + barrel band sight
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 10), metal)
  bead.position.set(0, 0.078, -0.7)
  add(bead)
  add(boxW(0.016, 0.014, 0.01, metal, 0, 0.072, -0.08))

  // Sling swivel (barrel band)
  add(ringZ(0.01, 0.003, metal, -0.58, 0.01))

  // ── Pump (wood, z −0.1 → −0.3, wraps tubes) ───────────────────────────
  add(boxW(0.092, 0.078, 0.2, wood, 0, 0.022, -0.2))
  add(boxW(0.09, 0.074, 0.196, woodGroove, 0, 0.022, -0.2))

  for (let i = 0; i < 9; i++) {
    const groove = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.0035, 4, 20), woodGroove)
    groove.rotation.y = Math.PI / 2
    groove.position.set(0, 0.022, -0.26 + i * 0.02)
    add(groove)
  }

  // Action bars (pump ↔ receiver)
  add(barrelZ(0.007, 0.007, 0.11, 6, metal, -0.055, 0.014))
  add(barrelZ(0.007, 0.007, 0.11, 6, metal, -0.055, 0.05))

  // ── Side saddle + shells (left −X) ────────────────────────────────────
  add(boxW(0.018, 0.078, 0.128, metal, -0.056, 0.058, 0))
  const hullColors = [0xc84838, 0xc84838, 0xd8d4cc, 0xd8d4cc]
  for (let i = 0; i < 4; i++) {
    const y = 0.028 + i * 0.019
    const z = 0.02 - i * 0.027
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.048, 10), weaponPolyMat(hullColors[i]))
    hull.rotation.z = Math.PI / 2
    hull.position.set(-0.068, y, z)
    add(hull)
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 10), weaponBrassMat())
    brass.rotation.z = Math.PI / 2
    brass.position.set(-0.072, y, z + 0.026)
    add(brass)
  }
}
