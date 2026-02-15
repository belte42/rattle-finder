/**
 * Car Rattle Finder - Web Audio API Engine
 * Manages a single AudioContext with oscillator, gain, and stereo panning.
 */

const FREQ_MIN = 20
const FREQ_MAX = 500
const DEFAULT_VOLUME = 0.4

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null
  private pannerNode: StereoPannerNode | null = null
  private pulseInterval: ReturnType<typeof setInterval> | null = null
  private isRunning = false
  private frequency = 100
  private pan = 0
  private pulseEnabled = false
  private _gainValue = DEFAULT_VOLUME

  /** Initialize AudioContext (must be called after user interaction) */
  init(): boolean {
    if (this.audioContext) return true
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new Ctx()
      return true
    } catch (e) {
      console.error('Web Audio API not supported:', e)
      return false
    }
  }

  /** Resume context if suspended (browser autoplay policy) */
  async resume(): Promise<boolean> {
    if (!this.audioContext) return false
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    return this.audioContext.state === 'running'
  }

  /** Create and connect audio nodes */
  private _createNodes(): void {
    if (!this.audioContext || this.oscillator) return
    this.oscillator = this.audioContext.createOscillator()
    this.gainNode = this.audioContext.createGain()
    this.pannerNode = this.audioContext.createStereoPanner()

    this.oscillator.type = 'sine'
    this.oscillator.frequency.setValueAtTime(
      this.frequency,
      this.audioContext.currentTime
    )
    this.gainNode.gain.setValueAtTime(
      this._gainValue,
      this.audioContext.currentTime
    )
    this.pannerNode.pan.setValueAtTime(this.pan, this.audioContext.currentTime)

    this.oscillator.connect(this.gainNode)
    this.gainNode.connect(this.pannerNode)
    this.pannerNode.connect(this.audioContext.destination)
  }

  /** Start audio playback */
  async start(): Promise<boolean> {
    if (!this.init()) return false
    if (!(await this.resume())) return false
    if (this.isRunning) return true

    this._createNodes()
    if (this.oscillator) {
      this.oscillator.start()
      this.isRunning = true
      if (this.pulseEnabled) this._startPulse()
    }
    return this.isRunning
  }

  /** Stop audio playback */
  stop(): void {
    this._stopPulse()
    if (this.oscillator) {
      try {
        this.oscillator.stop()
      } catch {
        /* already stopped */
      }
      this.oscillator.disconnect()
      this.oscillator = null
    }
    if (this.gainNode) this.gainNode.disconnect()
    if (this.pannerNode) this.pannerNode.disconnect()
    this.gainNode = null
    this.pannerNode = null
    this.isRunning = false
  }

  /** Emergency kill - stop all audio */
  kill(): void {
    this.stop()
  }

  /** Set frequency (20–500 Hz) */
  setFrequency(hz: number): number {
    const clamped = Math.max(FREQ_MIN, Math.min(FREQ_MAX, Math.round(hz)))
    this.frequency = clamped
    if (this.oscillator && this.audioContext) {
      this.oscillator.frequency.setValueAtTime(
        clamped,
        this.audioContext.currentTime
      )
    }
    return clamped
  }

  /** Set stereo pan (-1.0 = left, 1.0 = right) */
  setPan(value: number): number {
    const clamped = Math.max(-1, Math.min(1, value))
    this.pan = clamped
    if (this.pannerNode && this.audioContext) {
      this.pannerNode.pan.setValueAtTime(clamped, this.audioContext.currentTime)
    }
    return clamped
  }

  /** Set master volume (0.0–1.0) */
  setMasterVolume(value: number): number {
    const clamped = Math.max(0, Math.min(1, value))
    this._gainValue = clamped
    if (this.gainNode && !this.pulseEnabled && this.audioContext) {
      this.gainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime)
    }
    return clamped
  }

  /** Toggle pulse mode (1s on / 1s off) */
  enablePulse(enabled: boolean): void {
    this.pulseEnabled = !!enabled
    if (this.pulseEnabled && this.isRunning) {
      this._startPulse()
    } else {
      this._stopPulse()
      if (this.gainNode && this.audioContext) {
        this.gainNode.gain.setValueAtTime(
          this._gainValue,
          this.audioContext.currentTime
        )
      }
    }
  }

  private _startPulse(): void {
    this._stopPulse()
    let isOn = true
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(
        this._gainValue,
        this.audioContext.currentTime
      )
      this.pulseInterval = setInterval(() => {
        if (!this.gainNode || !this.audioContext) return
        const val = isOn ? 0 : this._gainValue
        this.gainNode.gain.setValueAtTime(val, this.audioContext.currentTime)
        isOn = !isOn
      }, 1000)
    }
  }

  private _stopPulse(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval)
      this.pulseInterval = null
    }
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(
        this._gainValue,
        this.audioContext.currentTime
      )
    }
  }

  /** Cleanup on destroy */
  destroy(): void {
    this.kill()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}
