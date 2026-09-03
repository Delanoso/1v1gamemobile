import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Worn gunmetal with edge scratches. */
export function weaponMetalTexture(tone = 0): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const g = 72 + tone * 10
  ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 2500; i++) {
    const s = 50 + Math.random() * 40
    ctx.fillStyle = `rgba(${s},${s + 2},${s + 4},0.08)`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 2 + Math.random() * 3)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Weathered wood stock / pump. */
export function weaponWoodTexture(seed = 1): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const base = 100 + seed * 8
  ctx.fillStyle = `rgb(${base},${Math.floor(base * 0.62)},${Math.floor(base * 0.38)})`
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 3) {
    ctx.strokeStyle = `rgba(${Math.floor(base * 0.38)},${Math.floor(base * 0.26)},${Math.floor(base * 0.16)},0.28)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x < 256; x += 18) ctx.lineTo(x, y + Math.sin(x * 0.05 + seed) * 1.5)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function weaponMetalMat(tone = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: weaponMetalTexture(tone),
    color: 0xb0b8c0,
    metalness: 0.38,
    roughness: 0.44,
  })
}

export function weaponBluedMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: weaponMetalTexture(2),
    color: 0x5a646e,
    metalness: 0.34,
    roughness: 0.46,
  })
}

export function weaponWoodMat(seed = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: weaponWoodTexture(seed),
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
  })
}

export function weaponPolyMat(color = 0x3a424a): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.06 })
}

export function weaponLeatherMat(color = 0x5a4030): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0 })
}

export function weaponHeatShieldMat(): THREE.MeshStandardMaterial {
  const { map, alphaMap } = heatShieldMaps()
  return new THREE.MeshStandardMaterial({
    map,
    alphaMap,
    transparent: true,
    side: THREE.DoubleSide,
    metalness: 0.42,
    roughness: 0.4,
    color: 0x9aa4ae,
  })
}

function heatShieldMaps(): { map: THREE.CanvasTexture; alphaMap: THREE.CanvasTexture } {
  const [c, ctx] = canvas(128, 256)
  const [a, actx] = canvas(128, 256)
  ctx.fillStyle = '#6a727a'
  ctx.fillRect(0, 0, 128, 256)
  actx.fillStyle = '#ffffff'
  actx.fillRect(0, 0, 128, 256)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      const x = 14 + col * 14
      const y = row === 0 ? 60 : 140
      ctx.fillStyle = '#3a4248'
      ctx.fillRect(x, y, 9, 22)
      actx.fillStyle = '#000000'
      actx.fillRect(x, y, 9, 22)
    }
  }
  const map = new THREE.CanvasTexture(c)
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.colorSpace = THREE.SRGBColorSpace
  const alphaMap = new THREE.CanvasTexture(a)
  alphaMap.wrapS = alphaMap.wrapT = THREE.RepeatWrapping
  return { map, alphaMap }
}

export function weaponSuppressorMat(heat = false): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: heat ? 0x9a58b8 : 0x4a525a,
    metalness: 0.4,
    roughness: 0.38,
  })
}

export function weaponTapeMat(color = 0xc8ccd0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.02 })
}

export function weaponRubberMat(color = 0x2a2e32): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0 })
}

export function weaponGlassMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x3a5870,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8,
  })
}

export function weaponBrassMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xd8b050,
    metalness: 0.55,
    roughness: 0.32,
  })
}
