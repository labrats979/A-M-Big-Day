import React, { useState, useEffect } from 'react';
import { Guest, Table, UserRole } from '../types';
import { Search, CheckCircle, XCircle, Clock, Users, Heart, Sparkles, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

interface RsvpSectionProps {
  guests: Guest[];
  tables: Table[];
  userName: string;
  userRole: UserRole;
  onSignIn: (name: string, role: UserRole) => void;
  onSignOut: () => void;
  onRefreshData: () => Promise<void>;
}

export default function RsvpSection({
  guests,
  tables,
  userName,
  userRole,
  onSignIn,
  onSignOut,
  onRefreshData
}: RsvpSectionProps) {
  const [searchName, setSearchName] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundGuest, setFoundGuest] = useState<Guest | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Guest[]>([]);
  const [rsvpStatuses, setRsvpStatuses] = useState<{ [guestId: string]: Guest['rsvpStatus'] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Auto-load if guest is logged in
  useEffect(() => {
    if (userName && userName !== 'Guest' && guests.length > 0) {
      const current = guests.find(g => g.name.toLowerCase().trim() === userName.toLowerCase().trim());
      if (current) {
        setFoundGuest(current);
        if (current.familyName) {
          const members = guests.filter(g => g.familyName === current.familyName);
          setFamilyMembers(members);
          const initialStatuses: { [id: string]: Guest['rsvpStatus'] } = {};
          members.forEach(m => {
            initialStatuses[m.id] = m.rsvpStatus;
          });
          setRsvpStatuses(initialStatuses);
        } else {
          setFamilyMembers([]);
          setRsvpStatuses({ [current.id]: current.rsvpStatus });
        }
      }
    } else {
      setFoundGuest(null);
      setFamilyMembers([]);
      setRsvpStatuses({});
      setIsEditing(false);
    }
  }, [userName, guests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSaveSuccess(false);

    if (!searchName.trim()) {
      setSearchError('Please enter a name to search.');
      return;
    }

    const nameToFind = searchName.trim().toLowerCase();
    const match = guests.find(g => g.name.toLowerCase().trim() === nameToFind);

    if (match) {
      // Set active user (logs them in)
      onSignIn(match.name, match.role);
      setFoundGuest(match);
      
      // Load family members if they exist
      if (match.familyName) {
        const members = guests.filter(g => g.familyName === match.familyName);
        setFamilyMembers(members);
        const initialStatuses: { [id: string]: Guest['rsvpStatus'] } = {};
        members.forEach(m => {
          initialStatuses[m.id] = m.rsvpStatus;
        });
        setRsvpStatuses(initialStatuses);
      } else {
        setFamilyMembers([]);
        setRsvpStatuses({ [match.id]: match.rsvpStatus });
      }
      setIsEditing(true);
      setSearchName('');
    } else {
      setSearchError("We couldn't find that name on our guest list. Please make sure the spelling matches your invitation, or contact the couple to be added.");
    }
  };

  const handleStatusChange = (guestId: string, status: Guest['rsvpStatus']) => {
    setRsvpStatuses(prev => ({
      ...prev,
      [guestId]: status
    }));
    setSaveSuccess(false);
  };

  const handleSubmitRsvp = async () => {
    setIsSubmitting(true);
    setSearchError(null);
    
    try {
      const updates = Object.keys(rsvpStatuses).map(id => ({
        id,
        rsvpStatus: rsvpStatuses[id]
      }));

      const res = await fetch('/api/guests/bulk-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        await onRefreshData();
        setSaveSuccess(true);
        setIsEditing(false);
      } else {
        setSearchError('Failed to save RSVP. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      setSearchError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute stats
  const totalGuests = guests.length;
  const totalGoing = guests.filter(g => g.rsvpStatus === 'going').length;
  const totalDeclined = guests.filter(g => g.rsvpStatus === 'declined').length;
  const totalPending = guests.filter(g => g.rsvpStatus === 'pending').length;

  // Compute unique families
  const uniqueFamiliesSet = new Set(guests.filter(g => g.familyName).map(g => g.familyName));
  const totalFamilies = uniqueFamiliesSet.size;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-mono tracking-widest text-amber-800 uppercase bg-amber-50 px-2.5 py-1 rounded-full font-bold">
              Wedding Invitation Rsvp
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Submit or Edit Your Response
            </h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Tell us if you can make it! Type in your full name as listed on your invite. You can return anytime to update your choices.
            </p>
          </div>

          {/* NOT SIGNED IN / SEARCHING */}
          {!foundGuest && (
            <form onSubmit={handleSearch} className="space-y-4 max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Enter full name (e.g. Sophia Martinez)"
                    className="w-full bg-stone-50 text-stone-900 rounded-xl pl-10 pr-4 py-2.5 text-xs border border-stone-200 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  Search Invitation <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {searchError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in font-medium">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <p className="leading-relaxed">{searchError}</p>
                </div>
              )}
            </form>
          )}

          {/* SIGNED IN / MANAGING RSVP */}
          {foundGuest && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-stone-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-stone-200/60">
                <div>
                  <p className="text-[10px] font-mono uppercase text-stone-400">Invitation Identified</p>
                  <h3 className="text-sm font-bold text-stone-800 mt-0.5">
                    {foundGuest.name}
                    {foundGuest.familyName && (
                      <span className="text-xs font-normal text-stone-500 ml-1.5">
                        ({foundGuest.familyName} Group)
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Change Response
                    </button>
                  )}
                  <button
                    onClick={onSignOut}
                    className="text-stone-400 hover:text-stone-600 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    title="Switch guest invitation search"
                  >
                    Logout / Switch Name
                  </button>
                </div>
              </div>

              {/* SUCCESS MESSAGE */}
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-start gap-3 animate-fade-in font-medium max-w-lg mx-auto">
                  <span className="text-xl leading-none mt-0.5">🎉</span>
                  <div>
                    <h4 className="font-bold">RSVP Saved Successfully!</h4>
                    <p className="mt-1 leading-relaxed text-emerald-700">
                      Thank you for updating your RSVP response! We are updating the seating charts and floor plans based on your confirmed answers. Feel free to explore the rest of the wedding portal tabs!
                    </p>
                  </div>
                </div>
              )}

              {/* ACTIVE RSVP EDITOR */}
              {isEditing && (
                <div className="space-y-4 max-w-lg mx-auto bg-stone-50/50 border border-stone-200 p-5 rounded-xl">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500">
                      {familyMembers.length > 0 ? 'Group Attendance Responses' : 'Individual Attendance Response'}
                    </h4>
                    <p className="text-[10px] text-stone-400 mt-1 leading-normal">
                      Select Going or Declined for each person in your party. You can leave entries as Pending if undecided.
                    </p>
                  </div>

                  {/* If family, render each member */}
                  {familyMembers.length > 0 ? (
                    <div className="space-y-4 divide-y divide-stone-100">
                      {familyMembers.map((member) => (
                        <div key={member.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-stone-800 block">{member.name}</span>
                            <span className="text-[9px] font-mono text-stone-400 uppercase capitalize">
                              {member.role === 'bridesmaid' ? 'Lady side' : member.role}
                            </span>
                          </div>

                          {/* Options */}
                          <div className="flex gap-1 bg-stone-100 p-1 rounded-lg w-fit">
                            {[
                              { status: 'going' as const, label: 'Going', bg: 'bg-emerald-600 text-white', hover: 'hover:bg-emerald-100 text-emerald-800' },
                              { status: 'declined' as const, label: 'Declined', bg: 'bg-red-600 text-white', hover: 'hover:bg-red-100 text-red-800' },
                              { status: 'pending' as const, label: 'Pending', bg: 'bg-amber-600 text-white', hover: 'hover:bg-amber-100 text-amber-800' }
                            ].map((opt) => {
                              const active = rsvpStatuses[member.id] === opt.status;
                              return (
                                <button
                                  key={opt.status}
                                  type="button"
                                  onClick={() => handleStatusChange(member.id, opt.status)}
                                  className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                                    active ? opt.bg : `text-stone-500 ${opt.hover}`
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Individual Solo Guest Response */
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">{foundGuest.name}</span>
                        <span className="text-[9px] font-mono text-stone-400 uppercase">Solo Attendee</span>
                      </div>

                      <div className="flex gap-1 bg-stone-100 p-1 rounded-lg w-fit">
                        {[
                          { status: 'going' as const, label: 'Going', bg: 'bg-emerald-600 text-white', hover: 'hover:bg-emerald-100 text-emerald-800' },
                          { status: 'declined' as const, label: 'Declined', bg: 'bg-red-600 text-white', hover: 'hover:bg-red-100 text-red-800' },
                          { status: 'pending' as const, label: 'Pending', bg: 'bg-amber-600 text-white', hover: 'hover:bg-amber-100 text-amber-800' }
                        ].map((opt) => {
                          const active = rsvpStatuses[foundGuest.id] === opt.status;
                          return (
                            <button
                              key={opt.status}
                              type="button"
                              onClick={() => handleStatusChange(foundGuest.id, opt.status)}
                              className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                                active ? opt.bg : `text-stone-500 ${opt.hover}`
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {searchError && (
                    <div className="text-red-600 text-[11px] font-medium leading-relaxed">
                      ⚠️ {searchError}
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-200 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmitRsvp}
                      className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isSubmitting ? 'Saving RSVP...' : 'Submit Response'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
