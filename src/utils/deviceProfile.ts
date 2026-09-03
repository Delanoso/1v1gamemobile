const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

export const deviceProfile = {
  isIOS: /iPhone|iPad|iPod/i.test(ua),
  isMobile:
    /iPhone|iPad|iPod|Android/i.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && window.innerWidth < 1280),
}

/** iPad Safari is very sensitive to VRAM — keep framebuffers small. */
export function getRendererPixelRatio(): number {
  if (deviceProfile.isIOS) return 1
  if (deviceProfile.isMobile) return Math.min(window.devicePixelRatio, 1.25)
  return Math.min(window.devicePixelRatio, 1.5)
}

export function usePostProcessing(): boolean {
  return !deviceProfile.isMobile
}

export function useShadows(): boolean {
  return !deviceProfile.isMobile
}

/** Defer 19 MB weapon GLB until the viewmodel needs it. */
export function shouldPreloadM4ViewModel(): boolean {
  return !deviceProfile.isMobile
}

/** Skip 22 MB menu operator on phones/tablets to avoid tab crashes. */
export function shouldLoadMenuOperator(): boolean {
  return !deviceProfile.isMobile
}
