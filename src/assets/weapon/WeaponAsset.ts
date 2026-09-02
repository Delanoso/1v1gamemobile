/**
 * FPS weapon meshes — lab hero + in-game viewmodel.
 * +Z rear, -Z front. All parts share edge junctions on the receiver hub.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { buildCodGhostsWeapon, COD_WEAPON_BY_VARIANT } from './CodGhostsWeaponPack'
import { buildImportedWeapon } from './ImportedWeaponPack'
import { barrelZ, boxW, ringZ } from './WeaponGeometry'
import { buildShotgunMeshes } from './ShotgunAsset'
import {
  weaponBluedMat,
  weaponLeatherMat,
  weaponMetalMat,
  weaponPolyMat,
  weaponRubberMat,
  weaponSuppressorMat,
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

/** M4A1 — receiver hub at z=0, depth 0.24. */
function buildM4A1(add: Add): void {
  const metal = weaponMetalMat()
  const dark = weaponBluedMat()
  const poly = weaponPolyMat()

  add(boxW(0.07, 0.09, 0.24, dark, 0, 0.04, 0))
  add(boxW(0.055, 0.065, 0.26, poly, 0, 0.02, -0.14))
  add(barrelZ(0.012, 0.012, 0.38, 12, metal, -0.32, 0.05))
  add(barrelZ(0.017, 0.015, 0.05, 10, dark, -0.53, 0.05))
  add(boxW(0.05, 0.065, 0.18, poly, 0, 0.035, 0.21))
  add(barrelZ(0.014, 0.014, 0.14, 8, metal, 0.19, 0.04))
  add(boxW(0.042, 0.1, 0.06, poly, 0, -0.055, 0.06))
  add(boxW(0.038, 0.12, 0.07, dark, 0, -0.1, -0.02))
  add(boxW(0.04, 0.05, 0.1, metal, 0, 0.09, -0.02))
  for (let i = 0; i < 6; i++) {
    add(boxW(0.032, 0.01, 0.022, metal, 0, 0.072, -0.06 - i * 0.028))
  }
  add(boxW(0.004, 0.02, 0.004, metal, 0, 0.08, -0.44))
}

/** Shotgun — see ShotgunAsset.ts */
function buildShotgun(add: Add): void {
  buildShotgunMeshes(add)
}

/** SVD DMR — receiver hub at z=0.06, depth 0.28. */
function buildSvd(add: Add): void {
  const metal = weaponMetalMat()
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(4)
  const poly = weaponPolyMat()
  const leather = weaponLeatherMat()

  add(boxW(0.08, 0.1, 0.28, dark, 0, 0.05, 0.06))
  add(boxW(0.1, 0.14, 0.32, wood, 0, 0.05, 0.38))
  add(boxW(0.08, 0.1, 0.12, wood, 0, -0.04, 0.26))
  add(boxW(0.088, 0.04, 0.14, leather, 0, 0.12, 0.34))
  add(boxW(0.1, 0.12, 0.02, weaponRubberMat(0x2a2420), 0, 0.05, 0.54))

  add(boxW(0.085, 0.09, 0.34, poly, 0, 0.03, -0.12))
  for (let i = 0; i < 3; i++) {
    for (const x of [-0.044, 0.044]) {
      add(boxW(0.006, 0.048, 0.068, weaponPolyMat(0x1a1e22), x, 0.03, -0.04 - i * 0.1))
    }
  }

  add(barrelZ(0.011, 0.011, 0.7, 12, metal, -0.46, 0.05))
  add(barrelZ(0.016, 0.014, 0.07, 10, dark, -0.84, 0.05))
  add(boxW(0.045, 0.1, 0.11, metal, 0, -0.08, 0.1))
  for (let i = 0; i < 3; i++) {
    add(boxW(0.046, 0.007, 0.018, weaponMetalMat(1), 0, -0.06 + i * 0.026, 0.1))
  }

  add(boxW(0.03, 0.05, 0.1, metal, 0.056, 0.08, 0.08))
  add(boxW(0.26, 0.044, 0.044, dark, 0.2, 0.1, 0.08))
  add(boxW(0.05, 0.05, 0.05, dark, 0.34, 0.1, 0.08))
  add(boxW(0.04, 0.04, 0.04, weaponRubberMat(), 0.08, 0.1, 0.08))
}

