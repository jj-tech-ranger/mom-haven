// src/components/haven/HavenChatView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  HeartHandshake, 
  PhoneCall, 
  Baby, 
  ShieldAlert, 
  RefreshCw,
  Info 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askHavenChat, ChatMessage, MaternalContext } from '../../services/geminiService';
import { InterceptorResult } from '../../services/safetyInterceptor';
import { usePreferences } from '../../context/PreferencesContext';
import { getActivePregnancy } from '../../services/pregnancyService';
import { getChildren, calculateChildAge } from '../../services/childService';

interface HavenChatViewProps {
  userId?: string;
  context?: MaternalContext;
  initialPrompt?: string;
  onOpenEmergencyHub?: () => void;
  onTriggerEmergency?: () => void;
}

function buildWelcomeMessage(ctx: MaternalContext, lang: string): ChatMessage {
  return {
    id: 'welcome-1',
    sender: 'haven',
    text: lang === 'sw'
      ? ctx.mode === 'PREGNANCY'
        ? `Habari Mama! Mimi ni **Haven**, mshauri wako wa afya katika safari yako ya ujauzito na malezi. Kwa sasa uko katika **wiki ya ${ctx.gestationalWeeks || 24}**.\n\nUnajisikiaje leo? Unaweza kuniuliza kuhusu lishe bora, miadi ya kliniki, dalili za kawaida, au maandalizi ya uzazi.`
        : `Habari Mama! Mimi ni **Haven**, niko hapa kukusaidia katika kumtunza **${ctx.childName || 'mwanao'}** (${ctx.childAgeFormatted || 'mwenye miezi 4'}).\n\nNiulize chochote kuhusu ratiba ya chanjo, unyonyeshaji, vyakula vya nyongeza, au ukuaji wa mtoto.`
      : ctx.mode === 'PREGNANCY'
      ? `Hello Mama! I am **Haven**, your companion through pregnancy and early motherhood. You are currently at **${ctx.gestationalWeeks || 24} weeks**.\n\nHow are you feeling today? You can ask me about nutrition, clinic appointments, common symptoms, or labor preparation.`
      : `Hello Mama! I am **Haven**, here to support you in caring for **${ctx.childName || 'your baby'}** (${ctx.childAgeFormatted || '4 months old'}).\n\nAsk me anything about immunization schedules, breastfeeding, complementary feeding, or developmental milestones.`,
    timestamp: new Date().toISOString(),
    provenanceTag: lang === 'sw' ? 'Miongozo ya Kitabu cha Afya ya Mama na Mtoto (MOH Kenya)' : 'Kenya MOH Mother & Child Health Handbook Guidance',
    suggestedFollowups: lang === 'sw'
      ? ctx.mode === 'PREGNANCY'
        ? [
            'Vyakula vipi vya kienyeji vinaongeza damu?',
            'Ratiba ya ziara 8 za kliniki ya ANC Kenya ikoje?',
            'Nipakie nini kwenye begi la kwenda kujifungua hospitali?'
          ]
        : [
            'Chanjo inayofuata ya KEPI ni lini?',
            'Nitaanzaje kumpa mtoto vyakula vya nyongeza akifikisha miezi 6?',
            'Ni hatua gani za kawaida za mtoto wa miezi 4?'
          ]
      : ctx.mode === 'PREGNANCY'
      ? [
          'What traditional foods build strong blood?',
          'What are the 8 ANC visits in Kenya?',
          'How do I pack my hospital birth bag?'
        ]
      : [
          'When is the next KEPI vaccine dose?',
          'How do I start complementary foods at 6 months?',
          'What are normal 4-month milestones?'
        ]
  };
}

