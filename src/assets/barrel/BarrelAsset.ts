/**
 * Yard prop barrels — metal drums (dark / hazard) + wooden stave barrel.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  barrelRoughnessMap,
  biohazardDecalTexture,
  greenWasteBodyTexture,
  metalBandTexture,
  metalBodyTexture,
  radiationDecalTexture,
  rustyLidTexture,
  skullDecalTexture,
  toxicSkullDecalTexture,
  woodLidTexture,
  woodStaveTexture,
  yellowHazardBodyTexture,
  type BarrelVariant,
} from './BarrelTextures'

export const BARREL_DIMS = { radius: 0.28, height: 0.9 } as const

const GLB_PATHS: Partial<Record<BarrelVariant, string>> = {
  'metal-dark': '/assets/maps/container-yard/barrel-metal.glb',
  wood: '/assets/maps/container-yard/barrel-wood.glb',
  'metal-green': '/assets/maps/container-yard/barrel-hazard-green.glb',
  'metal-yellow': '/assets/maps/container-yard/barrel-hazard-yellow.glb',
}

export type { BarrelVariant }
/** @deprecated Use BarrelVariant */
export type BarrelType = BarrelVariant

export interface BarrelBuildResult {
  group: THREE.Group
  source: 'glb' | 'procedural'
  triangleCount: number
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

function ironHoopMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x3a4048, metalness: 0.88, roughness: 0.42 })
}

function addDecal(
  addMesh: (m: THREE.Mesh) => void,
  texture: THREE.CanvasTexture,
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
): void {
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92, metalness: 0.05 }),
  )
  decal.position.set(x, y, z)
  addMesh(decal)
}

function addMetalDrumBody(
  addMesh: (m: THREE.Mesh) => void,
  body: THREE.MeshStandardMaterial,
  ribMat: THREE.MeshStandardMaterial,
  ribYs: number[],
): void {
  const { radius: R, height: H } = BARREL_DIMS
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H * 0.88, 20), body)
  drum.position.y = H * 0.44
  addMesh(drum)
  for (const t of ribYs) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.025, 0.018, 6, 24), ribMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = H * t
    addMesh(ring)
  }
}

function addMetalDarkBarrel(addMesh: (m: THREE.Mesh) => void): void {
  const { radius: R, height: H } = BARREL_DIMS
  const body = new THREE.MeshStandardMaterial({
    map: metalBodyTexture(),
    roughnessMap: barrelRoughnessMap(),
    metalness: 0.55,
    roughness: 0.58,
  })
  const band = new THREE.MeshStandardMaterial({ map: metalBandTexture(), metalness: 0.4, roughness: 0.68 })
  addMetalDrumBody(addMesh, body, band, [0.04, 0.22, 0.44, 0.66, 0.88])
  addDecal(addMesh, skullDecalTexture(), 0.42, 0.42, 0, H * 0.48, R + 0.02)
  const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), ironHoopMat())
  bung.position.set(0.08, H * 0.92, 0.06)
  addMesh(bung)
}

function addMetalGreenBarrel(addMesh: (m: THREE.Mesh) => void): void {
  const { radius: R, height: H } = BARREL_DIMS
  const body = new THREE.MeshStandardMaterial({
    map: greenWasteBodyTexture(),
    roughnessMap: barrelRoughnessMap(),
    metalness: 0.35,
    roughness: 0.65,
  })
  const rib = ironHoopMat()
  addMetalDrumBody(addMesh, body, rib, [0.33, 0.66])
  addDecal(addMesh, biohazardDecalTexture(), 0.5, 0.5, 0, H * 0.5, R + 0.02)
  addDecal(addMesh, toxicSkullDecalTexture(), 0.22, 0.22, R * 0.55, H * 0.18, R * 0.65)
}

