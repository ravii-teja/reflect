import React, { useState, useMemo } from 'react';
import { Reflection, Conversation, Memory } from '../types';
import { GitCommit, Search, Calendar, ChevronRight, Copy, Check, X, Lock } from 'lucide-react';
import { ContributionGraph } from './ContributionGraph';
import { formatDateToKey } from '../services/activity';

interface MemoriesGitViewProps {
  reflections: Reflection[];
  conversations: Conversation[];
  memories: Memory[];
  onSelectReflection: (reflection: Reflection) => void;
  onSelectConversation: (conversation: Conversation) => void;
  onOpenVault: () => void;
  onNewReflect: () => void;
}

export const MemoriesGitView: React.FC<MemoriesGitViewProps> = ({
  reflections,
  conversations,
  memories,
  onSelectReflection,
  onSelectConversation,
  onOpenVault,
  onNewReflect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate a deterministic 7-char git commit hash from an ID
  const getCommitHash = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(7, '0');
    return hex.slice(0, 7);
  };

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Sort reflections chronologically (newest commit first)
  const sortedReflections = useMemo(() => {
    return [...reflections].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reflections]);

  // Extract all unique themes/tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    reflections.forEach((r) => {
      r.themes?.forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }, [reflections]);

  // Filter reflections by search query, selected tag, and selected date
  const filteredReflections = useMemo(() => {
    return sortedReflections.filter((r) => {
      const matchesTag = !selectedTag || r.themes?.includes(selectedTag);

      // Check date match if user clicked a box on the contribution graph
      let matchesDate = true;
      if (selectedDate) {
        try {
          const entryDateKey = formatDateToKey(new Date(r.createdAt));
          matchesDate = entryDateKey === selectedDate;
        } catch {
          matchesDate = false;
        }
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesTag && matchesDate;

      const hash = getCommitHash(r.id);
      const matchesSearch =
        hash.includes(query) ||
        r.summary.toLowerCase().includes(query) ||
        r.themes?.some((t) => t.toLowerCase().includes(query)) ||
        r.emotionalDetails?.primaryEmotion.toLowerCase().includes(query) ||
        r.insights?.some((ins) => ins.toLowerCase().includes(query));

      return matchesTag && matchesSearch && matchesDate;
    });
  }, [sortedReflections, searchQuery, selectedTag, selectedDate]);

  // Active uncommitted conversations
  const uncommittedConversations = useMemo(() => {
    return conversations.filter(
      (c) => c.status === 'active' && !reflections.some((r) => r.conversationId === c.id)
    );
  }, [conversations, reflections]);

  // Group filtered reflections by Month (e.g., September 2026), latest month first, and within each month latest first
  const groupedReflections = useMemo(() => {
    const groups: Record<
      string,
      {
        monthLabel: string;
        timestamp: number;
        entries: Reflection[];
      }
    > = {};

    filteredReflections.forEach((ref) => {
      const d = new Date(ref.createdAt);
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      const year = validDate.getFullYear();
      const month = String(validDate.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const monthLabel = validDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      if (!groups[key]) {
        const monthStart = new Date(year, validDate.getMonth(), 1).getTime();
        groups[key] = {
          monthLabel,
          timestamp: monthStart,
          entries: []
        };
      }
      groups[key].entries.push(ref);
    });

    const sortedKeys = Object.keys(groups).sort(
      (a, b) => groups[b].timestamp - groups[a].timestamp
    );

    return sortedKeys.map((key) => ({
      key,
      monthLabel: groups[key].monthLabel,
      entries: groups[key].entries.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }));
  }, [filteredReflections]);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-6">
      {/* Journal History Header & Contribution Activity */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E4DF] shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitCommit className="w-5 h-5 text-[#FF6321]" />
              <h1
                className="text-xl sm:text-2xl font-light text-[#1A1A1A] tracking-tight"
                style={{ fontFamily: '"Georgia", Cambria, serif' }}
              >
                Journal History
              </h1>
            </div>
            <p className="text-xs text-[#8C8781]">
              Every reflection synthesized and committed to your durable cognitive ledger.
            </p>
          </div>

          {/* Search bar and Vault button top next to journal history */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C8781] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history, tags..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl text-xs text-[#1A1A1A] placeholder-[#8C8781] focus:outline-none focus:border-[#FF6321] transition-colors"
              />
            </div>
            <button
              onClick={onOpenVault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F0EEEA] border border-[#E8E4DF] hover:border-[#FF6321]/60 text-xs font-medium text-[#1A1A1A] transition-all cursor-pointer shrink-0 shadow-2xs group"
              title="Open Personal Vault & Context"
            >
              <Lock className="w-3.5 h-3.5 text-[#FF6321]" />
              <span className="hidden sm:inline">Vault</span>
              <span>({memories.length})</span>
            </button>
          </div>
        </div>

        {/* Year-long Contribution Activity Snippet - Desktop only (hidden on mobile) */}
        <div className="pt-1 hidden sm:block">
          <ContributionGraph
            reflections={reflections}
            onSelectReflection={onSelectReflection}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Active Filters Bar (Tags and Date) */}
        {(allTags.length > 0 || selectedDate) && (
          <div className="pt-2 border-t border-[#F0EEEA] flex flex-wrap gap-1.5 items-center justify-between">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8781] mr-1">
                Filter:
              </span>
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedDate(null);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  selectedTag === null && selectedDate === null
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-2xs'
                    : 'bg-[#FAF9F6] text-[#6B665F] hover:text-[#1A1A1A] border border-[#E8E4DF]'
                }`}
              >
                All
              </button>
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#1A1A1A] text-white font-medium shadow-2xs'
                      : 'bg-[#FAF9F6] text-[#6B665F] hover:text-[#1A1A1A] border border-[#E8E4DF]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Active Date Filter Badge if user clicked a day on the contribution graph */}
            {selectedDate && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6321]/10 border border-[#FF6321]/30 text-[#FF6321] text-xs font-mono">
                <Calendar className="w-3 h-3" />
                <span>Date: {selectedDate}</span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="hover:text-[#1A1A1A] ml-1 p-0.5"
                  title="Clear date filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Uncommitted / Working Tree Staged Changes */}
      {uncommittedConversations.length > 0 && (
        <div className="bg-[#FFF9F5] p-4 sm:p-5 rounded-2xl border border-dashed border-[#FF6321]/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-ping" />
              <span className="text-xs font-bold text-[#FF6321] uppercase tracking-wider font-mono">
                Working Tree (Uncommitted Journal Sessions)
              </span>
            </div>
            <span className="text-[10px] text-[#8C8781] font-mono">
              {uncommittedConversations.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {uncommittedConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className="bg-white p-3 rounded-xl border border-[#E8E4DF] hover:border-[#FF6321] transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1A1A1A] truncate group-hover:text-[#FF6321] transition-colors">
                      {c.title || 'Unsaved reflection exchange'}
                    </span>
                    <span className="text-[9px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                      modified
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C8781] truncate mt-0.5">
                    {c.messages[c.messages.length - 1]?.content || 'In progress...'}
                  </p>
                </div>

                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-[#FF6321] group-hover:underline inline-flex items-center gap-1"
                >
                  Resume <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal Commits Timeline Grouped by Month (Latest First) */}
      {filteredReflections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E4DF] p-8 text-center shadow-2xs space-y-2">
          {searchQuery ? (
            <p className="text-xs text-[#8C8781]">No journal entries found matching &ldquo;{searchQuery}&rdquo;</p>
          ) : selectedDate ? (
            <p className="text-xs text-[#8C8781]">No journal entries found for date &ldquo;{selectedDate}&rdquo;</p>
          ) : selectedTag ? (
            <p className="text-xs text-[#8C8781]">No journal entries found tagged with #{selectedTag}</p>
          ) : (
            <p className="text-xs text-[#8C8781]">No journal reflections authored yet. Speak or write in the Reflect tab to create your first entry.</p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedReflections.map((group) => (
            <div key={group.key} className="space-y-4">
              {/* Month Header Divider */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#FAF9F6] border border-[#E8E4DF] px-3.5 py-1.5 rounded-full shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-[#FF6321]" />
                  <span className="text-xs font-bold text-[#1A1A1A] font-sans">
                    {group.monthLabel}
                  </span>
                  <span className="text-[10px] font-mono text-[#8C8781] bg-white px-2 py-0.5 rounded-full border border-[#E8E4DF]">
                    {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="h-px bg-[#E8E4DF] flex-1" />
              </div>

              {/* Month's Timeline / Reflections List */}
              <div className="relative pl-0 sm:pl-8">
                {/* Continuous Branch Vertical Line - Desktop only */}
                <div className="hidden sm:block absolute left-3.5 top-3 bottom-3 w-0.5 bg-[#E8E4DF]" />

                <div className="space-y-3 sm:space-y-5">
                  {group.entries.map((ref) => {
                    const commitHash = getCommitHash(ref.id);
                    const themeHeader = ref.themes && ref.themes.length > 0 ? ref.themes[0] : 'mindset';

                    return (
                      <div key={ref.id} className="relative group">
                        {/* Git Commit Node Dot on Branch Line - Desktop only */}
                        <div className="hidden sm:flex absolute -left-8 top-5 w-4 h-4 rounded-full bg-[#FAF9F6] border-2 border-[#1A1A1A] group-hover:border-[#FF6321] group-hover:scale-110 transition-all items-center justify-center z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] group-hover:bg-[#FF6321]" />
                        </div>

                        {/* Reflection Session Card in the List */}
                        <div
                          onClick={() => onSelectReflection(ref)}
                          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E4DF] hover:border-[#FF6321] shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-3"
                        >
                          {/* Commit Meta Header: Hash, Branch, Date */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0EEEA] text-xs">
                            <div className="flex items-center gap-2">
                              {/* Commit Hash badge with copy button */}
                              <div
                                onClick={(e) => handleCopyHash(commitHash, e)}
                                title="Copy commit hash"
                                className="inline-flex items-center gap-1 font-mono text-[11px] bg-[#FAF9F6] border border-[#E8E4DF] hover:bg-[#F0EEEA] px-2 py-0.5 rounded-md text-[#2D2A26] transition-colors"
                              >
                                <GitCommit className="w-3 h-3 text-[#FF6321]" />
                                <span>{commitHash}</span>
                                {copiedHash === commitHash ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-[#8C8781]" />
                                )}
                              </div>

                              <span className="text-[#8C8781] text-[11px] font-mono">
                                authored in reflect
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-[#8C8781]">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(ref.createdAt)}</span>
                            </div>
                          </div>

                          {/* Commit Message: Headline & Summary */}
                          <div>
                            <h2 className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#FF6321] transition-colors">
                              reflect({themeHeader.toLowerCase().replace(/\s+/g, '-')}) : {ref.summary.split('.')[0]}
                            </h2>
                            <p className="text-xs text-[#6B665F] mt-1.5 leading-relaxed line-clamp-2">
                              {ref.summary}
                            </p>
                          </div>

                          {/* Diff stats & Realization badges */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-[#F0EEEA]">
                            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                              {/* Inspected diff additions */}
                              {ref.insights && ref.insights.length > 0 && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  +{ref.insights.length} {ref.insights.length === 1 ? 'insight' : 'insights'}
                                </span>
                              )}

                              {ref.decisions && ref.decisions.length > 0 && (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  +{ref.decisions.length} {ref.decisions.length === 1 ? 'decision' : 'decisions'}
                                </span>
                              )}

                              {ref.emotionalDetails && (
                                <span className="px-2 py-0.5 rounded bg-[#FAF9F6] text-[#2D2A26] border border-[#E8E4DF] capitalize font-sans">
                                  ~ {ref.emotionalDetails.primaryEmotion}
                                </span>
                              )}
                            </div>

                            {/* Inspect Commit Link */}
                            <span className="text-[11px] font-semibold text-[#FF6321] group-hover:underline inline-flex items-center gap-1">
                              Inspect Diff <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

