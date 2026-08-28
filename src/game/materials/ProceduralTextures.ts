import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return [c, ctx]
}

/** Corrugated shipping-container side panel. */
export function corrugatedColorMap(base: string, accent: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 14) {
    const shade = y % 28 === 0 ? accent : base
    ctx.fillStyle = shade
    ctx.fillRect(0, y, 512, 7)
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, y + 7, 512, 7)
  }
  // Rust streaks
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(120,70,40,${0.05 + Math.random() * 0.12})`
    ctx.fillRect(Math.random() * 400, Math.random() * 512, 40 + Math.random() * 120, 3 + Math.random() * 8)
  }
  // Scuffs
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 20 + Math.random() * 60)
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
      img.data[i] = 128 + ridge * 40
      img.data[i + 1] = 128 + ridge * 20
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

export function corrugatedRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#b0b0b0'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? '#d0d0d0' : '#909090'
    ctx.fillRect(0, y, 256, 4)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Dark asphalt with cracks and oil stains. */
export function asphaltColorMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(1024, 1024)
  ctx.fillStyle = '#2a2d30'
  ctx.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < 6000; i++) {
    const g = 35 + Math.random() * 30
    ctx.fillStyle = `rgb(${g},${g},${g + 2})`
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1 + Math.random() * 3, 1 + Math.random() * 3)
  }
  // Oil stains
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const r = 30 + Math.random() * 80
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(10,10,12,0.5)')
    grad.addColorStop(1, 'rgba(10,10,12,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 6)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function asphaltRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#c8c8c8'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(${180 + Math.random() * 40},${180 + Math.random() * 40},${180 + Math.random() * 40},0.3)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 6)
  return tex
}

/** Chain-link fence alpha pattern. */
export function chainLinkAlphaMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  for (let i = -128; i < 256; i += 12) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 128, 128)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, 128)
    ctx.lineTo(i + 128, 0)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 2)
  return tex
}

export function woodPalletColorMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#6a5848'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 18) {
    ctx.fillStyle = y % 36 === 0 ? '#7a6858' : '#5a4838'
    ctx.fillRect(0, y, 256, 9)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
