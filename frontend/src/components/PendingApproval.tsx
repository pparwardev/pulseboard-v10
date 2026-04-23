import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PendingApproval() {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const [managerInfo, setManagerInfo] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.manager_login) {
      api.get('/api/admin/users').then(res => {
        const mgr = res.data.find((u: any) => u.login === user.manager_login);
        setManagerInfo(mgr);
      }).catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Approval Pending</h1>
          <p className="text-gray-600">Your account is awaiting manager approval</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-3">ℹ️</span>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Approval Required</h3>
              <p className="text-yellow-700 leading-relaxed">
                Your registration has been received. To access your dashboard, you need approval from your team manager.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">Your Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-semibold text-gray-900">{user.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="font-semibold text-gray-900">{user.email}</span></div>
            </div>
          </div>

          {managerInfo && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Contact Your Manager</h4>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">👤</span>
                <p className="text-sm text-blue-800 font-medium">{managerInfo.name}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-blue-600">📧</span>
                <a href={`mailto:${managerInfo.email}`} className="text-sm text-blue-600 hover:underline">{managerInfo.email}</a>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            disabled={checking}
            onClick={async () => {
              setChecking(true);
              try {
                const res = await api.get('/api/auth/me');
                const freshUser = { ...user, ...res.data };
                sessionStorage.setItem('user', JSON.stringify(freshUser));
                if (freshUser.is_approved) {
                  navigate(freshUser.role === 'manager' ? '/manager-dashboard' : '/member-dashboard');
                  window.location.reload();
                }
              } catch {
                window.location.reload();
              } finally {
                setChecking(false);
              }
            }}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {checking ? '⏳ Checking...' : '🔄 Refresh Status'}
          </button>
          <button onClick={handleLogout} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">🚪 Logout</button>
        </div>
      </div>
    </div>
  );
}
