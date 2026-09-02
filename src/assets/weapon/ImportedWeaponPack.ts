import { loadGlbModel, type GlbBuildResult } from '../glb/GlbModelLoader'

export const IMPORTED_WEAPONS = [
  {
    id: 'm4-tan',
    label: 'M4 Tan',
    path: '/assets/weapons/tactical_m4_-_tan_-_codmw2022_pbr.glb',
  },
  {
    id: 'fennec',
    label: 'Fennec',
    path: '/assets/weapons/fennec_45_suppressed_-_codmw2022_pbr.glb',
  },
  {
    id: 'kimber',
    label: 'Kimber 1911',
    path: '/assets/weapons/kimber_1911.glb',
  },
  {
    id: 'renetti',
    label: 'Renetti',
    path: '/assets/weapons/renetti_pistol_-_red_paint_skin.glb',
  },
] as const

export type ImportedWeaponId = (typeof IMPORTED_WEAPONS)[number]['id']

export async function buildImportedWeapon(id: ImportedWeaponId): Promise<GlbBuildResult> {
  const entry = IMPORTED_WEAPONS.find((w) => w.id === id)
  if (!entry) throw new Error(`Unknown imported weapon: ${id}`)
  return loadGlbModel(entry.path, 'weapon')
}
