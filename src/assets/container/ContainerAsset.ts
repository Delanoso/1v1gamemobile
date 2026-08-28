/**
 * Shipping container — single source of truth.
 * Polished in Asset Lab to match physical reference, then used in game map.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ContainerColor } from '../../game/materials/MapMaterials'
import {
  corrugatedNormalMap,
  hazardStripeTexture,
  skullGearDecalTexture,
  weatheredPaintTexture,
} from './ContainerTextures'

export const CONTAINER_DIMS = { length: 6, width: 2.4, height: 2.6 } as const

const GLB_PATH = '/assets/maps/container-yard/container.glb'

const PAINT: Record<ContainerColor, { base: string; accent: string }> = {
  red: { base: '#6e2228', accent: '#8a3038' },
  blue: { base: '#243a58', accent: '#345070' },
  green: { base: '#2d5a38', accent: '#3d6e48' },
  tan: { base: '#7a6a52', accent: '#94846a' },
}

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

function steelMat(color = 0x4a5058): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.88,
    roughness: 0.32,
  })
}

function lockBarMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x6a5848,
    metalness: 0.92,
    roughness: 0.38,
  })
}

function paintMat(color: ContainerColor, useHazard: boolean): THREE.MeshStandardMaterial {
  const pal = PAINT[color]
  const map = useHazard ? hazardStripeTexture() : weatheredPaintTexture(pal.base, pal.accent)
  if (!useHazard) map.repeat.set(3, 1)
  const normal = corrugatedNormalMap()
  normal.repeat.set(3, 1)
  return new THREE.MeshStandardMaterial({
    map,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    metalness: 0.18,
    roughness: 0.82,
  })
}

/** Vertical corrugated panel (long side or door). */
function corrugatedPanel(
  span: number,
  height: number,
  thickness: number,
  mat: THREE.MeshStandardMaterial,
  ribAxis: 'x' | 'z',
): THREE.Group {
  const g = new THREE.Group()
  const spacing = 0.22
  const count = Math.floor(span / spacing)

  for (let i = 0; i < count; i++) {
    const t = -span / 2 + spacing / 2 + i * spacing
    const ribW = spacing * 0.42
    const rib =
      ribAxis === 'x'
        ? new THREE.Mesh(new THREE.BoxGeometry(ribW, height * 0.98, thickness), mat)
        : new THREE.Mesh(new THREE.BoxGeometry(thickness, height * 0.98, ribW), mat)
    if (ribAxis === 'x') rib.position.set(t, 0, 0)
    else rib.position.set(0, 0, t)
    rib.castShadow = true
    rib.receiveShadow = true
    g.add(rib)
  }
  return g
}

function addCornerCasting(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  mat: THREE.MeshStandardMaterial,
): void {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), mat))
  for (const oy of [-0.06, 0.06]) {
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1c20, metalness: 0.7, roughness: 0.5 }),
    )
    hole.rotation.x = Math.PI / 2
    hole.position.set(0, oy, 0.09)
    g.add(hole)
  }
  g.position.set(x, y, z)
  parent.add(g)
}

/** Reference-accurate procedural container v2. */
export function buildProceduralContainer(color: ContainerColor = 'red'): ContainerBuildResult {
  const group = new THREE.Group()
  const { length: L, width: W, height: H } = CONTAINER_DIMS
  const frameMat = steelMat()
  const barMat = lockBarMat()
  const useHazard = color === 'green'
  const bodyMat = paintMat(color, useHazard)

  // Long sides (corrugated along length)
  for (const zSign of [-1, 1]) {
    const side = corrugatedPanel(L * 0.94, H * 0.94, 0.05, bodyMat, 'x')
    side.position.set(0, 0, zSign * (W / 2 - 0.04))
    group.add(side)
  }

  // Roof — horizontal ribs
  const roof = corrugatedPanel(W * 0.94, 0.06, L * 0.94, bodyMat, 'z')
  roof.rotation.x = Math.PI / 2
  roof.position.y = H / 2 - 0.04
  group.add(roof)

  // Floor underside
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(L * 0.94, 0.08, W * 0.94),
    steelMat(0x3a4048),
  )
  floor.position.y = -H / 2 + 0.04
  group.add(floor)

  // Door end (+X) — two doors with 4 locking bars
  const doorZ = [-W * 0.26, W * 0.26]
  for (const z of doorZ) {
    const door = corrugatedPanel(W * 0.42, H * 0.9, 0.05, bodyMat, 'z')
    door.position.set(L / 2 - 0.05, 0, z)
    group.add(door)
  }
  // Center seam
  const seam = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, H * 0.88, 0.06),
    frameMat,
  )
  seam.position.set(L / 2, 0, 0)
  group.add(seam)

  // Four vertical locking bars (reference)
  for (const z of [-W * 0.32, -W * 0.1, W * 0.1, W * 0.32]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, H * 0.78, 0.07), barMat)
    bar.position.set(L / 2 + 0.06, 0, z)
    group.add(bar)
    // Handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.05), barMat)
    handle.position.set(L / 2 + 0.1, 0, z)
    group.add(handle)
  }

  // Corner posts + castings (8 corners)
  const postPositions: [number, number, number][] = [
    [-L / 2, H / 2, -W / 2],
    [L / 2, H / 2, -W / 2],
    [-L / 2, H / 2, W / 2],
    [L / 2, H / 2, W / 2],
    [-L / 2, -H / 2, -W / 2],
    [L / 2, -H / 2, -W / 2],
    [-L / 2, -H / 2, W / 2],
    [L / 2, -H / 2, W / 2],
  ]
  for (const [x, y, z] of postPositions) {
    addCornerCasting(group, x, y, z, frameMat)
  }

  // Frame rails
  for (const y of [-H / 2, H / 2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.1, W), frameMat)
    rail.position.y = y
    group.add(rail)
  }

  // Logo decal (red) or skip for hazard green
  if (color === 'red') {
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      new THREE.MeshStandardMaterial({
        map: skullGearDecalTexture(),
        transparent: true,
        depthWrite: false,
        roughness: 0.9,
        metalness: 0,
      }),
    )
    decal.position.set(0, 0.15, W / 2 + 0.08)
    group.add(decal)
  }

  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })

  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildContainer(color: ContainerColor = 'red'): Promise<ContainerBuildResult> {
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
