import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [filterWeek, setFilterWeek] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [excelSheets, setExcelSheets] = useState<{[key: string]: any[][]}>({});
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [excelPage, setExcelPage] = useState(0);
  const ROWS_PER_PAGE = 100;
  const navigate = useNavigate();
  const [processResult, setProcessResult] = useState<any>(null);
  const [missedResult, setMissedResult] = useState<any>(null);
  const [deepDiveResult, setDeepDiveResult] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfZoom, setPdfZoom] = useState<number>(1.0);
  const [publishedFiles, setPublishedFiles] = useState<any[]>([]);

  const getViewUrl = (fileId: number) => {
    const token = sessionStorage.getItem('token');
    return `/api/file-manager/view/${fileId}?token=${token}`;
  };

  const categories = [
    { name: 'Documents', icon: '📄', color: 'bg-blue-100 text-blue-600' },
    { name: 'Images', icon: '🖼️', color: 'bg-purple-100 text-purple-600' },
    { name: 'Videos', icon: '🎥', color: 'bg-red-100 text-red-600' },
    { name: 'Audio', icon: '🎵', color: 'bg-yellow-100 text-yellow-600' },
  ];

  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    loadFiles();
    loadMetrics();
    loadPublishedFiles();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await api.get('/api/team-metrics/finalized');
      if (response.data && response.data.length > 0) {
        const allMetrics = response.data[0]?.metrics || [];
        setMetrics(allMetrics);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await api.get('/api/file-manager/files');
      console.log('loadFiles response:', response.status, response.data);
      setFiles(response.data || []);
    } catch (error: any) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load file list');
    }
  };

  const loadPublishedFiles = async () => {
    try {
      const response = await api.get('/api/file-manager/published-files');
      setPublishedFiles(response.data);
    } catch (error) {
      console.error('Failed to load published files:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.xlsm', '.xlsb', '.pdf', '.doc', '.docx'];

  const isAllowedFile = (fileName: string) => {
    return ALLOWED_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const validFiles = filesArray.filter(f => isAllowedFile(f.name));
      const rejected = filesArray.length - validFiles.length;
      if (rejected > 0) toast.error(`${rejected} file(s) rejected. Only Excel, PDF & Word allowed.`);
      if (validFiles.length === 0) return;

      setLoading(true);
      const uploaded: FileItem[] = [];
      for (const file of validFiles) {
        const result = await uploadFile(file);
        if (result) uploaded.push(result);
      }
      if (uploaded.length > 0) {
        setFiles(prev => [...uploaded, ...prev]);
        setSelectedMetric('');
        setFilterWeek('');
        toast.success(`${uploaded.length} file(s) uploaded successfully!`);
      }
      await loadFiles();
      setLoading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(f => isAllowedFile(f.name));
      const rejected = filesArray.length - validFiles.length;
      if (rejected > 0) toast.error(`${rejected} file(s) rejected. Only Excel, PDF & Word allowed.`);
      if (validFiles.length === 0) return;

      setLoading(true);
      const uploaded: FileItem[] = [];
      for (const file of validFiles) {
        const result = await uploadFile(file);
        if (result) uploaded.push(result);
      }
      if (uploaded.length > 0) {
        setFiles(prev => [...uploaded, ...prev]);
        setSelectedMetric('');
        setFilterWeek('');
        toast.success(`${uploaded.length} file(s) uploaded successfully!`);
      }
      await loadFiles();
      setLoading(false);
    }
    e.target.value = '';
  };

  const loadExcelFile = async (file: FileItem) => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB limit
    const MAX_ROWS = 1000; // Limit rows per sheet
    
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Max 5MB for preview.');
      return;
    }
    
    try {
      const response = await fetch(file.url);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', sheetRows: MAX_ROWS });
      
      const sheets: {[key: string]: any[][]} = {};
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        sheets[sheetName] = (data as any[][]).slice(0, MAX_ROWS);
      });
      
      setExcelSheets(sheets);
      setActiveSheet(workbook.SheetNames[0]);
    } catch (err) {
      toast.error('Failed to load Excel file');
    }
  };

  const handlePreview = async (file: FileItem) => {
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for video
    const MAX_PREVIEW_SIZE = 50 * 1024 * 1024; // 50MB for others
    
    if (file.type.includes('video') && file.size > MAX_VIDEO_SIZE) {
      toast.error('Video too large for preview. Max 50MB.');
      return;
    }
    
    if (!file.type.includes('video') && !file.type.includes('pdf') && file.size > MAX_PREVIEW_SIZE) {
      toast.error('File too large for preview. Please download.');
      return;
    }
    
    setPreviewFile(file);
    setProcessResult(null);
    setMissedResult(null);
    setDeepDiveResult(null);
    setExcelSheets({});
    setActiveSheet('');
    setPageNumber(1);
    setImageLoaded(false);
    setExcelPage(0);
    setPdfUrl('');
    setPdfZoom(1.0);

    const isExcel = file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    const isPdf = file.type.includes('pdf') || file.name.endsWith('.pdf');

    if (isExcel || isPdf) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${file.url}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        if (isExcel) {
          loadExcelFile({ ...file, url: blobUrl });
        } else {
          setPdfUrl(blobUrl);
        }
      } catch (err) {
        toast.error('Failed to load file');
      }
    }
  };

  const uploadFile = async (file: File): Promise<FileItem | null> => {
    const params = new URLSearchParams();
    if (selectedMetric) params.append('metric_code', selectedMetric);
    if (selectedWeek) params.append('week_label', selectedWeek);

    try {
      // Convert file to base64 JSON to avoid CloudFront multipart issues
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const res = await api.post(`/api/file-manager/upload-base64?${params.toString()}`, {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        data: base64
      });
      if (res.data && typeof res.data === 'object' && res.data.id) {
        return res.data as FileItem;
      }
      console.error('Upload returned invalid data:', res.data);
      toast.error(`Upload failed - server returned invalid response`);
      return null;
    } catch (err: any) {
      console.error('Upload failed:', err?.response?.status, err?.message);
      toast.error(`Failed to upload ${file.name}`);
      throw err;
    }
  };

  const getWeekOptions = () => {
    const options: string[] = [];
    const now = new Date();
    const year = now.getFullYear();
    // Current week number
    const startOfYear = new Date(year, 0, 1);
    const currentWeek = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    // Show last 8 weeks + current week
    for (let i = currentWeek; i >= Math.max(1, currentWeek - 8); i--) {
      options.push(`Week ${i} - ${year}`);
    }
    return options;
  };

  const allWeekLabels = [...new Set(files.map(f => f.week_label).filter(Boolean))] as string[];

  const deleteFile = async (id: number) => {
    try {
      await api.delete(`/api/file-manager/delete/${id}`);
      await loadFiles();
      toast.success('File deleted');
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const processFile = async (file: FileItem) => {
    const metricCode = file.metric_code;
    if (!metricCode) {
      toast.error('This file has no metric category assigned.');
      return;
    }
    if (metricCode !== 'ACHT') {
      toast.error(`Processing code for ${metricCode} coming soon!`);
      return;
    }
    try {
      setLoading(true);
      const fileResponse = await fetch(getViewUrl(file.id));
      const blob = await fileResponse.blob();
      const formData = new FormData();
      formData.append('file', blob, file.name);
      
      const response = await api.post(`/api/metric-files/upload?metric_code=${metricCode}`, formData);
      const uploadedFileId = response.data.file_id;
      const processResponse = await api.post(`/api/metric-files/${uploadedFileId}/process?metric_code=${metricCode}`);
      setProcessResult(processResponse.data);
      toast.success('File processed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string = '', name: string = '') => {
    const t = type || '';
    if (t.includes('image')) return '🖼️';
    if (t.includes('video')) return '🎥';
    if (t.includes('audio')) return '🎵';
    if (t.includes('pdf') || name.endsWith('.pdf')) return '📕';
    if (t.includes('word') || t.includes('document')) return '📘';
    if (t.includes('excel') || t.includes('sheet')) return '📗';
    if (name.endsWith('.msg')) return '✉️';
    return '📄';
  };

  const filteredFiles = files.filter(f => {
    if (selectedMetric && f.metric_code !== selectedMetric) return false;
    if (filterWeek && f.week_label !== filterWeek) return false;
    return true;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
          <p className="text-gray-500 mt-1">Manage and organize your files</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
            <span className="text-sm text-gray-500">Total Files: </span>
            <span className="font-bold text-gray-900">{files.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 items-start">
        {/* 1. Select Metric Category */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col" style={{ height: '400px' }}>
          <h2 className="font-bold text-gray-900 text-sm mb-3">Select Metric Category</h2>
          {metrics.length === 0 ? (
            <div className="text-center py-8 text-gray-400 flex-1 flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">⚙️</div>
              <p className="text-xs mb-2">No metrics configured</p>
              <button onClick={() => navigate('/metrics-config')} className="text-xs text-blue-600 hover:underline">Configure Metrics →</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => { setSelectedMetric(metric.metric_code); setPreviewFile(null); setProcessResult(null); }}
                  className={`p-3 rounded-xl transition hover:scale-105 text-center ${
                    selectedMetric === metric.metric_code
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white ring-2 ring-purple-600'
                      : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{metric.metric_code === 'Missed' ? '📵' : '📊'}</div>
                  <div className="font-semibold text-xs">{metric.metric_name}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{metric.metric_code} • {files.filter(f => f.metric_code === metric.metric_code).length} files</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Upload Box */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-4 text-white shadow-xl flex flex-col" style={{ height: '400px' }}>
          <div className="text-center mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">📁</span>
            </div>
            <h3 className="font-bold text-sm">
              {selectedMetric ? `Upload ${selectedMetric}` : 'Select Metric'}
            </h3>
          </div>
          <div className="mb-2">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg text-xs bg-white text-gray-900 focus:outline-none"
            >
              <option value="">-- Select Week --</option>
              {getWeekOptions().map(w => (<option key={w} value={w}>{w}</option>))}
            </select>
          </div>
          <div
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition flex-1 flex flex-col items-center justify-center ${
              dragActive ? 'border-white bg-white/20' : 'border-white/40'
            }`}
          >
            <input type="file" id="fileInput" className="hidden" onChange={handleFileInput} accept=".xlsx,.xls,.csv,.xlsm,.xlsb,.pdf,.doc,.docx" multiple />
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="text-3xl mb-1">☁️</div>
              <p className="text-xs">Drop files here</p>
            </label>
          </div>
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            disabled={loading || !selectedMetric || !selectedWeek}
            className="w-full mt-3 bg-white text-purple-600 py-2 rounded-xl font-semibold text-sm hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading...' : !selectedMetric ? 'Select Metric' : !selectedWeek ? 'Select Week' : 'Upload'}
          </button>
        </div>

        {/* 3. All Files */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col" style={{ height: '400px' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-sm">All Files</h2>
            <button onClick={() => { setSelectedMetric(''); setFilterWeek(''); }} className="text-[10px] text-blue-600 hover:underline">See all</button>
          </div>
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="w-full px-2 py-1 rounded-lg text-xs bg-gray-50 border border-gray-200 focus:outline-none mb-2"
          >
            <option value="">All Weeks</option>
            {allWeekLabels.map(w => (<option key={w} value={w}>{w}</option>))}
          </select>
          <div className="space-y-1.5 overflow-y-auto flex-1">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <div className="text-3xl mb-1">📂</div>
                <p className="text-xs">No files yet</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition group">
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePreview(file)}>
                    <p className="font-medium text-gray-900 truncate text-[11px] hover:text-blue-600">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}{file.week_label ? ` • ${file.week_label}` : ''}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                    className="px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition"
                  >🗑</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Published Files */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col" style={{ height: '400px' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-sm">Published Files</h2>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{publishedFiles.length}</span>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {publishedFiles.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <div className="text-3xl mb-1">✅</div>
                <p className="text-xs">No files published yet</p>
              </div>
            ) : (
              publishedFiles.map((pf: any, i: number) => (
                <div key={i} className="p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="font-medium text-gray-900 truncate text-[11px]">{pf.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">{pf.metric_code}</span>
                    <span className="text-[10px] text-gray-500">{pf.weeks_published?.join(', ')}</span>
                  </div>
                  {pf.uploaded_at && <p className="text-[10px] text-gray-400 mt-1">{new Date(pf.uploaded_at).toLocaleDateString()}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* File Preview */}
      <div className="mt-6">
        {/* File Preview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border overflow-auto min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">File Preview</h2>
            <div className="flex gap-2">
              {previewFile && (
                <>
                  <a
                    href={getViewUrl(previewFile.id)}
                    download={previewFile.name}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    Download
                  </a>
                  {previewFile.metric_code === 'Missed' ? (
                    <>
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          setMissedResult(null);
                          const res = await api.post(`/api/file-manager/process-missed/${previewFile.id}`);
                          setMissedResult(res.data);
                          toast.success('Missed contacts processed!');
                        } catch (err: any) {
                          toast.error(err.response?.data?.detail || 'Failed to process');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      )}
                      {loading ? 'Processing...' : 'Process Team Level Missed'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          setDeepDiveResult(null);
                          const res = await api.post(`/api/file-manager/process-missed-deepdive/${previewFile.id}`);
                          setDeepDiveResult(res.data);
                          toast.success('Deep dive processed!');
                        } catch (err: any) {
                          toast.error(err.response?.data?.detail || 'Failed to process');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      )}
                      {loading ? 'Processing...' : 'Process Deep Dive Missed Contact'}
                    </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => processFile(previewFile)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading && (
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        )}
                        {loading ? 'Processing...' : `Process Team Level ${previewFile.metric_code || 'File'}`}
                      </button>
                      <button
                        onClick={() => toast('Case Level processing coming soon!')}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {`Process Case Level ${previewFile.metric_code || 'File'}`}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>

          {!previewFile ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p>Click "View" on any file to preview it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl">{getFileIcon(previewFile.type, previewFile.name)}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{previewFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(previewFile.size)} • {new Date(previewFile.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-2 border-gray-200 rounded-xl overflow-auto" style={{ maxHeight: 'calc(100vh - 520px)' }}>
                {previewFile.type.includes('image') && (
                  <div className="relative bg-gray-100">
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <img 
                      src={getViewUrl(previewFile.id)}
                      alt={previewFile.name} 
                      className="w-full h-auto max-h-[600px] object-contain"
                      loading="lazy"
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                )}

                {previewFile.type.includes('video') && (
                  <video controls className="w-full" key={previewFile.id}>
                    <source src={getViewUrl(previewFile.id)} type={previewFile.type} />
                    Your browser does not support video playback.
                  </video>
                )}

                {previewFile.type.includes('audio') && (
                  <div className="p-8 bg-gradient-to-br from-purple-50 to-blue-50">
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">🎵</div>
                      <p className="font-semibold text-gray-900">{previewFile.name}</p>
                    </div>
                    <audio controls className="w-full">
                      <source src={getViewUrl(previewFile.id)} type={previewFile.type} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {(previewFile.type.includes('pdf') || previewFile.name.endsWith('.pdf')) && (
                  <div className="bg-gray-100 p-4">
                    {pdfUrl ? (
                      <>
                        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                          <button
                            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                            disabled={pageNumber <= 1}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="text-sm font-medium">
                            Page {pageNumber} of {numPages}
                          </span>
                          <button
                            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                            disabled={pageNumber >= numPages}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                          >
                            Next
                          </button>
                          <div className="w-px h-6 bg-gray-300 mx-1" />
                          <button
                            onClick={() => setPdfZoom(z => Math.max(0.25, z - 0.25))}
                            disabled={pdfZoom <= 0.25}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 text-sm"
                            title="Zoom Out"
                          >
                            🔍−
                          </button>
                          <span className="text-sm font-medium min-w-[4rem] text-center">
                            {Math.round(pdfZoom * 100)}%
                          </span>
                          <button
                            onClick={() => setPdfZoom(z => Math.min(3, z + 0.25))}
                            disabled={pdfZoom >= 3}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 text-sm"
                            title="Zoom In"
                          >
                            🔍+
                          </button>
                          <button
                            onClick={() => setPdfZoom(1.0)}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm"
                            title="Reset Zoom"
                          >
                            Reset
                          </button>
                        </div>
                        <div className="flex justify-center overflow-auto">
                          <Document
                            file={pdfUrl}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            loading={<div className="p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>}
                          >
                            <Page
                              pageNumber={pageNumber}
                              width={Math.min(800, window.innerWidth - 100) * pdfZoom}
                            />
                          </Document>
                        </div>
                      </>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    )}
                  </div>
                )}

                {(previewFile.type.includes('sheet') || previewFile.type.includes('excel') || previewFile.name.endsWith('.xlsx') || previewFile.name.endsWith('.xls') || previewFile.name.endsWith('.csv')) && (
                  <div className="bg-white">
                    <div className="flex gap-2 border-b border-gray-300 bg-gray-50 px-4 py-2 overflow-x-auto">
                      {Object.keys(excelSheets).map((sheetName) => (
                        <button
                          key={sheetName}
                          onClick={() => { setActiveSheet(sheetName); setExcelPage(0); }}
                          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
                            activeSheet === sheetName ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {sheetName}
                        </button>
                      ))}
                    </div>
                    {excelSheets[activeSheet] && excelSheets[activeSheet].length > 0 && (
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                        <span className="text-sm text-gray-600">
                          Showing {excelPage * ROWS_PER_PAGE + 1}-{Math.min((excelPage + 1) * ROWS_PER_PAGE, excelSheets[activeSheet].length)} of {excelSheets[activeSheet].length} rows
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExcelPage(Math.max(0, excelPage - 1))}
                            disabled={excelPage === 0}
                            className="px-3 py-1 text-sm bg-white border rounded disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setExcelPage(excelPage + 1)}
                            disabled={(excelPage + 1) * ROWS_PER_PAGE >= excelSheets[activeSheet].length}
                            className="px-3 py-1 text-sm bg-white border rounded disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                      {excelSheets[activeSheet] && excelSheets[activeSheet].length > 0 ? (
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 sticky top-0 z-10">
                              <th className="border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 w-12 sticky left-0 bg-gray-100">#</th>
                              {excelSheets[activeSheet][0]?.map((_, colIndex) => (
                                <th key={colIndex} className="border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 min-w-[100px]">
                                  {String.fromCharCode(65 + colIndex)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {excelSheets[activeSheet]
                              .slice(excelPage * ROWS_PER_PAGE, (excelPage + 1) * ROWS_PER_PAGE)
                              .map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-blue-50">
                                <td className="border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-50 text-center sticky left-0">
                                  {excelPage * ROWS_PER_PAGE + rowIndex + 1}
                                </td>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-sm">
                                    {String(cell).substring(0, 200)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-12 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(previewFile.type.includes('document') || previewFile.name.endsWith('.docx') || previewFile.name.endsWith('.doc') || previewFile.name.endsWith('.ppt') || previewFile.name.endsWith('.pptx') || previewFile.name.endsWith('.msg')) && (
                  <div className="p-12 bg-gray-50 text-center">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="font-semibold text-gray-900 mb-2">{previewFile.name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {previewFile.name.endsWith('.msg') ? 'Email (.msg) preview not available' : 'Word/PowerPoint preview not available'}
                    </p>
                  </div>
                )}

                {!previewFile.type.includes('image') && 
                 !previewFile.type.includes('video') && 
                 !previewFile.type.includes('audio') && 
                 !previewFile.type.includes('pdf') && 
                 !previewFile.type.includes('document') && 
                 !previewFile.type.includes('sheet') && 
                 !previewFile.type.includes('excel') && (
                  <div className="p-12 bg-gray-50 text-center">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="font-semibold text-gray-900 mb-2">{previewFile.name}</p>
                    <p className="text-sm text-gray-500">Preview not available for this file type</p>
                  </div>
                )}
              </div>

              {/* Process Result */}
              {processResult && (
                <div className="mt-4 border-2 border-green-200 rounded-xl overflow-hidden">
                  <div className="bg-green-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">✅</span>
                      <span className="font-semibold text-green-800">{processResult.message}</span>
                    </div>
                    <button onClick={() => setProcessResult(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-white border-b">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{processResult.total_records}</div>
                      <div className="text-xs text-blue-600">Total Records</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{processResult.processed_records}</div>
                      <div className="text-xs text-green-600">Processed</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">{processResult.total_longtail}</div>
                      <div className="text-xs text-orange-600">Longtail (≥45 min)</div>
                    </div>
                  </div>

                  {processResult.weekly_summary?.length > 0 && (
                    <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-100 sticky top-0">
                            <th className="border border-gray-200 px-3 py-2 text-left">Member</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Week</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Avg ACHT</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Goal</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Variance</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Achieved %</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Cases</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Longtail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processResult.weekly_summary.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 font-medium">{row.member_name}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center">W{row.week_no}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center">{row.avg_acht} min</td>
                              <td className="border border-gray-200 px-3 py-2 text-center">{row.goal} min</td>
                              <td className={`border border-gray-200 px-3 py-2 text-center font-medium ${row.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {row.variance > 0 ? '+' : ''}{row.variance}
                              </td>
                              <td className={`border border-gray-200 px-3 py-2 text-center font-medium ${row.achieved >= 100 ? 'text-green-600' : row.achieved >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {row.achieved}%
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-center">{row.total_cases}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center">
                                {row.longtail_count > 0 ? <span className="text-orange-600 font-medium">{row.longtail_count}</span> : '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* Missed Result */}
              {missedResult && (
                <div className="mt-4 border-2 border-orange-200 rounded-xl overflow-hidden">
                  <div className="bg-orange-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📵</span>
                      <span className="font-semibold text-orange-800">{missedResult.message}</span>
                      {missedResult.week_label && <span className="text-sm text-orange-600 ml-2">({missedResult.week_label})</span>}
                    </div>
                    <button onClick={() => setMissedResult(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-white border-b">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">{missedResult.total_specialists}</div>
                      <div className="text-xs text-gray-600">Specialists</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">{missedResult.total_records}</div>
                      <div className="text-xs text-orange-600">Total Records</div>
                    </div>
                  </div>

                  {missedResult.specialist_data?.length > 0 && (
                    <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100 sticky top-0 z-10">
                            <th className="border border-gray-200 px-2 py-2 text-left">Week</th>
                            <th className="border border-gray-200 px-2 py-2 text-left">Associate</th>
                            <th className="border border-gray-200 px-2 py-2 text-left">Marketplace</th>
                            <th className="border border-gray-200 px-2 py-2 text-left">Site</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Offered</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Missed</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Missed%</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Chat Off</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Chat Miss</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Chat%</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Voice Off</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Voice Miss</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Voice%</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">WI Off</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">WI Miss</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">WI%</th>
                            <th className="border border-gray-200 px-2 py-2 text-center">Rate Live</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missedResult.specialist_data.map((row: any, i: number) => (
                            <tr key={i} className={`hover:bg-gray-50 ${row.overall_missed_pct > 0 ? '' : 'opacity-70'}`}>
                              <td className="border border-gray-200 px-2 py-1.5">{row.week}</td>
                              <td className="border border-gray-200 px-2 py-1.5 font-medium">{row.name || row.login}</td>
                              <td className="border border-gray-200 px-2 py-1.5">{row.marketplace || '-'}</td>
                              <td className="border border-gray-200 px-2 py-1.5">{row.site}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-center">{row.overall_offered}</td>
                              <td className={`border border-gray-200 px-2 py-1.5 text-center font-medium ${row.overall_missed > 0 ? 'text-red-600 bg-red-50' : ''}`}>{row.overall_missed}</td>
                              <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${row.overall_missed_pct > 2 ? 'text-red-600 bg-red-50' : row.overall_missed_pct > 0 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600'}`}>{row.overall_missed_pct}%</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-center">{row.chat_offered}</td>
                              <td className={`border border-gray-200 px-2 py-1.5 text-center ${row.chat_missed > 0 ? 'text-purple-600' : ''}`}>{row.chat_missed}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-center">{row.chat_missed_pct}%</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-center">{row.voice_offered}</td>
                              <td className={`border border-gray-200 px-2 py-1.5 text-center ${row.voice_missed > 0 ? 'text-blue-600' : ''}`}>{row.voice_missed}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-center">{row.voice_missed_pct}%</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-center">{row.wi_offered}</td>
                              <td className={`border border-gray-200 px-2 py-1.5 text-center ${row.wi_missed > 0 ? 'text-yellow-600' : ''}`}>{row.wi_missed}</td>
                              <td className="border border-gray-200 px-2 py-1.5 text-center">{row.wi_missed_pct}%</td>
                              <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${row.missed_contact_rate_live > 2 ? 'text-red-600' : row.missed_contact_rate_live > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{row.missed_contact_rate_live}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end p-4 bg-white border-t">
                    <button
                      onClick={async () => {
                        if (!previewFile) return;
                        try {
                          setLoading(true);
                          const res = await api.post(`/api/file-manager/publish-missed/${previewFile.id}`);
                          toast.success(res.data.message);
                          loadPublishedFiles();
                          setTimeout(() => navigate(`/published-metric/Missed`), 1500);
                        } catch (err: any) {
                          toast.error(err.response?.data?.detail || 'Failed to publish');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition shadow flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {loading ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      ) : (
                        <span>🚀</span>
                      )}
                      {loading ? 'Publishing...' : 'Publish Team Level Missed'}
                    </button>
                  </div>
                </div>
              )}

              {/* Deep Dive Result */}
              {deepDiveResult && (
                <div className="mt-4 border-2 border-indigo-200 rounded-xl overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔍</span>
                      <span className="font-semibold text-indigo-800">{deepDiveResult.message}</span>
                    </div>
                    <button onClick={() => setDeepDiveResult(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-white border-b">
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-700">{deepDiveResult.total_records}</div>
                      <div className="text-xs text-indigo-600">Total Work Items</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">{deepDiveResult.total_specialists_impacted}</div>
                      <div className="text-xs text-orange-600">Specialists Impacted</div>
                    </div>
                  </div>

                  {/* Specialist Summary */}
                  {deepDiveResult.specialist_summary?.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <h3 className="font-semibold text-gray-700 text-sm mb-2">Specialist Summary</h3>
                      <div className="flex flex-wrap gap-2">
                        {deepDiveResult.specialist_summary.map((s: any, i: number) => (
                          <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${
                            s.total_incidents >= 3 ? 'bg-red-100 text-red-700' :
                            s.total_incidents >= 1 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {s.name} — {s.total_incidents} incident{s.total_incidents !== 1 ? 's' : ''} (W{s.weeks.join(', W')})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deep Dive Detail Table */}
                  {deepDiveResult.deep_dive_data?.length > 0 && (
                    <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-100 sticky top-0">
                            <th className="border border-gray-200 px-3 py-2 text-left">#</th>
                            <th className="border border-gray-200 px-3 py-2 text-center">Week</th>
                            <th className="border border-gray-200 px-3 py-2 text-left">Specialist</th>
                            <th className="border border-gray-200 px-3 py-2 text-left">Missed Timestamp</th>
                            <th className="border border-gray-200 px-3 py-2 text-left">Site</th>
                            <th className="border border-gray-200 px-3 py-2 text-left">Attribute-Queue</th>
                            <th className="border border-gray-200 px-3 py-2 text-left">Workitem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deepDiveResult.deep_dive_data.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-gray-500">{i + 1}</td>
                              <td className="border border-gray-200 px-3 py-2 text-center">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">W{row.week_no}</span>
                              </td>
                              <td className="border border-gray-200 px-3 py-2 font-medium">{row.name}</td>
                              <td className="border border-gray-200 px-3 py-2 text-gray-600">{row.missed_timestamp}</td>
                              <td className="border border-gray-200 px-3 py-2">{row.site}</td>
                              <td className="border border-gray-200 px-3 py-2 text-xs">{row.attribute_queue}</td>
                              <td className="border border-gray-200 px-3 py-2 text-xs font-mono">{row.workitem}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}


            </div>
          )}
        </div>


      </div>
    </div>
  );
}
