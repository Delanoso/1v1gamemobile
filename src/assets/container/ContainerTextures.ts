import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

const RIB_COUNT = 28

/** Sharp trapezoid ridge 0–1 across one rib period. */
function ribProfile(phase: number, sharpness = 0.5): number {
  const tri = 1 - Math.abs((phase % 1) * 2 - 1)
  return Math.pow(tri, sharpness)
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
  // Vertical corrugation shading over stripes
  for (let x = 0; x < 512; x++) {
    const phase = (x / 512) * RIB_COUNT
    const ridge = ribProfile(phase, 0.48)
    ctx.fillStyle = `rgba(0,0,0,${0.06 + (1 - ridge) * 0.14})`
    ctx.fillRect(x, 0, 1, 512)
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

/** Painted metal with readable vertical corrugation in albedo. */
export function weatheredPaintTexture(base: string, accent: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)

  for (let x = 0; x < 512; x++) {
    const phase = (x / 512) * RIB_COUNT
    const ridge = ribProfile(phase, 0.45)
    const shadow = 1 - ridge
    ctx.fillStyle = ridge > 0.55 ? accent : base
    ctx.globalAlpha = 0.18 + shadow * 0.28
    ctx.fillRect(x, 0, 1, 512)
    if (ridge > 0.82) {
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
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
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
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

/** Strong corrugated normal — sharp vertical ribs. */
export function corrugatedNormalMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const img = ctx.createImageData(512, 512)
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const phase = (x / 512) * RIB_COUNT
      const ridge = ribProfile(phase, 0.42)
      const prev = ribProfile(phase - 0.04, 0.42)
      const next = ribProfile(phase + 0.04, 0.42)
      const slope = (next - prev) * 2.8
      const i = (y * 512 + x) * 4
      img.data[i] = Math.max(0, Math.min(255, 128 + slope * 55))
      img.data[i + 1] = Math.max(0, Math.min(255, 128 + ridge * 18))
      img.data[i + 2] = Math.max(0, Math.min(255, 220 + ridge * 20))
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Valleys rougher, ridge crests slightly shinier. */
export function corrugatedRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const img = ctx.createImageData(512, 512)
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const phase = (x / 512) * RIB_COUNT
      const ridge = ribProfile(phase, 0.42)
      const rough = 200 - ridge * 55 + Math.sin(x * 0.17 + y * 0.23) * 5
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
