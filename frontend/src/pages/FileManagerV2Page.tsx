import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface FileItem {
  id: number;
  name: string;
  size: number;
  type: string;
  metric_code?: string;
  week_label?: string;
  uploaded_at: string;
  url: string;
}

const API = '/api/fm2';

export default function FileManagerV2Page() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [filterWeek, setFilterWeek] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [excelSheets, setExcelSheets] = useState<{[k:string]:any[][]}>({});
  const [activeSheet, setActiveSheet] = useState('');
  const [excelPage, setExcelPage] = useState(0);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [publishedFiles, setPublishedFiles] = useState<any[]>([]);
  const [missedResult, setMissedResult] = useState<any>(null);
  const [processResult, setProcessResult] = useState<any>(null);
  const ROWS_PER_PAGE = 100;
  const navigate = useNavigate();

  useEffect(() => { loadFiles(); loadMetrics(); loadPublished(); }, []);

  const loadFiles = async () => {
    try {
      const r = await api.get(`${API}/files`);
      setFiles(r.data || []);
    } catch { toast.error('Failed to load files'); }
  };
  const loadMetrics = async () => {
    try {
      const r = await api.get('/api/team-metrics/finalized');
      if (r.data?.[0]?.metrics) setMetrics(r.data[0].metrics);
    } catch {}
  };
  const loadPublished = async () => {
    try {
      const r = await api.get(`${API}/published-files`);
      setPublishedFiles(r.data || []);
    } catch {}
  };

  const uploadFile = async (file: File): Promise<FileItem | null> => {
    try {
      const buf = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const r = await api.post(`${API}/upload`, {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        data: b64,
        metric_code: selectedMetric || null,
        week_label: selectedWeek || null,
      });
      if (r.data?.id) return r.data as FileItem;
      toast.error('Upload failed - invalid response');
      return null;
    } catch (e: any) {
      toast.error(`Failed: ${e?.response?.data?.detail || e.message}`);
      return null;
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const arr = Array.from(e.target.files);
    setLoading(true);
    let count = 0;
    for (const f of arr) {
      const r = await uploadFile(f);
      if (r) count++;
    }
    if (count > 0) {
      toast.success(`${count} file(s) uploaded!`);
      setSelectedMetric('');
      setFilterWeek('');
    }
    await loadFiles();
    setLoading(false);
    e.target.value = '';
  };

  const deleteFile = async (id: number) => {
    try { await api.delete(`${API}/delete/${id}`); await loadFiles(); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const handlePreview = async (file: FileItem) => {
    setPreviewFile(file);
    setExcelSheets({});
    setActiveSheet('');
    setExcelPage(0);
    setMissedResult(null);
    setProcessResult(null);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    if (isExcel) {
      try {
        const token = sessionStorage.getItem('token');
        const resp = await fetch(file.url, { headers: { Authorization: `Bearer ${token}` } });
        const ab = await resp.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array', sheetRows: 1000 });
        const sheets: {[k:string]:any[][]} = {};
        wb.SheetNames.forEach(n => {
          sheets[n] = (XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' }) as any[][]).slice(0, 1000);
        });
        setExcelSheets(sheets);
        setActiveSheet(wb.SheetNames[0]);
      } catch { toast.error('Failed to load Excel'); }
    }
  };

  const getWeekOptions = () => {
    const now = new Date(), y = now.getFullYear();
    const s = new Date(y, 0, 1);
    const cw = Math.ceil(((now.getTime() - s.getTime()) / 86400000 + s.getDay() + 1) / 7);
    return Array.from({ length: 9 }, (_, i) => `Week ${cw - i} - ${y}`).filter(w => !w.includes('Week 0'));
  };

  const fmt = (b: number) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(1) + ' MB';
  const icon = (t: string = '', n: string = '') => {
    if (n.endsWith('.pdf')) return '📕';
    if (t.includes('excel') || t.includes('sheet') || n.endsWith('.xlsx')) return '📗';
    return '📄';
  };

  const filtered = files.filter(f => {
    if (selectedMetric && f.metric_code !== selectedMetric) return false;
    if (filterWeek && f.week_label !== filterWeek) return false;
    return true;
  });
  const weekLabels = [...new Set(files.map(f => f.week_label).filter(Boolean))] as string[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Manager V2</h1>
          <p className="text-gray-500 mt-1">Upload & manage files (base64)</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
          <span className="text-sm text-gray-500">Total Files: </span>
          <span className="font-bold text-gray-900">{files.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 items-start">
        {/* Metrics */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col" style={{ height: 400 }}>
          <h2 className="font-bold text-gray-900 text-sm mb-3">Select Metric Category</h2>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
            {metrics.map(m => (
              <button key={m.id} onClick={() => setSelectedMetric(m.metric_code)}
                className={`p-3 rounded-xl text-center transition hover:scale-105 ${selectedMetric === m.metric_code ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white ring-2 ring-purple-600' : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700'}`}>
                <div className="text-2xl mb-1">{m.metric_code === 'Missed' ? '📵' : '📊'}</div>
                <div className="font-semibold text-xs">{m.metric_name}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{m.metric_code} • {files.filter(f => f.metric_code === m.metric_code).length} files</div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-4 text-white shadow-xl flex flex-col" style={{ height: 400 }}>
          <div className="text-center mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-xl">📁</span></div>
            <h3 className="font-bold text-sm">{selectedMetric ? `Upload ${selectedMetric}` : 'Select Metric'}</h3>
          </div>
          <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs bg-white text-gray-900 mb-2">
            <option value="">-- Select Week --</option>
            {getWeekOptions().map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <div className="border-2 border-dashed border-white/40 rounded-xl p-4 text-center flex-1 flex flex-col items-center justify-center">
            <input type="file" id="fm2Input" className="hidden" onChange={handleFileInput} accept=".xlsx,.xls,.csv,.pdf,.doc,.docx" multiple />
            <label htmlFor="fm2Input" className="cursor-pointer">
              <div className="text-3xl mb-1">☁️</div>
              <p className="text-xs">Drop files here</p>
            </label>
          </div>
          <button onClick={() => document.getElementById('fm2Input')?.click()} disabled={loading || !selectedMetric || !selectedWeek}
            className="w-full mt-3 bg-white text-purple-600 py-2 rounded-xl font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Uploading...' : !selectedMetric ? 'Select Metric' : !selectedWeek ? 'Select Week' : 'Upload'}
          </button>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col" style={{ height: 400 }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-sm">All Files</h2>
            <button onClick={() => { setSelectedMetric(''); setFilterWeek(''); }} className="text-[10px] text-blue-600 hover:underline">See all</button>
          </div>
          <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)} className="w-full px-2 py-1 rounded-lg text-xs bg-gray-50 border mb-2">
            <option value="">All Weeks</option>
            {weekLabels.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <div className="space-y-1.5 overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-gray-400"><div className="text-3xl mb-1">📂</div><p className="text-xs">No files yet</p></div>
            ) : filtered.map(f => (
              <div key={f.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg group">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-sm">{icon(f.type, f.name)}</div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePreview(f)}>
                  <p className="font-medium text-gray-900 truncate text-[11px] hover:text-blue-600">{f.name}</p>
                  <p className="text-[10px] text-gray-500">{fmt(f.size)}{f.week_label ? ` • ${f.week_label}` : ''}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteFile(f.id); }} className="px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 rounded opacity-0 group-hover:opacity-100">🗑</button>
              </div>
            ))}
          </div>
        </div>

        {/* Published */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col" style={{ height: 400 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-sm">Published Files</h2>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{publishedFiles.length}</span>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {publishedFiles.length === 0 ? (
              <div className="text-center py-6 text-gray-400"><div className="text-3xl mb-1">✅</div><p className="text-xs">No files published yet</p></div>
            ) : publishedFiles.map((pf: any, i: number) => (
              <div key={i} className="p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="font-medium text-gray-900 truncate text-[11px]">{pf.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">{pf.metric_code}</span>
                  <span className="text-[10px] text-gray-500">{pf.weeks_published?.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">File Preview</h2>
          <div className="flex gap-2">
            {previewFile && (
              <>
                {previewFile.metric_code === 'Missed' && (
                  <>
                    <button onClick={async () => {
                      try { setLoading(true); setMissedResult(null);
                        const r = await api.post(`${API}/process-missed/${previewFile.id}`);
                        setMissedResult(r.data); toast.success('Processed!');
                      } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setLoading(false); }
                    }} disabled={loading} className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50">
                      {loading ? 'Processing...' : 'Process Missed'}
                    </button>
                    {missedResult && (
                      <button onClick={async () => {
                        try { setLoading(true);
                          const r = await api.post(`${API}/publish-missed/${previewFile.id}`);
                          toast.success(r.data.message); loadPublished();
                        } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setLoading(false); }
                      }} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm rounded-lg disabled:opacity-50">
                        🚀 Publish Missed
                      </button>
                    )}
                  </>
                )}
                <button onClick={() => { setPreviewFile(null); setMissedResult(null); setProcessResult(null); }} className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg">Close</button>
              </>
            )}
          </div>
        </div>

        {!previewFile ? (
          <div className="text-center py-12 text-gray-400"><div className="text-6xl mb-4">🔍</div><p>Click on any file to preview</p></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl">{icon(previewFile.type, previewFile.name)}</div>
              <div>
                <p className="font-semibold text-gray-900">{previewFile.name}</p>
                <p className="text-sm text-gray-500">{fmt(previewFile.size)} • {new Date(previewFile.uploaded_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Excel Preview */}
            {Object.keys(excelSheets).length > 0 && (
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="flex gap-2 border-b bg-gray-50 px-4 py-2 overflow-x-auto">
                  {Object.keys(excelSheets).map(s => (
                    <button key={s} onClick={() => { setActiveSheet(s); setExcelPage(0); }}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeSheet === s ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>{s}</button>
                  ))}
                </div>
                {excelSheets[activeSheet]?.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                    <span className="text-sm text-gray-600">Rows {excelPage * ROWS_PER_PAGE + 1}-{Math.min((excelPage+1)*ROWS_PER_PAGE, excelSheets[activeSheet].length)} of {excelSheets[activeSheet].length}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setExcelPage(p => Math.max(0, p-1))} disabled={excelPage===0} className="px-3 py-1 text-sm bg-white border rounded disabled:opacity-50">Prev</button>
                      <button onClick={() => setExcelPage(p => p+1)} disabled={(excelPage+1)*ROWS_PER_PAGE >= excelSheets[activeSheet].length} className="px-3 py-1 text-sm bg-white border rounded disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
                <div className="overflow-auto" style={{ maxHeight: 500 }}>
                  <table className="w-full border-collapse">
                    <thead><tr className="bg-gray-100 sticky top-0 z-10">
                      <th className="border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 w-12">#</th>
                      {excelSheets[activeSheet]?.[0]?.map((_: any, i: number) => (
                        <th key={i} className="border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 min-w-[100px]">{String.fromCharCode(65+i)}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {excelSheets[activeSheet]?.slice(excelPage*ROWS_PER_PAGE, (excelPage+1)*ROWS_PER_PAGE).map((row, ri) => (
                        <tr key={ri} className="hover:bg-blue-50">
                          <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600 bg-gray-50 text-center">{excelPage*ROWS_PER_PAGE+ri+1}</td>
                          {row.map((c: any, ci: number) => <td key={ci} className="border border-gray-300 px-3 py-2 text-sm">{String(c).substring(0,200)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Missed Result Table */}
            {missedResult?.specialist_data?.length > 0 && (
              <div className="border-2 border-orange-200 rounded-xl overflow-hidden">
                <div className="bg-orange-50 px-4 py-3 flex items-center gap-2">
                  <span className="text-xl">📵</span>
                  <span className="font-semibold text-orange-800">{missedResult.message} — {missedResult.total_specialists} specialists, {missedResult.total_records} records</span>
                </div>
                <div className="overflow-auto" style={{ maxHeight: 500 }}>
                  <table className="w-full border-collapse text-xs">
                    <thead><tr className="bg-gray-100 sticky top-0 z-10">
                      {['Week','Associate','Offered','Missed','Missed%','Chat Off','Chat Miss','Voice Off','Voice Miss','WI Off','WI Miss'].map(h => (
                        <th key={h} className="border border-gray-200 px-2 py-2 text-center">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {missedResult.specialist_data.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-2 py-1.5">{r.week}</td>
                          <td className="border border-gray-200 px-2 py-1.5 font-medium">{r.name || r.login}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{r.overall_offered}</td>
                          <td className={`border border-gray-200 px-2 py-1.5 text-center font-medium ${r.overall_missed > 0 ? 'text-red-600' : ''}`}>{r.overall_missed}</td>
                          <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${r.overall_missed_pct > 2 ? 'text-red-600' : 'text-green-600'}`}>{r.overall_missed_pct}%</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{r.chat_offered}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{r.chat_missed}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{r.voice_offered}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{r.voice_missed}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{r.wi_offered}</td>
                          <td className="border border-gray-200 px-2 py-1.5 text-center">{r.wi_missed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
