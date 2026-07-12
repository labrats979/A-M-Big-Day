import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  time: string;
  type: 'deadline' | 'rehearsal' | 'fitting' | 'ceremony' | 'payment';
  location?: string;
  notes?: string;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // September 2026

  const events: CalendarEvent[] = [
    { id: '1', title: 'Tuxfitting & pickup deadline', date: '2026-09-12', time: '10:00 AM', type: 'fitting', location: "Tailor Shop", notes: "All groomsmen must pick up fitted tuxedos before noon." },
    { id: '2', title: 'Rehearsal dinner walk-thru', date: '2026-09-17', time: '04:30 PM', type: 'rehearsal', location: "West Gardens Arch", notes: "Brief processional walk-through followed by appetizers." },
    { id: '3', title: 'Hair & makeup arrival', date: '2026-09-18', time: '08:30 AM', type: 'fitting', location: "Grand Bridal Suite", notes: "Breakfast buffet and coffee provided." },
    { id: '4', title: 'Final RSVP collection', date: '2026-07-20', time: '11:59 PM', type: 'deadline', notes: "Validate final attendee counts." },
    { id: '5', title: 'The Wedding Ceremony!', date: '2026-09-18', time: '04:00 PM', type: 'ceremony', location: "Elegance Estates Garden", notes: "Doors open for seating at 3:30 PM." },
    { id: '6', title: 'Final venue balance payment due', date: '2026-08-01', time: '05:00 PM', type: 'payment', notes: "Settle remaining balance with Elegance Estates coordinator." }
  ];

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Dynamically calculate days in selected month and year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOffset = new Date(year, month, 1).getDay(); // Sunday = 0

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: startDayOffset }, (_, i) => null);
  const calendarCells = [...emptyCells, ...daysArray];

  const getDayEvents = (dayNum: number) => {
    const yearStr = currentDate.getFullYear();
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const dateString = `${yearStr}-${monthStr}-${dayStr}`;
    return events.filter(e => e.date === dateString);
  };

  const getEventTypeStyle = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'deadline':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'rehearsal':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'fitting':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'ceremony':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'payment':
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-500" />
          Wedding Deadlines & Appointment Calendar
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Stay synchronized with rehearsal dates, tuxedo fittings, final vendor payment schedules, and major milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month grid cells */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/40 rounded-lg" />;
              }

              const dayEvents = getDayEvents(day);
              const isToday = day === 18 && currentDate.getMonth() === 8 && currentDate.getFullYear() === 2026; // Highlight wedding day

              return (
                <div
                  key={`day-${day}`}
                  className={`aspect-square border rounded-xl p-1 flex flex-col justify-between transition-all group ${
                    isToday
                      ? 'bg-slate-900 border-slate-950 text-white shadow-md'
                      : dayEvents.length > 0
                      ? 'bg-slate-50 border-slate-200/80 text-slate-800'
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${isToday ? 'text-amber-300' : 'text-slate-500'}`}>
                    {day}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className="flex flex-col gap-0.5 max-h-[75%] overflow-hidden">
                      {dayEvents.map(e => (
                        <div
                          key={e.id}
                          title={e.title}
                          className={`text-[8px] px-1 py-0.5 rounded leading-none truncate border font-medium ${
                            isToday ? 'bg-slate-800 text-white border-slate-700' : getEventTypeStyle(e.type)
                          }`}
                        >
                          {e.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda column */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
            Upcoming Agenda Appointments
          </h3>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {events.map((event) => {
              const dateObj = new Date(event.date);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div key={event.id} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0 flex gap-3">
                  {/* Date Badge */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[54px] h-[54px] shrink-0 self-start">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold leading-none">
                      {formattedDate.split(' ')[0]}
                    </span>
                    <span className="text-base font-display font-bold text-slate-800 leading-none mt-1">
                      {formattedDate.split(' ')[1]}
                    </span>
                  </div>

                  {/* Agenda content info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded font-bold border ${getEventTypeStyle(event.type)}`}>
                        {event.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-slate-900 text-xs leading-snug">
                      {event.title}
                    </h4>

                    {event.location && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.notes && (
                      <div className="bg-slate-50 rounded p-1.5 text-[9px] text-slate-500 flex items-start gap-1 leading-normal border border-slate-100">
                        <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{event.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
