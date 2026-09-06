import React from 'react';
import { Reflection } from '../types';
import { X, Sparkles, Brain, CheckCircle2, HelpCircle, ArrowRight, Lock } from 'lucide-react';

interface ReflectionModalProps {
  reflection: Reflection | null;
  onClose: () => void;
  onContinueConversation?: (conversationId: string) => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  reflection,
  onClose,
  onContinueConversation
}) => {
  if (!reflection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6321]" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF6321]">
              Synthesized Reflection
            </span>
            <span className="flex items-center gap-1 ml-auto mr-8 text-[11px] text-[#8C8781] font-medium">
              <Lock className="w-3 h-3 text-[#FF6321]" />
              <span>Isolated to your account</span>
            </span>
          </div>

          <h2
            className="text-3xl font-light text-[#2D2A26] leading-snug"
            style={{ fontFamily: '"Georgia", Cambria, serif' }}
          >
            {reflection.themes.length > 0 ? reflection.themes.join(' & ') : 'Personal Reflection'}
          </h2>
          <p className="text-sm text-[#6B665F] mt-3 leading-relaxed bg-white p-5 rounded-2xl border border-[#E8E4DF] shadow-2xs">
            {reflection.summary}
          </p>
        </div>

        {/* Section: Themes */}
        {reflection.themes && reflection.themes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781] mb-2.5">
              Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {reflection.themes.map((theme, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#F5F3F0] text-[#6B665F] border border-[#E8E4DF] uppercase tracking-wider"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section: Key Insights */}
        {reflection.insights && reflection.insights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781] mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>Core Insights</span>
            </h3>
            <div className="space-y-2">
              {reflection.insights.map((ins, i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-[#E8E4DF] text-sm text-[#1A1A1A] leading-relaxed shadow-2xs">
                  {ins}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Decisions */}
        {reflection.decisions && reflection.decisions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781] mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Decisions & Commitments</span>
            </h3>
            <div className="space-y-2">
              {reflection.decisions.map((dec, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#F0EEEA] border border-[#E8E4DF] text-sm text-[#1A1A1A] leading-relaxed">
                  {dec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Open Loops */}
        {reflection.openLoops && reflection.openLoops.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781] mb-2.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>Open Loops & Unresolved Questions</span>
            </h3>
            <div className="space-y-2">
              {reflection.openLoops.map((loop, i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-[#E8E4DF] text-sm text-[#6B665F] leading-relaxed shadow-2xs">
                  {loop}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Future Prompts */}
        {reflection.futurePrompts && reflection.futurePrompts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781] mb-2.5">
              Probing Questions for Next Session
            </h3>
            <ul className="space-y-2">
              {reflection.futurePrompts.map((p, i) => (
                <li key={i} className="text-xs text-[#6B665F] italic bg-white p-3 rounded-xl border border-[#E8E4DF]">
                  "{p}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-[#E8E4DF] flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781]">
            Recorded {new Date(reflection.createdAt).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-3">
            {onContinueConversation && reflection.conversationId && (
              <button
                onClick={() => onContinueConversation(reflection.conversationId)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-medium bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-md shadow-[#FF632133] transition-colors cursor-pointer"
              >
                <span>Continue Thinking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium bg-[#F0EEEA] hover:bg-[#E8E4DF] text-[#1A1A1A] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
