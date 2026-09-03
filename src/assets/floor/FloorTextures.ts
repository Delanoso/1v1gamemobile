import * as THREE from 'three'

const COLOR_RES = 2048
const ROUGH_RES = 1024
const NORMAL_RES = 512

/** One 8×8 m slab — control joints every ~4 m in UV space. */
const JOINTS_PER_TILE = 2

type FloorTexVariant = 'lab' | 'map'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

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
      img.data[i + 2] = v + 1
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

function configureColorTexture(tex: THREE.CanvasTexture, repeatX: number, repeatY: number): void {
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

function drawControlJoints(ctx: CanvasRenderingContext2D, S: number): void {
  const pitch = S / JOINTS_PER_TILE
  const groove = Math.max(3, Math.floor(S / 512))

  for (let i = 1; i < JOINTS_PER_TILE; i++) {
    const pos = Math.round(i * pitch)
    // Vertical joint
    ctx.fillStyle = 'rgba(72,74,78,0.55)'
    ctx.fillRect(pos - groove, 0, groove * 2, S)
    ctx.fillStyle = 'rgba(180,182,186,0.35)'
    ctx.fillRect(pos + groove, 0, groove, S)
    // Horizontal joint
    ctx.fillStyle = 'rgba(72,74,78,0.55)'
    ctx.fillRect(0, pos - groove, S, groove * 2)
    ctx.fillStyle = 'rgba(180,182,186,0.35)'
    ctx.fillRect(0, pos + groove, S, groove)
  }
}

function drawTrowelMarks(ctx: CanvasRenderingContext2D, S: number): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = Math.max(2, S / 400)
  for (let y = 0; y < S; y += Math.floor(S / 28)) {
    ctx.beginPath()
    ctx.moveTo(0, y + Math.sin(y * 0.02) * 4)
    for (let x = 0; x < S; x += 40) {
      ctx.lineTo(x, y + Math.sin((x + y) * 0.015) * 3)
    }
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.025)'
  for (let y = Math.floor(S / 56); y < S; y += Math.floor(S / 28)) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(S, y + 2)
    ctx.stroke()
  }
}

