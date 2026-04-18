import { useState, useEffect } from 'react';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://65.0.122.136:8001';
const initials = (n: string) => n?.split(' ').filter(w => w).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

export default function OnlineTeamTile() {
  const [members, setMembers] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => api.get('/api/dashboard/v2/online-team').then(r => setMembers(r.data.online_members || [])).catch(() => {}).finally(() => setLoaded(true));
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  if (!loaded) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-3" style={{ minHeight: 120 }}>
      <div className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition" onClick={() => members.length > 0 && setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {members.length > 0 ? (
              <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" /></>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-300" />
            )}
          </span>
          <h3 className="text-sm font-bold text-gray-700">Online Team Members</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${members.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{members.length}</span>
        </div>
        {members.length > 0 ? (
          <span className={`text-gray-400 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
        ) : (
          <span className="text-[11px] text-gray-400 italic">No members online now</span>
        )}
      </div>
      {members.length > 0 && (
        <div className="px-4 pb-2.5 flex -space-x-2">
          {members.slice(0, 8).map(m => (
            <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-green-100 flex items-center justify-center text-[8px] font-bold text-green-700" title={m.name}>
              {m.profile_picture ? <img src={`${API_BASE}${m.profile_picture}`} alt="" className="w-full h-full object-cover" /> : initials(m.name)}
            </div>
          ))}
          {members.length > 8 && <div className="w-8 h-8 rounded-full border-2 border-white bg-green-50 flex items-center justify-center text-[9px] font-bold text-green-600">+{members.length - 8}</div>}
        </div>
      )}
      {members.length === 0 && (
        <div className="px-4 pb-3 flex items-center gap-2 text-gray-300">
          <span className="text-2xl">😴</span>
          <span className="text-[11px]">Team members will appear here during their shift hours</span>
        </div>
      )}
      {expanded && members.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50 max-h-64 overflow-y-auto">
          {members.map(m => (
            <div key={m.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-green-50/50 transition">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-green-100 flex items-center justify-center text-[9px] font-bold text-green-700 shrink-0 border border-green-200">
                {m.profile_picture ? <img src={`${API_BASE}${m.profile_picture}`} alt="" className="w-full h-full object-cover" /> : initials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                <p className="text-[10px] text-gray-400">online till <span className="font-semibold text-green-600">{m.shift_end}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
