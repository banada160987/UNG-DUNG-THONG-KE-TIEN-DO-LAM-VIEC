import { useEffect, useRef } from 'react';

/**
 * Custom hook to automatically refresh data at a given interval.
 * @param {Function} callback - The function to call periodically (usually a fetch function).
 * @param {number} interval - The interval in milliseconds (default: 60000ms = 60s).
 */
export function useAutoRefresh(callback, interval = 60000) {
  const savedCallback = useRef();

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no callback or interval is invalid
    if (!interval || interval <= 0 || !savedCallback.current) {
      return;
    }

    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
}
