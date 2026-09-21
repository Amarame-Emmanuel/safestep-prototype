import React, { memo } from 'react';

interface ConnectButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
}

export const ConnectButton = memo(function ConnectButton({ isConnected, isConnecting, onConnect }: ConnectButtonProps) {
  const getButtonText = (): string => {
    if (isConnected) return '✔ CONNECTED';
    if (isConnecting) return 'SEARCHING...';
    return 'CONNECT BAND';
  };
  
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '220px',
      height: '220px',
      borderRadius: '50%',
      border: '2px solid transparent',
      fontSize: '24px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'var(--mono)'
    };
    
    if (isConnected) {
      return { ...baseStyle, backgroundColor: '#22c55e', color: '#000', boxShadow: '0 0 40px rgba(34, 197, 94, 0.8)' };
    } else if (isConnecting) {
      return { ...baseStyle, backgroundColor: '#94a3b8', color: '#000', animation: 'pulse 1.5s ease-in-out infinite' };
    } else {
      return { ...baseStyle, backgroundColor: '#facc15', color: '#000', boxShadow: '0 0 50px rgba(250, 204, 21, 0.9)' };
    }
  };

  return (
    <button type="button" className="connect-button" onClick={onConnect} style={getButtonStyle()}>
      {getButtonText()}
    </button>
  );
});
