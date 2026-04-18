import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import MemberNotificationTiles from '../components/MemberNotificationTiles';
import OnlineTeamTile from '../components/OnlineTeamTile';
import { getInternalTitle } from '../utils/roleMapping';
import './ManagerDashboardV2.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function TeamBarChart({ members, myLoginId, ottoMembers = [] }: { members: any[]; myLoginId?: string; ottoMembers?: any[] }) {
  const [animated, setAnimated] = useState(false);
  const onLeaveLogins = new Set(ottoMembers.map((m: any) => m.login).filter(Boolean));
  const sorted = [...members].sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0));

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  if (!sorted.length) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8">
      <p className="text-sm font-medium text-gray-400">No performance data available</p>
      <p className="text-xs text-gray-300 mt-1">Data will appear here once metrics are published</p>
    </div>
  );

  const MAX_BAR = 250;
  const maxScore = Math.max(...sorted.map(m => m.avg_score || 0), 1);
  const barColor = (s: number) => s >= 90 ? '#22c55e' : s >= 80 ? '#a855f7' : s >= 70 ? '#f59e0b' : '#ef4444';
  const ini = (n: string) => n?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-gray-700">📊 Team Performance</h3>
        <span className="text-[10px] text-gray-400">{sorted.length} members</span>
      </div>
      <div className="overflow-x-auto flex-1 px-4 pb-3 pt-4 bar-chart-scroll">
        <div className="flex items-end gap-3" style={{ minWidth: sorted.length * 68 }}>
          {sorted.map((m, i) => {
            const score = m.avg_score || 0;
            const barH = Math.max((score / maxScore) * MAX_BAR, 18);
            const isMe = m.login_id === myLoginId;
            const isOnLeave = onLeaveLogins.has(m.login_id);
            const photoUrl = m.photo_url ? (m.photo_url.startsWith('http') ? m.photo_url : `${API_BASE}${m.photo_url}`) : null;
            return (
              <div key={m.member_id} className="flex flex-col items-center" style={{ width: 56 }}>
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full border-2 overflow-hidden bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0 mb-1 ${isMe ? 'ring-2 ring-indigo-400 ring-offset-1' : ''} ${isOnLeave ? 'opacity-50 grayscale' : ''}`}
                    style={{ borderColor: barColor(score) }}>
                    {photoUrl
                      ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                      : ini(m.member_name)}
                  </div>
                  {isOnLeave && <span className="absolute -top-1 -right-1 text-[10px]" title="On leave today">🏖️</span>}
                </div>
                <div className={`w-10 rounded-t-lg transition-all duration-700 ease-out ${isOnLeave ? 'opacity-40' : ''}`}
                  style={{
                    height: animated ? barH : 0,
                    background: isOnLeave
                      ? 'linear-gradient(to top, #9ca3af, #d1d5db)'
                      : `linear-gradient(to top, ${barColor(score)}, ${barColor(score)}aa)`,
                    transitionDelay: `${i * 60}ms`,
                    boxShadow: animated && !isOnLeave ? `0 0 10px ${barColor(score)}40` : 'none',
                  }} />
                <p className="text-[10px] font-bold mt-1" style={{ color: isOnLeave ? '#9ca3af' : barColor(score) }}>{Math.round(score)}%</p>
                <p className={`text-[9px] text-center leading-tight mt-0.5 w-14 truncate ${isMe ? 'font-bold text-indigo-600' : isOnLeave ? 'text-gray-400 italic' : 'text-gray-500'}`} title={`${m.member_name}${isOnLeave ? ' (On Leave)' : ''}`}>
                  {isMe ? '⭐ You' : m.member_name?.split(' ')[0]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
];

function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function MemberDashboardV2() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myMetrics, setMyMetrics] = useState<any[]>([]);
  const [expandedTileData, setExpandedTileData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
    loadMyMetrics();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadMyMetrics = async () => {
    try {
      const res = await api.get('/api/performance-analytics/simple-view');
      setMyMetrics(res.data.members || []);
    } catch {}
  };

  const loadDashboard = async () => {
    try {
      const res = await api.get('/api/dashboard/v2/member');
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const initials = (n: string) => n?.split(' ').filter((w: string) => w).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#eef1f8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-indigo-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#eef1f8' }}>
        <p className="text-red-500 font-semibold">Failed to load dashboard</p>
      </div>
    );
  }

  // Find my metrics
  const me = myMetrics.find((m: any) => m.login_id === data?.user?.login);
  const metricEntries = me ? Object.entries(me.metrics || {}) as [string, any][] : [];

  const TILE_STYLES = [
    { bg: 'linear-gradient(135deg, #6366f1, #818cf8)', shadow: 'rgba(99,102,241,0.3)' },
    { bg: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', shadow: 'rgba(139,92,246,0.3)' },
    { bg: 'linear-gradient(135deg, #ec4899, #f472b6)', shadow: 'rgba(236,72,153,0.3)' },
    { bg: 'linear-gradient(135deg, #06b6d4, #22d3ee)', shadow: 'rgba(6,182,212,0.3)' },
    { bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', shadow: 'rgba(245,158,11,0.3)' },
    { bg: 'linear-gradient(135deg, #10b981, #34d399)', shadow: 'rgba(16,185,129,0.3)' },
  ];
  const scoreColor = (s: number) => s >= 90 ? '#4ade80' : s >= 80 ? '#facc15' : s >= 70 ? '#fb923c' : '#ef4444';

  return (
    <div className="min-h-screen" style={{ background: '#eef1f8' }}>
    <div className="flex mx-auto" style={{ maxWidth: 1400 }}>
      {/* Main Content */}
      <div className="flex-1 min-w-0 p-6">

      {/* Top Greeting Panel */}
      <div className="relative overflow-visible mb-4 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)' }}>
        <div className="px-6 py-4 relative z-10 flex items-center">
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-white leading-tight">{getGreeting()}, {data.user.name?.split(' ')[0]} 👋</h1>
            <p className="text-indigo-200 text-xs mt-1 animate-fadeInUp max-w-md truncate">
              💡 <em>"{getDailyQuote()}"</em>
            </p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {data.perf_my_score !== null && data.perf_my_score !== undefined && (() => {
                const C = 2 * Math.PI * 16;
                const pct = data.perf_my_score / 100;
                const color = pct >= 0.8 ? '#4ade80' : pct >= 0.6 ? '#facc15' : '#ef4444';
                return (
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                  <div className="circular-gauge-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4"
                        strokeLinecap="round" strokeDasharray={`${pct * C} ${C}`}
                        transform="rotate(-90 20 20)" className="gauge-arc" />
                      <text x="20" y="24" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{data.perf_my_score}</text>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">My Score</p>
                    <p className="text-indigo-300 text-[10px]">{data.perf_week_label}</p>
                  </div>
                </div>
                );
              })()}
              {data.team_strength && (() => {
                const C = 2 * Math.PI * 16;
                const pct = data.team_strength.present / data.team_strength.total_members;
                const color = pct >= 0.8 ? '#4ade80' : pct >= 0.6 ? '#facc15' : '#ef4444';
                return (
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                  <div className={`circular-gauge-wrapper${pct === 1 ? ' strength-full-glow' : ''}`}>
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4"
                        strokeLinecap="round" strokeDasharray={`${pct * C} ${C}`}
                        transform="rotate(-90 20 20)" className="gauge-arc" />
                      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{data.team_strength.present}</text>
                      <text x="20" y="31" textAnchor="middle" fill="#c7d2fe" fontSize="7">/{data.team_strength.total_members}</text>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">Present Today</p>
                    <p className="text-indigo-300 text-[10px]">{data.team_strength.on_leave || 0} on leave</p>
                  </div>
                </div>
                );
              })()}
            </div>
          </div>
          <div className="shrink-0 ml-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl border-3 border-white/25 shadow-xl overflow-hidden bg-white/10 ring-2 ring-white/10">
              {data.user.profile_picture
                ? <img src={`${API_BASE}${data.user.profile_picture}`} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-white/10">{initials(data.user.name)}</div>}
            </div>
            {(data.user.team || data.user.role) && (
              <div className="mt-2 text-center">
                {data.user.team && <p className="text-white text-xs font-semibold">{data.user.team}</p>}
                <p className="text-white text-[11px] font-medium capitalize mt-0.5">{getInternalTitle(data.user.role, data.user.team)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Overview — My Metric Tiles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Performance Overview</p>
          <Link to="/my-performance"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-semibold shadow-md hover:shadow-lg">
            🎯 View Full Performance Analytics
          </Link>
        </div>
        {metricEntries.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {metricEntries.slice(0, 4).map(([code, m], i) => {
              const style = TILE_STYLES[i % TILE_STYLES.length];
              const score = (m as any).score ?? 0;
              const C = 2 * Math.PI * 20;
              const pct = Math.min(score, 100) / 100;
              return (
                <div key={code}
                  className="rounded-xl p-4 text-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  style={{ background: style.bg, boxShadow: `0 4px 15px ${style.shadow}` }}
                  onClick={() => navigate('/my-performance')}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{code}</p>
                      <p className="text-2xl font-extrabold mt-1">{(m as any).value != null ? (m as any).value : '—'}</p>
                      {(m as any).trend != null && (m as any).trend !== 0 && (
                        <p className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${(m as any).trend > 0 ? 'text-green-200' : 'text-red-200'}`}>
                          {(m as any).trend > 0 ? '▲' : '▼'} {Math.abs((m as any).trend).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                        <circle cx="24" cy="24" r="20" fill="none" stroke={scoreColor(score)} strokeWidth="4"
                          strokeLinecap="round" strokeDasharray={`${pct * C} ${C}`}
                          transform="rotate(-90 24 24)" className="gauge-arc" />
                        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{Math.round(score)}%</text>
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400 text-sm">
            📊 No metric data available yet
          </div>
        )}
      </div>

      {/* ── Detail Viewer / Team Bar Chart ── */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: 420 }}>
          {expandedTileData ? (
            <div className="h-full flex flex-col animate-middleRollUp">
              <div className={`bg-gradient-to-r ${expandedTileData.gradient} px-5 py-3 flex items-center justify-between shrink-0`}>
                <h3 className="text-white font-bold text-sm">{expandedTileData.emoji} {expandedTileData.title} — {expandedTileData.count} Updates</h3>
                <button onClick={() => setExpandedTileData(null)} className="text-white/80 hover:text-white text-lg transition">✕</button>
              </div>
              {expandedTileData.items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No updates</div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {expandedTileData.items.map((item: any, i: number) => (
                    <div key={i} className="px-5 py-3 hover:bg-indigo-50/50 transition-colors cursor-pointer flex items-start gap-3 animate-middleRow"
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => item.nav && navigate(item.nav)}>
                      {item.member_name ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center font-bold text-purple-700 shrink-0 border border-purple-200 text-[9px]">
                          {item.member_photo ? <img src={`${API_BASE}${item.member_photo}`} alt="" className="w-full h-full object-cover" /> : item.member_name.split(' ').filter((w: string) => w).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      ) : (
                        <span className="text-base mt-0.5">{item.type === 'upload' ? '📄' : item.type === 'published' ? '📈' : item.type === 'created' ? '📊' : item.type === 'closed' ? '✅' : '🔔'}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 font-medium" dangerouslySetInnerHTML={{ __html: item.text }} />
                        {item.time && <p className="text-xs text-gray-400 mt-0.5">{new Date(item.time).toLocaleString()}</p>}
                      </div>
                      <span className="text-gray-300 text-sm">›</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <TeamBarChart members={myMetrics} myLoginId={data?.user?.login} ottoMembers={data?.otto_members || []} />
            </div>
          )}
        </div>
      </div>

      </div>{/* end main content */}

      {/* Right Sidebar */}
      <div className="w-[300px] shrink-0 p-4" style={{ minWidth: 300, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <OnlineTeamTile />
        <MemberNotificationTiles mode="sidebar" onTileExpand={(tile: any) => setExpandedTileData(tile)} />
      </div>
    </div>
    </div>
  );
}
