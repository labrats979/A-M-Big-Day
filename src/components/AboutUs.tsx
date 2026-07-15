import React, { useState, useEffect } from 'react';
import { WeddingSettings, UserRole } from '../types';
import { Heart, Pencil, Check, X, Image as ImageIcon } from 'lucide-react';

interface AboutUsProps {
  settings?: WeddingSettings;
  userRole?: UserRole;
  onUpdateSettings?: (settings: Partial<WeddingSettings>) => void;
}

export default function AboutUs({ settings, userRole, onUpdateSettings }: AboutUsProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Local form states
  const [coupleNames, setCoupleNames] = useState(settings?.aboutCoupleNames || "Alex & Morgan");
  const [storyText, setStoryText] = useState(
    settings?.aboutStory || 
    "Welcome to our wedding coordination hub! We first met on a breezy autumn afternoon in the local botanical gardens, and since that day, we have shared countless adventures, laughters, and dreams. Now, we are embarking on our greatest adventure yet, and we can't wait to celebrate our love with our dearest friends and family on our big day!"
  );
  const [img1, setImg1] = useState(settings?.aboutImage1Url || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600");
  const [img2, setImg2] = useState(settings?.aboutImage2Url || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600");

  // Keep local state in sync when settings prop updates
  useEffect(() => {
    if (settings) {
      setCoupleNames(settings.aboutCoupleNames || "Alex & Morgan");
      setStoryText(settings.aboutStory || "");
      setImg1(settings.aboutImage1Url || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600");
      setImg2(settings.aboutImage2Url || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600");
    }
  }, [settings]);

  const handleSave = () => {
    if (onUpdateSettings) {
      onUpdateSettings({
        aboutCoupleNames: coupleNames.trim(),
        aboutStory: storyText.trim(),
        aboutImage1Url: img1.trim(),
        aboutImage2Url: img2.trim()
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    // Reset local state to match settings
    setCoupleNames(settings?.aboutCoupleNames || "Alex & Morgan");
    setStoryText(settings?.aboutStory || "");
    setImg1(settings?.aboutImage1Url || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600");
    setImg2(settings?.aboutImage2Url || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600");
    setIsEditing(false);
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6 animate-fade-in relative">
      
      {/* Admin Quick Edit Button Floating Indicator */}
      {isAdmin && (
        <div className="flex justify-end pr-4 -mb-8">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Our Story Page
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-slate-500 hover:bg-slate-600 text-white rounded-full shadow-md transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {isEditing ? (
        /* EDITING MODE FORM */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-display font-bold text-slate-950 text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              Customizing Your Story & Profile Details
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Changes saved here will immediately update the public facing homepage and story page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Couple Names</label>
                <input
                  type="text"
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  placeholder="e.g. Alex & Morgan"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Our Story / Description Narrative</label>
                <textarea
                  rows={8}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Tell your beautiful story here..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-sans leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Primary Portrait Image URL
                </label>
                <input
                  type="text"
                  value={img1}
                  onChange={(e) => setImg1(e.target.value)}
                  placeholder="https://images.unsplash.com..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-mono"
                />
                <div className="mt-2 h-24 overflow-hidden rounded-xl bg-slate-100 border border-slate-150 flex items-center justify-center">
                  {img1 ? (
                    <img src={img1} alt="Preview 1" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">No Image Loaded</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Accent Candid Image URL
                </label>
                <input
                  type="text"
                  value={img2}
                  onChange={(e) => setImg2(e.target.value)}
                  placeholder="https://images.unsplash..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-mono"
                />
                <div className="mt-2 h-24 overflow-hidden rounded-xl bg-slate-100 border border-slate-150 flex items-center justify-center">
                  {img2 ? (
                    <img src={img2} alt="Preview 2" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">No Image Loaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Check className="w-4.5 h-4.5" />
              Save Settings
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD VIEWING MODE */
        <>
          {/* Editorial Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1 bg-rose-50 border border-rose-100/50 rounded-full text-[10px] font-mono font-bold tracking-widest text-rose-700 uppercase">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              Our Journey Together
            </div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 tracking-tight">
              {coupleNames}
            </h2>
            <div className="w-24 h-0.5 bg-slate-200 mx-auto" />
          </div>

          {/* Main Staggered Two-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center pt-4">
            
            {/* Story Text Column */}
            <div className="md:col-span-6 space-y-6">
              <p className="font-serif text-lg sm:text-xl text-slate-700 italic leading-relaxed">
                "Once in a while, right in the middle of an ordinary life, love gives us a fairytale."
              </p>
              <div className="h-px bg-slate-100" />
              <div className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line space-y-4">
                {storyText}
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                <span className="text-2xl">💍</span>
                <div className="text-xs text-slate-500 font-medium">
                  We appreciate all your love, support, and help in organizing our coordinate details. We can't wait to share this unforgettable moment with you.
                </div>
              </div>
            </div>

            {/* Visual Staggered Couple Photos Column */}
            <div className="md:col-span-6">
              <div className="relative grid grid-cols-12 gap-4">
                {/* Main Picture */}
                <div className="col-span-8 relative z-10">
                  <div className="overflow-hidden rounded-3xl border-4 border-white shadow-xl hover:scale-[1.02] transition-transform duration-500 bg-slate-100">
                    <img 
                      src={img1} 
                      alt={`${coupleNames} Wedding Moments`} 
                      className="w-full h-80 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Inset Offset Picture */}
                <div className="col-span-6 col-start-7 -mt-24 relative z-20">
                  <div className="overflow-hidden rounded-2xl border-4 border-white shadow-2xl hover:scale-[1.03] transition-transform duration-500 bg-slate-100">
                    <img 
                      src={img2} 
                      alt={`${coupleNames} Venue Story`} 
                      className="w-full h-56 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Design Motif Backdrop Circles */}
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-rose-50/70 -z-10 blur-xs" />
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-slate-100/70 -z-10 blur-xs" />
              </div>
            </div>

          </div>

          {/* Decorative Quote Block */}
          <div className="text-center py-8 border-t border-b border-slate-100 font-serif text-slate-400 text-sm max-w-xl mx-auto italic">
            "Love doesn't make the world go 'round. Love is what makes the ride worthwhile." — Franklin P. Jones
          </div>
        </>
      )}

    </div>
  );
}
