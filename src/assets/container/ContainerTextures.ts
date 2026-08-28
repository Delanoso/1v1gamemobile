import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** ~225 mm pitch — large square ISO-style ribs (visible at gameplay distance). */
export const CONTAINER_RIB_PITCH = 0.225
export const CONTAINER_RIB_DEPTH = 0.036
/** Ribs across one albedo tile (6 m hull / 2.5 repeat ≈ 2.4 m). */
export const CONTAINER_RIB_COUNT_PER_TILE = 11

/**
 * Trapezoidal rib: flat crest, flat valley, steep webs (~square silhouette).
 * Returns 0 in valley, 1 on crest.
 */
export function squareRibProfile(phase: number): number {
  const t = phase - Math.floor(phase)
  if (t < 0.09) return t / 0.09
  if (t < 0.41) return 1
  if (t < 0.5) return 1 - (t - 0.41) / 0.09
  if (t < 0.91) return 0
  return (t - 0.91) / 0.09
}

/** Diagonal hazard stripes for green container variant. */
export function hazardStripeTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#2d5a38'
  ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = '#d4b820'
  ctx.lineWidth = 52
  for (let i = -512; i < 1024; i += 104) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 512, 512)
    ctx.stroke()
  }
  for (let x = 0; x < 512; x++) {
    const phase = (x / 512) * CONTAINER_RIB_COUNT_PER_TILE
    const ridge = squareRibProfile(phase)
    ctx.fillStyle = `rgba(0,0,0,${0.05 + (1 - ridge) * 0.2})`
    ctx.fillRect(x, 0, 1, 512)
    if (ridge > 0.98) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fillRect(x, 0, 1, 512)
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  for (let y = 0; y < 512; y += 14) {
    ctx.fillRect(0, y, 512, 7)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Painted metal with square corrugation bands in albedo. */
export function weatheredPaintTexture(base: string, accent: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)

  const pxPerRib = 512 / CONTAINER_RIB_COUNT_PER_TILE
  for (let x = 0; x < 512; x++) {
    const phase = (x / 512) * CONTAINER_RIB_COUNT_PER_TILE
    const ridge = squareRibProfile(phase)
    const inCrest = ridge > 0.95
    const inValley = ridge < 0.05
    const inWeb = !inCrest && !inValley

    if (inCrest) {
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.42
    } else if (inValley) {
      ctx.fillStyle = base
      ctx.globalAlpha = 0.55
    } else {
      ctx.fillStyle = '#1a1410'
      ctx.globalAlpha = 0.22
    }
    ctx.fillRect(x, 0, 1, 512)

    if (inCrest && x % Math.max(1, Math.floor(pxPerRib)) < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.09)'
      ctx.globalAlpha = 1
      ctx.fillRect(x, 0, 1, 512)
    }
    if (inWeb) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.globalAlpha = 1
      ctx.fillRect(x, 0, 1, 512)
    }
    ctx.globalAlpha = 1
  }

  for (let i = 0; i < 5000; i++) {
    const g = 80 + Math.random() * 40
    ctx.fillStyle = `rgba(${g},${g * 0.9},${g * 0.85},0.04)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  for (let i = 0; i < 35; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 24 + Math.random() * 70)
  }
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(110,65,35,${0.04 + Math.random() * 0.07})`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 30 + Math.random() * 90, 2 + Math.random() * 5)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Normal map — sharp vertical webs between flat crests and valleys. */
export function corrugatedNormalMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const img = ctx.createImageData(512, 512)
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const phase = (x / 512) * CONTAINER_RIB_COUNT_PER_TILE
      const ridge = squareRibProfile(phase)
      const prev = squareRibProfile(phase - 0.025)
      const next = squareRibProfile(phase + 0.025)
      const slope = (next - prev) * 3.2
      const i = (y * 512 + x) * 4
      img.data[i] = Math.max(0, Math.min(255, 128 + slope * 62))
      img.data[i + 1] = Math.max(0, Math.min(255, 128 + ridge * 12))
      img.data[i + 2] = Math.max(0, Math.min(255, ridge > 0.5 ? 248 : 228))
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Valleys rougher, flat crests slightly shinier. */
export function corrugatedRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const img = ctx.createImageData(512, 512)
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const phase = (x / 512) * CONTAINER_RIB_COUNT_PER_TILE
      const ridge = squareRibProfile(phase)
      const rough = 210 - ridge * 65 + Math.sin(x * 0.17 + y * 0.23) * 4
      const i = (y * 512 + x) * 4
      img.data[i] = rough
      img.data[i + 1] = rough
      img.data[i + 2] = rough
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
