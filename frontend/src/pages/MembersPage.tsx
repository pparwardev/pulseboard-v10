import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE = 'http://localhost:8001';
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function fmt24to12(t: string) {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function calcTenure(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const join = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  let days = now.getDate() - join.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(', ') : 'New';
}

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [memberSkills, setMemberSkills] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      const active = res.data.filter((u: any) => u.role === 'specialist' && u.is_active);
      setMembers(active);
      const skillsMap: Record<number, string[]> = {};
      await Promise.all(active.map(async (m: any) => {
        try {
          const r = await api.get(`/api/skills/user/${m.id}`);
          skillsMap[m.id] = r.data.skills || [];
        } catch { skillsMap[m.id] = []; }
      }));
      setMemberSkills(skillsMap);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const WeekOffBadges = ({ weekOff }: { weekOff?: string }) => {
    const days = weekOff ? weekOff.split(',').map(Number) : [];
    return (
      <div className="flex gap-0.5">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
            days.includes(i)
              ? 'bg-indigo-600 text-white'
              : darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-400'
          }`}>{l}</div>
        ))}
      </div>
    );
  };


  return (
    <div className="relative min-h-screen">
      {selectedMember && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedMember(null)} />}

      {/* Right Side Preview Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 shadow-2xl border-l transition-transform duration-300 ease-in-out flex flex-col ${
          selectedMember ? 'translate-x-0' : 'translate-x-full'
        } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
        style={{ width: 'min(420px, 90vw)' }}
      >
        {selectedMember && (
          <>
            <button onClick={() => setSelectedMember(null)} className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-lg z-10 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>×</button>
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 px-5 pt-8 pb-12 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 flex-shrink-0 bg-white/20">
                  {selectedMember.profile_picture ? (
                    <img src={`${API_BASE}${selectedMember.profile_picture}`} alt={selectedMember.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold">{selectedMember.name?.charAt(0) || 'U'}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{selectedMember.name}</h2>
                  <p className="text-sm text-white/80 truncate">{selectedMember.login || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 -mt-4">
              <div className={`rounded-xl p-4 space-y-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {[
                  { label: 'Employee ID', value: selectedMember.employee_id },
                  { label: 'Email', value: selectedMember.email },
                  { label: 'Contact', value: selectedMember.contact_number },
                  { label: 'Location', value: selectedMember.location },
                  { label: 'Supports Marketplace', value: selectedMember.supports_marketplace },
                  { label: 'Tenure', value: calcTenure(selectedMember.created_at) },
                ].map(item => (
                  <div key={item.label}>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{item.label}</p>
                    <p className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.value || 'N/A'}</p>
                  </div>
                ))}
                <div>
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {(memberSkills[selectedMember.id] || []).length > 0
                      ? memberSkills[selectedMember.id].map(s => (
                          <span key={s} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{s}</span>
                        ))
                      : <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>N/A</span>
                    }
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Schedule & Week Off</p>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    🕐 {selectedMember.shift_start && selectedMember.shift_end ? `${fmt24to12(selectedMember.shift_start)} – ${fmt24to12(selectedMember.shift_end)}` : 'Not set'}
                  </p>
                  <div className="mt-1"><WeekOffBadges weekOff={selectedMember.week_off} /></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t space-y-2">
              <button onClick={() => navigate(`/profile/${selectedMember.id}`)} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-semibold">
                👤 View Full Profile
              </button>
              <button onClick={() => navigate(`/performance/${selectedMember.id}`)} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition text-sm font-semibold">
                📊 View Performance
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>👥 Team Members</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{members.length} active members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.length === 0 ? (
            <div className={`col-span-full p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-lg">No team members found</p>
              <p className="text-sm mt-2">Team members will appear here once they register</p>
            </div>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                className={`rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer ${
                  selectedMember?.id === member.id ? 'ring-2 ring-blue-500 border-blue-300' : ''
                } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      {member.profile_picture ? (
                        <img src={`${API_BASE}${member.profile_picture}`} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-xl">{member.name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{member.login || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
