import * as THREE from 'three'
import { loadGlbModel, MW2022_HORIZONTAL, type GlbBuildResult } from '../glb/GlbModelLoader'

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

/** Per-weapon rotation fixes when the default MW2022 layout is wrong. */
const IMPORTED_ROTATIONS: Record<ImportedWeaponId, THREE.Euler> = {
  'm4-tan': MW2022_HORIZONTAL,
  fennec: new THREE.Euler(0, Math.PI / 2, 0),
  kimber: MW2022_HORIZONTAL,
  renetti: MW2022_HORIZONTAL,
}

export async function buildImportedWeapon(id: ImportedWeaponId): Promise<GlbBuildResult> {
  const entry = IMPORTED_WEAPONS.find((w) => w.id === id)
  if (!entry) throw new Error(`Unknown imported weapon: ${id}`)
  return loadGlbModel(entry.path, 'weapon', 'mw2022', IMPORTED_ROTATIONS[id])
}
