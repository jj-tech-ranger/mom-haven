// src/components/clinician/ClinicianCareTeamMessagesPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Clock, 
  RefreshCw, 
  User, 
  Stethoscope, 
  Sparkles, 
  AlertCircle,
  FileCheck2,
  Calendar,
  Heart
} from 'lucide-react';
import { CareTeamMessage } from '../../types';
import { 
  getMessagesForMother, 
  sendMessageAsClinician, 
  subscribeCareTeamMessages 
} from '../../services/careTeamMessageService';
import { auth } from '../../lib/firebase';
import Button from '../Button';

interface ClinicianCareTeamMessagesPanelProps {
  motherId: string;
  clinicianName: string;
  facilityName?: string;
  childId?: string;
  childName?: string;
}

const CATEGORY_CONFIG: Record<
  CareTeamMessage['category'],
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  general: {
    label: 'General Advice',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: Stethoscope,
  },
  lab_result: {
    label: 'Lab & Diagnostic Result',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    icon: FileCheck2,
  },
  appointment: {
    label: 'Appointment & Follow-up',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: Calendar,
  },
  reassurance: {
    label: 'Reassurance & Wellness',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: Heart,
  },
};

const CLINICAL_PRESETS: { text: string; category: CareTeamMessage['category'] }[] = [
  {
    text: 'Your routine antenatal lab test profiles returned normal and satisfactory. Continue daily IFAS (Iron & Folic Acid) supplements with citrus water.',
    category: 'lab_result',
  },
  {
    text: 'Blood pressure and vitals reviewed today are in optimal normal range. Continue resting on your left side and stay well-hydrated.',
    category: 'reassurance',
  },
  {
    text: 'Kindly attend your scheduled ANC review at the facility next week. Bring your MOH 216 handbook and note any questions for our care team.',
    category: 'appointment',
  },
  {
    text: 'Child growth velocity and immunization schedule are on track. Exclusive breastfeeding continues to provide complete nutritional protection.',
    category: 'general',
  },
];

