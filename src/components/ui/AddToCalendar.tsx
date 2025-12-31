import React, { useState } from 'react';

interface AddToCalendarProps {
  title: string;
  description?: string;
  deadline: string; // ISO string
  url: string;
  className?: string;
}

export const AddToCalendar: React.FC<AddToCalendarProps> = ({
  title,
  description = '',
  deadline,
  url,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to format date for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const getGoogleUrl = () => {
    const endDate = new Date(deadline);
    // Assume event is 1 hour long ending at deadline, or just deadline as start?
    // Let's set it as a 1 hour block ENDING at the deadline, as strictly speaking it's a deadline.
    // Or better: Start = Deadline, End = Deadline + 1h (Remind me AT deadline)
    const startDate = endDate;
    const finalDate = new Date(endDate.getTime() + 60 * 60 * 1000); // +1 hour

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[Deadline] ${title}`,
      dates: `${formatDate(startDate)}/${formatDate(finalDate)}`,
      details: `${description}\n\nLink: ${url}`,
      location: url,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const downloadIcs = () => {
    const endDate = new Date(deadline);
    const startDate = endDate;
    const finalDate = new Date(endDate.getTime() + 60 * 60 * 1000);
    
    // Simple ICS format
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Contest Navigator//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(finalDate)}`,
      `SUMMARY:[Deadline] ${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')} - Link: ${url}`,
      `URL:${url}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `contest-deadline.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        title="Add to Calendar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Remind Me</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
            <a
              href={getGoogleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Google Calendar
            </a>
            <button
              onClick={() => {
                downloadIcs();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Outlook / Apple (.ics)
            </button>
          </div>
        </>
      )}
    </div>
  );
};
