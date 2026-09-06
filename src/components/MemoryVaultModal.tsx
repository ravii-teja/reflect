import React, { useState } from 'react';
import { Memory, MemoryType } from '../types';
import { X, Brain, Trash2, Plus, Lock, Key, Shield, Sparkles, Check } from 'lucide-react';

interface MemoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onDeleteMemory: (id: string) => Promise<void>;
  onCreateMemory: (memory: { type: MemoryType; content: string; importance: number }) => Promise<void>;
  isCustomKey: boolean;
  onSetCustomPassphrase: (pass: string) => Promise<void>;
}

export const MemoryVaultModal: React.FC<MemoryVaultModalProps> = ({
  isOpen,
  onClose,
  memories,
  onDeleteMemory,
  onCreateMemory,
  isCustomKey,
  onSetCustomPassphrase
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | MemoryType>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryType>('insight');
  const [newImportance, setNewImportance] = useState(4);
  const [isSaving, setIsSaving] = useState(false);

  // Custom passphrase state
  const [showPassphraseSetup, setShowPassphraseSetup] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseSuccess, setPassphraseSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredMemories = activeFilter === 'all'
    ? memories
    : memories.filter(m => m.type === activeFilter);

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onCreateMemory({
        type: newType,
        content: newContent.trim(),
        importance: newImportance
      });
      setNewContent('');
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    await onSetCustomPassphrase(passphrase.trim());
    setPassphraseSuccess(true);
    setTimeout(() => {
      setPassphraseSuccess(false);
      setShowPassphraseSetup(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E8E4DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F0EEEA] border border-[#E8E4DF] text-[#FF6321]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-medium text-[#1A1A1A] tracking-tight">
                  Semantic Personal Memory
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0EEEA] border border-[#E8E4DF] text-[10px] font-semibold text-[#FF6321]">
                  <Lock className="w-2.5 h-2.5" />
                  <span>AES-256 E2EE</span>
                </span>
              </div>
              <p className="text-xs text-[#8C8781] mt-0.5">
                Reflect remembers what matters — privately. Only accessible by you.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* E2EE Info & Passphrase Bar */}
        <div className="px-6 py-3 bg-white border-b border-[#E8E4DF] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#6B665F]">
            <Shield className="w-3.5 h-3.5 text-[#FF6321]" />
            <span>
              {isCustomKey ? 'Encrypted with Custom Passphrase' : 'Encrypted with Device Hardware Master Key'}
            </span>
          </div>

          <button
            onClick={() => setShowPassphraseSetup(!showPassphraseSetup)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#FF6321] hover:underline cursor-pointer"
          >
            <Key className="w-3 h-3" />
            <span>{showPassphraseSetup ? 'Hide Passphrase Vault' : 'Configure Passphrase'}</span>
          </button>
        </div>

        {/* Custom Passphrase Setup Form */}
        {showPassphraseSetup && (
          <div className="p-4 mx-6 my-3 rounded-2xl bg-[#F0EEEA] border border-[#E8E4DF] text-xs">
            <h4 className="font-semibold text-[#1A1A1A] mb-1">Zero-Knowledge Custom Passphrase</h4>
            <p className="text-[#6B665F] mb-3 leading-relaxed">
              Your passphrase derives an AES-GCM 256-bit encryption key on your device. The server never sees this phrase or plaintext memories.
            </p>
            <form onSubmit={handleApplyPassphrase} className="flex gap-2">
              <input
                type="password"
                placeholder="Enter private master passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E4DF] bg-white text-[#1A1A1A] text-xs focus:outline-none focus:border-[#FF6321]"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#FF6321] hover:bg-[#E8591E] text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                {passphraseSuccess ? <Check className="w-3.5 h-3.5" /> : 'Set Key'}
              </button>
            </form>
          </div>
        )}

        {/* Filter Pills & Add Button */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-[#E8E4DF] overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {(['all', 'insight', 'goal', 'decision', 'open_loop', 'theme'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-white text-[#6B665F] hover:bg-[#F0EEEA] border border-[#E8E4DF]'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-medium bg-[#F0EEEA] text-[#FF6321] hover:bg-[#E8E4DF] border border-[#E8E4DF] shrink-0 ml-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Add Memory Drawer */}
        {isAdding && (
          <form onSubmit={handleSaveMemory} className="p-4 mx-6 my-2 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs">
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781] mb-2">Record a durable memory</h4>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What important insight or goal should Reflect remember about you?"
              rows={3}
              className="w-full text-xs text-[#1A1A1A] p-3 border border-[#E8E4DF] rounded-xl focus:outline-none focus:border-[#FF6321] resize-none mb-3"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MemoryType)}
                  className="text-xs border border-[#E8E4DF] rounded-lg px-2.5 py-1 bg-[#F5F3F0] text-[#1A1A1A]"
                >
                  <option value="insight">Insight</option>
                  <option value="goal">Goal</option>
                  <option value="decision">Decision</option>
                  <option value="open_loop">Open Loop</option>
                  <option value="theme">Theme</option>
                </select>
                <span className="text-[11px] text-[#8C8781]">🔒 Client-side AES-256</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-xs text-[#8C8781] hover:bg-[#F0EEEA] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newContent.trim() || isSaving}
                  className="px-4 py-1 text-xs font-medium bg-[#FF6321] hover:bg-[#E8591E] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  {isSaving ? 'Encrypting...' : 'Save & Encrypt'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Memories Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredMemories.length === 0 ? (
            <div className="py-12 text-center text-[#8C8781]">
              <Brain className="w-8 h-8 mx-auto mb-2 text-[#D9D4CD]" />
              <p className="text-xs">No memories under this category yet.</p>
              <p className="text-[11px] text-[#8C8781] mt-1">
                Reflect automatically extracts durable memories when you synthesize reflections.
              </p>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="group p-4 rounded-2xl bg-white border border-[#E8E4DF] hover:border-[#FF6321] hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#F5F3F0] text-[#6B665F]">
                        {mem.type.replace('_', ' ')}
                      </span>
                      {mem.isEncrypted && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-[#FF6321]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>E2EE</span>
                        </span>
                      )}
                      <span className="text-[10px] text-[#8C8781] ml-auto">
                        {new Date(mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#1A1A1A] leading-relaxed font-normal">
                      {mem.rawPlaintext || mem.content}
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    title="Delete Memory"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[#8C8781] hover:text-red-600 rounded-lg hover:bg-[#F0EEEA] transition-all shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E4DF] bg-[#FAF9F6] rounded-b-3xl flex items-center justify-between text-[11px] text-[#8C8781]">
          <span>
            {memories.length} durable memories in your private vault
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F0EEEA] hover:bg-[#E8E4DF] text-[#1A1A1A] font-medium rounded-full transition-colors text-xs cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
