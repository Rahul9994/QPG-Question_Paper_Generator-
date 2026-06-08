import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTimer — counts up seconds from 0
 *
 * @param {boolean} running — whether the timer is active
 * @returns { elapsed, formatted, pause, resume, reset }
 */
export function useTimer(running = true) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startRef = useRef(Date.now());

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [running]); // eslint-disable-line

  const pause = useCallback(() => clearTimer(), []);

  const resume = useCallback(() => {
    if (!intervalRef.current) {
      startRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
  }, [elapsed]);

  const reset = useCallback(() => {
    clearTimer();
    setElapsed(0);
    startRef.current = Date.now();
  }, []);

  const formatted = formatSeconds(elapsed);

  return { elapsed, formatted, pause, resume, reset };
}

/**
 * Format seconds → "MM:SS"
 */
export function formatSeconds(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
