import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';

interface ThinkingInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const ThinkingInput: React.FC<ThinkingInputProps> = ({ onSubmit, isLoading }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    onSubmit(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const prompts = [
    'Should I pivot toward product leadership or deepen technical architecture?',
    'A recurring tension in how I allocate my energy this month...',
    'Unpacking an unresolved decision about our roadmap priorities.'
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Title */}
      <div className="mb-6 sm:mb-8 text-left">
        <h1
          className="text-4xl sm:text-5xl font-light leading-tight text-[#2D2A26]"
          style={{ fontFamily: '"Georgia", Cambria, serif' }}
        >
          What's on your mind?
        </h1>
        <p className="text-sm text-[#8C8781] mt-2 font-normal">
          A calm, private space to untangle thoughts, reflect on choices, and remember insights.
        </p>
      </div>

      {/* Input Form Card */}
      <form onSubmit={handleSubmit} className="relative flex-1 flex flex-col">
        <div className="relative flex-1 min-h-[280px] bg-white border border-[#E8E4DF] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col transition-colors duration-200 focus-within:border-[#FF6321] focus-within:ring-2 focus-within:ring-[#FF6321]/15">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="I've been thinking about the transition from engineering to product leadership lately. It feels like a natural step, but I'm worried about losing my technical edge..."
            rows={5}
            className="w-full flex-1 text-lg sm:text-xl text-[#1A1A1A] placeholder-[#8C8781] placeholder:italic bg-transparent border-none focus:outline-none resize-none leading-relaxed"
          />

          {/* Bottom Action Row inside Card */}
          <div className="mt-auto pt-6 border-t border-[#F0EEEA] flex flex-wrap gap-4 justify-between items-center">
            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-3 py-1 bg-[#F5F3F0] rounded-full text-[11px] font-medium text-[#6B665F] uppercase tracking-wider">
                Career
              </span>
              <span className="px-3 py-1 bg-[#F5F3F0] rounded-full text-[11px] font-medium text-[#6B665F] uppercase tracking-wider">
                Strategy
              </span>
              <span className="text-[11px] text-[#8C8781] hidden sm:inline ml-2">
                ⌘ + Enter
              </span>
            </div>

            {/* Reflect Button */}
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full font-medium transition-all duration-200 cursor-pointer ${
                content.trim() && !isLoading
                  ? 'bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-lg shadow-[#FF632133] active:scale-98'
                  : 'bg-[#F0EEEA] text-[#8C8781] cursor-not-allowed'
              }`}
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

      {/* Suggested Starters */}
      <div className="mt-6 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781]">
          Suggested reflection starters
        </span>
        <div className="flex flex-wrap gap-2">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setContent(p)}
              className="text-xs text-[#6B665F] hover:text-[#1A1A1A] bg-white hover:bg-[#F0EEEA] border border-[#E8E4DF] px-3.5 py-1.5 rounded-full transition-colors text-left cursor-pointer"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
