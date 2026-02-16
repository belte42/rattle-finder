<script lang="ts">
  import { Plus, Minus, Power, HeartPulse, CircleAlert } from 'lucide-svelte'
  import {
    MIN_RANGE,
    MAX_RANGE,
    MIN_SWEEP_SPEED,
    MAX_SWEEP_SPEED,
    MANUAL_FREQ_STEP,
  } from './consts'

  interface RattleRecord {
    frequency: number
    name: string
  }

  interface Props {
    frequency?: number
    pulseEnabled?: boolean
    pan?: number
    audioActive?: boolean
    warningDismissed?: boolean
    rattleRecords?: RattleRecord[]
    setFreq: (hz: number) => void
    togglePulse?: () => void
    onPanSlider?: (e: Event) => void
    onSelectRattle?: (r: RattleRecord) => void
    ensureStarted?: () => Promise<boolean>
    kill?: () => void
    onOpenRattleTest?: () => void
  }

  let {
    frequency = $bindable(100),
    pulseEnabled = false,
    pan = 0,
    audioActive = false,
    warningDismissed = false,
    rattleRecords = [],
    setFreq,
    togglePulse,
    onPanSlider,
    onSelectRattle,
    ensureStarted,
    kill,
    onOpenRattleTest,
  }: Props = $props()

  function panLabel() {
    if (pan <= -0.5) return 'L'
    if (pan >= 0.5) return 'R'
    return 'C'
  }
</script>

<!-- Frequency display -->
<div class="mb-4 flex flex-1 flex-col items-center justify-center gap-2">
  <p class="text-sm uppercase tracking-wider text-slate-500">Frequency</p>
  <p class="text-5xl font-bold tabular-nums text-slate-50 sm:text-6xl">
    {frequency} Hz
  </p>
</div>

<!-- Frequency controls: vertical slider + +/- -->

<div class="mb-6 flex items-center justify-center gap-4">
  <button
    type="button"
    class="btn-tactile flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-500 hover:bg-slate-700"
    onclick={() => setFreq(frequency - MANUAL_FREQ_STEP)}
  >
    <Minus class="h-7 w-7" />
  </button>
  <div class="flex h-32 flex-col items-center justify-center gap-2">
    <span class="text-xs text-slate-500">500</span>
    <input
      type="range"
      min={MIN_RANGE}
      max={MAX_RANGE}
      step="1"
      value={frequency}
      oninput={(e) => {
        setFreq(Number(e.currentTarget.value))
      }}
      class="w-full cursor-pointer accent-slate-400"
      aria-label="Frequency sweep"
    />
    <span class="text-xs text-slate-500">20</span>
  </div>
  <div class="flex flex-col gap-2">
    <button
      type="button"
      class="btn-tactile flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-500 hover:bg-slate-700"
      onclick={() => setFreq(frequency + MANUAL_FREQ_STEP)}
    >
      <Plus class="h-7 w-7" />
    </button>
  </div>
</div>

<!-- Pulse mode toggle -->
<div class="mb-6 flex justify-center">
  <button
    type="button"
    class="btn-tactile flex items-center gap-2 rounded-xl px-6 {pulseEnabled
      ? 'border-2 border-amber-500 bg-amber-500/20 text-amber-400'
      : 'border-2 border-slate-600 bg-slate-800 text-slate-400'}"
    onclick={togglePulse}
  >
    <HeartPulse class="h-6 w-6" />
    <span>Pulse (1s on/off)</span>
  </button>
</div>

<!-- Panning -->
<div class="mb-6 px-2">
  <p class="mb-2 text-center text-sm text-slate-500">Pan: {panLabel()}</p>
  <div class="flex items-center gap-2">
    <span class="text-xs text-slate-600">L</span>
    <input
      type="range"
      min="-1"
      max="1"
      step="0.01"
      value={pan}
      oninput={onPanSlider}
      class="flex-1 cursor-pointer accent-slate-400"
      aria-label="Stereo pan"
    />
    <span class="text-xs text-slate-600">R</span>
  </div>
</div>

<!-- Saved rattles (from rattle test) -->
<div class="mb-6">
  <p class="mb-2 text-sm text-slate-500">Saved rattles</p>
  {#if rattleRecords.length === 0}
    {#if onOpenRattleTest}
      <button
        type="button"
        class="btn-tactile w-full rounded-xl border-2 border-slate-600 bg-slate-800 px-4 py-3 text-center text-sm text-slate-200 hover:border-slate-500 hover:bg-slate-700"
        onclick={onOpenRattleTest}
      >
        Rattle Test
      </button>
    {:else}
      <p
        class="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-center text-sm text-slate-500"
      >
        Run a rattle test and tap “Rattle!” to save frequencies here.
      </p>
    {/if}
  {:else}
    <div class="grid grid-cols-2 gap-3">
      {#each rattleRecords as r}
        <button
          type="button"
          class="btn-tactile rounded-xl border-2 border-slate-600 bg-slate-800 py-4 text-slate-200 hover:border-slate-500 hover:bg-slate-700"
          onclick={() => onSelectRattle?.(r)}
        >
          <span class="font-semibold"
            >{r.name.trim() || `${r.frequency} Hz`}</span
          >
          {#if r.name.trim()}
            <span class="block text-sm text-slate-500">{r.frequency} Hz</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Start / Kill -->
<div class="flex flex-col gap-3">
  <button
    type="button"
    class="btn-tactile w-full rounded-xl border-2 {audioActive
      ? 'border-red-600 bg-red-600 py-4 text-white hover:border-red-500 hover:bg-red-500'
      : 'border-emerald-600 bg-emerald-600/20 py-4 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/30'}"
    onclick={audioActive ? kill : ensureStarted}
    disabled={!warningDismissed}
  >
    <Power class="mr-2 inline-block h-5 w-5" />
    {audioActive ? 'Stop' : 'Start'}
  </button>
</div>
