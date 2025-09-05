import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminDashboard from './AdminDashboard';
import './App.css';
import './LoginPage.css';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const LOGIN_ENDPOINT = import.meta.env.VITE_LOGIN_ENDPOINT || "/auth/login";

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
        toast.error(data.message || "Login failed");
        throw new Error(data.message || "Login failed");
      }
      toast.success("Login successful!");
      if (data.user && data.user.user.role === 'admin') {
        // Store user info in localStorage
        localStorage.setItem('sc_user', JSON.stringify(data.user));
        console.log('Redirecting to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('User role is not admin or user object missing:', data.user);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-app-container">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <i className="ri-car-line"></i>
              </div>
              <div className="logo-text">Smart<span>Challan</span></div>
            </div>
            <nav>
              <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#">Services</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#" style={{ color: '#0072ff' }}>Login</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="container">
            <h1>Login to your account</h1>
            <p>Enter your credentials to access your SmartChallan account.</p>
          </div>
        </section>
        <section className="registration-section" style={{ padding: '60px 0' }}>
          <div className="container">
            <div className="form-container">
              <div className="form-header">
                <h2>Login to your account</h2>
              </div>
              <form className="register-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className="form-control"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <span style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#777', background: 'none', border: 'none', padding: 0 }} onClick={() => setShowPassword(!showPassword)}>
                      <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </span>
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="container">
          <p>© 2025 SmartChallan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
