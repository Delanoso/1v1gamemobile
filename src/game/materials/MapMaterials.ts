import * as THREE from 'three'
import {
  asphaltColorMap,
  asphaltRoughnessMap,
  chainLinkAlphaMap,
  corrugatedColorMap,
  corrugatedNormalMap,
  corrugatedRoughnessMap,
  woodPalletColorMap,
} from './ProceduralTextures'

export type ContainerColor = 'red' | 'blue' | 'green' | 'tan'

const CONTAINER_COLORS: Record<ContainerColor, { base: string; accent: string; metalness: number }> = {
  red: { base: '#8b2e28', accent: '#a83a32', metalness: 0.45 },
  blue: { base: '#2a4a6a', accent: '#3a5e82', metalness: 0.48 },
  green: { base: '#3a5a40', accent: '#4a6e50', metalness: 0.42 },
  tan: { base: '#8a7a62', accent: '#a09078', metalness: 0.38 },
}

let sharedNormal: THREE.CanvasTexture | null = null
let sharedRough: THREE.CanvasTexture | null = null
let asphaltColor: THREE.CanvasTexture | null = null
let asphaltRough: THREE.CanvasTexture | null = null
let fenceAlpha: THREE.CanvasTexture | null = null
let woodColor: THREE.CanvasTexture | null = null

function getSharedMaps() {
  if (!sharedNormal) sharedNormal = corrugatedNormalMap()
  if (!sharedRough) sharedRough = corrugatedRoughnessMap()
  if (!asphaltColor) asphaltColor = asphaltColorMap()
  if (!asphaltRough) asphaltRough = asphaltRoughnessMap()
  if (!fenceAlpha) fenceAlpha = chainLinkAlphaMap()
  if (!woodColor) woodColor = woodPalletColorMap()
  return { sharedNormal, sharedRough, asphaltColor, asphaltRough, fenceAlpha, woodColor }
}

export function createContainerMaterial(color: ContainerColor): THREE.MeshStandardMaterial {
  const { sharedNormal, sharedRough } = getSharedMaps()
  const pal = CONTAINER_COLORS[color]
  const map = corrugatedColorMap(pal.base, pal.accent)
  map.repeat.set(2, 1)
  const normal = sharedNormal!.clone()
  normal.repeat.set(2, 1)
  const rough = sharedRough!.clone()
  rough.repeat.set(2, 1)
  return new THREE.MeshStandardMaterial({
    map,
    normalMap: normal,
    roughnessMap: rough,
    metalness: pal.metalness,
    roughness: 0.85,
  })
}

export function createAsphaltMaterial(): THREE.MeshStandardMaterial {
  const { asphaltColor, asphaltRough } = getSharedMaps()
  return new THREE.MeshStandardMaterial({
    map: asphaltColor!,
    roughnessMap: asphaltRough!,
    metalness: 0.02,
    roughness: 0.92,
  })
}

export function createFenceMaterial(): THREE.MeshStandardMaterial {
  const { fenceAlpha } = getSharedMaps()
  return new THREE.MeshStandardMaterial({
    color: 0x6a7078,
    alphaMap: fenceAlpha!,
    transparent: true,
    opacity: 0.55,
    metalness: 0.6,
    roughness: 0.4,
    side: THREE.DoubleSide,
  })
}

export function createWoodMaterial(): THREE.MeshStandardMaterial {
  const { woodColor } = getSharedMaps()
  return new THREE.MeshStandardMaterial({
    map: woodColor!,
    roughness: 0.88,
    metalness: 0.02,
  })
}

export function createBarrelMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x2a4a7a,
    metalness: 0.35,
    roughness: 0.55,
  })
}

export function createMetalTrimMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x4a5058,
    metalness: 0.75,
    roughness: 0.35,
  })
}

/** Wet puddle decal on asphalt. */
export function createPuddleMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x1a2228,
    metalness: 0.85,
    roughness: 0.15,
    transparent: true,
    opacity: 0.65,
  })
}
