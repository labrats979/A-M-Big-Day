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
  Pencil, Mail, Send, AlertCircle, RefreshCw, CheckSquare, Square, Bell, History
} from 'lucide-react';

interface AdminPortalProps {
  guests: Guest[];
  tables: Table[];
  expenses: Expense[];
  vendors: Vendor[];
  settings?: WeddingSettings;
  onUpdateSettings: (settings: Partial<WeddingSettings>) => void;
  onRefreshData?: () => void;
  
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
  onRefreshData,
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
  const [activeTab, setActiveTab] = useState<'guests' | 'seating' | 'budget' | 'vendors' | 'backup' | 'reminders'>('guests');

  // Toggle between viewing Flat list vs Grouped by Family
  const [directoryView, setDirectoryView] = useState<'all' | 'family'>('family');

  // Guest Editing State in Admin Portal
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestAge, setEditGuestAge] = useState('');
  const [editGuestFamilyName, setEditGuestFamilyName] = useState('');
  const [editGuestRole, setEditGuestRole] = useState<UserRole>('guest');
  const [editGuestRSVP, setEditGuestRSVP] = useState<Guest['rsvpStatus']>('pending');
  const [editGuestEmail, setEditGuestEmail] = useState('');
  const [editGuestPhone, setEditGuestPhone] = useState('');

  const startEditingGuest = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setEditGuestName(guest.name);
    setEditGuestAge(guest.age !== undefined ? guest.age.toString() : '');
    setEditGuestFamilyName(guest.familyName || '');
    setEditGuestRole(guest.role);
    setEditGuestRSVP(guest.rsvpStatus);
    setEditGuestEmail(guest.email || '');
    setEditGuestPhone(guest.phone || '');
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
        rsvpStatus: editGuestRSVP,
        email: editGuestEmail.trim() || undefined,
        phone: editGuestPhone.trim() || undefined
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
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');

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
      email: newGuestEmail.trim() || undefined,
      phone: newGuestPhone.trim() || undefined,
      tableId: null,
      seatIndex: null
    });

    setNewGuestName('');
    setNewGuestAge('');
    setNewGuestFamilyName('');
    setNewGuestRole('guest');
    setNewGuestRSVP('pending');
    setNewGuestEmail('');
    setNewGuestPhone('');
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

  // RSVP Reminders & Automated Notifications States
  const [selectedPendingGuestIds, setSelectedPendingGuestIds] = useState<string[]>([]);
  const [reminderChannel, setReminderChannel] = useState<'email' | 'sms' | 'both'>('email');
  const [emailTemplateSubject, setEmailTemplateSubject] = useState(
    settings?.aboutCoupleNames 
      ? `Friendly Reminder: RSVP for ${settings.aboutCoupleNames}'s Wedding!` 
      : "Friendly Reminder: RSVP for Alex & Morgan's Wedding!"
  );
  const [emailTemplateBody, setEmailTemplateBody] = useState(
    `Dear {GuestName},

We are finalizing our guest counts and wedding seating charts. We'd love to know if you will be celebrating with us! 

Please take a moment to RSVP on our website at your earliest convenience.

The countdown is on! We hope to see you there!

Warmly,
{CoupleNames}`
  );
  const [smsTemplateBody, setSmsTemplateBody] = useState(
    `Hi {GuestName}! Just a quick, gentle reminder to RSVP for ${settings?.aboutCoupleNames || "Alex & Morgan"}'s wedding. Please take a second to submit your response. We can't wait to celebrate with you! - {CoupleNames}`
  );
  const [editingEmails, setEditingEmails] = useState<Record<string, string>>({});
  const [editingPhones, setEditingPhones] = useState<Record<string, string>>({});
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [sendingProgressCurrent, setSendingProgressCurrent] = useState(0);
  const [sendingProgressTotal, setSendingProgressTotal] = useState(0);
  const [currentlySendingTo, setCurrentlySendingTo] = useState("");
  const [successLogs, setSuccessLogs] = useState<string[]>([]);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(settings?.autoReminderEnabled ?? false);
  const [autoReminderFrequency, setAutoReminderFrequency] = useState(settings?.autoReminderFrequency ?? 'off');
  const [autoReminderChannel, setAutoReminderChannel] = useState<'email' | 'sms' | 'both'>(settings?.autoReminderChannel ?? 'email');

  // Reminders Helper Functions & Presets
  const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending');

  const templatePresets = [
    {
      name: "Warm Check-in",
      subject: `We'd love to hear from you! 💌 RSVP for our wedding`,
      body: `Dear {GuestName},

We hope you are having a wonderful week! 

We are currently putting together the seating arrangements and finishing the catering menus for our wedding. We would absolutely love to have you with us!

Please take a quick moment to RSVP on our wedding website whenever you have a second.

We can't wait to celebrate!

With love,
{CoupleNames}`
    },
    {
      name: "Urgent: Deadline",
      subject: `Action Required: Please RSVP for our wedding! ⏳`,
      body: `Dear {GuestName},

We are reaching out because our final guest counts and seating details are due soon! 

We really hope you can join us for our special day. Please visit our website and submit your RSVP as soon as possible, ideally before {Deadline}.

If you've already completed it or experienced any technical trouble, just let us know.

Warmly,
{CoupleNames}`
    },
    {
      name: "Short & Sweet",
      subject: `Quick RSVP Reminder - {CoupleNames} Wedding`,
      body: `Hi {GuestName}!

Just a quick, gentle reminder to submit your RSVP on our wedding website!

Let us know if you can make it or if you have any questions.

Best,
{CoupleNames}`
    }
  ];

  const getCompiledTemplate = (bodyText: string, guest: Guest | undefined) => {
    if (!guest) return bodyText;
    const couple = aboutCoupleNames || settings?.aboutCoupleNames || "Alex & Morgan";
    const deadline = "July 20, 2026"; // Consistent with core wedding task deadline
    return bodyText
      .replace(/{GuestName}/g, guest.name)
      .replace(/{CoupleNames}/g, couple)
      .replace(/{Deadline}/g, deadline);
  };

  const handleUpdateGuestEmail = async (guest: Guest, email: string) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guest,
          email: email.trim()
        })
      });
      if (res.ok) {
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.warn("Failed to update guest email:", err);
    }
  };

  const handleUpdateGuestPhone = async (guest: Guest, phone: string) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guest,
          phone: phone.trim()
        })
      });
      if (res.ok) {
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.warn("Failed to update guest phone:", err);
    }
  };

  const handleSendReminders = async () => {
    if (selectedPendingGuestIds.length === 0) {
      alert("Please select at least one pending guest to send reminders to.");
      return;
    }

    setIsSendingReminders(true);
    setSendingProgressCurrent(0);
    setSuccessLogs([]);

    const total = selectedPendingGuestIds.length;
    for (let i = 0; i < total; i++) {
      const gId = selectedPendingGuestIds[i];
      const guest = guests.find(g => g.id === gId);
      if (guest) {
        setCurrentlySendingTo(guest.name);
        setSendingProgressCurrent(i + 1);
        // Realistic simulated network transmission delay
        await new Promise(resolve => setTimeout(resolve, 450));
        
        let targetDetail = "";
        if (reminderChannel === "email") {
          targetDetail = `✉️ Email: ${guest.email || 'no-email@example.com'}`;
        } else if (reminderChannel === "sms") {
          targetDetail = `💬 SMS: ${guest.phone || 'no-phone-number'}`;
        } else {
          const emailPart = guest.email ? `✉️ ${guest.email}` : 'no-email';
          const phonePart = guest.phone ? `💬 ${guest.phone}` : 'no-phone';
          targetDetail = `${emailPart} & ${phonePart}`;
        }
        setSuccessLogs(prev => [...prev, `${guest.name} (${targetDetail})`]);
      }
    }

    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: selectedPendingGuestIds,
          subject: emailTemplateSubject,
          messageBody: emailTemplateBody,
          smsBody: smsTemplateBody,
          channel: reminderChannel,
          type: "manual"
        })
      });

      if (res.ok) {
        if (onRefreshData) {
          onRefreshData();
        }
        alert(`Successfully sent ${total} RSVP reminders via ${reminderChannel === 'both' ? 'Email & SMS' : reminderChannel.toUpperCase()}! Saved in communications history.`);
      } else {
        alert("Reminders processed, but failed to sync updated state. Please refresh.");
      }
    } catch (err) {
      console.warn("Error triggering reminder dispatch:", err);
      alert("Reminders simulated locally, but server synchronization failed.");
    } finally {
      setIsSendingReminders(false);
      setSelectedPendingGuestIds([]);
      setCurrentlySendingTo("");
    }
  };

  const handleClearLogs = async () => {
    if (confirm("Are you sure you want to clear all RSVP reminder notification history logs? This cannot be undone.")) {
      try {
        const res = await fetch("/api/reminders/clear-logs", { method: "POST" });
        if (res.ok) {
          if (onRefreshData) onRefreshData();
          alert("Reminder history logs cleared successfully.");
        }
      } catch (err) {
        console.warn("Failed to clear logs:", err);
      }
    }
  };

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
      setAutoReminderEnabled(settings.autoReminderEnabled ?? false);
      setAutoReminderFrequency(settings.autoReminderFrequency ?? 'off');
      setAutoReminderChannel(settings.autoReminderChannel ?? 'email');
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
      galleryItems: galleryItems,
      autoReminderEnabled: autoReminderEnabled,
      autoReminderFrequency: autoReminderFrequency,
      autoReminderChannel: autoReminderChannel
    });
    alert("Wedding configuration updated successfully!");
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
          { key: 'reminders', label: 'RSVP Reminders', icon: Mail },
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
                                <th className="pb-1.5 text-center">Contact Info</th>
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
                                        <td className="py-2">
                                          <div className="flex flex-col gap-1 w-28 mx-auto">
                                            <input
                                              type="email"
                                              value={editGuestEmail}
                                              onChange={(e) => setEditGuestEmail(e.target.value)}
                                              placeholder="Email"
                                              className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                            />
                                            <input
                                              type="text"
                                              value={editGuestPhone}
                                              onChange={(e) => setEditGuestPhone(e.target.value)}
                                              placeholder="Phone"
                                              className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                                            />
                                          </div>
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
                                          <div className="flex flex-col text-[10px] items-center justify-center">
                                            {member.email ? (
                                              <span className="text-slate-600 truncate max-w-[120px]" title={member.email}>✉️ {member.email}</span>
                                            ) : null}
                                            {member.phone ? (
                                              <span className="text-slate-500 font-mono text-[9px]">📞 {member.phone}</span>
                                            ) : null}
                                            {!member.email && !member.phone ? (
                                              <span className="text-slate-300">—</span>
                                            ) : null}
                                          </div>
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
                              <th className="pb-1.5 text-center">Contact Info</th>
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
                                      <td className="py-2">
                                        <div className="flex flex-col gap-1 w-28 mx-auto">
                                          <input
                                            type="email"
                                            value={editGuestEmail}
                                            onChange={(e) => setEditGuestEmail(e.target.value)}
                                            placeholder="Email"
                                            className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                          />
                                          <input
                                            type="text"
                                            value={editGuestPhone}
                                            onChange={(e) => setEditGuestPhone(e.target.value)}
                                            placeholder="Phone"
                                            className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                                          />
                                        </div>
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
                                        <div className="flex flex-col text-[10px] items-center justify-center">
                                          {member.email ? (
                                            <span className="text-slate-600 truncate max-w-[120px]" title={member.email}>✉️ {member.email}</span>
                                          ) : null}
                                          {member.phone ? (
                                            <span className="text-slate-500 font-mono text-[9px]">📞 {member.phone}</span>
                                          ) : null}
                                          {!member.email && !member.phone ? (
                                            <span className="text-slate-300">—</span>
                                          ) : null}
                                        </div>
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
                        <th className="py-2 text-center">Contact Info</th>
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
                                <td className="py-2">
                                  <div className="flex flex-col gap-1 w-32 mx-auto">
                                    <input
                                      type="email"
                                      value={editGuestEmail}
                                      onChange={(e) => setEditGuestEmail(e.target.value)}
                                      placeholder="Email"
                                      className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                    <input
                                      type="text"
                                      value={editGuestPhone}
                                      onChange={(e) => setEditGuestPhone(e.target.value)}
                                      placeholder="Phone"
                                      className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                                    />
                                  </div>
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
                                  <div className="flex flex-col text-[10px] items-center justify-center">
                                    {guest.email ? (
                                      <span className="text-slate-600 truncate max-w-[120px]" title={guest.email}>✉️ {guest.email}</span>
                                    ) : null}
                                    {guest.phone ? (
                                      <span className="text-slate-500 font-mono text-[9px]">📞 {guest.phone}</span>
                                    ) : null}
                                    {!guest.email && !guest.phone ? (
                                      <span className="text-slate-300">—</span>
                                    ) : null}
                                  </div>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={newGuestEmail}
                        onChange={(e) => setNewGuestEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={newGuestPhone}
                        onChange={(e) => setNewGuestPhone(e.target.value)}
                        placeholder="555-0100"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 font-mono"
                      />
                    </div>
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

        {activeTab === 'reminders' && (
          <div className="space-y-6 animate-fade-in text-slate-800">
            {/* Notification overview statistics cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider font-semibold">RSVP Completion</span>
                  <span className="text-2xl font-bold text-slate-900 block mt-1">
                    {guests.length > 0 
                      ? Math.round(((guests.length - pendingGuests.length) / guests.length) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-medium text-slate-500">
                  {guests.length - pendingGuests.length} out of {guests.length} responded
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="block text-amber-600 text-[10px] font-mono uppercase tracking-wider font-semibold">Pending Reminders</span>
                  <span className="text-2xl font-bold text-slate-900 block mt-1">
                    {pendingGuests.length} guests
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-medium text-amber-600 font-mono">
                  {pendingGuests.filter(g => g.email).length} with email profiles
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="block text-emerald-600 text-[10px] font-mono uppercase tracking-wider font-semibold">Total Campaigns Sent</span>
                  <span className="text-2xl font-bold text-slate-900 block mt-1">
                    {fullDataBackup.notificationLogs?.length || 0} runs
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-medium text-slate-500">
                  {fullDataBackup.notificationLogs?.reduce((acc: number, log: any) => acc + log.recipientsCount, 0) || 0} total email notifications
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider font-semibold">Last Reminder Outing</span>
                  <span className="text-xs font-bold text-slate-800 block mt-2 truncate">
                    {fullDataBackup.notificationLogs && fullDataBackup.notificationLogs.length > 0
                      ? new Date(fullDataBackup.notificationLogs[0].timestamp).toLocaleDateString() + ' ' + new Date(fullDataBackup.notificationLogs[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : "No campaigns sent yet"}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-medium text-slate-500 truncate">
                  {fullDataBackup.notificationLogs && fullDataBackup.notificationLogs.length > 0
                    ? `To: ${fullDataBackup.notificationLogs[0].recipientsCount} pending guests`
                    : "Simulated mailer ready"}
                </div>
              </div>
            </div>

            {/* Main Split Layout: Left: Guest Checklist, Right: Template Customizer & Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Undecided Guest Selection list */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-slate-950 text-sm">
                      Undecided RSVP Recipients ({pendingGuests.length} pending)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Select recipients and update missing email contact addresses.
                    </p>
                  </div>
                  {pendingGuests.length > 0 && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedPendingGuestIds(pendingGuests.map(g => g.id))}
                        className="text-[9px] font-mono text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        onClick={() => setSelectedPendingGuestIds([])}
                        className="text-[9px] font-mono text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer"
                      >
                        None
                      </button>
                    </div>
                  )}
                </div>

                {pendingGuests.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <span className="text-3xl">🎉</span>
                    <h4 className="text-sm font-bold text-slate-900">Zero Pending Responses!</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                      Outstanding work! Every single wedding guest has registered their RSVP response. No notifications are necessary.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[460px] pr-1 space-y-2">
                    {pendingGuests.map(guest => {
                      const isSelected = selectedPendingGuestIds.includes(guest.id);
                      const currentEmailValue = editingEmails[guest.id] !== undefined ? editingEmails[guest.id] : (guest.email || "");
                      const currentPhoneValue = editingPhones[guest.id] !== undefined ? editingPhones[guest.id] : (guest.phone || "");
                      
                      return (
                        <div 
                          key={guest.id}
                          className={`flex items-start gap-3 p-3 border rounded-xl transition-all ${
                            isSelected 
                              ? 'bg-slate-50/50 border-slate-300' 
                              : 'bg-white border-slate-200 hover:bg-slate-50/20'
                          }`}
                        >
                          <button
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPendingGuestIds(prev => prev.filter(id => id !== guest.id));
                              } else {
                                setSelectedPendingGuestIds(prev => [...prev, guest.id]);
                              }
                            }}
                            className="mt-0.5 text-slate-400 hover:text-slate-900 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-slate-900" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display font-bold text-xs text-slate-900 truncate">
                                {guest.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase truncate">
                                {guest.familyName || "Individual"}
                              </span>
                            </div>

                            {/* Contact info inline configuration forms */}
                            <div className="space-y-1 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-mono w-10">Email:</span>
                                <input
                                  type="email"
                                  value={currentEmailValue}
                                  onChange={(e) => {
                                    const newVal = e.target.value;
                                    setEditingEmails(prev => ({ ...prev, [guest.id]: newVal }));
                                  }}
                                  onBlur={() => handleUpdateGuestEmail(guest, currentEmailValue)}
                                  placeholder="name@example.com"
                                  className="flex-1 text-[10px] bg-transparent focus:bg-white border border-transparent hover:border-slate-200 focus:border-slate-300 rounded px-1 py-0.5 text-slate-700 placeholder-slate-400 font-mono outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-mono w-10">Phone:</span>
                                <input
                                  type="text"
                                  value={currentPhoneValue}
                                  onChange={(e) => {
                                    const newVal = e.target.value;
                                    setEditingPhones(prev => ({ ...prev, [guest.id]: newVal }));
                                  }}
                                  onBlur={() => handleUpdateGuestPhone(guest, currentPhoneValue)}
                                  placeholder="555-0100"
                                  className="flex-1 text-[10px] bg-transparent focus:bg-white border border-transparent hover:border-slate-200 focus:border-slate-300 rounded px-1 py-0.5 text-slate-700 placeholder-slate-400 font-mono outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-100/50">
                              <span>Role: {guest.role}</span>
                              <span>
                                Reminded: {guest.lastReminderSent 
                                  ? new Date(guest.lastReminderSent).toLocaleDateString() 
                                  : "Never"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Template Customizer, Presets, and live compiled preview */}
              <div className="lg:col-span-6 space-y-6">
                {/* Template presets and textarea editor */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-display font-bold text-slate-950 text-sm">
                      Configure RSVP Notification Template
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Select dispatch channel and craft highly personalized reminders for pending guests.
                    </p>
                  </div>

                  {/* Dispatch Channel Switcher */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Communication Channel</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                      {(['email', 'sms', 'both'] as const).map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setReminderChannel(ch)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                            reminderChannel === ch 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {ch === 'both' ? 'Email & SMS' : ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset quick buttons - only shown if email or both */}
                  {(reminderChannel === 'email' || reminderChannel === 'both') && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Email Template Presets</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {templatePresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEmailTemplateSubject(preset.subject);
                              setEmailTemplateBody(preset.body);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-bold text-center cursor-pointer transition-colors"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject input - email or both */}
                  {(reminderChannel === 'email' || reminderChannel === 'both') && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Email Subject Line</label>
                      <input
                        type="text"
                        value={emailTemplateSubject}
                        onChange={(e) => setEmailTemplateSubject(e.target.value)}
                        placeholder="e.g. Friendly RSVP Reminder..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400"
                      />
                    </div>
                  )}

                  {/* Body textarea - email or both */}
                  {(reminderChannel === 'email' || reminderChannel === 'both') && (
                    <div className="space-y-1 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Email Body text</label>
                        <span className="text-[9px] font-mono text-slate-400">Placeholders: {"{GuestName}"}, {"{CoupleNames}"}, {"{Deadline}"}</span>
                      </div>
                      <textarea
                        rows={5}
                        value={emailTemplateBody}
                        onChange={(e) => setEmailTemplateBody(e.target.value)}
                        placeholder="Type your email template body here..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-sans leading-relaxed"
                      />
                    </div>
                  )}

                  {/* SMS Message textarea - sms or both */}
                  {(reminderChannel === 'sms' || reminderChannel === 'both') && (
                    <div className="space-y-1.5 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">SMS Message Text</label>
                        <span className="text-[9px] font-mono text-slate-400">Placeholders: {"{GuestName}"}, {"{CoupleNames}"}</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={240}
                        value={smsTemplateBody}
                        onChange={(e) => setSmsTemplateBody(e.target.value)}
                        placeholder="Type your SMS message body here..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-sans leading-relaxed"
                      />
                      <div className="text-[9px] text-slate-400 font-mono text-right">
                        {smsTemplateBody.length} / 240 characters
                      </div>
                    </div>
                  )}

                  {/* Live compiled Email preview - email or both */}
                  {(reminderChannel === 'email' || reminderChannel === 'both') && (
                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-slate-150 pb-1">
                        <span>EMAIL CLIENT LIVE PREVIEW</span>
                        <span className="text-emerald-600 font-bold">● Compiled Real-Time</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono space-y-1">
                        <div><strong className="text-slate-700">From:</strong> weddings@sim-messenger.wedding</div>
                        <div>
                          <strong className="text-slate-700">To:</strong>{' '}
                          {selectedPendingGuestIds.length > 0 
                            ? guests.find(g => g.id === selectedPendingGuestIds[0])?.name + ' <' + (guests.find(g => g.id === selectedPendingGuestIds[0])?.email || "guest@example.com") + '>'
                            : pendingGuests[0] ? pendingGuests[0].name + ' <' + (pendingGuests[0].email || "guest@example.com") + '>' : "Guest Name"}
                          {selectedPendingGuestIds.length > 1 && ` (+${selectedPendingGuestIds.length - 1} more)`}
                        </div>
                        <div><strong className="text-slate-700">Subject:</strong> {emailTemplateSubject}</div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-2xs font-sans min-h-[100px]">
                        {getCompiledTemplate(
                          emailTemplateBody, 
                          selectedPendingGuestIds.length > 0 
                            ? guests.find(g => g.id === selectedPendingGuestIds[0]) 
                            : pendingGuests[0]
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live compiled SMS preview - sms or both */}
                  {(reminderChannel === 'sms' || reminderChannel === 'both') && (
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-950 text-white space-y-2.5 shadow-sm animate-fade-in">
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-slate-800 pb-1.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          SMS WIRELESS SIMULATION
                        </span>
                        <span>
                          To:{' '}
                          {selectedPendingGuestIds.length > 0 
                            ? (guests.find(g => g.id === selectedPendingGuestIds[0])?.phone || "555-0100")
                            : (pendingGuests[0]?.phone || "555-0100")}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          W
                        </div>
                        <div className="flex-1 space-y-1">
                          <span className="text-[10px] text-slate-400 font-medium">Wedding Mailer</span>
                          <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs leading-relaxed max-w-[85%] inline-block">
                            {getCompiledTemplate(
                              smsTemplateBody,
                              selectedPendingGuestIds.length > 0
                                ? guests.find(g => g.id === selectedPendingGuestIds[0])
                                : pendingGuests[0]
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Send Campaign Actions */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSendingReminders || selectedPendingGuestIds.length === 0}
                      onClick={handleSendReminders}
                      className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                        selectedPendingGuestIds.length === 0 
                          ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      Send RSVP Reminders ({reminderChannel === 'both' ? 'Email & SMS' : reminderChannel === 'sms' ? 'SMS' : 'Email'}) to {selectedPendingGuestIds.length} Selected Guests
                    </button>
                    {selectedPendingGuestIds.length === 0 && pendingGuests.length > 0 && (
                      <p className="text-[9px] text-center text-slate-400 font-mono mt-1.5">
                        * Please tick check-boxes on the left to select which guests should receive reminders.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated mailing queue screen HUD overlay when sending */}
            {isSendingReminders && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-800 animate-bounce">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-slate-900 text-sm">Wedding Mailer dispatching...</h3>
                    <p className="text-xs text-slate-400">Processing real-time guest sync and simulated delivery logs</p>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>Sending {sendingProgressCurrent} of {selectedPendingGuestIds.length}</span>
                      <span>{Math.round((sendingProgressCurrent / selectedPendingGuestIds.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-900 h-full transition-all duration-300"
                        style={{ width: `${(sendingProgressCurrent / selectedPendingGuestIds.length) * 100}%` }}
                      />
                    </div>
                    {currentlySendingTo && (
                      <span className="text-[10px] text-slate-600 block italic font-medium">
                        Dispatching SMTP envelope to: {currentlySendingTo}
                      </span>
                    )}
                  </div>

                  {/* Deliveries summary logs */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[10px] font-mono text-left max-h-[140px] overflow-y-auto space-y-1">
                    {successLogs.map((logStr, lIdx) => (
                      <div key={lIdx} className="text-emerald-700 flex items-center gap-1">
                        <span>✓</span>
                        <span>Delivered: {logStr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scheduler Rules Section and Communications Run history */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Automated scheduler configuration card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" />
                    Automated RSVP Scheduler Systems
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Set up automated background triggers to gently check in with pending guests without your manual intervention.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Activation Toggle */}
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={autoReminderEnabled}
                      onChange={(e) => setAutoReminderEnabled(e.target.checked)}
                      className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {autoReminderEnabled ? "✓ Scheduler Engine Armed" : "Scheduler System Suspended"}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Auto-remind guests still pending after the deadline</p>
                    </div>
                  </label>

                  {/* Frequency selection dropdown */}
                  {autoReminderEnabled && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Auto-Reminder Delivery Frequency</label>
                        <select
                          value={autoReminderFrequency}
                          onChange={(e) => setAutoReminderFrequency(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 cursor-pointer"
                        >
                          <option value="weekly">Weekly Checklist Check-in (Recommended)</option>
                          <option value="biweekly">Bi-weekly (Every 14 Days)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Auto-Reminder Channel</label>
                        <select
                          value={autoReminderChannel}
                          onChange={(e) => setAutoReminderChannel(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 cursor-pointer"
                        >
                          <option value="email">Email Notification Only</option>
                          <option value="sms">SMS Text Alert Only</option>
                          <option value="both">Both (Email & SMS text alert)</option>
                        </select>
                      </div>

                      <span className="text-[9px] text-amber-600 block mt-1 font-mono font-medium">
                        * Background triggers execute automatically based on frequency rules.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      onUpdateSettings({
                        autoReminderEnabled: autoReminderEnabled,
                        autoReminderFrequency: autoReminderEnabled ? autoReminderFrequency : 'off',
                        autoReminderChannel: autoReminderEnabled ? autoReminderChannel : 'email'
                      });
                      alert("Automated RSVP reminder scheduler preferences successfully synchronized!");
                    }}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Save Scheduler Settings
                  </button>
                </div>
              </div>

              {/* Sent history logs list card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      Communications Outbox History
                    </h3>
                    {fullDataBackup.notificationLogs && fullDataBackup.notificationLogs.length > 0 && (
                      <button
                        onClick={handleClearLogs}
                        className="text-[9px] font-mono text-red-600 hover:text-red-800 cursor-pointer hover:underline"
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  {(!fullDataBackup.notificationLogs || fullDataBackup.notificationLogs.length === 0) ? (
                    <div className="py-8 text-center space-y-1.5 text-slate-400">
                      <History className="w-8 h-8 mx-auto stroke-1 stroke-slate-300" />
                      <p className="text-xs font-medium">No previous campaign dispatches found</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                        Your mailing history outbox logs will be displayed here as you trigger reminders.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-[220px] space-y-3 pr-1">
                      {fullDataBackup.notificationLogs.map((log: any) => (
                        <div key={log.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-1.5">
                          <div className="flex items-start justify-between gap-2 text-[10px]">
                            <span className="font-bold text-slate-800 truncate">
                              {log.subject}
                            </span>
                            <span className="text-[9px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-full font-mono font-bold whitespace-nowrap">
                              {log.recipientsCount} sent
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 line-clamp-2">
                            {log.messageBody}
                          </p>

                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-100/50">
                            <span>
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              {log.channel === 'sms' 
                                ? '💬 Delivered via SMS Gateway' 
                                : log.channel === 'both' 
                                  ? '📱 Delivered via Email & SMS' 
                                  : '✉️ Delivered via SMTP Server'}
                            </span>
                          </div>

                          {/* Recipients names array tooltip-style footer */}
                          <div className="text-[8px] text-slate-400 truncate pt-0.5">
                            Recipients: {log.recipientsList?.join(", ") || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
