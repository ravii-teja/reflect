import React from 'react';
import { Reflection, Conversation } from '../types';
import { Sparkles, Calendar, ChevronRight, MessageSquare } from 'lucide-react';

interface RecentReflectionsProps {
  reflections: Reflection[];
  conversations: Conversation[];
  onSelectReflection: (reflection: Reflection) => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export const RecentReflections: React.FC<RecentReflectionsProps> = ({
  reflections,
  conversations,
  onSelectReflection,
  onSelectConversation
}) => {
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781]">
          Memories
        </h2>
        <span className="text-[10px] text-[#8C8781] font-semibold tracking-wider uppercase">
          {reflections.length} stored
        </span>
      </div>

      {reflections.length === 0 && conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E8E4DF] p-6 text-center bg-white/60">
          <p className="text-xs text-[#8C8781]">
            No memories yet. Write what's on your mind to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Reflections list */}
          {reflections.map((ref) => (
            <div
              key={ref.id}
              onClick={() => onSelectReflection(ref)}
              className="group bg-white p-5 rounded-xl border border-[#E8E4DF] hover:border-[#FF6321] transition-colors cursor-pointer shadow-2xs"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-[#1A1A1A] group-hover:text-[#FF6321] transition-colors truncate pr-2">
                  {ref.themes && ref.themes.length > 0 ? ref.themes.join(' & ') : 'Personal Reflection'}
                </span>
                <span className="text-[10px] text-[#8C8781] uppercase shrink-0 font-medium tracking-wide">
                  {formatDate(ref.createdAt)}
                </span>
              </div>
              <p className="text-xs text-[#6B665F] line-clamp-2 leading-relaxed">
                {ref.summary}
              </p>
              {ref.emotionalDetails && (
                <div className="mt-2.5 pt-2 border-t border-[#F0EEEA] flex items-center justify-between text-[11px]">
                  <span className="text-[#1A1A1A] font-medium truncate max-w-[200px]">
                    {ref.emotionalDetails.primaryEmotion}
                  </span>
                  <span className="text-[#8C8781] capitalize shrink-0">
                    {ref.emotionalDetails.valence} tone
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Active unreflected conversations */}
          {conversations
            .filter((c) => c.status === 'active' && !reflections.some((r) => r.conversationId === c.id))
            .map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className="group bg-white/80 hover:bg-white p-4 rounded-xl border border-dashed border-[#E8E4DF] hover:border-[#FF6321] transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-xs text-[#1A1A1A] truncate pr-2">
                    {c.title}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-[#FF6321] bg-[#FF6321]/10 px-2 py-0.5 rounded-full shrink-0">
                    Active Thinking
                  </span>
                </div>
                <p className="text-xs text-[#8C8781] truncate">
                  {c.messages[c.messages.length - 1]?.content || 'Session in progress...'}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
