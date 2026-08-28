/**
 * FPS weapon meshes — lab hero + in-game viewmodel source of truth.
 * Coordinates: +Z rear (stock), -Z front (muzzle), +Y up.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  barrelZ,
  boxW,
  buildPsoScope,
  flashHider,
  handguardVents,
  pumpGrooves,
  revolveZ,
  ribbedSuppressor,
  ringZ,
  triggerGuard,
  tubePath,
  ventedHeatShield,
  waffleMag,
} from './WeaponGeometry'
import {
  weaponBluedMat,
  weaponBrassMat,
  weaponGlassMat,
  weaponHeatShieldMat,
  weaponLeatherMat,
  weaponMetalMat,
  weaponPolyMat,
  weaponRubberMat,
  weaponSuppressorMat,
  weaponTapeMat,
  weaponWoodMat,
} from './WeaponTextures'

export type WeaponVariant = 'm4a1' | 'shotgun' | 'svd' | 'ak74'

export interface WeaponBuildResult {
  group: THREE.Group
  source: 'glb' | 'procedural'
  triangleCount: number
}

const GLB_PATHS: Record<WeaponVariant, string> = {
  m4a1: '/assets/weapons/m4a1.glb',
  shotgun: '/assets/weapons/shotgun.glb',
  svd: '/assets/weapons/svd.glb',
  ak74: '/assets/weapons/ak74.glb',
}

function countTriangles(root: THREE.Object3D): number {
  let n = 0
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.geometry) {
      const g = o.geometry
      if (g.index) n += g.index.count / 3
      else if (g.attributes.position) n += g.attributes.position.count / 3
    }
  })
  return Math.floor(n)
}

type Add = (mesh: THREE.Mesh) => void

function buildM4A1(add: Add): void {
  const metal = weaponMetalMat()
  const dark = weaponBluedMat()
  const poly = weaponPolyMat()

  add(boxW(0.07, 0.055, 0.2, dark, 0, 0.04, -0.02))
  add(boxW(0.065, 0.05, 0.18, metal, 0, 0.068, -0.04))
  add(boxW(0.06, 0.035, 0.16, dark, 0, 0.028, -0.03))

  add(revolveZ(
    [
      [-0.12, 0.028],
      [-0.28, 0.032],
      [-0.34, 0.028],
    ],
    14,
    dark,
  ))

  add(barrelZ(0.011, 0.011, 0.38, 12, metal, -0.36, 0.055))
  add(barrelZ(0.016, 0.014, 0.05, 10, dark, -0.56, 0.055))
  add(ringZ(0.02, 0.004, metal, -0.18, 0.055))

  add(boxW(0.055, 0.065, 0.26, poly, 0, 0.02, -0.16))
  for (let i = 0; i < 8; i++) {
    add(boxW(0.032, 0.01, 0.024, metal, 0, 0.072, -0.06 - i * 0.03))
  }

  add(boxW(0.04, 0.05, 0.12, metal, 0, 0.095, -0.04))
  add(boxW(0.004, 0.022, 0.004, metal, 0, 0.085, -0.48))
  add(boxW(0.018, 0.028, 0.012, metal, 0, 0.1, -0.02))

  add(boxW(0.042, 0.11, 0.065, poly, 0, -0.06, 0.06))
  add(boxW(0.04, 0.13, 0.075, dark, 0, -0.12, -0.02))
  add(boxW(0.05, 0.07, 0.2, poly, 0, 0.02, 0.24))
  add(barrelZ(0.013, 0.013, 0.16, 8, metal, 0.36, 0.04))

  add(triggerGuard(dark, 0.04))
  add(boxW(0.006, 0.022, 0.012, metal, 0, -0.05, 0.05))
  add(boxW(0.012, 0.008, 0.04, metal, 0.04, 0.05, -0.02))
  add(boxW(0.008, 0.012, 0.03, metal, 0, 0.05, 0.1))
}

function buildShotgun(add: Add): void {
  const metal = weaponMetalMat(1)
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(2)
  const woodDark = weaponWoodMat(3)
  const shield = weaponHeatShieldMat()

  // Receiver z: -0.11 … +0.11
  add(boxW(0.09, 0.1, 0.22, dark, 0, 0.05, 0))
  add(boxW(0.008, 0.038, 0.07, weaponPolyMat(0x0a0c10), 0.046, 0.065, 0.02))
  add(boxW(0.006, 0.028, 0.04, metal, 0.042, 0.062, 0.02))
  add(boxW(0.05, 0.008, 0.08, weaponPolyMat(0x0a0c10), 0, 0.018, 0))
  add(boxW(0.03, 0.008, 0.04, weaponPolyMat(0x1a1c20), 0, 0.1, 0.06))
  add(boxW(0.02, 0.018, 0.012, metal, 0, 0.1, 0.02))
  add(triggerGuard(dark, 0.02, 1.15))
  add(boxW(0.006, 0.024, 0.01, metal, 0, -0.02, 0.02))

  // Stock z: +0.11 … +0.58
  add(boxW(0.082, 0.11, 0.14, wood, 0, 0.05, 0.48))
  add(boxW(0.078, 0.045, 0.18, wood, 0, 0.105, 0.34))
  add(boxW(0.08, 0.085, 0.1, wood, 0, 0.045, 0.2))
  add(boxW(0.085, 0.12, 0.04, weaponRubberMat(), 0, 0.05, 0.56))
  add(boxW(0.065, 0.035, 0.14, dark, 0, 0.125, 0.3))
  for (const x of [-0.024, 0.024]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.018, 8), metal)
    knob.position.set(x, 0.14, 0.3)
    add(knob)
  }
  add(boxW(0.082, 0.04, 0.1, weaponTapeMat(), 0, 0.04, 0.46))
  add(boxW(0.05, 0.01, 0.07, weaponTapeMat(0x2a68c8), 0, 0.1, 0.18))

  // Barrels z: -0.7 … -0.06
  add(barrelZ(0.017, 0.017, 0.64, 14, metal, -0.38, 0.048))
  add(barrelZ(0.013, 0.013, 0.6, 12, dark, -0.38, 0.012))
  for (const z of [-0.06, -0.3, -0.56]) add(ringZ(0.022, 0.004, metal, z, 0.03))

  // Pump wraps tubes z: -0.28 … -0.08
  add(boxW(0.09, 0.075, 0.2, wood, 0, 0.018, -0.18))
  pumpGrooves(add, 8, -0.24, 0.022, woodDark, 0.018)
  add(barrelZ(0.008, 0.008, 0.1, 6, metal, -0.06, 0.012))
  add(barrelZ(0.008, 0.008, 0.1, 6, metal, -0.06, 0.048))

  add(ventedHeatShield(0.48, 0.038, shield, -0.34, 0.062))
  add(new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), metal).translateY(0.072).translateZ(-0.68) as THREE.Mesh)
  add(barrelZ(0.018, 0.016, 0.03, 10, metal, -0.66, 0.012))

  add(boxW(0.016, 0.075, 0.13, metal, 0.054, 0.055, 0))
  const shellColors = [0xc84838, 0xc84838, 0xd8d0c8, 0xd8d0c8]
  for (let i = 0; i < 4; i++) {
    add(boxW(0.018, 0.022, 0.048, weaponPolyMat(shellColors[i]), 0.064, 0.03 + i * 0.02, 0.02 - i * 0.026))
    add(boxW(0.02, 0.024, 0.012, weaponBrassMat(), 0.064, 0.03 + i * 0.02, 0.054 - i * 0.026))
  }
}

function buildSvd(add: Add): void {
  const metal = weaponMetalMat()
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(4)
  const poly = weaponPolyMat()
  const leather = weaponLeatherMat()

  // Thumbhole stock — layered wood
  add(boxW(0.1, 0.14, 0.34, wood, 0, 0.05, 0.4))
  add(boxW(0.09, 0.06, 0.14, wood, 0, 0.02, 0.26))
  add(boxW(0.08, 0.1, 0.12, wood, 0, -0.04, 0.24))
  add(boxW(0.088, 0.04, 0.16, leather, 0, 0.12, 0.34))
  add(boxW(0.1, 0.12, 0.02, weaponRubberMat(0x2a2420), 0, 0.05, 0.56))

  add(boxW(0.08, 0.1, 0.28, dark, 0, 0.05, 0.06))
  add(boxW(0.076, 0.012, 0.18, metal, 0, 0.1, -0.02))
  add(boxW(0.085, 0.09, 0.34, poly, 0, 0.03, -0.12))

  handguardVents(add, 3, -0.04, 0.1, weaponPolyMat(0x0e1014))
  for (let i = 0; i < 5; i++) {
    add(boxW(0.07, 0.01, 0.018, weaponPolyMat(0x222830), 0, -0.02, -0.24 + i * 0.06))
  }
  for (let i = 0; i < 4; i++) {
    add(boxW(0.006, 0.04, 0.02, weaponPolyMat(0x1a1e22), 0, -0.01, -0.22 + i * 0.07))
  }

  add(barrelZ(0.01, 0.01, 0.7, 12, metal, -0.48, 0.052))
  add(boxW(0.03, 0.025, 0.04, metal, 0, 0.06, -0.28))
  add(boxW(0.012, 0.028, 0.008, metal, 0, 0.075, -0.72))
  add(boxW(0.018, 0.012, 0.012, metal, 0, 0.083, -0.72))
  flashHider(add, dark, -0.86, 0.052)

  add(boxW(0.045, 0.1, 0.12, metal, 0, -0.08, 0.05))
  for (let i = 0; i < 3; i++) {
    add(boxW(0.046, 0.008, 0.02, weaponMetalMat(1), 0, -0.06 + i * 0.028, 0.06))
  }

  add(boxW(0.03, 0.006, 0.05, metal, -0.042, 0.06, 0.06))
  add(boxW(0.008, 0.02, 0.06, metal, 0.042, 0.085, -0.04))
  add(triggerGuard(dark, 0.05, 1.1))
  add(boxW(0.006, 0.022, 0.01, metal, 0, -0.04, 0.05))

  buildPsoScope(add, { body: dark, metal, rubber: weaponRubberMat(), glass: weaponGlassMat() })
}

function buildAk74(add: Add): void {
  const dark = weaponBluedMat()
  const metal = weaponMetalMat()
  const poly = weaponPolyMat()

  add(boxW(0.08, 0.1, 0.26, dark, 0, 0.05, 0))
  add(boxW(0.008, 0.032, 0.06, weaponPolyMat(0x0a0c10), 0.04, 0.065, 0))
  add(boxW(0.01, 0.018, 0.05, metal, 0.04, 0.085, -0.02))

  add(boxW(0.085, 0.085, 0.22, poly, 0, 0.03, -0.14))
  handguardVents(add, 2, -0.1, 0.08, weaponPolyMat(0x0e1014))
  add(boxW(0.035, 0.028, 0.048, poly, 0.04, 0.07, -0.08))

  add(boxW(0.044, 0.1, 0.1, poly, 0, -0.08, -0.1))
  add(boxW(0.05, 0.12, 0.1, metal, 0, -0.1, 0.02))
  for (let i = 0; i < 3; i++) {
    add(boxW(0.051, 0.006, 0.02, weaponMetalMat(1), 0, -0.06 + i * 0.03, 0.03))
  }
  waffleMag(add, weaponPolyMat(0x1e2428), 1, 0.03, -0.1)
  waffleMag(add, weaponPolyMat(0x1e2428), -1, 0.03, -0.1)

  ribbedSuppressor(
    add,
    { body: weaponSuppressorMat(), rib: dark, heat: weaponSuppressorMat(true) },
    -0.42,
    0.048,
    0.44,
    0.038,
    18,
  )
  add(ringZ(0.042, 0.006, metal, -0.18, 0.048))

  add(boxW(0.042, 0.11, 0.065, poly, 0, -0.06, 0.08))
  add(triggerGuard(dark, 0.04, 1.05))
  add(boxW(0.006, 0.02, 0.01, metal, 0, -0.04, 0.05))

  // Skeleton stock — tubes bolted to receiver at z=0.06
  add(tubePath([new THREE.Vector3(0, 0.1, 0.11), new THREE.Vector3(0, 0.1, 0.22), new THREE.Vector3(0, 0.08, 0.42)], 0.012, metal))
  add(tubePath([new THREE.Vector3(0, 0.04, 0.11), new THREE.Vector3(0, 0.03, 0.22), new THREE.Vector3(0, 0.02, 0.42)], 0.01, metal))
  for (const z of [0.26, 0.34]) {
    add(tubePath([new THREE.Vector3(0, 0.03, z), new THREE.Vector3(0, 0.1, z)], 0.008, metal))
  }
  add(boxW(0.048, 0.05, 0.1, poly, 0, 0.12, 0.3))
  add(boxW(0.058, 0.1, 0.04, weaponRubberMat(), 0, 0.05, 0.42))

  add(boxW(0.02, 0.04, 0.08, metal, 0.05, 0.13, 0.06))
  add(boxW(0.04, 0.03, 0.07, metal, 0.05, 0.15, 0.06))
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), weaponGlassMat())
  lens.position.set(0.06, 0.07, -0.106)
  lens.rotation.y = Math.PI / 2
  add(lens)
}

export function buildProceduralWeapon(variant: WeaponVariant = 'm4a1'): WeaponBuildResult {
  const group = new THREE.Group()
  const add: Add = (mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  switch (variant) {
    case 'shotgun':
      buildShotgun(add)
      break
    case 'svd':
      buildSvd(add)
      break
    case 'ak74':
      buildAk74(add)
      break
    default:
      buildM4A1(add)
  }

  const box = new THREE.Box3().setFromObject(group)
  group.position.set(-box.getCenter(new THREE.Vector3()).x, -box.min.y, -box.getCenter(new THREE.Vector3()).z)

  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export function buildViewModelGroup(variant: WeaponVariant = 'm4a1'): THREE.Group {
  const { group } = buildProceduralWeapon(variant)
  const vm = group.clone(true)
  vm.scale.setScalar(1.05)
  vm.rotation.set(0.02, 0, 0)
  vm.position.set(0.14, -0.15, -0.08)
  return vm
}

export async function buildWeapon(variant: WeaponVariant = 'm4a1'): Promise<WeaponBuildResult> {
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(GLB_PATHS[variant])
    const model = gltf.scene.clone()
    model.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const scale = 1 / Math.max(size.x, size.y, size.z, 0.01)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    model.position.y -= box.min.y
    const group = new THREE.Group()
    group.add(model)
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralWeapon(variant)
  }
}
