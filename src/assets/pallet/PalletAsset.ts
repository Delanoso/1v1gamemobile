/**
 * Yard prop pallets — wood EUR-style and industrial plastic.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { blockEndGrainTexture, deckBoardTexture, plasticDeckTexture } from './PalletTextures'

export type PalletVariant = 'standard' | 'double' | 'plastic'

export const PALLET_DIMS = { length: 1.2, width: 1.0, height: 0.145 } as const

const GLB_PATHS: Record<PalletVariant, string> = {
  standard: '/assets/maps/container-yard/pallet-standard.glb',
  double: '/assets/maps/container-yard/pallet-double.glb',
  plastic: '/assets/maps/container-yard/pallet-plastic.glb',
}

export interface PalletBuildResult {
  group: THREE.Group
  source: 'glb' | 'procedural'
  triangleCount: number
}

const matCache = new Map<string, THREE.MeshStandardMaterial>()

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

function deckMat(seed: number): THREE.MeshStandardMaterial {
  const key = `deck-${seed}`
  let m = matCache.get(key)
  if (!m) {
    const map = deckBoardTexture(seed)
    map.repeat.set(1, 1)
    m = new THREE.MeshStandardMaterial({
      map,
      roughness: 0.88,
      metalness: 0.02,
    })
    matCache.set(key, m)
  }
  return m
}

function blockMat(): THREE.MeshStandardMaterial {
  const key = 'block'
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      map: blockEndGrainTexture(),
      roughness: 0.9,
      metalness: 0.02,
    })
    matCache.set(key, m)
  }
  return m
}

function nailMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x4a5058, metalness: 0.85, roughness: 0.35 })
}

function addNail(parent: THREE.Object3D, x: number, y: number, z: number): void {
  const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0045, 0.008, 6), nailMat())
  nail.position.set(x, y, z)
  nail.rotation.x = Math.PI / 2
  parent.add(nail)
}

/** Single EUR-style wood pallet. */
function buildWoodPallet(seed = 1): THREE.Group {
  const group = new THREE.Group()
  const { length: L, width: W, height: H } = PALLET_DIMS
  const deckT = 0.022
  const runnerH = H - deckT * 2
  const runnerW = 0.09
  const runnerD = W * 0.92
  const boardW = 0.14
  const boardGap = 0.012
  const topBoardCount = 5
  const topY = H - deckT / 2

  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  // Top deck boards
  const totalBoardSpan = topBoardCount * boardW + (topBoardCount - 1) * boardGap
  let boardZ = -totalBoardSpan / 2 + boardW / 2
  for (let i = 0; i < topBoardCount; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(L * 0.96, deckT, boardW), deckMat(seed + i))
    board.position.set(0, topY, boardZ)
    addMesh(board)
    if (i % 2 === 0) {
      addNail(board, L * 0.3, deckT / 2 + 0.002, 0)
      addNail(board, -L * 0.3, deckT / 2 + 0.002, 0)
    }
    boardZ += boardW + boardGap
  }

  // Bottom deck boards (3)
  const bottomY = deckT / 2
  const bottomCount = 3
  const bottomSpan = bottomCount * boardW + (bottomCount - 1) * boardGap
  let bz = -bottomSpan / 2 + boardW / 2
  for (let i = 0; i < bottomCount; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(L * 0.96, deckT, boardW), deckMat(seed + 10 + i))
    board.position.set(0, bottomY, bz)
    addMesh(board)
    bz += boardW + boardGap
  }

  // Runners (lengthwise stringers)
  const runnerY = deckT + runnerH / 2
  for (const x of [-L * 0.38, 0, L * 0.38]) {
    const runner = new THREE.Mesh(new THREE.BoxGeometry(runnerW, runnerH, runnerD), blockMat())
    runner.position.set(x, runnerY, 0)
    addMesh(runner)
  }

  return group
}

function buildPlasticPallet(): THREE.Group {
  const group = new THREE.Group()
  const { length: L, width: W, height: H } = PALLET_DIMS
  const deckT = 0.028
  const map = plasticDeckTexture()
  map.repeat.set(2, 2)
  const plastic = new THREE.MeshStandardMaterial({
    map,
    color: 0x3a68a8,
    roughness: 0.62,
    metalness: 0.08,
  })
  const frame = new THREE.MeshStandardMaterial({ color: 0x2a4878, roughness: 0.7, metalness: 0.1 })

  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  // Solid deck with lattice cut illusion — top slab + ribs
  const top = new THREE.Mesh(new THREE.BoxGeometry(L * 0.98, deckT, W * 0.98), plastic)
  top.position.y = H - deckT / 2
  addMesh(top)

  // Lattice ribs on underside
  const ribT = 0.018
  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(L * 0.96, ribT, 0.04), frame)
    rib.position.set(0, H - deckT - ribT / 2, -W * 0.42 + i * (W * 0.84 / 6))
    addMesh(rib)
  }
  for (const x of [-L * 0.35, 0, L * 0.35]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, H - deckT, W * 0.9), frame)
    rib.position.set(x, (H - deckT) / 2, 0)
    addMesh(rib)
  }

  // Feet pads
  for (const [x, z] of [
    [-L * 0.38, -W * 0.38],
    [L * 0.38, -W * 0.38],
    [-L * 0.38, W * 0.38],
    [L * 0.38, W * 0.38],
    [0, 0],
  ] as const) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, deckT * 1.2, 0.09), frame)
    foot.position.set(x, deckT / 2, z)
    addMesh(foot)
  }

  return group
}

export function buildProceduralPallet(variant: PalletVariant = 'standard'): PalletBuildResult {
  const group = new THREE.Group()

  if (variant === 'plastic') {
    group.add(buildPlasticPallet())
    return { group, source: 'procedural', triangleCount: countTriangles(group) }
  }

  if (variant === 'double') {
    const lower = buildWoodPallet(3)
    group.add(lower)
    const upper = buildWoodPallet(7)
    upper.position.y = PALLET_DIMS.height
    upper.rotation.y = 0.04
    group.add(upper)
    return { group, source: 'procedural', triangleCount: countTriangles(group) }
  }

  group.add(buildWoodPallet(1))
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

/** Scatter group for map placement. */
export function buildPalletCluster(): PalletBuildResult {
  const group = new THREE.Group()
  const placements: [PalletVariant, number, number, number, number][] = [
    ['standard', 0, 0, 0, 0],
    ['plastic', 1.35, 0, 0.15, -0.3],
    ['double', -1.1, 0, -0.2, 0.15],
  ]
  for (const [variant, x, y, z, rot] of placements) {
    const pallet = buildProceduralPallet(variant).group
    pallet.position.set(x, y, z)
    pallet.rotation.y = rot
    group.add(pallet)
  }
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildPallet(variant: PalletVariant = 'standard'): Promise<PalletBuildResult> {
  const glbPath = GLB_PATHS[variant]
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
    const scale = PALLET_DIMS.height / Math.max(size.y, 0.01)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    model.position.y -= box.min.y
    const group = new THREE.Group()
    group.add(model)
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralPallet(variant)
  }
}