/** Weathered industrial concrete — storage yard slab with joints and wear. */
export function buildConcreteColorMap(): THREE.CanvasTexture {
  const S = COLOR_RES
  const [c, ctx] = canvas(S, S)

  // Warm gray poured concrete base
  ctx.fillStyle = '#a8aaac'
  ctx.fillRect(0, 0, S, S)

  // Per-panel tone shift (each joint cell slightly different cure color)
  const pitch = S / JOINTS_PER_TILE
  for (let row = 0; row < JOINTS_PER_TILE; row++) {
    for (let col = 0; col < JOINTS_PER_TILE; col++) {
      const shade = 168 + Math.random() * 22
      ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 6})`
      ctx.fillRect(col * pitch + 2, row * pitch + 2, pitch - 4, pitch - 4)
    }
  }

  fillValueNoise(ctx, S, S, 64, 28, 168)

  // Fine sand / aggregate flecks
  const fine = ctx.createImageData(S, S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const speck = Math.random() < 0.08 ? (Math.random() - 0.5) * 40 : (Math.random() - 0.5) * 12
      const i = (y * S + x) * 4
      fine.data[i] = 168 + speck
      fine.data[i + 1] = 166 + speck
      fine.data[i + 2] = 162 + speck
      fine.data[i + 3] = 255
    }
  }
  ctx.globalAlpha = 0.55
  ctx.putImageData(fine, 0, 0)
  ctx.globalAlpha = 1

  drawTrowelMarks(ctx, S)
  drawControlJoints(ctx, S)

  // Tire scrub / forklift wear paths
  for (let i = 0; i < 5; i++) {
    const y = Math.random() * S
    const h = 18 + Math.random() * 40
    const grad = ctx.createLinearGradient(0, y, 0, y + h)
    grad.addColorStop(0, 'rgba(90,92,96,0)')
    grad.addColorStop(0.5, 'rgba(90,92,96,0.12)')
    grad.addColorStop(1, 'rgba(90,92,96,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, y, S, h)
  }

  // Oil / rust / water stains
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = 30 + Math.random() * 110
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(68,64,58,0.28)')
    grad.addColorStop(0.55, 'rgba(88,86,82,0.12)')
    grad.addColorStop(1, 'rgba(88,86,82,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  return new THREE.CanvasTexture(c)
}

export function buildConcreteRoughnessMap(): THREE.CanvasTexture {
  const S = ROUGH_RES
  const [c, ctx] = canvas(S, S)
  fillValueNoise(ctx, S, S, 48, 50, 210)
  const speck = ctx.createImageData(S, S)
  for (let i = 0; i < speck.data.length; i += 4) {
    const n = 210 + (Math.random() - 0.5) * 28
    speck.data[i] = n
    speck.data[i + 1] = n
    speck.data[i + 2] = n
    speck.data[i + 3] = 255
  }
  ctx.globalAlpha = 0.25
  ctx.putImageData(speck, 0, 0)
  ctx.globalAlpha = 1
  return new THREE.CanvasTexture(c)
}

export function buildConcreteNormalMap(): THREE.CanvasTexture {
  const S = NORMAL_RES
  const [c, ctx] = canvas(S, S)
  const img = ctx.createImageData(S, S)
  const pitch = S / JOINTS_PER_TILE
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const trowel = Math.sin(x * 0.12) * 1.5
      const fine = (Math.random() - 0.5) * 3
      let joint = 0
      for (let i = 1; i < JOINTS_PER_TILE; i++) {
        const pos = i * pitch
        if (Math.abs(x - pos) < 2 || Math.abs(y - pos) < 2) joint = -8
      }
      const n = trowel + fine + joint
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

function getConcreteSet(variant: FloorTexVariant, repeatX: number, repeatY: number) {
  if (!cache[variant]) {
    cache[variant] = {
      map: buildConcreteColorMap(),
      rough: buildConcreteRoughnessMap(),
      normal: buildConcreteNormalMap(),
    }
  }
  const { map, rough, normal } = cache[variant]!
  configureColorTexture(map, repeatX, repeatY)
  configureDataTexture(rough, repeatX, repeatY)
  configureDataTexture(normal, repeatX, repeatY)
  return { map, rough, normal }
}

/** Cached PBR maps for one floor tile (8×8 m). */
export function floorMapsForTile(repeatX = 1, repeatY = 1, forMap = false): {
  map: THREE.CanvasTexture
  rough: THREE.CanvasTexture
  normal: THREE.CanvasTexture
} {
  return getConcreteSet(forMap ? 'map' : 'lab', repeatX, repeatY)
}

/** @deprecated Use floorMapsForTile */
export function asphaltMapsForTile(repeatX = 1, repeatY = 1, forMap = false) {
  return floorMapsForTile(repeatX, repeatY, forMap)
}

/** @deprecated */
export function asphaltColorMap(): THREE.CanvasTexture {
  return floorMapsForTile(2, 2, false).map
}

/** @deprecated */
export function asphaltRoughnessMap(): THREE.CanvasTexture {
  return floorMapsForTile(2, 2, false).rough
}

/** @deprecated */
export function asphaltNormalMap(): THREE.CanvasTexture {
  return floorMapsForTile(2, 2, false).normal
}

export function puddleMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x6a7888,
    metalness: 0.55,
    roughness: 0.14,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  })
}

export function crackDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.clearRect(0, 0, 512, 512)
  ctx.strokeStyle = 'rgba(58,56,52,0.65)'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(80, 360)
  ctx.lineTo(180, 280)
  ctx.lineTo(240, 310)
  ctx.lineTo(340, 190)
  ctx.stroke()
  ctx.lineWidth = 1.5
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
