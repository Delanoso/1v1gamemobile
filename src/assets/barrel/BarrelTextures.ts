import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

export type BarrelType = 'metal' | 'wood'

/** Dark industrial metal with subtle wear. */
export function metalBodyTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#2e3238'
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 18) {
    ctx.fillStyle = y % 36 === 0 ? '#383c44' : '#2a2e34'
    ctx.globalAlpha = 0.4
    ctx.fillRect(0, y, 512, 6)
    ctx.globalAlpha = 1
  }
  for (let i = 0; i < 3000; i++) {
    const g = 40 + Math.random() * 30
    ctx.fillStyle = `rgba(${g},${g},${g + 4},0.06)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Worn red band paint for metal drum hoops. */
export function metalBandTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 64)
  ctx.fillStyle = '#8a2830'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  for (let x = 0; x < 256; x += 12) {
    ctx.fillRect(x, 0, 6, 64)
  }
  ctx.fillStyle = 'rgba(110,65,35,0.25)'
  ctx.fillRect(0, 48, 256, 16)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Skull hazard decal (metal barrel side). */
export function skullDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#8a2830'
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = '#1a1c20'
  // Skull
  ctx.beginPath()
  ctx.ellipse(128, 108, 52, 58, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(88, 145)
  ctx.lineTo(100, 185)
  ctx.lineTo(156, 185)
  ctx.lineTo(168, 145)
  ctx.fill()
  ctx.fillStyle = '#2a1010'
  ctx.beginPath()
  ctx.ellipse(108, 100, 14, 18, 0, 0, Math.PI * 2)
  ctx.ellipse(148, 100, 14, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Vertical wood grain for barrel body. */
export function woodStaveTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 512)
  ctx.fillStyle = '#8a6848'
  ctx.fillRect(0, 0, 256, 512)
  for (let x = 0; x < 256; x += 2) {
    const shade = 105 + Math.sin(x * 0.25) * 22 + Math.random() * 8
    ctx.fillStyle = `rgb(${shade},${shade * 0.78},${shade * 0.55})`
    ctx.fillRect(x, 0, 2, 512)
  }
  // Stave seam lines
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = 'rgba(40,28,18,0.35)'
    ctx.fillRect(x, 0, 2, 512)
  }
  for (let i = 0; i < 5; i++) {
    const kx = 20 + Math.random() * 216
    const ky = 60 + Math.random() * 380
    ctx.fillStyle = 'rgba(50,35,22,0.3)'
    ctx.beginPath()
    ctx.ellipse(kx, ky, 6, 10, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Wood lid plank pattern. */
export function woodLidTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#9a7858'
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 64) {
    ctx.fillStyle = y % 128 === 0 ? '#a88868' : '#8a6848'
    ctx.fillRect(0, y, 512, 58)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect(0, y + 58, 512, 6)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function barrelRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#a0a0a0'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 16) {
    ctx.fillStyle = y % 32 === 0 ? '#c0c0c0' : '#909090'
    ctx.fillRect(0, y, 256, 8)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 2)
  return tex
}
