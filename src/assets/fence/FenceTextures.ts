import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Chain-link weave — bright wires on black holes (used for color + alpha). */
export function chainLinkSurfaceMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = '#949ca4'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  const step = 20
  for (let i = -512; i < 1024; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 512, 512)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, 512)
    ctx.lineTo(i + 512, 0)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function chainLinkRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#b0b0b0'
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
