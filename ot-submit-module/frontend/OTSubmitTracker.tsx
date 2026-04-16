/**
 * OT Submit Module - Embeddable React Component
 *
 * Features (all preserved from original):
 * - Submit OT / NSA / ASA with date, start time, hours (auto end-time)
 * - Edit & delete pending submissions
 * - OT table with Employee ID, Name, Login, Shift Type, Date, Times, Hours, Status
 * - W/M/Q/Y timeline filter
 * - OT Champions leaderboard (last month, with profile pictures)
 * - Send to Manager (marks as delivered + notification)
 * - Download Excel report (OT/NSA/ASA sheets)
 * - Summary cards: Total OT Hours, NSA Days, ASA Days
 *
 * Prerequisites: React 18+, TypeScript, Tailwind CSS, axios, react-hot-toast
 *
 * Usage:
 *   import OTSubmitTracker from './OTSubmitTracker';
 *   <OTSubmitTracker
 *     apiBaseUrl="http://localhost:8001"
 *     getAuthToken={() => sessionStorage.getItem('token') || ''}
 *   />
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios, { type AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

// ─── Props ───────────────────────────────────────────────────────────────────

interface OTSubmitTrackerProps {
  apiBaseUrl: string;
  getAuthToken: () => string;
  /** Profile picture base URL. Defaults to apiBaseUrl */
  profilePictureBaseUrl?: string;
  /** API route prefix. Defaults to "/api/ot" */
  apiPrefix?: string;
  /** Function to get current user object (needs .id). Defaults to reading sessionStorage('user') */
  getCurrentUser?: () => { id: number; [k: string]: any };
}

// ─── Inline Timeline Filter ──────────────────────────────────────────────────

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil((days + start.getDay() + 1) / 7);
};

