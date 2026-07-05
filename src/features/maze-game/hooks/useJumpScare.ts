import { useCallback, useEffect, useRef, useState } from 'react';
import { settings } from '../../../data/settings';

export function useJumpScare() {
  const [triggerKey, setTriggerKey] = useState(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTriggeredAtRef = useRef(0);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    },
    [],
  );

  const tryTrigger = useCallback(() => {
    if (!settings.jumpScare.enabled) {
      return false;
    }

    const now = Date.now();
    if (now - lastTriggeredAtRef.current < settings.jumpScare.cooldownMs) {
      return false;
    }
    if (Math.random() >= settings.jumpScare.chancePerTap) {
      return false;
    }

    lastTriggeredAtRef.current = now;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setTriggerKey((current) => current + 1);
    hideTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = null;
      setTriggerKey(0);
    }, settings.jumpScare.durationMs);
    return true;
  }, []);

  return { jumpScareKey: triggerKey, tryTrigger };
}
