/** ADS scope HUD overlay — tunable via /tune.html (SCOPE tab). */
export interface ScopeOverlaySettings {
  frameSizePx: number
  frameBorderPx: number
  frameRadiusPx: number
  lensInsetPx: number
  dotSizePx: number
  dotOffsetX: number
  dotOffsetY: number
  vignetteInnerRatio: number
  vignetteOuterRatio: number
  vignetteOpacity: number
  vignetteEdgeOpacity: number
  dotColor: string
  frameBorderColor: string
  showDot: boolean
  showVignette: boolean
}

export const DEFAULT_SCOPE_OVERLAY: ScopeOverlaySettings = {
  frameSizePx: 158,
  frameBorderPx: 0,
  frameRadiusPx: 0,
  lensInsetPx: 0,
  dotSizePx: 7,
  dotOffsetX: 0,
  dotOffsetY: 0,
  vignetteInnerRatio: 0.2,
  vignetteOuterRatio: 0.64,
  vignetteOpacity: 0,
  vignetteEdgeOpacity: 0,
  dotColor: '#ff2e2e',
  frameBorderColor: 'rgba(18, 20, 22, 0.95)',
  showDot: true,
  showVignette: true,
}

const STORAGE_KEY = 'frontline-scope-tune-v1'

export function getScopeOverlaySettings(): ScopeOverlaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SCOPE_OVERLAY }
    return { ...DEFAULT_SCOPE_OVERLAY, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SCOPE_OVERLAY }
  }
}

export function saveScopeOverlaySettings(settings: ScopeOverlaySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function scopeSettingsToCode(settings: ScopeOverlaySettings): string {
  const lines = Object.entries(settings).map(([key, value]) => {
    const v = typeof value === 'string' ? `'${value}'` : value
    return `  ${key}: ${v},`
  })
  return `export const SCOPE_OVERLAY = {\n${lines.join('\n')}\n} as const`
}

export function applyScopeOverlay(
  scopeOverlay: HTMLElement,
  settings: ScopeOverlaySettings,
  blend = 1,
): void {
  const frame = scopeOverlay.querySelector<HTMLElement>('.scope-frame')
  const lens = scopeOverlay.querySelector<HTMLElement>('.scope-lens')
  const dot = scopeOverlay.querySelector<HTMLElement>('.scope-dot')
  const vignette = scopeOverlay.querySelector<HTMLElement>('.scope-vignette')
  if (!frame || !lens || !dot || !vignette) return

  const size = settings.frameSizePx
  frame.style.width = `${size}px`
  frame.style.height = `${size}px`
  frame.style.borderWidth = `${settings.frameBorderPx}px`
  frame.style.borderRadius = `${settings.frameRadiusPx}px`
  frame.style.borderColor = settings.frameBorderColor
  frame.style.display = 'block'

  lens.style.inset = `${settings.lensInsetPx}px`
  lens.style.borderRadius = `${Math.max(0, settings.frameRadiusPx - 1)}px`

  dot.style.width = `${settings.dotSizePx}px`
  dot.style.height = `${settings.dotSizePx}px`
  dot.style.left = `calc(50% + ${settings.dotOffsetX}px)`
  dot.style.top = `calc(50% + ${settings.dotOffsetY}px)`
  dot.style.background = settings.dotColor
  dot.style.display = settings.showDot ? 'block' : 'none'
  dot.style.boxShadow = `0 0 4px ${settings.dotColor}f2, 0 0 10px ${settings.dotColor}8c`

  vignette.style.display = settings.showVignette ? 'block' : 'none'
  vignette.style.setProperty('--scope-inner', `${size * settings.vignetteInnerRatio}px`)
  vignette.style.setProperty('--scope-outer', `${size * settings.vignetteOuterRatio}px`)
  vignette.style.background = `radial-gradient(
    circle at center,
    transparent 0,
    transparent var(--scope-inner),
    rgba(0, 0, 0, ${settings.vignetteOpacity}) var(--scope-outer),
    rgba(0, 0, 0, ${settings.vignetteEdgeOpacity}) 100%
  )`

  scopeOverlay.style.opacity = String(Math.min(1, blend))
}
