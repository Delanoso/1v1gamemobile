import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Worn gunmetal with edge scratches. */
export function weaponMetalTexture(tone = 0): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const g = 42 + tone * 8
  ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 6000; i++) {
    const s = 30 + Math.random() * 40
    ctx.fillStyle = `rgba(${s},${s + 2},${s + 4},0.1)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 2 + Math.random() * 4)
  }
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(180,190,200,${0.03 + Math.random() * 0.07})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * 512, Math.random() * 512)
    ctx.lineTo(Math.random() * 512, Math.random() * 512)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Weathered wood stock / pump. */
export function weaponWoodTexture(seed = 1): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512)
  const base = 88 + seed * 6
  ctx.fillStyle = `rgb(${base},${Math.floor(base * 0.68)},${Math.floor(base * 0.42)})`
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.04 + seed) * 2 + Math.sin(y * 0.11 + seed * 2) * 1
    ctx.strokeStyle = `rgba(${Math.floor(base * 0.4)},${Math.floor(base * 0.28)},${Math.floor(base * 0.18)},0.22)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y + wave)
    ctx.lineTo(512, y + wave * 0.7)
    ctx.stroke()
  }
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(${base * 0.3},${base * 0.2},${base * 0.12},0.15)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 8, 1)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Stippled polymer grip. */
export function weaponPolyTexture(color = '#2a3038'): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 4000; i++) {
    const b = 20 + Math.random() * 25
    ctx.fillStyle = `rgba(${b},${b + 4},${b + 8},0.35)`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Perforated heat shield — color + alpha vent grid. */
export function heatShieldMaps(): { map: THREE.CanvasTexture; alphaMap: THREE.CanvasTexture } {
  const [c, ctx] = canvas(256, 512)
  const [a, actx] = canvas(256, 512)
  ctx.fillStyle = '#4a5058'
  ctx.fillRect(0, 0, 256, 512)
  actx.fillStyle = '#ffffff'
  actx.fillRect(0, 0, 256, 512)

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 10; col++) {
      const x = 28 + col * 20
      const y = row === 0 ? 120 : 280
      ctx.fillStyle = '#2a3038'
      ctx.fillRect(x, y, 12, 28)
      actx.fillStyle = '#000000'
      actx.fillRect(x, y, 12, 28)
    }
  }
  for (let y = 0; y < 512; y += 16) {
    ctx.strokeStyle = 'rgba(90,98,108,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }

  const map = new THREE.CanvasTexture(c)
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.colorSpace = THREE.SRGBColorSpace
  const alphaMap = new THREE.CanvasTexture(a)
  alphaMap.wrapS = alphaMap.wrapT = THREE.RepeatWrapping
  return { map, alphaMap }
}

/** Suppressor ribbing + heat discoloration. */
export function suppressorTexture(heat = false): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 512)
  ctx.fillStyle = '#343a42'
  ctx.fillRect(0, 0, 128, 512)
  for (let y = 0; y < 512; y += 6) {
    const shade = 48 + (y % 12 === 0 ? 14 : 0)
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 6})`
    ctx.fillRect(0, y, 128, 3)
  }
  if (heat) {
    const grad = ctx.createLinearGradient(0, 0, 0, 90)
    grad.addColorStop(0, 'rgba(200,80,220,0.9)')
    grad.addColorStop(0.3, 'rgba(140,50,180,0.55)')
    grad.addColorStop(1, 'rgba(52,58,66,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 90)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function weaponMetalMat(tone = 0): THREE.MeshStandardMaterial {
  const map = weaponMetalTexture(tone)
  return new THREE.MeshStandardMaterial({
    map,
    color: 0x8a9098,
    metalness: 0.82,
    roughness: 0.38,
  })
}

export function weaponBluedMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: weaponMetalTexture(2),
    color: 0x3a4048,
    metalness: 0.78,
    roughness: 0.42,
  })
}

export function weaponWoodMat(seed = 1): THREE.MeshStandardMaterial {
  const map = weaponWoodTexture(seed)
  return new THREE.MeshStandardMaterial({
    map,
    roughness: 0.82,
    metalness: 0.02,
  })
}

export function weaponPolyMat(color = 0x2a3038): THREE.MeshStandardMaterial {
  const hex = `#${color.toString(16).padStart(6, '0')}`
  return new THREE.MeshStandardMaterial({
    map: weaponPolyTexture(hex),
    color,
    roughness: 0.78,
    metalness: 0.06,
  })
}

export function weaponLeatherMat(color = 0x4a3828): THREE.MeshStandardMaterial {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.08})`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88, metalness: 0 })
}

export function weaponHeatShieldMat(): THREE.MeshStandardMaterial {
  const { map, alphaMap } = heatShieldMaps()
  return new THREE.MeshStandardMaterial({
    map,
    alphaMap,
    transparent: true,
    side: THREE.DoubleSide,
    metalness: 0.75,
    roughness: 0.4,
    color: 0x9aa0a8,
  })
}

export function weaponSuppressorMat(heatTip = false): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: suppressorTexture(heatTip),
    color: heatTip ? 0xffffff : 0x4a5058,
    metalness: 0.82,
    roughness: 0.34,
  })
}

export function weaponTapeMat(color = 0xb8bcc4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0.01 })
}

export function weaponRubberMat(color = 0x1a1c20): THREE.MeshStandardMaterial {
  const [c, ctx] = canvas(128, 128)
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 3) {
    ctx.fillStyle = `rgba(255,255,255,${0.02 + (y % 6 === 0 ? 0.04 : 0)})`
    ctx.fillRect(0, y, 128, 1)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.96, metalness: 0 })
}

export function weaponGlassMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x1a2838,
    metalness: 0.1,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
  })
}

export function weaponBrassMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: weaponMetalTexture(4),
    color: 0xc8a848,
    metalness: 0.92,
    roughness: 0.28,
  })
}
