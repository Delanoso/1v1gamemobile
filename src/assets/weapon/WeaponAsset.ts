/**
 * FPS weapon meshes — lab hero + in-game viewmodel.
 * +Z rear, -Z front. All parts share edge junctions on the receiver hub.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { assembleExplodedParts } from '../glb/GlbModelLoader'
import { buildCodGhostsWeapon, COD_WEAPON_BY_VARIANT } from './CodGhostsWeaponPack'
import { buildImportedWeapon, IMPORTED_WEAPONS } from './ImportedWeaponPack'
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
  vm.position.set(0, 0, 0)
  vm.rotation.set(0, 0, 0)
  vm.scale.setScalar(1.05)
  seatFpsViewmodelMesh(vm)
  return vm
}

/** Hip pose used by ViewModel — exported for rig validation before GLB swap. */
export const VIEWMODEL_HIP = {
  position: new THREE.Vector3(0.11, -0.18, -0.06),
  rotation: new THREE.Euler(0.11, 0.18, -0.03, 'YXZ'),
}

/** ADS pose — barrel level with camera forward, optic at crosshair. */
export const VIEWMODEL_ADS = {
  position: new THREE.Vector3(0, -0.045, -0.12),
  rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
}

function meshUsesMaterial(mesh: THREE.Mesh, names: string[]): boolean {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return mats.some((mat) => names.includes(mat.name))
}

function collectSightMeshes(rig: THREE.Object3D): THREE.Mesh[] {
  const glass: THREE.Mesh[] = []
  const holo: THREE.Mesh[] = []
  rig.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    if (meshUsesMaterial(o, ['glass'])) glass.push(o)
    else if (meshUsesMaterial(o, ['holo'])) holo.push(o)
  })
  return glass.length > 0 ? glass : holo
}

/** Red-dot glass center in rig local space. */
export function getSightLocalAimPoint(rig: THREE.Object3D, out: THREE.Vector3): boolean {
  rig.updateMatrixWorld(true)
  const meshes = collectSightMeshes(rig)
  if (meshes.length === 0) return false

  const box = new THREE.Box3()
  for (const mesh of meshes) box.expandByObject(mesh)
  box.getCenter(out)
  rig.worldToLocal(out)
  return true
}

/** Holo housing bounds in rig local space (for HUD frame sizing). */
export function getSightLocalBox(rig: THREE.Object3D, out: THREE.Box3): boolean {
  rig.updateMatrixWorld(true)
  const meshes = collectSightMeshes(rig)
  if (meshes.length === 0) return false

  out.makeEmpty()
  const worldBox = new THREE.Box3()
  const corner = new THREE.Vector3()
  for (const mesh of meshes) {
    worldBox.setFromObject(mesh)
    const { min, max } = worldBox
    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) {
          corner.set(x, y, z)
          rig.worldToLocal(corner)
          out.expandByPoint(corner)
        }
      }
    }
  }
  return true
}

/** Shift model so holo / red-dot glass aligns with group origin for ADS. */
export function computeAdsAimOffset(rig: THREE.Object3D): THREE.Vector3 {
  const aim = new THREE.Vector3()
  if (getSightLocalAimPoint(rig, aim)) return aim.multiplyScalar(-1)

  rig.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(rig)
  const size = box.getSize(new THREE.Vector3())
  aim.set(
    (box.min.x + box.max.x) * 0.5,
    box.min.y + size.y * 0.86,
    box.min.z + size.z * 0.24,
  )
  return aim.multiplyScalar(-1)
}

/** MW2022 export: barrel +Z. Single proven FPS hold rotation (no auto-pick). */
const FPS_VIEW_ROTATION = new THREE.Euler(0.08, Math.PI, -0.25, 'YXZ')

/** Seat a mesh so stock is near origin and muzzle extends into -Z (camera forward). */
function seatFpsViewmodelMesh(root: THREE.Object3D): void {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  root.position.set(
    -box.getCenter(new THREE.Vector3()).x,
    -box.min.y,
    -box.max.z,
  )
}

