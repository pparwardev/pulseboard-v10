import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave', icon: '🤒', color: 'red' },
  { value: 'annual', label: 'Annual Leave', icon: '✈️', color: 'blue' },
  { value: 'casual', label: 'Casual Leave', icon: '🏖️', color: 'yellow' },
  { value: 'other', label: 'Other', icon: '📅', color: 'gray' },
];

const getColor = (t: string) => LEAVE_TYPES.find(l => l.value === t)?.color || 'gray';
const getIcon = (t: string) => LEAVE_TYPES.find(l => l.value === t)?.icon || '📅';

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function LeaveCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveType, setLeaveType] = useState('sick');
  const [reason, setReason] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selecting, setSelecting] = useState<'from' | 'to' | null>(null);
  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => { loadLeaves(); loadTeamLeaves(); }, []);

  const loadLeaves = async () => {
    try { setLeaves((await api.get('/api/ot/upcoming-leaves')).data); } catch {}
  };

  const loadTeamLeaves = async () => {
    try { setTeamLeaves((await api.get('/api/ot/upcoming-leaves/team-announced')).data); } catch {}
  };

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // If team leaves exist on this day, toggle expand panel
    const teamOnLeave = getTeamLeavesForDay(day);
    if (teamOnLeave.length > 0 && !showForm) {
      setExpandedDate(expandedDate === dateStr ? null : dateStr);
      return;
    }
    if (!selecting && !fromDate) {
      setFromDate(dateStr);
      setSelecting('to');
    } else if (selecting === 'to' || (!selecting && fromDate && !toDate)) {
      if (dateStr < fromDate) {
        setToDate(fromDate);
        setFromDate(dateStr);
      } else {
        setToDate(dateStr);
      }
      setSelecting(null);
    } else {
      setFromDate(dateStr);
      setToDate('');
      setSelecting('to');
    }
  };

  const isInRange = (day: number) => {
    if (!fromDate) return false;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const end = toDate || fromDate;
    return dateStr >= fromDate && dateStr <= end;
  };

  const isLeaveDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.find(l => dateStr >= l.leave_date && dateStr <= (l.end_date || l.leave_date));
  };

  const getTeamLeavesForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return teamLeaves.filter(l => dateStr >= l.leave_date && dateStr <= (l.end_date || l.leave_date));
  };

  const handleSubmit = async () => {
    if (!fromDate) return toast.error('Select dates first');
    const payload = { leave_date: fromDate, end_date: toDate || fromDate, leave_type: leaveType, reason };
    try {
      if (editingId) {
        await api.put(`/api/ot/upcoming-leaves/${editingId}`, payload);
        toast.success('Leave updated');
      } else {
        await api.post('/api/ot/upcoming-leaves', payload);
        toast.success('Leave submitted');
      }
      resetForm(); loadLeaves();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleAnnounce = async (id: number) => {
    try { await api.post(`/api/ot/upcoming-leaves/${id}/announce`, {}); toast.success('Announced to team & manager!'); loadLeaves(); }
    catch { toast.error('Failed to announce'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this leave?')) return;
    try { await api.delete(`/api/ot/upcoming-leaves/${id}`); toast.success('Deleted'); loadLeaves(); loadTeamLeaves(); }
    catch { toast.error('Failed'); }
  };

  const handleCancelLeave = async (id: number) => {
    if (!confirm('Cancel this announced leave? Team will be notified.')) return;
    try { await api.post(`/api/ot/upcoming-leaves/${id}/cancel`, {}); toast.success('Leave cancelled & team notified'); loadLeaves(); loadTeamLeaves(); }
    catch { toast.error('Failed to cancel'); }
  };

  const handleEdit = (l: any) => {
    setFromDate(l.leave_date);
    setToDate(l.end_date || l.leave_date);
    setLeaveType(l.leave_type);
    setReason(l.reason || '');
    setEditingId(l.id);
    setShowForm(true);
    const d = new Date(l.leave_date);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };

  const resetForm = () => {
    setFromDate(''); setToDate(''); setLeaveType('sick'); setReason(''); setEditingId(null); setShowForm(false); setSelecting(null);
  };

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };

  const totalDays = daysInMonth(currentYear, currentMonth);
  const startDay = firstDayOfMonth(currentYear, currentMonth);
  const today = fmt(new Date());

  const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
  const filteredLeaves = leaves.filter(l => {
    const start = l.leave_date;
    const end = l.end_date || l.leave_date;
    return start <= monthEnd && end >= monthStart;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📅 Leave Calendar</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
          {showForm ? '✕ Cancel' : '+ Submit Leave'}
        </button>
      </div>

      <div className="flex gap-4 items-start">

      {/* LEFT PANEL - My Leaves */}
      <div className="w-1/4 flex flex-col min-w-0 bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="text-sm font-bold text-white">📋 My Leaves</h2>
        </div>
        <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {filteredLeaves.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">No leaves in {MONTHS[currentMonth]}</div>
          ) : (
            filteredLeaves.map(l => {
              const c = getColor(l.leave_type);
              return (
                <div key={l.id} className={`rounded-lg border-l-4 border-${c}-500 p-3 bg-gray-50`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium bg-${c}-100 text-${c}-700`}>
                      {getIcon(l.leave_type)} {l.leave_type.charAt(0).toUpperCase() + l.leave_type.slice(1)}
                    </span>
                    {l.is_announced && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Announced</span>}
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {new Date(l.leave_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {l.end_date && l.end_date !== l.leave_date && (
                      <span className="text-xs font-normal text-gray-500"> → {new Date(l.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    )}
                  </div>
                  {l.reason && <p className="text-xs text-gray-600 mt-1">{l.reason}</p>}
                  <div className="flex gap-2 mt-2 items-center">
                    {l.is_announced ? (
                      <span onClick={() => handleCancelLeave(l.id)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer underline">
                        cancel leave
                      </span>
                    ) : (
                      <>
                        <button onClick={() => handleAnnounce(l.id)} className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium">
                          📢 Announce
                        </button>
                        <button onClick={() => handleEdit(l)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">✏️</button>
                        <button onClick={() => handleDelete(l.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MIDDLE PANEL - Calendar */}
      <div className="w-1/2 flex flex-col min-w-0">

      {/* Submit Leave Form - Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl shadow-xl border p-5 w-full max-w-lg mx-4">
          <h2 className="text-lg font-semibold mb-4">{editingId ? '✏️ Edit Leave' : '📝 Submit Leave'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={toDate || fromDate} onChange={e => setToDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter reason..." className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {editingId ? 'Update Leave' : 'Submit Leave'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 Click dates on calendar to select range</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <button onClick={prevMonth} className="p-2 hover:bg-white/20 rounded-lg text-xl">◀</button>
          <h2 className="text-xl font-bold">{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-white/20 rounded-lg text-xl">▶</button>
        </div>

        <div className="grid grid-cols-7">
          {DAYS.map(d => <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 bg-gray-50 border-b">{d}</div>)}

          {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="h-20 border-b border-r border-gray-100" />)}

          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const inRange = isInRange(day);
            const leaveInfo = isLeaveDay(day);
            const isFrom = dateStr === fromDate;
            const isTo = dateStr === (toDate || fromDate);

            return (
              <div key={day} onClick={(e) => handleDayClick(day, e)}
                className={`h-24 border-b border-r border-gray-100 p-1 cursor-pointer transition-all hover:bg-blue-50 relative
                  ${inRange ? 'bg-blue-100' : ''} ${isFrom || isTo ? 'bg-blue-200 ring-2 ring-blue-500 ring-inset' : ''}
                  ${expandedDate === dateStr ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}>
                <span className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                  {day}
                </span>
                {/* Team member avatars */}
                {(() => {
                  const teamOnLeave = getTeamLeavesForDay(day);
                  return teamOnLeave.length > 0 && (
                    <div className="flex -space-x-2 mt-1">
                      {teamOnLeave.slice(0, 3).map((tl: any, idx: number) => (
                        <div key={tl.id} className="relative group" style={{ zIndex: 3 - idx }}>
                          {tl.profile_picture ? (
                            <img src={`${tl.profile_picture}`} alt={tl.user_name}
                              className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                              {tl.user_name?.charAt(0)}
                            </div>
                          )}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                            <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                              {tl.user_name} • {tl.leave_type}
                            </div>
                          </div>
                        </div>
                      ))}
                      {teamOnLeave.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 text-[10px] font-bold flex items-center justify-center border-2 border-white" style={{ zIndex: 0 }}>
                          +{teamOnLeave.length - 3}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {leaveInfo && (
                  <div className={`absolute bottom-1 left-1 right-1 text-[10px] px-1 py-0.5 rounded truncate font-medium
                    ${leaveInfo.is_announced ? 'bg-green-100 text-green-700' : `bg-${getColor(leaveInfo.leave_type)}-100 text-${getColor(leaveInfo.leave_type)}-700`}`}>
                    {getIcon(leaveInfo.leave_type)} {leaveInfo.leave_type}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      </div>{/* end middle */}

      {/* RIGHT PANEL - Team Leave Details */}
      <div className="w-1/4 flex flex-col min-w-0 bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-blue-600">
          <h2 className="text-sm font-bold text-white">👥 Team Leave Details</h2>
          {expandedDate && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-white/80">
                📋 {new Date(expandedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <button onClick={() => setExpandedDate(null)} className="text-white/70 hover:text-white text-xs">✕</button>
            </div>
          )}
        </div>
        {expandedDate ? (() => {
          const dayNum = parseInt(expandedDate.split('-')[2]);
          const teamOnLeave = getTeamLeavesForDay(dayNum);
          if (teamOnLeave.length === 0) return <div className="p-8 text-center text-gray-400 text-sm">No one on leave</div>;
          return (
            <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
              <p className="text-xs text-gray-500 font-medium px-1">{teamOnLeave.length} team member{teamOnLeave.length > 1 ? 's' : ''} on leave</p>
              {teamOnLeave.map((tl: any) => (
                <div key={tl.id} className="flex items-center gap-3 rounded-lg px-3 py-3 bg-gray-50 border hover:shadow-sm transition-shadow">
                  {tl.profile_picture ? (
                    <img src={`${tl.profile_picture}`} alt={tl.user_name}
                      className="w-10 h-10 rounded-full border-2 border-purple-200 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center justify-center border-2 border-purple-200">
                      {tl.user_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{tl.user_name}</p>
                    <p className="text-xs text-gray-500">{tl.employee_id}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-${getColor(tl.leave_type)}-100 text-${getColor(tl.leave_type)}-700`}>
                      {getIcon(tl.leave_type)} {tl.leave_type.charAt(0).toUpperCase() + tl.leave_type.slice(1)}
                    </span>
                    {tl.end_date && tl.end_date !== tl.leave_date && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(tl.leave_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} → {new Date(tl.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })() : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6" style={{ minHeight: '200px' }}>
            <div className="text-4xl mb-2 opacity-40">📋</div>
            <p className="text-xs font-medium text-gray-500">Click a date with avatars</p>
            <p className="text-[10px] text-gray-400 mt-1">to see team leave details</p>
          </div>
        )}
      </div>{/* end right */}

      </div>{/* end 3-col flex */}
    </div>
  );
}
