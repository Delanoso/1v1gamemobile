import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Galvanized chain-link diamond weave for fence mesh panels. */
export function chainLinkAlphaMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2.2
  const step = 14
  for (let i = -256; i < 512; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 256, 256)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, 256)
    ctx.lineTo(i + 256, 0)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function chainLinkColorMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#707880'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? '#7a828a' : '#686e76'
    ctx.fillRect(0, y, 256, 4)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function chainLinkRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128)
  ctx.fillStyle = '#a8a8a8'
  ctx.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(${150 + Math.random() * 40},${150 + Math.random() * 40},${150 + Math.random() * 40},0.4)`
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
