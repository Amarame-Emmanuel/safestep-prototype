import React, { useEffect } from 'react';

export interface HapticEvent {
  id: number;
  intensity: number;
  distance: number;
}

interface HapticFeedbackProps {
  events: HapticEvent[];
  onComplete: (id: number) => void;
}

export function HapticFeedbackManager({ events, onComplete }: HapticFeedbackProps) {
  return (
    <>
      {events.map((event) => (
        <HapticFeedback key={event.id} event={event} onComplete={onComplete} />
      ))}
    </>
  );
}

function HapticFeedback({ event, onComplete }: { event: HapticEvent; onComplete: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(event.id);
    }, 500);
    return () => clearTimeout(timer);
  }, [event.id, onComplete]);

  return (
    <div 
      className="haptic-feedback"
      style={{
        '--intensity': `${event.intensity}px`,
        '--duration': `${Math.max(0.2, 1 - event.distance / 5)}s`
      } as React.CSSProperties}
    />
  );
}