/** AK-74 tactical — receiver hub at z=0.04. */
function buildAk74(add: Add): void {
  const dark = weaponBluedMat()
  const metal = weaponMetalMat()
  const poly = weaponPolyMat()
  const suppressor = weaponSuppressorMat()
  const heat = weaponSuppressorMat(true)

  add(boxW(0.08, 0.1, 0.26, dark, 0, 0.05, 0.04))
  add(boxW(0.085, 0.085, 0.22, poly, 0, 0.03, -0.14))
  add(boxW(0.044, 0.1, 0.06, poly, 0, -0.08, -0.1))
  add(boxW(0.05, 0.12, 0.1, metal, 0, -0.1, 0.04))

  add(barrelZ(0.038, 0.038, 0.42, 14, suppressor, -0.4, 0.048))
  add(barrelZ(0.034, 0.038, 0.08, 12, heat, -0.64, 0.048))
  for (let i = 0; i < 14; i++) {
    add(ringZ(0.039, 0.002, dark, -0.2 - i * 0.028, 0.048))
  }

  add(boxW(0.042, 0.1, 0.06, poly, 0, -0.055, 0.1))
  add(boxW(0.03, 0.04, 0.18, metal, 0, 0.1, 0.24))
  add(boxW(0.03, 0.035, 0.18, metal, 0, 0.035, 0.24))
  add(boxW(0.02, 0.065, 0.02, metal, 0, 0.068, 0.3))
  add(boxW(0.02, 0.065, 0.02, metal, 0, 0.032, 0.3))
  add(boxW(0.048, 0.05, 0.1, poly, 0, 0.12, 0.3))
  add(boxW(0.058, 0.1, 0.04, weaponRubberMat(), 0, 0.05, 0.42))

  add(boxW(0.02, 0.04, 0.07, metal, 0.05, 0.13, 0.08))
  add(boxW(0.038, 0.028, 0.05, poly, 0.04, 0.07, -0.08))
  add(boxW(0.04, 0.03, 0.06, metal, 0.05, 0.15, 0.08))
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

/** Lay a horizontal imported weapon along camera forward (-Z) for first-person view. */
export function orientImportedViewModel(source: THREE.Group): THREE.Group {
  const vm = source.clone(true)
  vm.rotation.set(0, 0, 0)
  vm.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(vm)
  const size = box.getSize(new THREE.Vector3())
  const forward = new THREE.Vector3(0, 0, -1)

  const axes = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
  ]
  const lengths = [size.x, size.y, size.z]
  const longIdx = lengths.indexOf(Math.max(...lengths))
  const longAxis = axes[longIdx]

  vm.quaternion.setFromUnitVectors(longAxis, forward)
  vm.rotateX(0.02)
  vm.updateMatrixWorld(true)

  const targetLength = 0.42
  const length = Math.max(...lengths)
  vm.scale.setScalar(targetLength / Math.max(length, 0.01))

  vm.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(vm)
  vm.position.set(
    0.14 - bounds.min.x,
    -0.15 - bounds.min.y,
    -0.08 - bounds.max.z,
  )
  return vm
}

export async function buildImportedViewModel(): Promise<THREE.Group> {
  const { group } = await buildImportedWeapon('m4-tan')
  return orientImportedViewModel(group)
}

export async function buildWeapon(variant: WeaponVariant = 'm4a1'): Promise<WeaponBuildResult> {
  if (variant === 'm4a1') {
    try {
      const imported = await buildImportedWeapon('m4-tan')
      return { group: imported.group, source: 'glb', triangleCount: imported.triangleCount }
    } catch {
      /* fall through to COD pack / procedural */
    }
  }

  try {
    const cod = await buildCodGhostsWeapon(COD_WEAPON_BY_VARIANT[variant])
    const group = new THREE.Group()
    group.add(cod.group)
    return { group, source: 'glb', triangleCount: cod.triangleCount }
  } catch {
    /* fall through to per-weapon GLB or procedural */
  }

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
