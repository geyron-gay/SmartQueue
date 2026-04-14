import React, { useState, useEffect, useRef } from 'react';
import { Timer, Octagon } from 'lucide-react';

const AutoCallTimer = ({ expiresAt, isPaused, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, raw: 0 });
  const hasTriggered = useRef(false);

  useEffect(() => {
    // 1. Safety Check: If no date or it's paused, don't start the clock
    if (!expiresAt || isPaused) return;

    // 2. Format Fix: Laravel timestamps often need a 'T' to be valid ISO
    // This replaces the space between Date and Time with a 'T'
    const targetDate = new Date(expiresAt.replace(' ', 'T')).getTime();

    const tick = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, raw: 0 });
        if (typeof onTimerEnd === 'function' && !hasTriggered.current) {
          hasTriggered.current = true;
          onTimerEnd();
        }
        return false; // Stop the interval
      }

      setTimeLeft({
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        raw: distance
      });
      return true;
    };

    // 3. Kick it off immediately
    tick();

    // 4. Set the 1-second interval
    const interval = setInterval(() => {
      if (!tick()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isPaused, onTimerEnd]); // Dependencies are critical here

  if (!expiresAt) return null;

  const isUrgent = timeLeft.raw < 30000 && !isPaused;

  return (
    <div className={`autocall-timer-pill ${isPaused ? 'is-paused' : ''} ${isUrgent ? 'is-urgent' : ''}`}>
      <div className="timer-icon-wrap">
        {isPaused ? <Octagon size={12} /> : <Timer size={12} className={isUrgent ? 'animate-pulse' : ''} />}
      </div>
      <div className="timer-text">
        <span className="timer-label">{isPaused ? 'PAUSED' : 'AUTO-NEXT'}</span>
        <span className="timer-countdown">
          {timeLeft.minutes.toString().padStart(2, '0')}:
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default AutoCallTimer;