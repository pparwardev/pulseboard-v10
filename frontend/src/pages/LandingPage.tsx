import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import toast from 'react-hot-toast';
import teamIllustration from '../assets/team-brainstorm.png';
import amazonIcon from '../assets/amazon-icon.png';
import api from '../services/api';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useSession();

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(p) },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      toast.success(`Welcome, ${userData.name}!`);
      if (userData.role === 'manager') {
        navigate('/manager-dashboard', { replace: true });
      } else {
        navigate('/member-dashboard', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/password/forgot', { email: forgotEmail });
      toast.success('Reset request sent! Contact your manager for the token.');
      setForgotStep('reset');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match!'); return; }
    const failedReqs = passwordRequirements.filter(r => !r.test(newPassword));
    if (failedReqs.length > 0) { toast.error('Password does not meet all requirements'); return; }
    setLoading(true);
    try {
      await api.post('/api/password/reset', { token, new_password: newPassword, confirm_password: confirmPassword });
      toast.success('Password reset successfully!');
      setView('login');
      setForgotStep('email');
      setToken(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

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
        <button onClick={() => navigate('/register')} className="px-4 sm:px-6 py-2 sm:py-3 text-white rounded-full font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
          Get Started
        </button>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-1 pb-2 grid md:grid-cols-2 gap-4 sm:gap-8 items-start">
        <div className="space-y-2 flex flex-col justify-start">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold text-indigo-600 leading-tight mb-2">
              Insist on the<br />Highest Standards
            </h1>
            <p className="text-gray-600 text-sm sm:text-lg leading-relaxed">
              Empower your team with intelligent performance tracking, real-time analytics, and seamless collaboration tools designed for modern workplaces.
            </p>
          </div>
          <div className="animate-pop">
            <img src={teamIllustration} alt="Team Collaboration" className="w-full max-w-sm sm:max-w-md rounded-2xl" />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto w-full">
          {view === 'login' ? (
            <>
              <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-sm sm:text-base text-gray-500">Sign in to continue</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="alias@amazon.com" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2 sm:py-3 text-sm sm:text-base text-white rounded-xl font-semibold disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                  {loading ? 'Signing in...' : 'Log In'}
                </button>
              </form>
              <div className="mt-4 text-center space-y-2">
                <button onClick={() => setView('forgot')} className="text-xs sm:text-sm text-indigo-600 hover:underline block">Forgot your password?</button>
                <p className="text-xs sm:text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button onClick={() => navigate('/register')} className="text-indigo-600 hover:underline font-semibold">Register here</button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Reset Password</h2>
                <p className="text-sm sm:text-base text-gray-500">
                  {forgotStep === 'email' ? 'Enter your email to get a reset token' : 'Enter the token to reset password'}
                </p>
              </div>
              <div className="flex mb-4">
                <div className={`flex-1 text-center py-2 text-xs font-semibold rounded-l-lg ${forgotStep === 'email' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>Request Reset</div>
                <div className={`flex-1 text-center py-2 text-xs font-semibold rounded-r-lg ${forgotStep === 'reset' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>New Password</div>
              </div>
              {forgotStep === 'email' ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="yourname@amazon.com" required />
                  </div>
                  <button type="submit" disabled={loading} className="w-full text-white py-2 sm:py-3 text-sm sm:text-base rounded-xl font-semibold disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                    {loading ? 'Sending...' : 'Request Reset Token'}
                  </button>
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-500">Contact your manager to get the token</p>
                    <button type="button" onClick={() => setForgotStep('reset')} className="text-indigo-600 text-xs sm:text-sm hover:underline font-semibold">Already have a token?</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reset Token</label>
                    <input type="text" value={token} onChange={(e) => setToken(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono" placeholder="Paste your reset token" required />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="Enter new password" required />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showNewPassword ? '🙈' : '👁️'}</button>
                    </div>
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span>{req.test(newPassword) ? '✅' : '❌'}</span>
                            <span className={req.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="Confirm new password" required />
                    {confirmPassword && newPassword !== confirmPassword && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
                  </div>
                  <button type="submit" disabled={loading} className="w-full text-white py-2 sm:py-3 text-sm sm:text-base rounded-xl font-semibold disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button type="button" onClick={() => setForgotStep('email')} className="w-full text-indigo-600 text-xs sm:text-sm hover:underline font-semibold">← Back to email</button>
                </form>
              )}
              <div className="mt-4 text-center">
                <button onClick={() => setView('login')} className="text-gray-500 text-xs sm:text-sm hover:text-gray-700">← Back to Login</button>
              </div>
            </>
          )}
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
