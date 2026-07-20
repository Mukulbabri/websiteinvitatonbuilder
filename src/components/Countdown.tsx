import React, { useEffect, useState } from 'react';

interface CountdownProps {
  targetDate: string;
  variant?: 'cards' | 'line';
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, variant = 'cards' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const items = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  if (timeLeft.isExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="font-candlescript text-5xl md:text-6xl text-primary animate-pulse">
          Just Married!
        </h3>
        <p className="font-poppins mt-3 text-wedding-text/80 text-sm md:text-base tracking-wider uppercase">
          Happily ever after has begun
        </p>
      </div>
    );
  }

  if (variant === 'line') {
    return (
      <div className="w-full font-poppins text-wedding-text select-none flex justify-center items-center gap-1.5 md:gap-3 py-1 px-1">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center justify-center min-w-[58px] md:min-w-[70px]">
              <span className="font-bold text-lg md:text-2xl text-primary leading-tight">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#5c3a21]/70 mt-0.5 font-medium">
                {item.label}
              </span>
            </div>
            {index < items.length - 1 && (
              <span className="text-primary/45 font-light text-sm md:text-lg self-center px-0.5 select-none">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-8 p-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-center w-20 h-24 md:w-28 md:h-32 glass-card rounded-2xl border-primary/20 hover:scale-105 transform transition duration-300"
        >
          <span className="font-poppins text-2xl md:text-4xl font-semibold text-primary">
            {String(item.value).padStart(2, '0')}
          </span>
          <span className="font-poppins text-[10px] md:text-xs text-wedding-text/75 uppercase tracking-widest mt-1 md:mt-2">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
