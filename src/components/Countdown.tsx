import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDateString?: string;
  title?: string;
  description?: string;
}

export default function Countdown({ 
  targetDateString = "2026-09-18T16:00:00",
  title = "The Big Day Awaits",
  description = "Wedding Countdown"
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  // Parse and validate date string robustly
  const parseTargetDate = (dateStr?: string): Date => {
    if (!dateStr || dateStr.trim() === "") {
      return new Date("2026-09-18T16:00:00");
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      return new Date("2026-09-18T16:00:00");
    }
    return parsed;
  };

  const targetDate = parseTargetDate(targetDateString);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const parsedDate = parseTargetDate(targetDateString);
      const difference = parsedDate.getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDateString]);

  const targetDateFormatted = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-full">
      <span className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">{description || "Wedding Countdown"}</span>
      <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight mb-4">{title || "The Big Day Awaits"}</h2>
      
      {timeLeft.isOver ? (
        <div className="font-display text-3xl font-extrabold text-slate-800 animate-pulse py-2">
          🎉 Today is the Wedding! 🎉
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-md w-full mb-4">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Minutes', value: timeLeft.minutes },
            { label: 'Seconds', value: timeLeft.seconds }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col items-center">
              <span className="font-display text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-slate-500 font-medium">
        {targetDateFormatted}
      </p>
    </div>
  );
}
