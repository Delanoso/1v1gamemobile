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

function woodGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: number,
  horizontal: boolean,
  rng: () => number,
  strength = 0.18,
): void {
  const steps = horizontal ? Math.ceil(h / 2) : Math.ceil(w / 2)
  for (let i = 0; i < steps; i++) {
    const shade = base + Math.sin(i * 0.35) * 8 + (rng() - 0.5) * 10
    ctx.strokeStyle = `rgba(${shade * 0.82},${shade * 0.6},${shade * 0.4},${strength})`
    ctx.lineWidth = 0.5 + rng() * 0.8
    ctx.beginPath()
    if (horizontal) {
      const y = i * 2
      ctx.moveTo(0, y)
      for (let x = 0; x < w; x += 16) {
        ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 1.5 + (rng() - 0.5))
      }
    } else {
      const x = i * 2
      ctx.moveTo(x, 0)
      for (let y = 0; y < h; y += 16) {
        ctx.lineTo(x + Math.sin(y * 0.04 + i) * 1.5 + (rng() - 0.5), y)
      }
    }
    ctx.stroke()
  }
}

/** Unique long-grain slat texture for one plank board. */
export function plankSlatTexture(seed: number, tone = 0): THREE.CanvasTexture {
  const rng = seededRandom(seed)
  const [c, ctx] = canvas(512, 128)
  const base = 102 + tone * 10 + rng() * 18 - 9
  ctx.fillStyle = `rgb(${base},${base * 0.7},${base * 0.44})`
  ctx.fillRect(0, 0, 512, 128)

  woodGrain(ctx, 512, 128, base, false, rng, 0.22)

  // End-grain shadow bands at plank cuts
  const endGrad = (x0: number, dir: number) => {
    const g = ctx.createLinearGradient(x0, 0, x0 + dir * 28, 0)
    g.addColorStop(0, 'rgba(35,22,14,0.55)')
    g.addColorStop(1, 'rgba(35,22,14,0)')
    ctx.fillStyle = g
    ctx.fillRect(dir > 0 ? 0 : 512 + dir * 28, 0, 28, 128)
  }
  endGrad(0, 1)
  endGrad(512, -1)

  // Knots
  const knotCount = rng() > 0.55 ? 1 : rng() > 0.7 ? 2 : 0
  for (let k = 0; k < knotCount; k++) {
    const kx = 60 + rng() * 390
    const ky = 25 + rng() * 78
    const kr = 8 + rng() * 14
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
    grad.addColorStop(0, 'rgba(32,20,12,0.7)')
    grad.addColorStop(0.6, 'rgba(45,28,16,0.35)')
    grad.addColorStop(1, 'rgba(45,28,16,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(kx, ky, kr, kr * 0.75, rng() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // Scratches & tool marks
  for (let i = 0; i < 6 + Math.floor(rng() * 8); i++) {
    const sx = rng() * 512
    const sy = rng() * 128
    ctx.strokeStyle = `rgba(40,28,18,${0.08 + rng() * 0.12})`
    ctx.lineWidth = 0.5 + rng()
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + 20 + rng() * 60, sy + (rng() - 0.5) * 6)
    ctx.stroke()
  }

  // Chipped splinter patches on edges
  for (let i = 0; i < 2 + Math.floor(rng() * 3); i++) {
    const side = rng() > 0.5 ? 0 : 512 - 14
    ctx.fillStyle = `rgba(55,38,24,${0.15 + rng() * 0.2})`
    ctx.fillRect(side, 10 + rng() * 90, 10 + rng() * 18, 4 + rng() * 10)
  }

  // Worn lighter top edge
  const topWear = ctx.createLinearGradient(0, 0, 0, 22)
  topWear.addColorStop(0, 'rgba(200,175,130,0.18)')
  topWear.addColorStop(1, 'rgba(200,175,130,0)')
  ctx.fillStyle = topWear
  ctx.fillRect(0, 0, 512, 22)

  // Bottom grime
  const bot = ctx.createLinearGradient(0, 100, 0, 128)
  bot.addColorStop(0, 'rgba(30,20,12,0)')
  bot.addColorStop(1, 'rgba(30,20,12,0.3)')
  ctx.fillStyle = bot
  ctx.fillRect(0, 0, 512, 128)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function plankSlatNormalMap(seed: number): THREE.CanvasTexture {
  const rng = seededRandom(seed + 913)
  const [c, ctx] = canvas(256, 64)
  ctx.fillStyle = '#8080ff'
  ctx.fillRect(0, 0, 256, 64)
  for (let x = 0; x < 256; x += 2) {
    const bump = 118 + Math.sin(x * 0.15 + seed) * 12 + (rng() - 0.5) * 8
    ctx.fillStyle = `rgb(${bump},${bump},${248})`
    ctx.fillRect(x, 0, 2, 64)
  }
  ctx.fillStyle = '#6868ee'
  ctx.fillRect(0, 58, 256, 6)
  ctx.fillStyle = '#7070f0'
  ctx.fillRect(0, 0, 256, 4)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

export function plankSlatRoughnessMap(seed: number): THREE.CanvasTexture {
  const rng = seededRandom(seed + 411)
  const [c, ctx] = canvas(256, 64)
  ctx.fillStyle = '#b0b0b0'
  ctx.fillRect(0, 0, 256, 64)
  for (let x = 0; x < 256; x += 3) {
    const r = 155 + Math.sin(x * 0.12) * 25 + (rng() - 0.5) * 20
    ctx.fillStyle = `rgb(${r},${r},${r})`
    ctx.fillRect(x, 0, 3, 64)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

/** End-grain cap for plank cut faces. */
export function endGrainTexture(seed: number): THREE.CanvasTexture {
  const rng = seededRandom(seed + 77)
  const [c, ctx] = canvas(64, 128)
  ctx.fillStyle = '#6a5040'
  ctx.fillRect(0, 0, 64, 128)
  for (let r = 6; r < 40; r += 4 + rng() * 3) {
    ctx.strokeStyle = `rgba(40,26,16,${0.25 + rng() * 0.2})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.ellipse(32, 64, r * 0.45, r, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Weathered plank albedo with grain, knots, and edge wear. */
export function cratePlankTexture(tone = 0): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const base = 108 + tone * 10
  ctx.fillStyle = `rgb(${base},${base * 0.7},${base * 0.45})`
  ctx.fillRect(0, 0, 512, 512)

  const plankH = 52
  for (let y = 0; y < 512; y += plankH) {
    const shade = base + (y % (plankH * 2) === 0 ? 14 : -10)
    ctx.fillStyle = `rgb(${shade},${shade * 0.7},${shade * 0.45})`
    ctx.fillRect(0, y + 1, 512, plankH - 5)
    ctx.fillStyle = 'rgba(18,12,8,0.45)'
    ctx.fillRect(0, y + plankH - 4, 512, 4)
    woodGrain(ctx, 512, plankH - 5, shade, true, () => Math.random())
  }

  for (let i = 0; i < 6; i++) {
    const kx = 40 + Math.random() * 430
    const ky = 40 + Math.random() * 430
    const kr = 10 + Math.random() * 22
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
    grad.addColorStop(0, 'rgba(35,22,14,0.55)')
    grad.addColorStop(1, 'rgba(35,22,14,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(kx, ky, kr, kr * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const dirt = ctx.createLinearGradient(0, 380, 0, 512)
  dirt.addColorStop(0, 'rgba(30,22,14,0)')
  dirt.addColorStop(1, 'rgba(30,22,14,0.35)')
  ctx.fillStyle = dirt
  ctx.fillRect(0, 0, 512, 512)

  for (let i = 0; i < 800; i++) {
    const g = 55 + Math.random() * 50
    ctx.fillStyle = `rgba(${g},${g * 0.72},${g * 0.48},0.04)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 3, 1)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function cratePlankNormalMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#8080ff'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 26) {
    ctx.fillStyle = '#7070ee'
    ctx.fillRect(0, y + 22, 256, 4)
  }
  woodGrain(ctx, 256, 256, 128, true, () => Math.random())
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

export function cratePlankRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#b8b8b8'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 26) {
    ctx.fillStyle = '#989898'
    ctx.fillRect(0, y + 22, 256, 3)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Lid planks running along depth. */
export function crateLidTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#8a6848'
  ctx.fillRect(0, 0, 512, 512)
  for (let x = 0; x < 512; x += 64) {
    const shade = 125 + (x % 128 === 0 ? 20 : -12)
    ctx.fillStyle = `rgb(${shade},${shade * 0.72},${shade * 0.48})`
    ctx.fillRect(x + 1, 0, 58, 512)
    woodGrain(ctx, 58, 512, shade, false, () => Math.random())
    ctx.fillStyle = 'rgba(20,14,10,0.4)'
    ctx.fillRect(x + 58, 0, 6, 512)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Darker frame / edge trim wood. */
export function crateFrameTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#4a3428'
  ctx.fillRect(0, 0, 256, 256)
  woodGrain(ctx, 256, 256, 80, false, () => Math.random())
  for (let y = 0; y < 256; y += 10) {
    ctx.fillStyle = y % 20 === 0 ? '#5a4030' : '#3a281e'
    ctx.fillRect(0, y, 256, 7)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Weathered galvanized metal corner bracket. */
export function crateBracketTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128)
  ctx.fillStyle = '#6a6864'
  ctx.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 400; i++) {
    const g = 80 + Math.random() * 40
    ctx.fillStyle = `rgba(${g},${g - 5},${g - 10},0.12)`
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2)
  }
  ctx.fillStyle = 'rgba(80,45,25,0.4)'
  ctx.fillRect(0, 90, 128, 38)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function wornStencilText(ctx: CanvasRenderingContext2D, text: string, y: number, size: number): void {
  ctx.font = `bold ${size}px "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(18,16,12,0.55)'
  ctx.fillText(text, 130, y + 1)
  ctx.fillStyle = 'rgba(28,24,18,0.92)'
  ctx.fillText(text, 128, y)
}

export function stencilDecalTexture(label: string, sublabel?: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 128)
  ctx.clearRect(0, 0, 256, 128)
  wornStencilText(ctx, label, sublabel ? 52 : 72, sublabel ? 26 : 32)
  if (sublabel) wornStencilText(ctx, sublabel, 88, 16)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function sideUpDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.clearRect(0, 0, 256, 256)
  wornStencilText(ctx, 'THIS SIDE', 88, 22)
  wornStencilText(ctx, 'UP', 118, 28)
  ctx.strokeStyle = 'rgba(28,24,18,0.9)'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(128, 145)
  ctx.lineTo(128, 205)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(108, 168)
  ctx.lineTo(128, 145)
  ctx.lineTo(148, 168)
  ctx.fillStyle = 'rgba(28,24,18,0.9)'
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
