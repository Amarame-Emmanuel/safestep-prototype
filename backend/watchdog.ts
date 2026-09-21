import { ConnectionStatus, HeartbeatData } from './types';
import { Haptic } from './haptic';
import { log, warn } from './logger';

const TIMEOUT_MS = 5000;

export class ConnectivityWatchdog {
  private watchdogIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeat: number | null = null;
  private onStatusChange: ((status: ConnectionStatus, data: number | null) => void) | null = null;
  private disconnectNotified = false;
  private simulatedBattery = 90;

  start(statusCallback: (status: ConnectionStatus, data: number | null) => void, onDisconnect: () => void): void {
    this.stop();
    this.onStatusChange = statusCallback;
    this.lastHeartbeat = Date.now();
    this.disconnectNotified = false;
    this._simulateHeartbeats();
    this.watchdogIntervalId = setInterval(() => this._check(onDisconnect), 1000);
    log('[Watchdog] Started.');
  }

  stop(): void {
    if (this.watchdogIntervalId) clearInterval(this.watchdogIntervalId);
    if (this.heartbeatIntervalId) clearInterval(this.heartbeatIntervalId);
    this.watchdogIntervalId = null;
    this.heartbeatIntervalId = null;
    this.lastHeartbeat = null;
    log('[Watchdog] Stopped.');
  }

  receiveHeartbeat(data: HeartbeatData): void {
    this.lastHeartbeat = Date.now();
    const battery = Number.isFinite(data.batteryPercent)
      ? Math.min(100, Math.max(0, data.batteryPercent))
      : 90;
    log(`[Watchdog] Heartbeat received. Battery: ${battery}%`);

    if (battery <= 20) {
      Haptic.fire('lowBattery');
      if (this.onStatusChange) this.onStatusChange('low_battery', battery);
    }
  }

  private _check(onDisconnect: () => void): void {
    if (!this.lastHeartbeat) return;
    const elapsed = Date.now() - this.lastHeartbeat;
    if (elapsed > TIMEOUT_MS && !this.disconnectNotified) {
      this.disconnectNotified = true;
      warn('[Watchdog] Band disconnected! No heartbeat for 5s.');
      Haptic.fire('emergency');
      onDisconnect(); // callback to stop sensor etc.
      if (this.onStatusChange) this.onStatusChange('disconnected', null);
      this.stop(); // no more work to do until the next start()
    }
  }

  private _simulateHeartbeats(): void {
    if (this.heartbeatIntervalId) clearInterval(this.heartbeatIntervalId);
    this.simulatedBattery = 90;
    this.heartbeatIntervalId = setInterval(() => {
      // Rarely drop a beat so the disconnect path is actually reachable in
      // this simulation instead of being permanently dead code (a real BLE
      // link occasionally misses a beat too).
      if (Math.random() < 0.05) {
        warn('[Watchdog] Simulated heartbeat dropped.');
        return;
      }
      this.simulatedBattery = Math.max(0, this.simulatedBattery - 1);
      this.receiveHeartbeat({ batteryPercent: this.simulatedBattery });
    }, 2000);
  }
}
