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

interface HavenChatViewProps {
  context?: MaternalContext;
  initialPrompt?: string;
  onOpenEmergencyHub?: () => void;
  onTriggerEmergency?: () => void;
}

export default function HavenChatView({ 
  context = { mode: 'PREGNANCY', gestationalWeeks: 24 }, 
  initialPrompt,
  onOpenEmergencyHub,
  onTriggerEmergency 
}: HavenChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'haven',
      text: context.mode === 'PREGNANCY'
        ? `Hello Mama! I am **Haven**, your companion through pregnancy and early motherhood. You are currently at **${context.gestationalWeeks || 24} weeks**.\n\nHow are you feeling today? You can ask me about nutrition, clinic appointments, common symptoms, or labor preparation.`
        : `Hello Mama! I am **Haven**, here to support you in caring for **${context.childName || 'your baby'}** (${context.childAgeFormatted || '4 months old'}).\n\nAsk me anything about immunization schedules, breastfeeding, complementary feeding, or developmental milestones.`,
      timestamp: new Date().toISOString(),
      provenanceTag: 'Kenya MOH Mother & Child Health Handbook Guidance',
      suggestedFollowups: context.mode === 'PREGNANCY'
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
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState<InterceptorResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const havenResponse = await askHavenChat(query, messages, context);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-[var(--lavender-50)]">
      {/* Active Maternal Context Banner */}
      <div className="bg-white border-b border-[var(--border-hairline)] px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-orchid)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-[var(--ink-900)]">
              Haven Clinical AI Companion
            </span>
            <p className="font-body text-[11px] text-[var(--haven-deep)] font-semibold">
              {context.mode === 'PREGNANCY'
                ? `Pregnancy · Week ${context.gestationalWeeks || 24} (EDD: ${context.edd || 'Upcoming'})`
                : `Child: ${context.childName || 'Baby'} · ${context.childAgeFormatted || '4 months'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>MOH Grounded</span>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
