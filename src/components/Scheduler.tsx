import React, { useState } from 'react';
import { ScheduleItem, UserRole } from '../types';
import { Clock, MapPin, Plus, Trash2, Calendar, Users, Printer } from 'lucide-react';

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

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Open printable master timeline"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Schedule
          </button>
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
                    ? 'Groomsmen' 
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
