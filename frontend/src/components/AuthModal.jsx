import { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Check,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [suggestSignIn, setSuggestSignIn] = useState(false);

  // Close modal on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Password Validation Metrics
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<> balance]/.test(password);

  const getPasswordStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;
    return score;
  };

  const strengthScore = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuggestSignIn(false);

    // Client-side validation
    if (isSignUp && !hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const payload = isSignUp ? { name, email, password } : { email, password };

      const res = await axios.post(`${API_URL}${endpoint}`, payload);

      const token = res.data?.token || res.data?.accessToken || res.data?.jwt;
      const user = res.data?.user || (res.data?.token ? res.data : null);

      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      setIsSuccess(true);

      setTimeout(() => {
        if (onSuccess) onSuccess({ user, token });
        
        setEmail('');
        setPassword('');
        setName('');
        setIsSuccess(false);
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Auth Error:', err);
      
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;

      if (status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (status === 400 || status === 409) {
        if (isSignUp) {
          setError('An account with this email already exists.');
          setSuggestSignIn(true);
        } else {
          setError(serverMsg || 'Invalid login details provided.');
        }
      } else if (status === 429) {
        setError('Too many login attempts. Please try again in 1 minute.');
      } else if (!err.response) {
        setError('Network error. Unable to connect to the backend server.');
      } else {
        setError(serverMsg || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuggestSignIn(false);
    setShowPassword(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-[100] transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800/90 w-full max-w-md rounded-3xl p-6 sm:p-8 relative shadow-2xl shadow-amber-500/5 transition-all transform animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-700/50 transition-all duration-200 active:scale-95 cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Success View */}
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-90 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              {isSignUp ? 'Account Created!' : 'Authenticated!'}
            </h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              Welcome to TopGun Barbershop
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3 shadow-sm">
                <Sparkles size={12} className="text-amber-400 animate-pulse" />
                {isSignUp ? 'New Client' : 'Welcome Back'}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isSignUp ? 'Create an Account' : 'Sign In to Account'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-1.5 leading-relaxed">
                {isSignUp 
                  ? 'Sign up to quickly schedule appointments and manage your visits' 
                  : 'Enter your credentials to access your dashboard'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
                {suggestSignIn && (
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer self-start"
                  >
                    <RefreshCw size={12} />
                    <span>Switch to Sign In instead</span>
                  </button>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <User size={12} className="text-amber-500" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white font-medium placeholder:text-zinc-600 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/60 transition-all duration-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Mail size={12} className="text-amber-500" /> Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white font-medium placeholder:text-zinc-600 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/60 transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Lock size={12} className="text-amber-500" /> Password
                  </label>
                  {!isSignUp && (
                    <a href="#" className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
                      Forgot?
                    </a>
                  )}
                </div>
                
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl pl-4 pr-11 py-3 text-sm text-white font-medium placeholder:text-zinc-600 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/60 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator (Sign-Up Only) */}
                {isSignUp && password.length > 0 && (
                  <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex gap-1.5 h-1">
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= 1 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400">
                      <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <Check size={10} /> 8+ chars
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <Check size={10} /> 1 number
                      </span>
                      <span className={`flex items-center gap-1 ${hasSpecialChar ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <Check size={10} /> 1 symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox (Sign-In Only) */}
              {!isSignUp && (
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-amber-500 focus:ring-amber-500/20 accent-amber-500 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs font-semibold text-zinc-400 cursor-pointer select-none">
                    Remember me on this device
                  </label>
                </div>
              )}

              {/* Action Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-zinc-950 font-black py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-200 active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-zinc-950" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight size={16} className="stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            {/* SSL Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-zinc-500 mt-4">
              <ShieldCheck size={13} className="text-amber-500/80" />
              <span>256-bit SSL Encrypted Connection</span>
            </div>

            {/* Toggle Mode */}
            <div className="mt-5 text-center pt-4 border-t border-zinc-800/80">
              <p className="text-xs text-zinc-400 font-medium">
                {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button 
                  type="button"
                  onClick={handleToggleMode}
                  className="text-amber-400 font-black hover:text-amber-300 hover:underline transition-all cursor-pointer ml-1"
                >
                  {isSignUp ? 'Sign In' : 'Create one'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}