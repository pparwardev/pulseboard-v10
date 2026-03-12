import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE = 'http://localhost:8001';

export default function RegistrationApprovalsPage() {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const { darkMode } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'deactivated'>('active');
  const [viewingUser, setViewingUser] = useState<any>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (userId: number) => {
    try {
      await api.put(`/api/admin/users/${userId}/approve`, {});
      toast.success('User approved!');
      fetchUsers();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to approve'); }
  };

  const handleApproveAll = async () => {
    const pending = filteredUsers.filter(u => !u.is_approved);
    if (pending.length === 0) { toast.error('No pending members'); return; }
    if (!window.confirm(`Approve ${pending.length} pending members?`)) return;
    try {
      await Promise.all(pending.map(u => api.put(`/api/admin/users/${u.id}/approve`, {})));
      toast.success(`Approved ${pending.length} members!`);
      fetchUsers();
    } catch { toast.error('Failed to approve all'); }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.put(`/api/admin/users/${userId}/toggle-active`, { is_active: !currentStatus });
      toast.success(`User ${action}d!`);
      fetchUsers();
    } catch { toast.error(`Failed to ${action}`); }
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'deactivated') return !u.is_active;
    return u.is_active;
  });

  const pendingCount = users.filter(u => !u.is_approved && u.is_active).length;

  return (
    <div className={`p-6 space-y-6 ${darkMode ? 'text-white' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📋 Registered Users</h1>
          <div className="flex gap-6 mt-2 text-sm">
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Active: <span className="font-semibold text-green-600">{users.filter(u => u.is_active).length}</span></span>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Pending: <span className="font-semibold text-yellow-600">{pendingCount}</span></span>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Deactivated: <span className="font-semibold text-red-600">{users.filter(u => !u.is_active).length}</span></span>
          </div>
        </div>
        {activeTab === 'active' && pendingCount > 0 && (
          <button onClick={handleApproveAll} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
            ✓ Approve All Pending
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['active', 'deactivated'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors capitalize ${
              activeTab === tab
                ? `border-b-2 ${tab === 'deactivated' ? 'border-red-600 text-red-600' : 'border-blue-600 text-blue-600'}`
                : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            {tab === 'active' ? 'Team Members' : 'Deactivated'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : filteredUsers.length === 0 ? (
        <div className={`rounded-lg shadow p-8 text-center ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
          No {activeTab} users found
        </div>
      ) : (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {['Employee ID', 'Login', 'Name', 'Email', 'Role', 'Registered', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : ''}`}>
              {filteredUsers.map(u => (
                <tr key={u.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className={`px-4 py-3 font-mono text-sm ${darkMode ? 'text-gray-300' : ''}`}>{u.employee_id}</td>
                  <td className={`px-4 py-3 text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{u.login}</td>
                  <td className={`px-4 py-3 font-medium ${darkMode ? 'text-white' : ''}`}>{u.name}</td>
                  <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{u.email}</td>
                  <td className="px-4 py-3 text-sm capitalize">{u.role === 'specialist' ? 'Team Member' : u.role}</td>
                  <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.is_approved ? (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? '✓ Active' : '✕ Inactive'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">⏳ Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewingUser(u)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100">View</button>
                      {!u.is_approved ? (
                        <button onClick={() => handleApprove(u.id)} className="px-3 py-1 bg-green-50 text-green-600 rounded text-xs font-medium hover:bg-green-100">Approve</button>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          className={`px-3 py-1 rounded text-xs font-medium ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                        >
                          {u.is_active ? 'Deactivate' : '✓ Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Dialog */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingUser(null)}>
          <div className={`rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : ''}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Details</h2>
              <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-center">
                {viewingUser.profile_picture ? (
                  <img src={`${API_BASE}${viewingUser.profile_picture}`} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100">
                    {viewingUser.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', viewingUser.name],
                  ['Employee ID', viewingUser.employee_id],
                  ['Email', viewingUser.email],
                  ['Login', viewingUser.login],
                  ['Role', viewingUser.role === 'specialist' ? 'Team Member' : viewingUser.role],
                  ['Status', viewingUser.is_active ? 'Active' : 'Inactive'],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                    <p className={`font-semibold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
