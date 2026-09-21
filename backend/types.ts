export type PatternName =
  | 'stop'
  | 'leftPulse'
  | 'rightPulse'
  | 'centerWarn'
  | 'emergency'
  | 'lowBattery'
  | 'connected';

export type Direction = 'LEFT' | 'RIGHT' | 'CENTER';
export type ObjectType = 'WALL' | 'PILLAR' | 'PERSON' | 'FURNITURE';
export type ConnectionStatus = 'connected' | 'disconnected' | 'low_battery';

export interface SensorData {
  distance: number;
  direction: Direction;
  objectType: ObjectType;
  timestamp: number;
}

export interface HeartbeatData {
  batteryPercent: number;
}

export interface InitResult {
  crowdMode: boolean;
}

export type AlertLevel = 'danger' | 'warning' | 'clear';

// Single source of truth for "what should the user be told about this reading" —
// produced by NavigationEngine so the real vibration and the UI/speech never disagree.
export interface ObstacleDecision {
  level: AlertLevel;
  message: string;
  distance: number;
  direction: Direction;
  objectType: ObjectType;
}
