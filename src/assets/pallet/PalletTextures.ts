import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

function seededRandom(seed: number): () => number {
  let s = (seed % 2147483646) + 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Weathered deck board — short grain runs along board length. */
export function deckBoardTexture(seed = 1): THREE.CanvasTexture {
  const rng = seededRandom(seed)
  const [c, ctx] = canvas(256, 64)
  const base = 96 + rng() * 22
  ctx.fillStyle = `rgb(${base},${base * 0.68},${base * 0.42})`
  ctx.fillRect(0, 0, 256, 64)

  for (let i = 0; i < 28; i++) {
    const y = i * 2.2 + rng()
    ctx.strokeStyle = `rgba(${base * 0.55},${base * 0.38},${base * 0.24},${0.12 + rng() * 0.1})`
    ctx.lineWidth = 0.6 + rng() * 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x < 256; x += 12) {
      ctx.lineTo(x, y + Math.sin(x * 0.05) * 0.8 + (rng() - 0.5))
    }
    ctx.stroke()
  }

  // Worn edges
  for (const side of [0, 256]) {
    const g = ctx.createLinearGradient(side, 0, side === 0 ? 18 : 238, 0)
    g.addColorStop(0, 'rgba(28,18,10,0.45)')
    g.addColorStop(1, 'rgba(28,18,10,0)')
    ctx.fillStyle = g
    ctx.fillRect(side === 0 ? 0 : 238, 0, 18, 64)
  }

  // Oil stain
  if (rng() > 0.4) {
    const sx = 40 + rng() * 140
    const grad = ctx.createRadialGradient(sx, 32, 0, sx, 32, 28 + rng() * 20)
    grad.addColorStop(0, 'rgba(12,10,8,0.35)')
    grad.addColorStop(1, 'rgba(12,10,8,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 256, 64)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** End grain for pallet blocks / stringers. */
export function blockEndGrainTexture(seed = 2): THREE.CanvasTexture {
  const rng = seededRandom(seed)
  const [c, ctx] = canvas(128, 128)
  const base = 88 + rng() * 16
  ctx.fillStyle = `rgb(${base},${base * 0.62},${base * 0.38})`
  ctx.fillRect(0, 0, 128, 128)

  const cx = 64
  const cy = 64
  for (let ring = 0; ring < 8; ring++) {
    const r = 8 + ring * 7 + rng() * 2
    ctx.strokeStyle = `rgba(${base * 0.45},${base * 0.3},${base * 0.2},0.35)`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.ellipse(cx, cy, r, r * (0.85 + rng() * 0.1), rng() * 0.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Scuffed industrial plastic pallet surface. */
export function plasticDeckTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#2a4a78'
  ctx.fillRect(0, 0, 256, 256)

  for (let y = 0; y < 256; y += 8) {
    for (let x = 0; x < 256; x += 8) {
      const n = Math.random()
      ctx.fillStyle = `rgba(${40 + n * 20},${70 + n * 25},${115 + n * 20},0.25)`
      ctx.fillRect(x, y, 7, 7)
    }
  }

  // Diamond tread pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  for (let i = -256; i < 512; i += 16) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 256, 256)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, 256)
    ctx.lineTo(i + 256, 0)
    ctx.stroke()
  }

  // Scuff marks
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `rgba(180,200,230,${0.04 + Math.random() * 0.06})`
    ctx.lineWidth = 2 + Math.random() * 4
    ctx.beginPath()
    ctx.moveTo(Math.random() * 256, Math.random() * 256)
    ctx.lineTo(Math.random() * 256, Math.random() * 256)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
