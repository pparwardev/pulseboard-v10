import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import teamIllustration from '../assets/team-brainstorm.png';
import amazonIcon from '../assets/amazon-icon.png';

export default function RegisterPageNew() {
  const navigate = useNavigate();
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState({
    login: '', email: '', name: '', password: '', confirm_password: '',
    employee_id: '', marketplace: '', country_code: '+91', contact_number: '',
    manager_login: '', role: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>({ score: 0, validations: [] });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'login') {
      setFormData({ ...formData, [name]: value, email: value ? `${value}@amazon.com` : '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (name === 'password') checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password: string) => {
    const validations = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[0-9]/.test(password), text: 'One numeric digit' },
      { met: /[^a-zA-Z0-9]/.test(password), text: 'One special character' },
    ];
    setPasswordStrength({ score: validations.filter(v => v.met).length, validations });
  };

  const validateForm = () => {
    if (!formData.email.endsWith('@amazon.com')) { toast.error('Email must be from amazon.com domain'); return false; }
    if (formData.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
    if (!/[A-Z]/.test(formData.password)) { toast.error('Password must contain at least one uppercase letter'); return false; }
    if (!/[0-9]/.test(formData.password)) { toast.error('Password must contain at least one numeric digit'); return false; }
    if (!/[^a-zA-Z0-9]/.test(formData.password)) { toast.error('Password must contain at least one special character'); return false; }
    if (formData.password !== formData.confirm_password) { toast.error('Passwords do not match'); return false; }
    if (!formData.contact_number.match(/^[0-9]{10}$/)) { toast.error('Contact number must be 10 digits'); return false; }
    if (!formData.role) { toast.error('Please select a role'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        ...formData,
        contact_number: formData.country_code + formData.contact_number
      });
      setRegistered(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">✅</span></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Submitted!</h2>
          <p className="text-gray-600 mb-4">Your registration has been submitted. {formData.role === 'specialist' ? 'Please wait for your manager to approve.' : 'You can now login.'}</p>
          <button onClick={() => navigate('/login')} className="w-full text-white py-3 rounded-xl font-semibold transition" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #eef1f8 0%, #e0e7ff 50%, #eef1f8 100%)' }}>
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <header className="relative z-10 flex justify-between items-center px-4 sm:px-8 py-3">
        <div className="flex items-center gap-2">
          <img src={amazonIcon} alt="Amazon" className="h-6 sm:h-8" />
          <span className="text-gray-400 text-xl sm:text-2xl font-light">|</span>
          <span className="text-lg sm:text-2xl font-normal text-indigo-900" style={{ fontFamily: 'Arial, sans-serif' }}>PulseBoard</span>
        </div>
        <button onClick={() => navigate('/login')} className="px-4 sm:px-6 py-2 sm:py-3 text-white rounded-full font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>Back to Login</button>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-1 pb-2 grid md:grid-cols-2 gap-4 sm:gap-8 items-start">
        <div className="space-y-2 flex flex-col justify-start">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold text-indigo-600 leading-tight mb-2">Insist on the<br />Highest Standards</h1>
            <p className="text-gray-600 text-sm sm:text-lg leading-relaxed">Empower your team with intelligent performance tracking, real-time analytics, and seamless collaboration tools designed for modern workplaces.</p>
          </div>
          <div className="animate-pop">
            <img src={teamIllustration} alt="Team Collaboration" className="w-full max-w-sm sm:max-w-md rounded-2xl" />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto w-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
            <p className="text-sm sm:text-base text-gray-500">Join PulseBoard today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Register As *</label>
              <select name="role" value={formData.role} onChange={handleChange} required className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Select Role</option>
                <option value="manager">Team Manager</option>
                <option value="specialist">Team Member</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Login (Amazon Alias) *</label>
                <input type="text" name="login" value={formData.login} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="jdoe" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email (amazon.com) *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="off" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="jdoe@amazon.com" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="EMP12345" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required minLength={8} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">{showPassword ? '🙈' : '👁️'}</button>
                </div>
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    {passwordStrength.validations.map((v: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={v.met ? 'text-green-600' : 'text-gray-400'}>{v.met ? '✓' : '○'}</span>
                        <span className={v.met ? 'text-green-600' : 'text-gray-600'}>{v.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} name="confirm_password" value={formData.confirm_password} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">{showConfirmPassword ? '🙈' : '👁️'}</button>
                </div>
                {formData.confirm_password && formData.password && (
                  <p className={`text-xs mt-1 font-medium ${formData.password === formData.confirm_password ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.password === formData.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <select name="marketplace" value={formData.marketplace} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Country</option>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="SG">Singapore</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <div className="flex gap-2">
                  <select name="country_code" value={formData.country_code} onChange={handleChange} className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+61">+61</option>
                    <option value="+49">+49</option>
                    <option value="+81">+81</option>
                    <option value="+65">+65</option>
                  </select>
                  <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleChange} required pattern="[0-9]{10}" maxLength={10} className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="1234567890" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Login *</label>
                <input type="text" name="manager_login" value={formData.manager_login} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="manager_alias" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full text-white py-2 sm:py-3 text-sm sm:text-base rounded-xl font-semibold disabled:bg-gray-400 transition-all" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs sm:text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline font-semibold">Login here</button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        @keyframes pop { 0% { transform: scale(0) translateY(20px); opacity: 0; } 60% { transform: scale(1.08) translateY(-5px); } 80% { transform: scale(0.95) translateY(2px); } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-blob { animation: blob 7s infinite; }
        .animate-pop { animation: pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
