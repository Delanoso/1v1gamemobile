import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Horizontal plank siding for crate faces. */
export function cratePlankTexture(tone = 0): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const base = 118 + tone * 8
  ctx.fillStyle = `rgb(${base},${base * 0.72},${base * 0.48})`
  ctx.fillRect(0, 0, 512, 512)

  const plankH = 44
  for (let y = 0; y < 512; y += plankH) {
    const shade = base + (y % (plankH * 2) === 0 ? 12 : -6) + Math.sin(y * 0.08) * 4
    ctx.fillStyle = `rgb(${shade},${shade * 0.72},${shade * 0.48})`
    ctx.fillRect(0, y, 512, plankH - 4)
    ctx.fillStyle = 'rgba(30,22,14,0.28)'
    ctx.fillRect(0, y + plankH - 4, 512, 4)
  }

  for (let i = 0; i < 1200; i++) {
    const g = 70 + Math.random() * 40
    ctx.fillStyle = `rgba(${g},${g * 0.75},${g * 0.5},0.05)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Lid planks running along depth. */
export function crateLidTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#9a7858'
  ctx.fillRect(0, 0, 512, 512)
  for (let x = 0; x < 512; x += 56) {
    const shade = 140 + (x % 112 === 0 ? 18 : -8)
    ctx.fillStyle = `rgb(${shade},${shade * 0.75},${shade * 0.52})`
    ctx.fillRect(x, 0, 50, 512)
    ctx.fillStyle = 'rgba(25,18,12,0.3)'
    ctx.fillRect(x + 50, 0, 6, 512)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Darker frame / edge trim wood. */
export function crateFrameTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128)
  ctx.fillStyle = '#5a4030'
  ctx.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? '#6a5040' : '#4a3428'
    ctx.fillRect(0, y, 128, 6)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Weathered metal corner bracket. */
export function crateBracketTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(64, 64)
  ctx.fillStyle = '#3a3834'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = 'rgba(90,55,30,0.35)'
  ctx.fillRect(0, 48, 64, 16)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function stencilDecalTexture(label: string, sublabel?: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.clearRect(0, 0, 256, 256)
  ctx.fillStyle = '#1a1814'
  ctx.font = 'bold 34px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(label, 128, sublabel ? 108 : 138)
  if (sublabel) {
    ctx.font = '18px monospace'
    ctx.fillText(sublabel, 128, 148)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function sideUpDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.clearRect(0, 0, 256, 256)
  ctx.fillStyle = '#1a1814'
  ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('THIS SIDE', 128, 100)
  ctx.fillText('UP', 128, 128)
  // Arrow
  ctx.beginPath()
  ctx.moveTo(128, 155)
  ctx.lineTo(128, 210)
  ctx.lineWidth = 6
  ctx.strokeStyle = '#1a1814'
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(108, 175)
  ctx.lineTo(128, 155)
  ctx.lineTo(148, 175)
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
