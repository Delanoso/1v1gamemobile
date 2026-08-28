import * as THREE from 'three'

const COLOR_RES = 2048
const ROUGH_RES = 1024
const NORMAL_RES = 512

type FloorTexVariant = 'lab' | 'map'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Smooth value noise — avoids blocky 1px fillRect aggregate. */
function fillValueNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cell: number,
  strength: number,
  base = 128,
): void {
  const cols = Math.ceil(w / cell) + 2
  const rows = Math.ceil(h / cell) + 2
  const grid = new Float32Array(cols * rows)
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random()

  const img = ctx.createImageData(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = x / cell
      const fy = y / cell
      const x0 = Math.floor(fx)
      const y0 = Math.floor(fy)
      const tx = fx - x0
      const ty = fy - y0
      const s = (x0: number, y0: number) => grid[y0 * cols + x0] ?? 0
      const n =
        s(x0, y0) * (1 - tx) * (1 - ty) +
        s(x0 + 1, y0) * tx * (1 - ty) +
        s(x0, y0 + 1) * (1 - tx) * ty +
        s(x0 + 1, y0 + 1) * tx * ty
      const v = Math.max(0, Math.min(255, base + (n - 0.5) * strength))
      const i = (y * w + x) * 4
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v + 2
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

function configureAsphaltTexture(tex: THREE.CanvasTexture, repeatX: number, repeatY: number): void {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  tex.needsUpdate = true
}

function configureDataTexture(tex: THREE.CanvasTexture, repeatX: number, repeatY: number): void {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  tex.needsUpdate = true
}

/** Dark industrial asphalt with aggregate, stains, and worn lane markings. */
export function buildAsphaltColorMap(options?: { laneMarkings?: boolean; surfaceBands?: boolean }): THREE.CanvasTexture {
  const S = COLOR_RES
  const [c, ctx] = canvas(S, S)
  ctx.fillStyle = '#2b2e32'
  ctx.fillRect(0, 0, S, S)

  // Large-scale tone variation
  fillValueNoise(ctx, S, S, 96, 42, 42)

  // Fine aggregate (smooth noise, not square pixels)
  const fine = ctx.createImageData(S, S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n = (Math.random() - 0.5) * 28
      const i = (y * S + x) * 4
      fine.data[i] = 128 + n
      fine.data[i + 1] = 128 + n
      fine.data[i + 2] = 130 + n
      fine.data[i + 3] = 38
    }
  }
  ctx.putImageData(fine, 0, 0)

  // Subtle roller compaction bands (lab only)
  if (options?.surfaceBands !== false) {
    for (let y = 0; y < S; y += 96) {
      ctx.fillStyle = 'rgba(255,255,255,0.012)'
      ctx.fillRect(0, y, S, 18)
      ctx.fillStyle = 'rgba(0,0,0,0.018)'
      ctx.fillRect(0, y + 20, S, 14)
    }
  }

  // Oil / diesel stains
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = 40 + Math.random() * 140
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(8,8,10,0.5)')
    grad.addColorStop(0.55, 'rgba(12,12,14,0.18)')
    grad.addColorStop(1, 'rgba(12,12,14,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // Worn parking line — optional; off on map slab
  if (options?.laneMarkings !== false) {
    ctx.fillStyle = 'rgba(210,214,220,0.5)'
    ctx.fillRect(0, S * 0.46, S, S * 0.028)
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(0, S * 0.488, S, S * 0.004)
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    for (let x = 0; x < S; x += Math.floor(S / 24)) {
      ctx.fillRect(x, S * 0.462, S / 48, S * 0.024)
    }
  }

  return new THREE.CanvasTexture(c)
}

export function buildAsphaltRoughnessMap(): THREE.CanvasTexture {
  const S = ROUGH_RES
  const [c, ctx] = canvas(S, S)
  fillValueNoise(ctx, S, S, 32, 90, 196)
  const speck = ctx.createImageData(S, S)
  for (let i = 0; i < speck.data.length; i += 4) {
    const n = 196 + (Math.random() - 0.5) * 36
    speck.data[i] = n
    speck.data[i + 1] = n
    speck.data[i + 2] = n
    speck.data[i + 3] = 255
  }
  ctx.globalAlpha = 0.35
  ctx.putImageData(speck, 0, 0)
  ctx.globalAlpha = 1
  return new THREE.CanvasTexture(c)
}

export function buildAsphaltNormalMap(): THREE.CanvasTexture {
  const S = NORMAL_RES
  const [c, ctx] = canvas(S, S)
  const img = ctx.createImageData(S, S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const coarse = Math.sin(x * 0.08) * Math.cos(y * 0.07) * 4
      const fine = (Math.random() - 0.5) * 6
      const n = coarse + fine
      const i = (y * S + x) * 4
      img.data[i] = 128 + n
      img.data[i + 1] = 128 + n
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return new THREE.CanvasTexture(c)
}

const cache: Partial<
  Record<FloorTexVariant, { map: THREE.CanvasTexture; rough: THREE.CanvasTexture; normal: THREE.CanvasTexture }>
> = {}

function getAsphaltSet(variant: FloorTexVariant, repeatX: number, repeatY: number) {
  if (!cache[variant]) {
    const forMap = variant === 'map'
    cache[variant] = {
      map: buildAsphaltColorMap({ laneMarkings: !forMap, surfaceBands: !forMap }),
      rough: buildAsphaltRoughnessMap(),
      normal: buildAsphaltNormalMap(),
    }
  }
  const { map, rough, normal } = cache[variant]!
  configureAsphaltTexture(map, repeatX, repeatY)
  configureDataTexture(rough, repeatX, repeatY)
  configureDataTexture(normal, repeatX, repeatY)
  return { map, rough, normal }
}

/** Cached PBR maps for one floor tile (8×8 m). */
export function asphaltMapsForTile(repeatX = 1, repeatY = 1, forMap = false): {
  map: THREE.CanvasTexture
  rough: THREE.CanvasTexture
  normal: THREE.CanvasTexture
} {
  return getAsphaltSet(forMap ? 'map' : 'lab', repeatX, repeatY)
}

/** @deprecated Use asphaltMapsForTile */
export function asphaltColorMap(options?: { laneMarkings?: boolean; surfaceBands?: boolean }): THREE.CanvasTexture {
  const forMap = options?.laneMarkings === false && options?.surfaceBands === false
  return asphaltMapsForTile(2, 2, forMap).map
}

/** @deprecated Use asphaltMapsForTile */
export function asphaltRoughnessMap(): THREE.CanvasTexture {
  return asphaltMapsForTile(2, 2, false).rough
}

/** @deprecated Use asphaltMapsForTile */
export function asphaltNormalMap(): THREE.CanvasTexture {
  return asphaltMapsForTile(2, 2, false).normal
}

export function puddleMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x4a5868,
    metalness: 0.65,
    roughness: 0.12,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  })
}

export function crackDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.clearRect(0, 0, 512, 512)
  ctx.strokeStyle = 'rgba(18,20,24,0.75)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(80, 360)
  ctx.lineTo(180, 280)
  ctx.lineTo(240, 310)
  ctx.lineTo(340, 190)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(200, 400)
  ctx.lineTo(260, 340)
  ctx.lineTo(310, 350)
  ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}
