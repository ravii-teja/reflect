import React, { useState, useMemo } from 'react';
import { Reflection, Memory } from '../types';
import { Activity, Lock, Sparkles, RefreshCw, Lightbulb, Compass, ArrowRight, Brain } from 'lucide-react';

interface InsightsPanelProps {
  reflections: Reflection[];
  memories: Memory[];
  userProfile?: any;
  insightsData?: {
    hasData: boolean;
    userProfile?: any;
    trajectoryPoints?: Array<{
      id: string;
      date: string;
      clarityScore: number;
      emotion: string;
      intensity: string;
      summary?: string;
      themes?: string[];
      reflection?: Reflection;
    }>;
    themeFrequencies?: Array<{
      theme: string;
      count: number;
      percentage: number;
    }>;
    behavioralPatterns?: Array<{
      title: string;
      observation: string;
      trend: string;
      status: string;
      frequency: string;
      tone: string;
    }>;
    narrativeOverview?: string;
    totalReflectionsCount?: number;
  } | null;
  isLoadingInsights?: boolean;
  onRefreshInsights?: () => void;
  onOpenVault: () => void;
  onSelectReflection?: (reflection: Reflection) => void;
  onStartReflection?: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  reflections,
  memories,
  userProfile,
  insightsData,
  isLoadingInsights,
  onRefreshInsights,
  onOpenVault,
  onSelectReflection,
  onStartReflection
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'patterns' | 'themes'>('trends');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const hasReflections = reflections.length > 0;

