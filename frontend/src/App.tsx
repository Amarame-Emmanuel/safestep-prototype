import { useState, useCallback, useRef } from 'react';
import './App.css';
import { SafeStep } from '../../backend';
import { useSafeStep } from './hooks/useSafeStep';
import { useDoubleTap } from './hooks/useDoubleTap';
import { ConnectButton } from './components/ConnectButton';
import { AlertCard } from './components/AlertCard';
import { ControlPanel } from './components/ControlPanel';
import { BatteryStatus } from './components/BatteryStatus';
import { HapticFeedbackManager, HapticEvent } from './components/HapticFeedback';

// Caps in-flight haptic feedback visuals so a burst of triggers (or a stalled
// cleanup timer) can't grow this array unbounded.
const MAX_HAPTIC_EVENTS = 5;

function App() {
  const [crowdMode, setCrowdMode] = useState<boolean>(() => SafeStep.init().crowdMode);
  const [hapticIntensity, setHapticIntensity] = useState<number>(70);
  const [voiceGuidance, setVoiceGuidance] = useState<boolean>(true);
  const [alertMessage, setAlertMessage] = useState<string>('');

  const [hapticEvents, setHapticEvents] = useState<HapticEvent[]>([]);
  const hapticIdRef = useRef(0);

  const handleAlert = useCallback((alert: string) => {
    setAlertMessage(alert);
  }, []);

  const currentSpeechPriorityRef = useRef<'high' | 'low'>('low');

  const handleSpeak = useCallback((message: string, priority: 'high' | 'low' = 'low') => {
    if (!('speechSynthesis' in window) || !voiceGuidance) return;

    // Don't let a low-priority message (battery, status chatter) interrupt
    // an in-flight high-priority one (an active danger obstacle warning).
    if (window.speechSynthesis.speaking && priority === 'low' && currentSpeechPriorityRef.current === 'high') {
      return;
    }

    currentSpeechPriorityRef.current = priority;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voiceGuidance]);

  const handleTriggerHaptic = useCallback((intensity: number, distance: number) => {
    setHapticEvents(prev => {
      const next = [...prev, { id: ++hapticIdRef.current, intensity, distance }];
      return next.length > MAX_HAPTIC_EVENTS ? next.slice(next.length - MAX_HAPTIC_EVENTS) : next;
    });
  }, []);

  const handleHapticComplete = useCallback((id: number) => {
    setHapticEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const {
    isConnected,
    isConnecting,
    batteryLevel,
    obstacleDistance,
    obstacleDirection,
    obstacleLevel,
    connect
  } = useSafeStep({
    hapticIntensity,
    onAlert: handleAlert,
    onSpeak: handleSpeak,
    onTriggerHaptic: handleTriggerHaptic
  });

  const handleCrowdModeToggle = useCallback(() => {
    setCrowdMode(prevMode => {
      const newMode = !prevMode;
      SafeStep.setCrowdMode(newMode);
      
      const message = newMode 
        ? 'Crowd mode enabled. Ignoring moving people.'
        : 'Standard mode enabled. Alerting for all obstacles.';
      setAlertMessage(message);
      handleSpeak(message);
      
      return newMode;
    });
  }, [handleSpeak]);

  const handleTouchStart = useDoubleTap(() => {
    if (isConnected) {
      handleCrowdModeToggle();
    }
  });

  return (
    <div onTouchStart={handleTouchStart} style={{ minHeight: '100vh', width: '100%', touchAction: 'manipulation' }}>
      <HapticFeedbackManager events={hapticEvents} onComplete={handleHapticComplete} />
      
      <section id="center">
        <div className="hero">
          <h1 className="app-title">Safe Step</h1>
          <p className="app-subtitle">Haptic Navigation Assistant</p>
        </div>
        
        <div className="status-container">
          <div className={`status-indicator ${isConnected ? 'connected' : isConnecting ? 'searching' : 'disconnected'}`}>
            {isConnected ? '● CONNECTED' : isConnecting ? '◐ SEARCHING' : '○ DISCONNECTED'}
          </div>
          <p className="status-hint">Ensure your band is turned on</p>
        </div>
        
        <ConnectButton 
          isConnected={isConnected} 
          isConnecting={isConnecting} 
          onConnect={connect} 
        />
        
        <AlertCard
          alertMessage={alertMessage}
          obstacleDistance={obstacleDistance}
          obstacleDirection={obstacleDirection}
          obstacleLevel={obstacleLevel}
        />
      </section>
      
      <div className="ticks"></div>
      
      <ControlPanel 
        isConnected={isConnected}
        hapticIntensity={hapticIntensity}
        setHapticIntensity={setHapticIntensity}
        crowdMode={crowdMode}
        onCrowdModeToggle={handleCrowdModeToggle}
        voiceGuidance={voiceGuidance}
        setVoiceGuidance={setVoiceGuidance}
      />
      
      <div className="ticks"></div>
      
      <section id="system-status">
        <div className="status-grid">
          <BatteryStatus batteryLevel={batteryLevel} />

          <div className="status-item">
            <span className="status-label">Mode</span>
            <span className="status-value">{crowdMode ? 'Crowd' : 'Standard'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Haptic</span>
            <span className="status-value">{hapticIntensity}%</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
