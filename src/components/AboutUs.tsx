import React from 'react';
import { WeddingSettings } from '../types';
import { Heart } from 'lucide-react';

interface AboutUsProps {
  settings?: WeddingSettings;
}

export default function AboutUs({ settings }: AboutUsProps) {
  const coupleNames = settings?.aboutCoupleNames || "Alex & Morgan";
  const storyText = settings?.aboutStory || "Welcome to our wedding coordination hub! We first met on a breezy autumn afternoon in the local botanical gardens, and since that day, we have shared countless adventures, laughters, and dreams. Now, we are embarking on our greatest adventure yet, and we can't wait to celebrate our love with our dearest friends and family on our big day!";
  
  const img1 = settings?.aboutImage1Url || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600";
  const img2 = settings?.aboutImage2Url || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600";

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6 animate-fade-in">
      
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

    </div>
  );
}
