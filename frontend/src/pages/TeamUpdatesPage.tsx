import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import WMQYTimelineFilter from '../components/WMQYTimelineFilter';

interface MonthlyReport {
  user_id: number;
  user_name: string;
  user_login: string;
  month: string;
  total_hours: number;
  entries: Array<{ id: number; date: string; start_time: string; end_time: string; hours: number; ot_type: string; status: string }>;
  is_delivered: boolean;
  is_viewed: boolean;
  is_downloaded: boolean;
}

export default function TeamUpdatesPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReport, setViewingReport] = useState<MonthlyReport | null>(null);
  const [period, setPeriod] = useState('M');
  const [subFilter, setSubFilter] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try { setReports((await api.get('/api/ot/monthly-reports')).data); }
    catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const handleFilterChange = (p: string, sf: number, y: number) => { setPeriod(p); setSubFilter(sf); setYear(y); };

  const formatMonth = (m: string) => {
    const [y, mn] = m.split('-');
    return new Date(parseInt(y), parseInt(mn) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const filteredReports = reports.filter(r => {
    if (period === 'M') return r.month === `${year}-${String(subFilter).padStart(2, '0')}`;
    if (period === 'Q') {
      const rm = parseInt(r.month.split('-')[1]);
      const qs = (subFilter - 1) * 3 + 1;
      return r.month.startsWith(`${year}`) && rm >= qs && rm < qs + 3;
    }
    if (period === 'Y') return r.month.startsWith(`${year}`);
    // Weekly — match month of that week
    const soy = new Date(year, 0, 1);
    const wd = new Date(soy.getTime() + (subFilter - 1) * 7 * 86400000);
    const wm = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}`;
    return r.month === wm;
  }).filter(r =>
    searchQuery === '' ||
    r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (report: MonthlyReport) => {
    try {
      const res = await api.get(`/api/ot/download-report/${report.user_id}/${report.month}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `OT_Report_${report.user_name.replace(' ', '_')}_${report.month}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      toast.success('Downloaded'); loadReports();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleView = async (report: MonthlyReport) => {
    setViewingReport(report);
    try { await api.post(`/api/ot/mark-viewed/${report.user_id}/${report.month}`, {}); loadReports(); }
    catch { /* silent */ }
  };

  const handleDownloadAll = async () => {
    try {
      let monthParam = '';
      if (period === 'M') monthParam = `?month=${year}-${String(subFilter).padStart(2, '0')}`;
      const res = await api.get(`/api/ot/download-all-reports${monthParam}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `OT_Reports.zip`);
      document.body.appendChild(link); link.click(); link.remove();
      toast.success('All reports downloaded');
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">OT/Leave Reports</h1>
        <p className="text-gray-500 text-sm mt-1">View and download monthly reports</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input type="text" placeholder="Search by name or login ID..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        <WMQYTimelineFilter onFilterChange={handleFilterChange} defaultPeriod="M" defaultYear={year} />
        <button onClick={handleDownloadAll} disabled={filteredReports.length === 0}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 font-medium">
          📦 Download All
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            {['Login', 'Employee', 'Month', 'Total Hours', 'Entries', 'Status', 'Actions'].map(h =>
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReports.map(r => (
              <tr key={`${r.user_id}_${r.month}`}>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{r.user_login}</td>
                <td className="px-6 py-4 text-sm font-medium">{r.user_name}</td>
                <td className="px-6 py-4 text-sm">{formatMonth(r.month)}</td>
                <td className="px-6 py-4 text-sm font-semibold">{r.total_hours.toFixed(1)}</td>
                <td className="px-6 py-4 text-sm">{r.entries.length}</td>
                <td className="px-6 py-4 text-sm">
                  {r.is_delivered ? (
                    r.is_viewed
                      ? <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Seen</span>
                      : <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Arrived</span>
                  ) : <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Pending</span>}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => handleView(r)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">View</button>
                    <button onClick={() => handleDownload(r)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs">Download</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReports.length === 0 && <div className="text-center py-12 text-gray-500">No OT reports available</div>}
      </div>

      {/* Excel Viewer Modal */}
      {viewingReport && (
        <OTExcelViewer report={viewingReport} onClose={() => setViewingReport(null)}
          onDownload={() => handleDownload(viewingReport)} formatMonth={formatMonth} />
      )}
    </div>
  );
}

/* Step 3b: Excel Viewer Modal */
function OTExcelViewer({ report, onClose, onDownload, formatMonth }: {
  report: MonthlyReport; onClose: () => void; onDownload: () => void; formatMonth: (m: string) => string;
}) {
  const [activeSheet, setActiveSheet] = useState<'OT' | 'NSA' | 'ASA'>('OT');
  const otEntries = report.entries.filter(e => e.ot_type === 'OT');
  const nsaEntries = report.entries.filter(e => e.ot_type === 'NSA');
  const asaEntries = report.entries.filter(e => e.ot_type === 'ASA');
  const sheetData: Record<string, typeof report.entries> = { OT: otEntries, NSA: nsaEntries, ASA: asaEntries };
  const entries = sheetData[activeSheet];
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);

  const headers = activeSheet === 'OT'
    ? ['Employee ID', 'Name', 'Login', 'Date', 'Start Time of the OT', 'End Time of the OT', 'Number of Hours']
    : ['Employee ID', 'Name', 'Login', 'Date', 'Start Time of the Shift', 'End Time of the Shift', 'Number of Hours'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="bg-[#217346] text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg font-semibold">OT Report - {report.user_name}</h2>
              <p className="text-xs text-green-200">{formatMonth(report.month)} • {report.user_login}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-green-200 text-2xl">×</button>
        </div>

        {/* Summary ribbon */}
        <div className="bg-[#f3f3f3] border-b border-gray-300 px-6 py-2 flex gap-6 text-sm">
          <span>OT: <b className="text-blue-700">{otEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h</b> ({otEntries.length})</span>
          <span>NSA: <b className="text-purple-700">{nsaEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h</b> ({nsaEntries.length})</span>
          <span>ASA: <b className="text-green-700">{asaEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h</b> ({asaEntries.length})</span>
          <span className="ml-auto font-semibold">Total: {report.total_hours.toFixed(1)} hours</span>
        </div>

        {/* Sheet tabs */}
        <div className="bg-[#e6e6e6] flex items-end px-2 pt-1 border-b border-gray-400">
          {(['OT', 'NSA', 'ASA'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveSheet(tab)}
              className={`px-5 py-2 text-sm font-medium border border-b-0 rounded-t-md mr-1 transition ${
                activeSheet === tab ? 'bg-white border-gray-400 text-gray-900 -mb-px z-10' : 'bg-[#d9d9d9] border-gray-300 text-gray-600 hover:bg-[#e8e8e8]'
              }`}>
              {tab} <span className="ml-1 text-xs text-gray-500">({sheetData[tab].length})</span>
            </button>
          ))}
        </div>

        {/* Spreadsheet */}
        <div className="flex-1 overflow-auto bg-white">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-2">📭</p><p>No {activeSheet} entries</p></div>
          ) : (
            <table className="w-full border-collapse">
              <thead><tr>
                <th className="bg-[#4472C4] text-white px-4 py-2 text-left text-xs font-semibold border border-[#3a63a8]">#</th>
                {headers.map(h => <th key={h} className="bg-[#4472C4] text-white px-4 py-2 text-left text-xs font-semibold border border-[#3a63a8] whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#D9E2F3]'}>
                    <td className="px-4 py-2 text-sm border border-gray-200 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm border border-gray-200">-</td>
                    <td className="px-4 py-2 text-sm border border-gray-200">{report.user_name}</td>
                    <td className="px-4 py-2 text-sm border border-gray-200 font-mono">{report.user_login}</td>
                    <td className="px-4 py-2 text-sm border border-gray-200">{new Date(e.date).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                    <td className="px-4 py-2 text-sm border border-gray-200">{e.start_time}</td>
                    <td className="px-4 py-2 text-sm border border-gray-200">{e.end_time}</td>
                    <td className="px-4 py-2 text-sm border border-gray-200 font-semibold">{e.hours}</td>
                  </tr>
                ))}
                <tr className="bg-[#f2f2f2] font-bold">
                  <td className="px-4 py-2 text-sm border border-gray-300" colSpan={7} style={{ textAlign: 'right' }}>TOTAL</td>
                  <td className="px-4 py-2 text-sm border border-gray-300 font-bold text-blue-700">{totalHours.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f3f3f3] border-t border-gray-300 px-6 py-3 flex justify-between items-center">
          <span className="text-xs text-gray-500">Sheet: {activeSheet} • {entries.length} record(s)</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Close</button>
            <button onClick={onDownload} className="px-4 py-2 bg-[#217346] text-white rounded hover:bg-[#1a5c38] text-sm flex items-center gap-2">📥 Download Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
