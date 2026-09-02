import { loadGlbModel, type GlbBuildResult } from '../glb/GlbModelLoader'

export const FEDERATION_OPERATOR_GLB = '/assets/weapons/federation.glb'

export async function buildFederationOperator(): Promise<GlbBuildResult> {
  return loadGlbModel(FEDERATION_OPERATOR_GLB, 'character')
}
