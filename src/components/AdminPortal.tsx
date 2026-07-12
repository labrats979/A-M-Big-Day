import React, { useState } from 'react';
import { Guest, Table, Expense, Vendor, UserRole } from '../types';
import SeatingPlanner from './SeatingPlanner';
import BudgetManager from './BudgetManager';
import VendorManager from './VendorManager';
import { 
  Users, Layout, DollarSign, Briefcase, Download, RotateCcw, 
  UserPlus, Trash2, Check, X, ShieldAlert, CheckCircle, Clock,
  User, Plus, Heart, Sparkles, FolderClosed
} from 'lucide-react';

interface AdminPortalProps {
  guests: Guest[];
  tables: Table[];
  expenses: Expense[];
  vendors: Vendor[];
  
  onAddGuest: (guest: Omit<Guest, 'id'>) => void;
  onDeleteGuest: (guestId: string) => void;
  onUpdateGuestRSVP: (guestId: string, status: Guest['rsvpStatus']) => void;
  
  onAddTable: (table: Omit<Table, 'id'>) => void;
  onDeleteTable: (tableId: string) => void;
  onAssignSeat: (guestId: string, tableId: string | null, seatIndex: number | null) => void;
  
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expenseId: string) => void;
  onTogglePaid: (expenseId: string) => void;
  
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onDeleteVendor: (vendorId: string) => void;
  
  onResetDatabase: () => void;
  fullDataBackup: any;
}

