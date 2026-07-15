import React, { useState } from 'react';
import { WeddingSettings, GalleryItem, UserRole } from '../types';
import { 
  Image as ImageIcon, Video, Play, X, ChevronLeft, ChevronRight, 
  Plus, Trash2, Check, Sparkles, Film, HelpCircle 
} from 'lucide-react';

interface GalleryViewProps {
  settings?: WeddingSettings;
  userRole?: UserRole;
  onUpdateSettings?: (settings: Partial<WeddingSettings>) => void;
}

export default function GalleryView({ settings, userRole, onUpdateSettings }: GalleryViewProps) {
  const items = settings?.galleryItems || [];
  const isAdmin = userRole === 'admin';
  
  // Media filters
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  
  // Lightbox State
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Form states for adding single Gallery Item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'photo' | 'video'>('photo');
  const [newCaption, setNewCaption] = useState('');

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  // Only photos can be zoomed in lightbox
  const photoItems = filteredItems.filter(item => item.type === 'photo');

  const openLightbox = (item: GalleryItem) => {
    const photoIdx = photoItems.findIndex(p => p.id === item.id);
    if (photoIdx !== -1) {
      setActivePhotoIndex(photoIdx);
    }
  };

  const closeLightbox = () => {
    setActivePhotoIndex(null);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null && photoItems.length > 0) {
      setActivePhotoIndex((activePhotoIndex + 1) % photoItems.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null && photoItems.length > 0) {
      setActivePhotoIndex((activePhotoIndex - 1 + photoItems.length) % photoItems.length);
    }
  };

  // Admin: Add a gallery item directly on this page
  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const newItem: GalleryItem = {
      id: `gal_${Date.now()}`,
      url: newUrl.trim(),
      type: newType,
      caption: newCaption.trim() || undefined
    };

    const updatedItems = [...items, newItem];

    if (onUpdateSettings) {
      onUpdateSettings({
        galleryItems: updatedItems
      });
      setNewUrl('');
      setNewCaption('');
      setShowAddForm(false);
      alert("New media item added to your gallery!");
    }
  };

  // Admin: Delete a gallery item directly on this page
  const handleDeleteMedia = (itemId: string) => {
    if (confirm("Are you sure you want to remove this media item from your wedding gallery?")) {
      const updatedItems = items.filter(item => item.id !== itemId);
      if (onUpdateSettings) {
        onUpdateSettings({
          galleryItems: updatedItems
        });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fade-in">
      
      {/* Upper Title Description */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-1">Our Media Vault</span>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Capturing Every Moment</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse photographs and celebration highlight videos shared by the couple and coordination crew.
          </p>
        </div>

        {/* Action Controls & Dynamic Category Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Close Editor' : 'Add Photo / Video'}
            </button>
          )}

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {[
              { id: 'all', label: 'All Media', icon: null },
              { id: 'photo', label: 'Photos', icon: ImageIcon },
              { id: 'video', label: 'Videos', icon: Video }
            ].map(btn => {
              const Icon = btn.icon;
              const isSelected = filter === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin: Add Media Inline Box */}
      {isAdmin && showAddForm && (
        <form 
          onSubmit={handleAddMedia}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-fade-in"
        >
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              Add Media Asset to Gallery
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Provide an image URL or video embed URL to extend your story catalog.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Media Type</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewType('photo')}
                  className={`py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    newType === 'photo' ? 'bg-white text-slate-900 shadow-3xs border border-slate-150' : 'text-slate-500'
                  }`}
                >
                  📷 Photo
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('video')}
                  className={`py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    newType === 'video' ? 'bg-white text-slate-900 shadow-3xs border border-slate-150' : 'text-slate-500'
                  }`}
                >
                  🎥 Video
                </button>
              </div>
            </div>

            <div className="md:col-span-5 space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {newType === 'photo' ? 'Direct Image URL' : 'Video Embed URL'}
              </label>
              <input
                type="text"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={newType === 'photo' ? "https://images.unsplash.com/photo-..." : "https://www.youtube.com/embed/..."}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Caption / Description</label>
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="e.g. Walking down the aisle together..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-slate-400 font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-850 rounded-lg text-white cursor-pointer"
            >
              Publish Media
            </button>
          </div>
        </form>
      )}

      {/* Main Responsive Grid Layout */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-500">No media uploaded in this category.</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {isAdmin ? "Use the 'Add Photo / Video' button above to upload celebration snapshots!" : "Celebration snaps will appear here once uploaded by wedding administrators."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isPhoto = item.type === 'photo';

            return (
              <div 
                key={item.id}
                className="group bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col relative"
              >
                {/* Admin: delete trigger float button */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteMedia(item.id)}
                    className="absolute top-2.5 left-2.5 z-20 p-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white shadow-md cursor-pointer transition-colors"
                    title="Delete Media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Media Body */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex-1 flex items-center justify-center">
                  {isPhoto ? (
                    <>
                      <img 
                        src={item.url} 
                        alt={item.caption || "Wedding snapshot"} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                        onClick={() => openLightbox(item)}
                        referrerPolicy="no-referrer"
                      />
                      {/* Zoom Overlay Button */}
                      <button 
                        onClick={() => openLightbox(item)}
                        className="absolute bottom-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs flex items-center gap-1 font-mono text-[9px]"
                      >
                        🔍 Expand View
                      </button>
                    </>
                  ) : (
                    /* Interactive Video Embed Player */
                    <iframe
                      src={item.url}
                      title={item.caption || "Wedding Video Player"}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>

                {/* Media Footer with Caption */}
                <div className="p-4 bg-white border-t border-slate-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-md text-[9px] font-bold font-mono tracking-wide uppercase ${
                      isPhoto ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isPhoto ? '📷 Photo' : '🎥 Video'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Uploaded</span>
                  </div>
                  <h4 className="font-sans font-medium text-xs text-slate-800 leading-snug line-clamp-2" title={item.caption}>
                    {item.caption || "Untitled celebration snapshot"}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal Overlay for Zooming Photos */}
      {activePhotoIndex !== null && photoItems.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4"
          onClick={closeLightbox}
        >
          {/* Lightbox Header Controls */}
          <div className="flex justify-between items-center text-white py-2">
            <span className="text-xs font-mono text-slate-400">
              Photo {activePhotoIndex + 1} of {photoItems.length}
            </span>
            <button 
              onClick={closeLightbox}
              className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer transition-colors"
              title="Close View"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Main Stage Image */}
          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full">
            
            {/* Left Nav Button */}
            <button
              onClick={prevPhoto}
              className="absolute left-0 p-3 bg-black/40 hover:bg-black/70 rounded-full text-white transition-colors cursor-pointer"
              title="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img 
              src={photoItems[activePhotoIndex].url} 
              alt={photoItems[activePhotoIndex].caption} 
              className="max-w-full max-h-[75vh] object-contain rounded-xl select-none"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />

            {/* Right Nav Button */}
            <button
              onClick={nextPhoto}
              className="absolute right-0 p-3 bg-black/40 hover:bg-black/70 rounded-full text-white transition-colors cursor-pointer"
              title="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Footer Caption */}
          <div className="text-center py-4 text-white max-w-xl mx-auto space-y-1 bg-black/20 p-4 rounded-xl">
            <p className="text-sm font-semibold tracking-tight">{photoItems[activePhotoIndex].caption || "Wedding snapshot"}</p>
            <p className="text-[10px] text-slate-400 font-mono">Alex & Morgan 2026 Celebration Moments</p>
          </div>
        </div>
      )}

    </div>
  );
}
