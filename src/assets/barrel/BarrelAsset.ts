/**
 * Yard prop barrels — metal industrial drum + wooden stave barrel.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  barrelRoughnessMap,
  metalBandTexture,
  metalBodyTexture,
  skullDecalTexture,
  woodLidTexture,
  woodStaveTexture,
  type BarrelType,
} from './BarrelTextures'

export const BARREL_DIMS = { radius: 0.28, height: 0.9 } as const

const GLB_PATHS: Record<BarrelType, string> = {
  metal: '/assets/maps/container-yard/barrel-metal.glb',
  wood: '/assets/maps/container-yard/barrel-wood.glb',
}

export type { BarrelType }

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

function addMetalBarrel(addMesh: (m: THREE.Mesh) => void): void {
  const { radius: R, height: H } = BARREL_DIMS
  const body = new THREE.MeshStandardMaterial({
    map: metalBodyTexture(),
    roughnessMap: barrelRoughnessMap(),
    metalness: 0.55,
    roughness: 0.58,
  })
  const band = new THREE.MeshStandardMaterial({
    map: metalBandTexture(),
    metalness: 0.4,
    roughness: 0.68,
  })

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H * 0.88, 20), body)
  drum.position.y = H * 0.44
  addMesh(drum)

  // Five red reinforcement bands (reference)
  for (const t of [0.04, 0.22, 0.44, 0.66, 0.88]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.03, 0.02, 6, 24), band)
    ring.rotation.x = Math.PI / 2
    ring.position.y = H * t
    addMesh(ring)
  }

  // Skull hazard decal
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    new THREE.MeshStandardMaterial({
      map: skullDecalTexture(),
      roughness: 0.9,
      metalness: 0.1,
    }),
  )
  decal.position.set(0, H * 0.48, R + 0.02)
  addMesh(decal)

  // End-cap bung
  const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), ironHoopMat())
  bung.position.set(0.08, H * 0.92, 0.06)
  addMesh(bung)
}

function woodRadiusAt(t: number, R: number): number {
  return R * (0.86 + Math.sin(t * Math.PI) * 0.14)
}

function addWoodBarrel(addMesh: (m: THREE.Mesh) => void): void {
  const { radius: R, height: H } = BARREL_DIMS
  const woodMap = woodStaveTexture()
  woodMap.repeat.set(3, 1)
  const bodyMat = new THREE.MeshStandardMaterial({
    map: woodMap,
    roughness: 0.9,
    metalness: 0.02,
  })
  const lidMat = new THREE.MeshStandardMaterial({
    map: woodLidTexture(),
    roughness: 0.92,
    metalness: 0.02,
  })
  const hoop = ironHoopMat()

  // Solid bulging barrel body (lathe profile — no cage gaps)
  const bodyH = H * 0.86
  const profile: THREE.Vector2[] = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    profile.push(new THREE.Vector2(woodRadiusAt(t, R), t * bodyH))
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 28), bodyMat)
  body.position.y = 0.02
  addMesh(body)

  // Six iron hoops sitting on the bulged surface
  for (const t of [0.05, 0.2, 0.38, 0.55, 0.72, 0.92]) {
    const r = woodRadiusAt(t, R) + 0.012
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 8, 28), hoop)
    ring.rotation.x = Math.PI / 2
    ring.position.y = t * bodyH + 0.02
    addMesh(ring)
  }

  // Flat plank lid flush on top
  const topR = woodRadiusAt(1, R) * 0.94
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(topR, topR * 1.02, 0.06, 24), lidMat)
  lid.position.y = bodyH + 0.05
  addMesh(lid)
}

export function buildProceduralBarrel(type: BarrelType = 'metal'): BarrelBuildResult {
  const group = new THREE.Group()
  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  if (type === 'wood') addWoodBarrel(addMesh)
  else addMetalBarrel(addMesh)
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

/** Mixed metal + wood cluster for map placement. */
export function buildBarrelCluster(): BarrelBuildResult {
  const group = new THREE.Group()
  const placements: [BarrelType, number, number][] = [
    ['metal', 0, 0],
    ['metal', 0.55, 0.2],
    ['wood', -0.45, 0.35],
  ]
  for (const [type, ox, oz] of placements) {
    const barrel = buildProceduralBarrel(type).group
    barrel.position.set(ox, 0, oz)
    group.add(barrel)
  }
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildBarrel(type: BarrelType = 'metal'): Promise<BarrelBuildResult> {
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(GLB_PATHS[type])
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
    return buildProceduralBarrel(type)
  }
}
