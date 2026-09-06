import React, { useState, useMemo } from 'react';
import { Reflection } from '../types';
import { useAuth } from '../auth/AuthContext';
import { getUserLogins, formatDateToKey, getTodayKey } from '../services/activity';
import { Calendar, GitCommit, Sparkles, X, ChevronRight, Check } from 'lucide-react';

interface ContributionGraphProps {
  reflections: Reflection[];
  onSelectReflection?: (reflection: Reflection) => void;
  selectedDate?: string | null;
  onSelectDate?: (dateKey: string | null) => void;
  title?: string;
  subtitle?: string;
}

export interface DayData {
  date: Date;
  dateKey: string;
  dateStr: string;
  isToday: boolean;
  count: number;
  userEntries: Reflection[];
  loginsCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  reflections,
  onSelectReflection,
  selectedDate,
  onSelectDate,
  title,
  subtitle
}) => {
  const { user } = useAuth();
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(null);
  const activeSelectedDate = selectedDate !== undefined ? selectedDate : internalSelectedDate;

  const [hoveredDay, setHoveredDay] = useState<{
    day: DayData;
    x: number;
    y: number;
  } | null>(null);

  // Dynamic 52-week calendar leading up to the current date (last one full year)
  const { weeks, monthLabels, totalContributions, daysWithActivity, daysMap } = useMemo(() => {
    const today = new Date();
    const todayKey = getTodayKey();

    // Determine the anchor date: current local time
    const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // End on Saturday of the current week so the 7x52 matrix aligns seamlessly
    const dayOfWeek = anchor.getDay(); // 0 is Sunday, 6 is Saturday
    const endDate = new Date(anchor);
    endDate.setDate(anchor.getDate() + (6 - dayOfWeek));

    // 52 weeks = 52 * 7 = 364 days
    const totalDays = 52 * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    // Map real reflections authored by the user by local YYYY-MM-DD
    const userReflectionsByDate: Record<string, Reflection[]> = {};
    reflections.forEach((r) => {
      try {
        const d = new Date(r.createdAt);
        if (!isNaN(d.getTime())) {
          const key = formatDateToKey(d);
          if (!userReflectionsByDate[key]) userReflectionsByDate[key] = [];
          userReflectionsByDate[key].push(r);
        }
      } catch {
        // ignore invalid dates
      }
    });

    // Fetch real user login events
    const userLogins = getUserLogins(user?.uid);

    let totalCount = 0;
    let activeDaysCount = 0;
    const map: Record<string, DayData> = {};

    const weeksList: DayData[][] = [];
    const months: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < 52; w++) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + w * 7 + d);

        const key = formatDateToKey(current);
        const m = current.getMonth();
        const isCurrentDay = key === todayKey;

        // Detect month label transitions on first week of each month
        if (m !== lastMonth) {
          if (months.length === 0 || w - months[months.length - 1].weekIndex >= 3) {
            months.push({
              name: current.toLocaleDateString('en-US', { month: 'short' }),
              weekIndex: w
            });
          }
          lastMonth = m;
        }

        // Real user entries & logins only - absolutely NO fake / simulated baseline entries
        const userEntries = userReflectionsByDate[key] || [];
        const loginActivity = userLogins[key];
        const loginsCount = loginActivity?.logins || 0;

        const dayContributionCount = userEntries.length + loginsCount;
        if (dayContributionCount > 0) {
          totalCount += dayContributionCount;
          activeDaysCount++;
        }

        // Color intensity mapped to genuine user activity:
        // 0 = no activity
        // 1 = 1 login or 1 light activity
        // 2 = multiple logins
        // 3 = 1 journal reflection
        // 4 = multiple journal reflections or journal reflection + login
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (userEntries.length >= 2 || (userEntries.length >= 1 && loginsCount >= 1)) {
          level = 4; // Peak Reflect brand orange (#FF6321)
        } else if (userEntries.length === 1) {
          level = 3; // Vibrant Reflect orange (#E05418)
        } else if (loginsCount >= 2) {
          level = 2; // Mid Reflect amber (#A63C10)
        } else if (loginsCount === 1) {
          level = 1; // Subtle Reflect amber (#5C230C)
        } else {
          level = 0; // Empty (#161B22)
        }

        const dayData: DayData = {
          date: current,
          dateKey: key,
          dateStr: current.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          isToday: isCurrentDay,
          count: dayContributionCount,
          userEntries,
          loginsCount,
          level
        };

        week.push(dayData);
        map[key] = dayData;
      }
      weeksList.push(week);
    }

    return {
      weeks: weeksList,
      monthLabels: months,
      totalContributions: totalCount,
      daysWithActivity: activeDaysCount,
      daysMap: map
    };
  }, [reflections, user?.uid]);

  // Color mapping matching the Reflect logo (#FF6321)
  const getLevelColor = (day: DayData, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-[#FF6321] border-white ring-2 ring-white scale-125 z-20 shadow-md';
    }

    if (day.userEntries.length > 0) {
      // Prominent Reflect brand orange for journal reflections
      return day.level === 4
        ? 'bg-[#FF6321] border-[#FF874E] shadow-2xs hover:brightness-110'
        : 'bg-[#E05418] border-[#F25F20] hover:brightness-110';
    }

    switch (day.level) {
      case 1:
        return 'bg-[#5C230C] border-[#742B0D] hover:border-[#A63C10]';
      case 2:
        return 'bg-[#A63C10] border-[#BE4513] hover:border-[#E05418]';
      case 3:
        return 'bg-[#E05418] border-[#F25F20] hover:brightness-110';
      case 4:
        return 'bg-[#FF6321] border-[#FF7D45] hover:brightness-110';
      default:
        return 'bg-[#161B22] border-[#21262D] hover:border-[#30363D]';
    }
  };

  const handleDayClick = (day: DayData) => {
    const nextKey = activeSelectedDate === day.dateKey ? null : day.dateKey;
    if (onSelectDate) {
      onSelectDate(nextKey);
    } else {
      setInternalSelectedDate(nextKey);
    }
  };

  const selectedDayData = activeSelectedDate ? daysMap[activeSelectedDate] : null;

  return (
    <div className="w-full space-y-3">
      {/* Contribution Calendar Card - Dark GitHub aesthetic with Reflect logo orange palette */}
      <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4 sm:p-5 text-[#8B949E] shadow-sm relative">
        {/* Overflow container for the 52-week horizontal grid */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[720px]">
            {/* Months header row - positioned with exact horizontal offsets for crisp visibility */}
            <div className="relative h-4 mb-2 ml-8 select-none">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  style={{ left: `${m.weekIndex * 13}px` }}
                  className="absolute top-0 text-[11px] font-mono text-[#C9D1D9] font-medium"
                >
                  {m.name}
                </span>
              ))}
            </div>

            {/* Days of week + 52-week columns grid */}
            <div className="flex gap-2">
              {/* Days of week labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between text-[10px] font-mono text-[#8B949E] py-[2px] pr-1 select-none h-[95px] w-7 shrink-0">
                <span className="leading-none">Mon</span>
                <span className="leading-none">Wed</span>
                <span className="leading-none">Fri</span>
              </div>

              {/* 52 Columns Grid (10px box + 3px gap = 13px pitch) */}
              <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
                {weeks.map((week, wIdx) =>
                  week.map((day, dIdx) => {
                    const isSelected = activeSelectedDate === day.dateKey;
                    return (
                      <div
                        key={`${wIdx}-${dIdx}`}
                        onClick={() => handleDayClick(day)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            day,
                            x: rect.left + rect.width / 2,
                            y: rect.top
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-[10px] h-[10px] rounded-[2px] border transition-all duration-100 cursor-pointer ${getLevelColor(
                          day,
                          isSelected
                        )}`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer inside card: guidance and color scale */}
            <div className="flex items-center justify-between text-[11px] text-[#8B949E] mt-3.5 pt-2.5 border-t border-[#21262D]/70 font-sans">
              <span className="text-[11px]">
                Click any box to inspect entries on that date
              </span>

              <div className="flex items-center gap-1.5 select-none text-[11px]">
                <span>Less</span>
                <div className="flex items-center gap-[3px]">
                  <div
                    title="0 contributions"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#161B22] border border-[#21262D]"
                  />
                  <div
                    title="Login session"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#5C230C] border border-[#742B0D]"
                  />
                  <div
                    title="Active sessions"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#A63C10] border border-[#BE4513]"
                  />
                  <div
                    title="1 journal reflection"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#E05418] border border-[#F25F20]"
                  />
                  <div
                    title="Peak journal reflections"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#FF6321] border border-[#FF7D45]"
                  />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredDay && (
          <div
            className="fixed -translate-x-1/2 -translate-y-full mb-2 z-50 pointer-events-none px-3 py-1.5 bg-[#1C2128] border border-[#444C56] text-white text-[11px] rounded-lg shadow-xl font-mono whitespace-nowrap"
            style={{
              left: `${hoveredDay.x}px`,
              top: `${hoveredDay.y - 8}px`
            }}
          >
            {hoveredDay.day.count > 0 ? (
              <div>
                <div className="font-semibold text-[#FF6321]">
                  {hoveredDay.day.userEntries.length > 0 && (
                    <span>✦ {hoveredDay.day.userEntries.length} journal {hoveredDay.day.userEntries.length === 1 ? 'entry' : 'entries'} </span>
                  )}
                  {hoveredDay.day.loginsCount > 0 && (
                    <span className="text-[#C9D1D9]">
                      ({hoveredDay.day.loginsCount} {hoveredDay.day.loginsCount === 1 ? 'login' : 'logins'})
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#8B949E]">
                  {hoveredDay.day.dateStr}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[#8B949E]">No contributions</span> on{' '}
                {hoveredDay.day.dateStr}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Day Inspector Panel: Enables users to inspect their actual contributions when clicking any box */}
      {selectedDayData && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#FF6321]/40 shadow-sm transition-all animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EEEA]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF6321]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">
                Activity on {selectedDayData.dateStr}
              </span>
              {selectedDayData.isToday && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  Today
                </span>
              )}
            </div>

            <button
              onClick={() => {
                if (onSelectDate) onSelectDate(null);
                setInternalSelectedDate(null);
              }}
              className="text-xs text-[#8C8781] hover:text-[#1A1A1A] flex items-center gap-1 p-1 rounded-md hover:bg-[#F0EEEA] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="pt-3 space-y-3">
            {/* Status pills */}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E8E4DF] text-[#1A1A1A] font-medium">
                {selectedDayData.count} total {selectedDayData.count === 1 ? 'contribution' : 'contributions'}
              </span>

              {selectedDayData.userEntries.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-[#FF6321]/10 text-[#FF6321] border border-[#FF6321]/30 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {selectedDayData.userEntries.length} journal {selectedDayData.userEntries.length === 1 ? 'entry' : 'entries'}
                </span>
              )}

              {selectedDayData.loginsCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {selectedDayData.loginsCount} active {selectedDayData.loginsCount === 1 ? 'login session' : 'login sessions'}
                </span>
              )}
            </div>

            {/* List of journal reflections for this day */}
            {selectedDayData.userEntries.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-semibold text-[#6B665F] uppercase tracking-wider">
                  Journal Reflections on this day:
                </span>
                {selectedDayData.userEntries.map((ref) => {
                  const theme = ref.themes?.[0] || 'Reflection';
                  return (
                    <div
                      key={ref.id}
                      onClick={() => onSelectReflection?.(ref)}
                      className="p-3.5 rounded-xl border border-[#E8E4DF] hover:border-[#FF6321] bg-[#FAF9F6] hover:bg-white transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <GitCommit className="w-3.5 h-3.5 text-[#FF6321]" />
                          <span className="font-semibold text-[#1A1A1A] group-hover:text-[#FF6321] transition-colors">
                            {ref.summary.split('.')[0]}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#FF6321] font-semibold inline-flex items-center gap-1 group-hover:underline">
                          Read Entry <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <p className="text-xs text-[#6B665F] line-clamp-2 leading-relaxed">
                        {ref.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E8E4DF] text-[10px] font-mono text-[#2D2A26]">
                          #{theme}
                        </span>
                        {ref.emotionalDetails && (
                          <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[10px] text-[#FF6321] capitalize font-medium">
                            ~ {ref.emotionalDetails.primaryEmotion}
                          </span>
                        )}
                        {ref.insights && ref.insights.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700">
                            +{ref.insights.length} {ref.insights.length === 1 ? 'insight' : 'insights'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedDayData.count > 0 ? (
              <p className="text-xs text-[#6B665F] italic pt-1">
                You logged into Reflect on this day. No journal entries were authored.
              </p>
            ) : (
              <p className="text-xs text-[#8C8781] italic pt-1">
                No journey entries or logins recorded for this date. Write or speak your thoughts in the Reflect tab to create your entry.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
