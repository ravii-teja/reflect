import React, { useState, useEffect } from 'react';
import { ArrowRight, Mic, MicOff, AlertCircle, Check } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ThinkingInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const DRAFT_STORAGE_KEY = 'reflect_journal_draft';

export const ThinkingInput: React.FC<ThinkingInputProps> = ({ onSubmit, isLoading }) => {
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Auto-save content changes to localStorage
  useEffect(() => {
    try {
      if (content.trim()) {
        localStorage.setItem(DRAFT_STORAGE_KEY, content);
        setHasSavedDraft(true);
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasSavedDraft(false);
      }
    } catch {
      // ignore storage quota issues
    }
  }, [content]);

  const { isListening, toggleListening, stopListening } = useSpeechRecognition({
    onTranscript: (transcript) => {
      setContent((prev) => {
        if (!prev.trim()) {
          return transcript;
        }
        return `${prev.trim()} ${transcript}`;
      });
    },
    onError: (err) => {
      setVoiceNotice(err);
      setTimeout(() => setVoiceNotice(null), 5000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    if (isListening) stopListening();
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasSavedDraft(false);
    } catch {
      // ignore
    }
    onSubmit(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Title */}
      <div className="mb-4 sm:mb-8 text-left">
        <h1
          className="text-3xl sm:text-5xl font-light leading-tight text-[#2D2A26]"
          style={{ fontFamily: '"Georgia", Cambria, serif' }}
        >
          What's on your mind?
        </h1>
        <p className="text-xs sm:text-sm text-[#8C8781] mt-1.5 sm:mt-2 font-normal">
          A calm, private space to untangle thoughts, reflect on choices, and remember insights.
        </p>
      </div>

      {voiceNotice && (
        <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{voiceNotice}</span>
        </div>
      )}

      {/* Input Form Card */}
      <form onSubmit={handleSubmit} className="relative flex-1 flex flex-col">
        <div className={`relative flex-1 min-h-[220px] sm:min-h-[280px] bg-white border rounded-2xl p-4 sm:p-8 shadow-xs flex flex-col transition-colors duration-200 ${
          isListening
            ? 'border-[#FF6321] ring-2 ring-[#FF6321]/15 bg-[#FFF9F5]'
            : 'border-[#E8E4DF] focus-within:border-[#FF6321] focus-within:ring-2 focus-within:ring-[#FF6321]/15'
        }`}>
          {/* Listening Pill Indicator */}
          {isListening && (
            <div className="mb-3 flex items-center justify-between px-3 py-1.5 rounded-full bg-[#FF6321]/10 border border-[#FF6321]/30 text-xs text-[#FF6321]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-ping" />
                <span className="font-medium text-[11px] sm:text-xs">Listening to your voice... dictate your thoughts</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-[10px] font-bold uppercase tracking-wider hover:underline text-[#FF6321] cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isListening ? "Listening... speak now..." : "I've been thinking about what direction to prioritize next. It feels like a pivotal moment, and I want to balance long-term focus with today's immediate demands..."}
            rows={6}
            className="w-full flex-1 text-base sm:text-xl text-[#1A1A1A] placeholder-[#8C8781] placeholder:italic bg-transparent border-none focus:outline-none resize-none leading-relaxed"
          />

          {/* Bottom Action Row inside Card: 'Speak', Auto-save status, and 'Reflect' */}
          <div className="mt-auto pt-4 sm:pt-6 border-t border-[#F0EEEA] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Speak Button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={isLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                  isListening
                    ? 'bg-[#FF6321] text-white shadow-sm ring-4 ring-[#FF6321]/20 animate-pulse'
                    : 'bg-[#FAF9F6] text-[#2D2A26] hover:text-[#1A1A1A] border border-[#E8E4DF] hover:bg-[#F0EEEA] shadow-2xs'
                }`}
                title={isListening ? "Stop voice listening" : "Voice to type (Speak)"}
                aria-label="Speak"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>Speak</span>
                  </>
                )}
              </button>

              {/* Auto-saved badge */}
              {hasSavedDraft && !isLoading && (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-[#8C8781] font-mono select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Auto-saved</span>
                </div>
              )}
            </div>

            {/* Reflect Button */}
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              className={`inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[42px] select-none ${
                content.trim() && !isLoading
                  ? 'bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-lg shadow-[#FF632133] active:scale-98'
                  : 'bg-[#F0EEEA] text-[#8C8781] cursor-not-allowed'
              }`}
              title="Begin reflection"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  <span>Reflecting...</span>
                </>
              ) : (
                <>
                  <span>Reflect</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
