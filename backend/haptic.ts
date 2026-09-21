import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { PatternName } from './types';
import { log, warn } from './logger';

// Vibration pattern library. All durations in milliseconds.
const patterns: Record<PatternName, number[]> = {
  stop:        [800],                        // long rumble — solid wall dead ahead
  leftPulse:   [150, 80, 150],               // double tap — obstacle on the left
  rightPulse:  [300, 80, 150],               // reversed double tap — obstacle on the right
  centerWarn:  [200, 100, 200, 100, 200],    // rapid triple — object straight ahead, mid-range
  emergency:   [1000, 200, 1000, 200, 1000], // three long bursts — band disconnected
  lowBattery:  [100, 50, 100],               // light double — band battery warning
  connected:   [150],                        // single short — band just connected
};

// Capacitor's Haptics plugin only exposes single-shot vibrations, not
// multi-burst patterns like the browser's navigator.vibrate(array). Replay
// the on/off pattern as a sequence of timed single-shots so real devices
// (native Android/iOS haptics) get the same rhythm as the web fallback.
const fireNativePattern = (pattern: number[]): void => {
  let offset = 0;
  pattern.forEach((ms, i) => {
    if (i % 2 === 0) {
      setTimeout(() => {
        Haptics.vibrate({ duration: ms }).catch(() => {});
      }, offset);
    }
    offset += ms;
  });
};

export class Haptic {
  // intensity (0-100) scales vibration-on durations only, preserving the pause
  // rhythm between bursts. Defaults to 100 so status patterns (connected,
  // lowBattery, emergency) always fire at full strength regardless of the
  // user's obstacle-haptic preference.
  static fire(patternName: PatternName, intensity = 100): void {
    const basePattern = patterns[patternName];
    if (!basePattern) {
      warn(`[Haptic] Unknown pattern: "${patternName}"`);
      return;
    }

    const clampedIntensity = Math.min(100, Math.max(0, intensity));
    const pattern = basePattern.map((ms, i) =>
      i % 2 === 0 ? Math.max(10, Math.round(ms * clampedIntensity / 100)) : ms
    );

    if (Capacitor.isNativePlatform()) {
      fireNativePattern(pattern);
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    } else {
      log(`[Haptic] Vibration not supported. Would fire: "${patternName}"`, pattern);
    }
    log(`[Haptic] Fired: "${patternName}"`, pattern);
  }
}
