import * as THREE from 'three'
import { loadGlbModel, type GlbBuildResult } from '../glb/GlbModelLoader'

export const FEDERATION_OPERATOR_GLB = '/assets/weapons/federation.glb'

/** Hide parts that clip the camera or aren't visible in FPS. */
const FPS_HIDDEN_MATERIAL = /head|headgear|eye|lense|boot|lowerbody/i

/** Torso / arms / gloves / vest pieces kept for first-person body. */
const FPS_VISIBLE_MATERIAL = /glove|upperbody|loadout|utility|alpha_a_alt/i

let federationTemplate: Promise<THREE.Group> | null = null

function meshMaterialNames(mesh: THREE.Mesh): string[] {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return mats.map((m) => m.name)
}

function shouldShowFpsMesh(mesh: THREE.Mesh): boolean {
  const names = meshMaterialNames(mesh)
  if (names.some((n) => FPS_HIDDEN_MATERIAL.test(n))) return false
  if (names.some((n) => FPS_VISIBLE_MATERIAL.test(n))) return true
  return false
}

function prepareFpsOperatorBody(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const show = shouldShowFpsMesh(o)
    o.visible = show
    if (!show) return
    o.castShadow = false
    o.receiveShadow = false
    o.frustumCulled = false
    o.renderOrder = 0
  })
}

/**
 * FPS body pose — chest and arms sit behind the viewmodel weapon.
 * Camera looks down -Z; weapon is near z≈0, torso is further forward (more negative z).
 */
export const FPS_OPERATOR_HOLD = {
  position: new THREE.Vector3(0, -1.02, -0.42),
  rotation: new THREE.Euler(-0.08, 0, 0, 'YXZ'),
}

async function loadFederationTemplate(): Promise<THREE.Group> {
  const { group } = await loadGlbModel(FEDERATION_OPERATOR_GLB, 'character')
  prepareFpsOperatorBody(group)
  group.rotation.order = 'YXZ'
  return group
}

/** Cached Federation operator rig for FPS (torso/arms only). */
export function preloadFpsOperatorBody(): Promise<THREE.Group> {
  if (!federationTemplate) {
    federationTemplate = loadFederationTemplate()
  }
  return federationTemplate.then((rig) => rig.clone(true))
}

export async function buildFederationOperator(): Promise<GlbBuildResult> {
  return loadGlbModel(FEDERATION_OPERATOR_GLB, 'character')
}
