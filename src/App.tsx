import React, { useState, useEffect } from 'react';
import { 
  WeddingData, Guest, Table, Expense, Vendor, ScheduleItem, Message, Task, UserRole, WeddingSettings 
} from './types';
import Countdown from './components/Countdown';
import TaskBoard from './components/TaskBoard';
import Scheduler from './components/Scheduler';
import ChatBoard from './components/ChatBoard';
import CalendarView from './components/CalendarView';
import AdminPortal from './components/AdminPortal';
import SeatingPlanner from './components/SeatingPlanner';
import VendorManager from './components/VendorManager';
import RsvpSection from './components/RsvpSection';
import AboutUs from './components/AboutUs';
import GalleryView from './components/GalleryView';
import { 
  Heart, Calendar, MessageSquare, ShieldCheck, LogOut, 
  Settings, Lock, ArrowRight, ClipboardCheck, Sparkles, AlertCircle, Layout, Briefcase,
  BookOpen, Image
} from 'lucide-react';

export default function App() {
  // -------------------------------------------------------------------------
  // Authentication & Session State
  // -------------------------------------------------------------------------
  const [siteVerified, setSiteVerified] = useState(true);
  const [siteInputPassword, setSiteInputPassword] = useState('');
  const [sitePassError, setSitePassError] = useState(false);

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('wedding_user_name') || 'Guest';
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('wedding_user_role') as UserRole) || 'guest';
  });
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRole>('guest');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminPassError, setAdminPassError] = useState(false);

  // -------------------------------------------------------------------------
  // Core Database State
  // -------------------------------------------------------------------------
  const [data, setData] = useState<WeddingData>({
    guests: [],
    tables: [],
    expenses: [],
    vendors: [],
    schedule: [],
    messages: [],
    tasks: []
  });
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<'home' | 'about' | 'gallery' | 'rsvp' | 'schedule' | 'chat' | 'seating' | 'vendors'>('home');
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [adminUnlockPassword, setAdminUnlockPassword] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch & Sync Logic
  // -------------------------------------------------------------------------
  const fetchWeddingData = async () => {
    try {
      const res = await fetch('/api/wedding-data');
      if (!res.ok) {
        console.warn(`Wedding data sync: Server returned status ${res.status}. Retrying in next cycle...`);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Wedding data sync: Received non-JSON response. Retrying in next cycle...');
        return;
      }
      const weddingData = await res.json();
      setData(weddingData);
    } catch (err) {
      console.warn('Wedding data sync: Connection temporarily unavailable, retrying...', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeddingData();
    // Poll server every 4 seconds to enable live messaging and real-time coordination updates
    const syncInterval = setInterval(fetchWeddingData, 4000);
    return () => clearInterval(syncInterval);
  }, []);

  // -------------------------------------------------------------------------
  // Authentication Handlers
  // -------------------------------------------------------------------------
  const handleSitePasswordVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (siteInputPassword === 'A&M2026') {
      setSiteVerified(true);
      setSitePassError(false);
      localStorage.setItem('wedding_site_verified', 'true');
    } else {
      setSitePassError(true);
    }
  };

  const handleUserSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    // Check if registering as admin (requires passcode)
    if (roleInput === 'admin' && adminPassInput !== 'A&M2026') {
      setAdminPassError(true);
      return;
    }

    setAdminPassError(false);
    const sanitizedName = nameInput.trim();

    // Check if guest name already exists in database (acts as account recovery / duplicate avoidance)
    const existingGuest = data.guests.find(
      g => g.name.toLowerCase().trim() === sanitizedName.toLowerCase().trim()
    );

    let assignedRole = roleInput;

    if (existingGuest) {
      // Automatically log them in as the existing guest role
      assignedRole = existingGuest.role;
    } else {
      // Register new guest in database
      try {
        const res = await fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sanitizedName,
            role: assignedRole,
            rsvpStatus: 'going'
          })
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const updatedGuests = await res.json();
            setData(prev => ({ ...prev, guests: updatedGuests }));
          }
        }
      } catch (err) {
        console.warn('Error auto-registering guest:', err);
      }
    }

    setUserName(sanitizedName);
    setUserRole(assignedRole);
    localStorage.setItem('wedding_user_name', sanitizedName);
    localStorage.setItem('wedding_user_role', assignedRole);
    
    // Automatically turn on admin mode if they log in as admin role
    if (assignedRole === 'admin') {
      setShowAdminMode(true);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('wedding_user_name');
    localStorage.removeItem('wedding_user_role');
    setUserName('Guest');
    setUserRole('guest');
    setNameInput('');
    setShowAdminMode(false);
  };

  const handleUpdateSettings = async (updatedSettings: Partial<WeddingSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        const updatedData = await res.json();
        setData(updatedData);
      }
    } catch (err) {
      console.warn('Error saving settings:', err);
    }
  };

  // -------------------------------------------------------------------------
  // Database Update Handlers (Proxying API Calls)
  // -------------------------------------------------------------------------
  
  // Guest handlers
  const handleAddGuest = async (newGuest: Omit<Guest, 'id'>) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      });
      if (res.ok) {
        const updatedGuests = await res.json();
        setData(prev => ({ ...prev, guests: updatedGuests }));
      }
    } catch (err) {
      console.warn('Error adding guest:', err);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      const res = await fetch(`/api/guests/${guestId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedGuests = await res.json();
        setData(prev => ({ ...prev, guests: updatedGuests }));
      }
    } catch (err) {
      console.warn('Error deleting guest:', err);
    }
  };

  const handleUpdateGuestRSVP = async (guestId: string, status: Guest['rsvpStatus']) => {
    const guestObj = data.guests.find(g => g.id === guestId);
    if (!guestObj) return;

    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...guestObj, rsvpStatus: status })
      });
      if (res.ok) {
        const updatedGuests = await res.json();
        setData(prev => ({ ...prev, guests: updatedGuests }));
      }
    } catch (err) {
      console.warn('Error updating guest RSVP:', err);
    }
  };

  const handleUpdateGuest = async (updatedGuest: Guest) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGuest)
      });
      if (res.ok) {
        const updatedGuests = await res.json();
        setData(prev => ({ ...prev, guests: updatedGuests }));
      }
    } catch (err) {
      console.warn('Error updating guest:', err);
    }
  };

  // Table handlers
  const handleAddTable = async (newTable: Omit<Table, 'id'> & { id?: string }) => {
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable)
      });
      if (res.ok) {
        const updatedTables = await res.json();
        setData(prev => ({ ...prev, tables: updatedTables }));
      }
    } catch (err) {
      console.warn('Error adding table:', err);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      const res = await fetch(`/api/tables/${tableId}`, { method: 'DELETE' });
      if (res.ok) {
        const payload = await res.json();
        setData(prev => ({
          ...prev,
          tables: payload.tables,
          guests: payload.guests
        }));
      }
    } catch (err) {
      console.warn('Error deleting table:', err);
    }
  };

  const handleClearAllTables = async () => {
    try {
      const res = await fetch('/api/tables/clear-all', { method: 'POST' });
      if (res.ok) {
        const payload = await res.json();
        setData(prev => ({
          ...prev,
          tables: payload.tables,
          guests: payload.guests
        }));
      }
    } catch (err) {
      console.warn('Error clearing all tables:', err);
    }
  };

  const handleAssignSeat = async (guestId: string, tableId: string | null, seatIndex: number | null) => {
    const guestObj = data.guests.find(g => g.id === guestId);
    if (!guestObj) return;

    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...guestObj, tableId, seatIndex })
      });
      if (res.ok) {
        const updatedGuests = await res.json();
        setData(prev => ({ ...prev, guests: updatedGuests }));
      }
    } catch (err) {
      console.warn('Error assigning seat:', err);
    }
  };

  const handleBulkAssignSeats = async (updates: { id: string; tableId: string | null; seatIndex: number | null }[]) => {
    try {
      const res = await fetch('/api/guests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedGuests = await res.json();
        setData(prev => ({ ...prev, guests: updatedGuests }));
      }
    } catch (err) {
      console.warn('Error bulk assigning seats:', err);
    }
  };

  const handleAddTablesBulk = async (tablesToSave: Table[]) => {
    try {
      const res = await fetch('/api/tables/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tablesToSave)
      });
      if (res.ok) {
        const updatedTables = await res.json();
        setData(prev => ({ ...prev, tables: updatedTables }));
      }
    } catch (err) {
      console.warn('Error bulk adding tables:', err);
    }
  };

  // Expense handlers
  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      if (res.ok) {
        const updatedExpenses = await res.json();
        setData(prev => ({ ...prev, expenses: updatedExpenses }));
      }
    } catch (err) {
      console.warn('Error adding expense:', err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedExpenses = await res.json();
        setData(prev => ({ ...prev, expenses: updatedExpenses }));
      }
    } catch (err) {
      console.warn('Error deleting expense:', err);
    }
  };

  const handleTogglePaid = async (expenseId: string) => {
    const expObj = data.expenses.find(e => e.id === expenseId);
    if (!expObj) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expObj, paid: !expObj.paid })
      });
      if (res.ok) {
        const updatedExpenses = await res.json();
        setData(prev => ({ ...prev, expenses: updatedExpenses }));
      }
    } catch (err) {
      console.warn('Error toggling paid state:', err);
    }
  };

  // Vendor handlers
  const handleAddVendor = async (newVendor: Omit<Vendor, 'id'>) => {
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor)
      });
      if (res.ok) {
        const updatedVendors = await res.json();
        setData(prev => ({ ...prev, vendors: updatedVendors }));
      }
    } catch (err) {
      console.warn('Error adding vendor:', err);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedVendors = await res.json();
        setData(prev => ({ ...prev, vendors: updatedVendors }));
      }
    } catch (err) {
      console.warn('Error deleting vendor:', err);
    }
  };

  // Schedule handlers
  const handleAddScheduleItem = async (newItem: Omit<ScheduleItem, 'id'>) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        const updatedSchedule = await res.json();
        setData(prev => ({ ...prev, schedule: updatedSchedule }));
      }
    } catch (err) {
      console.warn('Error adding schedule item:', err);
    }
  };

  const handleDeleteScheduleItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/schedule/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedSchedule = await res.json();
        setData(prev => ({ ...prev, schedule: updatedSchedule }));
      }
    } catch (err) {
      console.warn('Error deleting schedule item:', err);
    }
  };

  // Message board chat handler
  const handleSendMessage = async (content: string, imageUrl?: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: userName,
          role: userRole,
          content,
          imageUrl
        })
      });
      if (res.ok) {
        const updatedMessages = await res.json();
        setData(prev => ({ ...prev, messages: updatedMessages }));
      }
    } catch (err) {
      console.warn('Error sending message:', err);
    }
  };

  // Tasks handlers
  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        const updatedTasks = await res.json();
        setData(prev => ({ ...prev, tasks: updatedTasks }));
      }
    } catch (err) {
      console.warn('Error adding task:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    const taskObj = data.tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskObj, status })
      });
      if (res.ok) {
        const updatedTasks = await res.json();
        setData(prev => ({ ...prev, tasks: updatedTasks }));
      }
    } catch (err) {
      console.warn('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedTasks = await res.json();
        setData(prev => ({ ...prev, tasks: updatedTasks }));
      }
    } catch (err) {
      console.warn('Error deleting task:', err);
    }
  };

  // Factory reset
  const handleResetDatabase = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const resetData = await res.json();
        setData(resetData);
      }
    } catch (err) {
      console.warn('Error resetting database:', err);
    }
  };

  // -------------------------------------------------------------------------
  // Render Password Gates / Signup Flow
  // -------------------------------------------------------------------------

  // Phase 1: Site Gate Lock (A&M2026)
  if (!siteVerified) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl text-center">
          <div className="mx-auto bg-slate-850 w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-800">
            <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">A & M 2026</h1>
            <p className="text-xs text-slate-400 font-medium">Wedding Coordination Portal Access Gate</p>
          </div>

          <form onSubmit={handleSitePasswordVerify} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                required
                value={siteInputPassword}
                onChange={(e) => setSiteInputPassword(e.target.value)}
                placeholder="Enter Portal Access Password..."
                className="w-full text-center text-xs tracking-widest bg-slate-850 text-white rounded-2xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
              />
              {sitePassError && (
                <div className="flex items-center justify-center gap-1.5 text-red-400 text-[11px] mt-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Invalid password. Hint: check capital letters & symbols</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Verify Code <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-slate-500 font-mono">
            Requires secure cryptographic site verification • Date: 2026
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main Interface Dashboard Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      
      {/* Upper Navigation & Wedding Identity Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-950">
              <Heart className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900 tracking-tight leading-none">A & M 2026</h1>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold block mt-1">Wedding Portal</span>
            </div>
          </div>

          {/* User badge and active navigation tabs */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex gap-1.5 border border-slate-200 rounded-xl p-1 bg-slate-50">
              {[
                { id: 'home', label: 'Wedding Home', icon: Heart, visible: true },
                { id: 'about', label: 'Our Story', icon: BookOpen, visible: true },
                { id: 'gallery', label: 'Gallery', icon: Image, visible: true },
                { id: 'rsvp', label: 'RSVP Response', icon: ClipboardCheck, visible: true },
                { id: 'schedule', label: 'Duties & Times', icon: Calendar, visible: true },
                { id: 'chat', label: 'Coordination', icon: MessageSquare, visible: true },
                { id: 'seating', label: 'Floor Plan', icon: Layout, visible: ['admin', 'groomsman', 'bridesmaid'].includes(userRole) },
                { id: 'vendors', label: 'Vendors', icon: Briefcase, visible: ['admin', 'groomsman', 'bridesmaid'].includes(userRole) }
              ].filter(t => t.visible).map(tab => {
                const Icon = tab.icon;
                const isSelected = activeMainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMainTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm font-medium">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin mb-4" />
            Loading Portal Database...
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Active view component */}
            {activeMainTab === 'home' && (
              <div className="space-y-8 animate-fade-in">
                {/* Countdown & Introduction cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  <div className="md:col-span-4 flex flex-col justify-between h-full">
                    <Countdown 
                      targetDateString={data.settings?.countdownTargetDate}
                      title={data.settings?.countdownTitle}
                      description={data.settings?.countdownDescription}
                    />
                  </div>
                  <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md font-bold">Coordination Workspace</span>
                      <h2 className="font-display text-xl font-bold text-slate-950 tracking-tight mt-1.5">Welcome to {data.settings?.aboutCoupleNames || "Alex & Morgan"}'s Wedding Portal.</h2>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        This digital wedding coordinator tracks attendance list rosters, seating allocations, budget expenses, schedule coordination, and real-time announcements. Use the navigation buttons in the top right to explore your tasks or chat with other groomsmen and bridesmaids.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono border-t border-slate-100 pt-4 text-slate-600">
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase">My Seating Assignment</span>
                        <span className="font-bold text-slate-900 mt-1 block">
                          {data.guests.find(g => g.name.toLowerCase().trim() === userName.toLowerCase().trim())?.tableId 
                            ? data.tables.find(t => t.id === data.guests.find(g => g.name.toLowerCase().trim() === userName.toLowerCase().trim())?.tableId)?.name
                            : 'Unseated / TBD'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase">My RSVP Status</span>
                        <span className="font-bold text-slate-900 mt-1 block">
                          {data.guests.find(g => g.name.toLowerCase().trim() === userName.toLowerCase().trim())?.rsvpStatus || 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase">Wedding Party Side</span>
                        <span className="font-bold text-slate-900 mt-1 block capitalize">
                          {userRole === 'bridesmaid' ? 'lady side' : userRole}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared Coordinated Schedule & Duties */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                  <Scheduler
                    schedule={data.schedule}
                    userRole={userRole}
                    onAddScheduleItem={handleAddScheduleItem}
                    onDeleteScheduleItem={handleDeleteScheduleItem}
                  />
                </div>
              </div>
            )}

            {activeMainTab === 'about' && (
              <div className="animate-fade-in">
                <AboutUs settings={data.settings} />
              </div>
            )}

            {activeMainTab === 'gallery' && (
              <div className="animate-fade-in">
                <GalleryView settings={data.settings} />
              </div>
            )}

            {activeMainTab === 'rsvp' && (
              <div className="animate-fade-in">
                <RsvpSection
                  guests={data.guests}
                  tables={data.tables}
                  userName={userName}
                  userRole={userRole}
                  onSignIn={(name, role) => {
                    setUserName(name);
                    setUserRole(role);
                    localStorage.setItem('wedding_user_name', name);
                    localStorage.setItem('wedding_user_role', role);
                    if (role === 'admin') {
                      setShowAdminMode(true);
                    }
                  }}
                  onSignOut={handleSignOut}
                  onRefreshData={fetchWeddingData}
                />
              </div>
            )}

            {activeMainTab === 'schedule' && (
              <div className="animate-fade-in">
                <Scheduler
                  schedule={data.schedule}
                  userRole={userRole}
                  onAddScheduleItem={handleAddScheduleItem}
                  onDeleteScheduleItem={handleDeleteScheduleItem}
                />
              </div>
            )}

            {activeMainTab === 'chat' && (
              <div className="animate-fade-in">
                <ChatBoard
                  messages={data.messages}
                  userName={userName}
                  userRole={userRole}
                  onSendMessage={handleSendMessage}
                />
              </div>
            )}

            {activeMainTab === 'seating' && (() => {
              const groomsmenCanSee = data.settings?.groomsmenCanSeeFloorPlan ?? false;
              const bridesmaidCanSee = data.settings?.bridesmaidCanSeeFloorPlan ?? false;
              
              const isAllowed = userRole === 'admin' || 
                (userRole === 'groomsman' && groomsmenCanSee) || 
                (userRole === 'bridesmaid' && bridesmaidCanSee);
                
              if (!isAllowed) {
                return (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm animate-fade-in my-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto border border-slate-200">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-2xl font-bold text-slate-950 tracking-tight">The Floor Plan is not yet down</h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                        The wedding administrator is still perfecting the table arrangements and layout design. Please check back later once assignments are finalized!
                      </p>
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="animate-fade-in">
                  <SeatingPlanner
                    tables={data.tables}
                    guests={data.guests}
                    onAddTable={handleAddTable}
                    onDeleteTable={handleDeleteTable}
                    onClearAllTables={handleClearAllTables}
                    onAssignSeat={handleAssignSeat}
                    onBulkAssignSeats={handleBulkAssignSeats}
                    onAddTablesBulk={handleAddTablesBulk}
                    readOnly={userRole !== 'admin'}
                  />
                </div>
              );
            })()}

            {activeMainTab === 'vendors' && (
              <div className="animate-fade-in">
                <VendorManager
                  vendors={data.vendors}
                  onAddVendor={handleAddVendor}
                  onDeleteVendor={handleDeleteVendor}
                  readOnly={userRole !== 'admin'}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer Area with Secured Coordinator Admin Expansion Panel */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Admin Expansion Toggle Section */}
          <div className="border-t border-slate-100 pt-8 flex flex-col items-center">
            {showAdminMode ? (
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-slate-900" />
                    <h2 className="font-display font-bold text-slate-950 text-base">Organizer & Admin Console</h2>
                  </div>
                  <button
                    onClick={() => setShowAdminMode(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Hide Admin Console
                  </button>
                </div>

                {/* Render the full comprehensive Admin portal panel */}
                <AdminPortal
                  guests={data.guests}
                  tables={data.tables}
                  expenses={data.expenses}
                  vendors={data.vendors}
                  schedule={data.schedule}
                  settings={data.settings}
                  tasks={data.tasks}
                  onAddTask={handleAddTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onDeleteTask={handleDeleteTask}
                  
                  onAddGuest={handleAddGuest}
                  onDeleteGuest={handleDeleteGuest}
                  onUpdateGuestRSVP={handleUpdateGuestRSVP}
                  onUpdateGuest={handleUpdateGuest}
                  
                  onAddTable={handleAddTable}
                  onDeleteTable={handleDeleteTable}
                  onClearAllTables={handleClearAllTables}
                  onAssignSeat={handleAssignSeat}
                  onBulkAssignSeats={handleBulkAssignSeats}
                  onAddTablesBulk={handleAddTablesBulk}
                  
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onTogglePaid={handleTogglePaid}
                  
                  onAddVendor={handleAddVendor}
                  onDeleteVendor={handleDeleteVendor}
                  onAddScheduleItem={handleAddScheduleItem}
                  onDeleteScheduleItem={handleDeleteScheduleItem}
                  onResetDatabase={handleResetDatabase}
                  onUpdateSettings={handleUpdateSettings}
                  onRefreshData={fetchWeddingData}
                  fullDataBackup={data}
                />
              </div>
            ) : (
              <div className="max-w-md w-full text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Wedding Coordinators</span>
                  <h3 className="font-display font-bold text-slate-900 text-sm">Protected Wedding Administrator Portal</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                    Admins, Brides, and Groom parties can expand the panel to manage vendor pricing, table assignments, and guest lists.
                  </p>
                </div>

                <div className="flex justify-center gap-2">
                  <input
                    type="password"
                    value={adminUnlockPassword}
                    onChange={(e) => setAdminUnlockPassword(e.target.value)}
                    placeholder="Enter Admin Passcode..."
                    className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800 w-44 text-center"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (adminUnlockPassword === 'A&M2026') {
                          setShowAdminMode(true);
                          setAdminUnlockError(false);
                          setAdminUnlockPassword('');
                        } else {
                          setAdminUnlockError(true);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (adminUnlockPassword === 'A&M2026') {
                        setShowAdminMode(true);
                        setAdminUnlockError(false);
                        setAdminUnlockPassword('');
                      } else {
                        setAdminUnlockError(true);
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Open Console
                  </button>
                </div>
                {adminUnlockError && (
                  <span className="text-[10px] text-red-500 font-medium block">Incorrect passcode. Hint: Site code</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-8 text-xs text-slate-400">
            <p className="font-mono">© 2026 A & M Wedding Coordination Applet • All Rights Reserved</p>
            <div className="flex gap-4">
              <span>Security: end-to-end sandbox encrypted</span>
              <span>•</span>
              <span>Fully offline responsive caching enabled</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
