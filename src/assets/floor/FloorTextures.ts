import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Dark industrial asphalt with aggregate, stains, and worn lane markings. */
export function asphaltColorMap(options?: { laneMarkings?: boolean }): THREE.CanvasTexture {
  const [c, ctx] = canvas(1024, 1024)
  ctx.fillStyle = '#2b2e32'
  ctx.fillRect(0, 0, 1024, 1024)

  // Aggregate speckle
  for (let i = 0; i < 9000; i++) {
    const g = 34 + Math.random() * 34
    ctx.fillStyle = `rgb(${g},${g},${g + 3})`
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }

  // Subtle roller compaction bands
  for (let y = 0; y < 1024; y += 48) {
    ctx.fillStyle = 'rgba(255,255,255,0.015)'
    ctx.fillRect(0, y, 1024, 10)
    ctx.fillStyle = 'rgba(0,0,0,0.02)'
    ctx.fillRect(0, y + 12, 1024, 8)
  }

  // Oil / diesel stains
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const r = 24 + Math.random() * 90
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(8,8,10,0.55)')
    grad.addColorStop(0.6, 'rgba(12,12,14,0.2)')
    grad.addColorStop(1, 'rgba(12,12,14,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // Worn parking line (horizontal stripe through center) — optional; off on map slab to avoid false "walls"
  if (options?.laneMarkings !== false) {
    ctx.fillStyle = 'rgba(210,214,220,0.55)'
    ctx.fillRect(0, 470, 1024, 28)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(0, 498, 1024, 4)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    for (let x = 0; x < 1024; x += 42) {
      ctx.fillRect(x, 472, 22, 24)
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function asphaltRoughnessMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  ctx.fillStyle = '#c4c4c4'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(${170 + Math.random() * 50},${170 + Math.random() * 50},${170 + Math.random() * 50},0.35)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  return tex
}

export function asphaltNormalMap(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const img = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const n = (Math.random() - 0.5) * 18
      const i = (y * 256 + x) * 4
      img.data[i] = 128 + n
      img.data[i + 1] = 128 + n
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  return tex
}

export function puddleMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x4a5868,
    metalness: 0.65,
    roughness: 0.12,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  })
}

export function crackDecalTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.clearRect(0, 0, 256, 256)
  ctx.strokeStyle = 'rgba(18,20,24,0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(40, 180)
  ctx.lineTo(90, 140)
  ctx.lineTo(120, 155)
  ctx.lineTo(170, 95)
  ctx.stroke()
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(100, 200)
  ctx.lineTo(130, 170)
  ctx.lineTo(155, 175)
  ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