function addMetalYellowBarrel(addMesh: (m: THREE.Mesh) => void): void {
  const { radius: R, height: H } = BARREL_DIMS
  const body = new THREE.MeshStandardMaterial({
    map: yellowHazardBodyTexture(),
    roughnessMap: barrelRoughnessMap(),
    metalness: 0.32,
    roughness: 0.68,
  })
  const rib = ironHoopMat()
  addMetalDrumBody(addMesh, body, rib, [0.35, 0.68])
  addDecal(addMesh, toxicSkullDecalTexture(), 0.28, 0.28, 0, H * 0.72, R + 0.02)
  addDecal(addMesh, radiationDecalTexture(), 0.38, 0.38, 0, H * 0.32, R + 0.02)
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.94, R * 0.96, 0.04, 20),
    new THREE.MeshStandardMaterial({ map: rustyLidTexture(), metalness: 0.5, roughness: 0.7 }),
  )
  lid.position.y = H * 0.9
  addMesh(lid)
  const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8), ironHoopMat())
  bung.position.set(0.1, H * 0.93, -0.05)
  addMesh(bung)
}

function woodRadiusAt(t: number, R: number): number {
  return R * (0.86 + Math.sin(t * Math.PI) * 0.14)
}

function addWoodBarrel(addMesh: (m: THREE.Mesh) => void): void {
  const { radius: R, height: H } = BARREL_DIMS
  const woodMap = woodStaveTexture()
  woodMap.repeat.set(3, 1)
  const bodyMat = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.9, metalness: 0.02 })
  const lidMat = new THREE.MeshStandardMaterial({ map: woodLidTexture(), roughness: 0.92, metalness: 0.02 })
  const hoop = ironHoopMat()

  const bodyH = H * 0.86
  const profile: THREE.Vector2[] = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    profile.push(new THREE.Vector2(woodRadiusAt(t, R), t * bodyH))
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 28), bodyMat)
  body.position.y = 0.02
  addMesh(body)

  for (const t of [0.05, 0.2, 0.38, 0.55, 0.72, 0.92]) {
    const r = woodRadiusAt(t, R) + 0.012
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 8, 28), hoop)
    ring.rotation.x = Math.PI / 2
    ring.position.y = t * bodyH + 0.02
    addMesh(ring)
  }

  const topR = woodRadiusAt(1, R) * 0.94
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(topR, topR * 1.02, 0.06, 24), lidMat)
  lid.position.y = bodyH + 0.05
  addMesh(lid)
}

export function buildProceduralBarrel(variant: BarrelVariant = 'metal-dark'): BarrelBuildResult {
  const group = new THREE.Group()
  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  switch (variant) {
    case 'wood':
      addWoodBarrel(addMesh)
      break
    case 'metal-green':
      addMetalGreenBarrel(addMesh)
      break
    case 'metal-yellow':
      addMetalYellowBarrel(addMesh)
      break
    default:
      addMetalDarkBarrel(addMesh)
  }
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

/** Mixed barrel cluster for map placement. */
export function buildBarrelCluster(): BarrelBuildResult {
  const group = new THREE.Group()
  const placements: [BarrelVariant, number, number][] = [
    ['metal-dark', 0, 0],
    ['metal-green', 0.55, 0.2],
    ['metal-yellow', -0.45, 0.35],
  ]
  for (const [variant, ox, oz] of placements) {
    const barrel = buildProceduralBarrel(variant).group
    barrel.position.set(ox, 0, oz)
    group.add(barrel)
  }
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildBarrel(variant: BarrelVariant = 'metal-dark'): Promise<BarrelBuildResult> {
  const glbPath = GLB_PATHS[variant]
  if (glbPath) {
    try {
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(glbPath)
      const model = gltf.scene.clone()
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true
          o.receiveShadow = true
        }
      })
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const scale = BARREL_DIMS.height / Math.max(size.y, size.x, size.z)
      model.scale.setScalar(scale)
      box.setFromObject(model)
      model.position.sub(box.getCenter(new THREE.Vector3()))
      model.position.y -= box.min.y
      const group = new THREE.Group()
      group.add(model)
      return { group, source: 'glb', triangleCount: countTriangles(group) }
    } catch {
      /* fall through to procedural */
    }
  }
  return buildProceduralBarrel(variant)
}
