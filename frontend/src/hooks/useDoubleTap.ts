import React, { useRef, useCallback } from 'react';

export function useDoubleTap(onDoubleTap: () => void, delay = 400) {
  const lastTapTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentTime = new Date().getTime();
      const timeSinceLastTap = currentTime - lastTapTimeRef.current;

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        onDoubleTap();
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = currentTime;
      }
    }
  }, [onDoubleTap, delay]);

  return handleTouchStart;
}
