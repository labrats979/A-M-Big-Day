import React, { useState } from 'react';
import { Vendor } from '../types';
import { ShieldAlert, Plus, Trash2, Phone, Mail, DollarSign, StickyNote, Briefcase } from 'lucide-react';

interface VendorManagerProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onDeleteVendor: (vendorId: string) => void;
}

export default function VendorManager({
  vendors,
  onAddVendor,
  onDeleteVendor
}: VendorManagerProps) {
  const [name, setName] = useState('');
  const [service, setService] = useState('Catering');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !service.trim() || !cost) return;

    onAddVendor({
      name: name.trim(),
      service: service.trim(),
      contact: contact.trim(),
      email: email.trim(),
      cost: parseFloat(cost),
      notes: notes.trim() || undefined
    });

    setName('');
    setContact('');
    setEmail('');
    setCost('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-slate-500" />
          Wedding Vendor Contacts
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Store contact listings, phone numbers, and contractual costs for external services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vendors Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.length === 0 ? (
            <div className="col-span-2 bg-white border border-slate-150 rounded-2xl p-8 text-center text-slate-400">
              <ShieldAlert className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-medium">No vendors registered yet.</p>
            </div>
          ) : (
            vendors.map(vendor => (
              <div
                key={vendor.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Service badge & delete button */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-slate-100 border border-slate-200/50 text-slate-700 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {vendor.service}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${vendor.name} from vendors?`)) {
                          onDeleteVendor(vendor.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Vendor Details */}
                  <div>
                    <h4 className="font-display font-bold text-slate-950 text-sm leading-tight">
                      {vendor.name}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono block mt-0.5">Contract Cost: ${vendor.cost.toLocaleString()}</span>
                  </div>

                  {/* Contacts details */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100/70 pt-2.5">
                    {vendor.contact && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{vendor.contact}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 truncate" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Notes */}
                {vendor.notes && (
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500 leading-normal mt-2">
                    <StickyNote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="line-clamp-3">{vendor.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Vendor Form Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-display font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-500" />
            Add Vendor Contact
          </h3>

          <form onSubmit={handleAddVendor} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Company / Vendor Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classic Bridal Florals"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Service Type</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                >
                  <option value="Venue & Catering">Venue & Catering</option>
                  <option value="Photography">Photography</option>
                  <option value="Floral & Decor">Floral & Decor</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Makeup & Styling">Makeup & Styling</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Other">Other Services</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Cost / Price ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Phone Contact</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. +1 (555) 123-4567"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. vendor@mail.com"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Notes / Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Details on payment milestones, scheduled arrival times, or delivery parameters."
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg transition-colors"
            >
              Add Vendor Contract
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
