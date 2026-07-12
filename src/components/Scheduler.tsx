import React, { useState } from 'react';
import { ScheduleItem, UserRole } from '../types';
import { Clock, MapPin, Plus, Trash2, Calendar, Users } from 'lucide-react';

interface SchedulerProps {
  schedule: ScheduleItem[];
  userRole: UserRole;
  onAddScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  onDeleteScheduleItem: (itemId: string) => void;
}

export default function Scheduler({
  schedule,
  userRole,
  onAddScheduleItem,
  onDeleteScheduleItem
}: SchedulerProps) {
  const [filter, setFilter] = useState<'all' | 'groomsman' | 'bridesmaid'>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [targetSide, setTargetSide] = useState<'groomsman' | 'bridesmaid' | 'all'>('all');

  const filteredSchedule = schedule.filter(item => {
    if (filter === 'all') return true;
    return item.targetSide === filter || item.targetSide === 'all';
  });

  // Sort schedule items by time (simple lexical order since times are standard e.g. "10:00 AM")
  const sortedSchedule = [...filteredSchedule].sort((a, b) => {
    // Basic standard time sorting handler
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
      description: description.trim(),
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

  // Only admin, groomsmen, and bridesmaids (lady side) can add schedule elements
  const canAddItems = userRole === 'admin' || userRole === 'groomsman' || userRole === 'bridesmaid';

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
            Personalized dashboards showing duty coordinates, locations, and designated arrival times.
          </p>
        </div>

        {/* View Filter Toggles */}
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl self-start md:self-auto">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'groomsman', label: 'Groomsmen Side' },
            { key: 'bridesmaid', label: 'Lady Side' }
          ].map(opt => (
            <button
              key={opt.key}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule Timeline */}
        <div className="lg:col-span-8 space-y-4">
          {sortedSchedule.length === 0 ? (
            <div className="bg-white border border-slate-150 rounded-2xl p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-medium">No events scheduled for this view.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 py-2">
              {sortedSchedule.map((item, index) => {
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
                              {item.targetSide === 'all' ? 'All Parties' : item.targetSide === 'groomsman' ? 'Groomsmen' : 'Lady Side'}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-slate-950 text-sm md:text-base tracking-tight mt-1.5">
                            {item.title}
                          </h3>
                        </div>

                        {/* Delete trigger (Admins or creators) */}
                        {userRole === 'admin' && (
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

        {/* Schedule Creator Sidebar Panel (For admin/groomsman/lady side) */}
        {canAddItems && (
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
    </div>
  );
}
