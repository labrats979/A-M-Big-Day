import React, { useState, useEffect } from 'react';
import { Table, Guest } from '../types';
import { 
  Plus, Trash2, X, HelpCircle, Layout, Move, Sparkles, 
  Wine, Circle, Square, Users, UserPlus, Milestone
} from 'lucide-react';

interface SeatingPlannerProps {
  tables: Table[];
  guests: Guest[];
  onAddTable: (table: Omit<Table, 'id'>) => void;
  onDeleteTable: (tableId: string) => void;
  onAssignSeat: (guestId: string, tableId: string | null, seatIndex: number | null) => void;
}

export default function SeatingPlanner({
  tables,
  guests,
  onAddTable,
  onDeleteTable,
  onAssignSeat
}: SeatingPlannerProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(tables[0]?.id || null);
  
  // Custom furniture item form state
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<NonNullable<Table['type']>>('round_table');
  const [seatsCount, setSeatsCount] = useState(8);

  // Local drag coordinates for silky smooth 60fps movement
  const [localPositions, setLocalPositions] = useState<{ [id: string]: { x: number; y: number } }>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Sync prop positions to local coordinate state
  useEffect(() => {
    if (!draggedId) {
      const coords: { [id: string]: { x: number; y: number } } = {};
      tables.forEach(t => {
        coords[t.id] = { x: t.x, y: t.y };
      });
      setLocalPositions(coords);
    }
  }, [tables, draggedId]);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const unseatedGuests = guests.filter(g => !g.tableId && g.rsvpStatus === 'going');

  // Group unseated guests by family for high visibility
  const unseatedByFamily: { [familyName: string]: Guest[] } = {};
  const unseatedIndividuals: Guest[] = [];

  unseatedGuests.forEach(g => {
    if (g.familyName) {
      if (!unseatedByFamily[g.familyName]) {
        unseatedByFamily[g.familyName] = [];
      }
      unseatedByFamily[g.familyName].push(g);
    } else {
      unseatedIndividuals.push(g);
    }
  });

  // Unique list of all families in the whole guest list (seated + unseated)
  const allFamilies = Array.from(new Set(guests.map(g => g.familyName).filter(Boolean))) as string[];

  // Find guests seated at the selected table
  const seatedAtSelectedTable: (Guest | null)[] = Array(selectedTable?.seatsCount || 0).fill(null);
  if (selectedTable) {
    guests
      .filter(g => g.tableId === selectedTable.id)
      .forEach(g => {
        if (g.seatIndex !== null && g.seatIndex < seatedAtSelectedTable.length) {
          seatedAtSelectedTable[g.seatIndex] = g;
        }
      });
  }

  // Handle adding standard/custom elements
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    // Default seating counts based on item types
    const actualSeats = (itemType === 'round_table' || itemType === 'rectangular_table') ? seatsCount : 0;

    // Random offset in middle to prevent overlapping
    const randomX = Math.floor(Math.random() * 30) + 35;
    const randomY = Math.floor(Math.random() * 30) + 35;

    onAddTable({
      name: itemName.trim(),
      seatsCount: actualSeats,
      type: itemType,
      x: randomX,
      y: randomY
    });

    setItemName('');
  };

  // Drag handlers using client-relative percentage computation
  const handleMouseDown = (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedId(tableId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedId) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Contain boundaries
    x = Math.max(4, Math.min(96, x));
    y = Math.max(4, Math.min(96, y));
    
    setLocalPositions(prev => ({
      ...prev,
      [draggedId]: { x: Math.round(x), y: Math.round(y) }
    }));
  };

  const handleMouseUpOrLeave = () => {
    if (!draggedId) return;
    const finalPos = localPositions[draggedId];
    const tableToUpdate = tables.find(t => t.id === draggedId);
    if (finalPos && tableToUpdate) {
      onAddTable({
        ...tableToUpdate,
        x: finalPos.x,
        y: finalPos.y
      });
    }
    setDraggedId(null);
  };

  // Mobile Touch Support
  const handleTouchStart = (tableId: string, e: React.TouchEvent) => {
    e.stopPropagation();
    setDraggedId(tableId);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggedId) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    
    let x = ((touch.clientX - rect.left) / rect.width) * 100;
    let y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(4, Math.min(96, x));
    y = Math.max(4, Math.min(96, y));
    
    setLocalPositions(prev => ({
      ...prev,
      [draggedId]: { x: Math.round(x), y: Math.round(y) }
    }));
  };

  // Mass seating assistant for a selected table
  const handleSeatEntireFamily = (familyName: string) => {
    if (!selectedTable) return;
    const familyMembers = unseatedGuests.filter(g => g.familyName === familyName);
    if (familyMembers.length === 0) {
      alert("All members of this family are already seated!");
      return;
    }

    let assignedCount = 0;
    let seatIdx = 0;

    // Sequentially place into vacant slots
    while (seatIdx < seatedAtSelectedTable.length && assignedCount < familyMembers.length) {
      if (!seatedAtSelectedTable[seatIdx]) {
        const guestToSeat = familyMembers[assignedCount];
        onAssignSeat(guestToSeat.id, selectedTable.id, seatIdx);
        // Optimistically update local view to prevent double assignment
        seatedAtSelectedTable[seatIdx] = guestToSeat;
        assignedCount++;
      }
      seatIdx++;
    }

    if (assignedCount < familyMembers.length) {
      alert(`Seated ${assignedCount} family members. Note: Table was filled before all members could be placed.`);
    } else {
      alert(`Seated all ${assignedCount} members of the "${familyName}" group successfully!`);
    }
  };

  const countOccupiedSeats = (tableId: string) => {
    return guests.filter(g => g.tableId === tableId).length;
  };

  // Helper to render decorative or custom elements
  const renderItemVisual = (table: Table, isSelected: boolean) => {
    const occupiedCount = countOccupiedSeats(table.id);
    const type = table.type || 'round_table';

    switch (type) {
      case 'stage':
        return (
          <div className={`w-40 h-20 md:w-52 md:h-24 bg-gradient-to-b from-amber-700 to-amber-900 border-2 ${isSelected ? 'border-amber-300 scale-105 ring-2 ring-amber-500/50' : 'border-amber-950'} rounded-lg flex flex-col items-center justify-center shadow-lg transition-transform text-white`}>
            <span className="text-[10px] md:text-xs font-bold font-display uppercase tracking-wider">🌟 {table.name}</span>
            <span className="text-[8px] md:text-[9px] text-amber-200/80 font-mono mt-1">MAIN CELEBRATION STAGE</span>
          </div>
        );
      case 'dance_floor':
        return (
          <div className={`w-36 h-36 md:w-44 md:h-44 bg-slate-950/90 border-4 border-double ${isSelected ? 'border-amber-400 scale-105' : 'border-slate-700'} rounded-2xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden transition-all`}>
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,#000_25%,transparent_25%),linear-gradient(-45deg,#000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#000_75%),linear-gradient(-45deg,transparent_75%,#000_75%)] bg-[size:16px_16px]"></div>
            <div className="z-10 text-center px-2">
              <span className="text-[10px] md:text-xs font-black font-display text-pink-400 tracking-widest uppercase">💃 Dance Floor 🕺</span>
              <p className="text-[8px] text-slate-400 mt-1 font-mono tracking-tight">{table.name}</p>
            </div>
          </div>
        );
      case 'bar':
        return (
          <div className={`w-36 h-14 md:w-44 md:h-16 bg-slate-800 border-y-4 ${isSelected ? 'border-amber-400 scale-105' : 'border-amber-800'} rounded-md flex items-center justify-between px-3 shadow-md text-amber-100 transition-transform`}>
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[11px] font-bold tracking-wide uppercase">{table.name}</span>
              <span className="text-[8px] text-amber-400/85 font-mono">DRINKS & REFRESHMENTS</span>
            </div>
            <Wine className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        );
      case 'decoration':
        return (
          <div className={`w-14 h-14 md:w-16 md:h-16 bg-emerald-900 border-2 ${isSelected ? 'border-amber-300 scale-105' : 'border-emerald-600'} rounded-full flex flex-col items-center justify-center shadow text-emerald-100 font-medium transition-all`}>
            <span className="text-[11px] font-bold">🌿</span>
            <span className="text-[8px] text-emerald-200 uppercase font-mono tracking-tighter truncate max-w-[50px]">{table.name}</span>
          </div>
        );
      case 'rectangular_table':
        return (
          <div className="relative w-32 h-16 md:w-36 md:h-20 flex items-center justify-center">
            {/* Visual chairs on top/bottom of rectangle */}
            {Array.from({ length: table.seatsCount }).map((_, i) => {
              const isSeatOccupied = guests.some(g => g.tableId === table.id && g.seatIndex === i);
              const isTop = i < table.seatsCount / 2;
              const colIdx = isTop ? i : i - table.seatsCount / 2;
              const cols = table.seatsCount / 2;
              const leftPercent = ((colIdx + 0.5) / cols) * 100;

              return (
                <div
                  key={i}
                  style={{
                    left: `${leftPercent}%`,
                    top: isTop ? '-8px' : 'calc(100% - 4px)'
                  }}
                  className={`absolute -translate-x-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded border transition-all ${
                    isSeatOccupied
                      ? 'bg-amber-400 border-amber-500 shadow-sm'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                />
              );
            })}

            <div
              className={`w-full h-full rounded-lg flex flex-col items-center justify-center border-2 shadow-lg transition-all ${
                isSelected
                  ? 'bg-slate-100 border-amber-400 text-slate-950 scale-105 shadow-amber-950/20 shadow-lg'
                  : 'bg-slate-800 border-slate-600 text-slate-100'
              }`}
            >
              <span className="text-[10px] md:text-xs font-bold leading-none tracking-tight truncate max-w-[80px] px-1">
                {table.name}
              </span>
              <span className="text-[9px] md:text-[10px] opacity-75 mt-1 font-mono">
                {occupiedCount}/{table.seatsCount} Seats
              </span>
            </div>
          </div>
        );
      case 'round_table':
      default:
        return (
          <div className="relative w-22 h-22 md:w-26 md:h-26 flex items-center justify-center">
            {/* Round Chairs */}
            {Array.from({ length: table.seatsCount }).map((_, i) => {
              const angle = (i * 360) / table.seatsCount;
              const radius = 45; // percentage radius
              const chairX = Math.cos((angle * Math.PI) / 180) * radius;
              const chairY = Math.sin((angle * Math.PI) / 180) * radius;
              const isSeatOccupied = guests.some(g => g.tableId === table.id && g.seatIndex === i);

              return (
                <div
                  key={i}
                  style={{
                    transform: `translate(${chairX}px, ${chairY}px)`
                  }}
                  className={`absolute w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all border ${
                    isSeatOccupied
                      ? 'bg-amber-400 border-amber-500 shadow-sm'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                />
              );
            })}

            {/* Circle table itself */}
            <div
              className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all shadow-lg ${
                isSelected
                  ? 'bg-slate-100 border-amber-400 text-slate-950 scale-105 shadow-amber-950/20 shadow-lg'
                  : 'bg-slate-800 border-slate-600 text-slate-100'
              }`}
            >
              <span className="text-[10px] md:text-xs font-bold leading-none tracking-tight truncate max-w-[50px] px-1">
                {table.name.split(' ')[0]}
              </span>
              <span className="text-[9px] md:text-[10px] opacity-75 mt-0.5 font-mono">
                {occupiedCount}/{table.seatsCount}
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Layout className="w-5 h-5 text-slate-500" />
            Ultimate Floor Plan & Seating Chart Designer
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build custom layouts! Click and drag elements anywhere on the floor plan to position them. Group and place whole families instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* BIG interactive Floor Plan Canvas */}
        <div className="xl:col-span-8 flex flex-col space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 flex items-center justify-between px-4 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5"><Move className="w-3.5 h-3.5" /> Drag & Drop any layout item directly on the floor plan!</span>
            <span className="text-[10px] text-slate-400">Main Stage is top, Main Entrance is bottom</span>
          </div>

          <div 
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            className="bg-slate-900 border border-slate-950 rounded-3xl p-6 relative h-[500px] md:h-[600px] shadow-inner overflow-hidden select-none cursor-crosshair"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Visual Guides */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-slate-700 text-slate-400 px-6 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase shadow">
              Stage Area (Top)
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/60 border border-slate-700/50 text-slate-500 px-5 py-1 rounded-lg text-[9px] font-mono tracking-widest uppercase">
              Main Entrance (Bottom)
            </div>

            {/* Inner dance floor reference line */}
            <div className="absolute inset-20 border border-dashed border-slate-800/30 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="text-[9px] text-slate-800 font-mono uppercase tracking-widest">Main Reception Area</span>
            </div>

            {tables.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-500 max-w-xs mx-auto z-0 pointer-events-none">
                <HelpCircle className="w-12 h-12 mb-3 text-slate-600 opacity-60" />
                <h4 className="font-display font-bold text-sm text-slate-300">Your Floor Plan is Empty</h4>
                <p className="text-xs text-slate-500 mt-1">Use the "Add Layout Item" tool on the sidebar to place tables, stages, and bars, then drag them around!</p>
              </div>
            ) : (
              tables.map(table => {
                const isSelected = selectedTableId === table.id;
                const localPos = localPositions[table.id] || { x: table.x, y: table.y };
                const isDragging = draggedId === table.id;

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    onMouseDown={(e) => handleMouseDown(table.id, e)}
                    onTouchStart={(e) => handleTouchStart(table.id, e)}
                    style={{
                      left: `${localPos.x}%`,
                      top: `${localPos.y}%`,
                      zIndex: isDragging ? 50 : isSelected ? 30 : 10
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none transition-all duration-75 ${
                      isDragging ? 'scale-105 opacity-90 shadow-2xl ring-2 ring-amber-400/50' : ''
                    }`}
                  >
                    {renderItemVisual(table, isSelected)}
                  </div>
                );
              })
            )}
          </div>

          {/* Color & Symbol Legend */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-wrap gap-4 text-xs font-mono text-slate-600 justify-between items-center">
            <div className="flex gap-4">
              <div>Total Elements: <span className="font-bold text-slate-900">{tables.length}</span></div>
              <div>Seated: <span className="font-bold text-emerald-700">{guests.filter(g => g.tableId).length}</span></div>
              <div>Unseated: <span className="font-bold text-amber-700">{unseatedGuests.length}</span></div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 border border-amber-500 rounded-full inline-block"></span> Seated Guest</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-700 border border-slate-600 rounded-full inline-block"></span> Available Chair</span>
            </div>
          </div>
        </div>

        {/* Sidebar Manager Column */}
        <div className="xl:col-span-4 space-y-6">
          {/* Floor Plan Element builder */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Milestone className="w-4 h-4 text-slate-500" />
              Add Layout Item
            </h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Item Type</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                >
                  <option value="round_table">Round Guest Table</option>
                  <option value="rectangular_table">Rectangular Guest Table</option>
                  <option value="stage">Wedding Stage / Bridal Arch</option>
                  <option value="dance_floor">Dance Floor Area</option>
                  <option value="bar">Bar Counter</option>
                  <option value="decoration">Greenery / Decorative Circle</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Item Label / Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={
                    itemType === 'round_table' || itemType === 'rectangular_table'
                      ? 'e.g. Table 1, Head Table'
                      : itemType === 'stage'
                      ? 'e.g. Main Arch Stage'
                      : itemType === 'dance_floor'
                      ? 'e.g. Neon Dance Floor'
                      : itemType === 'bar'
                      ? 'e.g. Cocktail Bar'
                      : 'e.g. Floral Pillar'
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              {(itemType === 'round_table' || itemType === 'rectangular_table') && (
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Chairs count</label>
                  <select
                    value={seatsCount}
                    onChange={(e) => setSeatsCount(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                  >
                    {[4, 5, 6, 8, 10, 12].map(num => (
                      <option key={num} value={num}>{num} Chairs / Seats</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Place on Floor Plan
              </button>
            </form>
          </div>

          {/* Seat & Family Assignments Panel */}
          {selectedTable ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {selectedTable.name} 
                    <span className="text-[10px] font-mono font-normal text-slate-400 capitalize">({selectedTable.type?.replace('_', ' ') || 'round table'})</span>
                  </h4>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-0.5 block">
                    {countOccupiedSeats(selectedTable.id)} / {selectedTable.seatsCount} Seats Assigned
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${selectedTable.name}"? This removes it from the floor plan and unseats any assigned guests.`)) {
                      onDeleteTable(selectedTable.id);
                      setSelectedTableId(null);
                    }
                  }}
                  title="Remove Item"
                  className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Seating Assignment list (only for items with seats) */}
              {(selectedTable.type === 'round_table' || selectedTable.type === 'rectangular_table' || !selectedTable.type) ? (
                <div className="space-y-4">
                  {/* Family Quick Seater Assistant */}
                  {allFamilies.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                      <h5 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> 
                        Family Placement Assistant
                      </h5>
                      <p className="text-[9px] text-slate-400 leading-normal">
                        Place multiple family groups at this table! Select a family to auto-assign all unseated members.
                      </p>
                      <div className="flex gap-1.5">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSeatEntireFamily(e.target.value);
                              e.target.value = ''; // Reset select
                            }
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300"
                        >
                          <option value="">-- Choose Family --</option>
                          {allFamilies.map(famName => {
                            const unseatedCount = unseatedGuests.filter(g => g.familyName === famName).length;
                            return (
                              <option key={famName} value={famName} disabled={unseatedCount === 0}>
                                {famName} ({unseatedCount} unseated)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Seat-by-Seat Config */}
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {seatedAtSelectedTable.map((guest, seatIdx) => (
                      <div key={seatIdx} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0 gap-2">
                        <span className="font-mono text-[10px] text-slate-400 w-11 shrink-0">Seat {seatIdx + 1}:</span>
                        
                        {guest ? (
                          <div className="flex items-center justify-between flex-1 bg-slate-50/50 border border-slate-100 rounded-lg p-1.5 px-2 min-w-0">
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-slate-800 truncate" title={guest.name}>
                                {guest.name} {guest.age !== undefined && <span className="text-[10px] text-slate-400">({guest.age} yrs)</span>}
                              </p>
                              {guest.familyName && (
                                <span className="text-[9px] text-slate-400 font-mono block truncate">👪 {guest.familyName}</span>
                              )}
                            </div>
                            <button
                              onClick={() => onAssignSeat(guest.id, null, null)}
                              title="Unseat"
                              className="p-1 hover:bg-red-50 hover:text-red-500 rounded-md text-slate-400 transition-colors shrink-0 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  onAssignSeat(e.target.value, selectedTable.id, seatIdx);
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 truncate"
                            >
                              <option value="">-- Vacant Seat --</option>
                              {/* List unseated guests grouped by family first, then individuals */}
                              {Object.keys(unseatedByFamily).map(famName => (
                                <optgroup key={famName} label={`Family: ${famName}`}>
                                  {unseatedByFamily[famName].map(g => (
                                    <option key={g.id} value={g.id}>
                                      {g.name} {g.age !== undefined ? `(${g.age} yrs)` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                              {unseatedIndividuals.length > 0 && (
                                <optgroup label="Individual Guests">
                                  {unseatedIndividuals.map(g => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium">
                  This layout element is a decorative/structural fixture and does not require guest seat assignments. Drag it around to position your floor plan visually!
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium leading-relaxed">
              👈 Select or tap a table or special area on the floor plan to view seat configs and access the Family Placement Assistant!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
