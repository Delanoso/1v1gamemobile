import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

export type BarrelVariant = 'metal-dark' | 'metal-green' | 'metal-yellow' | 'wood'

/** @deprecated Use BarrelVariant */
export type BarrelType = BarrelVariant

/** Weathered painted metal drum body. */
export function hazardBodyTexture(base: string, accent: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)
  // Vertical rust streaks
  for (let i = 0; i < 14; i++) {
    const x = 30 + Math.random() * 450
    const grad = ctx.createLinearGradient(x, 0, x + 20, 512)
    grad.addColorStop(0, 'rgba(80,45,25,0)')
    grad.addColorStop(0.5, 'rgba(90,50,28,0.45)')
    grad.addColorStop(1, 'rgba(70,40,22,0.15)')
    ctx.fillStyle = grad
    ctx.fillRect(x, 0, 22, 512)
  }
  // Paint chips
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(30,28,26,${0.1 + Math.random() * 0.2})`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 8 + Math.random() * 30, 3 + Math.random() * 8)
  }
  // Horizontal rib shading
  for (const y of [170, 340]) {
    ctx.fillStyle = accent
    ctx.globalAlpha = 0.25
    ctx.fillRect(0, y, 512, 14)
    ctx.globalAlpha = 1
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function greenWasteBodyTexture(): THREE.CanvasTexture {
  const tex = hazardBodyTexture('#6ab828', '#5a9a20')
  const ctx = (tex.image as HTMLCanvasElement).getContext('2d')!
  // Waste stencil text band
  ctx.fillStyle = '#1a1c20'
  ctx.font = 'bold 38px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('WASTE - DO NOT OPEN!', 256, 470)
  ctx.fillText('WASTE - DO NOT OPEN!', 256, 60)
  tex.needsUpdate = true
  return tex
}

export function yellowHazardBodyTexture(): THREE.CanvasTexture {
  return hazardBodyTexture('#d4b820', '#c0a418')
}

export function biohazardDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#b82830'
  ctx.beginPath()
  ctx.arc(128, 128, 118, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#101010'
  // Biohazard trefoil
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2
    const cx = 128 + Math.cos(a) * 38
    const cy = 128 + Math.sin(a) * 38
    ctx.beginPath()
    ctx.arc(cx, cy, 36, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(128, 128, 18, 0, Math.PI * 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function radiationDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#101010'
  ctx.beginPath()
  ctx.moveTo(128, 24)
  ctx.lineTo(232, 208)
  ctx.lineTo(24, 208)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#e8e8e8'
  // Trefoil blades
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2
    ctx.save()
    ctx.translate(128, 138)
    ctx.rotate(a)
    ctx.fillRect(-14, -70, 28, 52)
    ctx.beginPath()
    ctx.arc(0, -70, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(128, 138, 16, 0, Math.PI * 2)
  ctx.fillStyle = '#101010'
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function toxicSkullDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#101010'
  ctx.beginPath()
  ctx.moveTo(128, 24)
  ctx.lineTo(232, 208)
  ctx.lineTo(24, 208)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#e8e8e8'
  ctx.beginPath()
  ctx.ellipse(128, 118, 36, 42, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#101010'
  ctx.beginPath()
  ctx.ellipse(114, 110, 10, 14, 0, 0, Math.PI * 2)
  ctx.ellipse(142, 110, 10, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function rustyLidTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#8a9098'
  ctx.fillRect(0, 0, 256, 256)
  const grad = ctx.createRadialGradient(140, 120, 10, 128, 128, 120)
  grad.addColorStop(0, 'rgba(70,40,22,0.85)')
  grad.addColorStop(1, 'rgba(90,50,28,0.2)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

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
