import React, { useState } from 'react';
import { ScheduleItem, UserRole } from '../types';
import { Clock, MapPin, Plus, Trash2, Calendar, Users, Printer, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SchedulerProps {
  schedule: ScheduleItem[];
  userRole: UserRole;
  onAddScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  onDeleteScheduleItem: (itemId: string) => void;
  isAdminView?: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  time: string;
  type: 'deadline' | 'rehearsal' | 'fitting' | 'ceremony' | 'payment';
  location?: string;
  notes?: string;
}

export default function Scheduler({
  schedule,
  userRole,
  onAddScheduleItem,
  onDeleteScheduleItem,
  isAdminView = false
}: SchedulerProps) {
  const [filter, setFilter] = useState<'all' | 'groomsman' | 'bridesmaid'>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [targetSide, setTargetSide] = useState<'groomsman' | 'bridesmaid' | 'all'>('all');

  // Calendar state and configuration
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // September 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendarEvents: CalendarEvent[] = [
    { id: 'cal-1', title: 'Tuxfitting & pickup deadline', date: '2026-09-12', time: '10:00 AM', type: 'fitting', location: "Tailor Shop", notes: "All groomsmen must pick up fitted tuxedos before noon." },
    { id: 'cal-2', title: 'Rehearsal dinner walk-thru', date: '2026-09-17', time: '04:30 PM', type: 'rehearsal', location: "West Gardens Arch", notes: "Brief processional walk-through followed by appetizers." },
    { id: 'cal-3', title: 'Hair & makeup arrival', date: '2026-09-18', time: '08:30 AM', type: 'fitting', location: "Grand Bridal Suite", notes: "Breakfast buffet and coffee provided." },
    { id: 'cal-4', title: 'Final RSVP collection', date: '2026-07-20', time: '11:59 PM', type: 'deadline', notes: "Validate final attendee counts." },
    { id: 'cal-5', title: 'The Wedding Ceremony!', date: '2026-09-18', time: '04:00 PM', type: 'ceremony', location: "Elegance Estates Garden", notes: "Doors open for seating at 3:30 PM." },
    { id: 'cal-6', title: 'Final venue balance payment due', date: '2026-08-01', time: '05:00 PM', type: 'payment', notes: "Settle remaining balance with Elegance Estates coordinator." }
  ];

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOffset = new Date(year, month, 1).getDay(); // Sunday = 0

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: startDayOffset }, (_, i) => null);
  const calendarCells = [...emptyCells, ...daysArray];

  // Retrieve date string for a cell
  const getCellDateString = (dayNum: number) => {
    const yearStr = currentDate.getFullYear();
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  };

  // Get daily events merging pre-wedding calendar items with wedding timeline
  const getDayEvents = (dateString: string) => {
    const list: Array<{
      id: string;
      title: string;
      time: string;
      location?: string;
      notes?: string;
      type?: string;
      targetSide?: string;
    }> = [];

    // Add static calendar events
    calendarEvents.forEach(e => {
      if (e.date === dateString) {
        list.push({
          id: e.id,
          title: e.title,
          time: e.time,
          location: e.location,
          notes: e.notes,
          type: e.type,
          targetSide: 'all'
        });
      }
    });

    // If it's the official wedding day (September 18, 2026), load from master schedule timeline!
    if (dateString === '2026-09-18') {
      const filtered = schedule.filter(item => {
        if (filter === 'all') return true;
        return item.targetSide === filter || item.targetSide === 'all';
      });
      filtered.forEach(item => {
        list.push({
          id: item.id,
          title: item.title,
          time: item.time,
          location: item.location,
          notes: item.description,
          type: 'timeline',
          targetSide: item.targetSide
        });
      });
    }

    // Sort list by time standard ordering
    return list.sort((a, b) => {
      const getMinutes = (t: string) => {
        const parts = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!parts) return 0;
        let h = parseInt(parts[1], 10);
        const m = parseInt(parts[2], 10);
        const isPm = parts[3].toUpperCase() === 'PM';
        if (isPm && h < 12) h += 12;
        if (!isPm && h === 12) h = 0;
        return h * 60 + m;
      };
      return getMinutes(a.time) - getMinutes(b.time);
    });
  };

  const getEventTypeStyle = (type: string) => {
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
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const filteredSchedule = schedule.filter(item => {
    if (filter === 'all') return true;
    return item.targetSide === filter || item.targetSide === 'all';
  });

  const sortedSchedule = [...filteredSchedule].sort((a, b) => {
    const getMinutes = (t: string) => {
      const parts = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!parts) return 0;
      let h = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);
      const isPm = parts[3].toUpperCase() === 'PM';
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      return h * 60 + m;
    };
    return getMinutes(a.time) - getMinutes(b.time);
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time.trim() || !location.trim()) return;

    onAddScheduleItem({
      title: title.trim(),
      description: description.trim() || undefined,
      time: time.trim(),
      location: location.trim(),
      targetSide
    });

    setTitle('');
    setDescription('');
    setTime('');
    setLocation('');
    setTargetSide('all');
  };

  // Only Admin has permissions to print schedule or create events
  const isAdmin = userRole === 'admin' && isAdminView;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            Coordinated Schedule & Duties
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse duties and event coordinates on the interactive calendar or view the wedding timeline.
          </p>
        </div>

        {/* View Filter Toggles & Print Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl">
            {[
              { key: 'all', label: 'All Events' },
              { key: 'groomsman', label: 'Groomsmen Side' },
              { key: 'bridesmaid', label: 'Lady Side' }
            ].map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  filter === opt.key
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Only admin can print schedules */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Open printable master timeline"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print Schedule
            </button>
          )}
        </div>
      </div>

      {/* Interactive Month Calendar Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Deadlines & Appointments</span>
            <h3 className="font-display font-bold text-slate-950 text-sm mt-0.5">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          </div>
          <div className="flex gap-1 bg-slate-150/40 p-1 rounded-xl">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Month grid cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 rounded-xl" />;
            }

            const cellDateStr = getCellDateString(day);
            const dayEvents = getDayEvents(cellDateStr);
            const isWeddingDay = day === 18 && currentDate.getMonth() === 8 && currentDate.getFullYear() === 2026; // Highlight wedding day (Sept 18, 2026)

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDate(cellDateStr)}
                type="button"
                className={`aspect-square border rounded-2xl p-2 flex flex-col justify-between transition-all relative text-left group cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                  isWeddingDay
                    ? 'bg-slate-950 border-slate-950 text-white shadow-md'
                    : dayEvents.length > 0
                    ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800'
                    : 'bg-white hover:bg-slate-50/50 border-slate-100 text-slate-600'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-[10px] font-mono font-bold ${isWeddingDay ? 'text-amber-400' : 'text-slate-600'}`}>
                    {day}
                  </span>
                  {isWeddingDay && (
                    <span className="text-[9px] font-bold text-amber-400 bg-white/10 px-1 py-0.5 rounded-md font-mono leading-none">Wedding Day</span>
                  )}
                </div>

                {dayEvents.length > 0 && (
                  <div className="flex flex-col gap-0.5 max-h-[75%] overflow-hidden w-full">
                    {/* Compact visual dot or single small label */}
                    {isWeddingDay ? (
                      <div className="text-[7.5px] px-1 py-0.5 rounded leading-none bg-white/25 text-white font-semibold truncate border border-white/20">
                        {dayEvents.length} Coordinator Events
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {dayEvents.slice(0, 2).map((e, index) => (
                          <div
                            key={e.id}
                            title={e.title}
                            className={`text-[8px] px-1 py-0.5 rounded leading-none truncate border font-medium ${getEventTypeStyle(e.type || '')}`}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[7px] text-slate-400 font-bold font-mono pl-0.5">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main timeline listing and Add scheduled event container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule Timeline */}
        <div className={`space-y-4 ${isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
              Wedding Day Master Timeline
            </h3>
            <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
              September 18, 2026
            </span>
          </div>

          {sortedSchedule.length === 0 ? (
            <div className="bg-white border border-slate-150 rounded-3xl p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-medium">No timeline events scheduled for this view.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200/80 space-y-6 py-2">
              {sortedSchedule.map((item) => {
                const isGroomsman = item.targetSide === 'groomsman';
                const isBridesmaid = item.targetSide === 'bridesmaid';

                return (
                  <div key={item.id} className="relative group">
                    {/* Circle Node indicator */}
                    <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white transition-all ${
                      isGroomsman ? 'border-blue-500' : isBridesmaid ? 'border-purple-400' : 'border-slate-800'
                    }`} />

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-all">
                      {/* Title & metadata */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {item.time}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              isGroomsman 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : isBridesmaid 
                                ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                            }`}>
                              {item.targetSide === 'all' ? 'All Parties' : item.targetSide === 'groomsman' ? 'Groomsmen Side' : 'Lady Side'}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-slate-950 text-sm md:text-base tracking-tight mt-1.5">
                            {item.title}
                          </h3>
                        </div>

                        {/* Delete trigger (Admins or creators) */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove this event: "${item.title}"?`)) {
                                onDeleteScheduleItem(item.id);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {item.description}
                        </p>
                      )}

                      {/* Location Coordinate tag */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono border-t border-slate-50 pt-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{item.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Schedule Creator Sidebar Panel - Only shown in AdminControls */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-display font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-500" />
              Add Scheduled Event
            </h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Event / Duty Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Groom Side Prep & Photos"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Target Role Group</label>
                <select
                  value={targetSide}
                  onChange={(e) => setTargetSide(e.target.value as any)}
                  className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                >
                  <option value="all">Everyone / All Sides</option>
                  <option value="groomsman">Groomsmen Duties only</option>
                  <option value="bridesmaid">Lady Side / Bridesmaids only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Arrival Time</label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Venue Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. South Lawn"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Duty Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Details of what groomsmen or bridesmaid side needs to prepare or execute during this block."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Shared Timeline
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Daily Agenda Slide-over Sheet (Drawer) */}
      <AnimatePresence>
        {selectedDate && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[100]"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[110] border-l border-slate-200 p-6 flex flex-col h-full"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Daily Agenda</span>
                  <h3 className="font-display font-bold text-slate-900 text-base mt-1">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {getDayEvents(selectedDate).length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Calendar className="w-8 h-8 opacity-20 mb-2" />
                    No events or appointments scheduled for this date.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getDayEvents(selectedDate).map((evt) => {
                      const isTimeline = evt.type === 'timeline';
                      const isGroomsman = evt.targetSide === 'groomsman';
                      const isBridesmaid = evt.targetSide === 'bridesmaid';

                      return (
                        <div 
                          key={evt.id} 
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            isTimeline 
                              ? isGroomsman 
                                ? 'border-blue-150 bg-blue-50/10' 
                                : isBridesmaid 
                                ? 'border-purple-150 bg-purple-50/10' 
                                : 'border-slate-150 bg-slate-50/20'
                              : 'border-slate-100 bg-slate-50/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {evt.time}
                            </span>

                            {evt.type && evt.type !== 'timeline' && (
                              <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getEventTypeStyle(evt.type)}`}>
                                {evt.type}
                              </span>
                            )}

                            {isTimeline && (
                              <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                isGroomsman 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                  : isBridesmaid 
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                              }`}>
                                {evt.targetSide === 'all' ? 'All Parties' : evt.targetSide === 'groomsman' ? 'Groomsmen Side' : 'Lady Side'}
                              </span>
                            )}
                          </div>

                          <h4 className="font-display font-bold text-slate-900 text-sm mt-2.5 leading-snug">
                            {evt.title}
                          </h4>

                          {evt.location && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{evt.location}</span>
                            </div>
                          )}

                          {evt.notes && (
                            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed bg-white/50 p-2 rounded-xl border border-slate-100">
                              {evt.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-150 flex gap-2">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Close Agenda
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Print-only schedule section */}
      <div id="print-schedule-root" className="hidden">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              font-size: 11pt !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Hide entire normal page */
            body > * {
              display: none !important;
            }
            /* Show ONLY our printable schedule */
            #print-schedule-root {
              display: block !important;
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 20mm !important;
              box-sizing: border-box !important;
            }
            .print-table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-top: 15px !important;
              margin-bottom: 30px !important;
            }
            .print-table th {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
              border-bottom: 2px solid #cbd5e1 !important;
              font-weight: bold !important;
              text-align: left !important;
              padding: 10px 8px !important;
              font-size: 10pt !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
            }
            .print-table td {
              border-bottom: 1px solid #e2e8f0 !important;
              padding: 12px 8px !important;
              vertical-align: top !important;
              font-size: 10pt !important;
              text-transform: uppercase !important;
            }
            .print-header {
              border-bottom: 3px double #94a3b8 !important;
              padding-bottom: 15px !important;
              margin-bottom: 25px !important;
            }
            .print-title {
              font-size: 24pt !important;
              font-weight: bold !important;
              color: #0f172a !important;
              margin: 0 0 5px 0 !important;
              letter-spacing: -0.5px !important;
            }
            .print-subtitle {
              font-size: 11pt !important;
              color: #475569 !important;
              margin: 0 !important;
              font-style: italic !important;
            }
            .print-badge {
              display: inline-block !important;
              font-size: 8pt !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              border: 1px solid #94a3b8 !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
              background: #f8fafc !important;
            }
            .print-notes-section {
              margin-top: 40px !important;
              border-top: 1px dashed #cbd5e1 !important;
              padding-top: 20px !important;
            }
            .print-notes-title {
              font-size: 12pt !important;
              font-weight: bold !important;
              color: #334155 !important;
              margin-bottom: 15px !important;
            }
            .print-notes-lines {
              height: 120px !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 8px !important;
              background-image: linear-gradient(#f1f5f9 1px, transparent 1px) !important;
              background-size: 100% 24px !important;
              line-height: 24px !important;
            }
          }
        `}} />

        <div className="print-header">
          <h1 className="print-title">Official Wedding Timeline & Duties Itinerary</h1>
          <p className="print-subtitle">
            Master Coordination Timeline — Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Time</th>
              <th style={{ width: '35%' }}>Event / Duty Title</th>
              <th style={{ width: '20%' }}>Location</th>
              <th style={{ width: '15%' }}>Designated Party</th>
            </tr>
          </thead>
          <tbody>
            {sortedSchedule.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '24px' }}>
                  No duties or events scheduled on the master timeline.
                </td>
              </tr>
            ) : (
              sortedSchedule.map((item) => {
                const isGroomsman = item.targetSide === 'groomsman';
                const isBridesmaid = item.targetSide === 'bridesmaid';
                const partyLabel = item.targetSide === 'all' 
                  ? 'All Parties' 
                  : isGroomsman 
                    ? 'Groomsmen Side' 
                    : 'Lady Side';

                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.time}</td>
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.title}</div>
                      {item.description && (
                        <div style={{ fontSize: '9pt', color: '#475569', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.4' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#334155' }}>{item.location}</td>
                    <td>
                      <span className="print-badge">{partyLabel}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="print-notes-section">
          <h3 className="print-notes-title">Coordinator & Party Notes</h3>
          <div className="print-notes-lines"></div>
        </div>
      </div>
    </div>
  );
}
