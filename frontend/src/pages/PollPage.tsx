import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Voter { id: number; name: string; profile_picture: string | null; }
interface PollOption { id: number; option_text: string; vote_count: number; voters: Voter[]; }
interface Poll {
  id: number; question: string; created_by: number; creator_name: string; created_at: string;
  is_active: boolean; options: PollOption[]; total_votes: number; team_size: number;
  user_voted: boolean; user_voted_option_id: number | null; is_creator: boolean;
}

const OPTION_COLORS = [
  { light: 'bg-blue-50 border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
  { light: 'bg-purple-50 border-purple-200', text: 'text-purple-700', bar: 'bg-purple-500' },
  { light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  { light: 'bg-amber-50 border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
  { light: 'bg-rose-50 border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500' },
  { light: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700', bar: 'bg-cyan-500' },
];

const API_BASE = 'http://65.0.122.136:8001';

function Avatar({ voter }: { voter: Voter }) {
  const initials = voter.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const photoUrl = voter.profile_picture ? (voter.profile_picture.startsWith('http') ? voter.profile_picture : `${API_BASE}${voter.profile_picture}`) : null;
  if (photoUrl) return <img src={photoUrl} alt={voter.name} title={voter.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-white shadow-sm" />;
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  return <div title={voter.name} className={`w-6 h-6 rounded-full ${colors[voter.id % colors.length]} text-white flex items-center justify-center font-bold ring-2 ring-white shadow-sm text-[9px]`}>{initials}</div>;
}

function VoterAvatars({ voters }: { voters: Voter[] }) {
  if (!voters.length) return null;
  const shown = voters.slice(0, 5);
  const extra = voters.length - shown.length;
  return (
    <div className="flex items-center mt-1.5">
      <div className="flex -space-x-1.5">
        {shown.map(v => <Avatar key={v.id} voter={v} />)}
        {extra > 0 && <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold flex items-center justify-center ring-2 ring-white">+{extra}</div>}
      </div>
    </div>
  );
}

function PollCard({ poll, user, isManager, onVote, onDelete }: {
  poll: Poll; user: any; isManager: boolean;
  onVote: (pollId: number, optionId: number) => void;
  onDelete: (pollId: number) => void;
}) {
  const winnerIdx = poll.options.reduce((best, o, i, arr) => o.vote_count > (arr[best]?.vote_count || 0) ? i : best, -1);
  const showResults = poll.user_voted || (isManager && poll.total_votes > 0) || !poll.is_active;
  const canVote = poll.is_active && !poll.is_creator;
  const eligible = Math.max(poll.team_size - 1, 1);
  const progress = Math.min(Math.round((poll.total_votes / eligible) * 100), 100);

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-shadow hover:shadow-md ${!poll.is_active ? 'border-gray-200 opacity-90' : 'border-gray-100'}`}>
      <div className={`px-4 py-3 ${poll.is_active ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}>
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-bold text-white leading-snug flex-1 pr-2">{poll.question}</h3>
          {poll.is_active && poll.created_by === user.id && (
            <button onClick={() => onDelete(poll.id)} className="text-white/60 hover:text-white text-xs shrink-0">✕</button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-white/70 text-[10px]">
          <span>{poll.creator_name}</span><span>•</span>
          <span>{new Date(poll.created_at).toLocaleDateString()}</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded-full font-medium ml-auto">{poll.total_votes}/{eligible}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1 mt-2">
          <div className="bg-white/80 h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {poll.options.map((option, idx) => {
          const pct = poll.total_votes > 0 ? (option.vote_count / poll.total_votes) * 100 : 0;
          const color = OPTION_COLORS[idx % OPTION_COLORS.length];
          const isWinner = idx === winnerIdx && showResults && poll.options[winnerIdx].vote_count > 0;
          const isMyVote = poll.user_voted_option_id === option.id;
          return (
            <button key={option.id} onClick={() => canVote && onVote(poll.id, option.id)} disabled={!canVote}
              className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all relative overflow-hidden ${
                showResults ? `${color.light} ${canVote ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}` : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer'
              } ${isWinner ? 'ring-1 ring-indigo-400' : ''} ${isMyVote && poll.is_active ? 'ring-1 ring-indigo-500' : ''}`}>
              {showResults && <div className={`absolute inset-y-0 left-0 ${color.bar} opacity-10 transition-all duration-700`} style={{ width: `${pct}%` }} />}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isWinner && <span className="text-xs">🏆</span>}
                    {isMyVote && <span className="text-xs">✓</span>}
                    <span className={`font-medium text-xs ${showResults ? color.text : 'text-gray-800'}`}>{option.option_text}</span>
                  </div>
                  {showResults && <span className={`text-xs font-bold ${color.text}`}>{pct.toFixed(0)}%</span>}
                </div>
                {showResults && <div className="w-full bg-gray-200/60 rounded-full h-1 mt-1.5"><div className={`${color.bar} h-1 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} /></div>}
                {showResults && option.voters.length > 0 && <VoterAvatars voters={option.voters} />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-3">
        {!poll.is_active ? (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-100 rounded-md px-2 py-1.5"><span>🏁</span> Poll completed • {poll.total_votes} votes</div>
        ) : poll.is_creator ? (
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 bg-indigo-50 rounded-md px-2 py-1.5"><span>👑</span> Your poll • Waiting for votes</div>
        ) : poll.user_voted ? (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 rounded-md px-2 py-1.5"><span>🔄</span> Tap another option to change your vote</div>
        ) : (
          <p className="text-[10px] text-gray-400 text-center">Tap an option to vote</p>
        )}
      </div>
    </div>
  );
}

export default function PollPage() {
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [completedPolls, setCompletedPolls] = useState<Poll[]>([]);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  useEffect(() => { loadPolls(); }, []);

  const loadPolls = async () => {
    try {
      const [activeRes, completedRes] = await Promise.all([api.get('/api/polls/'), api.get('/api/polls/completed')]);
      setActivePolls(activeRes.data);
      setCompletedPolls(completedRes.data);
    } catch { toast.error('Failed to load polls'); }
  };

  const createPoll = async () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) { toast.error('Question and at least 2 options required'); return; }
    setLoading(true);
    try {
      await api.post('/api/polls/', { question, options: options.filter(o => o.trim()).map(o => ({ option_text: o })) });
      toast.success('Poll created!');
      setShowCreateModal(false); setQuestion(''); setOptions(['', '']);
      loadPolls();
    } catch { toast.error('Failed to create poll'); }
    finally { setLoading(false); }
  };

  const vote = async (pollId: number, optionId: number) => {
    try { const res = await api.post(`/api/polls/${pollId}/vote`, { option_id: optionId }); toast.success(res.data.message); loadPolls(); }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to vote'); }
  };

  const deletePoll = async (pollId: number) => {
    if (!confirm('Delete this poll?')) return;
    try { await api.delete(`/api/polls/${pollId}`); toast.success('Poll deleted'); loadPolls(); }
    catch { toast.error('Failed to delete poll'); }
  };

  const polls = tab === 'active' ? activePolls : completedPolls;

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">🗳️</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team Polls</h1>
            <p className="text-xs text-gray-500">{activePolls.length} active • {completedPolls.length} completed</p>
          </div>
        </div>
        {isManager && (
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs">+ New Poll</button>
        )}
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('active')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'active' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>Active ({activePolls.length})</button>
        <button onClick={() => setTab('completed')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'completed' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500'}`}>Completed ({completedPolls.length})</button>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">{tab === 'active' ? '📊' : '🏁'}</div>
          <p className="text-gray-400">{tab === 'active' ? 'No active polls' : 'No completed polls yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {polls.map(poll => <PollCard key={poll.id} poll={poll} user={user} isManager={isManager} onVote={vote} onDelete={deletePoll} />)}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">🗳️</div>
              <h2 className="text-xl font-bold text-gray-900">Create Poll</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
                <input type="text" value={question} onChange={e => setQuestion(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="What would you like to ask?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Options</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" value={opt} onChange={e => { const n = [...options]; n[idx] = e.target.value; setOptions(n); }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder={`Option ${idx + 1}`} />
                    {options.length > 2 && <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="px-3 text-red-400 hover:text-red-600 rounded-xl hover:bg-red-50">✕</button>}
                  </div>
                ))}
                <button onClick={() => setOptions([...options, ''])} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1">+ Add Option</button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={createPoll} disabled={loading} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 text-sm font-medium">{loading ? 'Creating...' : 'Create Poll'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
