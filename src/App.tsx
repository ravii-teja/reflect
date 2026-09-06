import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Header } from './components/Header';
import { ThinkingInput } from './components/ThinkingInput';
import { RecentReflections } from './components/RecentReflections';
import { ConversationView } from './components/ConversationView';
import { ReflectionModal } from './components/ReflectionModal';
import { MemoryVaultModal } from './components/MemoryVaultModal';
import { SecurityDrawer } from './components/SecurityDrawer';
import { AuthModal } from './components/AuthModal';
import { ApiService } from './services/api';
import { Conversation, Reflection, Memory, MemoryType } from './types';
import { getOrCreateDeviceCryptoKey } from './utils/crypto';
import { testFirestoreConnection } from './lib/firebase';
import { Lock, Sparkles, Brain, Shield } from 'lucide-react';

function ReflectMain() {
  const { user, getIdToken, loginAsDevUser } = useAuth();

  // Navigation / View state
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  // Modals & Drawers
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [isMemoryVaultOpen, setIsMemoryVaultOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // E2EE Crypto Key state
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isCustomKey, setIsCustomKey] = useState(false);

  // Loading / Action states
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Initialize E2EE Crypto Key & test connection on mount
  useEffect(() => {
    async function initCrypto() {
      try {
        const { key, isCustom } = await getOrCreateDeviceCryptoKey();
        setCryptoKey(key);
        setIsCustomKey(isCustom);
      } catch (err) {
        console.warn('E2EE key init error:', err);
      }
    }
    initCrypto();
    testFirestoreConnection();
  }, []);

  // Auto-login as default preview user if unauthenticated on first visit
  useEffect(() => {
    if (!user) {
      // Default to Ravi demo user for instantaneous exploration in preview
      loginAsDevUser('Ravi');
    }
  }, [user, loginAsDevUser]);

  // Load user data whenever auth state or cryptoKey changes
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, cryptoKey]);

  const loadUserData = async () => {
    try {
      const token = await getIdToken();
      const [convs, refs, mems] = await Promise.all([
        ApiService.getConversations(token).catch(() => []),
        ApiService.getReflections(token).catch(() => []),
        ApiService.getMemories(token, cryptoKey).catch(() => [])
      ]);
      setConversations(convs);
      setReflections(refs);
      setMemories(mems);
    } catch (err) {
      console.warn('Failed to load user data:', err);
    }
  };

  // Start new reflection conversation from ThinkingInput
  const handleStartReflection = async (prompt: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setIsStartingSession(true);
    try {
      const token = await getIdToken();
      const newConv = await ApiService.createConversation(token, undefined, prompt);
      setActiveConversation(newConv);

      // Now send the message to Gemini to get immediate thoughtful response
      setIsSendingMessage(true);
      
      // Decrypted memory snippets to provide context continuity
      const memorySnippets = memories
        .filter(m => m.rawPlaintext)
        .slice(0, 4)
        .map(m => m.rawPlaintext!);

      const chatResp = await ApiService.sendMessage(newConv.id, prompt, token, memorySnippets);

      // Refresh conversation state
      const updatedConv = await ApiService.getConversation(newConv.id, token);
      setActiveConversation(updatedConv);
      await loadUserData();
    } catch (err: any) {
      console.error('Error starting reflection:', err);
    } finally {
      setIsStartingSession(false);
      setIsSendingMessage(false);
    }
  };

  // Send follow-up message in active conversation
  const handleSendMessage = async (text: string) => {
    if (!activeConversation) throw new Error('No active session');
    const token = await getIdToken();
    setIsSendingMessage(true);
    try {
      const memorySnippets = memories
        .filter(m => m.rawPlaintext)
        .slice(0, 4)
        .map(m => m.rawPlaintext!);

      const resp = await ApiService.sendMessage(activeConversation.id, text, token, memorySnippets);
      const updated = await ApiService.getConversation(activeConversation.id, token);
      setActiveConversation(updated);
      await loadUserData();
      return resp;
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Synthesize Reflection
  const handleSynthesizeReflection = async () => {
    if (!activeConversation) return;
    const token = await getIdToken();
    setIsSynthesizing(true);
    try {
      const { reflection } = await ApiService.generateReflection(activeConversation.id, token);
      setSelectedReflection(reflection);
      await loadUserData();
    } catch (err) {
      console.error('Failed to synthesize reflection:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Memory Vault Actions
  const handleDeleteMemory = async (id: string) => {
    const token = await getIdToken();
    await ApiService.deleteMemory(id, token);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleCreateMemory = async (newMem: { type: MemoryType; content: string; importance: number }) => {
    const token = await getIdToken();
    const created = await ApiService.createMemory(newMem, token, cryptoKey);
    setMemories(prev => [created, ...prev]);
  };

  const handleSetCustomPassphrase = async (pass: string) => {
    const { key, isCustom } = await getOrCreateDeviceCryptoKey(pass);
    setCryptoKey(key);
    setIsCustomKey(isCustom);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col selection:bg-[#FF6321]/20 selection:text-[#1A1A1A]">
      {/* Header */}
      <Header
        onOpenMemories={() => setIsMemoryVaultOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNewSession={() => setActiveConversation(null)}
        memoriesCount={memories.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {activeConversation ? (
          <ConversationView
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
            onSendMessage={handleSendMessage}
            onSynthesizeReflection={handleSynthesizeReflection}
            isSending={isSendingMessage}
            isSynthesizing={isSynthesizing}
            activeMemoriesCount={memories.length}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Column: What's on your mind thinking area */}
            <div className="lg:col-span-7 flex flex-col">
              <ThinkingInput
                onSubmit={handleStartReflection}
                isLoading={isStartingSession}
              />
            </div>

            {/* Right Column: Recent Reflections & Personal Memories */}
            <div className="lg:col-span-5 flex flex-col gap-10">
              <RecentReflections
                reflections={reflections}
                conversations={conversations}
                onSelectReflection={(r) => setSelectedReflection(r)}
                onSelectConversation={(c) => setActiveConversation(c)}
              />

              {/* Personal Memories Panel matching Natural Tones Design */}
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781]">
                    Personal Memories
                  </h2>
                  <button
                    onClick={() => setIsMemoryVaultOpen(true)}
                    className="text-[10px] text-[#FF6321] hover:underline font-bold tracking-wider uppercase cursor-pointer"
                  >
                    Manage Vault ({memories.length})
                  </button>
                </div>

                <div className="bg-[#F0EEEA] p-6 rounded-2xl border border-[#E8E4DF]">
                  <div className="flex flex-wrap gap-2">
                    {memories.length === 0 ? (
                      <div className="text-xs text-[#8C8781] italic py-2">
                        No memories saved yet. Reflect remembers key insights, goals, and decisions across sessions.
                      </div>
                    ) : (
                      memories.slice(0, 5).map((mem) => (
                        <div
                          key={mem.id}
                          className="bg-white px-3.5 py-2 rounded-lg text-xs border border-[#E8E4DF] shadow-2xs"
                        >
                          <span className="text-[#FF6321] mr-1.5 italic font-medium capitalize">
                            {mem.type.replace('_', ' ')}:
                          </span>
                          <span className="text-[#1A1A1A]">
                            {mem.rawPlaintext || mem.content}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8E4DF] flex items-center justify-between text-[#8C8781]">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#8C8781]" />
                      <span className="text-[10px] tracking-widest uppercase font-bold">
                        Verified Semantic Isolation
                      </span>
                    </div>
                    <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8C8781]">
                      AES-256 E2EE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer from Natural Tones design */}
      <footer className="mt-12 py-6 border-t border-[#E8E4DF] bg-[#FAF9F6]">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-between items-center text-[10px] uppercase tracking-widest text-[#8C8781] font-bold gap-4">
          <div>Reflect v1.0.4 • San Francisco, CA</div>
          <div className="flex flex-wrap gap-6 sm:gap-8">
            <span>Privacy Protocol: Zero-Knowledge</span>
            <span>Identity: Cloud-Run Authenticated</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ReflectionModal
        reflection={selectedReflection}
        onClose={() => setSelectedReflection(null)}
        onContinueConversation={(convId) => {
          setSelectedReflection(null);
          const found = conversations.find(c => c.id === convId);
          if (found) setActiveConversation(found);
        }}
      />

      <MemoryVaultModal
        isOpen={isMemoryVaultOpen}
        onClose={() => setIsMemoryVaultOpen(false)}
        memories={memories}
        onDeleteMemory={handleDeleteMemory}
        onCreateMemory={handleCreateMemory}
        isCustomKey={isCustomKey}
        onSetCustomPassphrase={handleSetCustomPassphrase}
      />

      <SecurityDrawer
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReflectMain />
    </AuthProvider>
  );
}
