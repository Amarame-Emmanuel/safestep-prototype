import { ConnectionStatus, InitResult, PatternName, ObstacleDecision } from './types';
import { Memory } from './memory';
import { Haptic } from './haptic';
import { NavigationEngine } from './navigation';
import { SensorSimulator } from './sensor';
import { ConnectivityWatchdog } from './watchdog';
import { log } from './logger';

// Export types so frontend can import them from backend index
export * from './types';

class SafeStepAPI {
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private connectionSession = 0;
  
  private navigation = new NavigationEngine();
  private sensor = new SensorSimulator();
  private watchdog = new ConnectivityWatchdog();

  init(): InitResult {
    log('[SafeStep] Initialising...');
    const savedCrowdMode = Memory.load<boolean>('crowdMode', false);
    this.navigation.setCrowdMode(savedCrowdMode);
    log('[SafeStep] Ready. Call SafeStep.connect() to start.');
    return { crowdMode: savedCrowdMode };
  }

  connect(
    statusCallback: (status: ConnectionStatus, data: number | null) => void,
    onSensorUpdate: (decision: ObstacleDecision) => void
  ): void {
    log('[SafeStep] Connecting to band...');
    this.connectionSession += 1;
    const session = this.connectionSession;
    if (this.connectionTimeoutId) clearTimeout(this.connectionTimeoutId);

    this.connectionTimeoutId = setTimeout(() => {
      if (session !== this.connectionSession) return;
      log('[SafeStep] Band connected.');
      Haptic.fire('connected');
      statusCallback('connected', null);

      this.sensor.start((data) => {
        const decision = this.navigation.process(data);
        if (decision) onSensorUpdate(decision);
      });
      
      this.watchdog.start(statusCallback, () => {
        this.sensor.stop();
      });
      
      this.connectionTimeoutId = null;
    }, 1500);
  }

  disconnect(): void {
    this.connectionSession += 1;
    if (this.connectionTimeoutId) clearTimeout(this.connectionTimeoutId);
    this.connectionTimeoutId = null;
    this.sensor.stop();
    this.watchdog.stop();
    log('[SafeStep] Disconnected.');
  }

  setCrowdMode(isOn: boolean): void {
    this.navigation.setCrowdMode(isOn);
  }

  setHapticIntensity(intensity: number): void {
    this.navigation.setHapticIntensity(intensity);
  }

  vibrate(patternName: PatternName): void {
    Haptic.fire(patternName);
  }
}

export const SafeStep = new SafeStepAPI();
