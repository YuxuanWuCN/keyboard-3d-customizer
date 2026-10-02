import { TypingTelemetry } from '../types/audio';

export interface TelemetryInput {
  correctChars: number;
  totalChars: number;
  elapsedMs: number;
  errors: number;
  streak?: number;
}

/**
 * Calculates standard typing telemetry (Gross WPM, Net WPM, Accuracy %, Streak)
 * Standard typing definition: 1 word = 5 keystrokes.
 */
export function calculateTelemetry(input: TelemetryInput): TypingTelemetry {
  const { correctChars, totalChars, elapsedMs, errors, streak = 0 } = input;

  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const elapsedMinutes = elapsedMs / 60000;

  // Protect against division by zero at session start (< 500ms)
  if (elapsedMinutes < 0.0083) {
    // Under 0.5s
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    return {
      wpm: 0,
      rawWpm: 0,
      accuracy,
      totalKeystrokes: totalChars,
      correctKeystrokes: correctChars,
      errorCount: errors,
      streak,
      elapsedSeconds,
    };
  }

  // Gross WPM (Raw speed)
  const rawWpm = Math.round((totalChars / 5) / elapsedMinutes);

  // Net WPM (Penalty for uncorrected errors)
  const netWpm = Math.max(0, Math.round(((correctChars / 5) - errors) / elapsedMinutes));

  // Accuracy percentage (0 - 100%)
  const accuracy =
    totalChars > 0 ? Math.max(0, Math.min(100, Math.round((correctChars / totalChars) * 100))) : 100;

  return {
    wpm: netWpm,
    rawWpm,
    accuracy,
    totalKeystrokes: totalChars,
    correctKeystrokes: correctChars,
    errorCount: errors,
    streak,
    elapsedSeconds,
  };
}

export const SAMPLE_TYPING_PROMPTS: string[] = [
  "The quick brown fox jumps over the lazy dog.",
  "Custom mechanical keyboards feature gasket mounts, CNC aluminum chassis, and tuned switch acoustics.",
  "EveningStar 75 features a signature brass PVD mirror weight and smooth deep thock linear switches.",
  "Thocky linear switches with lubed POM stems and thick PBT keycaps produce an iconic marbly mahjong sound.",
  "Poron sandwich foam and IXPE switch pads absorb high frequency resonance for a solid clean bottom out.",
  "Mechanical typing provides tactile feedback, acoustic resonance, and unmatched keystroke precision.",
  "Mr Suit 80 brings classic tenkeyless elegance with smooth chamfered edges and stainless mirror weight.",
  "Tofu 60 delivers sharp minimalist CNC geometry with an integrated brass weight bar.",
];

export function getRandomPrompt(): string {
  const index = Math.floor(Math.random() * SAMPLE_TYPING_PROMPTS.length);
  return SAMPLE_TYPING_PROMPTS[index];
}
