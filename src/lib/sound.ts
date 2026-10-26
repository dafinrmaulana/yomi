let ctx: AudioContext | null = null

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.09) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
  o.connect(g).connect(ctx.destination)
  o.start(ctx.currentTime + start)
  o.stop(ctx.currentTime + start + dur + 0.05)
}

function ready() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return true
  } catch {
    return false
  }
}

export const sfx = {
  correct(combo = 0) {
    if (!ready()) return
    const base = 523.25 * Math.pow(1.0595, Math.min(combo, 7))
    tone(base, 0, 0.12, 'triangle')
    tone(base * 1.5, 0.08, 0.2, 'triangle')
  },
  wrong() {
    if (!ready()) return
    tone(196, 0, 0.18, 'sawtooth', 0.06)
    tone(147, 0.12, 0.28, 'sawtooth', 0.06)
  },
  finish() {
    if (!ready()) return
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle'))
  },
  fail() {
    if (!ready()) return
    ;[330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.35, 'sawtooth', 0.06))
  },
  tap() {
    if (!ready()) return
    tone(660, 0, 0.05, 'square', 0.03)
  },
}
