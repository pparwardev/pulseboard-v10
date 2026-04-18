import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import PendingApproval from '../components/PendingApproval';
import AccountDeactivated from '../components/AccountDeactivated';
import amazonIcon from '../assets/amazon-icon.png';
import { getInternalTitle } from '../utils/roleMapping';
import ShiftWeekOff from '../components/ShiftWeekOff';


interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const navigation = [
  {
    name: 'Dashboard',
    icon: '📊',
    roles: ['manager'],
    subItems: [
      { name: 'Manager Dashboard', path: '/manager-dashboard', icon: '📊', roles: ['manager'] },
      { name: 'Team Members', path: '/members', icon: '👥', roles: ['manager'] },
      { name: 'Registrations', path: '/registrations', icon: '✅', roles: ['manager'] },
    ]
  },
  {
    name: 'My Dashboard',
    icon: '📊',
    roles: ['specialist'],
    subItems: [
      { name: 'Home', path: '/member-dashboard', icon: '🏠', roles: ['specialist'] },
      { name: 'My Performance', path: '/my-performance', icon: '🎯', roles: ['specialist'] },
    ]
  },
  {
    name: 'Performance',
    icon: '🎯',
    roles: ['manager'],
    subItems: [
      { name: 'Analytics', path: '/performance', icon: '📈', roles: ['manager'] },
      { name: 'File Manager', path: '/file-manager', icon: '📁', roles: ['manager'] },
      { name: 'Metrics Config', path: '/metrics-config', icon: '⚙️', roles: ['manager'] },
    ]
  },
  {
    name: 'Applications',
    icon: '📱',
    roles: ['manager', 'specialist'],
    subItems: [
      { name: 'Poll', path: '/polls', icon: '📊', roles: ['manager', 'specialist'] },
      { name: 'Wall of Fame', path: '/wall-of-fame', icon: '🏆', roles: ['manager', 'specialist'] },
      { name: 'Submit OT', path: '/team-updates', icon: '📊', roles: ['manager'] },
      { name: 'Submit OT', path: '/ot', icon: '⏰', roles: ['specialist'] },
      { name: 'Leave Calendar', path: '/leave-calendar', icon: '📅', roles: ['manager', 'specialist'] },
    ]
  }
];

