import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Header } from './components/Header';
import { ThinkingInput } from './components/ThinkingInput';
import { InsightsPanel } from './components/InsightsPanel';
import { MemoriesGitView } from './components/MemoriesGitView';
import { BottomNav, AppTab } from './components/BottomNav';
import { ConversationView } from './components/ConversationView';
import { ReflectionModal } from './components/ReflectionModal';
import { MemoryVaultModal } from './components/MemoryVaultModal';
import { SecurityDrawer } from './components/SecurityDrawer';
import { AuthModal } from './components/AuthModal';
import { ApiService } from './services/api';
import { Conversation, Reflection, Memory, MemoryType, UserProfile } from './types';
import { getOrCreateDeviceCryptoKey } from './utils/crypto';
import { testFirestoreConnection } from './lib/firebase';
import { Lock, Sparkles, Brain, Shield } from 'lucide-react';

function ReflectMain() {
  const { user, getIdToken, loginAsDevUser, updateUserProfileState } = useAuth();

  // Tab navigation state: 'reflect' | 'insights' | 'memories'
  const [activeTab, setActiveTab] = useState<AppTab>('reflect');

  // Navigation / View state
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
  const [insightsData, setInsightsData] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

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

  // Load user data whenever auth state or cryptoKey changes
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, cryptoKey]);

  // Fetch dynamic insights based on authenticated user profile & reflection summaries
  const fetchDynamicInsights = async (passedToken?: string) => {
    try {
      setIsLoadingInsights(true);
      const token = passedToken || await getIdToken();
      const data = await ApiService.getInsights(token);
      setInsightsData(data);
    } catch (err) {
      console.warn('Could not fetch dynamic insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const loadUserData = async () => {
    try {
      const token = await getIdToken();
      const [convs, refs, mems, prof] = await Promise.all([
        ApiService.getConversations(token).catch(() => []),
        ApiService.getReflections(token).catch(() => []),
        ApiService.getMemories(token, cryptoKey).catch(() => []),
        ApiService.getUserProfile(token).catch(() => null)
      ]);
      setConversations(convs);
      setReflections(refs);
      setMemories(mems);
      if (prof) {
        setUserProfile(prof);
        updateUserProfileState(prof);
      }
      fetchDynamicInsights(token);
    } catch (err) {
      console.warn('Failed to load user data:', err);
    }
  };

  const handleUpdateProfile = async (profileData: {
    dateOfBirth?: string;
    location?: string;
    displayName?: string;
    bio?: string;
  }) => {
    try {
      const token = await getIdToken();
      const updated = await ApiService.updateUserProfile(profileData, token);
      setUserProfile(updated);
      updateUserProfileState(updated);
      fetchDynamicInsights(token);
    } catch (err) {
      console.error('Failed to update profile:', err);
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

      await ApiService.sendMessage(newConv.id, prompt, token, memorySnippets);

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

  // Synthesize Reflection - updates in-screen directly without modal popup and refreshes insights
  const handleSynthesizeReflection = async () => {
    if (!activeConversation) return;
    const token = await getIdToken();
    setIsSynthesizing(true);
    try {
      await ApiService.generateReflection(activeConversation.id, token);
      const updated = await ApiService.getConversation(activeConversation.id, token);
      setActiveConversation(updated);
      await loadUserData();
      await fetchDynamicInsights(token);
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
        onOpenVault={() => setIsMemoryVaultOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNewSession={() => {
          setActiveConversation(null);
          setActiveTab('reflect');
        }}
        memoriesCount={reflections.length}
      />

      {/* Main Content Area - with bottom padding for BottomNav */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-4 pb-20 sm:pb-24 flex flex-col min-h-0">
        {/* TAB 1: REFLECT (Journal, Speak, Type auto-saved, and click Reflect) */}
        {activeTab === 'reflect' && (
          activeConversation ? (
            <ConversationView
              conversation={activeConversation}
              onBack={() => setActiveConversation(null)}
              onSendMessage={handleSendMessage}
              onSynthesizeReflection={handleSynthesizeReflection}
              isSending={isSendingMessage}
              isSynthesizing={isSynthesizing}
              activeMemoriesCount={memories.length}
              reflection={reflections.find(r => r.conversationId === activeConversation.id || r.id === activeConversation.reflectionId) || null}
              onViewReflection={(r) => setSelectedReflection(r)}
            />
          ) : (
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0">
              <ThinkingInput
                onSubmit={handleStartReflection}
                isLoading={isStartingSession}
              />
            </div>
          )
        )}

        {/* TAB 2: INSIGHTS (Trends, Behavioral graphs & patterns) */}
        {activeTab === 'insights' && (
          <div className="max-w-4xl mx-auto w-full">
            <InsightsPanel
              reflections={reflections}
              memories={memories}
              userProfile={userProfile || user}
              insightsData={insightsData}
              isLoadingInsights={isLoadingInsights}
              onRefreshInsights={() => fetchDynamicInsights()}
              onOpenVault={() => setIsMemoryVaultOpen(true)}
              onSelectReflection={(r) => setSelectedReflection(r)}
              onStartReflection={() => {
                setActiveConversation(null);
                setActiveTab('reflect');
              }}
            />
          </div>
        )}

        {/* TAB 3: MEMORIES (Recent journals and git commits like UI on journal entries) */}
        {activeTab === 'memories' && (
          <div className="max-w-4xl mx-auto w-full">
            <MemoriesGitView
              reflections={reflections}
              conversations={conversations}
              memories={memories}
              onSelectReflection={(r) => setSelectedReflection(r)}
              onSelectConversation={(c) => {
                setActiveConversation(c);
                setActiveTab('reflect');
              }}
              onOpenVault={() => setIsMemoryVaultOpen(true)}
              onNewReflect={() => {
                setActiveConversation(null);
                setActiveTab('reflect');
              }}
            />
          </div>
        )}
      </main>

      {/* 3 Bottom Tabs: Reflect, Insights, Memories */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
        }}
        memoriesCount={reflections.length}
      />



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
        userProfile={userProfile || user}
        onUpdateProfile={handleUpdateProfile}
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
