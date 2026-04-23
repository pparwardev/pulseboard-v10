import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useMetrics } from '../contexts/MetricsContext';

interface TeamMetric {
  id: number;
  metric_name: string;
  metric_code: string;
  unit?: string;
  goal_value?: number;
  is_higher_better: boolean;
  weight: number;
}

export default function MetricsConfigPage() {
  const { refreshMetrics } = useMetrics();
  const [step, setStep] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetric[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  const [showEditMetricModal, setShowEditMetricModal] = useState(false);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [currentMetric, setCurrentMetric] = useState<any>(null);
  const [existingMetrics, setExistingMetrics] = useState<any[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [allTeamsGoals, setAllTeamsGoals] = useState<any[]>([]);
  const [newMetricData, setNewMetricData] = useState({
    metric_name: '',
    metric_code: '',
    description: '',
    unit: ''
  });
  const [goalData, setGoalData] = useState({
    unit: '',
    goal_value: '',
    is_higher_better: true,
    weight: 1.0,
    excellent: '',
    acceptable: '',
    needs_improvement: ''
  });

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userTeamName = user?.team_name;

  useEffect(() => {
    fetchTeams();
    fetchAvailableMetrics();
    fetchExistingMetrics();
    fetchAllTeamsGoals();
    setStep(1);
    setSelectedTeam('');
    setSelectedTeamName('');
    setShowSummaryCard(false);
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMetrics();
      // Save state to sessionStorage
      const team = teams.find(t => t.id === parseInt(selectedTeam));
      if (team) {
        setSelectedTeamName(team.name);
      }
    }
  }, [selectedTeam, teams]);

  useEffect(() => {
    // Removed sessionStorage restore - always start fresh
  }, [teams]);

  const fetchTeams = async () => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    setTeams([{ id: 1, name: user.team_name || 'LESC' }]);
  };

  const fetchAvailableMetrics = async () => {
    try {
      const response = await api.get('/api/team-metrics/available-metrics');
      setAvailableMetrics(response.data.metrics);
    } catch (error) {
      toast.error('Failed to fetch metrics');
      setAvailableMetrics([]);
    }
  };

  const fetchTeamMetrics = async () => {
    try {
      const response = await api.get(`/api/team-metrics/team/${selectedTeam}`);
      setTeamMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch team metrics');
      setTeamMetrics([]);
    }
  };

  const fetchExistingMetrics = async () => {
    try {
      const response = await api.get('/api/team-metrics/finalized');
      const allMetrics: any[] = [];
      response.data.forEach((team: any) => {
        team.metrics?.forEach((metric: any) => {
          if (!allMetrics.find(m => m.metric_code === metric.metric_code)) {
            allMetrics.push(metric);
          }
        });
      });
      setExistingMetrics(allMetrics);
    } catch (error) {
      console.error('Failed to fetch existing metrics');
      setExistingMetrics([]);
    }
  };

  const fetchAllTeamsGoals = async () => {
    try {
      const response = await api.get('/api/team-metrics/finalized');
      setAllTeamsGoals(response.data);
    } catch (error) {
      console.error('Failed to fetch teams goals');
      setAllTeamsGoals([]);
    }
  };

  const handleMetricNameChange = (value: string) => {
    setNewMetricData({ ...newMetricData, metric_name: value });
    if (value.length > 0) {
      const suggestions = existingMetrics.filter(m => 
        m.metric_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const selectSuggestion = (metric: any) => {
    setNewMetricData({
      metric_name: metric.metric_name,
      metric_code: metric.metric_code,
      description: '',
      unit: metric.unit || ''
    });
    setFilteredSuggestions([]);
  };

  const handleMetricSelection = (metricCode: string) => {
    if (selectedMetrics.includes(metricCode)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metricCode));
    } else {
      setSelectedMetrics([...selectedMetrics, metricCode]);
    }
  };

  const addMetrics = async () => {
    if (!newMetricData.metric_name || !newMetricData.metric_code) {
      toast.error('Please fill in metric name and abbreviation');
      return;
    }

    try {
      await api.post('/api/team-metrics/', {
        team_id: parseInt(selectedTeam),
        metric_name: newMetricData.metric_name,
        metric_code: newMetricData.metric_code,
        description: newMetricData.description,
        unit: newMetricData.unit,
        is_higher_better: true
      });
      toast.success('Metric added successfully');
      setNewMetricData({
        metric_name: '',
        metric_code: '',
        description: '',
        unit: ''
      });
      setShowAddMetricModal(false);
      fetchTeamMetrics();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add metric');
    }
  };

  const removeMetrics = async () => {
    if (selectedMetrics.length === 0) {
      toast.error('Please select at least one metric to remove');
      return;
    }

    try {
      for (const metricCode of selectedMetrics) {
        const metric = teamMetrics.find(m => m.metric_code === metricCode);
        if (metric) {
          await api.delete(`/api/team-metrics/${metric.id}`);
        }
      }
      toast.success('Metrics removed successfully');
      await refreshMetrics();
      window.dispatchEvent(new CustomEvent('metricConfigChanged'));
      setSelectedMetrics([]);
      fetchTeamMetrics();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove metrics');
    }
  };

  const openEditMetricModal = () => {
    if (selectedMetrics.length !== 1) {
      toast.error('Please select exactly one metric to edit');
      return;
    }
    const metric = teamMetrics.find(m => m.metric_code === selectedMetrics[0]);
    if (metric) {
      setNewMetricData({
        metric_name: metric.metric_name,
        metric_code: metric.metric_code,
        description: metric.description || '',
        unit: metric.unit || ''
      });
      setCurrentMetric(metric);
      setShowEditMetricModal(true);
    }
  };

  const updateMetric = async () => {
    if (!newMetricData.metric_name || !newMetricData.metric_code) {
      toast.error('Please fill in metric name and abbreviation');
      return;
    }

    try {
      await api.patch(`/api/team-metrics/${currentMetric.id}`, {
        metric_name: newMetricData.metric_name,
        metric_code: newMetricData.metric_code,
        description: newMetricData.description,
        unit: newMetricData.unit
      });
      toast.success('Metric updated successfully');
      await refreshMetrics();
      window.dispatchEvent(new CustomEvent('metricConfigChanged'));
      setNewMetricData({
        metric_name: '',
        metric_code: '',
        description: '',
        unit: ''
      });
      setShowEditMetricModal(false);
      setSelectedMetrics([]);
      await fetchTeamMetrics();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update metric');
    }
  };

  const openGoalModal = (metric: TeamMetric) => {
    setCurrentMetric(metric);
    setGoalData({
      unit: metric.unit || '',
      goal_value: metric.goal_value?.toString() || '',
      is_higher_better: metric.is_higher_better,
      weight: metric.weight,
      excellent: '',
      acceptable: '',
      needs_improvement: ''
    });
    setShowGoalModal(true);
  };

  const saveGoal = async () => {
    if (!goalData.goal_value) {
      toast.error('Please enter a goal value');
      return;
    }

    try {
      await api.patch(`/api/team-metrics/${currentMetric.id}`, {
        unit: goalData.unit,
        goal_value: parseFloat(goalData.goal_value),
        is_higher_better: goalData.is_higher_better,
        weight: goalData.weight
      });
      toast.success('Goal saved successfully');
      setShowGoalModal(false);
      await fetchTeamMetrics();
    } catch (error) {
      toast.error('Failed to save goal');
    }
  };

  return (
    <div className="p-4 max-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Metrics Configuration</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Workflow */}
        <div className="bg-white rounded-lg shadow-md p-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                onClick={() => {
                  if (s === 1 || (s === 2 && selectedTeam) || (s === 3 && selectedTeam && teamMetrics.length > 0)) {
                    setStep(s);
                    setShowSummaryCard(false);
                  }
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer ${
                  step >= s ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Team */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Step 1: Select Team</h2>
            <select
              value={selectedTeam}
              onChange={(e) => {
                const teamId = e.target.value;
                setSelectedTeam(teamId);
                const team = teams.find(t => t.id === parseInt(teamId));
                if (team) {
                  setSelectedTeamName(team.name);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-3"
            >
              <option value="">Choose a team</option>
              {teams.map((team) => {
                const isDisabled = userTeamName && userTeamName !== 'Admin_Team' && team.name !== userTeamName;
                return (
                  <option key={team.id} value={team.id} disabled={isDisabled}>
                    {team.name} {isDisabled ? '(Not accessible)' : ''}
                  </option>
                );
              })}
            </select>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedTeam}
                className="bg-blue-600 text-white px-4 py-1.5 text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Metrics */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Step 2: Manage Metrics</h2>
            
            {teamMetrics.length > 0 && (
              <div className="mb-3">
                <h3 className="text-sm font-medium mb-2">Current Metrics:</h3>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {teamMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      onClick={() => handleMetricSelection(metric.metric_code)}
                      className={`p-2 border-2 rounded cursor-pointer transition ${
                        selectedMetrics.includes(metric.metric_code)
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">{metric.metric_name}</h3>
                          <p className="text-xs text-gray-600">Unit: {metric.unit}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedMetrics.includes(metric.metric_code)}
                          readOnly
                          className="w-4 h-4 ml-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowAddMetricModal(true)}
                className="flex-1 bg-green-600 text-white py-1.5 text-sm rounded-md hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={openEditMetricModal}
                className="flex-1 bg-blue-600 text-white py-1.5 text-sm rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={removeMetrics}
                disabled={selectedMetrics.length === 0}
                className="flex-1 bg-red-600 text-white py-1.5 text-sm rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                Remove
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-200 text-gray-800 px-4 py-1.5 text-sm rounded-md hover:bg-gray-300"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-blue-600 text-white px-4 py-1.5 text-sm rounded-md hover:bg-blue-700 ml-auto"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Set Goals */}
        {step === 3 && !showSummaryCard && (
          <div>
            <h2 className="text-lg font-bold mb-3">Step 3: Set Goals</h2>
            {teamMetrics.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">No metrics configured</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {teamMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-2 border border-gray-300 rounded"
                  >
                    <div>
                      <h3 className="text-sm font-medium">{metric.metric_name}</h3>
                      <p className="text-xs text-gray-600">{metric.metric_code}</p>
                      <p className="text-xs text-gray-600">
                        {metric.goal_value ? `${metric.goal_value} ${metric.unit || ''}` : 'No goal'} | W: {metric.weight}
                      </p>
                    </div>
                    <button
                      onClick={() => openGoalModal(metric)}
                      className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-700"
                    >
                      Set Goal
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-200 text-gray-800 px-4 py-1.5 text-sm rounded-md hover:bg-gray-300"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  const totalWeight = teamMetrics.reduce((sum, m) => sum + m.weight, 0);
                  if (totalWeight > 100) {
                    toast.error(`Total weightage is ${totalWeight}%. Please recheck the weightage of all metrics. It should not exceed 100%.`);
                    return;
                  }
                  setShowSummaryCard(true);
                }}
                className="bg-green-600 text-white px-4 py-1.5 text-sm rounded-md hover:bg-green-700 ml-auto"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {showSummaryCard && (
          <div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-t-lg">
              <h2 className="text-lg font-bold">{selectedTeamName}</h2>
              <p className="text-xs text-blue-100">Summary</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-b-lg p-3">
              {teamMetrics.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">No metrics configured</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teamMetrics.map((metric) => (
                    <div key={metric.id} className="border border-gray-300 rounded p-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">{metric.metric_name}</h3>
                          <p className="text-xs text-gray-500">{metric.metric_code}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {metric.unit || 'N/A'}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1">
                        <div>
                          <p className="text-xs text-gray-500">Goal</p>
                          <p className="text-xs font-semibold">{metric.goal_value || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="text-xs font-semibold">{metric.weight}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowSummaryCard(false)}
                  className="bg-gray-200 text-gray-800 px-3 py-1.5 text-sm rounded-md hover:bg-gray-300"
                >
                  ← Back
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.post('/api/team-metrics/finalize', {
                        team_id: parseInt(selectedTeam),
                        team_name: selectedTeamName
                      });
                      toast.success('Metrics finalized successfully!');
                      await refreshMetrics();
                      window.dispatchEvent(new CustomEvent('metricConfigChanged'));
                      setStep(1);
                      setSelectedTeam('');
                      setSelectedTeamName('');
                      setShowSummaryCard(false);
                      fetchAllTeamsGoals();
                    } catch (error: any) {
                      toast.error(error.response?.data?.detail || 'Failed to finalize');
                    }
                  }}
                  className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-700 ml-auto"
                >
                  Finalize
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Right Column - Metric Goals */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🎯 Metric Goals</h2>
          {allTeamsGoals.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No metric goals configured yet</div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {allTeamsGoals.map((team) => (
                <div key={team.team_id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2">
                    <h3 className="text-sm font-bold">{team.team_name}</h3>
                  </div>
                  <div className="p-2">
                    {team.metrics && team.metrics.length > 0 ? (
                      <div className="space-y-2">
                        {team.metrics.map((metric: any) => (
                          <div key={metric.id} className="border border-gray-300 rounded p-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">{metric.metric_name}</h4>
                                <p className="text-xs text-gray-500">{metric.metric_code}</p>
                              </div>
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                {metric.unit || 'N/A'}
                              </span>
                            </div>
                            <div className="flex gap-4 mt-1">
                              <div>
                                <p className="text-xs text-gray-500">Goal</p>
                                <p className="text-xs font-semibold">{metric.goal_value || 'Not set'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Weight</p>
                                <p className="text-xs font-semibold">{metric.weight}%</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs text-center py-2">No metrics configured</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Set Goal: {currentMetric?.metric_name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={goalData.unit}
                  onChange={(e) => setGoalData({ ...goalData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., minutes, percentage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Value *</label>
                <input
                  type="number"
                  step="0.01"
                  value={goalData.goal_value}
                  onChange={(e) => setGoalData({ ...goalData, goal_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excellent</label>
                <input
                  type="text"
                  value={goalData.excellent}
                  onChange={(e) => setGoalData({ ...goalData, excellent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., >90 or A+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acceptable</label>
                <input
                  type="text"
                  value={goalData.acceptable}
                  onChange={(e) => setGoalData({ ...goalData, acceptable: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 70-90 or B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Needs Improvement</label>
                <input
                  type="text"
                  value={goalData.needs_improvement}
                  onChange={(e) => setGoalData({ ...goalData, needs_improvement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., <70 or C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weightage in Scorecard</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalData.weight}
                  onChange={(e) => setGoalData({ ...goalData, weight: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={goalData.is_higher_better}
                  onChange={(e) => setGoalData({ ...goalData, is_higher_better: e.target.checked })}
                  className="w-5 h-5 mr-2"
                />
                <label className="text-sm text-gray-700">Higher is better</label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveGoal}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Save Goal
              </button>
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metric Modal */}
      {showEditMetricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Metric</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metric Name *</label>
                <input
                  type="text"
                  value={newMetricData.metric_name}
                  onChange={(e) => setNewMetricData({ ...newMetricData, metric_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Customer Satisfaction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation *</label>
                <input
                  type="text"
                  value={newMetricData.metric_code}
                  onChange={(e) => setNewMetricData({ ...newMetricData, metric_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., CSAT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newMetricData.description}
                  onChange={(e) => setNewMetricData({ ...newMetricData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Describe the metric..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={newMetricData.unit}
                  onChange={(e) => setNewMetricData({ ...newMetricData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., percentage, minutes"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={updateMetric}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowEditMetricModal(false);
                  setNewMetricData({
                    metric_name: '',
                    metric_code: '',
                    description: '',
                    unit: ''
                  });
                  setSelectedMetrics([]);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Metric Modal */}
      {showAddMetricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Metric</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Metric Name *</label>
                <input
                  type="text"
                  value={newMetricData.metric_name}
                  onChange={(e) => handleMetricNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Customer Satisfaction"
                />
                {filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((metric, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(metric)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{metric.metric_name}</div>
                        <div className="text-xs text-gray-500">{metric.metric_code} | {metric.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation *</label>
                <input
                  type="text"
                  value={newMetricData.metric_code}
                  onChange={(e) => setNewMetricData({ ...newMetricData, metric_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., CSAT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newMetricData.description}
                  onChange={(e) => setNewMetricData({ ...newMetricData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Describe the metric..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={newMetricData.unit}
                  onChange={(e) => setNewMetricData({ ...newMetricData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., percentage, minutes"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={addMetrics}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddMetricModal(false);
                  setNewMetricData({
                    metric_name: '',
                    metric_code: '',
                    description: '',
                    unit: ''
                  });
                  setFilteredSuggestions([]);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
