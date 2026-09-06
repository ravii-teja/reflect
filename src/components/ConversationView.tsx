import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, ChatCompletionResponse } from '../types';
import { ArrowLeft, Sparkles, Send, Brain, ShieldCheck } from 'lucide-react';

interface ConversationViewProps {
  conversation: Conversation;
  onBack: () => void;
  onSendMessage: (text: string) => Promise<ChatCompletionResponse>;
  onSynthesizeReflection: () => Promise<void>;
  isSending: boolean;
  isSynthesizing: boolean;
  activeMemoriesCount: number;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onBack,
  onSendMessage,
  onSynthesizeReflection,
  isSending,
  isSynthesizing,
  activeMemoriesCount
}) => {
  const [inputText, setInputText] = useState('');
  const [lastRecalledMemories, setLastRecalledMemories] = useState<{ id: string; type: string; snippet: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    try {
      const resp = await onSendMessage(text);
      if (resp.retrievedMemories && resp.retrievedMemories.length > 0) {
        setLastRecalledMemories(resp.retrievedMemories);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="py-4 border-b border-[#E8E4DF] flex items-center justify-between sticky top-20 bg-[#FAF9F6]/95 backdrop-blur-sm z-20">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8781] hover:text-[#1A1A1A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reflections</span>
        </button>

        <div className="flex items-center gap-2">
          {conversation.status === 'reflected' ? (
            <span className="px-3 py-1 rounded-full bg-[#F0EEEA] text-[#2D2A26] border border-[#E8E4DF] text-xs font-medium">
              Reflected & Remembered
            </span>
          ) : (
            <button
              onClick={onSynthesizeReflection}
              disabled={conversation.messages.length < 2 || isSynthesizing}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                conversation.messages.length >= 2 && !isSynthesizing
                  ? 'bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-md shadow-[#FF632133] cursor-pointer'
                  : 'bg-[#F0EEEA] text-[#8C8781] cursor-not-allowed'
              }`}
            >
              {isSynthesizing ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Reflection</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Semantic Memory Continuity Notice */}
      {lastRecalledMemories.length > 0 && (
        <div className="my-3 px-4 py-3 rounded-2xl bg-[#F0EEEA] border border-[#E8E4DF] flex items-start gap-2.5 text-xs text-[#2D2A26]">
          <Brain className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#1A1A1A]">Continuity Active:</span> Gemini referenced your durable personal memories:
            <ul className="mt-1 list-disc list-inside text-[#6B665F] space-y-0.5">
              {lastRecalledMemories.map((m, i) => (
                <li key={i} className="truncate max-w-lg italic">"{m.snippet}"</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 py-6 space-y-6">
        {conversation.messages.length === 0 ? (
          <div className="py-20 text-center text-[#8C8781]">
            <p className="text-sm">Start by sharing your current dilemma or thought...</p>
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-[#8C8781] font-medium px-1">
                {msg.role === 'user' ? (
                  <span>You</span>
                ) : (
                  <span className="flex items-center gap-1 text-[#FF6321]">
                    <Sparkles className="w-3 h-3" />
                    <span>Reflect</span>
                  </span>
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm sm:text-base leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1A1A1A] text-white shadow-xs rounded-br-xs'
                    : 'bg-white border border-[#E8E4DF] text-[#1A1A1A] shadow-xs rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-[#FF6321] font-medium px-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>Reflect is thinking...</span>
            </div>
            <div className="bg-white border border-[#E8E4DF] rounded-2xl rounded-bl-xs p-4 text-sm text-[#8C8781] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6321] opacity-60 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#FF6321] opacity-80 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Bar */}
      <div className="sticky bottom-0 bg-[#FAF9F6]/95 backdrop-blur-md py-4 border-t border-[#E8E4DF]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="Reply to continue thinking..."
            className="w-full pl-5 pr-14 py-3.5 bg-white border border-[#E8E4DF] rounded-full text-sm text-[#1A1A1A] placeholder-[#8C8781] focus:outline-none focus:border-[#FF6321] focus:ring-2 focus:ring-[#FF6321]/15 shadow-xs transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`absolute right-2 p-2.5 rounded-full transition-all ${
              inputText.trim() && !isSending
                ? 'bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-md shadow-[#FF632133] cursor-pointer'
                : 'bg-[#F0EEEA] text-[#8C8781] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
