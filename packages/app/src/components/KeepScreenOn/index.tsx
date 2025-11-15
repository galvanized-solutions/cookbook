import React, { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.css';

export default function KeepScreenOn(): JSX.Element {
  const STORAGE_KEY = 'cookbook-keep-screen-on';
  const [isActive, setIsActive] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check if Wake Lock API is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      setIsSupported(true);
      // Load saved preference
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setIsActive(JSON.parse(saved));
      }
    }
  }, []);

  // Request wake lock
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);

        // Handle wake lock release (e.g., when tab becomes inactive)
        lock.addEventListener('release', () => {
          console.log('Wake Lock released');
        });

        return lock;
      }
    } catch (err) {
      console.error('Failed to request wake lock:', err);
    }
    return null;
  }, []);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
      } catch (err) {
        console.error('Failed to release wake lock:', err);
      }
    }
  }, [wakeLock]);

  // Handle toggle
  const handleToggle = useCallback(async () => {
    const newState = !isActive;
    setIsActive(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

    if (newState) {
      await requestWakeLock();
    } else {
      await releaseWakeLock();
    }
  }, [isActive, requestWakeLock, releaseWakeLock]);

  // Apply wake lock on mount if preference is saved
  useEffect(() => {
    if (isActive && !wakeLock) {
      requestWakeLock();
    }
  }, [isActive, wakeLock, requestWakeLock]);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLock) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, wakeLock, requestWakeLock]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [wakeLock]);

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={styles.toggleContainer}>
      <label className={styles.toggleLabel} title={isActive ? 'Screen will stay on' : 'Screen may sleep'}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={handleToggle}
          className={styles.toggleInput}
          aria-label={isActive ? 'Disable keep screen on' : 'Enable keep screen on'}
        />
        <span className={styles.toggleSlider}></span>
        <span className={styles.label}> {'Keep Screen On'}</span>
      </label>
    </div>
  );
}
