<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { CircleAlert, SlidersHorizontal, TestTubes } from 'lucide-svelte'
  import { AudioEngine } from './lib/audioEngine'
  import ManualPanel from './ManualPanel.svelte'
  import RattleTestPanel from './RattleTestPanel.svelte'

  const STORAGE_KEY = 'rattle-finder-warning-dismissed'

  let frequency = $state(100)
  let pulseEnabled = $state(false)
  let pan = $state(0)
  let audioActive = $state(false)
  let warningDismissed = $state(false)
  let engine: AudioEngine

  // Rattle Test mode
  let rattleTestMode = $state(false)
  let rattleTestActive = $state(false)
  let rangeMin = $state(30)
  let rangeMax = $state(150)
  let sweepSpeed = $state(2)
  let rattleRecords = $state<{ frequency: number; name: string }[]>([])
  let sweepCurrentFreq = $state(30)
  let sweepIntervalId: ReturnType<typeof setInterval> | null = null

  onMount(() => {
    engine = new AudioEngine()
    const stored = localStorage.getItem(STORAGE_KEY)
    warningDismissed = stored === 'true'
  })

  onDestroy(() => {
    stopRattleTest()
    if (engine) engine.destroy()
  })

  async function ensureStarted() {
    if (!engine || !warningDismissed) return false
    const ok = await engine.start()
    if (ok) {
      audioActive = true
      engine.setFrequency(frequency)
      engine.setPan(pan)
      engine.enablePulse(pulseEnabled)
    }
    return ok
  }

  function setFreq(hz: number) {
    frequency = Math.max(20, Math.min(500, Math.round(hz)))
    if (engine) engine.setFrequency(frequency)
  }

  function togglePulse() {
    pulseEnabled = !pulseEnabled
    if (engine) engine.enablePulse(pulseEnabled)
  }

  function onPanSlider(e: Event) {
    const v = Number((e.currentTarget as HTMLInputElement).value)
    pan = v
    if (engine) engine.setPan(pan)
  }

  function selectRattle(r: { frequency: number; name: string }) {
    setFreq(r.frequency)
  }

  function goToManualWithRattle(r: { frequency: number; name: string }) {
    setRattleTestMode(false)
    setFreq(r.frequency)
  }

  function kill() {
    stopRattleTest()
  }

  function dismissWarning() {
    warningDismissed = true
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  function setRattleTestMode(enable: boolean) {
    if (!enable && rattleTestActive) stopRattleTest()
    rattleTestMode = enable
  }

  function startRattleTest() {
    const min = Math.max(20, Math.min(500, Number(rangeMin) || 20))
    const max = Math.max(20, Math.min(500, Number(rangeMax) || 500))
    if (!engine || !warningDismissed || min >= max) return
    engine.start().then((ok) => {
      if (!ok) return
      audioActive = true
      rattleTestActive = true
      engine.enablePulse(false)
      engine.setPan(pan)
      sweepCurrentFreq = min
      engine.setFrequency(sweepCurrentFreq)
      const stepHz = 0.5
      const stepMs = (1000 / sweepSpeed) * stepHz
      sweepIntervalId = setInterval(() => {
        if (!engine) return
        sweepCurrentFreq += stepHz
        if (sweepCurrentFreq > max) {
          stopRattleTest()
          return
        }
        engine.setFrequency(sweepCurrentFreq)
      }, stepMs)
    })
  }

  function stopRattleTest() {
    if (sweepIntervalId) {
      clearInterval(sweepIntervalId)
      sweepIntervalId = null
    }
    rattleTestActive = false
    if (engine) engine.kill()
    audioActive = false
  }

  function onRattleClick() {
    if (rattleTestActive && engine) {
      const freq = Math.round(sweepCurrentFreq)
      rattleRecords = [...rattleRecords, { frequency: freq, name: '' }]
    }
  }

  function clearRattleRecords() {
    rattleRecords = []
  }

  function rattleMapPosition(freq: number) {
    const min = Math.min(Number(rangeMin) || 20, Number(rangeMax) || 500)
    const max = Math.max(Number(rangeMin) || 20, Number(rangeMax) || 500)
    const span = max - min || 1
    return ((freq - min) / span) * 100
  }
</script>

{#if !warningDismissed}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="warning-title"
  >
    <div
      class="max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl"
    >
      <CircleAlert class="mx-auto mb-4 h-16 w-16 text-amber-500" />
      <h2 id="warning-title" class="mb-2 text-xl font-bold text-slate-100">
        Volume Warning
      </h2>
      <p class="mb-6 text-slate-300">
        This app plays test tones for locating car rattles. Use responsibly.
        Start at low volume and avoid prolonged exposure at high levels. Park
        safely before using.
      </p>
      <button
        type="button"
        class="btn-tactile w-full bg-emerald-600 text-white hover:bg-emerald-500"
        onclick={dismissWarning}
      >
        I Understand
      </button>
    </div>
  </div>
{/if}

<main
  class="flex h-full min-h-screen flex-col overflow-hidden bg-slate-950 p-4 text-slate-100 overflow-y-auto"
>
  <!-- Mode toggle -->
  <div class="mb-4 flex rounded-lg border border-slate-700 bg-slate-900 p-1">
    <button
      type="button"
      class="btn-tactile flex flex-1 items-center justify-center gap-2 rounded-md py-2 {!rattleTestMode
        ? 'bg-slate-700 text-slate-100'
        : 'text-slate-500'}"
      onclick={() => setRattleTestMode(false)}
    >
      <SlidersHorizontal class="h-5 w-5" />
      <span>Manual</span>
    </button>
    <button
      type="button"
      class="btn-tactile flex flex-1 items-center justify-center gap-2 rounded-md py-2 {rattleTestMode
        ? 'bg-slate-700 text-slate-100'
        : 'text-slate-500'}"
      onclick={() => setRattleTestMode(true)}
    >
      <TestTubes class="h-5 w-5" />
      <span>Rattle Test</span>
    </button>
  </div>

  {#if rattleTestMode}
    <RattleTestPanel
      bind:rangeMin
      bind:rangeMax
      bind:sweepSpeed
      bind:rattleRecords
      {sweepCurrentFreq}
      {rattleTestActive}
      {warningDismissed}
      {startRattleTest}
      {stopRattleTest}
      {onRattleClick}
      {clearRattleRecords}
      {kill}
      {rattleMapPosition}
      onSelectRattleForManual={goToManualWithRattle}
    />
  {:else}
    <ManualPanel
      bind:frequency
      {pulseEnabled}
      {pan}
      {audioActive}
      {warningDismissed}
      {rattleRecords}
      {setFreq}
      {togglePulse}
      {onPanSlider}
      onSelectRattle={selectRattle}
      {ensureStarted}
      {kill}
    />
  {/if}
</main>
