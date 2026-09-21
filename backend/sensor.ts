import { SensorData, Direction, ObjectType } from './types';
import { log } from './logger';

const DIRECTIONS: Direction[]   = ['LEFT', 'RIGHT', 'CENTER'];
const OBJECT_TYPES: ObjectType[] = ['WALL', 'PILLAR', 'PERSON', 'FURNITURE'];

export class SensorSimulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: ((data: SensorData) => void) | null = null;

  start(callback: (data: SensorData) => void): void {
    this.stop();
    this.callback = callback;

    this.intervalId = setInterval(() => {
      const data: SensorData = {
        distance:   parseFloat((Math.random() * 5).toFixed(2)),
        direction:  DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
        objectType: OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)],
        timestamp:  Date.now(),
      };
      log('[Sensor] Reading:', data);
      if (this.callback) this.callback(data);
    }, 5000);

    log('[Sensor] Simulator started.');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    log('[Sensor] Simulator stopped.');
  }
}
