/**
 * Industrial oil drum — single source of truth for yard prop barrels.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { barrelNormalMap, barrelPaintTexture, barrelRoughnessMap, type BarrelColor } from './BarrelTextures'

export const BARREL_DIMS = { radius: 0.28, height: 0.9 } as const

const GLB_PATH = '/assets/maps/container-yard/barrel.glb'

export type { BarrelColor }

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

function steelMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x6a7078, metalness: 0.85, roughness: 0.35 })
}

function bodyMat(color: BarrelColor): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: barrelPaintTexture(color),
    roughnessMap: barrelRoughnessMap(),
    normalMap: barrelNormalMap(),
    normalScale: new THREE.Vector2(0.25, 0.25),
    metalness: 0.35,
    roughness: 0.62,
  })
}

function addSingleBarrel(color: BarrelColor, addMesh: (m: THREE.Mesh) => void): void {
  const { radius: R, height: H } = BARREL_DIMS
  const body = bodyMat(color)
  const steel = steelMat()

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H * 0.88, 20), body)
  drum.position.y = H * 0.44
  addMesh(drum)

  for (const y of [H * 0.88, H * 0.04]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, 0.022, 8, 24), steel)
    rim.rotation.x = Math.PI / 2
    rim.position.y = y
    addMesh(rim)
  }

  for (const t of [0.22, 0.42, 0.62, 0.78]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.01, 0.014, 6, 24), steel)
    ring.rotation.x = Math.PI / 2
    ring.position.y = H * t
    addMesh(ring)
  }

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.96, R * 0.98, 0.04, 20), steel)
  lid.position.y = H * 0.9
  addMesh(lid)

  for (const [x, z] of [
    [0.09, 0.06],
    [-0.07, -0.08],
  ] as const) {
    const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 8), steel)
    bung.position.set(x, H * 0.93, z)
    addMesh(bung)
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8), steel)
    plug.position.set(x, H * 0.96, z)
    addMesh(plug)
  }
}

export function buildProceduralBarrel(color: BarrelColor = 'blue'): BarrelBuildResult {
  const group = new THREE.Group()
  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  addSingleBarrel(color, addMesh)
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export function buildBarrelCluster(color: BarrelColor = 'blue'): BarrelBuildResult {
  const group = new THREE.Group()
  const offsets: [number, number][] = [
    [0, 0],
    [0.55, 0.2],
    [-0.45, 0.35],
  ]
  for (const [ox, oz] of offsets) {
    const cluster = buildProceduralBarrel(color).group
    cluster.position.set(ox, 0, oz)
    group.add(cluster)
  }
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildBarrel(color: BarrelColor = 'blue'): Promise<BarrelBuildResult> {
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(GLB_PATH)
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
    return buildProceduralBarrel(color)
  }
}
