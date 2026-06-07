// Tiny synth tones via WebAudio — no asset files needed.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", startOffset = 0) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ac.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.35, ac.currentTime + startOffset + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startOffset + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + startOffset);
  osc.stop(ac.currentTime + startOffset + duration + 0.02);
}

export function playSuccess() {
  tone(880, 0.12, "triangle", 0);
  tone(1320, 0.18, "triangle", 0.12);
}

export function playError() {
  tone(220, 0.18, "sawtooth", 0);
  tone(160, 0.22, "sawtooth", 0.18);
}
