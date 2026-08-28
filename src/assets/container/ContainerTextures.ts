import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Skull-inside-gear logo (reference miniature style). */
export function skullGearDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.clearRect(0, 0, 512, 512)
  ctx.fillStyle = 'rgba(200,205,210,0.92)'
  ctx.strokeStyle = 'rgba(160,165,170,0.95)'
  ctx.lineWidth = 6

  // Gear
  const cx = 256
  const cy = 256
  const teeth = 12
  const outerR = 175
  const innerR = 130
  ctx.beginPath()
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Skull
  ctx.fillStyle = 'rgba(210,215,220,0.95)'
  ctx.beginPath()
  ctx.ellipse(cx, cy - 10, 72, 82, 0, 0, Math.PI * 2)
  ctx.fill()
  // Jaw
  ctx.beginPath()
  ctx.moveTo(cx - 48, cy + 20)
  ctx.lineTo(cx - 30, cy + 70)
  ctx.lineTo(cx + 30, cy + 70)
  ctx.lineTo(cx + 48, cy + 20)
  ctx.closePath()
  ctx.fill()
  // Eyes
  ctx.fillStyle = 'rgba(80,30,30,0.85)'
  ctx.beginPath()
  ctx.ellipse(cx - 28, cy - 18, 18, 24, 0, 0, Math.PI * 2)
  ctx.ellipse(cx + 28, cy - 18, 18, 24, 0, 0, Math.PI * 2)
  ctx.fill()
  // Nose
  ctx.beginPath()
  ctx.moveTo(cx, cy + 2)
  ctx.lineTo(cx - 12, cy + 22)
  ctx.lineTo(cx + 12, cy + 22)
  ctx.closePath()
  ctx.fill()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
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
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  for (let y = 0; y < 512; y += 14) {
    ctx.fillRect(0, y, 512, 7)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Smooth painted metal — subtle weathering, no black stripe gaps. */
export function weatheredPaintTexture(base: string, accent: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)

  // Very subtle vertical corrugation in albedo (shading only, never black gaps)
  for (let x = 0; x < 512; x += 18) {
    const lit = x % 36 === 0
    ctx.fillStyle = lit ? accent : base
    ctx.globalAlpha = 0.22
    ctx.fillRect(x, 0, 9, 512)
    ctx.globalAlpha = 1
  }

  // Fine grain + scuffs
  for (let i = 0; i < 5000; i++) {
    const g = 80 + Math.random() * 40
    ctx.fillStyle = `rgba(${g},${g * 0.9},${g * 0.85},0.04)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  for (let i = 0; i < 35; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 24 + Math.random() * 70)
  }
  // Rust streaks at edges
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(110,65,35,${0.04 + Math.random() * 0.07})`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 30 + Math.random() * 90, 2 + Math.random() * 5)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Gentle corrugated normal — reads as surface detail, not separate slats. */
export function corrugatedNormalMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const img = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const ridge = Math.sin((x / 256) * Math.PI * 24) * 0.5 + 0.5
      const i = (y * 256 + x) * 4
      img.data[i] = 128 + ridge * 22
      img.data[i + 1] = 128 + ridge * 10
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
