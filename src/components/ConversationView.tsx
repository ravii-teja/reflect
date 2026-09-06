import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, ChatCompletionResponse, Reflection } from '../types';
import { ArrowLeft, Sparkles, Send, Brain, Heart, Compass, ArrowRight, Mic, MicOff, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ConversationViewProps {
  conversation: Conversation;
  onBack: () => void;
  onSendMessage: (text: string) => Promise<ChatCompletionResponse>;
  onSynthesizeReflection: () => Promise<void>;
  isSending: boolean;
  isSynthesizing: boolean;
  activeMemoriesCount: number;
  reflection?: Reflection | null;
  onViewReflection?: (reflection: Reflection) => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onBack,
  onSendMessage,
  onSynthesizeReflection,
  isSending,
  isSynthesizing,
  activeMemoriesCount,
  reflection,
  onViewReflection
}) => {
  const [inputText, setInputText] = useState('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [lastRecalledMemories, setLastRecalledMemories] = useState<{ id: string; type: string; snippet: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice to type speech recognition hook
  const { isListening, isSupported, toggleListening, stopListening } = useSpeechRecognition({
    onTranscript: (transcript, isFinal) => {
      setInputText((prev) => {
        // If empty, start with transcript
        if (!prev.trim()) {
          return transcript;
        }
        // If previously typed, append speech naturally
        return `${prev.trim()} ${transcript}`;
      });
    },
    onError: (err) => {
      setVoiceNotice(err);
      setTimeout(() => setVoiceNotice(null), 5000);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    if (isListening) {
      stopListening();
    }
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
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] px-2 sm:px-0">
      {/* Top Bar - Mobile Adaptive */}
      <div className="py-3 sm:py-4 border-b border-[#E8E4DF] flex items-center justify-between sticky top-16 sm:top-20 bg-[#FAF9F6]/95 backdrop-blur-sm z-20 gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-[#8C8781] hover:text-[#1A1A1A] transition-colors cursor-pointer py-1"
          title="Return to reflection list"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Back to Reflections</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2">
          {reflection ? (
            <button
              onClick={() => onViewReflection && onViewReflection(reflection)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F0EEEA] text-[#1A1A1A] border border-[#E8E4DF] text-xs font-medium transition-all cursor-pointer shadow-2xs"
            >
              <Heart className="w-3.5 h-3.5 text-[#FF6321] shrink-0" />
              <span className="hidden sm:inline">View Emotional Synthesis</span>
              <span className="sm:hidden">Synthesis</span>
            </button>
          ) : conversation.status === 'reflected' ? (
            <span className="px-3 py-1 rounded-full bg-[#F0EEEA] text-[#2D2A26] border border-[#E8E4DF] text-[11px] sm:text-xs font-medium">
              Reflected & Remembered
            </span>
          ) : (
            <button
              onClick={onSynthesizeReflection}
              disabled={conversation.messages.length < 2 || isSynthesizing}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium transition-all ${
                conversation.messages.length >= 2 && !isSynthesizing
                  ? 'bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-md shadow-[#FF632133] cursor-pointer active:scale-98'
                  : 'bg-[#F0EEEA] text-[#8C8781] cursor-not-allowed'
              }`}
            >
              {isSynthesizing ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Synthesize Reflection</span>
                  <span className="sm:hidden">Synthesize</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Semantic Memory Continuity Notice */}
      {lastRecalledMemories.length > 0 && (
        <div className="my-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-[#F0EEEA] border border-[#E8E4DF] flex items-start gap-2.5 text-xs text-[#2D2A26]">
          <Brain className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-semibold text-[#1A1A1A]">Continuity Active:</span> Gemini referenced your durable personal memories:
            <ul className="mt-1 list-disc list-inside text-[#6B665F] space-y-0.5">
              {lastRecalledMemories.map((m, i) => (
                <li key={i} className="truncate max-w-full italic">"{m.snippet}"</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {conversation.messages.length === 0 ? (
          <div className="py-16 sm:py-20 text-center text-[#8C8781] px-4">
            <p className="text-sm">Start by sharing your current dilemma or thought...</p>
            <p className="text-xs text-[#8C8781]/80 mt-1">You can type below or tap the microphone to use voice-to-type.</p>
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
                className={`max-w-[92%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-sm sm:text-base leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1A1A1A] text-white shadow-xs rounded-br-xs'
                    : 'bg-white border border-[#E8E4DF] text-[#1A1A1A] shadow-xs rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              </div>
            </div>
          ))
        )}

        {/* End of Journal - Emotional Intelligence & Synthesis Details */}
        {reflection?.emotionalDetails && (
          <div className="mt-6 sm:mt-8 pt-6 border-t border-[#E8E4DF] animate-in fade-in duration-300">
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#E8E4DF] shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DF] mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#FF6321]" />
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                    Journal Synthesis & Emotional Grounding
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] text-[10px] text-[#6B665F]">
                  Valence: {reflection.emotionalDetails.valence}
                </span>
              </div>

              {/* Dominant Emotion & Needs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] block mb-1">
                    Dominant Emotion
                  </span>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {reflection.emotionalDetails.primaryEmotion}
                  </p>
                  <p className="text-[11px] text-[#6B665F] mt-1 capitalize">
                    Depth: {reflection.emotionalDetails.intensity}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] block mb-1">
                    Unmet / Core Needs
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {reflection.emotionalDetails.underlyingNeeds.slice(0, 3).map((need, idx) => (
                      <span key={idx} className="text-xs text-[#2D2A26] block">
                        • {need}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emotional Arc */}
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] mb-3.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] block mb-1">
                  Emotional Arc Through Journaling
                </span>
                <p className="text-xs text-[#6B665F] leading-relaxed">
                  {reflection.emotionalDetails.emotionalArc}
                </p>
              </div>

              {/* Somatic Grounding Takeaway */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F0EEEA] border border-[#E8E4DF]">
                <Compass className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] block">
                    Mindful Grounding & Self-Compassion
                  </span>
                  <p className="text-xs text-[#1A1A1A] italic mt-0.5">
                    "{reflection.emotionalDetails.somaticTakeaway}"
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E4DF] flex items-center justify-between">
                <span className="text-[11px] text-[#8C8781]">
                  Durable reflection recorded in vault
                </span>
                {onViewReflection && (
                  <button
                    onClick={() => onViewReflection(reflection)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6321] hover:text-[#E8591E] cursor-pointer"
                  >
                    <span>Open Full Reflection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prompt to Synthesize if not yet reflected */}
        {!reflection && conversation.messages.length >= 2 && !isSending && (
          <div className="mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-medium text-[#1A1A1A]">
                Ready to synthesize this journal session?
              </p>
              <p className="text-[11px] text-[#8C8781]">
                Extract emotional intelligence details, core decisions, and future prompts.
              </p>
            </div>
            <button
              onClick={onSynthesizeReflection}
              disabled={isSynthesizing}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-md shadow-[#FF632133] transition-all cursor-pointer shrink-0 active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Journal'}</span>
            </button>
          </div>
        )}

        {isSending && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-[#FF6321] font-medium px-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>Reflect is thinking...</span>
            </div>
            <div className="bg-white border border-[#E8E4DF] rounded-2xl rounded-bl-xs p-3.5 sm:p-4 text-sm text-[#8C8781] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6321] opacity-60 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#FF6321] opacity-80 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Bar with Voice-to-Type */}
      <div className="sticky bottom-0 bg-[#FAF9F6]/95 backdrop-blur-md py-3 sm:py-4 border-t border-[#E8E4DF] z-20">
        {/* Voice Feedback Notification */}
        {voiceNotice && (
          <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{voiceNotice}</span>
          </div>
        )}

        {/* Listening Active Wave Indicator */}
        {isListening && (
          <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-full bg-[#FF6321]/10 border border-[#FF6321]/30 text-xs text-[#FF6321] animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-ping" />
              <span className="font-medium text-[11px] sm:text-xs">Listening to your voice... speak your thoughts</span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="text-[10px] font-bold uppercase tracking-wider hover:underline text-[#FF6321] cursor-pointer"
            >
              Done speaking
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              placeholder={isListening ? "Listening... speak now" : "Reply to continue thinking..."}
              className={`w-full pl-4 sm:pl-5 pr-12 py-3 sm:py-3.5 bg-white border rounded-full text-sm text-[#1A1A1A] placeholder-[#8C8781] focus:outline-none focus:border-[#FF6321] focus:ring-2 focus:ring-[#FF6321]/15 shadow-xs transition-all ${
                isListening ? 'border-[#FF6321] ring-2 ring-[#FF6321]/20 bg-[#FFF9F5]' : 'border-[#E8E4DF]'
              }`}
            />

            {/* Voice-to-Type Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isSending}
              className={`absolute right-1.5 sm:right-2 p-2 rounded-full transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                isListening
                  ? 'bg-[#FF6321] text-white shadow-sm ring-4 ring-[#FF6321]/20'
                  : 'text-[#8C8781] hover:text-[#1A1A1A] hover:bg-[#F0EEEA]'
              }`}
              title={isListening ? "Tap to finish speaking" : "Voice to type (dictate thoughts)"}
              aria-label="Voice to type"
            >
              {isListening ? (
                <MicOff className="w-4 h-4 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Send Button with comfortable touch target */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`p-3 rounded-full shrink-0 transition-all min-w-[42px] min-h-[42px] flex items-center justify-center ${
              inputText.trim() && !isSending
                ? 'bg-[#FF6321] hover:bg-[#E8591E] text-white shadow-md shadow-[#FF632133] cursor-pointer active:scale-95'
                : 'bg-[#F0EEEA] text-[#8C8781] cursor-not-allowed'
            }`}
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