export default function ClinicianCareTeamMessagesPanel({
  motherId,
  clinicianName,
  facilityName,
  childId,
}: ClinicianCareTeamMessagesPanelProps) {
  const [messages, setMessages] = useState<CareTeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [category, setCategory] = useState<CareTeamMessage['category']>('general');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!motherId) return;
    try {
      setLoading(true);
      const data = await getMessagesForMother(motherId);
      setMessages(data);
    } catch (err) {
      console.warn('Failed to load care team messages:', err);
    } finally {
      setLoading(false);
    }
  }, [motherId]);

  useEffect(() => {
    loadMessages();
    const unsubscribe = subscribeCareTeamMessages(motherId, (updated) => {
      setMessages(updated);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [motherId, loadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !motherId || sending) return;

    try {
      setSending(true);
      const clinicianUid = auth.currentUser?.uid || 'verified-clinician';
      await sendMessageAsClinician({
        motherId,
        clinicianId: clinicianUid,
        text: text.trim(),
        category,
        childId: childId || null,
      });

      setText('');
      setFeedbackNotice('Message dispatched to mother successfully.');
      setTimeout(() => setFeedbackNotice(null), 4000);
      await loadMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch care team message.');
    } finally {
      setSending(false);
    }
  };

  const handleApplyPreset = (preset: { text: string; category: CareTeamMessage['category'] }) => {
    setText(preset.text);
    setCategory(preset.category);
  };

  const filteredMessages = messages.filter((m) => {
    if (filterCategory === 'all') return true;
    return m.category === filterCategory;
  });

  const unreadCount = messages.filter((m) => m.sentByRole === 'CLINICIAN' && !m.readByMother).length;
  const readCount = messages.filter((m) => m.sentByRole === 'CLINICIAN' && m.readByMother).length;

  return (
    <div className="space-y-5">
      {/* Informational Guidance Header */}
      <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                  Care Team Messages (Patient-Facing)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Visible to Mother
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official clinical feedback and reassurance sent here is delivered directly to the mother’s MomHaven app.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-mono text-slate-500">
                Read: <strong className="text-emerald-700">{readCount}</strong> | Unread: <strong className="text-amber-700">{unreadCount}</strong>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadMessages}
              disabled={loading}
              className="py-1.5 px-2.5 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-[14px] flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Clinical Boundary Notice:</strong> This collection is for constructive feedback, lab result interpretations, and appointment notices that the mother <em>can see</em>. If you require private notes strictly hidden from the patient, use the <strong>Private Provider Notes</strong> tab instead.
          </div>
        </div>
      </div>

      {/* Message Composer */}
      <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-display font-bold text-sm text-[var(--ink-900)] flex items-center gap-2">
            <Send className="w-4 h-4 text-[var(--haven-deep)]" />
            Compose Clinical Message to Patient
          </h4>
          <span className="text-[11px] text-slate-500">
            Posting as: <strong className="text-[var(--haven-deep)]">{clinicianName}</strong> {facilityName ? `(${facilityName})` : ''}
          </span>
        </div>

        {/* Quick Presets */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
            Quick Clinical Guidance Presets:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CLINICAL_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-left p-2.5 rounded-[12px] bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] border border-[var(--border-hairline)] text-xs text-slate-700 transition-colors cursor-pointer"
              >
                <span className="font-bold text-[10px] uppercase tracking-wider block text-[var(--haven-deep)] mb-0.5">
                  {CATEGORY_CONFIG[preset.category].label}
                </span>
                <p className="line-clamp-2">{preset.text}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Message Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['general', 'lab_result', 'appointment', 'reassurance'] as CareTeamMessage['category'][]).map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const Icon = conf.icon;
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-[12px] text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? `${conf.bg} ${conf.text} border-current shadow-xs`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{conf.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="clinician-message-text" className="block text-xs font-bold text-slate-700 mb-1">
              Message Content (Visible to Mother)
            </label>
            <textarea
              id="clinician-message-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Lab results look reassuring. Please continue taking your iron and folic acid daily..."
              className="w-full p-3 rounded-[14px] border border-slate-200 text-sm focus:border-[var(--haven-deep)] focus:ring-1 focus:ring-[var(--haven-deep)] outline-hidden transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-500">
              Mother will receive a badge notification under "Messages from your care team".
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={sending || !text.trim()}
              className="py-2.5 px-4 text-xs bg-[var(--haven-deep)] flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending to Mother...' : 'Send Message to Mother'}
            </Button>
          </div>

          {feedbackNotice && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[12px] text-xs font-medium">
              ✓ {feedbackNotice}
            </div>
          )}
        </form>
      </div>

      {/* Message History */}
      <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-sm text-[var(--ink-900)]">
              Communication Thread
            </h4>
            <span className="text-xs text-slate-500">
              ({filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'})
            </span>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-[var(--haven-deep)] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {(['general', 'lab_result', 'appointment', 'reassurance'] as CareTeamMessage['category'][]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-[var(--haven-deep)] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {CATEGORY_CONFIG[cat].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {loading && messages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center rounded-[16px] bg-slate-50 border border-slate-100 text-slate-500 space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-700">No care team messages yet</p>
            <p className="text-[11px] text-slate-500">
              Use the composer above to send initial reassuring feedback or lab guidance to the patient.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const conf = CATEGORY_CONFIG[msg.category] || CATEGORY_CONFIG.general;
              const Icon = conf.icon;
              const isClinician = msg.sentByRole === 'CLINICIAN';

              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-[16px] border transition-all ${
                    isClinician
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-purple-50/50 border-purple-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isClinician
                            ? 'bg-[var(--lavender-100)] text-[var(--haven-deep)]'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {isClinician ? <Stethoscope className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {isClinician ? 'You (Care Team Clinician)' : 'Mother (Patient)'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.text}`}
                          >
                            <Icon className="w-2.5 h-2.5" />
                            {conf.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Read Status (for messages sent by clinician) */}
                    {isClinician && (
                      <div className="shrink-0 text-right">
                        {msg.readByMother ? (
                          <span
                            title={msg.readAt ? `Read on ${new Date(msg.readAt).toLocaleString()}` : 'Read by mother'}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                          >
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            Read by Mother
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Unread by Mother
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed pl-9 whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
