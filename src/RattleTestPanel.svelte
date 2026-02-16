<script lang="ts">
  import {
    MIN_RANGE,
    MAX_RANGE,
    MIN_SWEEP_SPEED,
    MAX_SWEEP_SPEED,
  } from './consts'

  interface RattleRecord {
    frequency: number
    name: string
  }

  interface Props {
    rangeMin?: number
    rangeMax?: number
    sweepSpeed?: number
    sweepCurrentFreq?: number
    rattleRecords?: RattleRecord[]
    rattleTestActive?: boolean
    warningDismissed?: boolean
    startRattleTest?: () => void
    stopRattleTest?: () => void
    onRattleClick?: () => void
    clearRattleRecords?: () => void
    kill?: () => void
    rattleMapPosition?: (freq: number) => number
    onSelectRattleForManual?: (r: RattleRecord) => void
  }

  let {
    rangeMin = $bindable(30),
    rangeMax = $bindable(150),
    sweepSpeed = $bindable(10),
    sweepCurrentFreq = 30,
    rattleRecords = $bindable<RattleRecord[]>([]),
    rattleTestActive = false,
    warningDismissed = false,
    startRattleTest,
    stopRattleTest,
    onRattleClick,
    clearRattleRecords,
    kill,
    rattleMapPosition,
    onSelectRattleForManual,
  }: Props = $props()

  function updateName(index: number, name: string) {
    rattleRecords = rattleRecords.map((rec, i) =>
      i === index ? { ...rec, name } : rec
    )
  }
</script>

<div class="flex flex-1 flex-col overflow-auto">


  

  <!-- Current frequency display -->
  <div class="mb-4 flex flex-col items-center gap-1">
    <p class="text-sm uppercase tracking-wider text-slate-500">Current</p>
    <p class="text-4xl font-bold tabular-nums text-slate-50 sm:text-5xl">
      {Math.round(sweepCurrentFreq)} Hz
    </p>
  </div>

    <!-- Range selection -->
    <div class="mb-4 flex gap-4">
      <div class="flex-1">
        <label class="mb-1 block text-xs text-slate-500">From (Hz)</label>
        <input
          type="number"
          min={MIN_RANGE}
          max={MAX_RANGE}
          bind:value={rangeMin}
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
        />
      </div>
      <div class="flex-1">
        <label class="mb-1 block text-xs text-slate-500">To (Hz)</label>
        <input
          type="number"
          min={MIN_RANGE}
          max={MAX_RANGE}
          bind:value={rangeMax}
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
        />
      </div>
    </div>
<!-- Sweep speed -->
<div>
  <label class="mb-1 block text-xs text-slate-500"
    >Sweep speed: {sweepSpeed} Hz/sec</label
  >
  <input
    type="range"
    min={MIN_SWEEP_SPEED}
    max={MAX_SWEEP_SPEED}
    step="0.5"
    bind:value={sweepSpeed}
    class="w-full cursor-pointer accent-slate-400"
  />
</div>
  <!-- Sweep controls -->
  <div class="mb-4 flex gap-3">
    <!-- <button
      type="button"
      class="btn-tactile flex-1 rounded-xl border-2 border-emerald-600 bg-emerald-600/20 py-4 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
      onclick={startRattleTest}
      disabled={!warningDismissed || rattleTestActive || Number(rangeMin) >= Number(rangeMax)}
    >
      <Power class="mr-2 inline-block h-5 w-5" />
      Start Test
    </button>
    <button
      type="button"
      class="btn-tactile flex-1 rounded-xl border-2 border-slate-600 bg-slate-800 py-4 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
      onclick={stopRattleTest}
      disabled={!rattleTestActive}
    >
      Stop
    </button> -->
  </div>

  <!-- Rattle map -->
  <div
    class="mb-4 flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-900/50 p-4"
  >
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-slate-400">Rattle Map</p>
      <button
        type="button"
        class="btn-tactile rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-400 hover:bg-slate-800"
        onclick={clearRattleRecords}
      >
        Clear
      </button>
    </div>
    {#if rattleRecords.length === 0}
      <p class="text-center text-sm text-slate-500">
        No rattles recorded yet. Tap Rattle! when you hear one.
      </p>
    {:else}
      <!-- List -->
      <ul class="mb-4 flex flex-col gap-2">
        {#each rattleRecords as r, i}
          <li
            class="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2"
          >
            <span class="font-mono text-sm text-amber-400 shrink-0">
              {r.frequency} Hz
            </span>
            <input
              type="text"
              value={r.name}
              oninput={(e) => updateName(i, (e.currentTarget as HTMLInputElement).value)}
              placeholder="Name this rattle (e.g. door, dash)"
              class="min-w-0 flex-1 rounded border border-slate-600 bg-slate-700/50 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
              aria-label="Name for rattle at {r.frequency} Hz"
            />
          </li>
        {/each}
      </ul>
      <!-- Visual frequency axis -->
      <div class="relative h-8 w-full rounded bg-slate-800">
        <div class="absolute left-0 top-0 h-full w-full overflow-visible">
          {#each rattleRecords as r}
            <button
              type="button"
              class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-2 hover:ring-offset-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
              style="left: {rattleMapPosition?.(r.frequency) ?? 0}%"
              title={r.name ? `${r.frequency} Hz – ${r.name}. Click to open in Manual.` : `${r.frequency} Hz. Click to open in Manual.`}
              onclick={() => onSelectRattleForManual?.(r)}
              aria-label="Go to Manual at {r.frequency} Hz{r.name ? ` (${r.name})` : ''}"
            ></button>
          {/each}
        </div>
        <div
          class="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[10px] text-slate-500"
        >
          <span
            >{Math.min(Number(rangeMin) || 20, Number(rangeMax) || 500)}</span
          >
          <span
            >{Math.max(Number(rangeMin) || 20, Number(rangeMax) || 500)} Hz</span
          >
        </div>
      </div>
    {/if}
  </div>
  <button
    type="button"
    class="btn-tactile mb-4 w-full rounded-xl border-2 border-amber-500 bg-amber-500/20 py-4 text-lg font-bold text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
    onclick={onRattleClick}
    disabled={!rattleTestActive}
  >
    Rattle!
  </button>
  <button
    type="button"
    class="btn-tactile w-full rounded-xl border-2 {rattleTestActive
      ? 'border-red-600 bg-red-600 py-4 text-white hover:border-red-500 hover:bg-red-500'
      : 'border-emerald-600 bg-emerald-600/20 py-4 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/30'}"
    onclick={rattleTestActive ? stopRattleTest : startRattleTest}
  >
    {rattleTestActive ? 'Stop Test' : 'Start Test'}
  </button>
</div>