export default function AdminPortal({
  guests,
  tables,
  expenses,
  vendors,
  onAddGuest,
  onDeleteGuest,
  onUpdateGuestRSVP,
  onAddTable,
  onDeleteTable,
  onAssignSeat,
  onAddExpense,
  onDeleteExpense,
  onTogglePaid,
  onAddVendor,
  onDeleteVendor,
  onResetDatabase,
  fullDataBackup
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'guests' | 'seating' | 'budget' | 'vendors' | 'backup'>('guests');

  // Toggle between viewing Flat list vs Grouped by Family
  const [directoryView, setDirectoryView] = useState<'all' | 'family'>('family');

  // Toggle form between Single Guest vs Family Group
  const [guestFormMode, setGuestFormMode] = useState<'individual' | 'family'>('family');

  // Individual Guest Form State
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestAge, setNewGuestAge] = useState('');
  const [newGuestFamilyName, setNewGuestFamilyName] = useState('');
  const [newGuestRole, setNewGuestRole] = useState<UserRole>('guest');
  const [newGuestRSVP, setNewGuestRSVP] = useState<Guest['rsvpStatus']>('pending');

  // Family Group Form State
  const [familySurname, setFamilySurname] = useState('');
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; age: string; role: UserRole; rsvpStatus: Guest['rsvpStatus'] }>>([
    { name: '', age: '', role: 'guest', rsvpStatus: 'pending' },
    { name: '', age: '', role: 'guest', rsvpStatus: 'pending' }
  ]);

  const handleAddGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    const exists = guests.some(g => g.name.toLowerCase().trim() === newGuestName.toLowerCase().trim());
    if (exists) {
      alert(`"${newGuestName}" already exists on the guest list!`);
      return;
    }

    onAddGuest({
      name: newGuestName.trim(),
      role: newGuestRole,
      rsvpStatus: newGuestRSVP,
      familyName: newGuestFamilyName.trim() || undefined,
      age: newGuestAge ? parseInt(newGuestAge, 10) : undefined,
      tableId: null,
      seatIndex: null
    });

    setNewGuestName('');
    setNewGuestAge('');
    setNewGuestFamilyName('');
    setNewGuestRole('guest');
    setNewGuestRSVP('pending');
  };

  const handleAddFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familySurname.trim()) {
      alert("Please enter a family surname.");
      return;
    }

    const filledMembers = familyMembers.filter(m => m.name.trim() !== '');
    if (filledMembers.length === 0) {
      alert("Please specify at least one family member's name.");
      return;
    }

    // Format surname elegantly
    const formattedFamilyName = familySurname.trim().toLowerCase().endsWith('family')
      ? familySurname.trim()
      : `${familySurname.trim()} Family`;

    // Pre-validate names for duplicates
    for (const m of filledMembers) {
      const exists = guests.some(g => g.name.toLowerCase().trim() === m.name.toLowerCase().trim());
      if (exists) {
        alert(`"${m.name}" is already registered on the guest list! Duplicates are forbidden.`);
        return;
      }
    }

    // Sequentially register each member
    for (const m of filledMembers) {
      await onAddGuest({
        name: m.name.trim(),
        role: m.role,
        rsvpStatus: m.rsvpStatus,
        familyName: formattedFamilyName,
        age: m.age ? parseInt(m.age, 10) : undefined,
        tableId: null,
        seatIndex: null
      });
    }

    // Reset family form
    setFamilySurname('');
    setFamilyMembers([
      { name: '', age: '', role: 'guest', rsvpStatus: 'pending' },
      { name: '', age: '', role: 'guest', rsvpStatus: 'pending' }
    ]);
    alert(`Successfully registered ${formattedFamilyName} with ${filledMembers.length} members!`);
  };

  const handleAddFamilyMemberRow = () => {
    setFamilyMembers(prev => [...prev, { name: '', age: '', role: 'guest', rsvpStatus: 'pending' }]);
  };

  const handleRemoveFamilyMemberRow = (index: number) => {
    if (familyMembers.length <= 1) return;
    setFamilyMembers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFamilyMemberChange = (index: number, field: string, value: any) => {
    setFamilyMembers(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDataBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "wedding_coordination_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Grouping computation for families directory
  const familiesMap: { [familyName: string]: Guest[] } = {};
  const individuals: Guest[] = [];

  guests.forEach(g => {
    if (g.familyName) {
      if (!familiesMap[g.familyName]) {
        familiesMap[g.familyName] = [];
      }
      familiesMap[g.familyName].push(g);
    } else {
      individuals.push(g);
    }
  });

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {[
          { key: 'guests', label: 'Guest Lists Manager', icon: Users },
          { key: 'seating', label: 'Venue Layout Seating', icon: Layout },
          { key: 'budget', label: 'Budget Expenses', icon: DollarSign },
          { key: 'vendors', label: 'Vendor Contacts', icon: Briefcase },
          { key: 'backup', label: 'Export & Settings', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'guests' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Guest list directory */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-slate-950 text-sm">
                    Guest & Family Directory ({guests.length} total)
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {guests.filter(g => g.rsvpStatus === 'going').length} Going • {guests.filter(g => g.rsvpStatus === 'pending').length} Pending • {guests.filter(g => g.rsvpStatus === 'declined').length} Declined
                  </div>
                </div>

                {/* View Toggles */}
                <div className="flex gap-1 bg-slate-50 border border-slate-200/50 rounded-lg p-1">
                  <button
                    onClick={() => setDirectoryView('family')}
                    className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md font-bold transition-all cursor-pointer ${
                      directoryView === 'family' 
                        ? 'bg-slate-900 text-white shadow' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Group by Family
                  </button>
                  <button
                    onClick={() => setDirectoryView('all')}
                    className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md font-bold transition-all cursor-pointer ${
                      directoryView === 'all' 
                        ? 'bg-slate-900 text-white shadow' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Flat Guest List
                  </button>
                </div>
              </div>

              {/* Grouped by Family view */}
              {directoryView === 'family' ? (
                <div className="space-y-4">
                  {Object.keys(familiesMap).map(famName => {
                    const members = familiesMap[famName];
                    const rsvpGoing = members.filter(m => m.rsvpStatus === 'going').length;
                    
                    return (
                      <div key={famName} className="border border-slate-200/70 rounded-xl overflow-hidden shadow-sm bg-slate-50/20">
                        {/* Family Header */}
                        <div className="bg-slate-50 border-b border-slate-150 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">👪</span>
                            <h4 className="font-display font-bold text-slate-850 text-xs">{famName}</h4>
                            <span className="bg-slate-200/80 text-slate-600 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                              {members.length} members
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-mono font-medium">
                            {rsvpGoing} Going Confirmed
                          </span>
                        </div>

                        {/* Family Table Members list */}
                        <div className="p-3 bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-[9px] font-mono uppercase text-slate-400">
                                <th className="pb-1.5">Member Name</th>
                                <th className="pb-1.5 text-center">Age</th>
                                <th className="pb-1.5 text-center">Wedding Role</th>
                                <th className="pb-1.5 text-center">RSVP Status</th>
                                <th className="pb-1.5 text-center">Seating Assignment</th>
                                <th className="pb-1.5 text-right">Delete</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {members.map(member => {
                                const isSeated = member.tableId !== null;
                                const tableAssigned = isSeated ? tables.find(t => t.id === member.tableId) : null;

                                return (
                                  <tr key={member.id} className="hover:bg-slate-50/30">
                                    <td className="py-2.5 font-medium text-slate-800">{member.name}</td>
                                    <td className="py-2.5 text-center text-slate-500 font-mono text-[11px]">{member.age !== undefined ? `${member.age} yrs` : '—'}</td>
                                    <td className="py-2.5 text-center">
                                      <span className="bg-slate-100 text-slate-700 font-mono text-[9px] uppercase px-2 py-0.5 rounded">
                                        {member.role === 'bridesmaid' ? 'lady side' : member.role}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-center">
                                      <select
                                        value={member.rsvpStatus}
                                        onChange={(e) => onUpdateGuestRSVP(member.id, e.target.value as any)}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                                          member.rsvpStatus === 'going'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                            : member.rsvpStatus === 'declined'
                                            ? 'bg-red-50 text-red-800 border-red-100'
                                            : 'bg-amber-50 text-amber-800 border-amber-100'
                                        }`}
                                      >
                                        <option value="going">going</option>
                                        <option value="pending">pending</option>
                                        <option value="declined">declined</option>
                                      </select>
                                    </td>
                                    <td className="py-2.5 text-center">
                                      {isSeated && tableAssigned ? (
                                        <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded">
                                          {tableAssigned.name} (Seat {member.seatIndex !== null ? member.seatIndex + 1 : '?'})
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-slate-400 font-mono">Unseated</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 text-right">
                                      <button
                                        onClick={() => {
                                          if (confirm(`Are you absolutely sure you want to delete ${member.name} from the guest list?`)) {
                                            onDeleteGuest(member.id);
                                          }
                                        }}
                                        className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                                        title="Delete Member"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {/* Individual section (unassigned to a family surname) */}
                  {individuals.length > 0 && (
                    <div className="border border-slate-200/70 rounded-xl overflow-hidden shadow-sm bg-slate-50/20">
                      <div className="bg-slate-50 border-b border-slate-150 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">👤</span>
                          <h4 className="font-display font-bold text-slate-850 text-xs">Individual Solo Guests</h4>
                          <span className="bg-slate-200/80 text-slate-600 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            {individuals.length} members
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[9px] font-mono uppercase text-slate-400">
                              <th className="pb-1.5">Guest Name</th>
                              <th className="pb-1.5 text-center">Age</th>
                              <th className="pb-1.5 text-center">Wedding Role</th>
                              <th className="pb-1.5 text-center">RSVP Status</th>
                              <th className="pb-1.5 text-center">Seating Assignment</th>
                              <th className="pb-1.5 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {individuals.map(member => {
                              const isSeated = member.tableId !== null;
                              const tableAssigned = isSeated ? tables.find(t => t.id === member.tableId) : null;

                              return (
                                <tr key={member.id} className="hover:bg-slate-50/30">
                                  <td className="py-2.5 font-medium text-slate-800">{member.name}</td>
                                  <td className="py-2.5 text-center text-slate-500 font-mono text-[11px]">{member.age !== undefined ? `${member.age} yrs` : '—'}</td>
                                  <td className="py-2.5 text-center">
                                    <span className="bg-slate-100 text-slate-700 font-mono text-[9px] uppercase px-2 py-0.5 rounded">
                                      {member.role === 'bridesmaid' ? 'lady side' : member.role}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <select
                                      value={member.rsvpStatus}
                                      onChange={(e) => onUpdateGuestRSVP(member.id, e.target.value as any)}
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                                        member.rsvpStatus === 'going'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                          : member.rsvpStatus === 'declined'
                                          ? 'bg-red-50 text-red-800 border-red-100'
                                          : 'bg-amber-50 text-amber-800 border-amber-100'
                                      }`}
                                    >
                                      <option value="going">going</option>
                                      <option value="pending">pending</option>
                                      <option value="declined">declined</option>
                                    </select>
                                  </td>
                                  <td className="py-2.5 text-center">
                                    {isSeated && tableAssigned ? (
                                      <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded">
                                        {tableAssigned.name} (Seat {member.seatIndex !== null ? member.seatIndex + 1 : '?'})
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-400 font-mono">Unseated</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      onClick={() => {
                                        if (confirm(`Are you absolutely sure you want to delete ${member.name} from the guest list?`)) {
                                          onDeleteGuest(member.id);
                                        }
                                      }}
                                      className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                                      title="Delete Guest"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Flat directory table */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="py-2">Name</th>
                        <th className="py-2 text-center">Age</th>
                        <th className="py-2 text-center">Family</th>
                        <th className="py-2 text-center">Party Role</th>
                        <th className="py-2 text-center">RSVP Status</th>
                        <th className="py-2 text-center">Seating Assignment</th>
                        <th className="py-2 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {guests.map(guest => {
                        const isSeated = guest.tableId !== null;
                        const tableAssigned = isSeated ? tables.find(t => t.id === guest.tableId) : null;

                        return (
                          <tr key={guest.id} className="hover:bg-slate-50/40">
                            <td className="py-3 font-medium text-slate-900">{guest.name}</td>
                            <td className="py-3 text-center text-slate-500 font-mono">{guest.age !== undefined ? guest.age : '—'}</td>
                            <td className="py-3 text-center text-slate-500 truncate max-w-[110px]" title={guest.familyName}>{guest.familyName ? `👪 ${guest.familyName}` : '—'}</td>
                            <td className="py-3 text-center">
                              <span className="bg-slate-100 border border-slate-200/30 text-slate-700 font-mono text-[9px] uppercase px-2 py-0.5 rounded">
                                {guest.role === 'bridesmaid' ? 'lady side' : guest.role}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <select
                                value={guest.rsvpStatus}
                                onChange={(e) => onUpdateGuestRSVP(guest.id, e.target.value as any)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border focus:outline-none cursor-pointer ${
                                  guest.rsvpStatus === 'going'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                    : guest.rsvpStatus === 'declined'
                                    ? 'bg-red-50 text-red-800 border-red-100'
                                    : 'bg-amber-50 text-amber-800 border-amber-100'
                                }`}
                              >
                                <option value="going">going</option>
                                <option value="pending">pending</option>
                                <option value="declined">declined</option>
                              </select>
                            </td>
                            <td className="py-3 text-center">
                              {isSeated && tableAssigned ? (
                                <span className="text-[10px] font-medium text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                  {tableAssigned.name} (Seat {guest.seatIndex !== null ? guest.seatIndex + 1 : '?'})
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">Unseated</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Are you absolutely sure you want to delete ${guest.name} from the guest list?`)) {
                                    onDeleteGuest(guest.id);
                                  }
                                }}
                                className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                                title="Delete Guest"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Guest / Family Form Panel */}
            <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-slate-500" />
                  Registration Desk
                </h3>
                
                {/* Form type tabs */}
                <div className="flex bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 mt-2.5">
                  <button
                    onClick={() => setGuestFormMode('family')}
                    className={`flex-1 text-center py-1.5 text-[10px] font-mono uppercase tracking-wider rounded font-bold transition-all cursor-pointer ${
                      guestFormMode === 'family' 
                        ? 'bg-slate-900 text-white shadow' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    👪 Add Family Group
                  </button>
                  <button
                    onClick={() => setGuestFormMode('individual')}
                    className={`flex-1 text-center py-1.5 text-[10px] font-mono uppercase tracking-wider rounded font-bold transition-all cursor-pointer ${
                      guestFormMode === 'individual' 
                        ? 'bg-slate-900 text-white shadow' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    👤 Add Solo Guest
                  </button>
                </div>
              </div>

              {/* INDIVIDUAL FORM MODE */}
              {guestFormMode === 'individual' ? (
                <form onSubmit={handleAddGuestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      placeholder="e.g. Rachel Green"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Age (Years)</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={newGuestAge}
                        onChange={(e) => setNewGuestAge(e.target.value)}
                        placeholder="Age"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Family Group (Opt)</label>
                      <input
                        type="text"
                        value={newGuestFamilyName}
                        onChange={(e) => setNewGuestFamilyName(e.target.value)}
                        placeholder="e.g. Green"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Wedding Role</label>
                    <select
                      value={newGuestRole}
                      onChange={(e) => setNewGuestRole(e.target.value as UserRole)}
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                    >
                      <option value="guest">General Guest</option>
                      <option value="groomsman">Groomsman Side</option>
                      <option value="bridesmaid">Lady Side (Bridesmaid)</option>
                      <option value="admin">Wedding Organizer / Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">RSVP Status</label>
                    <select
                      value={newGuestRSVP}
                      onChange={(e) => setNewGuestRSVP(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                    >
                      <option value="pending">Pending Response</option>
                      <option value="going">Confirmed Going</option>
                      <option value="declined">Declined / Not Coming</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Register Solo Guest
                  </button>
                </form>
              ) : (
                /* FAMILY FORM MODE */
                <form onSubmit={handleAddFamilySubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Family Surname / Group Name</label>
                    <input
                      type="text"
                      required
                      value={familySurname}
                      onChange={(e) => setFamilySurname(e.target.value)}
                      placeholder="e.g. Miller, Smith, The Gellers"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 font-semibold"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Will register as "Miller Family"</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-50">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Family Members</span>
                      <button
                        type="button"
                        onClick={handleAddFamilyMemberRow}
                        className="text-[10px] text-slate-900 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Member
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                      {familyMembers.map((member, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 relative space-y-2">
                          {familyMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFamilyMemberRow(idx)}
                              className="absolute top-1 right-1 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                              title="Delete member row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">Member #{idx + 1}</span>
                          
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Full Name (e.g. John Miller)"
                              value={member.name}
                              onChange={(e) => handleFamilyMemberChange(idx, 'name', e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="120"
                              placeholder="Age (Years)"
                              value={member.age}
                              onChange={(e) => handleFamilyMemberChange(idx, 'age', e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-850"
                            />
                            <select
                              value={member.rsvpStatus}
                              onChange={(e) => handleFamilyMemberChange(idx, 'rsvpStatus', e.target.value)}
                              className="w-full text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-850"
                            >
                              <option value="pending">Pending</option>
                              <option value="going">Going</option>
                              <option value="declined">Declined</option>
                            </select>
                          </div>

                          <div>
                            <select
                              value={member.role}
                              onChange={(e) => handleFamilyMemberChange(idx, 'role', e.target.value)}
                              className="w-full text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800"
                            >
                              <option value="guest">General Guest Role</option>
                              <option value="groomsman">Groomsman Side</option>
                              <option value="bridesmaid">Lady Side (Bridesmaid)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Register Family Group
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'seating' && (
          <SeatingPlanner
            tables={tables}
            guests={guests}
            onAddTable={onAddTable}
            onDeleteTable={onDeleteTable}
            onAssignSeat={onAssignSeat}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetManager
            expenses={expenses}
            onAddExpense={onAddExpense}
            onDeleteExpense={onDeleteExpense}
            onTogglePaid={onTogglePaid}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorManager
            vendors={vendors}
            onAddVendor={onAddVendor}
            onDeleteVendor={onDeleteVendor}
          />
        )}

        {activeTab === 'backup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup option card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-sm">Secure Data Backup</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Export all guest records, table seating assignments, logged expenses, and vendor coordinates to a single JSON archive. This secure download can be kept as a hard copy.
              </p>
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download JSON Backup
              </button>
            </div>

            {/* Reset option card */}
            <div className="bg-red-50/20 border border-red-100 rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-bold text-red-950 text-sm flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Factory Database Reset
              </h3>
              <p className="text-xs text-red-600/80 leading-normal">
                Warning: Resetting the database will overwrite all custom seat assignments, messages, and logged expenses back to original pre-wedding seed presets. This action cannot be undone.
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you absolutely sure you want to reset the entire database to default seeds? All current entries will be wiped.')) {
                    onResetDatabase();
                    alert('Database has been reset successfully.');
                  }
                }}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