function TimelineFilter({ onFilterChange }: { onFilterChange: (p: string, sf: number, y: number) => void }) {
  const [period, setPeriod] = useState('W');
  const [year, setYear] = useState(new Date().getFullYear());
  const [subFilter, setSubFilter] = useState(getCurrentWeek());
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const options = () => {
    if (period === 'W') return Array.from({ length: 52 }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }));
    if (period === 'M') return ['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => ({ value: i + 1, label: m }));
    if (period === 'Q') return [{ value: 1, label: 'Q1 (Jan-Mar)' }, { value: 2, label: 'Q2 (Apr-Jun)' }, { value: 3, label: 'Q3 (Jul-Sep)' }, { value: 4, label: 'Q4 (Oct-Dec)' }];
    return [];
  };

  const changePeriod = (p: string) => {
    const def = p === 'W' ? getCurrentWeek() : p === 'M' ? new Date().getMonth() + 1 : 1;
    setPeriod(p); setSubFilter(def); onFilterChange(p, def, year);
  };

  return (
    <div className="flex gap-2">
      <select value={period} onChange={e => changePeriod(e.target.value)} className="px-4 py-2 border rounded-lg bg-white shadow-sm">
        <option value="W">Weekly</option><option value="M">Monthly</option><option value="Q">Quarterly</option><option value="Y">Yearly</option>
      </select>
      {period !== 'Y' && (
        <select value={subFilter} onChange={e => { const v = parseInt(e.target.value); setSubFilter(v); onFilterChange(period, v, year); }} className="px-4 py-2 border rounded-lg bg-white shadow-sm">
          {options().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      <select value={year} onChange={e => { const v = parseInt(e.target.value); setYear(v); onFilterChange(period, subFilter, v); }} className="px-4 py-2 border rounded-lg bg-white shadow-sm">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OTSubmitTracker({
  apiBaseUrl,
  getAuthToken,
  profilePictureBaseUrl,
  apiPrefix = '/api/ot',
  getCurrentUser,
}: OTSubmitTrackerProps) {
  const picBase = profilePictureBaseUrl || apiBaseUrl;
  const getUser = getCurrentUser || (() => JSON.parse(sessionStorage.getItem('user') || '{}'));

  const api: AxiosInstance = useMemo(() => {
    const inst = axios.create({ baseURL: apiBaseUrl, headers: { 'Content-Type': 'application/json' } });
    inst.interceptors.request.use(config => {
      const token = getAuthToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return inst;
  }, [apiBaseUrl, getAuthToken]);

  // ─── State ───────────────────────────────────────────────────────────

  const [period, setPeriod] = useState('W');
  const [subFilter, setSubFilter] = useState(getCurrentWeek());
  const [year, setYear] = useState(new Date().getFullYear());
  const [otSubmissions, setOtSubmissions] = useState<any[]>([]);
  const [otChampions, setOtChampions] = useState<{ month: string; leaderboard: any[] }>({ month: '', leaderboard: [] });
  const [showOtForm, setShowOtForm] = useState(false);
  const [editingOtId, setEditingOtId] = useState<number | null>(null);
  const [showSubmitDropdown, setShowSubmitDropdown] = useState(false);
  const [otForm, setOtForm] = useState({ date: '', startTime: '', endTime: '', hours: '', type: 'OT' });

  // ─── Data Loading ────────────────────────────────────────────────────

  const loadOT = useCallback(async () => {
    try { setOtSubmissions((await api.get(`${apiPrefix}/my-submissions-full`)).data); }
    catch { toast.error('Failed to load OT'); }
  }, [api, apiPrefix]);

  const loadChampions = useCallback(async () => {
    try { setOtChampions((await api.get(`${apiPrefix}/ot-champions`)).data); } catch {}
  }, [api, apiPrefix]);

  useEffect(() => { loadOT(); loadChampions(); }, [loadOT, loadChampions]);

  // ─── Timeline Filter ────────────────────────────────────────────────

  const handleFilterChange = (p: string, sf: number, y: number) => { setPeriod(p); setSubFilter(sf); setYear(y); };

  const filterByTimeline = (items: any[]) => {
    return items.filter(item => {
      if (!item.is_delivered) return true;
      const d = new Date(item.date);
      if (d.getFullYear() !== year) return false;
      if (period === 'W') {
        const soy = new Date(year, 0, 1);
        const days = Math.floor((d.getTime() - soy.getTime()) / (1000 * 60 * 60 * 24));
        return Math.ceil((days + soy.getDay() + 1) / 7) === subFilter;
      }
      if (period === 'M') return d.getMonth() + 1 === subFilter;
      if (period === 'Q') return Math.ceil((d.getMonth() + 1) / 3) === subFilter;
      return true;
    });
  };

  const filteredOT = filterByTimeline(otSubmissions);
  const totalOTHours = filteredOT.filter(o => o.ot_type === 'OT').reduce((s: number, o: any) => s + o.hours, 0);
  const totalNSA = filteredOT.filter(o => o.ot_type === 'NSA').length;
  const totalASA = filteredOT.filter(o => o.ot_type === 'ASA').length;

  // ─── Helpers ─────────────────────────────────────────────────────────

  const autoEndTime = (startTime: string, hours: string) => {
    if (!startTime || !hours) return '';
    const [h, m] = startTime.split(':').map(Number);
    const t = h * 60 + m + parseFloat(hours) * 60;
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };

  const getMonth = () => {
    if (period === 'M') return `${year}-${String(subFilter).padStart(2, '0')}`;
    if (period === 'W') {
      const soy = new Date(year, 0, 1);
      const wd = new Date(soy.getTime() + (subFilter - 1) * 7 * 86400000);
      return `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}`;
    }
    if (period === 'Q') return `${year}-${String((subFilter - 1) * 3 + 1).padStart(2, '0')}`;
    return `${year}-01`;
  };

  // ─── Handlers ────────────────────────────────────────────────────────

  const submitOT = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date: new Date(otForm.date).toISOString(), start_time: otForm.startTime,
        end_time: otForm.endTime, hours: parseFloat(otForm.hours), ot_type: otForm.type, reason: otForm.type
      };
      if (editingOtId) {
        await api.put(`${apiPrefix}/update/${editingOtId}`, payload);
        toast.success('OT updated');
      } else {
        await api.post(`${apiPrefix}/submit`, payload);
        toast.success('OT submitted');
      }
      setShowOtForm(false); setEditingOtId(null);
      setOtForm({ date: '', startTime: '', endTime: '', hours: '', type: 'OT' }); loadOT();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleEdit = (ot: any) => {
    setEditingOtId(ot.id);
    setOtForm({ date: new Date(ot.date).toISOString().split('T')[0], startTime: ot.start_time, endTime: ot.end_time, hours: ot.hours.toString(), type: ot.ot_type });
    setShowOtForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    try { await api.delete(`${apiPrefix}/delete/${id}`); toast.success('Deleted'); loadOT(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleSendToManager = async () => {
    try {
      const user = getUser();
      await api.post(`${apiPrefix}/send-to-manager/${user.id}/${getMonth()}`, {});
      toast.success('Report sent to manager'); loadOT();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleDownloadReport = async () => {
    try {
      const user = getUser();
      const res = await api.get(`${apiPrefix}/download-report/${user.id}/${getMonth()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `${user.login || user.name}_${getMonth()}_OT.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      toast.success('Report downloaded');
    } catch { toast.error('Failed to download report'); }
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">OT / Leave Tracker</h1>
        <TimelineFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Champion of OT */}
      {otChampions.leaderboard.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-sm border border-amber-200 p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">🏆 Champion of OT — {otChampions.month}</h3>
          <p className="text-xs text-gray-500 mb-4">Last month's top OT contributors</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {otChampions.leaderboard.map((c: any, i: number) => (
              <div key={c.user_id} className={`flex-shrink-0 flex items-center gap-3 rounded-lg px-4 py-3 border ${
                i === 0 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-amber-300 ring-2 ring-amber-400' :
                i === 1 ? 'bg-gray-50 border-gray-300' :
                i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
              }`}>
                <span className="text-xl font-bold">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                {c.profile_picture ? (
                  <img src={`${picBase}${c.profile_picture}`} alt={c.name}
                    className="w-10 h-10 rounded-full border-2 border-white shadow object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center border-2 border-white shadow">
                    {c.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.total_hours} hrs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button onClick={() => setShowSubmitDropdown(!showSubmitDropdown)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            + Submit ▼
          </button>
          {showSubmitDropdown && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {['OT', 'NSA', 'ASA'].map(type => (
                <button key={type} onClick={() => { setOtForm({ ...otForm, type }); setEditingOtId(null); setShowOtForm(true); setShowSubmitDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 first:rounded-t-lg last:rounded-b-lg">
                  Submit {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OT Form */}
      {showOtForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{editingOtId ? 'Edit' : 'Submit'} {otForm.type}</h2>
            <button onClick={() => { setShowOtForm(false); setEditingOtId(null); setOtForm({ date: '', startTime: '', endTime: '', hours: '', type: 'OT' }); }} className="text-gray-500 text-2xl">×</button>
          </div>
          <form onSubmit={submitOT} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Type</label><input type="text" value={otForm.type} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={otForm.date} onChange={e => setOtForm({ ...otForm, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Hours</label>
                <input type="number" step="0.5" min="0.5" max="24" value={otForm.hours}
                  onChange={e => { const h = e.target.value; setOtForm(prev => ({ ...prev, hours: h, endTime: autoEndTime(prev.startTime, h) })); }}
                  className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="time" value={otForm.startTime}
                  onChange={e => { const st = e.target.value; setOtForm(prev => ({ ...prev, startTime: st, endTime: autoEndTime(st, prev.hours) })); }}
                  className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">End Time</label><input type="time" value={otForm.endTime} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingOtId ? 'Update' : 'Submit'} {otForm.type}</button>
          </form>
        </div>
      )}

      {/* OT Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>
              {['Employee ID', 'Name', 'Login', 'Shift Type', 'Date', 'Start Time', 'End Time', 'Number of Hours', 'Status', 'Actions'].map(h =>
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOT.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4 text-sm">{ot.employee_id}</td>
                  <td className="px-6 py-4 text-sm">{ot.user_name}</td>
                  <td className="px-6 py-4 text-sm">{ot.login}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${ot.ot_type === 'OT' ? 'bg-blue-100 text-blue-800' : ot.ot_type === 'NSA' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{ot.ot_type}</span></td>
                  <td className="px-6 py-4 text-sm">{new Date(ot.date).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                  <td className="px-6 py-4 text-sm">{ot.start_time}</td>
                  <td className="px-6 py-4 text-sm">{ot.end_time}</td>
                  <td className="px-6 py-4 text-sm">{ot.hours}</td>
                  <td className="px-6 py-4">
                    {ot.is_delivered
                      ? <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Delivered</span>
                      : <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Pending</span>}
                  </td>
                  <td className="px-6 py-4">
                    {!ot.is_delivered ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(ot)} className="text-blue-600 hover:text-blue-800">✏️</button>
                        <button onClick={() => handleDelete(ot.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                      </div>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOT.length === 0 && <div className="text-center py-12 text-gray-500">No OT submissions for this period</div>}
      </div>

      {/* OT Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{period === 'W' ? 'Weekly' : period === 'M' ? 'Monthly' : period === 'Q' ? 'Quarterly' : 'Yearly'} OT Summary</h3>
          <div className="flex gap-2">
            <button onClick={handleSendToManager} disabled={filteredOT.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              📤 Send to Manager
            </button>
            <button onClick={handleDownloadReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              📥 Download Report
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4"><p className="text-sm text-gray-500">Total OT Hours</p><p className="text-3xl font-bold text-blue-600">{totalOTHours}</p><p className="text-xs text-gray-500 mt-1">hours</p></div>
          <div className="bg-purple-50 rounded-lg p-4"><p className="text-sm text-gray-500">NSA Days</p><p className="text-3xl font-bold text-purple-600">{totalNSA}</p><p className="text-xs text-gray-500 mt-1">days</p></div>
          <div className="bg-green-50 rounded-lg p-4"><p className="text-sm text-gray-500">ASA Days</p><p className="text-3xl font-bold text-green-600">{totalASA}</p><p className="text-xs text-gray-500 mt-1">days</p></div>
        </div>
      </div>
    </div>
  );
}
