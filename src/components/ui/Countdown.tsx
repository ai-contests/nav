import React, { useEffect, useState } from 'react';

interface CountdownProps {
  deadline: string;
  className?: string;
}

export const Countdown: React.FC<CountdownProps> = ({ deadline, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<'normal' | 'urgent' | 'ended'>('normal');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      
      if (diff <= 0) {
        setTimeLeft('Ended');
        setStatus('ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days < 3) {
        setStatus('urgent');
      } else {
        setStatus('normal');
      }

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        setTimeLeft(`${hours}h left`);
      }
    };

    calculateTimeLeft();
    // Update every minute (no need for second precision for days/hours)
    const timer = setInterval(calculateTimeLeft, 60000); 

    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return null;

  const baseClasses = "inline-flex items-center px-2 py-1 rounded text-xs font-medium";
  const statusClasses = {
    normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
  };

  return (
    <span className={`${baseClasses} ${statusClasses[status]} ${className}`}>
      {status === 'urgent' && <span className="mr-1">🔥</span>}
      {status === 'normal' && <span className="mr-1">⏳</span>}
      {timeLeft}
    </span>
  );
};
