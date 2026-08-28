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

export function weatheredPaintTexture(base: string, accent: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 14) {
    const shade = y % 28 === 0 ? accent : base
    ctx.fillStyle = shade
    ctx.fillRect(0, y, 512, 7)
    ctx.fillStyle = 'rgba(0,0,0,0.14)'
    ctx.fillRect(0, y + 7, 512, 7)
  }
  // Edge highlight wash (dry-brush effect)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 30 + Math.random() * 80)
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  for (let i = 0; i < 25; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 60, 4)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function corrugatedNormalMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const img = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const ridge = Math.sin((y / 256) * Math.PI * 32) * 0.5 + 0.5
      const i = (y * 256 + x) * 4
      img.data[i] = 128 + ridge * 45
      img.data[i + 1] = 128 + ridge * 18
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
