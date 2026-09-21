import { memo } from 'react';

interface BatteryStatusProps {
  batteryLevel: number;
}

export const BatteryStatus = memo(function BatteryStatus({ batteryLevel }: BatteryStatusProps) {
  return (
    <div className="status-item">
      <span className="status-label">Battery</span>
      <div className="battery-wrapper">
        <div className="battery-body">
          <div 
            className={`battery-fill ${batteryLevel > 50 ? 'high' : batteryLevel > 20 ? 'medium' : 'low'}`} 
            style={{ width: `${batteryLevel}%` }}
          ></div>
        </div>
        <div className="battery-bump"></div>
      </div>
      <span className="status-value">{batteryLevel}%</span>
    </div>
  );
});
