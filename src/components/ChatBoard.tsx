import React, { useState, useRef, useEffect } from 'react';
import { Message, UserRole } from '../types';
import { Send, Image, MessageSquare, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface ChatBoardProps {
  messages: Message[];
  userName: string;
  userRole: UserRole;
  onSendMessage: (content: string, imageUrl?: string) => void;
}

export default function ChatBoard({
  messages,
  userName,
  userRole,
  onSendMessage
}: ChatBoardProps) {
  const [typedMessage, setTypedMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [statusTag, setStatusTag] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() && !photoUrl.trim()) return;

    let finalContent = typedMessage.trim();
    if (statusTag) {
      finalContent = `[${statusTag}] ${finalContent}`;
    }

    onSendMessage(finalContent, photoUrl.trim() || undefined);
    setTypedMessage('');
    setPhotoUrl('');
    setShowPhotoInput(false);
    setStatusTag('');
  };

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'groomsman':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'bridesmaid':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-500" />
          Real-Time Coordination Board
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Instant updates and progress logs for the bridesmaids, groomsmen, and planning admins.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col h-[520px]">
        {/* Messages view wrapper */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
              <MessageSquare className="w-10 h-10 opacity-30 text-slate-400" />
              <p className="text-xs font-semibold">Start the wedding coordination timeline</p>
              <p className="text-[11px] text-slate-400 max-w-xs">Post prep checklists, logistics reminders, or memento photos.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderName.toLowerCase().trim() === userName.toLowerCase().trim();
              const dateObj = new Date(msg.timestamp);
              const formattedTime = isNaN(dateObj.getTime()) 
                ? "Just now" 
                : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              // Extract tag if present [Tag]
              const tagMatch = msg.content.match(/^\[(.*?)\]\s*(.*)$/);
              const tag = tagMatch ? tagMatch[1] : null;
              const cleanContent = tagMatch ? tagMatch[2] : msg.content;

              return (
                <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}>
                  {/* Sender Name & Role info */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-slate-800">{msg.senderName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${getRoleStyle(msg.role)}`}>
                      {msg.role === 'bridesmaid' ? 'lady side' : msg.role}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{formattedTime}</span>
                  </div>

                  {/* Message Bubble box */}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 border text-xs shadow-sm ${
                    isSelf 
                      ? 'bg-slate-900 border-slate-950 text-white rounded-tr-none' 
                      : 'bg-slate-50 border-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    {tag && (
                      <span className={`inline-block mb-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                        isSelf ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tag}
                      </span>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed break-words font-medium">{cleanContent}</p>

                    {/* Render embedded picture if attached */}
                    {msg.imageUrl && (
                      <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-250 max-w-xs">
                        <img 
                          src={msg.imageUrl} 
                          alt="Coordination reference" 
                          referrerPolicy="no-referrer"
                          className="w-full max-h-56 object-cover"
                          onError={(e) => {
                            // If load fails, hide or replace
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer area */}
        <form onSubmit={handleSend} className="space-y-3 pt-3 border-t border-slate-100">
          {/* Preset coordination status badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-slate-400 font-mono uppercase tracking-wider mr-1">Activity Tag:</span>
            {[
              { label: 'Prep RSVP', value: 'Prep RSVP' },
              { label: 'Photo Prep', value: 'Photo Prep' },
              { label: 'Tux/Dress Check', value: 'Fitting OK' },
              { label: 'On My Way', value: 'On My Way' },
              { label: 'Urgent Alert', value: 'Urgent' }
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setStatusTag(statusTag === preset.value ? '' : preset.value)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  statusTag === preset.value
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {showPhotoInput && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2">
              <Image className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Paste reference picture or unDraw/Pexels image URL here..."
                className="flex-1 bg-transparent border-0 focus:outline-none text-xs text-slate-800"
              />
            </div>
          )}

          <div className="flex gap-2">
            {/* Toggle Photo input button */}
            <button
              type="button"
              onClick={() => setShowPhotoInput(!showPhotoInput)}
              className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                showPhotoInput ? 'bg-slate-800 text-amber-400 border-slate-850' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'
              }`}
              title="Attach image url"
            >
              <Image className="w-4 h-4" />
            </button>

            {/* Main message text input */}
            <input
              type="text"
              required={!photoUrl}
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder={`Post as ${userName} (${userRole === 'bridesmaid' ? 'lady side' : userRole})...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800"
            />

            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1 text-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden md:inline font-medium">Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
