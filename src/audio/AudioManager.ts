/** Procedural SFX via Web Audio — no asset files needed yet. */
export class AudioManager {
  private ctx: AudioContext | null = null
  private footstepTimer = 0

  init(): void {
    if (this.ctx) return
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
  }

  async resume(): Promise<void> {
    this.init()
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
  }

  playGunshot(ads = false): void {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(ads ? 0.22 : 0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)

    const noise = ctx.createBufferSource()
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = ads ? 900 : 1200
    filter.Q.value = 0.7
    noise.connect(filter)
    filter.connect(gain)
    noise.start(t)
    noise.stop(t + 0.1)

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(ads ? 140 : 180, t)
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.05)
    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.08, t)
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    osc.connect(oscGain)
    oscGain.connect(gain)
    osc.start(t)
    osc.stop(t + 0.07)
  }

  playHit(): void {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.05)
    gain.gain.setValueAtTime(0.12, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.08)
  }

  playReload(): void {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
  ;[0, 0.35, 0.7].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = i === 1 ? 520 : 380
      gain.gain.setValueAtTime(0.08, t + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t + offset)
      osc.stop(t + offset + 0.09)
    })
  }

  playFootstep(sprinting = false): void {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const noise = ctx.createBufferSource()
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = sprinting ? 280 : 220
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(sprinting ? 0.09 : 0.06, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(t)
    noise.stop(t + 0.05)
  }

  tickFootsteps(dt: number, speed: number, sprinting: boolean, grounded: boolean): void {
    if (!grounded || speed < 0.5) {
      this.footstepTimer = 0
      return
    }
    const interval = sprinting ? 0.32 : 0.44
    this.footstepTimer -= dt
    if (this.footstepTimer <= 0) {
      this.playFootstep(sprinting)
      this.footstepTimer = interval
    }
  }
}

export const audio = new AudioManager()
