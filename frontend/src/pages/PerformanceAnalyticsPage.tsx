import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import './PerformanceAnalyticsPage.css';

function SimpleMetricsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimpleData();
  }, []);

  const fetchSimpleData = async () => {
    try {
      console.log('Fetching simple metrics data...');
      const response = await api.get('/api/performance-analytics/simple-view');
      console.log('Response:', response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">No Performance Data Available</h2>
            <p className="text-gray-600 mb-6">No metrics data found in the system.</p>
          </div>
        </div>
      </div>
    );
  }

  const metrics = data.length > 0 ? Object.keys(data[0].metrics) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>📊</span> Team Performance Metrics
          </h1>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <th className="px-4 py-3 text-left font-semibold border border-purple-400">Member Name</th>
                  <th className="px-4 py-3 text-left font-semibold border border-purple-400">Login ID</th>
                  {metrics.map(metric => (
                    <th key={metric} className="px-4 py-3 text-center font-semibold border border-purple-400">
                      {metric}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-3 border border-gray-200 font-medium text-gray-800">{row.member_name}</td>
                    <td className="px-4 py-3 border border-gray-200 text-gray-600">{row.login_id}</td>
                    {metrics.map(metric => (
                      <td key={metric} className="px-4 py-3 border border-gray-200 text-center">
                        <span className="font-semibold text-purple-600">
                          {row.metrics[metric] || '-'}
                        </span>
                      </td>
                    ))}
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

interface MetricCard {
  metric_code: string;
  metric_name: string;
  unit: string;
  goal_value: number;
  average_score: number;
  is_higher_better: boolean;
}

interface MemberScore {
  member_id: number;
  name: string;
  email: string;
  employee_id: string;
  score: number;
  score_trend: number | null;
  metrics: Record<string, number>;
  metric_trends: Record<string, number | null>;
  metric_details: any[];
  ai_insight: string;
}

export default function PerformanceAnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [scoreDistribution, setScoreDistribution] = useState({ green: 0, yellow: 0, red: 0 });
  const [metricCards, setMetricCards] = useState<MetricCard[]>([]);
  const [topPodium, setTopPodium] = useState<MemberScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<MemberScore[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [cardMembers, setCardMembers] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentYear, setCurrentYear] = useState(0);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/performance-analytics/dashboard');
      
      setOverallScore(response.data.overall_team_score);
      setScoreDistribution(response.data.score_distribution);
      setMetricCards(response.data.metric_cards);
      setTopPodium(response.data.top_podium);
      setLeaderboard(response.data.leaderboard);
      setCurrentWeek(response.data.current_week);
      setCurrentYear(response.data.current_year);
      setHasData(response.data.has_data);
    } catch (error) {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCardExpand = async (metricCode: string) => {
    if (expandedCard === metricCode) {
      setExpandedCard(null);
      setCardMembers([]);
    } else {
      try {
        const response = await api.get(`/api/performance-analytics/metric-cards/${metricCode}/members`);
        setCardMembers(response.data);
        setExpandedCard(metricCode);
      } catch (error) {
        toast.error('Failed to load member details');
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green';
    if (score >= 80) return 'yellow';
    return 'red';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-400 to-green-600';
    if (score >= 80) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (score >= 80) return { label: 'Strong', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Need Attention', color: 'bg-red-100 text-red-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 rounded-2xl shadow-2xl p-8 text-white animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎯 Performance Analytics Hub</h1>
              <p className="text-purple-100">Week {currentWeek} • {currentYear}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold animate-pulse">{overallScore.toFixed(1)}%</div>
              <div className="text-purple-100">Team Average</div>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{scoreDistribution.green}</div>
                <div className="text-gray-600 font-medium">Green Zone</div>
                <div className="text-sm text-gray-500">90-100%</div>
              </div>
              <div className="text-5xl">🟢</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-600">{scoreDistribution.yellow}</div>
                <div className="text-gray-600 font-medium">Yellow Zone</div>
                <div className="text-sm text-gray-500">80-89%</div>
              </div>
              <div className="text-5xl">🟡</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-600">{scoreDistribution.red}</div>
                <div className="text-gray-600 font-medium">Red Zone</div>
                <div className="text-sm text-gray-500">Below 80%</div>
              </div>
              <div className="text-5xl">🔴</div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        {metricCards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>📊</span> Metric Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((card) => (
              <div key={card.metric_code} className="relative">
                <div
                  onClick={() => handleCardExpand(card.metric_code)}
                  className={`metric-card bg-gradient-to-br ${getScoreGradient(card.average_score)} rounded-xl p-6 text-white cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                >
                  <div className="text-sm font-medium opacity-90">{card.metric_name}</div>
                  <div className="text-4xl font-bold my-2">{card.average_score.toFixed(1)}%</div>
                  <div className="text-xs opacity-80">Goal: {card.goal_value} {card.unit}</div>
                  <div className="mt-2 text-xs">
                    {expandedCard === card.metric_code ? '▲ Click to collapse' : '▼ Click to expand'}
                  </div>
                </div>

                {/* Expanded Member List */}
                {expandedCard === card.metric_code && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl p-4 z-10 max-h-96 overflow-y-auto animate-slide-down">
                    <div className="space-y-2">
                      {cardMembers.map((member, idx) => (
                        <div
                          key={member.member_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{member.name}</div>
                              <div className="text-xs text-gray-500">{member.employee_id}</div>
                            </div>
                          </div>
                          <div className={`text-lg font-bold text-${getScoreColor(member.score)}-600`}>
                            {member.score.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        )}
        {topPodium.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="text-4xl absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce">👑</div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-3xl font-black text-white border-4 border-white shadow-lg">
                  {topPodium[0].name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-yellow-300">{topPodium[0].name}</div>
                <div className="text-sm text-yellow-200 font-bold">⭐ Champion of the Week</div>
                <div className="flex gap-4 mt-3">
                  {Object.entries(topPodium[0].metrics).map(([key, val]) => (
                    <div key={key} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
                      <div className="text-lg font-bold">{(val as number).toFixed(1)}%</div>
                      <div className="text-[10px] uppercase opacity-80">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-5xl font-black">{topPodium[0].score.toFixed(1)}%</div>
                <div className="text-sm text-purple-200">Overall Score</div>
              </div>
            </div>
          </div>
        )}
        {topPodium.length === 0 && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="text-4xl absolute -top-4 left-1/2 -translate-x-1/2">👑</div>
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl border-4 border-white/30 shadow-lg">?</div>
              </div>
              <div>
                <div className="text-2xl font-black text-yellow-300">— Champion of the Week —</div>
                <div className="text-sm text-purple-200 mt-1">Upload metric data to reveal the champion</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-5xl font-black text-white/30">—%</div>
                <div className="text-sm text-purple-200">Overall Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
            <span>🏆</span> Top 3 Performers
          </h2>
          {topPodium.length > 0 ? (
            <div className="flex items-end justify-center gap-8">
              {/* 2nd Place */}
              {topPodium[1] && (
                <div
                  onClick={() => navigate(`/profile/${topPodium[1].member_id}`)}
                  className="podium-card cursor-pointer transform hover:scale-110 transition-all duration-300"
                >
                  <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl p-6 text-center shadow-xl h-48 flex flex-col justify-between">
                    <div className="text-6xl mb-2">🥈</div>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">{topPodium[1].name}</div>
                      <div className="text-3xl font-bold text-gray-700 mt-2">{topPodium[1].score.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600 mt-2">
                        {Object.entries(topPodium[1].metrics).map(([key, val]) => (
                          <div key={key}>{key}: {(val as number).toFixed(1)}%</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topPodium[0] && (
                <div
                  onClick={() => navigate(`/profile/${topPodium[0].member_id}`)}
                  className="podium-card cursor-pointer transform hover:scale-110 transition-all duration-300"
                >
                  <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl p-6 text-center shadow-2xl h-64 flex flex-col justify-between animate-bounce-slow">
                    <div className="text-7xl mb-2">🥇</div>
                    <div>
                      <div className="font-bold text-gray-800 text-xl">{topPodium[0].name}</div>
                      <div className="text-4xl font-bold text-gray-800 mt-2">{topPodium[0].score.toFixed(1)}%</div>
                      <div className="text-xs text-gray-700 mt-2">
                        {Object.entries(topPodium[0].metrics).map(([key, val]) => (
                          <div key={key}>{key}: {(val as number).toFixed(1)}%</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topPodium[2] && (
                <div
                  onClick={() => navigate(`/profile/${topPodium[2].member_id}`)}
                  className="podium-card cursor-pointer transform hover:scale-110 transition-all duration-300"
                >
                  <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-2xl p-6 text-center shadow-xl h-40 flex flex-col justify-between">
                    <div className="text-5xl mb-2">🥉</div>
                    <div>
                      <div className="font-bold text-gray-800">{topPodium[2].name}</div>
                      <div className="text-2xl font-bold text-gray-700 mt-2">{topPodium[2].score.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600 mt-2">
                        {Object.entries(topPodium[2].metrics).map(([key, val]) => (
                          <div key={key}>{key}: {(val as number).toFixed(1)}%</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-end justify-center gap-8">
              {/* Empty 2nd Place */}
              <div className="podium-card">
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 text-center shadow-xl h-48 flex flex-col justify-between">
                  <div className="text-6xl mb-2">🥈</div>
                  <div>
                    <div className="font-bold text-gray-400 text-lg">—</div>
                    <div className="text-3xl font-bold text-gray-300 mt-2">—%</div>
                  </div>
                </div>
              </div>
              {/* Empty 1st Place */}
              <div className="podium-card">
                <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-2xl p-6 text-center shadow-2xl h-64 flex flex-col justify-between">
                  <div className="text-7xl mb-2">🥇</div>
                  <div>
                    <div className="font-bold text-gray-400 text-xl">—</div>
                    <div className="text-4xl font-bold text-gray-300 mt-2">—%</div>
                    <div className="text-xs text-gray-400 mt-2">Upload data to see rankings</div>
                  </div>
                </div>
              </div>
              {/* Empty 3rd Place */}
              <div className="podium-card">
                <div className="bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl p-6 text-center shadow-xl h-40 flex flex-col justify-between">
                  <div className="text-5xl mb-2">🥉</div>
                  <div>
                    <div className="font-bold text-gray-400">—</div>
                    <div className="text-2xl font-bold text-gray-300 mt-2">—%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>📋</span> Team Leaderboard
          </h2>
          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Employee ID</th>
                    {metricCards.map((card) => (
                      <th key={card.metric_code} className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                        {card.metric_code}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Score</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((member, idx) => (
                    <tr
                      key={member.member_id}
                      onClick={() => navigate(`/profile/${member.member_id}`)}
                      className="border-b border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors leaderboard-row"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {idx < 3 ? (
                            <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                          ) : (
                            <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800">{member.name}</td>
                      <td className="px-4 py-4 text-gray-600">{member.employee_id}</td>
                      {metricCards.map((card) => {
                        const trend = member.metric_trends?.[card.metric_code];
                        return (
                          <td key={card.metric_code} className="px-4 py-4 text-center">
                            <span className={`font-bold text-${getScoreColor(member.metrics[card.metric_code] || 0)}-600`}>
                              {(member.metrics[card.metric_code] || 0).toFixed(1)}%
                            </span>
                            {trend !== null && trend !== undefined && (
                              <span className={`ml-1 text-xs font-semibold ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-lg font-bold text-${getScoreColor(member.score)}-600`}>
                          {member.score.toFixed(1)}%
                        </span>
                        {member.score_trend !== null && member.score_trend !== undefined && (
                          <span className={`ml-1 text-xs font-semibold ${member.score_trend > 0 ? 'text-green-500' : member.score_trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {member.score_trend > 0 ? '▲' : member.score_trend < 0 ? '▼' : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatus(member.score).color}`}>
                          {getStatus(member.score).label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-400 font-medium">Leaderboard will appear once metric data is uploaded</p>
            </div>
          )}
        </div>

        {/* AI Insights */}
        {leaderboard.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🤖</span> AI Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaderboard.slice(0, 4).map((member) => (
              <div key={member.member_id} className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="font-bold text-lg mb-2">{member.name}</div>
                <div className="text-sm text-purple-100">{member.ai_insight}</div>
              </div>
            ))}
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
