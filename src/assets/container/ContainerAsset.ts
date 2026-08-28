/**
 * Shipping container — single source of truth.
 * Solid hull + corrugated PBR textures + door hardware (no cage ribs).
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  corrugatedNormalMap,
  hazardStripeTexture,
  skullGearDecalTexture,
  weatheredPaintTexture,
} from './ContainerTextures'

export const CONTAINER_DIMS = { length: 6, width: 2.4, height: 2.6 } as const

const GLB_PATH = '/assets/maps/container-yard/container.glb'

const PAINT: Record<string, { base: string; accent: string }> = {
  red: { base: '#6e2228', accent: '#8a3038' },
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
    normalScale: new THREE.Vector2(0.55, 0.55),
    metalness: 0.22,
    roughness: 0.78,
  })
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

  // --- Solid corrugated hull ---
  const hull = new THREE.Mesh(new THREE.BoxGeometry(L, H, W), mat)
  hull.castShadow = true
  hull.receiveShadow = true
  group.add(hull)

  // End frame trim (doors sit flush on +X end)
  const doorEnd = new THREE.Mesh(new THREE.BoxGeometry(0.1, H * 0.96, W * 0.96), mat)
  doorEnd.position.set(L / 2 - 0.02, 0, 0)
  group.add(doorEnd)

  // Center door seam
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.05, H * 0.9, 0.06), steel)
  seam.position.set(L / 2 + 0.02, 0, 0)
  group.add(seam)

  // Four locking bars (reference miniature)
  for (const z of [-W * 0.3, -W * 0.1, W * 0.1, W * 0.3]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.76, 0.075), locks)
    bar.position.set(L / 2 + 0.06, 0, z)
    group.add(bar)
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.045), locks)
    handle.position.set(L / 2 + 0.1, 0, z)
    group.add(handle)
  }

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

  // Skull + gear logo (red variant)
  if (color === 'red') {
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      new THREE.MeshStandardMaterial({
        map: skullGearDecalTexture(),
        transparent: true,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      }),
    )
    logo.position.set(0, 0.1, W / 2 + 0.06)
    group.add(logo)
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
