import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Award, Users, Target, Calendar, Filter, Crown, Trophy, Camera } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface MemberData {
  member_id: number;
  member_name: string;
  login_id: string;
  photo_url?: string;
  metrics: Record<string, { value: number; score: number; trend: number | null }>;
  avg_score: number;
  prev_score: number;
  trend: number;
  category: string;
}

function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toFixed(1)}%</span>;
}

export default function PerformanceAnalyticsPage() {
  const [data, setData] = useState<MemberData[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<any[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [teamName, setTeamName] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('');
  const [managerPhotoUrl, setManagerPhotoUrl] = useState<string | null>(null);
  const [managerLogin, setManagerLogin] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    setShared(false);
    fetchData();
  }, [selectedWeek]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = selectedWeek ? `?week=${selectedWeek}` : '';
      const response = await api.get(`/api/performance-analytics/simple-view${params}`);
      setData(response.data.members || []);
      setTeamMetrics(response.data.team_metrics || []);
      setAvailableWeeks(response.data.available_weeks || []);
      setCurrentYear(response.data.current_year || new Date().getFullYear());
      if (!selectedWeek) setSelectedWeek(response.data.current_week);
      setTeamName(response.data.team_name || '');
      setManagerName(response.data.manager_name || '');
      setManagerPhotoUrl(response.data.manager_photo_url || null);
      setManagerLogin(response.data.manager_login || '');
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = filterCategory === 'All' 
    ? data 
    : data.filter(m => m.category === filterCategory);

  const topThree = data.slice(0, 3);
  const champion = data[0];
  const categoryCount = {
    Excellent: data.filter(m => m.avg_score >= 90).length,
    Strong: data.filter(m => m.avg_score >= 80 && m.avg_score < 90).length,
    'Need Attention': data.filter(m => m.avg_score < 80).length
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-[1400px] mx-auto space-y-4">
        
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Performance Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">Week {selectedWeek}, {currentYear}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:outline-none bg-white"
            >
              <option value="All">All Members</option>
              <option value="Excellent">Excellent</option>
              <option value="Strong">Strong</option>
              <option value="Need Attention">Need Attention</option>
            </select>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:outline-none bg-white"
            >
              {availableWeeks.map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${teamMetrics.length + 3}, minmax(0, 1fr))` }}>
          {teamMetrics.map((metric) => (
            <div
              key={metric.metric_code}
              onClick={() => navigate(`/published-metric/${metric.metric_code}`)}
              className="bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-105 hover:ring-2 hover:ring-indigo-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600 transition-colors">{metric.metric_code}</span>
                <Target className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{metric.avg_score.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-1 group-hover:text-indigo-400">Team Avg · Click to view ↗</div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all group-hover:bg-indigo-600" style={{ width: `${Math.min(metric.avg_score, 100)}%` }}></div>
              </div>
            </div>
          ))}

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-4 text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">Excellent</div>
            <div className="text-3xl font-bold">{categoryCount.Excellent}</div>
            <div className="text-xs opacity-80 mt-1">≥90%</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-4 text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">Strong</div>
            <div className="text-3xl font-bold">{categoryCount.Strong}</div>
            <div className="text-xs opacity-80 mt-1">80-89%</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-4 text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">Need Attention</div>
            <div className="text-3xl font-bold">{categoryCount['Need Attention']}</div>
            <div className="text-xs opacity-80 mt-1">&lt;80%</div>
          </div>
        </div>

        {/* Top Performers Section */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Team Score Card - Champion style */}
          <div className="col-span-4 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-xl shadow-xl p-6 text-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Weekly {teamName} Team Score
            </h2>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold mb-4 border-4 border-white shadow-2xl overflow-hidden">
                  <img src={managerPhotoUrl || `/team-photos/${managerLogin}.jpeg`} alt="Team Manager" className="w-full h-full rounded-full object-cover" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-4xl font-bold">${managerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>`;
                  }} />
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-400 rounded-full p-2 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{managerName}</div>
                <div className="text-sm opacity-90 mb-3">Team Manager</div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-3">
                  <div className="text-5xl font-bold mb-2">
                    {teamMetrics.length > 0 ? (
                      <AnimatedScore value={teamMetrics.reduce((sum, m) => sum + m.avg_score, 0) / teamMetrics.length} />
                    ) : '0.0%'}
                  </div>
                  <div className="text-sm opacity-90">Overall Team Average</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {teamMetrics.map(metric => (
                    <div key={metric.metric_code} className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                      <div className="font-semibold">{metric.metric_code}</div>
                      <div className="text-lg font-bold">{metric.avg_score.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top 3 Performers
              </h2>
              <button
                onClick={async () => {
                  setSharing(true);
                  try {
                    // Draw podium image using Canvas API
                    const W = 800, H = 500;
                    const canvas = document.createElement('canvas');
                    canvas.width = W; canvas.height = H;
                    const ctx = canvas.getContext('2d')!;

                    // Background gradient
                    const bg = ctx.createLinearGradient(0, 0, W, H);
                    bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(1, '#312e81');
                    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

                    // Title
                    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(`\ud83c\udfc6 Top 3 Performers \u2014 Week ${selectedWeek}`, W / 2, 45);

                    // Podium positions: [1st center, 2nd left, 3rd right]
                    const positions = [
                      { x: W / 2, barH: 200, color: '#eab308', medal: '\ud83e\udd47', idx: 0 },
                      { x: W / 2 - 220, barH: 150, color: '#9ca3af', medal: '\ud83e\udd48', idx: 1 },
                      { x: W / 2 + 220, barH: 110, color: '#f97316', medal: '\ud83e\udd49', idx: 2 },
                    ];

                    const barW = 160;
                    const baseY = H - 40;

                    for (const pos of positions) {
                      const member = topThree[pos.idx];
                      if (!member) continue;

                      const barTop = baseY - pos.barH;

                      // Podium bar
                      const grad = ctx.createLinearGradient(pos.x - barW/2, barTop, pos.x + barW/2, baseY);
                      grad.addColorStop(0, pos.color); grad.addColorStop(1, pos.color + '99');
                      ctx.fillStyle = grad;
                      ctx.beginPath();
                      ctx.roundRect(pos.x - barW/2, barTop, barW, pos.barH, [16, 16, 0, 0]);
                      ctx.fill();

                      // Avatar circle
                      const avatarY = barTop - 45;
                      ctx.beginPath(); ctx.arc(pos.x, avatarY, 35, 0, Math.PI * 2);
                      ctx.fillStyle = pos.color; ctx.fill();
                      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();

                      // Initials in avatar
                      const initials = member.member_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
                      ctx.fillText(initials, pos.x, avatarY + 7);

                      // Medal
                      ctx.font = '28px sans-serif';
                      ctx.fillText(pos.medal, pos.x, barTop - 80);

                      // Name on bar
                      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
                      ctx.fillText(member.member_name, pos.x, barTop + 30);

                      // Score
                      ctx.font = 'bold 32px sans-serif';
                      ctx.fillText(`${member.avg_score.toFixed(1)}%`, pos.x, barTop + 70);

                      // Trend
                      ctx.font = '13px sans-serif'; ctx.fillStyle = '#d1fae5';
                      const arrow = member.trend > 0 ? '\u25b2' : member.trend < 0 ? '\u25bc' : '\u2192';
                      ctx.fillText(`${arrow} ${Math.abs(member.trend).toFixed(1)}%`, pos.x, barTop + 95);
                    }

                    // Convert to blob & upload
                    const blob = await new Promise<Blob>((resolve) =>
                      canvas.toBlob((b) => resolve(b!), 'image/png')
                    );
                    const formData = new FormData();
                    formData.append('file', blob, 'podium.png');
                    const uploadRes = await api.post('/api/wall/upload-image', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    const names = topThree.map((m, i) => `${['\ud83e\udd47','\ud83e\udd48','\ud83e\udd49'][i]} ${m.member_name} (${m.avg_score.toFixed(1)}%)`).join('  ');
                    await api.post('/api/wall/posts', {
                      content: `\ud83c\udfc6 Top 3 Performers \u2014 Week ${selectedWeek}\n${names}`,
                      emoji: '\ud83c\udfc6',
                      post_type: 'top_performer',
                      image_url: uploadRes.data.image_url,
                    });
                    toast.success('Podium shared to Wall of Fame! \ud83c\udf89');
                    setShared(true);
                  } catch (err: any) {
                    console.error('Share failed:', err);
                    toast.error(err?.response?.data?.detail || err?.message || 'Failed to share');
                  } finally { setSharing(false); }
                }}
                disabled={sharing || shared}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  shared
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-red-500 text-white hover:shadow-lg disabled:opacity-50'
                }`}
              >
                {shared ? (
                  <><span>✅</span> Shared on Wall</>
                ) : sharing ? (
                  <><Camera className="w-3.5 h-3.5 animate-pulse" /> Sharing...</>
                ) : (
                  <><Camera className="w-3.5 h-3.5" /> Share to Wall</>
                )}
              </button>
            </div>
            
            <div className="flex items-end justify-center gap-4 mt-12">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/performance/${topThree[1].member_id}`)}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-2xl mb-2 border-4 border-white shadow-lg transition-all group-hover:scale-110 group-hover:shadow-2xl group-hover:ring-2 group-hover:ring-indigo-400">
                    {topThree[1].photo_url ? (
                      <img src={topThree[1].photo_url} alt={topThree[1].member_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(topThree[1].member_name)
                    )}
                  </div>
                  <div className="text-4xl mb-2">🥈</div>
                  <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-2xl w-32 h-40 flex flex-col items-center justify-start pt-4 shadow-xl transition-all group-hover:shadow-2xl group-hover:-translate-y-1">
                    <div className="text-white text-center px-2">
                      <div className="font-bold text-sm mb-1 group-hover:underline">{topThree[1].member_name}</div>
                      <div className="text-xs opacity-90 mb-2">{topThree[1].login_id}</div>
                      <div className="text-3xl font-bold mb-1">{topThree[1].avg_score.toFixed(1)}%</div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {topThree[1].trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(topThree[1].trend).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/performance/${topThree[0].member_id}`)}>
                  <Crown className="w-8 h-8 text-yellow-500 mb-1 animate-bounce" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-3xl mb-2 border-4 border-white shadow-2xl transition-all group-hover:scale-110 group-hover:shadow-2xl group-hover:ring-2 group-hover:ring-indigo-400">
                    {topThree[0].photo_url ? (
                      <img src={topThree[0].photo_url} alt={topThree[0].member_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(topThree[0].member_name)
                    )}
                  </div>
                  <div className="text-5xl mb-2">🥇</div>
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-t-2xl w-36 h-56 flex flex-col items-center justify-start pt-4 shadow-2xl transition-all group-hover:shadow-2xl group-hover:-translate-y-1">
                    <div className="text-white text-center px-2">
                      <div className="font-bold text-base mb-1 group-hover:underline">{topThree[0].member_name}</div>
                      <div className="text-xs opacity-90 mb-2">{topThree[0].login_id}</div>
                      <div className="text-4xl font-bold mb-1">{topThree[0].avg_score.toFixed(1)}%</div>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {topThree[0].trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(topThree[0].trend).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/performance/${topThree[2].member_id}`)}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-white font-bold text-2xl mb-2 border-4 border-white shadow-lg transition-all group-hover:scale-110 group-hover:shadow-2xl group-hover:ring-2 group-hover:ring-indigo-400">
                    {topThree[2].photo_url ? (
                      <img src={topThree[2].photo_url} alt={topThree[2].member_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(topThree[2].member_name)
                    )}
                  </div>
                  <div className="text-4xl mb-2">🥉</div>
                  <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-t-2xl w-32 h-32 flex flex-col items-center justify-start pt-4 shadow-xl transition-all group-hover:shadow-2xl group-hover:-translate-y-1">
                    <div className="text-white text-center px-2">
                      <div className="font-bold text-sm mb-1 group-hover:underline">{topThree[2].member_name}</div>
                      <div className="text-xs opacity-90 mb-2">{topThree[2].login_id}</div>
                      <div className="text-3xl font-bold mb-1">{topThree[2].avg_score.toFixed(1)}%</div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {topThree[2].trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(topThree[2].trend).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Champion of the Week */}
          <div className="col-span-4 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-xl shadow-xl p-6 text-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Champion of the Week
            </h2>
            {champion && (
              <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/performance/${champion.member_id}`)}>
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold mb-4 border-4 border-white shadow-2xl transition-all group-hover:scale-110 group-hover:ring-2 group-hover:ring-white/60">
                    {champion.photo_url ? (
                      <img src={champion.photo_url} alt={champion.member_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white">{getInitials(champion.member_name)}</span>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 shadow-lg">
                    <Crown className="w-6 h-6 text-yellow-900" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1 group-hover:underline">{champion.member_name}</div>
                  <div className="text-sm opacity-90 mb-3">{champion.login_id}</div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-3">
                    <div className="text-5xl font-bold mb-2">{champion.avg_score.toFixed(1)}%</div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {champion.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>Trend: {champion.trend > 0 ? '+' : ''}{champion.trend.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(champion.metrics).map(([code, data]) => (
                      <div key={code} className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                        <div className="font-semibold">{code}</div>
                        <div className="text-lg font-bold">{data.score.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Team Leaderboard
          </h2>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Rank</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Member</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Login ID</th>
                  {teamMetrics.map(m => (
                    <th key={m.metric_code} className="px-3 py-2 text-center text-xs font-semibold text-gray-600">{m.metric_code}</th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Score</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Trend</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((member, idx) => (
                  <tr key={member.member_id} className="border-b border-gray-100 hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => navigate(`/performance/${member.member_id}`)}>
                    <td className="px-3 py-3">
                      {idx < 3 ? (
                        <span className="text-xl">{['🥇', '🥈', '🥉'][idx]}</span>
                      ) : (
                        <span className="text-gray-500 font-medium">{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs transition-all hover:scale-110 hover:ring-2 hover:ring-indigo-400">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.member_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(member.member_name)
                          )}
                        </div>
                        <span className="font-semibold text-gray-800 hover:text-indigo-600 hover:underline transition-colors">{member.member_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{member.login_id}</td>
                    {teamMetrics.map(m => {
                      const metricData = member.metrics[m.metric_code];
                      const t = metricData?.trend;
                      return (
                        <td key={m.metric_code} className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-indigo-600 text-sm">
                              {metricData?.score.toFixed(1) || '-'}%
                            </span>
                            {t !== null && t !== undefined ? (
                              <div className="flex items-center gap-0.5">
                                {t > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : t < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
                                <span className={`text-xs font-semibold ${t > 0 ? 'text-green-500' : t < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                  {t > 0 ? '+' : ''}{t.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold ${
                          member.avg_score >= 90 ? 'text-green-600' :
                          member.avg_score >= 80 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {member.avg_score.toFixed(1)}%
                        </span>
                        {member.trend !== 0 ? (
                          <div className="flex items-center gap-0.5">
                            {member.trend > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                            <span className={`text-xs font-semibold ${member.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {member.trend > 0 ? '+' : ''}{member.trend.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {member.trend > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : member.trend < 0 ? (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        ) : null}
                        <span className={`text-xs font-semibold ${
                          member.trend > 0 ? 'text-green-600' : 
                          member.trend < 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {member.trend > 0 ? '+' : ''}{member.trend.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        member.category === 'Excellent' ? 'bg-green-100 text-green-700' :
                        member.category === 'Strong' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {member.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