/** Seat weapon rig so stock is near origin and muzzle extends into -Z (in front of camera). */
function seatFpsViewmodelRig(mount: THREE.Group, orient: THREE.Object3D): void {
  mount.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(mount)
  orient.position.set(
    -box.getCenter(new THREE.Vector3()).x,
    -box.min.y,
    -box.max.z,
  )
}

function measureViewmodelRig(rig: THREE.Object3D): {
  box: THREE.Box3
  size: THREE.Vector3
  depth: number
  width: number
} {
  rig.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(rig)
  const size = box.getSize(new THREE.Vector3())
  return {
    box,
    size,
    depth: box.max.z - box.min.z,
    width: Math.max(size.x, size.y),
  }
}

/** Reject end-on / vertical / behind-camera rigs. */
export function isViewmodelVisible(rig: THREE.Object3D): boolean {
  const { box, size, depth, width } = measureViewmodelRig(rig)
  if (box.isEmpty()) return false

  // Barrel must run along camera -Z (depth), not vertical or end-on.
  if (size.z < size.x * 1.15 || size.z < size.y * 1.15) return false
  if (width < 0.08) return false

  return box.min.z < -0.25 && box.max.z < 0.04 && depth > 0.3
}

/** Validate rig at the in-game hip pose (lower-right, not end-on). */
export function isViewmodelVisibleAtHip(rig: THREE.Object3D): boolean {
  if (!isViewmodelVisible(rig)) return false

  const posed = new THREE.Group()
  posed.rotation.order = 'YXZ'
  posed.position.copy(VIEWMODEL_HIP.position)
  posed.rotation.copy(VIEWMODEL_HIP.rotation)
  posed.add(rig.clone(true))
  posed.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(posed)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())

  return (
    center.x > 0.06 &&
    center.y < -0.06 &&
    box.min.z < -0.2 &&
    box.max.z < 0.08 &&
    size.z >= Math.max(size.x, size.y) * 0.9
  )
}

function buildFpsViewmodelRig(gun: THREE.Object3D): THREE.Group {
  const mount = new THREE.Group()
  const orient = new THREE.Group()
  orient.rotation.order = 'YXZ'
  orient.rotation.copy(FPS_VIEW_ROTATION)
  orient.add(gun)
  mount.add(orient)
  seatFpsViewmodelRig(mount, orient)
  return mount
}

/** MW2022 raw export: barrel +Z. Rig for FPS — geometry only, pose handled by ViewModel. */
export async function buildImportedViewModel(): Promise<THREE.Group> {
  const entry = IMPORTED_WEAPONS.find((w) => w.id === 'm4-tan')
  if (!entry) throw new Error('Unknown imported weapon: m4-tan')

  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(entry.path)
  const gun = gltf.scene.clone()
  gun.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
      o.frustumCulled = false
      o.renderOrder = 10
    }
  })

  gun.updateMatrixWorld(true)
  const rawBox = new THREE.Box3().setFromObject(gun)
  const rawSize = rawBox.getSize(new THREE.Vector3())
  gun.position.sub(rawBox.getCenter(new THREE.Vector3()))
  gun.scale.setScalar(0.48 / Math.max(rawSize.x, rawSize.y, rawSize.z, 0.01))

  const assembled = new THREE.Group()
  assembled.add(gun)
  assembleExplodedParts(assembled)

  return buildFpsViewmodelRig(gun)
}

const VIEWMODEL_CACHE_VERSION = 11
let m4ViewModelCache: Promise<THREE.Group> | null = null
let m4ViewModelCacheVersion = 0

/** Start loading the M4 viewmodel early (menu screen). */
export function preloadM4ViewModel(): Promise<THREE.Group> {
  if (!m4ViewModelCache || m4ViewModelCacheVersion !== VIEWMODEL_CACHE_VERSION) {
    m4ViewModelCacheVersion = VIEWMODEL_CACHE_VERSION
    m4ViewModelCache = buildImportedViewModel()
  }
  return m4ViewModelCache.then((rig) => rig.clone(true))
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
