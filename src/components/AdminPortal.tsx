import React, { useState } from 'react';
import { Guest, Table, Expense, Vendor, UserRole, WeddingSettings, GalleryItem } from '../types';
import SeatingPlanner from './SeatingPlanner';
import BudgetManager from './BudgetManager';
import VendorManager from './VendorManager';
import { jsPDF } from 'jspdf';
import { 
  Users, Layout, DollarSign, Briefcase, Download, RotateCcw, 
  UserPlus, Trash2, Check, X, ShieldAlert, CheckCircle, Clock,
  User, Plus, Heart, Sparkles, FolderClosed, Eye, EyeOff, Calendar, Settings,
  Pencil
} from 'lucide-react';

interface AdminPortalProps {
  guests: Guest[];
  tables: Table[];
  expenses: Expense[];
  vendors: Vendor[];
  settings?: WeddingSettings;
  onUpdateSettings: (settings: Partial<WeddingSettings>) => void;
  
  onAddGuest: (guest: Omit<Guest, 'id'>) => void;
  onDeleteGuest: (guestId: string) => void;
  onUpdateGuestRSVP: (guestId: string, status: Guest['rsvpStatus']) => void;
  onUpdateGuest?: (guest: Guest) => void;
  
  onAddTable: (table: Omit<Table, 'id'>) => void;
  onDeleteTable: (tableId: string) => void;
  onClearAllTables: () => void;
  onAssignSeat: (guestId: string, tableId: string | null, seatIndex: number | null) => void;
  onBulkAssignSeats: (updates: { id: string; tableId: string | null; seatIndex: number | null }[]) => void;
  onAddTablesBulk: (tables: Table[]) => void;
  
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
  settings,
  onUpdateSettings,
  onAddGuest,
  onDeleteGuest,
  onUpdateGuestRSVP,
  onUpdateGuest,
  onAddTable,
  onDeleteTable,
  onClearAllTables,
  onAssignSeat,
  onBulkAssignSeats,
  onAddTablesBulk,
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

