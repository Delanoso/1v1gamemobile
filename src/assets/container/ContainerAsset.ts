/**
 * Shipping container — single source of truth.
 * Solid hull + corrugated PBR textures + door hardware (no cage ribs).
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  corrugatedNormalMap,
  hazardStripeTexture,
  weatheredPaintTexture,
} from './ContainerTextures'

export const CONTAINER_DIMS = { length: 6, width: 2.4, height: 2.6 } as const

const GLB_PATH = '/assets/maps/container-yard/container.glb'

const PAINT: Record<string, { base: string; accent: string }> = {
  red: { base: '#7a2830', accent: '#963840' },
  blue: { base: '#243a58', accent: '#345070' },
  green: { base: '#2d5a38', accent: '#3d6e48' },
  tan: { base: '#7a6a52', accent: '#94846a' },
}

export type ContainerVariant = 'red' | 'blue' | 'green' | 'tan'

export interface ContainerBuildResult {
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

function frameMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x3e444c, metalness: 0.85, roughness: 0.3 })
}

function lockMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x6a5848, metalness: 0.9, roughness: 0.35 })
}

function bodyMat(color: ContainerVariant): THREE.MeshStandardMaterial {
  const pal = PAINT[color]
  const useHazard = color === 'green'
  const map = useHazard ? hazardStripeTexture() : weatheredPaintTexture(pal.base, pal.accent)
  if (!useHazard) map.repeat.set(2.5, 1)
  const normal = corrugatedNormalMap()
  normal.repeat.set(2.5, 1)
  return new THREE.MeshStandardMaterial({
    map,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    metalness: 0.28,
    roughness: 0.72,
  })
}

function gasketMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x1a1c20, metalness: 0.1, roughness: 0.95 })
}

function addDoors(
  parent: THREE.Group,
  L: number,
  W: number,
  H: number,
  mat: THREE.MeshStandardMaterial,
  steel: THREE.MeshStandardMaterial,
  locks: THREE.MeshStandardMaterial,
): void {
  const xFace = L / 2
  const doorH = H * 0.9
  const doorW = W * 0.93
  const leafW = doorW / 2 - 0.015
  const depth = 0.05
  const proud = 0.03
  const doorX = xFace + proud

  const addMesh = (mesh: THREE.Mesh, pos?: THREE.Vector3) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    if (pos) mesh.position.copy(pos)
    parent.add(mesh)
  }

  // Perimeter door frame
  const frameT = 0.09
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(frameT, frameT, doorW + frameT * 2), steel), new THREE.Vector3(doorX, doorH / 2 + frameT / 2, 0))
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(frameT, frameT, doorW + frameT * 2), steel), new THREE.Vector3(doorX, -doorH / 2 - frameT / 2, 0))
  for (const z of [-(doorW / 2 + frameT / 2), doorW / 2 + frameT / 2]) {
    addMesh(new THREE.Mesh(new THREE.BoxGeometry(frameT, doorH, frameT), steel), new THREE.Vector3(doorX, 0, z))
  }

  // Two corrugated door leaves (meet at center seam)
  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(depth, doorH, leafW), mat)
  leftDoor.position.set(doorX + depth / 2, 0, -leafW / 2 - 0.012)
  addMesh(leftDoor)

  const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(depth, doorH, leafW), mat)
  rightDoor.position.set(doorX + depth / 2, 0, leafW / 2 + 0.012)
  addMesh(rightDoor)

  // Center gasket / weather seal between leaves
  const gasket = new THREE.Mesh(new THREE.BoxGeometry(depth + 0.01, doorH * 0.96, 0.05), gasketMat())
  gasket.position.set(doorX + depth / 2, 0, 0)
  addMesh(gasket)

  // Horizontal stiffener ribs on each leaf
  for (const zCenter of [-leafW / 2 - 0.012, leafW / 2 + 0.012]) {
    for (const y of [-doorH * 0.28, doorH * 0.28]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(depth + 0.008, 0.05, leafW * 0.88), steel)
      rib.position.set(doorX + depth / 2, y, zCenter)
      addMesh(rib)
    }
  }

  // Hinge barrels on outer edges (3 per leaf)
  for (const side of [-1, 1] as const) {
    const leafCenterZ = side < 0 ? -leafW / 2 - 0.012 : leafW / 2 + 0.012
    const edgeZ = leafCenterZ + side * (leafW / 2 + 0.01)
    for (const y of [-doorH * 0.36, 0, doorH * 0.36]) {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.14, 8), steel)
      hinge.rotation.x = Math.PI / 2
      hinge.position.set(doorX - 0.01, y, edgeZ)
      addMesh(hinge)
    }
  }

  // Cam-lock rods + twist handles (4 bars spanning both doors)
  for (const z of [-W * 0.28, -W * 0.09, W * 0.09, W * 0.28]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, doorH * 0.8, 0.075), locks)
    bar.position.set(doorX + depth + 0.035, 0, z)
    addMesh(bar)
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.13, 8), locks)
    handle.rotation.z = Math.PI / 2
    handle.position.set(doorX + depth + 0.075, -doorH * 0.34, z)
    addMesh(handle)
    const keeper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), steel)
    keeper.position.set(doorX + depth + 0.04, doorH * 0.38, z)
    addMesh(keeper)
  }
}

function addCasting(parent: THREE.Group, x: number, y: number, z: number): void {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), frameMat()))
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8),
    new THREE.MeshStandardMaterial({ color: 0x15181c, metalness: 0.6, roughness: 0.5 }),
  )
  hole.rotation.x = Math.PI / 2
  hole.position.z = 0.085
  g.add(hole)
  g.position.set(x, y, z)
  parent.add(g)
}

/** Solid procedural container — reads as a box, not a cage. */
export function buildProceduralContainer(color: ContainerVariant = 'red'): ContainerBuildResult {
  const group = new THREE.Group()
  const { length: L, width: W, height: H } = CONTAINER_DIMS
  const mat = bodyMat(color)
  const steel = frameMat()
  const locks = lockMat()

  // --- Solid corrugated hull (body sides; doors added on +X end) ---
  const hull = new THREE.Mesh(new THREE.BoxGeometry(L, H, W), mat)
  hull.castShadow = true
  hull.receiveShadow = true
  group.add(hull)

  addDoors(group, L, W, H, mat, steel, locks)

  // Corner ISO posts (8)
  for (const x of [-L / 2, L / 2]) {
    for (const y of [-H / 2, H / 2]) {
      for (const z of [-W / 2, W / 2]) {
        addCasting(group, x, y, z)
      }
    }
  }

  // Top/bottom perimeter rails
  for (const y of [-H / 2, H / 2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.09, W), steel)
    rail.position.y = y
    group.add(rail)
  }

  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildContainer(color: ContainerVariant = 'red'): Promise<ContainerBuildResult> {
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
    const scale = CONTAINER_DIMS.length / Math.max(size.x, size.y, size.z)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    model.position.y -= box.min.y
    const group = new THREE.Group()
    group.add(model)
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralContainer(color)
  }
}
