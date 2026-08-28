import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export class PostPipeline {
  readonly composer: EffectComposer

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
  ) {
    this.composer = new EffectComposer(renderer)
    this.composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.08, 0.25, 0.92)
    this.composer.addPass(bloom)
    this.composer.addPass(new OutputPass())
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height)
  }

  render(): void {
    this.composer.render()
  }
}