  // Guest Editing State in Admin Portal
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestAge, setEditGuestAge] = useState('');
  const [editGuestFamilyName, setEditGuestFamilyName] = useState('');
  const [editGuestRole, setEditGuestRole] = useState<UserRole>('guest');
  const [editGuestRSVP, setEditGuestRSVP] = useState<Guest['rsvpStatus']>('pending');

  const startEditingGuest = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setEditGuestName(guest.name);
    setEditGuestAge(guest.age !== undefined ? guest.age.toString() : '');
    setEditGuestFamilyName(guest.familyName || '');
    setEditGuestRole(guest.role);
    setEditGuestRSVP(guest.rsvpStatus);
  };

  const cancelEditingGuest = () => {
    setEditingGuestId(null);
  };

  const saveEditingGuest = (guest: Guest) => {
    if (!editGuestName.trim()) {
      alert("Guest name cannot be empty.");
      return;
    }
    if (onUpdateGuest) {
      onUpdateGuest({
        ...guest,
        name: editGuestName.trim(),
        age: editGuestAge ? parseInt(editGuestAge, 10) : undefined,
        familyName: editGuestFamilyName.trim() || undefined,
        role: editGuestRole,
        rsvpStatus: editGuestRSVP
      });
    }
    setEditingGuestId(null);
  };

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

  // Local state for Settings form
  const [groomsmenCanSee, setGroomsmenCanSee] = useState(settings?.groomsmenCanSeeFloorPlan ?? false);
  const [bridesmaidCanSee, setBridesmaidCanSee] = useState(settings?.bridesmaidCanSeeFloorPlan ?? false);
  const [targetDate, setTargetDate] = useState(settings?.countdownTargetDate ?? "2026-09-18T16:00:00");
  const [countdownTitle, setCountdownTitle] = useState(settings?.countdownTitle ?? "The Big Day Awaits");
  const [countdownDesc, setCountdownDesc] = useState(settings?.countdownDescription ?? "Wedding Countdown");
  
  // New settings for About Us & Gallery
  const [aboutCoupleNames, setAboutCoupleNames] = useState(settings?.aboutCoupleNames ?? "Alex & Morgan");
  const [aboutStory, setAboutStory] = useState(settings?.aboutStory ?? "");
  const [aboutImage1Url, setAboutImage1Url] = useState(settings?.aboutImage1Url ?? "");
  const [aboutImage2Url, setAboutImage2Url] = useState(settings?.aboutImage2Url ?? "");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(settings?.galleryItems ?? []);

  // Form states for adding single Gallery Item
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryType, setNewGalleryType] = useState<'photo' | 'video'>('photo');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');

  React.useEffect(() => {
    if (settings) {
      setGroomsmenCanSee(settings.groomsmenCanSeeFloorPlan ?? false);
      setBridesmaidCanSee(settings.bridesmaidCanSeeFloorPlan ?? false);
      setTargetDate(settings.countdownTargetDate ?? "2026-09-18T16:00:00");
      setCountdownTitle(settings.countdownTitle ?? "The Big Day Awaits");
      setCountdownDesc(settings.countdownDescription ?? "Wedding Countdown");
      setAboutCoupleNames(settings.aboutCoupleNames ?? "Alex & Morgan");
      setAboutStory(settings.aboutStory ?? "");
      setAboutImage1Url(settings.aboutImage1Url ?? "");
      setAboutImage2Url(settings.aboutImage2Url ?? "");
      setGalleryItems(settings.galleryItems ?? []);
    }
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      groomsmenCanSeeFloorPlan: groomsmenCanSee,
      bridesmaidCanSeeFloorPlan: bridesmaidCanSee,
      countdownTargetDate: targetDate,
      countdownTitle: countdownTitle,
      countdownDescription: countdownDesc,
      aboutCoupleNames: aboutCoupleNames,
      aboutStory: aboutStory,
      aboutImage1Url: aboutImage1Url,
      aboutImage2Url: aboutImage2Url,
      galleryItems: galleryItems
    });
    alert("Wedding configuration, Countdown, About Page & Gallery updated successfully!");
  };

  const handleAddGalleryItemLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl.trim()) return;

    const newItem: GalleryItem = {
      id: `gal_${Date.now()}`,
      url: newGalleryUrl.trim(),
      type: newGalleryType,
      caption: newGalleryCaption.trim() || undefined
    };

    setGalleryItems(prev => [...prev, newItem]);
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    alert("New item added to list. Click 'Save Wedding Settings' to persist all changes!");
  };

  const handleRemoveGalleryItemLocal = (id: string) => {
    setGalleryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    const checkPage = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 15) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    // Title / Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("A & M Wedding Coordinator Report", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Complete Wedding Coordination Database Backup`, 20, y);
    y += 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Wedding Summary Statistics", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Backup Date: ${new Date().toLocaleString()}`, 20, y);
    y += 6;
    doc.text(`Total Registered Guests: ${guests.length} (${guests.filter(g => g.rsvpStatus === 'going').length} Going, ${guests.filter(g => g.rsvpStatus === 'pending').length} Pending, ${guests.filter(g => g.rsvpStatus === 'declined').length} Declined)`, 20, y);
    y += 6;
    doc.text(`Total Floor Plan Tables: ${tables.length}`, 20, y);
    y += 6;
    
    const totalBudget = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paidBudget = expenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    doc.text(`Total Expenses Logged: $${totalBudget.toLocaleString()} ($${paidBudget.toLocaleString()} Paid, $${(totalBudget - paidBudget).toLocaleString()} Remaining)`, 20, y);
    y += 6;
    doc.text(`Total Active Vendors: ${vendors.length}`, 20, y);
    y += 15;

    // Guest Directory
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("1. Guest & Seating List Directory", 20, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Name", 20, y);
    doc.text("Role", 75, y);
    doc.text("RSVP Status", 115, y);
    doc.text("Table Seating", 150, y);
    y += 4;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    guests.forEach((g) => {
      checkPage(8);
      doc.text(g.name, 20, y);
      
      const roleText = g.role === 'bridesmaid' ? 'lady side' : g.role;
      doc.text(roleText, 75, y);
      doc.text(g.rsvpStatus, 115, y);
      
      const tableAssigned = g.tableId ? tables.find(t => t.id === g.tableId) : null;
      const seatingText = tableAssigned 
        ? `${tableAssigned.name} (Seat ${g.seatIndex !== null ? g.seatIndex + 1 : '?'})` 
        : "Unseated";
      doc.text(seatingText, 150, y);
      y += 6.5;
    });

    y += 12;

    // Seating Layout
    checkPage(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Table Seating Allocation", 20, y);
    y += 8;

    tables.forEach((t) => {
      checkPage(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${t.name} (${t.type === 'stage' ? 'Stage Fixture' : t.type?.replace('_', ' ') || 'Round Table'})`, 20, y);
      y += 5;

      const seatedGuests = guests.filter(g => g.tableId === t.id);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      
      if (t.seatsCount === 0 || t.type === 'stage') {
        doc.text("Administrative or decorative stage fixture (No table seats)", 25, y);
        y += 6;
      } else if (seatedGuests.length === 0) {
        doc.text(`Empty - Total Capacity: ${t.seatsCount} seats`, 25, y);
        y += 6;
      } else {
        const seatingList = Array.from({ length: t.seatsCount }).map((_, seatIdx) => {
          const guestAtSeat = seatedGuests.find(g => g.seatIndex === seatIdx);
          return `Seat ${seatIdx + 1}: ${guestAtSeat ? guestAtSeat.name : "— Empty —"}`;
        });

        for (let idx = 0; idx < seatingList.length; idx += 2) {
          checkPage(6);
          doc.text(seatingList[idx], 25, y);
          if (seatingList[idx + 1]) {
            doc.text(seatingList[idx + 1], 110, y);
          }
          y += 5.5;
        }
      }
      y += 3;
    });

    y += 12;

    // Budget & Expenses
    checkPage(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("3. Budget Expenses Allocation", 20, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Expense", 20, y);
    doc.text("Category", 95, y);
    doc.text("Amount", 145, y);
    doc.text("Payment Status", 172, y);
    y += 4;
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    expenses.forEach((e) => {
      checkPage(8);
      doc.text(e.description, 20, y);
      doc.text(e.category, 95, y);
      doc.text(`$${e.amount.toLocaleString()}`, 145, y);
      doc.text(e.paid ? "PAID" : "UNPAID", 172, y);
      y += 6.5;
    });

    y += 12;

    // Vendors
    checkPage(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("4. Wedding Vendor Directory", 20, y);
    y += 8;

    vendors.forEach((v) => {
      checkPage(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${v.name} (${v.service})`, 20, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Contact Phone: ${v.contact || 'N/A'}  |  Email: ${v.email || 'N/A'}  |  Price: $${v.cost.toLocaleString()}`, 25, y);
      y += 4.5;
      if (v.notes) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Details: ${v.notes}`, 25, y);
        y += 4.5;
      }
      y += 2;
    });

    // Save the PDF
    doc.save("wedding_coordination_report.pdf");
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
          <div className="space-y-6">
            {/* Admin Exclusive RSVP Statistics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs text-center">
                <span className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider font-semibold">Total Invited</span>
                <span className="text-xl font-bold text-slate-800 block mt-1">{guests.length}</span>
                <span className="text-[9px] text-slate-400 font-mono">guests in system</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 shadow-xs text-center">
                <span className="block text-emerald-600/85 text-[10px] font-mono uppercase tracking-wider font-semibold">Confirm Going</span>
                <span className="text-xl font-bold text-emerald-800 block mt-1">✓ {guests.filter(g => g.rsvpStatus === 'going').length}</span>
                <span className="text-[9px] text-emerald-600 font-mono font-medium">
                  {guests.length > 0 ? Math.round((guests.filter(g => g.rsvpStatus === 'going').length / guests.length) * 100) : 0}% attendance
                </span>
              </div>
              <div className="bg-red-50/40 border border-red-100 rounded-xl p-3 shadow-xs text-center">
                <span className="block text-red-600/85 text-[10px] font-mono uppercase tracking-wider font-semibold">Declined (No)</span>
                <span className="text-xl font-bold text-red-700 block mt-1">✗ {guests.filter(g => g.rsvpStatus === 'declined').length}</span>
                <span className="text-[9px] text-red-500 font-mono">unable to attend</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 shadow-xs text-center">
                <span className="block text-amber-700/85 text-[10px] font-mono uppercase tracking-wider font-semibold">Undecided</span>
                <span className="text-xl font-bold text-amber-800 block mt-1">? {guests.filter(g => g.rsvpStatus === 'pending').length}</span>
                <span className="text-[9px] text-amber-600 font-mono">pending response</span>
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 shadow-xs text-center col-span-2 md:col-span-1">
                <span className="block text-stone-500 text-[10px] font-mono uppercase tracking-wider font-semibold">Registered Families</span>
                <span className="text-xl font-bold text-stone-800 block mt-1">👪 {Object.keys(familiesMap).length}</span>
                <span className="text-[9px] text-stone-400 font-mono">grouped households</span>
              </div>
            </div>

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
                                <th className="pb-1.5 text-center">Family Surname</th>
                                <th className="pb-1.5 text-center">Wedding Role</th>
                                <th className="pb-1.5 text-center">RSVP Status</th>
                                <th className="pb-1.5 text-center">Seating Assignment</th>
                                <th className="pb-1.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {members.map(member => {
                                const isSeated = member.tableId !== null;
                                const tableAssigned = isSeated ? tables.find(t => t.id === member.tableId) : null;
                                const isEditing = editingGuestId === member.id;

                                return (
                                  <tr key={member.id} className="hover:bg-slate-50/30">
                                    {isEditing ? (
                                      <>
                                        <td className="py-2">
                                          <input
                                            type="text"
                                            value={editGuestName}
                                            onChange={(e) => setEditGuestName(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                                          />
                                        </td>
                                        <td className="py-2 text-center">
                                          <input
                                            type="number"
                                            value={editGuestAge}
                                            onChange={(e) => setEditGuestAge(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs text-slate-800 w-12 text-center focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                                          />
                                        </td>
                                        <td className="py-2 text-center">
                                          <input
                                            type="text"
                                            value={editGuestFamilyName}
                                            onChange={(e) => setEditGuestFamilyName(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 w-28 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
                                            placeholder="Family surname..."
                                          />
                                        </td>
                                        <td className="py-2 text-center">
                                          <select
                                            value={editGuestRole}
                                            onChange={(e) => setEditGuestRole(e.target.value as any)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                          >
                                            <option value="guest">guest</option>
                                            <option value="bridesmaid">lady side</option>
                                            <option value="groomsman">groomsman</option>
                                            <option value="admin">admin</option>
                                          </select>
                                        </td>
                                        <td className="py-2 text-center">
                                          <select
                                            value={editGuestRSVP}
                                            onChange={(e) => setEditGuestRSVP(e.target.value as any)}
                                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold text-slate-700"
                                          >
                                            <option value="going">going</option>
                                            <option value="pending">pending</option>
                                            <option value="declined">declined</option>
                                          </select>
                                        </td>
                                        <td className="py-2 text-center">
                                          {isSeated && tableAssigned ? (
                                            <span className="text-[10px] font-medium text-slate-400">
                                              {tableAssigned.name}
                                            </span>
                                          ) : (
                                            <span className="text-[9px] text-slate-400 font-mono">Unseated</span>
                                          )}
                                        </td>
                                        <td className="py-2 text-right whitespace-nowrap">
                                          <div className="flex justify-end gap-1.5">
                                            <button
                                              onClick={() => saveEditingGuest(member)}
                                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                              title="Save Changes"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={cancelEditingGuest}
                                              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                              title="Cancel"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="py-2.5 font-medium text-slate-800">{member.name}</td>
                                        <td className="py-2.5 text-center text-slate-500 font-mono text-[11px]">{member.age !== undefined ? `${member.age} yrs` : '—'}</td>
                                        <td className="py-2.5 text-center text-slate-500 truncate max-w-[110px]" title={member.familyName}>{member.familyName ? `👪 ${member.familyName}` : '—'}</td>
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
                                        <td className="py-2.5 text-right whitespace-nowrap">
                                          <div className="flex justify-end gap-1">
                                            <button
                                              onClick={() => startEditingGuest(member)}
                                              className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                                              title="Edit Guest Details"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm(`Are you absolutely sure you want to delete ${member.name} from the guest list?`)) {
                                                  onDeleteGuest(member.id);
                                                }
                                              }}
                                              className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                              title="Delete Member"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    )}
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
                              <th className="pb-1.5 text-center">Family Surname</th>
                              <th className="pb-1.5 text-center">Wedding Role</th>
                              <th className="pb-1.5 text-center">RSVP Status</th>
                              <th className="pb-1.5 text-center">Seating Assignment</th>
                              <th className="pb-1.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {individuals.map(member => {
                              const isSeated = member.tableId !== null;
                              const tableAssigned = isSeated ? tables.find(t => t.id === member.tableId) : null;
                              const isEditing = editingGuestId === member.id;

                              return (
                                <tr key={member.id} className="hover:bg-slate-50/30">
                                  {isEditing ? (
                                    <>
                                      <td className="py-2">
                                        <input
                                          type="text"
                                          value={editGuestName}
                                          onChange={(e) => setEditGuestName(e.target.value)}
                                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                                        />
                                      </td>
                                      <td className="py-2 text-center">
                                        <input
                                          type="number"
                                          value={editGuestAge}
                                          onChange={(e) => setEditGuestAge(e.target.value)}
                                          className="bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs text-slate-800 w-12 text-center focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                                        />
                                      </td>
                                      <td className="py-2 text-center">
                                        <input
                                          type="text"
                                          value={editGuestFamilyName}
                                          onChange={(e) => setEditGuestFamilyName(e.target.value)}
                                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 w-28 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
                                          placeholder="Family surname..."
                                        />
                                      </td>
                                      <td className="py-2 text-center">
                                        <select
                                          value={editGuestRole}
                                          onChange={(e) => setEditGuestRole(e.target.value as any)}
                                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                        >
                                          <option value="guest">guest</option>
                                          <option value="bridesmaid">lady side</option>
                                          <option value="groomsman">groomsman</option>
                                          <option value="admin">admin</option>
                                        </select>
                                      </td>
                                      <td className="py-2 text-center">
                                        <select
                                          value={editGuestRSVP}
                                          onChange={(e) => setEditGuestRSVP(e.target.value as any)}
                                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold text-slate-700"
                                        >
                                          <option value="going">going</option>
                                          <option value="pending">pending</option>
                                          <option value="declined">declined</option>
                                        </select>
                                      </td>
                                      <td className="py-2 text-center">
                                        {isSeated && tableAssigned ? (
                                          <span className="text-[10px] font-medium text-slate-400">
                                            {tableAssigned.name}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] text-slate-400 font-mono">Unseated</span>
                                        )}
                                      </td>
                                      <td className="py-2 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-1.5">
                                          <button
                                            onClick={() => saveEditingGuest(member)}
                                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                            title="Save Changes"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={cancelEditingGuest}
                                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                            title="Cancel"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-2.5 font-medium text-slate-800">{member.name}</td>
                                      <td className="py-2.5 text-center text-slate-500 font-mono text-[11px]">{member.age !== undefined ? `${member.age} yrs` : '—'}</td>
                                      <td className="py-2.5 text-center text-slate-500 truncate max-w-[110px]" title={member.familyName}>{member.familyName ? `👪 ${member.familyName}` : '—'}</td>
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
                                      <td className="py-2.5 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-1">
                                          <button
                                            onClick={() => startEditingGuest(member)}
                                            className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                                            title="Edit Guest Details"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (confirm(`Are you absolutely sure you want to delete ${member.name} from the guest list?`)) {
                                                onDeleteGuest(member.id);
                                              }
                                            }}
                                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                            title="Delete Guest"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </>
                                  )}
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
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {guests.map(guest => {
                        const isSeated = guest.tableId !== null;
                        const tableAssigned = isSeated ? tables.find(t => t.id === guest.tableId) : null;
                        const isEditing = editingGuestId === guest.id;

                        return (
                          <tr key={guest.id} className="hover:bg-slate-50/40">
                            {isEditing ? (
                              <>
                                <td className="py-2">
                                  <input
                                    type="text"
                                    value={editGuestName}
                                    onChange={(e) => setEditGuestName(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <input
                                    type="number"
                                    value={editGuestAge}
                                    onChange={(e) => setEditGuestAge(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs text-slate-800 w-12 text-center focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <input
                                    type="text"
                                    value={editGuestFamilyName}
                                    onChange={(e) => setEditGuestFamilyName(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 w-32 text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    placeholder="Family surname..."
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <select
                                    value={editGuestRole}
                                    onChange={(e) => setEditGuestRole(e.target.value as any)}
                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  >
                                    <option value="guest">guest</option>
                                    <option value="bridesmaid">lady side</option>
                                    <option value="groomsman">groomsman</option>
                                    <option value="admin">admin</option>
                                  </select>
                                </td>
                                <td className="py-2 text-center">
                                  <select
                                    value={editGuestRSVP}
                                    onChange={(e) => setEditGuestRSVP(e.target.value as any)}
                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold text-slate-700"
                                  >
                                    <option value="going">going</option>
                                    <option value="pending">pending</option>
                                    <option value="declined">declined</option>
                                  </select>
                                </td>
                                <td className="py-2 text-center">
                                  {isSeated && tableAssigned ? (
                                    <span className="text-[10px] font-medium text-slate-400">
                                      {tableAssigned.name}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 font-mono">Unseated</span>
                                  )}
                                </td>
                                <td className="py-2 text-right whitespace-nowrap">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => saveEditingGuest(guest)}
                                      className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                      title="Save Changes"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={cancelEditingGuest}
                                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
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
                                <td className="py-3 text-right whitespace-nowrap">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => startEditingGuest(guest)}
                                      className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                                      title="Edit Guest Details"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
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
                                  </div>
                                </td>
                              </>
                            )}
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
          </div>
        )}

        {activeTab === 'seating' && (
          <SeatingPlanner
            tables={tables}
            guests={guests}
            onAddTable={onAddTable}
            onDeleteTable={onDeleteTable}
            onClearAllTables={onClearAllTables}
            onAssignSeat={onAssignSeat}
            onBulkAssignSeats={onBulkAssignSeats}
            onAddTablesBulk={onAddTablesBulk}
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
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Wedding Settings & Countdown Customizer */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Wedding Settings & Countdown Customizer
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Customize the countdown timing, headers, titles, and permission boundaries for groomsmen and bridesmaids.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Countdown Category Title</label>
                      <input
                        type="text"
                        required
                        value={countdownDesc}
                        onChange={(e) => setCountdownDesc(e.target.value)}
                        placeholder="e.g. Wedding Countdown"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Big Day Title Headline</label>
                      <input
                        type="text"
                        required
                        value={countdownTitle}
                        onChange={(e) => setCountdownTitle(e.target.value)}
                        placeholder="e.g. The Big Day Awaits"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Target Date & Time (Local Time)</label>
                      <input
                        type="datetime-local"
                        required
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Floor Plan Visibility Permissions</span>
                      
                      {/* Groomsman Permission Toggle */}
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/50 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={groomsmenCanSee}
                          onChange={(e) => setGroomsmenCanSee(e.target.checked)}
                          className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {groomsmenCanSee ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                            Allow Groomsmen Access
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Groomsmen can see read-only seating floor map</p>
                        </div>
                      </label>

                      {/* Bridesmaids / Lady Side Permission Toggle */}
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/50 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={bridesmaidCanSee}
                          onChange={(e) => setBridesmaidCanSee(e.target.checked)}
                          className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {bridesmaidCanSee ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                            Allow Bridesmaids (Lady Side) Access
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Bridesmaids can see read-only seating floor map</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* About Us Page Customizer */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  "About Us" Page Content Customizer
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Customize the names, background story, and pictures shown on the public "Our Story" tab.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Couple Names Header</label>
                      <input
                        type="text"
                        required
                        value={aboutCoupleNames}
                        onChange={(e) => setAboutCoupleNames(e.target.value)}
                        placeholder="e.g. Alex & Morgan"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Background Story / Bio</label>
                      <textarea
                        rows={5}
                        required
                        value={aboutStory}
                        onChange={(e) => setAboutStory(e.target.value)}
                        placeholder="Write your story here..."
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Image 1 URL (Public Stock or Uploaded)</label>
                      <input
                        type="text"
                        required
                        value={aboutImage1Url}
                        onChange={(e) => setAboutImage1Url(e.target.value)}
                        placeholder="Image URL"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                      />
                      {aboutImage1Url && (
                        <img src={aboutImage1Url} alt="Preview 1" className="mt-2 h-20 w-auto object-cover rounded-xl border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Image 2 URL (Public Stock or Uploaded)</label>
                      <input
                        type="text"
                        required
                        value={aboutImage2Url}
                        onChange={(e) => setAboutImage2Url(e.target.value)}
                        placeholder="Image URL"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                      />
                      {aboutImage2Url && (
                        <img src={aboutImage2Url} alt="Preview 2" className="mt-2 h-20 w-auto object-cover rounded-xl border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Media Slideshow Customizer */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-100" />
                    Wedding Media Gallery Slideshow Customizer
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Manage the photographic and videographic items shown in the public "Gallery" slideshow tab. YouTube embeds or public image URLs are fully supported.
                  </p>
                </div>

                {/* Add New Item Sub-Form */}
                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-4">
                  <span className="block text-xs font-bold text-slate-850">Add New Media Element</span>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3">
                      <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">Media Type</label>
                      <select
                        value={newGalleryType}
                        onChange={(e) => setNewGalleryType(e.target.value as any)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="photo">📷 Photo (Image URL)</option>
                        <option value="video">🎥 Video Embed Link</option>
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">Source URL / Embed Link</label>
                      <input
                        type="text"
                        placeholder={newGalleryType === 'video' ? 'e.g. https://www.youtube.com/embed/g8S1K7M_VwQ' : 'e.g. https://images.unsplash.com/...'}
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">Visual Caption / Title</label>
                      <input
                        type="text"
                        placeholder="Optional short caption..."
                        value={newGalleryCaption}
                        onChange={(e) => setNewGalleryCaption(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (!newGalleryUrl.trim()) {
                            alert('Please enter a URL for the media asset.');
                            return;
                          }
                          const newItem: GalleryItem = {
                            id: `gal_${Date.now()}`,
                            url: newGalleryUrl.trim(),
                            type: newGalleryType,
                            caption: newGalleryCaption.trim() || undefined
                          };
                          setGalleryItems(prev => [...prev, newItem]);
                          setNewGalleryUrl('');
                          setNewGalleryCaption('');
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer text-center font-bold"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">
                    💡 Tip: For videos, use Youtube "Embed" links containing <code className="bg-slate-200 px-1 rounded">/embed/</code>, or direct MP4 video URLs.
                  </p>
                </div>

                {/* Existing Items Directory Grid */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-slate-800">Current Slideshow Directory ({galleryItems.length} items)</span>
                  {galleryItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No media items in directory. Add some above!</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {galleryItems.map((item) => (
                        <div key={item.id} className="group relative border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50 flex flex-col justify-between">
                          <div>
                            {item.type === 'photo' ? (
                              <img src={item.url} alt="Gallery item" className="w-full h-24 object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-24 bg-slate-950 flex flex-col items-center justify-center text-white text-[10px] font-mono">
                                <span>🎥 Video Link</span>
                                <span className="text-[8px] text-slate-400 truncate max-w-full px-2 mt-1">{item.url}</span>
                              </div>
                            )}
                            <div className="p-2 bg-white">
                              <p className="text-[10px] font-semibold text-slate-700 truncate">{item.caption || 'No Caption'}</p>
                              <span className="text-[8px] text-slate-400 font-mono capitalize">{item.type}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryItemLocal(item.id)}
                            className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full shadow-xs transition-colors cursor-pointer"
                            title="Delete media item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Master Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-8 py-3.5 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Save All Wedding Settings
                </button>
              </div>
            </form>

            {/* System Actions Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backup option card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-500" />
                  Secure PDF Data Backup
                </h3>
                <p className="text-xs text-slate-500 leading-normal font-medium">
                  Export all guest logs, seating assignments, live budget summaries, and vendor contacts into a neatly typeset PDF document. Perfect for offline reference, printing, and hand-outs.
                </p>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Report Backup
                </button>
              </div>

              {/* Reset option card */}
              <div className="bg-red-50/20 border border-red-100 rounded-2xl p-6 space-y-4">
                <h3 className="font-display font-bold text-red-950 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Factory Database Reset
                </h3>
                <p className="text-xs text-red-600/80 leading-normal font-medium">
                  Warning: Resetting the database will overwrite all custom seat assignments, messages, settings, and logged expenses back to original pre-wedding seed presets. This action cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you absolutely sure you want to reset the entire database to default seeds? All current entries will be wiped.')) {
                      onResetDatabase();
                      alert('Database has been reset successfully.');
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Database
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
