import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

export type BarrelColor = 'blue' | 'red' | 'green'

const PAINT: Record<BarrelColor, { base: string; accent: string }> = {
  blue: { base: '#2a4a7a', accent: '#345a8e' },
  red: { base: '#7a2a2a', accent: '#8e3434' },
  green: { base: '#2a5a3a', accent: '#346e48' },
}

export function barrelPaintTexture(color: BarrelColor): THREE.CanvasTexture {
  const pal = PAINT[color]
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = pal.base
  ctx.fillRect(0, 0, 512, 512)

  // Horizontal scuffs
  for (let y = 0; y < 512; y += 22) {
    ctx.fillStyle = y % 44 === 0 ? pal.accent : pal.base
    ctx.globalAlpha = 0.35
    ctx.fillRect(0, y, 512, 8)
    ctx.globalAlpha = 1
  }

  // Rust streaks at bottom third
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(110,65,35,${0.08 + Math.random() * 0.14})`
    ctx.fillRect(Math.random() * 512, 340 + Math.random() * 170, 40 + Math.random() * 120, 3 + Math.random() * 8)
  }

  // Oil smear
  ctx.fillStyle = 'rgba(12,14,16,0.2)'
  ctx.fillRect(80, 180, 200, 40)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 2)
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

export function barrelNormalMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const img = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const ridge = Math.sin((y / 256) * Math.PI * 24) * 0.5 + 0.5
      const i = (y * 256 + x) * 4
      img.data[i] = 128 + ridge * 20
      img.data[i + 1] = 128 + ridge * 10
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 2)
  return tex
}
