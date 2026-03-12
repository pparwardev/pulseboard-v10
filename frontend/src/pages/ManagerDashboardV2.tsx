import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import ShiftWeekOff from '../components/ShiftWeekOff';
import MemberNotificationTiles from '../components/MemberNotificationTiles';
import { getInternalTitle } from '../utils/roleMapping';
import './ManagerDashboardV2.css';

const QUOTES = [
  "Leadership is not about being in charge. It's about taking care of those in your charge.",
  "The strength of the team is each individual member. The strength of each member is the team.",
  "Great things in business are never done by one person. They're done by a team of people.",
  "Success is best when it's shared with your team.",
  "The way a team plays as a whole determines its success.",
  "Coming together is a beginning, staying together is progress, and working together is success.",
  "Talent wins games, but teamwork and intelligence win championships.",
  "Alone we can do so little; together we can do so much.",
  "If everyone is moving forward together, then success takes care of itself.",
  "A leader takes people where they want to go. A great leader takes people where they don't necessarily want to go, but ought to be.",
];

function getDailyQuote() { const day = Math.floor(Date.now() / 86400000); return QUOTES[day % QUOTES.length]; }
function getGreeting() { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; }
const initials = (n: string) => n?.split(' ').filter(w => w).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

function TeamBarChart({ perfTiles, ottoMembers = [] }: { perfTiles: any[]; ottoMembers?: any[] }) {
  const [animated, setAnimated] = useState(false);
  const onLeaveLogins = new Set(ottoMembers.map((m: any) => m.tm_employee_id).filter(Boolean));
  const allMembers = useMemo(() => {
    const members: any[] = [];
    perfTiles.forEach(t => t.members.forEach((m: any) => { if (!members.find(x => x.id === m.id)) members.push(m); }));
    return members.sort((a, b) => b.overall_score - a.overall_score);
  }, [perfTiles]);

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  if (!allMembers.length) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8" style={{ minHeight: 400 }}>
      <p className="text-sm font-medium text-gray-400">No performance data available</p>
      <p className="text-xs text-gray-300 mt-1">Upload metrics to see the team bar chart</p>
    </div>
  );

  const MAX_BAR = 250;
  const maxScore = Math.max(...allMembers.map(m => m.overall_score), 1);
  const barColor = (s: number) => s >= 90 ? '#22c55e' : s >= 80 ? '#a855f7' : s >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col" style={{ minHeight: 400 }}>
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-gray-700">📊 Team Performance</h3>
        <span className="text-[10px] text-gray-400">{allMembers.length} members</span>
      </div>
      <div className="overflow-x-auto px-4 pb-3 pt-4 bar-chart-scroll">
        <div className="flex items-end gap-3" style={{ minWidth: allMembers.length * 68 }}>
          {allMembers.map((m, i) => {
            const barH = Math.max((m.overall_score / maxScore) * MAX_BAR, 18);
            const isOnLeave = onLeaveLogins.has(m.login);
            return (
              <div key={m.id} className="flex flex-col items-center" style={{ width: 56 }}>
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full border-2 overflow-hidden bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0 mb-1 ${isOnLeave ? 'opacity-50 grayscale' : ''}`}
                    style={{ borderColor: barColor(m.overall_score) }}>
                    {m.profile_picture
                      ? <img src={`http://localhost:8001${m.profile_picture}`} alt="" className="w-full h-full object-cover" />
                      : initials(m.name)}
                  </div>
                  {isOnLeave && <span className="absolute -top-1 -right-1 text-[10px]" title="On leave today">🏖️</span>}
                </div>
                <div className={`w-10 rounded-t-lg transition-all duration-700 ease-out ${isOnLeave ? 'opacity-40' : ''}`}
                  style={{
                    height: animated ? barH : 0,
                    background: isOnLeave
                      ? 'linear-gradient(to top, #9ca3af, #d1d5db)'
                      : `linear-gradient(to top, ${barColor(m.overall_score)}, ${barColor(m.overall_score)}aa)`,
                    transitionDelay: `${i * 60}ms`,
                    boxShadow: animated && !isOnLeave ? `0 0 10px ${barColor(m.overall_score)}40` : 'none',
                  }} />
                <p className="text-[10px] font-bold mt-1" style={{ color: isOnLeave ? '#9ca3af' : barColor(m.overall_score) }}>{m.overall_score}%</p>
                <p className={`text-[9px] text-center leading-tight mt-0.5 w-14 truncate ${isOnLeave ? 'text-gray-400 italic' : 'text-gray-500'}`} title={`${m.name}${isOnLeave ? ' (On Leave)' : ''}`}>
                  {m.name.split(' ')[0]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboardV2() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [perfTiles, setPerfTiles] = useState<any[]>([]);
  const [perfMetrics, setPerfMetrics] = useState<any[]>([]);
  const [expandedPerfTile, setExpandedPerfTile] = useState<number | null>(null);
  const [teamScore, setTeamScore] = useState<number | null>(null);
  const [weekLabel, setWeekLabel] = useState('');
  const [ottoMembers, setOttoMembers] = useState<any[]>([]);
  const [expandedTileData, setExpandedTileData] = useState<any>(null);

  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => { loadData(); loadPerfTiles(); loadOttoMembers(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, profileRes] = await Promise.all([api.get('/api/admin/users'), api.get('/api/profile')]);
      setMembers(usersRes.data.filter((u: any) => u.role === 'specialist'));
      setProfileData(profileRes.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const loadPerfTiles = async () => {
    try {
      const res = await api.get('/api/performance-analytics/dashboard');
      const d = res.data;
      if (!d.has_data) return;
      setTeamScore(d.overall_team_score);
      setWeekLabel(`Week ${d.current_week}`);
      setPerfMetrics((d.metric_cards || []).map((mc: any) => ({ code: mc.metric_code, name: mc.metric_name })));
      const members = (d.leaderboard || []).map((m: any) => ({
        id: m.member_id, name: m.name, profile_picture: m.photo_url,
        overall_score: Math.round(m.score), login: m.employee_id || '', scores: m.metrics || {}
      }));
      setPerfTiles([
        { title: 'Excellent', emoji: '🌟', range: '≥ 90%', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)', border: '#fda4af', color: '#ec4899', members: members.filter((x: any) => x.overall_score >= 90) },
        { title: 'Strong', emoji: '💪', range: '80–89%', bg: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: '#c4b5fd', color: '#8b5cf6', members: members.filter((x: any) => x.overall_score >= 80 && x.overall_score < 90) },
        { title: 'Need Attention', emoji: '⚠️', range: '< 80%', bg: 'linear-gradient(135deg, #0ea5e9, #14b8a6)', border: '#67e8f9', color: '#06b6d4', members: members.filter((x: any) => x.overall_score < 80) },
      ]);
    } catch {}
  };

  const loadOttoMembers = async () => {
    try {
      const res = await api.get('/api/dashboard/v2/member');
      setOttoMembers(res.data.otto_members || []);
    } catch {}
  };



  const activeMembers = members.filter(m => m.is_active && m.is_approved);
  const profilePicUrl = profileData?.profilePhoto?.url ? `http://localhost:8001${profileData.profilePhoto.url}` : null;

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: '#eef1f8' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#eef1f8' }}>
    <div className="flex mx-auto" style={{ maxWidth: 1400 }}>
      <div className="flex-1 min-w-0 p-6">

        {/* Greeting Panel */}
        <div className="relative overflow-visible mb-6 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)' }}>
          <div className="px-6 py-5 relative z-10 flex items-center">
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-white leading-tight">{getGreeting()}, {user.name?.split(' ')[0]} 👋</h1>
              <p className="text-indigo-200 text-xs mt-1 animate-fadeInUp max-w-md truncate">💡 <em>"{getDailyQuote()}"</em></p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {/* Team Score Gauge */}
                {teamScore !== null && (() => {
                  const C = 2 * Math.PI * 16;
                  const pct = teamScore / 100;
                  const color = pct >= 0.8 ? '#4ade80' : pct >= 0.6 ? '#facc15' : '#ef4444';
                  return (
                    <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                      <div className="circular-gauge-wrapper">
                        <svg width="40" height="40" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                          <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${pct * C} ${C}`} transform="rotate(-90 20 20)" className="gauge-arc" />
                          <text x="20" y="24" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{teamScore}</text>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">Team Score</p>
                        <p className="text-indigo-300 text-[10px]">{weekLabel}</p>
                      </div>
                    </div>
                  );
                })()}
                {/* Team Strength Gauge */}
                {activeMembers.length > 0 && (() => {
                  const C = 2 * Math.PI * 16;
                  const presentCount = Math.max(0, activeMembers.length - ottoMembers.length);
                  const pct = presentCount / activeMembers.length;
                  const color = pct >= 0.8 ? '#4ade80' : pct >= 0.6 ? '#facc15' : '#ef4444';
                  return (
                    <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                      <div className={`circular-gauge-wrapper${pct === 1 ? ' strength-full-glow' : ''}`}>
                        <svg width="40" height="40" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                          <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${pct * C} ${C}`} transform="rotate(-90 20 20)" className="gauge-arc" />
                          <text x="20" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{presentCount}</text>
                          <text x="20" y="31" textAnchor="middle" fill="#c7d2fe" fontSize="7">/{activeMembers.length}</text>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">Present Today</p>
                        <p className="text-indigo-300 text-[10px]">{ottoMembers.length || 0} on leave</p>
                      </div>
                    </div>
                  );
                })()}
                <ShiftWeekOff initialShiftStart={profileData?.shiftStart} initialShiftEnd={profileData?.shiftEnd} initialWeekOff={profileData?.weekOff} theme="light" />
              </div>
            </div>
            <div className="shrink-0 ml-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl border-3 border-white/25 shadow-xl overflow-hidden bg-white/10 ring-2 ring-white/10">
                {profilePicUrl
                  ? <img src={profilePicUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-white/10">{initials(user.name)}</div>}
              </div>
              <div className="mt-2 text-center">
                {user.team_name && <p className="text-white text-xs font-semibold">{user.team_name}</p>}
                <p className="text-indigo-300 text-[10px] capitalize mt-0.5">{getInternalTitle(user.role, user.team_name)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Tiles */}
        {perfTiles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Performance Overview</p>
              <Link to="/performance" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-semibold shadow-md hover:shadow-lg">
                🎯 Performance Analytics
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {perfTiles.map((tile: any, idx: number) => {
                const isOpen = expandedPerfTile === idx;
                return (
                  <div key={idx} className={`subtle-tile rounded-xl p-5 text-white cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 ${isOpen ? 'ring-2 ring-white/40 scale-[1.02]' : ''}`}
                    style={{ background: tile.bg }} onClick={() => setExpandedPerfTile(isOpen ? null : idx)}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">{tile.emoji} {tile.title}</h3>
                        <p className="text-xs opacity-80">{tile.members.length} members · {tile.range}</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-3">
                      <div className="flex -space-x-2">
                        {tile.members.slice(0, 6).map((m: any) => (
                          <div key={m.id} className="w-9 h-9 rounded-full border-2 border-white/80 overflow-hidden bg-white/25 flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-125 hover:z-10 relative"
                            title={`${m.name} — ${m.overall_score}%`}>
                            {m.profile_picture ? <img src={`http://localhost:8001${m.profile_picture}`} alt="" className="w-full h-full object-cover" /> : initials(m.name)}
                          </div>
                        ))}
                        {tile.members.length > 6 && <div className="w-9 h-9 rounded-full border-2 border-white/80 bg-white/30 flex items-center justify-center text-[10px] font-bold">+{tile.members.length - 6}</div>}
                      </div>
                      <div className={`ml-auto w-9 h-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center text-xl font-bold transition-all duration-300 hover:bg-white/40 hover:scale-110 ${isOpen ? 'rotate-45' : ''}`}>+</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expanded detail */}
            {expandedPerfTile !== null && perfTiles[expandedPerfTile] && (() => {
              const tile = perfTiles[expandedPerfTile];
              const sorted = [...tile.members].sort((a: any, b: any) => b.overall_score - a.overall_score);
              return (
                <div className="mt-4 animate-middleRollUp">
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden" style={{ borderColor: tile.border, borderWidth: 2 }}>
                    <div className="px-5 py-3 flex items-center justify-between" style={{ background: tile.bg }}>
                      <h3 className="font-bold text-sm text-white">{tile.emoji} {tile.title} — {tile.members.length} Members</h3>
                      <button onClick={(e) => { e.stopPropagation(); setExpandedPerfTile(null); }} className="w-6 h-6 rounded-full flex items-center justify-center text-sm text-white hover:opacity-70">✕</button>
                    </div>
                    {sorted.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No members in this category</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                              <th className="px-4 py-3 text-left">#</th>
                              <th className="px-4 py-3 text-left">Member</th>
                              <th className="px-4 py-3 text-left">Login</th>
                              {perfMetrics.map((mt: any) => <th key={mt.code} className="px-4 py-3 text-center">{mt.name}</th>)}
                              <th className="px-4 py-3 text-center">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorted.map((m: any, i: number) => (
                              <tr key={m.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors animate-middleRow" style={{ animationDelay: `${i * 30}ms` }}>
                                <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: tile.bg, color: '#fff' }}>
                                      {m.profile_picture ? <img src={`http://localhost:8001${m.profile_picture}`} alt="" className="w-full h-full object-cover" /> : initials(m.name)}
                                    </div>
                                    <span className="font-medium text-gray-800 text-xs whitespace-nowrap">{m.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-gray-400 font-mono text-[10px]">{m.login}</td>
                                {perfMetrics.map((mt: any) => (
                                  <td key={mt.code} className="px-4 py-2.5 text-center">
                                    <span className={`text-xs font-semibold ${(m.scores[mt.code] ?? 0) >= 90 ? 'text-green-600' : (m.scores[mt.code] ?? 0) >= 80 ? 'text-yellow-600' : 'text-red-500'}`}>
                                      {m.scores[mt.code] != null ? `${m.scores[mt.code]}%` : '—'}
                                    </span>
                                  </td>
                                ))}
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.overall_score >= 90 ? 'bg-green-100 text-green-700' : m.overall_score >= 80 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{m.overall_score}%</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Team Bar Chart / Notification Detail */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6" style={{ minHeight: 400 }}>
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
                          {item.member_photo ? <img src={`http://localhost:8001${item.member_photo}`} alt="" className="w-full h-full object-cover" /> : initials(item.member_name)}
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
            <TeamBarChart perfTiles={perfTiles} ottoMembers={ottoMembers} />
          )}
        </div>

        {/* Team Members Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">👥 Team Members</h3>
            <button onClick={() => navigate('/members')} className="text-xs text-indigo-600 font-semibold hover:underline">View All →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
            {activeMembers.slice(0, 8).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition cursor-pointer" onClick={() => navigate(`/profile/${m.id}`)}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                  {m.profile_picture ? <img src={`http://localhost:8001${m.profile_picture}`} alt="" className="w-full h-full object-cover" /> : initials(m.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                  <p className="text-[10px] text-gray-400">{m.email}</p>
                </div>
              </div>
            ))}
            {activeMembers.length > 8 && (
              <div className="flex items-center justify-center p-3 rounded-xl bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition" onClick={() => navigate('/members')}>
                <p className="text-sm font-semibold text-indigo-600">+{activeMembers.length - 8} more</p>
              </div>
            )}
          </div>
        </div>

      </div>{/* end main content */}

      {/* Right Sidebar — Notifications */}
      <div className="w-[300px] shrink-0 p-4 overflow-y-auto sidebar-scroll" style={{ height: '100vh', position: 'sticky', top: 0, minWidth: 300 }}>
        <MemberNotificationTiles mode="sidebar" onTileExpand={(tile: any) => setExpandedTileData(tile)} />
      </div>
    </div>
    </div>
  );
}
