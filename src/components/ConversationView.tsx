import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, ChatCompletionResponse, Reflection } from '../types';
import { ArrowLeft, Sparkles, Send, Brain, Heart, Compass, ArrowRight, Mic, MicOff, AlertCircle, CheckCircle2, Lightbulb, Check, HelpCircle, Tag } from 'lucide-react';
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
  const reflectionSectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseInputRef = useRef('');

  // Voice to type speech recognition hook
  const { isListening, isSupported, toggleListening, stopListening } = useSpeechRecognition({
    onTranscript: (transcript) => {
      const base = baseInputRef.current;
      if (!base) {
        setInputText(transcript);
      } else {
        setInputText(`${base} ${transcript}`);
      }
    },
    onError: (err) => {
      setVoiceNotice(err);
      setTimeout(() => setVoiceNotice(null), 5000);
    }
  });

  const handleToggleVoice = () => {
    if (!isListening) {
      baseInputRef.current = inputText.trim();
    }
    toggleListening();
  };

  useEffect(() => {
    if (reflection) {
      setTimeout(() => {
        reflectionSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation.messages, isSending, reflection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    if (isListening) {
      stopListening();
    }
    const text = inputText.trim();
    setInputText('');
    baseInputRef.current = '';
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
    <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col h-[calc(100dvh-5.5rem)] min-h-0 px-2 sm:px-0">
      {/* Top Bar - Mobile Adaptive */}
      <div className="py-2.5 sm:py-3 border-b border-[#E8E4DF] flex items-center justify-between shrink-0 bg-[#FAF9F6]/95 backdrop-blur-sm z-20 gap-2">
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Reflected & Saved</span>
            </div>
          ) : conversation.status === 'reflected' ? (
            <span className="px-3 py-1 rounded-full bg-[#F0EEEA] text-[#2D2A26] border border-[#E8E4DF] text-[11px] sm:text-xs font-medium">
              Reflected & Remembered
            </span>
          ) : (
            <button
              onClick={onSynthesizeReflection}
              disabled={conversation.messages.length < 2 || isSynthesizing}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium transition-all ${
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
                  <span>Reflect</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Semantic Memory Continuity Notice */}
      {lastRecalledMemories.length > 0 && (
        <div className="my-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#F0EEEA] border border-[#E8E4DF] flex items-start gap-2.5 text-xs text-[#2D2A26] shrink-0">
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

      {/* Messages & Reflection Stream */}
      <div className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-4 sm:space-y-5 min-h-0 pr-1">
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

        {/* Reflection Section in the SAME Screen */}
        {reflection && (
          <div ref={reflectionSectionRef} className="mt-6 pt-6 border-t-2 border-[#FF6321]/30 space-y-4 animate-in fade-in duration-300">
            {/* Status Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF9F5] to-[#FAF9F6] p-4 sm:p-5 rounded-2xl border border-[#FF6321]/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FF6321] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A]">
                    Reflection Synthesized
                  </h3>
                  <p className="text-xs text-[#8C8781]">
                    Saved directly to your personal vault & memories
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white border border-[#E8E4DF] text-xs font-mono text-[#6B665F]">
                  {new Date(reflection.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Comprehensive Synthesis Narrative Card */}
            <div className="p-5 sm:p-7 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#F0EEEA]">
                <Sparkles className="w-4 h-4 text-[#FF6321]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Executive Reflection Synthesis
                </span>
              </div>
              <div className="text-sm sm:text-base text-[#2D2A26] leading-relaxed whitespace-pre-wrap font-sans">
                {reflection.summary}
              </div>

              {/* Themes */}
              {reflection.themes && reflection.themes.length > 0 && (
                <div className="pt-3 border-t border-[#F0EEEA] flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] uppercase font-bold text-[#8C8781] mr-1">
                    Themes:
                  </span>
                  {reflection.themes.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] text-xs text-[#2D2A26] font-medium"
                    >
                      <Tag className="w-3 h-3 text-[#FF6321]" />
                      <span>{t}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Core Insights Discovered */}
            {reflection.insights && reflection.insights.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F0EEEA]">
                  <Lightbulb className="w-4 h-4 text-[#FF6321]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Key Realizations & Insights
                  </span>
                </div>
                <div className="space-y-2">
                  {reflection.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] text-xs sm:text-sm text-[#2D2A26] flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="flex-1 leading-relaxed">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decisions Made */}
            {reflection.decisions && reflection.decisions.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F0EEEA]">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Decisions & Commitments
                  </span>
                </div>
                <div className="space-y-2">
                  {reflection.decisions.map((decision, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-xs sm:text-sm text-[#1A1A1A] flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="flex-1 leading-relaxed">{decision}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Intelligence & Grounding Takeaway */}
            {reflection.emotionalDetails && (
              <div className="p-5 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0EEEA]">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#FF6321]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Emotional Grounding & Arc
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] text-[10px] text-[#6B665F]">
                    Valence: {reflection.emotionalDetails.valence}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF]">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] block mb-1">
                      Dominant Emotional Tone
                    </span>
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      {reflection.emotionalDetails.primaryEmotion}
                    </p>
                    <p className="text-[11px] text-[#6B665F] mt-0.5 capitalize">
                      Intensity: {reflection.emotionalDetails.intensity}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF]">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] block mb-1">
                      Underlying Needs
                    </span>
                    <p className="text-xs text-[#2D2A26] leading-relaxed">
                      {reflection.emotionalDetails.underlyingNeeds.join(' • ')}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] block mb-1">
                    Shift Across Session
                  </span>
                  <p className="text-xs text-[#6B665F] leading-relaxed">
                    {reflection.emotionalDetails.emotionalArc}
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FFF9F5] border border-[#FF6321]/30">
                  <Compass className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF6321] block">
                      Grounding Takeaway
                    </span>
                    <p className="text-xs text-[#1A1A1A] italic mt-0.5 font-medium">
                      "{reflection.emotionalDetails.somaticTakeaway}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Future Prompts for Next Session */}
            {reflection.futurePrompts && reflection.futurePrompts.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] shadow-xs space-y-2">
                <div className="flex items-center gap-2 pb-1.5 border-b border-[#E8E4DF]">
                  <HelpCircle className="w-4 h-4 text-[#8C8781]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Questions to Consider Next Time
                  </span>
                </div>
                <div className="space-y-1.5">
                  {reflection.futurePrompts.map((prompt, idx) => (
                    <p key={idx} className="text-xs text-[#2D2A26] italic pl-2 border-l-2 border-[#FF6321]">
                      &ldquo;{prompt}&rdquo;
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt to Synthesize if not yet reflected */}
        {!reflection && conversation.messages.length >= 2 && !isSending && (
          <div className="mt-4 sm:mt-6 p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A]">
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
              <span>{isSynthesizing ? 'Synthesizing...' : 'Reflect'}</span>
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
      <div className="shrink-0 bg-[#FAF9F6]/95 backdrop-blur-md py-2.5 sm:py-3.5 border-t border-[#E8E4DF] z-20">
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
              onChange={(e) => {
                setInputText(e.target.value);
                baseInputRef.current = e.target.value.trim();
              }}
              disabled={isSending}
              placeholder={isListening ? "Listening... speak now" : "Reply to continue thinking..."}
              className={`w-full pl-4 sm:pl-5 pr-12 py-3 bg-white border rounded-full text-sm text-[#1A1A1A] placeholder-[#8C8781] focus:outline-none focus:border-[#FF6321] focus:ring-2 focus:ring-[#FF6321]/15 shadow-xs transition-all ${
                isListening ? 'border-[#FF6321] ring-2 ring-[#FF6321]/20 bg-[#FFF9F5]' : 'border-[#E8E4DF]'
              }`}
            />

            {/* Voice-to-Type Microphone Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
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
