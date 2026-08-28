/**
 * Asphalt floor tile — single source of truth for container yard ground.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  asphaltColorMap,
  asphaltNormalMap,
  asphaltRoughnessMap,
  crackDecalTexture,
  puddleMaterial,
} from './FloorTextures'

export const FLOOR_TILE = { width: 8, depth: 8, thickness: 0.1 } as const

const GLB_PATH = '/assets/maps/container-yard/floor.glb'

export interface FloorBuildResult {
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

function asphaltMat(repeatX = 1, repeatY = 1): THREE.MeshStandardMaterial {
  const map = asphaltColorMap()
  map.repeat.set(repeatX, repeatY)
  const rough = asphaltRoughnessMap()
  rough.repeat.set(repeatX, repeatY)
  const normal = asphaltNormalMap()
  normal.repeat.set(repeatX, repeatY)
  return new THREE.MeshStandardMaterial({
    map,
    roughnessMap: rough,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    metalness: 0.03,
    roughness: 0.9,
  })
}

function lineMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xd8dce0, roughness: 0.95, metalness: 0 })
}

/** Procedural asphalt floor section for Asset Lab review. */
export function buildProceduralFloor(): FloorBuildResult {
  const group = new THREE.Group()
  const { width: W, depth: D, thickness: T } = FLOOR_TILE
  const mat = asphaltMat()
  const puddle = puddleMaterial()

  const slab = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), mat)
  slab.position.y = T / 2
  slab.receiveShadow = true
  slab.castShadow = true
  group.add(slab)

  // Cross parking lines (Shipment yard style)
  const addLine = (w: number, d: number, x: number, z: number) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat())
    line.rotation.x = -Math.PI / 2
    line.position.set(x, T + 0.004, z)
    group.add(line)
  }
  addLine(W * 0.55, 0.14, 0, 0)
  addLine(0.14, D * 0.55, 0, 0)
  addLine(3.8, 0.12, -2.2, D * 0.38)
  addLine(3.8, 0.12, 2.2, -D * 0.38)

  // Rain puddles
  const puddleSpots: [number, number, number][] = [
    [-1.8, 1.4, 1.3],
    [2.1, -1.6, 1.0],
    [0.4, 2.2, 0.85],
    [-2.5, -1.8, 1.15],
  ]
  for (const [x, z, r] of puddleSpots) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(r, 24), puddle)
    pool.rotation.x = -Math.PI / 2
    pool.position.set(x, T + 0.006, z)
    pool.scale.set(1.4, 1, 1.1)
    group.add(pool)
  }

  // Crack decal overlays
  const crackMat = new THREE.MeshStandardMaterial({
    map: crackDecalTexture(),
    transparent: true,
    depthWrite: false,
    roughness: 1,
    metalness: 0,
  })
  for (const [x, z, rot] of [
    [-2.4, -0.8, 0.2],
    [1.6, 1.9, -0.35],
  ] as const) {
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), crackMat)
    crack.rotation.x = -Math.PI / 2
    crack.rotation.z = rot
    crack.position.set(x, T + 0.005, z)
    group.add(crack)
  }

  // Curb lip along one edge (port yard detail)
  const curb = new THREE.Mesh(
    new THREE.BoxGeometry(W, 0.14, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.88, metalness: 0.05 }),
  )
  curb.position.set(0, 0.07, -D / 2 + 0.11)
  curb.castShadow = true
  curb.receiveShadow = true
  group.add(curb)

  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

/** Single ground slab for the playable map — avoids tiled z-fighting and GPU churn. */
export function buildMapGround(width: number, depth: number): THREE.Group {
  const group = new THREE.Group()
  const T = 0.1
  const mat = asphaltMat(width / FLOOR_TILE.width, depth / FLOOR_TILE.depth)
  const puddle = puddleMaterial()

  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, T, depth), mat)
  slab.position.y = T / 2
  slab.receiveShadow = true
  group.add(slab)

  const line = lineMat()
  const addLine = (w: number, d: number, x: number, z: number) => {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(w, d), line)
    stripe.rotation.x = -Math.PI / 2
    stripe.position.set(x, T + 0.004, z)
    group.add(stripe)
  }
  for (let x = -18; x <= 18; x += 6) {
    addLine(4.5, 0.14, x, -14.5)
    addLine(4.5, 0.14, x, 14.5)
  }

  for (const [x, z, r] of [
    [-8, 3, 1.2],
    [5, -6, 1.0],
    [12, 8, 1.1],
    [-14, -4, 1.15],
  ] as const) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(r, 16), puddle)
    pool.rotation.x = -Math.PI / 2
    pool.position.set(x, T + 0.006, z)
    pool.scale.set(1.8, 1, 1.1)
    group.add(pool)
  }

  return group
}

export async function buildFloor(): Promise<FloorBuildResult> {
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
    const scale = FLOOR_TILE.width / Math.max(size.x, size.z)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    model.position.y -= box.min.y
    const group = new THREE.Group()
    group.add(model)
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralFloor()
  }
}