export default function DashboardLayout() {
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const { darkMode, toggleDarkMode } = useTheme();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadByType, setUnreadByType] = useState<Record<string, number>>({});
  const [profileCompletion, setProfileCompletion] = useState(100);
  const [showCompletionSuccess, setShowCompletionSuccess] = useState(false);
  const [shiftStart, setShiftStart] = useState<string | undefined>();
  const [shiftEnd, setShiftEnd] = useState<string | undefined>();
  const [weekOff, setWeekOff] = useState<string | undefined>();

  const navigate = useNavigate();
  const location = useLocation();
  const userStr = sessionStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;

  const getDisplayRole = () => {
    if (!user) return '';
    return getInternalTitle(user.role, user.team_name);
  };

  const isSidebarExpanded = sidebarPinned || sidebarHovered;

  const isManager = user?.role === 'manager';
  const typeToPath: Record<string, string> = {
    user_registered: '/registrations',
    ot_leave_submitted: isManager ? '/team-updates' : '/ot',
    wall_post: '/wall-of-fame',
  };

  const pathToTypes: Record<string, string[]> = {};
  Object.entries(typeToPath).forEach(([type, path]) => {
    if (!pathToTypes[path]) pathToTypes[path] = [];
    if (!pathToTypes[path].includes(type)) pathToTypes[path].push(type);
  });

  const getPathBadgeCount = (path: string): number => {
    const types = pathToTypes[path];
    if (!types) return 0;
    return types.reduce((sum, t) => sum + (unreadByType[t] || 0), 0);
  };

  const loadUnreadByType = async () => {
    try {
      const res = await api.get('/api/notifications/unread-by-type');
      setUnreadByType(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const types = pathToTypes[location.pathname];
    if (types && types.some(t => (unreadByType[t] || 0) > 0)) {
      api.post('/api/notifications/mark-type-read', { types }).then(() => {
        loadUnreadByType();
        loadUnreadCount();
      }).catch(() => {});
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchProfilePhoto();
    checkProfileCompletion();
    if (user?.role) {
      loadNotifications();
      loadUnreadCount();
      loadUnreadByType();
      const interval = setInterval(() => {
        loadUnreadCount();
        loadUnreadByType();
      }, 30000);

      const handleProfileUpdate = () => checkProfileCompletion();
      window.addEventListener('profileUpdated', handleProfileUpdate);
      return () => {
        clearInterval(interval);
        window.removeEventListener('profileUpdated', handleProfileUpdate);
      };
    }
  }, [user?.role]);

  const fetchProfilePhoto = async () => {
    try {
      const res = await api.get('/api/profile');
      if (res.data.profilePhoto) {
        setProfilePhoto(`http://65.0.122.136:8001${res.data.profilePhoto.url}`);
      }
      setShiftStart(res.data.shift_start || undefined);
      setShiftEnd(res.data.shift_end || undefined);
      setWeekOff(res.data.week_off || undefined);
    } catch { /* ignore */ }
  };

  const checkProfileCompletion = async () => {
    try {
      const res = await api.get('/api/profile');
      const completion = res.data.profileCompletion || 0;
      const prev = profileCompletion;
      setProfileCompletion(completion);
      if (prev < 100 && completion === 100) {
        setShowCompletionSuccess(true);
        setTimeout(() => setShowCompletionSuccess(false), 5000);
      }
      if (completion < 100 && location.pathname !== '/profile' && location.pathname !== '/change-password') {
        navigate('/profile');
      }
    } catch { /* ignore */ }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get('/api/notifications/');
      setNotifications(res.data);
    } catch { /* ignore */ }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/api/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch { /* ignore */ }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/read`, {});
      loadNotifications();
      loadUnreadCount();
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read', {});
      loadNotifications();
      loadUnreadCount();
      loadUnreadByType();
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.is_read) markAsRead(notif.id);
    setShowNotifications(false);
    setNotifications(notifications.filter(n => n.id !== notif.id));
    switch (notif.type) {
      case 'user_registered': navigate('/registrations'); break;
      case 'ot_leave_submitted': navigate(user?.role === 'manager' ? '/team-updates' : '/ot'); break;
      case 'wall_post': navigate('/wall-of-fame'); break;
      default: break;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  if (user && !user.is_active) return <AccountDeactivated />;
  if (user && user.role === 'specialist' && !user.is_approved) return <PendingApproval />;

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <aside
        className={`${isSidebarExpanded ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-800 text-white' : 'bg-slate-800 text-white'} transition-all duration-300 ease-in-out flex flex-col relative`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <img src={amazonIcon} alt="Amazon" className="w-full h-full object-contain" />
          </div>
          {isSidebarExpanded && (
            <>
              <div className="flex-1">
                <h1 className="font-bold text-lg">PulseBoard</h1>
                <p className="text-xs text-slate-400">Performance Dashboard</p>
              </div>
              <button
                onClick={() => setSidebarPinned(!sidebarPinned)}
                className="p-1.5 rounded hover:bg-slate-700 transition-colors"
                title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                <span className="text-lg">{sidebarPinned ? '📌' : '📍'}</span>
              </button>
            </>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            if (!item.roles.includes(user?.role || '')) return null;
            const visibleSubItems = item.subItems?.filter(sub => sub.roles.includes(user?.role || '')) || [];
            if (visibleSubItems.length === 0) return null;

            return (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setHoveredMenu(item.name)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg transition cursor-pointer text-slate-300 hover:bg-slate-700">
                  <span className="text-xl relative">
                    {item.icon}
                    {visibleSubItems.some(sub => getPathBadgeCount(sub.path) > 0) && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-800 animate-pulse" />
                    )}
                  </span>
                  {isSidebarExpanded && (
                    <>
                      <span className="font-medium flex-1">{item.name}</span>
                      {visibleSubItems.some(sub => getPathBadgeCount(sub.path) > 0) && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                      <span className="text-sm">›</span>
                    </>
                  )}
                </div>

                {hoveredMenu === item.name && isSidebarExpanded && (
                  <div className="ml-6 mt-1 space-y-1 bg-slate-700/50 rounded-lg p-2">
                    {visibleSubItems.map((subItem) => {
                      const isActive = location.pathname === subItem.path;
                      const badge = getPathBadgeCount(subItem.path);
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                            isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <span className="text-base">{subItem.icon}</span>
                          <span className="font-medium">{subItem.name}</span>
                          {badge > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-blue-500">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400">{getDisplayRole()}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <div className="px-6 py-3 flex items-center justify-between bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 shadow-lg">
          <Link to={user?.role === 'manager' ? '/manager-dashboard' : '/member-dashboard'} className="text-xl font-bold text-white hover:text-white/80 transition-colors">
            {user?.team_name || 'Team'} PulseBoard
          </Link>
          <div className="flex items-center gap-4">
            <ShiftWeekOff
              initialShiftStart={shiftStart}
              initialShiftEnd={shiftEnd}
              initialWeekOff={weekOff}
              theme="dark"
              onSave={fetchProfilePhoto}
            />
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) loadNotifications(); }}
                className="relative p-2 rounded-lg transition-colors hover:bg-white/20"
                title="Notifications"
              >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto`}>
                  <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {notifications.length === 0 ? (
                      <p className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 cursor-pointer transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${!notif.is_read ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl">
                              {notif.type === 'user_registered' ? '👤' :
                               notif.type === 'ot_leave_submitted' ? '⏰' :
                               notif.type === 'wall_post' ? '🏆' : '🔔'}
                            </span>
                            <div className="flex-1">
                              <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{notif.title}</p>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{notif.message}</p>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Image - links to profile */}
            <Link
              to="/profile"
              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/50 hover:border-white transition-colors"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white bg-blue-500 w-full h-full flex items-center justify-center">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </Link>

            {/* Profile Menu - hover to open */}
            <div
              className="relative"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <button
                className="p-2 rounded-lg transition-colors hover:bg-white/20 text-white text-xl"
              >
                ☰
              </button>

              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-xl border z-50`}>
                  <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-500 shrink-0">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white flex items-center justify-center w-full h-full">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getDisplayRole()}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`p-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                    >
                      <span className="text-lg">👤</span>
                      <span className="font-medium">Profile</span>
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/change-password'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                    >
                      <span className="text-lg">⚙️</span>
                      <span className="font-medium">Account Settings</span>
                    </button>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-red-600 hover:bg-red-50"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => { toggleDarkMode(); document.body.classList.toggle('night-theme'); }}
              className="p-2 rounded-lg transition-colors hover:bg-white/20 text-white"
              title={darkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 50%, #bae6fd 100%)', position: 'relative', zIndex: 10 }}>
          {showCompletionSuccess && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 flex items-center justify-between shadow-lg animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-bold text-lg">Profile Completed!</p>
                  <p className="text-sm opacity-90">You now have full access to all PulseBoard features.</p>
                </div>
              </div>
              <button onClick={() => setShowCompletionSuccess(false)} className="text-white hover:text-gray-200 text-2xl font-bold">×</button>
            </div>
          )}
          {profileCompletion < 100 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-lg">Action Required: Complete Your Profile</p>
                  <p className="text-sm opacity-90">Complete your profile ({profileCompletion}%) to unlock full access</p>
                </div>
              </div>
              <button onClick={() => navigate('/profile')} className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                Complete Now →
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
