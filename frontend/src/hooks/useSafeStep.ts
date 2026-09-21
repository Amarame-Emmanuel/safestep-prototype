import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeStep, ObstacleDecision, ConnectionStatus, AlertLevel } from '../../../backend';

interface UseSafeStepProps {
  hapticIntensity: number;
  onAlert: (alert: string) => void;
  onSpeak: (message: string, priority?: 'high' | 'low') => void;
  onTriggerHaptic: (intensity: number, distance: number) => void;
}

// How much a low-battery reading must drop before we announce it again,
// since the reading now drains continuously while below the threshold.
const BATTERY_ANNOUNCE_STEP = 5;

export function useSafeStep({ hapticIntensity, onAlert, onSpeak, onTriggerHaptic }: UseSafeStepProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(90);
  const [obstacleDistance, setObstacleDistance] = useState<number | null>(null);
  const [obstacleDirection, setObstacleDirection] = useState<string | null>(null);
  const [obstacleLevel, setObstacleLevel] = useState<AlertLevel>('clear');

  const hapticRef = useRef(hapticIntensity);
  useEffect(() => { hapticRef.current = hapticIntensity; }, [hapticIntensity]);

  useEffect(() => {
    SafeStep.setHapticIntensity(hapticIntensity);
  }, [hapticIntensity]);

  const lastSpokenAlertRef = useRef<string | null>(null);
  const lastAnnouncedBatteryRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      SafeStep.disconnect();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Zone thresholds and Crowd Mode filtering all live in NavigationEngine now,
  // so the alert shown/spoken here can never disagree with the real vibration.
  const handleSensorData = useCallback((decision: ObstacleDecision) => {
    setObstacleDistance(decision.distance);
    setObstacleDirection(decision.direction);
    setObstacleLevel(decision.level);

    onAlert(decision.message);

    if (decision.level === 'clear') {
      lastSpokenAlertRef.current = null;
      return;
    }

    const intensity = decision.level === 'danger'
      ? Math.min(100, hapticRef.current + 20)
      : Math.max(30, hapticRef.current - 20);

    onTriggerHaptic(intensity, decision.distance);

    // Only re-speak when the message actually changed, so a burst of
    // identical readings doesn't keep interrupting/restarting speech.
    if (decision.message !== lastSpokenAlertRef.current) {
      lastSpokenAlertRef.current = decision.message;
      onSpeak(decision.message, decision.level === 'danger' ? 'high' : 'low');
    }
  }, [onAlert, onSpeak, onTriggerHaptic]);

  const connect = useCallback(() => {
    if (!isConnected && !isConnecting) {
      setIsConnecting(true);
      onAlert('Searching for band...');
      
      SafeStep.connect(
        (status: ConnectionStatus, data: number | null) => {
          if (status === 'connected') {
            setIsConnecting(false);
            setIsConnected(true);
            lastAnnouncedBatteryRef.current = null;
            onAlert('Band connected successfully');
            onSpeak('Band connected. Navigation system active.', 'low');
          } else if (status === 'disconnected') {
            setIsConnected(false);
            onAlert('Band disconnected! Connection lost.');
            onSpeak('Emergency. Band disconnected.', 'high');
            setObstacleDistance(null);
            setObstacleDirection(null);
            setObstacleLevel('clear');
          } else if (status === 'low_battery' && data !== null) {
            setBatteryLevel(data);
            // Battery now drains continuously while below the threshold, so
            // only re-announce every BATTERY_ANNOUNCE_STEP percent instead of
            // speaking on every 2s heartbeat.
            if (
              lastAnnouncedBatteryRef.current === null ||
              data <= lastAnnouncedBatteryRef.current - BATTERY_ANNOUNCE_STEP
            ) {
              lastAnnouncedBatteryRef.current = data;
              onSpeak(`Warning. Band battery at ${data} percent.`, 'low');
            }
          }
        },
        handleSensorData
      );
    } else if (isConnected) {
      SafeStep.disconnect();
      setIsConnected(false);
      onAlert('Band disconnected manually');
      onSpeak('Band disconnected.', 'low');
      SafeStep.vibrate('lowBattery');
      setObstacleDistance(null);
      setObstacleDirection(null);
      setObstacleLevel('clear');
    }
  }, [isConnected, isConnecting, handleSensorData, onAlert, onSpeak]);

  return {
    isConnected,
    isConnecting,
    batteryLevel,
    obstacleDistance,
    obstacleDirection,
    obstacleLevel,
    connect
  };
}
