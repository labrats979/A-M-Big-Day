import React, { useState } from 'react';
import { WeddingSettings, GalleryItem } from '../types';
import { Image as ImageIcon, Video, Play, X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface GalleryViewProps {
  settings?: WeddingSettings;
}

export default function GalleryView({ settings }: GalleryViewProps) {
  const items = settings?.galleryItems || [];
  
  // Media filters
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  
  // Lightbox State
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

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

        {/* Dynamic Category Filters */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200/50">
          {[
            { id: 'all', label: 'All Media', icon: null },
            { id: 'photo', label: 'Photos Only', icon: ImageIcon },
            { id: 'video', label: 'Videos Only', icon: Video }
          ].map(btn => {
            const Icon = btn.icon;
            const isSelected = filter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-xs' 
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

      {/* Main Responsive Grid Layout */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-500">No media uploaded in this category.</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Administrators can upload directly from the Export & Settings customizer dashboard in the admin portal!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isPhoto = item.type === 'photo';

            return (
              <div 
                key={item.id}
                className="group bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
              >
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
            <p className="text-[10px] text-slate-400 font-mono"> Alex & Morgan 2026 Celebration Moments</p>
          </div>
        </div>
      )}

    </div>
  );
}
