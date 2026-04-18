import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

interface MemberData {
  member_id: number;
  name: string;
  employee_id: string;
  profile_picture: string | null;
  metric_value: number;
  normalized_score: number;
  raw_data: Record<string, any>;
}

interface MetricData {
  metric_name: string;
  metric_code: string;
  unit: string;
  goal_value: number | null;
  is_higher_better: boolean;
  available_weeks: { week: number; year: number }[];
  selected_week: number | null;
  selected_year: number | null;
  members: MemberData[];
}

interface WeekTrend {
  week: number;
  year: number;
  avg_value: number;
  avg_score: number;
  member_count: number;
  above_goal: number;
}

interface TrendData {
  week_trend: WeekTrend[];
  member_trends: {
    member_id: number;
    name: string;
    employee_id: string;
    weeks: { week: number; year: number; value: number | null; score: number | null }[];
  }[];
}

export default function PublishedMetricPage() {
  const { metricCode } = useParams<{ metricCode: string }>();
  const [data, setData] = useState<MetricData | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => { loadData(); loadTrend(); }, [metricCode]);

  useEffect(() => {
    if (selectedWeek !== null && selectedYear !== null) loadData(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear]);

  const loadData = async (week?: number, year?: number) => {
    if (!metricCode) return;
    setLoading(true);
    try {
      const params: any = { metric_code: metricCode };
      if (week) params.week = week;
      if (year) params.year = year;
      const res = await api.get('/api/published-metrics/data', { params });
      setData(res.data);
      if (!selectedWeek && res.data.selected_week) {
        setSelectedWeek(res.data.selected_week);
        setSelectedYear(res.data.selected_year);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load metric data');
    } finally {
      setLoading(false);
    }
  };

  const loadTrend = async () => {
    if (!metricCode) return;
    try {
      const res = await api.get('/api/published-metrics/trend', { params: { metric_code: metricCode, weeks: 6 } });
      setTrend(res.data);
    } catch { /* trend is optional */ }
  };

  const getScoreColor = (score: number) => score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600';
  const getScoreBg = (score: number) => score >= 90 ? 'bg-green-100 text-green-800' : score >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  const getRankBadge = (idx: number) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">No data available for this metric.</div>;
  }

  const teamAvg = data.members.length > 0
    ? (data.members.reduce((s, m) => s + m.metric_value, 0) / data.members.length).toFixed(2)
    : '0';
  const teamScoreAvg = data.members.length > 0
    ? (data.members.reduce((s, m) => s + m.normalized_score, 0) / data.members.length).toFixed(1)
    : '0';
  const aboveGoal = data.goal_value
    ? data.members.filter(m => data.is_higher_better ? m.metric_value >= data.goal_value! : m.metric_value <= data.goal_value!).length
    : 0;

  // Trend chart helpers
  const trendWeeks = trend?.week_trend || [];
  const maxTrendScore = trendWeeks.length > 0 ? Math.max(...trendWeeks.map(w => w.avg_score), 1) : 100;

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link to="/performance-analytics" className="text-purple-600 hover:underline text-sm">← Back to Performance Analytics</Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mt-1">
            📊 Published {data.metric_name} Data
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.metric_code} • Unit: {data.unit || 'N/A'} • Goal: {data.goal_value ?? 'Not set'} {data.unit}
            {data.is_higher_better ? ' (Higher is better)' : ' (Lower is better)'}
          </p>
        </div>

        {/* Week Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Week:</label>
          <select
            value={selectedWeek && selectedYear ? `${selectedWeek}_${selectedYear}` : ''}
            onChange={(e) => {
              const [w, y] = e.target.value.split('_').map(Number);
              setSelectedWeek(w);
              setSelectedYear(y);
            }}
            className="px-4 py-2 border border-purple-200 rounded-xl bg-white shadow-sm text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
          >
            {data.available_weeks.map((w) => (
              <option key={`${w.week}_${w.year}`} value={`${w.week}_${w.year}`}>
                Week {w.week}, {w.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-5 border border-purple-200">
          <p className="text-xs font-semibold text-purple-500">Team Members</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{data.members.length}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-5 border border-purple-200">
          <p className="text-xs font-semibold text-purple-500">Team Avg {data.metric_code}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{teamAvg} {data.unit}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-5 border border-purple-200">
          <p className="text-xs font-semibold text-purple-500">Avg Score</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{teamScoreAvg}%</p>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-5 border border-purple-200">
          <p className="text-xs font-semibold text-purple-500">Meeting Goal</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{aboveGoal}/{data.members.length}</p>
        </div>
      </div>

      {/* Weekly Trend Analysis */}
      {trendWeeks.length > 1 && (() => {
        const bestWeek = trendWeeks.reduce((a, b) => a.avg_score > b.avg_score ? a : b);
        const goalPercent = data.goal_value !== null ? Math.min((data.goal_value / maxTrendScore) * 100, 100) : null;
        return (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-base">📈 Weekly Trend Analysis — Last {trendWeeks.length} Weeks</h2>
              </div>
              {trendWeeks.length >= 2 && (() => {
                const overall = trendWeeks[trendWeeks.length - 1].avg_score - trendWeeks[0].avg_score;
                return (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex flex-col items-center animate-scorePulse">
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Overall</span>
                    <span className="text-2xl font-extrabold text-white drop-shadow-lg">
                      {overall >= 0 ? '↑' : '↓'} {Math.abs(overall).toFixed(1)}%
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 pb-4">
              {/* Top labels row */}
              <div className="flex gap-4 px-2 mb-2">
                {trendWeeks.map((w, i) => {
                  const prev = i > 0 ? trendWeeks[i - 1].avg_score : null;
                  const diff = prev !== null ? w.avg_score - prev : null;
                  const isBest = w.week === bestWeek.week && w.year === bestWeek.year;
                  return (
                    <div key={`top_${w.week}_${w.year}`} className="flex-1 flex flex-col items-center min-h-[48px] justify-end">
                      {isBest && <div className="text-lg animate-bounce">👑</div>}
                      {diff !== null && !isBest && (
                        <span className={`text-[11px] font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {diff >= 0 ? '▲' : '▼'}{Math.abs(diff).toFixed(1)}
                        </span>
                      )}
                      <span className={`text-sm font-extrabold ${isBest ? 'text-yellow-600' : 'text-gray-700'}`}>
                        {w.avg_score.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bar chart area */}
              <div className="relative flex items-end gap-4 px-2" style={{ height: '200px' }}>
                {/* Goal line */}
                {goalPercent !== null && (
                  <div className="absolute left-0 right-0 flex items-center z-10" style={{ bottom: `${goalPercent}%` }}>
                    <div className="w-full border-t-2 border-dashed border-purple-300"></div>
                    <span className="absolute -right-1 -top-5 text-[10px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">Goal</span>
                  </div>
                )}

                {trendWeeks.map((w, i) => {
                  const barH = (w.avg_score / maxTrendScore) * 100;
                  const isBest = w.week === bestWeek.week && w.year === bestWeek.year;
                  const isSelected = w.week === selectedWeek && w.year === selectedYear;
                  const barColor = w.avg_score >= 90 ? 'from-emerald-400 to-emerald-600'
                    : w.avg_score >= 70 ? 'from-indigo-400 to-purple-600'
                    : 'from-orange-400 to-red-500';

                  return (
                    <div key={`bar_${w.week}_${w.year}`} className="flex-1 h-full flex items-end justify-center group">
                      <div
                        onClick={() => { setSelectedWeek(w.week); setSelectedYear(w.year); }}
                        className={`w-14 rounded-xl bar-grow bg-gradient-to-t ${barColor} shadow-lg cursor-pointer
                          group-hover:shadow-xl group-hover:scale-x-110 transition-transform
                          ${isBest ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                          ${isSelected ? 'ring-4 ring-white ring-offset-2 scale-x-110' : ''}`}
                        style={{
                          height: `${barH}%`,
                          minHeight: '12px',
                          animationDelay: `${i * 0.12}s`,
                          boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Bottom labels row */}
              <div className="flex gap-4 px-2 mt-3">
                {trendWeeks.map((w) => {
                  const isBest = w.week === bestWeek.week && w.year === bestWeek.year;
                  const isSelected = w.week === selectedWeek && w.year === selectedYear;
                  return (
                    <div key={`bot_${w.week}_${w.year}`} className="flex-1 flex flex-col items-center">
                      <div
                        onClick={() => { setSelectedWeek(w.week); setSelectedYear(w.year); }}
                        className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                          isSelected ? 'bg-indigo-600 text-white scale-110 shadow-md'
                          : isBest ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        W{w.week}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">
                        {w.member_count} members
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary footer */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 border-t border-gray-100 pt-4 mt-4">
                <span className="flex items-center gap-1">👑 Best: <span className="font-bold text-yellow-600">W{bestWeek.week} ({bestWeek.avg_score.toFixed(1)}%)</span></span>
                {data.goal_value && (
                  <span className="flex items-center gap-1">🎯 Goal hit rate: <span className="font-bold text-green-600">
                    {trendWeeks[trendWeeks.length - 1].above_goal}/{trendWeeks[trendWeeks.length - 1].member_count}
                  </span></span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Data Table */}
      {data.members.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-12 text-center border border-purple-200">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">No published data for this metric yet</p>
          <p className="text-sm text-gray-400 mt-1">Process and publish files from the Metric Processor</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-purple-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3">
            <h2 className="text-white font-semibold text-sm">
              📋 {data.metric_name} — Week {data.selected_week}, {data.selected_year}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50/80">
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Login</th>
                  <th className="px-4 py-3 text-center">{data.metric_code} Value</th>
                  {data.goal_value && <th className="px-4 py-3 text-center">Goal</th>}
                  {data.goal_value && <th className="px-4 py-3 text-center">Variance</th>}
                  <th className="px-4 py-3 text-center">Score</th>
                  {trend && trend.member_trends.length > 0 && <th className="px-4 py-3 text-center">Trend</th>}
                  <th className="px-4 py-3 text-center">Status</th>
                  {data.metric_code === 'Missed' && <>
                    <th className="px-3 py-3 text-center">Site</th>
                    <th className="px-3 py-3 text-center">Offered</th>
                    <th className="px-3 py-3 text-center">Missed</th>
                    <th className="px-3 py-3 text-center">Missed%</th>
                    <th className="px-3 py-3 text-center">Chat Off</th>
                    <th className="px-3 py-3 text-center">Chat Miss</th>
                    <th className="px-3 py-3 text-center">Chat%</th>
                    <th className="px-3 py-3 text-center">Voice Off</th>
                    <th className="px-3 py-3 text-center">Voice Miss</th>
                    <th className="px-3 py-3 text-center">Voice%</th>
                    <th className="px-3 py-3 text-center">WI Off</th>
                    <th className="px-3 py-3 text-center">WI Miss</th>
                    <th className="px-3 py-3 text-center">WI%</th>
                    <th className="px-3 py-3 text-center">Rate Live</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {data.members.map((m, idx) => {
                  const variance = data.goal_value ? +(m.metric_value - data.goal_value).toFixed(2) : 0;
                  const isGood = data.goal_value
                    ? (data.is_higher_better ? m.metric_value >= data.goal_value : m.metric_value <= data.goal_value)
                    : m.normalized_score >= 80;
                  const memberTrend = trend?.member_trends.find(t => t.member_id === m.member_id);
                  const trendScores = memberTrend?.weeks.map(w => w.score).filter(s => s !== null) as number[] || [];
                  const trendDiff = trendScores.length >= 2 ? trendScores[trendScores.length - 1] - trendScores[trendScores.length - 2] : null;

                  return (
                    <tr key={m.member_id} className="border-b border-gray-100 hover:bg-purple-50/50 transition">
                      <td className="px-4 py-3 text-lg">{getRankBadge(idx)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/performance/${m.member_id}`} className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {m.profile_picture
                              ? <img src={`${m.profile_picture}`} alt="" className="w-full h-full object-cover" />
                              : initials(m.name)}
                          </div>
                          <span className="font-semibold text-purple-700 hover:underline">{m.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{m.employee_id}</td>
                      <td className={`px-4 py-3 text-center font-bold ${getScoreColor(m.normalized_score)}`}>
                        {m.metric_value} {data.unit}
                      </td>
                      {data.goal_value && (
                        <td className="px-4 py-3 text-center text-gray-500">{data.goal_value} {data.unit}</td>
                      )}
                      {data.goal_value && (
                        <td className={`px-4 py-3 text-center font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                          {variance > 0 ? '+' : ''}{variance}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreBg(m.normalized_score)}`}>
                          {m.normalized_score}%
                        </span>
                      </td>
                      {trend && trend.member_trends.length > 0 && (
                        <td className="px-4 py-3 text-center">
                          {trendDiff !== null ? (
                            <span className={`text-xs font-bold ${trendDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {trendDiff >= 0 ? '▲' : '▼'} {Math.abs(trendDiff).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          m.normalized_score >= 90 ? 'bg-green-100 text-green-800' :
                          m.normalized_score >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {m.normalized_score >= 90 ? '⭐ Excellent' : m.normalized_score >= 80 ? '⚡ Strong' : '⚠️ Need Attention'}
                        </span>
                      </td>
                      {data.metric_code === 'Missed' && <>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.site || '-'}</td>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.overall_offered ?? '-'}</td>
                        <td className={`px-3 py-3 text-center text-xs font-medium ${(m.raw_data?.overall_missed || 0) > 0 ? 'text-red-600' : ''}`}>{m.raw_data?.overall_missed ?? 0}</td>
                        <td className={`px-3 py-3 text-center text-xs font-bold ${(m.raw_data?.overall_missed_pct || 0) > 2 ? 'text-red-600' : (m.raw_data?.overall_missed_pct || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{m.raw_data?.overall_missed_pct ?? 0}%</td>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.chat_offered ?? 0}</td>
                        <td className={`px-3 py-3 text-center text-xs ${(m.raw_data?.chat_missed || 0) > 0 ? 'text-purple-600' : ''}`}>{m.raw_data?.chat_missed ?? 0}</td>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.chat_missed_pct ?? 0}%</td>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.voice_offered ?? 0}</td>
                        <td className={`px-3 py-3 text-center text-xs ${(m.raw_data?.voice_missed || 0) > 0 ? 'text-blue-600' : ''}`}>{m.raw_data?.voice_missed ?? 0}</td>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.voice_missed_pct ?? 0}%</td>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.wi_offered ?? 0}</td>
                        <td className={`px-3 py-3 text-center text-xs ${(m.raw_data?.wi_missed || 0) > 0 ? 'text-yellow-600' : ''}`}>{m.raw_data?.wi_missed ?? 0}</td>
                        <td className="px-3 py-3 text-center text-xs">{m.raw_data?.wi_missed_pct ?? 0}%</td>
                        <td className={`px-3 py-3 text-center text-xs font-bold ${(m.raw_data?.missed_contact_rate_live || 0) > 2 ? 'text-red-600' : (m.raw_data?.missed_contact_rate_live || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{m.raw_data?.missed_contact_rate_live ?? 0}%</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        @keyframes barGrow {
          from { height: 0%; opacity: 0; }
          to   { opacity: 1; }
        }
        .bar-grow {
          animation: barGrow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom;
        }
        @keyframes scorePulse {
          0% { opacity: 0; transform: scale(0.8); }
          60% { opacity: 1; transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .animate-scorePulse { animation: scorePulse 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}
