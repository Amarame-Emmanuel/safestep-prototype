import { memo } from 'react';

interface ControlPanelProps {
  isConnected: boolean;
  hapticIntensity: number;
  setHapticIntensity: (val: number) => void;
  crowdMode: boolean;
  onCrowdModeToggle: () => void;
  voiceGuidance: boolean;
  setVoiceGuidance: (val: boolean) => void;
}

export const ControlPanel = memo(function ControlPanel({
  isConnected,
  hapticIntensity,
  setHapticIntensity,
  crowdMode,
  onCrowdModeToggle,
  voiceGuidance,
  setVoiceGuidance
}: ControlPanelProps) {
  return (
    <section id="next-steps">
      <div id="haptic-controls">
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#vibration-icon"></use>
        </svg>
        <h2>Haptic Feedback</h2>
        <p>Adjust vibration intensity</p>
        <div className="slider-container">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={hapticIntensity} 
            onChange={(e) => setHapticIntensity(parseInt(e.target.value))} 
            disabled={!isConnected} 
            className="intensity-slider" 
            aria-label="Haptic intensity" 
          />
          <span className="intensity-value">{hapticIntensity}%</span>
        </div>
      </div>
      
      <div id="crowd-mode">
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#people-icon"></use>
        </svg>
        <h2>Crowd Mode</h2>
        <p>Ignore moving people, alert for walls</p>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={crowdMode} 
            onChange={onCrowdModeToggle} 
            disabled={!isConnected} 
            aria-label="Crowd Mode toggle" 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      <div id="voice-guidance">
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#voice-icon"></use>
        </svg>
        <h2>Voice Guidance</h2>
        <p>Spoken obstacle alerts</p>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={voiceGuidance} 
            onChange={(e) => setVoiceGuidance(e.target.checked)} 
            disabled={!isConnected} 
            aria-label="Voice Guidance toggle" 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </section>
  );
});
