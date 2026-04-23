import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface WeekScore {
  week: number;
  year: number;
  value: number | null;
  score: number | null;
  raw_data?: Record<string, any> | null;
}

interface MetricData {
  metric_code: string;
  metric_name: string;
  unit: string;
  goal_value: number | null;
  is_higher_better: boolean;
  current_value: number | null;
  current_score: number | null;
  trend: number | null;
  weeks: WeekScore[];
}

interface PerfData {
  member_name: string;
  employee_id: string;
  photo_url: string | null;
  overall_score: number | null;
  metrics: MetricData[];
  weeks: { week: number; year: number }[];
}

const TILE_GRADIENTS = [
  'from-purple-600 to-indigo-600',
  'from-blue-600 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-violet-600 to-fuchsia-500',
];

export default function PerformancePage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PerfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTile, setExpandedTile] = useState<number | null>(null);
  const [selectedBar, setSelectedBar] = useState<{ week: number; year: number } | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
    setUser(stored);
    loadData();
  }, [memberId]);

  const loadData = async () => {
    try {
      const params: any = { weeks: 6 };
      if (memberId) params.member_id = memberId;
      const res = await api.get('/api/published-metrics/my-performance', { params });
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-300';
    return 'text-red-400';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-500';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusLabel = (score: number | null) => {
    if (score === null) return 'No Data';
    if (score >= 90) return '⭐ Excellent';
    if (score >= 70) return '⚡ Strong';
    return '⚠️ Needs Attention';
  };

  const getMetricColumns = (code: string): { label: string; key: string }[] | null => {
    const upper = code.toUpperCase();
    if (upper.includes('ACHT')) return [
      { label: 'Date', key: 'date' }, { label: 'Week', key: 'week' }, { label: 'Specialist', key: 'specialist' },
      { label: 'Manager', key: 'manager' }, { label: 'Case ID', key: 'case_id' }, { label: 'Media Action', key: 'media_action' },
      { label: 'ACHT (in min)', key: 'acht_min' }, { label: 'Long Tail', key: 'long_tail' },
    ];
    if (upper.includes('MISSED') || upper.includes('MISS')) return [
      { label: 'Site', key: 'site' },
      { label: 'Offered', key: 'overall_offered' }, { label: 'Missed', key: 'overall_missed' },
      { label: 'Missed%', key: 'overall_missed_pct' },
      { label: 'Chat Off', key: 'chat_offered' }, { label: 'Chat Miss', key: 'chat_missed' },
      { label: 'Chat%', key: 'chat_missed_pct' },
      { label: 'Voice Off', key: 'voice_offered' }, { label: 'Voice Miss', key: 'voice_missed' },
      { label: 'Voice%', key: 'voice_missed_pct' },
      { label: 'WI Off', key: 'wi_offered' }, { label: 'WI Miss', key: 'wi_missed' },
      { label: 'WI%', key: 'wi_missed_pct' },
      { label: 'Rate Live', key: 'missed_contact_rate_live' },
    ];
    if (upper.includes('QA') || upper.includes('QUALITY')) return [
      { label: 'Case ID', key: 'case_id' }, { label: 'Monitoring Date', key: 'monitoring_date' },
      { label: 'Region', key: 'region' }, { label: 'Tenured/New-Hire', key: 'tenure' },
      { label: 'Contact ID', key: 'contact_id' }, { label: 'Store', key: 'store' },
      { label: 'HMD Response', key: 'hmd_response' }, { label: 'Reopen Contact', key: 'reopen_contact' },
      { label: 'Skill', key: 'skill' }, { label: 'Impacted Skill Set', key: 'impacted_skill' },
      { label: 'Contact Transaction Type', key: 'contact_txn_type' }, { label: 'Atlas Label L3', key: 'atlas_label' },
      { label: 'Transaction Date', key: 'txn_date' },
      { label: '1. Accurate Atlas Card?', key: 'q1' },
      { label: '2. Comprehensive Review?', key: 'q2' },
      { label: '3. Correct Annotation?', key: 'q3' },
      { label: '4. Used All Resources?', key: 'q4' },
      { label: '5. NVA Resolution?', key: 'q5' },
      { label: '6. Correct Escalation SLs?', key: 'q6' },
      { label: '7. Reopen Controllable?', key: 'q7' },
      { label: '8. Grammar/Spelling Impact?', key: 'q8' },
      { label: 'Overall Audit Score (0-100%)', key: 'audit_score' },
      { label: 'Overall Auditor Comments', key: 'auditor_comments' },
    ];
    if (upper.includes('ROR') || upper.includes('REOPEN')) return null;
    return null; // Any new/unknown metric shows "Coming Soon"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-[1200px] mx-auto space-y-5">

        {/* Header with oversized profile */}
        <div className="relative">
          {/* Purple gradient banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-xl shadow-lg p-4">
            <div className="flex items-stretch justify-between">
              <div className="flex items-center gap-3">
                {memberId ? (
                  <button onClick={() => navigate(-1 as any)} className="p-2 rounded-lg hover:bg-white/10 transition">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                ) : user?.role === 'specialist' && (
                  <button onClick={() => navigate('/member-dashboard')} className="p-2 rounded-lg hover:bg-white/10 transition">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                {data?.photo_url && (
                  <div className="h-full aspect-square rounded-xl border-2 border-white/30 overflow-hidden bg-white/20 flex-shrink-0" style={{ height: '100%', minHeight: '64px' }}>
                    <img src={data.photo_url} alt={data.member_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-300" />
                    {memberId ? 'Performance' : 'My Performance'}
                  </h1>
                  {data && (
                    <p className="text-sm text-white/70 mt-0.5">
                      {data.employee_id} • {data.member_name}
                    </p>
                  )}
                </div>
              </div>
              {data && data.overall_score !== null && (
                <div className="flex flex-col items-end animate-scorePulse">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Weekly Score</span>
                  <span className="text-4xl font-extrabold text-white drop-shadow-lg">
                    {data.overall_score}%
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* No data state */}
        {(!data || data.metrics.length === 0) && (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <div className="text-xl font-bold text-gray-800 mb-2">No Performance Data Yet</div>
            <div className="text-sm text-gray-500">Your performance data will appear here once metrics are published.</div>
          </div>
        )}

        {/* Metric Tiles */}
        {data && data.metrics.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.metrics.map((m, idx) => {
                const isExpanded = expandedTile === idx;
                const gradient = TILE_GRADIENTS[idx % TILE_GRADIENTS.length];
                return (
                  <div
                    key={m.metric_code}
                    className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg
                      transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]
                      ${isExpanded ? 'ring-4 ring-white/40 scale-[1.01]' : ''}`}
                  >
                    {/* Metric name & score */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold opacity-90 uppercase tracking-wide">{m.metric_code}</h3>
                        <p className="text-xs opacity-70">{m.metric_name}</p>
                      </div>
                      {m.trend !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          m.trend >= 0 ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'
                        }`}>
                          {m.trend >= 0 ? '▲' : '▼'} {Math.abs(m.trend).toFixed(1)}%
                        </span>
                      )}
                    </div>

                    {/* Current value */}
                    <div className="mb-1">
                      <span className="text-3xl font-bold">
                        {m.current_value !== null ? m.current_value : '—'}
                      </span>
                      {m.current_value !== null && (
                        <span className="text-sm opacity-80 ml-1">{m.unit}</span>
                      )}
                    </div>

                    {/* Score badge & Goal */}
                    <div className="flex flex-col gap-0.5 pr-10">
                      <span className={`text-xs font-bold ${getScoreColor(m.current_score)}`}>
                        Score: {m.current_score !== null ? `${m.current_score}%` : '—'}
                      </span>
                      {m.goal_value !== null && (
                        <span className="text-xs opacity-60">🎯 Goal: {m.goal_value}{m.unit}</span>
                      )}
                    </div>

                    {/* Expand button */}
                    <button
                      onClick={() => { setExpandedTile(isExpanded ? null : idx); setSelectedBar(null); }}
                      className={`absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur
                        flex items-center justify-center text-lg font-bold
                        transition-all duration-300 hover:bg-white/40 hover:scale-110
                        ${isExpanded ? 'rotate-45' : 'rotate-0'}`}
                    >+</button>
                  </div>
                );
              })}
            </div>

            {/* Expanded 6-week trend panel */}
            {expandedTile !== null && data.metrics[expandedTile] && (() => {
              const m = data.metrics[expandedTile];
              const gradient = TILE_GRADIENTS[expandedTile % TILE_GRADIENTS.length];
              const weekScores = m.weeks.filter(w => w.score !== null);
              const maxScore = Math.max(...(weekScores.length > 0 ? weekScores.map(w => w.score!) : [100]), 1);
              const bestWeek = weekScores.length > 0 ? weekScores.reduce((a, b) => (a.score! > b.score! ? a : b)) : null;
              const goalPercent = m.goal_value !== null ? Math.min((m.goal_value / maxScore) * 100, 100) : null;

              return (
                <div className="overflow-hidden animate-slideDown">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${gradient} px-6 py-4 flex items-center justify-between`}>
                      <div>
                        <h3 className="text-white font-bold text-base">
                          📈 {m.metric_name} ({m.metric_code})
                        </h3>
                        <p className="text-white/70 text-xs mt-0.5">Last {m.weeks.length} Weeks Trend</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {weekScores.length >= 2 && (() => {
                          const overall = weekScores[weekScores.length - 1].score! - weekScores[0].score!;
                          return (
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex flex-col items-center animate-scorePulse">
                              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Overall</span>
                              <span className="text-2xl font-extrabold text-white drop-shadow-lg">
                                {overall >= 0 ? '↑' : '↓'} {Math.abs(overall).toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()}
                        <button onClick={() => { setExpandedTile(null); setSelectedBar(null); }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition">✕</button>
                      </div>
                    </div>

                    <div className="p-6 pb-4">
                      {/* Top labels row */}
                      <div className="flex gap-4 px-2 mb-2">
                        {m.weeks.map((w, i) => {
                          const prev = i > 0 ? m.weeks[i - 1].score : null;
                          const diff = w.score !== null && prev !== null ? w.score - prev : null;
                          const isBest = bestWeek && w.week === bestWeek.week && w.year === bestWeek.year;
                          return (
                            <div key={`top_${w.week}_${w.year}`} className="flex-1 flex flex-col items-center min-h-[48px] justify-end">
                              {isBest && <div className="text-lg animate-bounce">👑</div>}
                              {diff !== null && !isBest && (
                                <span className={`text-[11px] font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {diff >= 0 ? '▲' : '▼'}{Math.abs(diff).toFixed(1)}
                                </span>
                              )}
                              <span className={`text-sm font-extrabold ${isBest ? 'text-yellow-600' : 'text-gray-700'}`}>
                                {w.score !== null ? `${w.score}%` : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bar chart area - only bars */}
                      <div className="relative flex items-end gap-4 px-2" style={{ height: '200px' }}>
                        {/* Goal line */}
                        {goalPercent !== null && (
                          <div className="absolute left-0 right-0 flex items-center z-10" style={{ bottom: `${goalPercent}%` }}>
                            <div className="w-full border-t-2 border-dashed border-purple-300"></div>
                            <span className="absolute -right-1 -top-5 text-[10px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">Goal</span>
                          </div>
                        )}

                        {m.weeks.map((w, i) => {
                          const barH = w.score !== null ? (w.score / maxScore) * 100 : 0;
                          const isBest = bestWeek && w.week === bestWeek.week && w.year === bestWeek.year;
                          const barColor = w.score !== null
                            ? w.score >= 90 ? 'from-emerald-400 to-emerald-600'
                            : w.score >= 70 ? 'from-indigo-400 to-purple-600'
                            : 'from-orange-400 to-red-500'
                            : '';

                          return (
                            <div key={`bar_${w.week}_${w.year}`} className="flex-1 h-full flex items-end justify-center group">
                              <div
                                onClick={() => w.score !== null && setSelectedBar(
                                  selectedBar?.week === w.week && selectedBar?.year === w.year ? null : { week: w.week, year: w.year }
                                )}
                                className={`w-14 rounded-xl bar-grow ${
                                  w.score !== null
                                    ? `bg-gradient-to-t ${barColor} shadow-lg cursor-pointer group-hover:shadow-xl group-hover:scale-x-110 transition-transform`
                                    : 'bg-gray-200'
                                } ${isBest ? 'ring-2 ring-yellow-400 ring-offset-2' : ''} ${
                                  selectedBar?.week === w.week && selectedBar?.year === w.year ? 'ring-4 ring-white ring-offset-2 scale-x-110' : ''
                                }`}
                                style={{
                                  height: `${barH}%`,
                                  minHeight: w.score !== null ? '12px' : '4px',
                                  animationDelay: `${i * 0.12}s`,
                                  boxShadow: w.score !== null ? '0 0 20px rgba(139, 92, 246, 0.15)' : 'none',
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom labels row */}
                      <div className="flex gap-4 px-2 mt-3">
                        {m.weeks.map((w) => {
                          const isBest = bestWeek && w.week === bestWeek.week && w.year === bestWeek.year;
                          const isSelected = selectedBar?.week === w.week && selectedBar?.year === w.year;
                          return (
                            <div key={`bot_${w.week}_${w.year}`} className="flex-1 flex flex-col items-center">
                              <div
                                onClick={() => w.score !== null && setSelectedBar(isSelected ? null : { week: w.week, year: w.year })}
                                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                                  isSelected ? 'bg-indigo-600 text-white scale-110 shadow-md'
                                  : isBest ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                W{w.week}
                              </div>
                              <span className="text-[11px] text-gray-400 mt-1">
                                {w.value !== null ? `${w.value}${m.unit}` : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Week Detail Table */}
                      {selectedBar && (() => {
                        const columns = getMetricColumns(m.metric_code);
                        const selWeek = m.weeks.find(w => w.week === selectedBar.week && w.year === selectedBar.year);
                        return (
                          <div className="mt-5 animate-slideDown">
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                              <div className={`bg-gradient-to-r ${gradient} px-5 py-3 flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                  <span className="text-white font-bold text-sm">
                                    📋 Week {selectedBar.week} • {m.metric_code} • Case Level Data
                                  </span>
                                  {selWeek?.score !== null && (
                                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                      Score: {selWeek?.score}%
                                    </span>
                                  )}
                                </div>
                                <button onClick={() => setSelectedBar(null)} className="text-white/70 hover:text-white text-sm">✕</button>
                              </div>

                              {columns === null ? (
                                <div className="p-12 text-center">
                                  <div className="text-5xl mb-3">🚧</div>
                                  <div className="text-lg font-bold text-gray-700 mb-1">Coming Soon</div>
                                  <div className="text-sm text-gray-400">Detailed case-level data for {m.metric_code} will be available soon.</div>
                                </div>
                              ) : columns.length === 0 ? (
                                <div className="p-12 text-center">
                                  <div className="text-5xl mb-3">📊</div>
                                  <div className="text-lg font-bold text-gray-700 mb-1">No Detail View</div>
                                  <div className="text-sm text-gray-400">Case-level breakdown is not configured for this metric yet.</div>
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-200">
                                        {columns.map(col => (
                                          <th key={col.key} className="px-3 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            {col.label}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(() => {
                                        const selWeekData = m.weeks.find(w => w.week === selectedBar.week && w.year === selectedBar.year);
                                        const rawData = selWeekData?.raw_data;
                                        if (rawData && Object.keys(rawData).length > 0) {
                                          return (
                                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                                              {columns.map(col => {
                                                const val = rawData[col.key];
                                                const display = val !== undefined && val !== null ? String(val) : '-';
                                                const isPercent = col.key.includes('pct') || col.key.includes('rate');
                                                const numVal = parseFloat(display);
                                                const isBad = isPercent && !isNaN(numVal) && numVal > 2;
                                                const isWarn = isPercent && !isNaN(numVal) && numVal > 0 && numVal <= 2;
                                                return (
                                                  <td key={col.key} className={`px-3 py-3 whitespace-nowrap ${
                                                    isBad ? 'text-red-600 font-bold' : isWarn ? 'text-yellow-600 font-medium' : ''
                                                  }`}>
                                                    {display}{isPercent && display !== '-' ? '%' : ''}
                                                  </td>
                                                );
                                              })}
                                            </tr>
                                          );
                                        }
                                        return (
                                          <tr>
                                            <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                                              <div className="text-3xl mb-2">📂</div>
                                              <div className="text-sm font-medium">No case data available for Week {selectedBar.week}</div>
                                              <div className="text-xs text-gray-300 mt-1">Data will populate here once uploaded</div>
                                            </td>
                                          </tr>
                                        );
                                      })()}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Summary footer */}
                      <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 border-t border-gray-100 pt-4 mt-4">
                        {bestWeek && (
                          <span className="flex items-center gap-1">👑 Best: <span className="font-bold text-yellow-600">W{bestWeek.week} ({bestWeek.score}%)</span></span>
                        )}
                        <span className="flex items-center gap-1">📊 Status: <span className="font-bold text-gray-800">{getStatusLabel(m.current_score)}</span></span>
                        {m.goal_value !== null && (
                          <span className="flex items-center gap-1">🎯 Goal: <span className="font-bold text-purple-600">{m.goal_value}{m.unit}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-12px); }
          to   { opacity: 1; max-height: 800px; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes scorePulse {
          0% { opacity: 0; transform: scale(0.8); }
          60% { opacity: 1; transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .animate-scorePulse { animation: scorePulse 0.8s ease-out forwards; }
        @keyframes barGrow {
          from { height: 0%; opacity: 0; }
          to   { opacity: 1; }
        }
        .bar-grow {
          animation: barGrow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom;
        }

      `}</style>
    </div>
  );
}
