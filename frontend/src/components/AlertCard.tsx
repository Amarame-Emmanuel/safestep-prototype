import { memo } from 'react';
import { AlertLevel } from '../../../backend';

interface AlertCardProps {
  alertMessage: string;
  obstacleDistance: number | null;
  obstacleDirection: string | null;
  obstacleLevel: AlertLevel;
}

// Class/icon are derived from the same AlertLevel that NavigationEngine used
// to decide the real vibration, so this can never disagree with what the
// band actually did (previously this had its own 1m/2m thresholds that
// diverged from the backend's 1m/3m zones).
export const AlertCard = memo(function AlertCard({ alertMessage, obstacleDistance, obstacleDirection, obstacleLevel }: AlertCardProps) {
  if (!alertMessage) return null;

  const getAlertClass = () => {
    if (obstacleLevel === 'danger') return 'danger';
    if (obstacleLevel === 'warning') return 'warning';
    return 'info';
  };

  const getAlertIcon = () => {
    if (obstacleLevel === 'danger') return '⚠️';
    if (obstacleLevel === 'warning') return '📍';
    return '✅';
  };

  return (
    <div className={`alert-card ${getAlertClass()}`}>
      <div className="alert-icon">
        {getAlertIcon()}
      </div>
      <div className="alert-message">{alertMessage}</div>

      {obstacleDistance && (
        <div className="alert-details">
          Distance: {obstacleDistance.toFixed(1)}m
          {obstacleDirection && ` | Direction: ${obstacleDirection.toUpperCase()}`}
        </div>
      )}
    </div>
  );
});
