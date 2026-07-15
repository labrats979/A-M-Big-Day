import React, { useState, useEffect, useRef } from 'react';
import { Table, Guest } from '../types';
import { 
  Plus, Trash2, X, HelpCircle, Layout, Move, Sparkles, 
  Wine, Circle, Square, Users, UserPlus, Milestone,
  Grid, Compass, Check, RotateCcw, AlertTriangle, Eye, ArrowRight,
  Lock
} from 'lucide-react';

interface SeatingPlannerProps {
  tables: Table[];
  guests: Guest[];
  onAddTable: (table: Omit<Table, 'id'> & { id?: string }) => void;
  onDeleteTable: (tableId: string) => void;
  onClearAllTables: () => void;
  onAssignSeat: (guestId: string, tableId: string | null, seatIndex: number | null) => void;
  onBulkAssignSeats: (updates: { id: string; tableId: string | null; seatIndex: number | null }[]) => void;
  onAddTablesBulk: (tables: Table[]) => void;
  readOnly?: boolean;
}

export default function SeatingPlanner({
  tables,
  guests,
  onAddTable,
  onDeleteTable,
  onClearAllTables,
  onAssignSeat,
  onBulkAssignSeats,
  onAddTablesBulk,
  readOnly = false
}: SeatingPlannerProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(tables[0]?.id || null);
  
  // New element creation states
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<NonNullable<Table['type']>>('round_table');
  const [seatsCount, setSeatsCount] = useState(8);

  // Local drag coordinates for silky smooth 60fps movement
  const [localPositions, setLocalPositions] = useState<{ [id: string]: { x: number; y: number } }>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Hovered chair tooltip state
  const [hoveredSeat, setHoveredSeat] = useState<{
    guest: Guest;
    tableId: string;
    seatIndex: number;
    x: number;
    y: number;
  } | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  // Group unseated guests by family
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

  // Unique list of all families in the whole guest list
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

  // Add standard or custom items
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const actualSeats = (itemType === 'round_table' || itemType === 'rectangular_table') ? seatsCount : 0;

    // Random offset in middle to prevent overlapping
    const randomX = Math.floor(Math.random() * 20) + 40;
    const randomY = Math.floor(Math.random() * 20) + 40;

    onAddTable({
      name: itemName.trim(),
      seatsCount: actualSeats,
      type: itemType,
      x: randomX,
      y: randomY
    });

    setNotification({
      message: `Placed "${itemName.trim()}" onto the floor plan!`,
      type: 'success'
    });
    setItemName('');
  };

  // Drag and Drop handlers with client percent coords
  const handleMouseDown = (tableId: string, e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setDraggedId(tableId);
    setSelectedTableId(tableId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedId) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Contain boundaries
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    
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
    if (readOnly) return;
    e.stopPropagation();
    setDraggedId(tableId);
    setSelectedTableId(tableId);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggedId) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    
    let x = ((touch.clientX - rect.left) / rect.width) * 100;
    let y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    
    setLocalPositions(prev => ({
      ...prev,
      [draggedId]: { x: Math.round(x), y: Math.round(y) }
    }));
  };

  // Quick seating assistant for entire families
  const handleSeatEntireFamily = (familyName: string) => {
    if (!selectedTable) return;
    const familyMembers = unseatedGuests.filter(g => g.familyName === familyName);
    if (familyMembers.length === 0) {
      setNotification({ message: `All members of ${familyName} are already seated!`, type: 'info' });
      return;
    }

    let assignedCount = 0;
    let seatIdx = 0;

    // Place sequentially in empty chairs
    while (seatIdx < seatedAtSelectedTable.length && assignedCount < familyMembers.length) {
      if (!seatedAtSelectedTable[seatIdx]) {
        const guestToSeat = familyMembers[assignedCount];
        onAssignSeat(guestToSeat.id, selectedTable.id, seatIdx);
        seatedAtSelectedTable[seatIdx] = guestToSeat;
        assignedCount++;
      }
      seatIdx++;
    }

    if (assignedCount < familyMembers.length) {
      setNotification({
        message: `Seated ${assignedCount} of ${familyMembers.length} members. Table was filled.`,
        type: 'warning'
      });
    } else {
      setNotification({
        message: `Successfully seated all ${assignedCount} members of the ${familyName}!`,
        type: 'success'
      });
    }
  };

  // Auto-seating Confirmation Modal States
  const [showAutoSeatConfirm, setShowAutoSeatConfirm] = useState(false);
  const [generatedConfirmCode, setGeneratedConfirmCode] = useState('');
  const [userConfirmCode, setUserConfirmCode] = useState('');
  const [confirmCodeError, setConfirmCodeError] = useState(false);

  // Trigger Confirmation Flow for Auto-Seating
  const triggerAutoSeatFlow = () => {
    const unseatedGoing = guests.filter(g => !g.tableId && g.rsvpStatus === 'going');
    if (unseatedGoing.length === 0) {
      setNotification({ message: 'All guests with RSVP "Going" are already seated!', type: 'info' });
      return;
    }

    const guestTables = tables.filter(t => t.type === 'round_table' || t.type === 'rectangular_table' || !t.type);
    if (guestTables.length === 0) {
      setNotification({ message: 'No guest tables are placed yet! Please add a table first.', type: 'warning' });
      return;
    }

    // Generate random 4-character uppercase code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ3456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setGeneratedConfirmCode(code);
    setUserConfirmCode('');
    setConfirmCodeError(false);
    setShowAutoSeatConfirm(true);
  };

  // SMART AUTO-SEATING ASSISTANT (Atomic with updates array)
  const handleAutoSeatAll = async () => {
    const unseatedGoing = guests.filter(g => !g.tableId && g.rsvpStatus === 'going');
    if (unseatedGoing.length === 0) return;

    const guestTables = tables.filter(t => t.type === 'round_table' || t.type === 'rectangular_table' || !t.type);
    if (guestTables.length === 0) return;

    // Build map of current occupied seats
    const seatMap: { [tableId: string]: boolean[] } = {};
    guestTables.forEach(t => {
      seatMap[t.id] = Array(t.seatsCount).fill(false);
    });

    guests.forEach(g => {
      if (g.tableId && g.seatIndex !== null && seatMap[g.tableId]) {
        seatMap[g.tableId][g.seatIndex] = true;
      }
    });

    // Group unseated by family, then solo
    const familyGroups: { [name: string]: Guest[] } = {};
    const solos: Guest[] = [];

    unseatedGoing.forEach(g => {
      if (g.familyName) {
        if (!familyGroups[g.familyName]) familyGroups[g.familyName] = [];
        familyGroups[g.familyName].push(g);
      } else {
        solos.push(g);
      }
    });

    let countSeated = 0;
    const updates: { id: string; tableId: string | null; seatIndex: number | null }[] = [];

    // Helper to find a table that can fit a certain size, prioritizing tables with same family
    const findBestTableForSize = (size: number, familyName: string) => {
      let bestTableId: string | null = null;
      let maxVacant = -1;

      // First pass: look for table with same family already seated and has room
      for (const t of guestTables) {
        const vacantCount = seatMap[t.id].filter(occupied => !occupied).length;
        if (vacantCount >= size) {
          const hasSameFamily = guests.some(g => g.tableId === t.id && g.familyName === familyName);
          if (hasSameFamily) {
            return t.id;
          }
        }
      }

      // Second pass: look for table with most vacant seats that can accommodate
      for (const t of guestTables) {
        const vacantCount = seatMap[t.id].filter(occupied => !occupied).length;
        if (vacantCount >= size && vacantCount > maxVacant) {
          maxVacant = vacantCount;
          bestTableId = t.id;
        }
      }

      // Third pass: find any table with at least 1 vacant seat
      if (!bestTableId) {
        for (const t of guestTables) {
          const vacantCount = seatMap[t.id].filter(occupied => !occupied).length;
          if (vacantCount > 0) {
            return t.id;
          }
        }
      }

      return bestTableId;
    };

    // Seat families first
    Object.keys(familyGroups).forEach(famName => {
      const members = familyGroups[famName];
      let tableId = findBestTableForSize(members.length, famName);

      members.forEach(member => {
        if (!tableId) return;
        const firstVacantIdx = seatMap[tableId].findIndex(occ => !occ);
        if (firstVacantIdx !== -1) {
          updates.push({ id: member.id, tableId, seatIndex: firstVacantIdx });
          seatMap[tableId][firstVacantIdx] = true;
          countSeated++;
        } else {
          tableId = findBestTableForSize(1, famName);
          if (tableId) {
            const anotherVacant = seatMap[tableId].findIndex(occ => !occ);
            if (anotherVacant !== -1) {
              updates.push({ id: member.id, tableId, seatIndex: anotherVacant });
              seatMap[tableId][anotherVacant] = true;
              countSeated++;
            }
          }
        }
      });
    });

    // Seat solo guests
    solos.forEach(solo => {
      let tableId = findBestTableForSize(1, '');
      if (tableId) {
        const vacantIdx = seatMap[tableId].findIndex(occ => !occ);
        if (vacantIdx !== -1) {
          updates.push({ id: solo.id, tableId, seatIndex: vacantIdx });
          seatMap[tableId][vacantIdx] = true;
          countSeated++;
        }
      }
    });

    if (updates.length > 0) {
      await onBulkAssignSeats(updates);
      setNotification({
        message: `Auto-assigned seating for ${countSeated} guests beautifully!`,
        type: 'success'
      });
    } else {
      setNotification({
        message: 'No available vacant seats found on any guest tables.',
        type: 'warning'
      });
    }
  };

  // QUICK LAYOUT TEMPLATE GENERATOR (Atomic using bulk tables add)
  const applyPresetTemplate = async (type: 'gala' | 'intimate' | 'banquet') => {
    if (tables.length > 0) {
      if (!confirm('Applying a preset layout will delete ALL current tables and unseat all currently assigned guests (making them unassigned). Are you sure you want to proceed with this master layout reset?')) {
        return;
      }
      await onClearAllTables();
    }

    const generateId = () => "t_" + Math.random().toString(36).substring(2, 9);
    const presetTables: Table[] = [];

    if (type === 'gala') {
      presetTables.push({ id: generateId(), name: 'Bridal Stage', seatsCount: 0, type: 'stage', x: 50, y: 15, width: 224, height: 104 });
      presetTables.push({ id: generateId(), name: 'Grand Ballroom Floor', seatsCount: 0, type: 'dance_floor', x: 50, y: 50, width: 90, height: 90 });
      presetTables.push({ id: generateId(), name: 'Luxury Oyster Bar', seatsCount: 0, type: 'bar', x: 18, y: 80, width: 192, height: 64 });
      presetTables.push({ id: generateId(), name: 'Table 1 (Groomsmen Side)', seatsCount: 8, type: 'round_table', x: 22, y: 32, width: 112, height: 112 });
      presetTables.push({ id: generateId(), name: 'Table 2 (Lady Side)', seatsCount: 8, type: 'round_table', x: 78, y: 32, width: 112, height: 112 });
      presetTables.push({ id: generateId(), name: 'Table 3 (Family Green)', seatsCount: 8, type: 'round_table', x: 20, y: 58, width: 112, height: 112 });
      presetTables.push({ id: generateId(), name: 'Table 4 (Family Miller)', seatsCount: 10, type: 'round_table', x: 80, y: 58, width: 112, height: 112 });
      
      await onAddTablesBulk(presetTables);
      setNotification({ message: 'Applied "Royal Gala Circle" layout template!', type: 'success' });
    } else if (type === 'intimate') {
      presetTables.push({ id: generateId(), name: 'Serenade Altar', seatsCount: 0, type: 'stage', x: 18, y: 50, width: 224, height: 104 });
      presetTables.push({ id: generateId(), name: 'Acoustic Floor', seatsCount: 0, type: 'dance_floor', x: 80, y: 50, width: 90, height: 90 });
      presetTables.push({ id: generateId(), name: 'Mimosa & Champagne Bar', seatsCount: 0, type: 'bar', x: 50, y: 84, width: 192, height: 64 });
      presetTables.push({ id: generateId(), name: 'Table 1', seatsCount: 6, type: 'round_table', x: 48, y: 24, width: 112, height: 112 });
      presetTables.push({ id: generateId(), name: 'Table 2', seatsCount: 6, type: 'round_table', x: 48, y: 50, width: 112, height: 112 });
      presetTables.push({ id: generateId(), name: 'Bridal Head Table', seatsCount: 8, type: 'rectangular_table', x: 18, y: 22, width: 176, height: 88 });
      
      await onAddTablesBulk(presetTables);
      setNotification({ message: 'Applied "Cozy Intimate Parlor" layout template!', type: 'success' });
    } else if (type === 'banquet') {
      presetTables.push({ id: generateId(), name: 'Main Arch', seatsCount: 0, type: 'stage', x: 50, y: 15, width: 224, height: 104 });
      presetTables.push({ id: generateId(), name: 'Banquet Hall Left', seatsCount: 12, type: 'rectangular_table', x: 25, y: 50, width: 176, height: 88 });
      presetTables.push({ id: generateId(), name: 'Banquet Hall Right', seatsCount: 12, type: 'rectangular_table', x: 75, y: 50, width: 176, height: 88 });
      presetTables.push({ id: generateId(), name: 'Royal Stage Table', seatsCount: 6, type: 'rectangular_table', x: 50, y: 32, width: 176, height: 88 });
      presetTables.push({ id: generateId(), name: 'Main Dance Floor', seatsCount: 0, type: 'dance_floor', x: 50, y: 64, width: 90, height: 90 });
      presetTables.push({ id: generateId(), name: 'Midnight Bar', seatsCount: 0, type: 'bar', x: 50, y: 88, width: 192, height: 64 });

      await onAddTablesBulk(presetTables);
      setNotification({ message: 'Applied "Grand Imperial Banquet" layout template!', type: 'success' });
    }
  };

  // Helper to get total seated count for active feedback
  const countOccupiedSeats = (tableId: string) => {
    return guests.filter(g => g.tableId === tableId).length;
  };

  // RENDER SEATED CHAIRS & OCCUPANTS
  const renderItemVisual = (table: Table, isSelected: boolean) => {
    const occupiedCount = countOccupiedSeats(table.id);
    const type = table.type || 'round_table';

    // Highlight class on selection
    const highlightRing = isSelected 
      ? 'ring-4 ring-amber-400/85 ring-offset-4 ring-offset-white border-amber-300 scale-102 shadow-xl' 
      : 'border-stone-200/80 hover:border-stone-400 shadow-md';

    // Setup color definitions for guest roles
    const getRoleStyles = (role?: string) => {
      switch (role) {
        case 'bridesmaid':
          return { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-300', dot: 'bg-rose-400', name: 'Lady Side' };
        case 'groomsman':
          return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-300', dot: 'bg-indigo-400', name: 'Groomsman Side' };
        case 'admin':
          return { bg: 'bg-amber-500', text: 'text-slate-950', border: 'border-amber-200', dot: 'bg-amber-400', name: 'Organizer' };
        default:
          return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-300', dot: 'bg-emerald-400', name: 'Guest' };
      }
    };

    switch (type) {
      case 'stage': {
        const w = table.width || 224;
        const h = table.height || 104;
        return (
          <div 
            style={{ width: `${w}px`, height: `${h}px` }}
            className={`bg-gradient-to-b from-stone-50 via-amber-50/20 to-stone-100/90 border-2 border-amber-600/35 rounded-2xl flex flex-col items-center justify-center text-stone-900 relative overflow-hidden transition-all duration-300 ${highlightRing}`}
          >
            {/* Ambient spotlight effect */}
            <div className="absolute inset-0 bg-radial-gradient from-amber-200/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
            
            <span className="text-[10px] md:text-xs font-bold font-display tracking-widest text-amber-800 flex items-center gap-1.5 uppercase z-10 text-center px-2 line-clamp-1">
              👑 {table.name}
            </span>
            <span className="text-[7px] md:text-[8px] text-amber-800/60 font-mono tracking-widest uppercase mt-1 z-10 text-center line-clamp-1 px-1">
              HONORARY WEDDING STAGE
            </span>
            <div className="flex gap-4 mt-2 text-amber-500/40 z-10">
              <span className="text-xs">✦</span>
              <span className="text-xs">✦</span>
              <span className="text-xs">✦</span>
            </div>
          </div>
        );
      }

      case 'dance_floor': {
        const w = table.width || 90;
        const h = table.height || 90;
        return (
          <div 
            style={{ width: `${w}px`, height: `${h}px` }}
            className={`bg-gradient-to-br from-[#fcf7ec] via-[#f7ebd4] to-[#eccba2] border-2 border-amber-700/40 rounded-3xl flex flex-col items-center justify-center shadow-md relative overflow-hidden transition-all duration-300 ${highlightRing}`}
          >
            {/* Stylized dance floor tile pattern */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#b45309_1px,transparent_1px),linear-gradient(to_bottom,#b45309_1px,transparent_1px)] bg-[size:12px_12px]" />
            <div className="absolute inset-2 border border-amber-700/20 rounded-2xl pointer-events-none" />
            <div className="absolute inset-4 border border-dashed border-amber-700/10 rounded-xl pointer-events-none flex items-center justify-center" />
            
            <div className="z-10 text-center px-2 flex flex-col items-center justify-center w-full">
              <span className="text-[8px] md:text-[10px] font-display font-bold text-amber-900 tracking-wider uppercase truncate max-w-full">💃 DANCE FLOOR 🕺</span>
              <p className="text-[7px] text-amber-800/80 mt-0.5 font-mono tracking-tight truncate max-w-full">{table.name}</p>
              <div className="mt-1 text-xs font-serif italic text-amber-900/30 font-bold select-none tracking-widest">
                A & M
              </div>
            </div>
          </div>
        );
      }

      case 'bar': {
        const w = table.width || 192;
        const h = table.height || 64;
        return (
          <div 
            style={{ width: `${w}px`, height: `${h}px` }}
            className={`bg-gradient-to-r from-stone-50 via-stone-100 to-stone-200 border-2 border-stone-300 rounded-xl flex items-center justify-between px-4 shadow-md transition-all duration-300 ${highlightRing}`}
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[9px] md:text-[11px] font-bold text-amber-800 tracking-wider uppercase flex items-center gap-1 truncate">
                🍸 {table.name}
              </span>
              <span className="text-[7px] md:text-[8px] text-stone-500 font-mono tracking-wider mt-0.5 truncate">DRINK & REFRESHMENTS</span>
            </div>
            <div className="p-1 bg-amber-500/10 rounded-lg shrink-0">
              <Wine className="w-4 h-4 text-amber-600" />
            </div>
          </div>
        );
      }

      case 'decoration': {
        const w = table.width || 64;
        const h = table.height || 64;
        return (
          <div 
            style={{ width: `${w}px`, height: `${h}px` }}
            className={`bg-gradient-to-br from-emerald-50 to-emerald-100/90 border-2 border-emerald-300/50 rounded-full flex flex-col items-center justify-center text-emerald-800 shadow-sm transition-all duration-300 ${highlightRing}`}
          >
            <span className="text-[11px]">🌿</span>
            <span className="text-[7px] text-emerald-800 uppercase font-mono tracking-tighter truncate max-w-[90%] mt-0.5 text-center">{table.name}</span>
          </div>
        );
      }

      case 'rectangular_table': {
        const w = table.width || 176;
        const h = table.height || 88;
        return (
          <div 
            style={{ width: `${w}px`, height: `${h}px` }}
            className="relative flex items-center justify-center"
          >
            {/* Visual chairs around rectangular table */}
            {Array.from({ length: table.seatsCount }).map((_, i) => {
              const seatOccupant = guests.find(g => g.tableId === table.id && g.seatIndex === i);
              const roleInfo = getRoleStyles(seatOccupant?.role);

              // Distribute chairs top & bottom
              const isTop = i < table.seatsCount / 2;
              const colIdx = isTop ? i : i - table.seatsCount / 2;
              const cols = table.seatsCount / 2;
              const leftPercent = ((colIdx + 0.5) / cols) * 100;

              // Generate relative chair tooltip coordinates
              const handleSeatMouseEnter = (e: React.MouseEvent) => {
                if (seatOccupant) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const canvasRect = canvasRef.current?.getBoundingClientRect();
                  if (canvasRect) {
                    setHoveredSeat({
                      guest: seatOccupant,
                      tableId: table.id,
                      seatIndex: i,
                      x: rect.left - canvasRect.left + rect.width / 2,
                      y: rect.top - canvasRect.top - 8
                    });
                  }
                }
              };

              return (
                <div
                  key={i}
                  onMouseEnter={handleSeatMouseEnter}
                  onMouseLeave={() => setHoveredSeat(null)}
                  style={{
                    left: `${leftPercent}%`,
                    top: isTop ? '-12px' : 'calc(100% - 2px)'
                  }}
                  className={`absolute -translate-x-1/2 w-3.5 h-3.5 md:w-4 md:h-4 rounded border transition-all duration-300 flex items-center justify-center font-mono text-[7px] font-bold ${
                    seatOccupant
                      ? `${roleInfo.bg} ${roleInfo.text} ${roleInfo.border} shadow-md scale-110 cursor-pointer`
                      : 'bg-stone-100 border-stone-300 hover:border-stone-400 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {seatOccupant ? seatOccupant.name.charAt(0).toUpperCase() : ''}
                </div>
              );
            })}

            {/* Banquet Tablecloth */}
            <div
              className={`w-full h-full rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 relative ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-50/80 to-amber-100/90 border-amber-400 text-slate-950 scale-102 shadow-lg'
                  : 'bg-gradient-to-b from-white to-stone-50 border-stone-300 text-stone-900 shadow-sm'
              }`}
            >
              {/* Banquet Centerpiece Line */}
              <div className={`absolute top-1/2 inset-x-2 h-[1px] -translate-y-1/2 border-t border-dashed ${isSelected ? 'border-amber-300/55' : 'border-stone-200'}`} />
              
              <span className="text-[10px] md:text-xs font-bold leading-none tracking-tight truncate max-w-[90%] px-1 z-10 text-center">
                {table.name}
              </span>
              <span className={`text-[8px] md:text-[9px] mt-1 font-mono tracking-widest uppercase z-10 text-center ${isSelected ? 'text-amber-800' : 'text-stone-500'}`}>
                {occupiedCount}/{table.seatsCount} SEATS
              </span>
            </div>
          </div>
        );
      }

      case 'round_table':
      default: {
        const w = table.width || 112;
        const h = table.height || 112;
        return (
          <div 
            style={{ width: `${w}px`, height: `${h}px` }}
            className="relative flex items-center justify-center"
          >
            {/* Round Chairs Arrangement */}
            {Array.from({ length: table.seatsCount }).map((_, i) => {
              const angle = (i * 360) / table.seatsCount;
              const radius = w / 2 + 10; // place chairs slightly outside the dynamic radius!
              const chairX = Math.cos((angle * Math.PI) / 180) * radius;
              const chairY = Math.sin((angle * Math.PI) / 180) * radius;
              
              const seatOccupant = guests.find(g => g.tableId === table.id && g.seatIndex === i);
              const roleInfo = getRoleStyles(seatOccupant?.role);

              const handleSeatMouseEnter = (e: React.MouseEvent) => {
                if (seatOccupant) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const canvasRect = canvasRef.current?.getBoundingClientRect();
                  if (canvasRect) {
                    setHoveredSeat({
                      guest: seatOccupant,
                      tableId: table.id,
                      seatIndex: i,
                      x: rect.left - canvasRect.left + rect.width / 2,
                      y: rect.top - canvasRect.top - 8
                    });
                  }
                }
              };

              return (
                <div
                  key={i}
                  onMouseEnter={handleSeatMouseEnter}
                  onMouseLeave={() => setHoveredSeat(null)}
                  style={{
                    transform: `translate(${chairX}px, ${chairY}px)`
                  }}
                  className={`absolute w-3.5 h-3.5 md:w-4 md:h-4 rounded-full transition-all duration-300 border flex items-center justify-center font-mono text-[7px] font-bold ${
                    seatOccupant
                      ? `${roleInfo.bg} ${roleInfo.text} ${roleInfo.border} shadow-md scale-110 cursor-pointer`
                      : 'bg-stone-100 border-stone-300 hover:border-stone-400 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {seatOccupant ? seatOccupant.name.charAt(0).toUpperCase() : ''}
                </div>
              );
            })}

            {/* Circular Tablecloth */}
            <div
              className={`w-[72%] h-[72%] rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 relative shadow-md ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-50/80 to-amber-100/95 border-amber-400 text-slate-950 scale-102'
                  : 'bg-gradient-to-b from-white to-stone-50 border-stone-300 text-stone-900'
              }`}
            >
              {/* Inner ring motif */}
              <div className={`absolute inset-1 rounded-full border border-dashed ${isSelected ? 'border-amber-300/40' : 'border-stone-200/55'}`} />

              <span className="text-[9px] md:text-[10px] font-bold leading-none tracking-tight truncate max-w-[90%] px-1 z-10 text-center">
                {table.name}
              </span>
              <span className={`text-[7px] md:text-[8px] mt-0.5 font-mono tracking-widest z-10 text-center ${isSelected ? 'text-amber-800' : 'text-stone-500'}`}>
                {occupiedCount}/{table.seatsCount}
              </span>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Elegant Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Layout className="w-5 h-5 text-slate-500" />
            Grand Reception Floor Planner
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Drag and arrange tables, VIP stages, and dance floors freely on the digital grid. Highlight seated guests, manage families, or use the smart seating planner to distribute guests with a single tap.
          </p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-2">
          {readOnly ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs font-bold rounded-lg uppercase tracking-wider select-none">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> View Only Mode
            </span>
          ) : (
            <button
              onClick={triggerAutoSeatFlow}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium text-xs rounded-lg transition-all duration-300 shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Smart Auto-Seating Assistant
            </button>
          )}
        </div>
      </div>

      {/* Floating Notifications UI */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[99] max-w-sm flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg transition-all transform duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : notification.type === 'warning'
            ? 'bg-amber-50 border-amber-100 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          {notification.type === 'success' && <Check className="w-4 h-4 text-emerald-600" />}
          <p className="text-xs font-medium font-mono">{notification.message}</p>
        </div>
      )}

      {/* Grid template selector row */}
      {!readOnly && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 px-4">
          <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5 font-mono">
            <Grid className="w-4 h-4 text-slate-400" /> Need a starting point? Apply a master seating layout:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => applyPresetTemplate('gala')}
              className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 rounded-md shadow-sm hover:shadow transition-all cursor-pointer"
            >
              🏰 Royal Gala Layout
            </button>
            <button
              onClick={() => applyPresetTemplate('intimate')}
              className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 rounded-md shadow-sm hover:shadow transition-all cursor-pointer"
            >
              🌸 Intimate Parlor
            </button>
            <button
              onClick={() => applyPresetTemplate('banquet')}
              className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 rounded-md shadow-sm hover:shadow transition-all cursor-pointer"
            >
              👑 Grand Banquet
            </button>
          </div>
        </div>
      )}

      {/* Main planner body */}
      <div className={`grid grid-cols-1 ${readOnly ? '' : 'xl:grid-cols-12'} gap-6`}>
        
        {/* LEFT COLUMN: Blueprint canvas */}
        <div className={`${readOnly ? 'xl:col-span-12' : 'xl:col-span-8'} flex flex-col space-y-3`}>
          
          {/* Legend and stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-500 bg-slate-50/50 p-2.5 px-4 rounded-xl border border-slate-200/40">
            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
              <Layout className="w-3.5 h-3.5 text-amber-500" /> Floor Plan Controller
            </span>
            <div className="flex gap-4">
              <span>Elements: <b className="text-slate-900">{tables.length}</b></span>
              <span>Total Seats: <b className="text-slate-900">{tables.reduce((acc, t) => acc + (t.seatsCount || 0), 0)}</b></span>
              <span>Seated: <b className="text-emerald-700">{guests.filter(g => g.tableId).length}</b></span>
              <span>Unseated: <b className="text-amber-700">{unseatedGuests.length}</b></span>
            </div>
          </div>

          {/* MAIN INTERACTIVE CANVAS */}
          <div 
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            className="bg-[#faf9f5] border-2 border-stone-200 rounded-3xl p-6 relative h-[520px] md:h-[620px] shadow-sm overflow-hidden select-none cursor-default"
          >
            {/* Grand Hall Header Monogram inside Floor plan */}
            <div className="absolute top-8 left-12 right-12 text-center select-none pointer-events-none opacity-25">
              <h1 className="font-serif text-lg md:text-xl tracking-[0.3em] text-amber-900 uppercase font-bold">Reception Floor Plan</h1>
              <p className="text-[7px] md:text-[8px] font-mono tracking-[0.1em] text-stone-600 uppercase mt-1">Drag elements to arrange seating</p>
            </div>

            {/* Drag feedback indicator */}
            {draggedId && (
              <div className="absolute top-4 right-4 bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1.5 z-50">
                <Move className="w-3 h-3 text-amber-600" /> Adjusting Placements
              </div>
            )}

            {/* Render tables/items onto canvas */}
            {tables.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-stone-400 max-w-sm mx-auto z-0 pointer-events-none p-6">
                <Layout className="w-14 h-14 mb-4 text-stone-300" />
                <h4 className="font-display font-bold text-base text-stone-700 tracking-tight">Setup Your Hall Layout</h4>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Apply one of our custom master floor plans above, or use the <b>Add Layout Item</b> drawer on the sidebar to build your floor plan from scratch!
                </p>
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
                      isDragging ? 'scale-105 opacity-90' : ''
                    }`}
                  >
                    {/* Bounding Coordinate Helper on dragging */}
                    {isDragging && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-amber-400/50 text-[8px] font-mono text-amber-400 px-1.5 py-0.5 rounded shadow z-50 whitespace-nowrap">
                        X: {localPos.x}% | Y: {localPos.y}%
                      </div>
                    )}
                    {renderItemVisual(table, isSelected)}
                  </div>
                );
              })
            )}

            {/* SEAT HOVER FLOATING TOOLTIP */}
            {hoveredSeat && (
              <div
                style={{
                  left: `${hoveredSeat.x}px`,
                  top: `${hoveredSeat.y}px`,
                  transform: 'translate(-50%, -100%)'
                }}
                className="absolute z-[99] bg-white border border-amber-500/35 text-slate-950 p-2.5 rounded-xl shadow-xl space-y-1 min-w-[120px] pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1">
                  <span className="font-semibold text-[11px] text-amber-900">{hoveredSeat.guest.name}</span>
                  <span className="text-[8px] font-mono text-stone-400">{hoveredSeat.guest.age !== undefined ? `${hoveredSeat.guest.age} yrs` : ''}</span>
                </div>
                <p className="text-[9px] text-stone-600 font-mono">
                  {hoveredSeat.guest.familyName ? `👪 ${hoveredSeat.guest.familyName}` : 'Solo Guest'}
                </p>
                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 mt-1 capitalize">
                  {hoveredSeat.guest.role}
                </span>
              </div>
            )}
          </div>

          {/* Color role legends */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-wrap gap-4 text-xs font-mono text-slate-500 justify-between items-center">
            <span className="font-bold text-slate-700">GUEST SEAT MAP CODES:</span>
            <div className="flex flex-wrap gap-3.5 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-500 border border-rose-300 rounded-full inline-block" />
                Lady Side (Bridesmaid)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 border border-indigo-300 rounded-full inline-block" />
                Groomsman Side
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-600 border border-emerald-300 rounded-full inline-block" />
                General Guests
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500 border border-amber-200 rounded-full inline-block" />
                Organizers / Admin
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-800 border border-slate-700 rounded-full inline-block" />
                Available Chair
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar controls */}
        {!readOnly && (
          <div className="xl:col-span-4 space-y-6">
          
          {/* BUILDER DRAWER: Place Element */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Milestone className="w-4 h-4 text-slate-500" />
                Add Layout Item
              </h3>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Item Category</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 cursor-pointer"
                >
                  <option value="round_table">Round Guest Table</option>
                  <option value="rectangular_table">Rectangular Banquet Table</option>
                  <option value="stage">Celebration Stage / Arch</option>
                  <option value="dance_floor">Main Dance Floor</option>
                  <option value="bar">Cocktail/Marble Bar Counter</option>
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
                      ? 'e.g. Altar Stage'
                      : itemType === 'dance_floor'
                      ? 'e.g. Ballroom Dance Floor'
                      : itemType === 'bar'
                      ? 'e.g. Whiskey Lounge'
                      : 'e.g. Floral Ivy Hoop'
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>

              {(itemType === 'round_table' || itemType === 'rectangular_table') && (
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Chairs Count</label>
                  <select
                    value={seatsCount}
                    onChange={(e) => setSeatsCount(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 cursor-pointer"
                  >
                    {[4, 5, 6, 8, 10, 12, 16].map(num => (
                      <option key={num} value={num}>{num} Chairs / Seats</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-medium text-xs py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Place on Floor Plan
              </button>
            </form>
          </div>

          {/* CHAIR CONFIGURATION & ASSIGNMENTS PANEL */}
          {selectedTable ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              
              {/* Card Title */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {selectedTable.name}
                    <span className="text-[10px] font-mono font-normal text-slate-400 uppercase tracking-tight">({selectedTable.type?.replace('_', ' ') || 'Round Guest Table'})</span>
                  </h4>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-0.5 block">
                    {countOccupiedSeats(selectedTable.id)} / {selectedTable.seatsCount} Seats Assigned
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Are you absolutely sure you want to remove "${selectedTable.name}" from the floor plan? All guests currently seated at this table will be automatically unseated (assigned back to the unassigned guest pool). This action cannot be undone.`)) {
                      onDeleteTable(selectedTable.id);
                      setSelectedTableId(null);
                      setNotification({ message: `Deleted "${selectedTable.name}" and unseated its guests.`, type: 'info' });
                    }
                  }}
                  title="Remove Layout Item"
                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* SIZE ADJUSTMENT SLIDERS */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-3">
                <h5 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                  📐 Adjust Item Dimensions
                </h5>
                
                {/* Check if circular */}
                {(selectedTable.type === 'round_table' || selectedTable.type === 'decoration' || !selectedTable.type) ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-slate-600 font-mono">
                      <span>Diameter (Size)</span>
                      <span>{selectedTable.width || 112}px</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="400"
                      value={selectedTable.width || 112}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        onAddTable({
                          ...selectedTable,
                          width: newSize,
                          height: newSize
                        });
                      }}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-slate-600 font-mono">
                        <span>Width</span>
                        <span>{selectedTable.width || (selectedTable.type === 'stage' ? 224 : selectedTable.type === 'dance_floor' ? 90 : selectedTable.type === 'bar' ? 192 : 176)}px</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        value={selectedTable.width || (selectedTable.type === 'stage' ? 224 : selectedTable.type === 'dance_floor' ? 90 : selectedTable.type === 'bar' ? 192 : 176)}
                        onChange={(e) => {
                          const newWidth = Number(e.target.value);
                          onAddTable({
                            ...selectedTable,
                            width: newWidth
                          });
                        }}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-slate-600 font-mono">
                        <span>Height</span>
                        <span>{selectedTable.height || (selectedTable.type === 'stage' ? 104 : selectedTable.type === 'dance_floor' ? 90 : selectedTable.type === 'bar' ? 64 : 88)}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="500"
                        value={selectedTable.height || (selectedTable.type === 'stage' ? 104 : selectedTable.type === 'dance_floor' ? 90 : selectedTable.type === 'bar' ? 64 : 88)}
                        onChange={(e) => {
                          const newHeight = Number(e.target.value);
                          onAddTable({
                            ...selectedTable,
                            height: newHeight
                          });
                        }}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
                <p className="text-[8px] text-slate-400 font-mono text-center leading-normal">
                  Drag sliders to size. Sizing is saved to backend.
                </p>
              </div>

              {/* Seating controls (Only for Round and Rectangular types) */}
              {(selectedTable.type === 'round_table' || selectedTable.type === 'rectangular_table' || !selectedTable.type) ? (
                <div className="space-y-4">
                  
                  {/* Family Quick Seater Dropdown */}
                  {allFamilies.length > 0 && (
                    <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-3 space-y-2">
                      <h5 className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500 animate-bounce" />
                        Family Quick Seater
                      </h5>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Select a family below to seat all unseated members at this table instantly!
                      </p>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSeatEntireFamily(e.target.value);
                            e.target.value = ''; // reset dropdown
                          }
                        }}
                        className="w-full bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer"
                      >
                        <option value="">-- Choose Family Group --</option>
                        {allFamilies.map(famName => {
                          const unseatedCount = unseatedGuests.filter(g => g.familyName === famName).length;
                          return (
                            <option key={famName} value={famName} disabled={unseatedCount === 0}>
                              {famName} ({unseatedCount} unseated members)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Seat list scroll container */}
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {seatedAtSelectedTable.map((guest, seatIdx) => (
                      <div key={seatIdx} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0 gap-2">
                        <span className="font-mono text-[10px] text-slate-400 w-11 shrink-0">Seat {seatIdx + 1}:</span>
                        
                        {guest ? (
                          <div className="flex items-center justify-between flex-1 bg-slate-50 border border-slate-200/50 rounded-lg p-1.5 px-2.5 min-w-0">
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-slate-800 truncate" title={guest.name}>
                                {guest.name}
                              </p>
                              <span className="text-[8px] text-slate-400 font-mono block uppercase">
                                {guest.familyName ? `👪 ${guest.familyName}` : 'Solo Guest'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                onAssignSeat(guest.id, null, null);
                                setNotification({ message: `Unseated ${guest.name}.`, type: 'info' });
                              }}
                              title="Unseat Guest"
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-all shrink-0 cursor-pointer"
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
                                  const seatedGuest = guests.find(g => g.id === e.target.value);
                                  if (seatedGuest) {
                                    setNotification({ message: `Seated ${seatedGuest.name} at Seat ${seatIdx + 1}!`, type: 'success' });
                                  }
                                }
                              }}
                              className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 truncate cursor-pointer"
                            >
                              <option value="">-- Assign Guest to Seat --</option>
                              {/* Option Grouped by Family */}
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
                                <optgroup label="Individual Solo Guests">
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
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium leading-relaxed">
                  This layout element is a decorative/structural fixture and does not require guest seat assignments. Drag it around to position your floor plan visually!
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium leading-relaxed">
              👈 Tap or select any table, stage, or decoration on the floor plan map to customize seating configurations and see guest list details.
            </div>
          )}
        </div>
        )}
      </div>

      {/* Auto-Seating Verification Modal overlay */}
      {showAutoSeatConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-slate-900 text-sm">Reset & Smart Auto-Seat Confirmation</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  All current table guest seating assignments will be recalculated. Any unassigned guests with RSVP status "Going" will be matched with available seats. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Verification Code</span>
              <span className="text-2xl font-mono font-bold tracking-widest text-slate-900 bg-white border border-slate-200 px-4 py-1.5 rounded-lg inline-block select-none shadow-sm">
                {generatedConfirmCode}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Please type the exact code above into the box below to unlock auto-seating.</p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={userConfirmCode}
                onChange={(e) => {
                  setUserConfirmCode(e.target.value.toUpperCase());
                  setConfirmCodeError(false);
                }}
                placeholder="ENTER CODE"
                className="w-full text-center text-sm font-mono tracking-widest px-3 py-2 border border-slate-200 focus:border-slate-400 rounded-lg focus:outline-none uppercase"
              />
              {confirmCodeError && (
                <p className="text-[10px] text-red-500 text-center font-medium">The verification code you entered is incorrect. Please try again.</p>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowAutoSeatConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (userConfirmCode === generatedConfirmCode) {
                    setShowAutoSeatConfirm(false);
                    handleAutoSeatAll();
                  } else {
                    setConfirmCodeError(true);
                  }
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs py-2.5 rounded-lg transition-colors shadow-md shadow-amber-600/10 cursor-pointer"
              >
                Confirm & Auto-Seat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
