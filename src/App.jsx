import scLogo from './assets/sc-logo.png';
import { resolvePerHostEnv, getWhitelabelHosts } from './utils/whitelabel';
import { trackLoginActivity } from './utils/activityTracker';

// Whitelabel config
const WHITELABEL_HOSTS = getWhitelabelHosts();
const CURRENT_HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
const DEFAULT_HOST = 'app.smartchallan.com';
const IS_DEFAULT_DOMAIN = CURRENT_HOSTNAME === DEFAULT_HOST;
const IS_WHITELABEL = WHITELABEL_HOSTS.includes(CURRENT_HOSTNAME) && !IS_DEFAULT_DOMAIN;

// Resolve per-host values (order: full-hostname, domain_tld, second-level, CUSTOM)
const CUSTOM_LOGO_URL = resolvePerHostEnv(CURRENT_HOSTNAME, 'LOGO_URL') || import.meta.env.VITE_CUSTOM_LOGO_URL || null;
const CUSTOM_FAVICON_URL = resolvePerHostEnv(CURRENT_HOSTNAME, 'FAVICON_URL') || import.meta.env.VITE_CUSTOM_FAVICON_URL || null;
const CUSTOM_COPYRIGHT = resolvePerHostEnv(CURRENT_HOSTNAME, 'COPYRIGHT') || import.meta.env.VITE_CUSTOM_COPYRIGHT || null;

// Set favicon dynamically if whitelabel
if (IS_WHITELABEL && CUSTOM_FAVICON_URL) {
  const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.rel = 'icon';
  link.href = CUSTOM_FAVICON_URL;
  document.head.appendChild(link);
}
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientDashboard from './client/ClientDashboard';
import TrafficChallanAnimation from './components/TrafficChallanAnimation';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
// import AdminDashboard from './admin/AdminDashboard';
// import SuperDashboard from './super/SuperDashboard';
// import DealerDashboard from './dealer/DealerDashboard';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const LOGIN_ENDPOINT = "/auth/login";

// Toastify used instead of custom Toast

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Show loader for at least 2 seconds
    const delay = ms => new Promise(res => setTimeout(res, ms));
    let loginSuccess = false;
    let loginMessage = "";
    try {
      const response = await fetch(API_ROOT + LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log('Login API response:', data);
      if (!response.ok) {
        loginMessage = data.message || "Login failed";
        toast.error(loginMessage);
        throw new Error(loginMessage);
      }
      loginSuccess = true;
      loginMessage = "Login successful!";
      toast.success(loginMessage);
      // Normalize and store user info in localStorage for client dashboard
      try {
        const stored = {
          user: data.user || {},
          userMeta: data.userMeta || {},
          token: data.token || null,
          // Preserve legacy user_options location or top-level user_options
          user_options: data.user_options || (data.user && data.user.user_options) || {},
          // New flag (from /login) indicating whether this account has clients
          hasClients: data.hasClients || false,
          // Trial account info (account_type and trial_expires_at are inside data.user)
          // They are already part of data.user so no extra storage needed; kept here for clarity
        };
        localStorage.setItem('sc_user', JSON.stringify(stored));
        
        // Track login activity
        const userId = data.user?.id || data.user?.user_id;
        const parentId = data.user?.parent_id ?? null; // Use nullish coalescing to preserve 0
        const clientName = data.user?.name || null;
        if (userId) {
          trackLoginActivity(userId, parentId, clientName).catch(err => {
            console.error('Failed to track login activity:', err);
          });
        }
      } catch (e) {}
      // Always redirect to client dashboard regardless of role
      await delay(2000);
      try {
        navigate('/smartboard', { replace: true });
      } catch (e) {
        try { window.location.hash = '/smartboard'; } catch (_) { window.location.replace('/#/smartboard'); }
      }
    } catch (err) {
      if (!loginSuccess) {
        await delay(2000);
      }
      // toast already shown above
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <ToastContainer 
        position="top-right"
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover
        theme="light"
        className="!top-4 !right-4 z-[9999]"
        toastClassName="!bg-white !rounded-lg !shadow-2xl !border !border-slate-200"
      />
      
      {/* Left Side - Traffic Challan Animation */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5">
        <TrafficChallanAnimation />
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <img 
                src={(IS_WHITELABEL && CUSTOM_LOGO_URL) ? CUSTOM_LOGO_URL : scLogo} 
                alt="App Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-600">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 pr-12"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-5 h-5" />
                  ) : (
                    <FaEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Contact Admin
              </a>
            </p>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center text-xs text-slate-500">
            {(IS_WHITELABEL && CUSTOM_COPYRIGHT) ? CUSTOM_COPYRIGHT : '© 2025 SmartChallan. All rights reserved.'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
  <Route path="/smartboard" element={<ClientDashboard />} />
  {/* <Route path="/adminsmartboard" element={<AdminDashboard />} /> */}
  {/* <Route path="/superkidboard" element={<SuperDashboard />} /> */}
  {/* <Route path="/dealersmartboard" element={<DealerDashboard />} /> */}
      </Routes>
    </Router>
  );
}
