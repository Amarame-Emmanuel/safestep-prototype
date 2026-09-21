import { SensorData, Direction, ObjectType, ObstacleDecision } from './types';
import { Haptic } from './haptic';
import { Memory } from './memory';
import { log, warn } from './logger';

const DANGER_ZONE  = 1.0; // metres
const WARNING_ZONE = 3.0; // metres

const DIRECTIONS: Direction[]   = ['LEFT', 'RIGHT', 'CENTER'];
const OBJECT_TYPES: ObjectType[] = ['WALL', 'PILLAR', 'PERSON', 'FURNITURE'];

const isDirection = (value: unknown): value is Direction =>
  typeof value === 'string' && DIRECTIONS.includes(value as Direction);

const isObjectType = (value: unknown): value is ObjectType =>
  typeof value === 'string' && OBJECT_TYPES.includes(value as ObjectType);

const normalizeSensorData = (data: SensorData): SensorData | null => {
  if (
    !Number.isFinite(data.distance) ||
    data.distance < 0 ||
    !isDirection(data.direction) ||
    !isObjectType(data.objectType) ||
    !Number.isFinite(data.timestamp)
  ) {
    warn('[Sensor] Invalid reading ignored:', data);
    return null;
  }

  return {
    ...data,
    distance: Math.min(data.distance, 50),
  };
};

export class NavigationEngine {
  private crowdModeActive = false;
  private hapticIntensity = 70;

  setCrowdMode(isOn: boolean): void {
    this.crowdModeActive = isOn;
    Memory.save('crowdMode', isOn);
    log(`[Navigation] Crowd Mode: ${isOn ? 'ON' : 'OFF'}`);
  }

  setHapticIntensity(intensity: number): void {
    this.hapticIntensity = Math.min(100, Math.max(0, intensity));
  }

  // Single source of truth: this decision drives both the real vibration
  // fired here and the alert/speech/UI shown by the frontend, so the two
  // can never disagree about zone thresholds or Crowd Mode filtering.
  process(data: SensorData): ObstacleDecision | null {
    const safeData = normalizeSensorData(data);
    if (!safeData) return null;

    const { distance, direction, objectType } = safeData;

    // Crowd Mode: ignore people, only react to solid objects
    if (this.crowdModeActive && objectType === 'PERSON') {
      log('[Navigation] Crowd Mode — ignoring person.');
      return { level: 'clear', message: 'Path clear', distance, direction, objectType };
    }

    // Danger zone (< 1m) — stop immediately
    if (distance < DANGER_ZONE) {
      Haptic.fire('stop', this.hapticIntensity);
      return {
        level: 'danger',
        message: `DANGER! ${direction} obstacle ${distance.toFixed(1)} meters!`,
        distance, direction, objectType,
      };
    }

    // Warning zone (1m – 3m) — directional pulses
    if (distance < WARNING_ZONE) {
      if (direction === 'LEFT')   Haptic.fire('leftPulse', this.hapticIntensity);
      if (direction === 'RIGHT')  Haptic.fire('rightPulse', this.hapticIntensity);
      if (direction === 'CENTER') Haptic.fire('centerWarn', this.hapticIntensity);
      return {
        level: 'warning',
        message: `Warning: ${direction} object ${distance.toFixed(1)} meters ahead`,
        distance, direction, objectType,
      };
    }

    // Beyond 3m — clear path
    log('[Navigation] Path clear.');
    return { level: 'clear', message: 'Path clear', distance, direction, objectType };
  }
}
