import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import MultiSelectSkills from '../components/MultiSelectSkills';
import MultiSelectMarketplace from '../components/MultiSelectMarketplace';
import ShiftWeekOff from '../components/ShiftWeekOff';

const API_BASE = '';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
  'India', 'China', 'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands',
  'Sweden', 'Singapore', 'South Korea', 'Switzerland', 'Belgium', 'Austria',
  'Norway', 'Denmark', 'Finland', 'Ireland', 'New Zealand', 'Poland', 'Portugal',
  'Czech Republic', 'Greece', 'Israel', 'UAE', 'Saudi Arabia', 'South Africa',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'Thailand', 'Malaysia', 'Indonesia',
  'Philippines', 'Vietnam', 'Egypt', 'Turkey', 'Russia', 'Ukraine', 'Romania',
  'Hungary', 'Bulgaria', 'Croatia', 'Other'
];

export default function ProfilePageNew() {
  const { darkMode } = useTheme();
  const { memberId } = useParams<{ memberId?: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchSkills = async (teamName: string | null, userId: number) => {
    try {
      const skillsEndpoint = teamName ? `/api/skills/team/${teamName}` : '/api/skills/all';
      const [teamRes, userRes] = await Promise.all([
        api.get(skillsEndpoint),
        api.get(`/api/skills/user/${userId}`)
      ]);
      setAvailableSkills(teamRes.data.skills || []);
      setSelectedSkills(userRes.data.skills || []);
    } catch { /* skills not available yet */ }
  };

  const fetchProfile = async () => {
    try {
      if (memberId) {
        const res = await api.get(`/api/admin/users`);
        const user = res.data.find((u: any) => u.id === Number(memberId));
        if (user) {
          setProfile({
            userId: user.id, role: user.role, name: user.name, employee_id: user.employee_id,
            profilePhoto: user.profile_picture ? { url: user.profile_picture } : null,
            login: user.login, email: user.email, contact: user.contact_number,
            managerName: user.manager_login, team: user.team_name,
            lastJoinDate: user.date_of_joining || user.created_at?.split('T')[0],
            total_tenure: user.total_tenure,
            country: user.marketplace, location: user.location,
            supports_marketplace: user.supports_marketplace,
            shift_start: user.shift_start, shift_end: user.shift_end, week_off: user.week_off,
            date_of_birth: user.date_of_birth,
            profileCompletion: 100
          });
          fetchSkills(user.team_name, user.id);
        }
      } else {
        const res = await api.get('/api/profile');
        setProfile(res.data);
        fetchSkills(res.data.team_name, res.data.id);
      }
    } catch { toast.error('Failed to load profile'); }
  };

  const handleEdit = (field: string, value: any) => {
    setEditing(field);
    setEditValue(value || '');
    setPhoneError('');
  };

  const handleSave = async (field: string) => {
    if (field === 'contact_number' && editValue && !/^\d{10}$/.test(editValue)) {
      setPhoneError('Phone number must be exactly 10 digits');
      return;
    }
    try {
      await api.put('/api/profile', { [field]: editValue });
      setEditing(null);
      setPhoneError('');
      toast.success('Profile updated');
      await fetchProfile();
      window.dispatchEvent(new Event('profileUpdated'));
    } catch { toast.error('Failed to update'); }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target as Node)) {
        setShowPhotoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('File too large (max 2MB)'); return; }
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const res = await api.post('/api/profile/photo-base64', { data: base64, ext });
        toast.success('Photo uploaded');
        fetchProfile();
        window.dispatchEvent(new Event('profileUpdated'));
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error('Upload failed');
      setPhotoPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoRemove = async () => {
    setShowPhotoMenu(false);
    try {
      await api.delete('/api/profile/photo');
      toast.success('Photo removed');
      setPhotoPreview(null);
      setProfile((prev: any) => prev ? { ...prev, profilePhoto: null, profile_picture: null } : prev);
      await fetchProfile();
      window.dispatchEvent(new Event('profileUpdated'));
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  if (!profile) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const Field = ({ label, field, value, rawValue, editable, type = 'text' }: any) => {
    const isEditable = editable && !memberId;
    const editVal = rawValue !== undefined ? rawValue : value;
    return (
      <div className={`py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center">
          <div className={`w-2/5 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</div>
          <div className="w-3/5 flex items-center justify-between">
            {editing === field ? (
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  {field === 'marketplace' ? (
                    <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className={`flex-1 px-3 py-2 border-2 border-blue-500 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`} autoFocus>
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : type === 'dob' ? (
                    <div className="flex gap-2 flex-1">
                      <select value={editValue.split('-')[1] || ''} onChange={(e) => setEditValue(`${e.target.value}-${editValue.split('-')[0] || ''}`.replace(/-$/, ''))} className={`flex-1 px-3 py-2 border-2 border-blue-500 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`}>
                        <option value="">Month</option>
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>)}
                      </select>
                      <select value={editValue.split('-')[0] || ''} onChange={(e) => setEditValue(`${e.target.value}-${editValue.split('-')[1] || ''}`.replace(/-$/, ''))} className={`w-20 px-3 py-2 border-2 border-blue-500 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`}>
                        <option value="">Day</option>
                        {Array.from({length:31},(_,i)=>i+1).map(d => <option key={d} value={String(d).padStart(2,'0')}>{d}</option>)}
                      </select>
                    </div>
                  ) : type === 'date' ? (
                    <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} className={`flex-1 px-3 py-2 border-2 border-blue-500 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`} autoFocus />
                  ) : field === 'contact_number' ? (
                    <input type="tel" value={editValue} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setEditValue(val); setPhoneError(''); }} placeholder="10 digit phone" className={`flex-1 px-3 py-2 border-2 border-blue-500 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`} autoFocus />
                  ) : (
                    <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder={field === 'location' ? 'Fill location same as shown in Phonetool' : ''} className={`flex-1 px-3 py-2 border-2 border-blue-500 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`} autoFocus />
                  )}
                  <button onClick={() => handleSave(field)} className="text-green-600 hover:text-green-700">✓</button>
                  <button onClick={() => { setEditing(null); setPhoneError(''); }} className="text-red-600 hover:text-red-700">✕</button>
                </div>
                {field === 'contact_number' && phoneError && <span className="text-xs text-red-600 mt-1">{phoneError}</span>}
              </div>
            ) : (
              <>
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{value || <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Not set</span>}</span>
                {isEditable ? (
                  <button onClick={() => handleEdit(field, editVal)} className={`ml-2 ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-600'}`}>✏️</button>
                ) : (
                  <span className="text-gray-300 ml-2">🔒</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {!memberId && profile.profileCompletion < 100 && (
        <div className="max-w-4xl mx-auto mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">⚡</span>
            <div className="flex-1">
              <p className="font-bold text-xl mb-1">Action Required: Complete Your Profile</p>
              <p className="text-sm opacity-90">Complete your profile ({profile.profileCompletion}%) to unlock full access to PulseBoard features.</p>
            </div>
          </div>
        </div>
      )}
      {memberId && (
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2">← Back</button>
      )}
      <div className={`max-w-4xl mx-auto rounded-xl shadow-sm p-8 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex items-start gap-6 pb-6 border-b mb-6">
          <div className="relative">
            <div className={`w-44 h-44 rounded-full border-2 overflow-hidden flex items-center justify-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-100'}`}>
              {photoPreview || profile.profilePhoto?.url ? (
                <img src={photoPreview || `${API_BASE}${profile.profilePhoto.url}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl text-gray-400">👤</span>
              )}
            </div>
            {!memberId && (
              <div className="absolute bottom-0 right-0" ref={photoMenuRef}>
                <button
                  onClick={() => setShowPhotoMenu(prev => !prev)}
                  className="bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg"
                >
                  ✏️
                </button>
                {showPhotoMenu && (
                  <div className={`absolute right-0 bottom-12 w-44 rounded-lg shadow-xl border z-50 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <button
                      onClick={() => { setShowPhotoMenu(false); fileInputRef.current?.click(); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 rounded-t-lg ${darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      📤 {profile.profilePhoto || photoPreview ? 'Replace Image' : 'Upload Image'}
                    </button>
                    {(profile.profilePhoto || photoPreview) && (
                      <button
                        onClick={handlePhotoRemove}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 rounded-b-lg text-red-500 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-red-50'}`}
                      >
                        🗑️ Remove Image
                      </button>
                    )}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.name || 'N/A'}</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{profile.team_name || profile.team || 'N/A'}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{profile.location && `📍 ${profile.location}`}</p>
          </div>
        </div>

        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">Profile Completion: {profile.profileCompletion}%</span>
          </div>
          <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${profile.profileCompletion}%` }}></div>
          </div>
        </div>

        <div>
          <Field label="Employee ID" field="employee_id" value={profile.employee_id} editable={false} />
          <Field label="Login" field="login" value={profile.login} editable={false} />
          <Field label="Email" field="email" value={profile.email} editable={false} />
          <Field label="Contact" field="contact_number" value={profile.contact_number || profile.contact} editable={true} />
          <Field label="Manager Login ID" field="manager_login" value={profile.manager_login || profile.managerName} editable={false} />
          <Field label="Team" field="team_name" value={profile.team_name || profile.team} editable={false} />
          <Field label="Date of Birth" field="date_of_birth" value={profile.date_of_birth ? (() => { const [d,m] = profile.date_of_birth.split('-'); const mn = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)] || m; return `${d} ${mn}`; })() : null} rawValue={profile.date_of_birth} editable={true} type="dob" />
          <Field label="Date of Joining" field="date_of_joining" value={profile.date_of_joining || profile.lastJoinDate} editable={true} type="date" />
          <Field label="Total Tenure" field="total_tenure" value={profile.total_tenure} editable={false} />
          <Field label="Country" field="marketplace" value={profile.marketplace || profile.country} editable={true} />
          <Field label="Location" field="location" value={profile.location} editable={true} />
          {/* Supports Marketplace - MultiSelect */}
          <div className={`py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center">
              <div className={`w-2/5 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supports Marketplace</div>
              <div className="w-3/5">
                {!memberId ? (
                  <MultiSelectMarketplace
                    selected={profile.supports_marketplace ? profile.supports_marketplace.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                    darkMode={darkMode}
                    onChange={async (values) => {
                      try {
                        await api.put('/api/profile', { supports_marketplace: values.join(', ') });
                        toast.success('Marketplace updated');
                        fetchProfile();
                      } catch { toast.error('Failed to update'); }
                    }}
                  />
                ) : (
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {profile.supports_marketplace || <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Not set</span>}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Shift & Week Off */}
          <div className={`py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center">
              <div className={`w-2/5 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Shift & Week Off</div>
              <div className="w-3/5">
                {!memberId ? (
                  <ShiftWeekOff
                    initialShiftStart={profile.shift_start}
                    initialShiftEnd={profile.shift_end}
                    initialWeekOff={profile.week_off}
                    theme={darkMode ? 'dark' : 'light'}
                    onSave={fetchProfile}
                  />
                ) : (
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {profile.shift_start && profile.shift_end ? `${profile.shift_start} – ${profile.shift_end}` : <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Not set</span>}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Skill Set - MultiSelect Dropdown */}
          <div className={`py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center">
              <div className={`w-2/5 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Skill Set</div>
              <div className="w-3/5">
                {!memberId ? (
                  <MultiSelectSkills
                    selectedSkills={selectedSkills}
                    availableSkills={availableSkills}
                    darkMode={darkMode}
                    onChange={async (skills) => {
                      setSelectedSkills(skills);
                      try {
                        await api.put(`/api/skills/user/${profile.id}`, { skills });
                        toast.success('Skills updated');
                        fetchProfile();
                      } catch { toast.error('Failed to update skills'); }
                    }}
                  />
                ) : (
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {selectedSkills.length > 0 ? selectedSkills.join(', ') : <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Not set</span>}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