export default function HavenChatView({ 
  userId,
  context: propContext, 
  initialPrompt,
  onOpenEmergencyHub,
  onTriggerEmergency 
}: HavenChatViewProps) {
  const { language } = usePreferences();
  const [activeContext, setActiveContext] = useState<MaternalContext>(
    propContext || { mode: 'PREGNANCY', gestationalWeeks: 24 }
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    buildWelcomeMessage(activeContext, language)
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState<InterceptorResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch real maternal context if userId is provided and no explicit propContext was passed
  useEffect(() => {
    if (propContext) {
      setActiveContext(propContext);
      return;
    }
    if (!userId) return;

    let isMounted = true;
    Promise.all([
      getActivePregnancy(userId).catch(() => null),
      getChildren(userId).catch(() => []),
    ]).then(([preg, kids]) => {
      if (!isMounted) return;
      let newCtx: MaternalContext | null = null;
      if (preg && preg.status === 'active') {
        newCtx = {
          mode: 'PREGNANCY',
          gestationalWeeks: preg.gestationalAgeWeeks || 24,
          edd: preg.edd,
          parity: preg.parity,
        };
      } else if (kids && kids.length > 0) {
        const first = kids[0];
        const age = first.dob ? calculateChildAge(first.dob) : null;
        newCtx = {
          mode: 'CHILD',
          childName: first.name,
          childAgeFormatted: age?.ageFormatted || undefined,
          childAgeMonths: age?.months || undefined,
        };
      }
      if (newCtx) {
        setActiveContext(newCtx);
        setMessages((prev) => {
          if (prev.length === 1 && prev[0].id === 'welcome-1') {
            return [buildWelcomeMessage(newCtx!, language)];
          }
          return prev;
        });
      }
    }).catch(console.error);

    return () => { isMounted = false; };
  }, [userId, propContext, language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const havenResponse = await askHavenChat(query, messages, { ...activeContext, language });
      setMessages((prev) => [...prev, havenResponse]);

      if (havenResponse.escalationData?.action === 'PRIVACY_WARNING') {
        setPrivacyWarning(havenResponse.escalationData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill initial prompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt !== input) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMessage = messages[messages.length - 1];
  const hasPriorHistory = messages.some((m) => m.sender === 'user');

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-7.5rem)] bg-[var(--lavender-50)]">
      {/* Active Maternal Context Banner */}
      <div className="bg-white border-b border-[var(--border-hairline)] px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-orchid)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-[var(--ink-900)]">
              Haven Clinical AI Companion
            </span>
            <p className="font-body text-[11px] text-[var(--haven-deep)] font-semibold">
              {activeContext.mode === 'PREGNANCY'
                ? `Pregnancy · Week ${activeContext.gestationalWeeks || 24} (EDD: ${activeContext.edd || 'Upcoming'})`
                : `Child: ${activeContext.childName || 'Baby'} · ${activeContext.childAgeFormatted || '4 months'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>MOH Grounded</span>
        </div>
      </div>

      {/* Persistent Non-Diagnostic Disclaimer */}
      <div className="bg-white border-b border-[var(--border-hairline)] px-4 py-2 text-[11px] text-[var(--ink-600)] flex items-start sm:items-center gap-2 shrink-0 shadow-2xs">
        <Info className="w-3.5 h-3.5 text-[var(--haven-orchid)] shrink-0 mt-0.5 sm:mt-0" />
        <p className="font-body leading-tight">
          <strong className="text-[var(--ink-800)] font-semibold">Educational companion: </strong>
          Haven offers calm, culturally grounded answers guided by Kenya Ministry of Health standards. Haven does not diagnose or prescribe medicine.
        </p>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isEscalation = msg.isEscalation;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-[20px] p-4 text-xs leading-relaxed shadow-card-1 ${
                  isUser
                    ? 'bg-[var(--haven-orchid)] text-white font-body rounded-br-xs'
                    : isEscalation
                    ? 'bg-red-50 border border-red-300 text-red-950 rounded-bl-xs'
                    : 'bg-white border border-[var(--border-hairline)] text-[var(--ink-900)] font-body rounded-bl-xs'
                }`}
              >
                {/* Clinical Escalation Banner */}
                {isEscalation && (
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-red-200 font-display font-bold text-[#C4283C]">
                    <AlertTriangle className="w-4 h-4 text-[#C4283C]" />
                    <span>{msg.escalationData?.emergencyTitle || 'Clinical Escalation Notice'}</span>
                  </div>
                )}

                {/* Message Body */}
                <div className="markdown-content space-y-2">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {/* Emergency Direct Button inside Escalation */}
                {isEscalation && onOpenEmergencyHub && (
                  <button
                    type="button"
                    onClick={onOpenEmergencyHub}
                    className="mt-3 w-full bg-[#E11D3C] hover:bg-[#BE123C] text-white py-2.5 px-3 rounded-full font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Open Emergency Safety Hub & Directory
                  </button>
                )}

                {/* Clinical Provenance Tag */}
                {msg.provenanceTag && !isUser && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                    <Info className="w-3 h-3 text-[var(--haven-orchid)]" />
                    <span>{msg.provenanceTag}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* First open: Sample starter prompts (mirroring AnonymousMotherShell pattern) */}
        {!hasPriorHistory && (
          <div className="bg-white border border-[var(--border-hairline)] rounded-2xl p-4 shadow-2xs space-y-3 max-w-[95%] sm:max-w-[85%] mt-2">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--ink-500)]">
              Sample questions you can ask
            </h3>
            <div className="space-y-2 text-xs">
              {[
                'What are normal symptoms vs warning signs in week 18?',
                'How many ANC visits are recommended in Kenya MOH 216?',
                'What traditional Kenyan foods help boost low hemoglobin?',
                'What should I pack in my hospital maternity bag?',
              ].map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(q)}
                  className="w-full text-left p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hairline)] text-[var(--ink-800)] font-medium hover:border-[var(--haven-orchid)] hover:bg-[var(--lavender-50)] transition-colors cursor-pointer"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white p-3 rounded-[16px] w-fit border border-gray-200">
            <div className="w-4 h-4 border-2 border-[var(--haven-orchid)] border-t-transparent rounded-full animate-spin" />
            <span>Haven is consulting Kenya MOH clinical guidelines...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up Chips */}
      {lastMessage?.sender === 'haven' && lastMessage.suggestedFollowups && lastMessage.suggestedFollowups.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white/70 border-t border-[var(--border-hairline)]">
          <span className="text-[10px] font-display font-bold uppercase text-[var(--ink-400)] shrink-0">
            Suggested:
          </span>
          {lastMessage.suggestedFollowups.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              className="px-3 py-1 rounded-full bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] text-[var(--haven-deep)] font-display text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer border border-[var(--haven-orchid)]/30"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 bg-white border-t border-[var(--border-hairline)]">
        <div className="flex items-center gap-2 bg-[var(--lavender-50)] border border-[var(--border-hairline)] rounded-full px-4 py-1.5 focus-within:border-[var(--haven-orchid)] transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about nutrition, clinic visits, vaccines..."
            className="flex-1 bg-transparent border-none outline-hidden text-xs text-[var(--ink-900)] py-1.5"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              input.trim() && !loading
                ? 'bg-[var(--haven-orchid)] text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sensitive Topic Privacy Warning Modal */}
      {privacyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white max-w-sm rounded-[24px] p-5 shadow-card-2 border border-gray-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-[var(--haven-deep)] flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-[var(--ink-900)]">
              Confidential Support & Privacy
            </h4>
            <p className="font-body text-xs text-gray-700 leading-relaxed">
              You mentioned a sensitive topic. Your privacy is protected with end-to-end security. If you need compassionate confidential counselors right now, free national helplines are available 24/7.
            </p>
            {privacyWarning.privacyHelpline && (
              <div className="bg-purple-50 p-3 rounded-[12px] text-xs font-semibold text-[var(--haven-deep)] flex items-center justify-between">
                <span>Free Helpline: {privacyWarning.privacyHelpline}</span>
                <PhoneCall className="w-4 h-4 text-[var(--haven-orchid)]" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setPrivacyWarning(null)}
              className="w-full bg-[var(--haven-orchid)] text-white py-2.5 rounded-full text-xs font-display font-bold cursor-pointer"
            >
              Continue to Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