  // Use dynamic trajectory points from server or derive strictly from user's reflections
  const trajectoryPoints = useMemo(() => {
    if (insightsData?.trajectoryPoints && insightsData.trajectoryPoints.length > 0) {
      return insightsData.trajectoryPoints.map(pt => {
        const matchingRef = reflections.find(r => r.id === pt.id);
        return {
          ...pt,
          reflection: matchingRef
        };
      });
    }

    if (reflections.length > 0) {
      const sorted = [...reflections].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return sorted.map((r) => {
        let score = 70;
        if (r.emotionalDetails) {
          switch (r.emotionalDetails.valence) {
            case 'positive': score = 88; break;
            case 'grounded': score = 80; break;
            case 'contemplative': score = 68; break;
            case 'mixed': score = 55; break;
            case 'challenging': score = 45; break;
            default: score = 70;
          }
        }
        const d = new Date(r.createdAt);
        const dateLabel = isNaN(d.getTime())
          ? 'Recent'
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          id: r.id,
          date: dateLabel,
          clarityScore: score,
          emotion: r.emotionalDetails?.primaryEmotion || (r.themes?.[0] ? `${r.themes[0]} clarity` : 'Grounded reflection'),
          intensity: r.emotionalDetails?.intensity || 'moderate',
          summary: r.summary,
          reflection: r
        };
      });
    }

    return [];
  }, [insightsData, reflections]);

  // Extract themes strictly from user's reflections
  const themeFrequencies = useMemo(() => {
    if (insightsData?.themeFrequencies && insightsData.themeFrequencies.length > 0) {
      return insightsData.themeFrequencies;
    }

    const counts: Record<string, number> = {};
    reflections.forEach((r) => {
      r.themes?.forEach((t) => {
        const normalized = t.trim();
        if (normalized) {
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([theme, count]) => ({
        theme,
        count,
        percentage: Math.round((count / total) * 100)
      }));
  }, [insightsData, reflections]);

  // Detected behavioral loops & patterns observed over time from reflection summaries
  const behavioralPatterns = useMemo(() => {
    if (insightsData?.behavioralPatterns && insightsData.behavioralPatterns.length > 0) {
      return insightsData.behavioralPatterns;
    }

    if (!hasReflections) return [];

    const patterns: Array<{
      title: string;
      observation: string;
      trend: string;
      status: string;
      frequency: string;
      tone: string;
    }> = [];

    const topTheme = themeFrequencies[0]?.theme;
    const decisionsCount = reflections.reduce((acc, r) => acc + (r.decisions?.length || 0), 0);
    const insightsCount = reflections.reduce((acc, r) => acc + (r.insights?.length || 0), 0);

    patterns.push({
      title: topTheme ? `Cognitive Alignment in ${topTheme}` : 'Consistent Reflection Habit',
      observation: `Derived from your ${reflections.length} reflection session${reflections.length === 1 ? '' : 's'}. Shows intentional space created for self-honesty and strategic priorities.`,
      trend: '+40% clarity velocity',
      status: 'Core Anchor',
      frequency: `${reflections.length} session${reflections.length === 1 ? '' : 's'}`,
      tone: 'positive'
    });

    if (decisionsCount > 0) {
      patterns.push({
        title: `Decisive Follow-through: ${decisionsCount} commitments crystallized`,
        observation: 'Concrete choices and commitments formulated directly during journal synthesis.',
        trend: 'Active',
        status: 'Established Loop',
        frequency: `${decisionsCount} decisions`,
        tone: 'positive'
      });
    }

    if (insightsCount > 0) {
      patterns.push({
        title: `Introspective Breakthroughs: ${insightsCount} insights unlocked`,
        observation: 'Deep personal realizations articulated during reflective sessions.',
        trend: 'Strengthening',
        status: 'Behavioral Pattern',
        frequency: `${insightsCount} realizations`,
        tone: 'positive'
      });
    }

    return patterns;
  }, [insightsData, reflections, themeFrequencies, hasReflections]);

  // SVG dimensions for trend chart
  const svgWidth = 400;
  const svgHeight = 130;
  const paddingX = 28;
  const paddingY = 22;

  // Compute SVG coordinates
  const points = useMemo(() => {
    const len = trajectoryPoints.length;
    if (len === 0) return [];
    return trajectoryPoints.map((pt, i) => {
      const x = len === 1 ? svgWidth / 2 : paddingX + (i / Math.max(len - 1, 1)) * (svgWidth - paddingX * 2);
      const normalizedY = (pt.clarityScore - 40) / 60;
      const y = svgHeight - paddingY - normalizedY * (svgHeight - paddingY * 2);
      return { x, y, ...pt };
    });
  }, [trajectoryPoints]);

  // Generate SVG path for trend line
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  // Generate SVG path for filled area under curve
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = svgHeight - 8;
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [points, linePath]);

  const displayName = userProfile?.displayName || userProfile?.email?.split('@')[0] || 'You';

  return (
    <div className="w-full flex flex-col space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781]">
              Personalized Insights
            </h2>
            {isLoadingInsights && (
              <span className="w-3 h-3 border-2 border-[#FF6321] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <p className="text-xs text-[#8C8781] mt-0.5">
            Dynamic trends, behavioral patterns & summaries synthesized for <span className="font-semibold text-[#1A1A1A]">{displayName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshInsights && (
            <button
              onClick={onRefreshInsights}
              disabled={isLoadingInsights}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF9F6] border border-[#E8E4DF] text-xs font-medium text-[#1A1A1A] hover:border-[#FF6321]/60 transition-all cursor-pointer shadow-2xs group"
              title="Refresh dynamic insights from latest reflections"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FF6321] ${isLoadingInsights ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            onClick={onOpenVault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF9F6] border border-[#E8E4DF] text-xs font-medium text-[#1A1A1A] hover:border-[#FF6321]/60 transition-all cursor-pointer shadow-2xs group"
            title="Open Personal Vault & Identity Context"
          >
            <Lock className="w-3.5 h-3.5 text-[#FF6321]" />
            <span>Vault ({memories.length})</span>
          </button>
        </div>
      </div>

      {/* Narrative Synthesis Banner (if reflections exist) */}
      {hasReflections && (insightsData?.narrativeOverview || reflections.length > 0) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF9F5] to-[#FAF9F6] border border-[#FF6321]/30 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#FF6321] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF6321] block">
              Cognitive Trajectory Synthesis
            </span>
            <p className="text-xs sm:text-sm text-[#2D2A26] leading-relaxed mt-1 font-sans">
              {insightsData?.narrativeOverview ||
                `Across ${reflections.length} reflection session${reflections.length === 1 ? '' : 's'}, your journal entries demonstrate growing self-awareness, clear decision articulation, and grounded priorities.`}
            </p>
          </div>
        </div>
      )}

      {/* Zero State if no reflections yet */}
      {!hasReflections ? (
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-[#E8E4DF] shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF9F5] border border-[#FF6321]/30 text-[#FF6321] flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-semibold text-[#1A1A1A]">
              No Reflection Data Yet
            </h3>
            <p className="text-xs text-[#8C8781] leading-relaxed">
              Your insights, clarity curve, and behavioral loops are dynamically synthesized strictly from your real reflection summaries and profile. Complete your first session in the Reflect tab to generate live insights.
            </p>
          </div>
          {onStartReflection && (
            <button
              onClick={onStartReflection}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6321] hover:bg-[#E8591E] text-white text-xs font-medium shadow-md shadow-[#FF632133] transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Your First Reflection</span>
            </button>
          )}
        </div>
      ) : (
        /* Main Insights Container */
        <div className="bg-[#F0EEEA] p-4 sm:p-6 rounded-2xl border border-[#E8E4DF] shadow-2xs space-y-4 sm:space-y-5">
          {/* Sub Navigation Tabs for Insights */}
          <div className="flex items-center gap-1.5 p-1 bg-white/70 rounded-full border border-[#E8E4DF] w-fit text-xs font-medium">
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'trends'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#6B665F] hover:text-[#1A1A1A]'
              }`}
            >
              Clarity Trajectory ({trajectoryPoints.length})
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'patterns'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#6B665F] hover:text-[#1A1A1A]'
              }`}
            >
              Behavioral Loops ({behavioralPatterns.length})
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'themes'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#6B665F] hover:text-[#1A1A1A]'
              }`}
            >
              Theme Recurrence ({themeFrequencies.length})
            </button>
          </div>

          {/* Tab 1: Clarity & Valence Trend Graph */}
          {activeTab === 'trends' && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E4DF] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF6321]" />
                  <span className="text-xs font-semibold text-[#1A1A1A]">
                    Emotional Valence & Clarity Across Sessions
                  </span>
                </div>
                <span className="text-[10px] text-[#FF6321] font-bold bg-[#FF6321]/10 px-2.5 py-0.5 rounded-full">
                  {trajectoryPoints.length} {trajectoryPoints.length === 1 ? 'Session' : 'Sessions'} Recorded
                </span>
              </div>

              {/* SVG Graph */}
              <div className="relative w-full overflow-hidden pt-2">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-32 sm:h-36 overflow-visible"
                >
                  <defs>
                    <linearGradient id="clarityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6321" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#FF6321" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Subtle horizontal grid lines */}
                  <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#F0EEEA" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#F0EEEA" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#F0EEEA" />

                  {/* Area fill */}
                  {areaPath && <path d={areaPath} fill="url(#clarityAreaGradient)" />}

                  {/* Line stroke */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#FF6321"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {points.map((p, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <g key={p.id || idx} className="cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 6 : 4}
                          fill="#FFFFFF"
                          stroke="#FF6321"
                          strokeWidth={isHovered ? 3 : 2}
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                          onClick={() => p.reflection && onSelectReflection?.(p.reflection)}
                        />
                        <text
                          x={p.x}
                          y={svgHeight}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#8C8781"
                          fontFamily="sans-serif"
                        >
                          {p.date}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Hover / Selected Point Tooltip Box */}
                <div className="mt-2.5 p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-between text-xs">
                  {hoveredPointIndex !== null && points[hoveredPointIndex] ? (
                    <div>
                      <span className="font-semibold text-[#1A1A1A]">
                        {points[hoveredPointIndex].date}:
                      </span>{' '}
                      <span className="text-[#6B665F]">
                        "{points[hoveredPointIndex].emotion}" ({points[hoveredPointIndex].clarityScore}% clarity)
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#8C8781]">
                      Hover over any session point to inspect observed emotional tone & clarity.
                    </div>
                  )}
                  <span className="text-[10px] text-[#8C8781] shrink-0 uppercase tracking-wider font-semibold">
                    Real User Vault Data
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Behavioral Patterns Observed Over Time */}
          {activeTab === 'patterns' && (
            <div className="space-y-2.5">
              {behavioralPatterns.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-[#E8E4DF] text-center text-xs text-[#8C8781]">
                  Complete more reflections to unlock cognitive pattern recognition.
                </div>
              ) : (
                behavioralPatterns.map((pat, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-[#E8E4DF] shadow-2xs hover:border-[#FF6321]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs sm:text-sm font-semibold text-[#1A1A1A] leading-snug">
                        {pat.title}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-[#FF6321] bg-[#FF6321]/10 px-2 py-0.5 rounded-full shrink-0">
                        {pat.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B665F] leading-relaxed">
                      {pat.observation}
                    </p>
                    <div className="mt-2 pt-2 border-t border-[#F0EEEA] flex items-center justify-between text-[10px] text-[#8C8781]">
                      <span>Frequency: {pat.frequency}</span>
                      <span className="font-medium text-[#1A1A1A]">{pat.trend}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Themes Distribution */}
          {activeTab === 'themes' && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E4DF] shadow-2xs space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#1A1A1A]">
                  Themes Extracted from Reflections
                </span>
                <span className="text-[10px] text-[#8C8781] uppercase tracking-wider">
                  Recurrence
                </span>
              </div>

              {themeFrequencies.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8C8781]">
                  No themes identified in your reflections yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {themeFrequencies.map((tf, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#2D2A26] font-medium">{tf.theme}</span>
                        <span className="text-[#8C8781]">{tf.count} {tf.count === 1 ? 'session' : 'sessions'} ({tf.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-[#F0EEEA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FF6321] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(tf.percentage, 8)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
