import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

function woodGrain(ctx: CanvasRenderingContext2D, w: number, h: number, base: number, horizontal: boolean): void {
  const steps = horizontal ? Math.ceil(h / 3) : Math.ceil(w / 3)
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const shade = base + Math.sin(t * 40) * 6 + (Math.random() - 0.5) * 8
    ctx.strokeStyle = `rgba(${shade * 0.85},${shade * 0.62},${shade * 0.42},0.18)`
    ctx.lineWidth = 1
    ctx.beginPath()
    if (horizontal) {
      ctx.moveTo(0, i * 3)
      ctx.lineTo(w, i * 3 + Math.sin(i) * 2)
    } else {
      ctx.moveTo(i * 3, 0)
      ctx.lineTo(i * 3 + Math.sin(i) * 2, h)
    }
    ctx.stroke()
  }
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
    woodGrain(ctx, 512, plankH - 5, shade, true)
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
  woodGrain(ctx, 256, 256, 128, true)
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
    woodGrain(ctx, 58, 512, shade, false)
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
  woodGrain(ctx, 256, 256, 80, false)
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
