// src/components/records/CareTeamMessagesMotherCard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Stethoscope, 
  FileCheck2, 
  Calendar, 
  Heart, 
  Sparkles,
  User
} from 'lucide-react';
import { CareTeamMessage } from '../../types';
import { 
  getMessagesForMother, 
  markRead, 
  sendMessageAsMother, 
  subscribeCareTeamMessages 
} from '../../services/careTeamMessageService';
import { usePreferences } from '../../context/PreferencesContext';
import Button from '../Button';

interface CareTeamMessagesMotherCardProps {
  motherId: string;
  className?: string;
  defaultExpanded?: boolean;
}

const CATEGORY_STYLE: Record<
  CareTeamMessage['category'],
  { labelEn: string; labelSw: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  general: {
    labelEn: 'General Advice',
    labelSw: 'Ushauri wa Jumla',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: Stethoscope,
  },
  lab_result: {
    labelEn: 'Lab Results',
    labelSw: 'Matokeo ya Vipimo',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    icon: FileCheck2,
  },
  appointment: {
    labelEn: 'Appointment Notice',
    labelSw: 'Taarifa ya Kliniki',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: Calendar,
  },
  reassurance: {
    labelEn: 'Reassurance',
    labelSw: 'Kutia Moyo & Afya',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: Heart,
  },
};

export default function CareTeamMessagesMotherCard({
  motherId,
  className = '',
  defaultExpanded = true,
}: CareTeamMessagesMotherCardProps) {
  const { language } = usePreferences();
  const [messages, setMessages] = useState<CareTeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);

  const loadData = useCallback(async () => {
    if (!motherId) return;
    try {
      setLoading(true);
      const data = await getMessagesForMother(motherId);
      setMessages(data);
    } catch (err) {
      console.warn('Failed to load care team messages for mother:', err);
    } finally {
      setLoading(false);
    }
  }, [motherId]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeCareTeamMessages(motherId, (updated) => {
      setMessages(updated);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [motherId, loadData]);

  const handleMarkRead = async (messageId: string) => {
    try {
      await markRead(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, readByMother: true, readAt: new Date().toISOString() } : m))
      );
    } catch (err) {
      console.warn('Failed to mark message as read:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !motherId || sendingReply) return;

    try {
      setSendingReply(true);
      await sendMessageAsMother({
        motherId,
        text: replyText.trim(),
        category: 'general',
      });
      setReplyText('');
      setShowReplyBox(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to send message to care team.');
    } finally {
      setSendingReply(false);
    }
  };

  const unreadMessages = messages.filter((m) => m.sentByRole === 'CLINICIAN' && !m.readByMother);
  const unreadCount = unreadMessages.length;

  return (
    <div
      className={`bg-white border border-[var(--border-hairline)] rounded-[22px] p-5 shadow-card-1 transition-all ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-[var(--ink-900)]">
                {language === 'sw' ? 'Ujumbe kutoka kwa Wataalamu wa Afya' : 'Messages from your care team'}
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  {unreadCount} {language === 'sw' ? 'mpya' : 'new'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {language === 'sw'
                ? 'Mwongozo na ushauri kutoka kwa mkunga au daktari wako wa kliniki.'
                : 'Direct clinical feedback and reassurance from your hospital care team.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-full hover:bg-[var(--lavender-50)] text-slate-500 hover:text-[var(--haven-deep)] transition-colors cursor-pointer"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {loading && messages.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              {language === 'sw' ? 'Inapakia ujumbe...' : 'Loading care team feedback...'}
            </div>
          ) : messages.length === 0 ? (
            <div className="p-4 rounded-[16px] bg-[var(--lavender-50)] text-center text-xs text-slate-600 space-y-1">
              <Sparkles className="w-5 h-5 text-[var(--haven-orchid)] mx-auto mb-1" />
              <p className="font-bold text-[var(--ink-900)]">
                {language === 'sw' ? 'Bado hakuna ujumbe mpya' : 'No care team messages yet'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'sw'
                  ? 'Daktari au mkunga wako atakapokagua vipimo au maendeleo yako, maoni yao yataonekana hapa.'
                  : 'When your clinician reviews your ANC visits, lab results, or child growth, their feedback will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const conf = CATEGORY_STYLE[msg.category] || CATEGORY_STYLE.general;
                const Icon = conf.icon;
                const isFromClinician = msg.sentByRole === 'CLINICIAN';
                const isUnread = isFromClinician && !msg.readByMother;

                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-[16px] border transition-all ${
                      isUnread
                        ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-200'
                        : isFromClinician
                        ? 'bg-white border-slate-200'
                        : 'bg-purple-50/40 border-purple-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isFromClinician
                              ? 'bg-[var(--lavender-100)] text-[var(--haven-deep)]'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {isFromClinician ? (
                            <Stethoscope className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {isFromClinician
                                ? language === 'sw'
                                  ? 'Daktari / Mkunga wako'
                                  : 'Your Clinician'
                                : language === 'sw'
                                ? 'Wewe (Mama)'
                                : 'You (Mother)'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.text}`}
                            >
                              <Icon className="w-2.5 h-2.5" />
                              {language === 'sw' ? conf.labelSw : conf.labelEn}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(msg.createdAt).toLocaleDateString()} at {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mark Read Action */}
                      {isUnread ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleMarkRead(msg.id)}
                          className="py-1 px-2.5 text-[11px] font-bold text-amber-800 border-amber-300 bg-white hover:bg-amber-100 shrink-0"
                        >
                          <CheckCheck className="w-3 h-3 text-amber-700" />
                          {language === 'sw' ? 'Nimeliona' : 'Mark as read'}
                        </Button>
                      ) : isFromClinician ? (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          {language === 'sw' ? 'Limesomwa' : 'Read'}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed pl-8 whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Reply / Message to Care Team */}
          <div className="pt-2 border-t border-slate-100">
            {!showReplyBox ? (
              <button
                type="button"
                onClick={() => setShowReplyBox(true)}
                className="w-full py-2 px-3 rounded-[12px] bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--haven-deep)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {language === 'sw' ? 'Tuma ujumbe kwa daktari wako' : 'Send a note or question to your care team'}
              </button>
            ) : (
              <form onSubmit={handleSendReply} className="space-y-2 bg-[var(--lavender-50)]/50 p-3 rounded-[16px] border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink-900)]">
                    {language === 'sw' ? 'Ujumbe kwa Daktari' : 'Message to Care Team'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReplyBox(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {language === 'sw' ? 'Ghairi' : 'Cancel'}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    language === 'sw'
                      ? 'Andika swali au taarifa kuhusu maendeleo yako hapa...'
                      : 'Type a question or update about how you are feeling...'
                  }
                  className="w-full p-2.5 rounded-[12px] bg-white border border-slate-200 text-xs focus:border-[var(--haven-deep)] focus:ring-1 focus:ring-[var(--haven-deep)] outline-hidden transition-all placeholder:text-slate-400"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReplyBox(false)}
                    className="py-1.5 px-3 text-xs"
                  >
                    {language === 'sw' ? 'Ghairi' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={sendingReply || !replyText.trim()}
                    className="py-1.5 px-3 text-xs bg-[var(--haven-deep)] flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    {sendingReply
                      ? language === 'sw'
                        ? 'Inatuma...'
                        : 'Sending...'
                      : language === 'sw'
                      ? 'Tuma'
                      : 'Send'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
