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
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
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
      for (const file of validFiles) {
        await uploadFile(file);
      }
      await loadFiles();
      toast.success(`${validFiles.length} file(s) uploaded successfully!`);
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
      for (const file of validFiles) {
        await uploadFile(file);
      }
      await loadFiles();
      toast.success(`${validFiles.length} file(s) uploaded successfully!`);
      setLoading(false);
    }
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
    setExcelSheets({});
    setActiveSheet('');
    setPageNumber(1);
    setImageLoaded(false);
    setExcelPage(0);
    
    if (file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      // Fetch file from backend for Excel
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:8001${file.url}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);
        const fileWithUrl = { ...file, url: fileUrl };
        loadExcelFile(fileWithUrl);
      } catch (err) {
        toast.error('Failed to load file');
      }
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams();
    if (selectedMetric) params.append('metric_code', selectedMetric);
    if (selectedWeek) params.append('week_label', selectedWeek);

    try {
      await api.post(`/api/file-manager/upload?${params.toString()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
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
      const token = sessionStorage.getItem('token');
      const fileResponse = await fetch(`http://localhost:8001${file.url}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await fileResponse.blob();
      const formData = new FormData();
      formData.append('file', blob, file.name);
      
      const response = await api.post(`/api/metric-files/upload?metric_code=${metricCode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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

  const getFileIcon = (type: string, name: string = '') => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('pdf') || name.endsWith('.pdf')) return '📕';
    if (type.includes('word') || type.includes('document')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📗';
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

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Sidebar - Upload Box */}
        <div className="col-span-3 space-y-6">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">📁</span>
              </div>
              <h3 className="font-bold text-lg mb-2">
                {selectedMetric ? `Upload ${selectedMetric} File` : 'Select Metric First'}
              </h3>
              <p className="text-sm text-white/80">
                {selectedMetric ? 'Drag & drop or click to upload' : 'Choose a metric category below'}
              </p>
            </div>

            {/* Week Selection Dropdown */}
            <div className="mb-4">
              <label className="text-xs text-white/80 mb-1 block">Select Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-white text-gray-900 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="" className="text-gray-900">-- Select Week --</option>
                {getWeekOptions().map(w => (
                  <option key={w} value={w} className="text-gray-900">{w}</option>
                ))}
              </select>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                dragActive ? 'border-white bg-white/20' : 'border-white/40'
              }`}
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={handleFileInput}
                accept=".xlsx,.xls,.csv,.xlsm,.xlsb,.pdf,.doc,.docx"
                multiple
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="text-4xl mb-2">☁️</div>
                <p className="text-sm">Drop files here</p>
              </label>
            </div>

            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              disabled={loading || !selectedMetric || !selectedWeek}
              className="w-full mt-4 bg-white text-purple-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : !selectedMetric ? 'Select Metric First' : !selectedWeek ? 'Select Week First' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-6 space-y-6">
          {/* Metric Categories */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Select Metric Category</h2>
            </div>
            {metrics.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">⚙️</div>
                <p className="text-sm mb-2">No metrics configured</p>
                <button
                  onClick={() => navigate('/metrics-config')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Configure Metrics →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {metrics.map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => {
                      setSelectedMetric(metric.metric_code);
                      setPreviewFile(null);
                      setProcessResult(null);
                    }}
                    className={`p-4 rounded-xl transition hover:scale-105 ${
                      selectedMetric === metric.metric_code
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white ring-2 ring-purple-600'
                        : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700'
                    }`}
                  >
                    <div className="text-3xl mb-2">📊</div>
                    <div className="font-semibold">{metric.metric_name}</div>
                    <div className="text-xs opacity-75 mt-1">{metric.metric_code}</div>
                    <div className="text-xs opacity-75">
                      {files.filter(f => f.metric_code === metric.metric_code).length} files
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar - All Files */}
        <div className="col-span-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col" style={{ height: '488px' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm">All Files</h2>
              <button onClick={() => { setSelectedMetric(''); setFilterWeek(''); }} className="text-xs text-blue-600 hover:underline">
                See all
              </button>
            </div>

            {/* Week Filter */}
            <div className="mb-3">
              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-xs bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">All Weeks</option>
                {allWeekLabels.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-xs">No files uploaded yet</p>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      {getFileIcon(file.type, file.name)}
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handlePreview(file)}
                    >
                      <p className="font-medium text-gray-900 truncate text-xs hover:text-blue-600">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}{file.week_label ? ` • ${file.week_label}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                    href={`http://localhost:8001${previewFile.url}`}
                    download={previewFile.name}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    Download
                  </a>
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
                      src={`http://localhost:8001${previewFile.url}`}
                      alt={previewFile.name} 
                      className="w-full h-auto max-h-[600px] object-contain"
                      loading="lazy"
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                )}

                {previewFile.type.includes('video') && (
                  <video controls className="w-full" key={previewFile.id}>
                    <source src={`http://localhost:8001${previewFile.url}?token=${sessionStorage.getItem('token')}`} type={previewFile.type} />
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
                      <source src={`http://localhost:8001${previewFile.url}`} type={previewFile.type} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {(previewFile.type.includes('pdf') || previewFile.name.endsWith('.pdf')) && (
                  <div className="bg-gray-100 p-4">
                    <div className="flex items-center justify-center gap-4 mb-4">
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
                    </div>
                    <div className="flex justify-center">
                      <Document
                        file={{
                          url: `http://localhost:8001${previewFile.url}`,
                          httpHeaders: {
                            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                          }
                        }}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        loading={<div className="p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>}
                      >
                        <Page 
                          pageNumber={pageNumber} 
                          width={Math.min(800, window.innerWidth - 100)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    </div>
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

              {processResult && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => toast('Publish feature coming soon!')}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition shadow-lg flex items-center gap-2"
                  >
                    <span>🚀</span> Publish Processed Data
                  </button>
                </div>
              )}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
