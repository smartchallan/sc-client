import scLogo from './assets/sc-logo.png';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientDashboard from './client/ClientDashboard';
import AdminDashboard from './admin/AdminDashboard';
import SuperDashboard from './super/SuperDashboard';
import DealerDashboard from './dealer/DealerDashboard';
import './App.css';
import './LoginPage.css';

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
      if (data.user && data.user.user.role === 'superuser') {
        localStorage.setItem('sc_user', JSON.stringify(data.user));
        console.log('Redirecting to /superkidboard');
        await delay(2000);
        navigate('/superkidboard', { replace: true });
      } else if (data.user && data.user.user.role === 'dealer') {
        localStorage.setItem('sc_user', JSON.stringify(data.user));
        console.log('Redirecting to /dealersmartboard');
        await delay(2000);
        navigate('/dealersmartboard', { replace: true });
      } else if (data.user && data.user.user.role === 'admin') {
        localStorage.setItem('sc_user', JSON.stringify(data.user));
        console.log('Redirecting to /adminsmartboard');
        await delay(2000);
        navigate('/adminsmartboard', { replace: true });
      } else if (data.user && data.user.user.role === 'client') {
        localStorage.setItem('sc_user', JSON.stringify(data.user));
        console.log('Redirecting to /smartboard');
        await delay(2000);
        navigate('/smartboard', { replace: true });
      } else {
        console.log('User role is not recognized or user object missing:', data.user);
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
    <div className="login-app-container">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo">
              {/* <div className="logo-icon">
                <i className="ri-car-line"></i>
              </div> */}
              {/* <div className="logo-text">Smart<span>Challan</span></div> */}
              <img src={scLogo} alt="App Logo" style={{height:70, marginBottom:8}} />
            </div>
            <nav>
              <ul>
                <li><a href="https://www.smartchallan.com/">Home</a></li>
                <li><a href="#services">Services</a></li>
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
                {/* <div style={{textAlign:'center', marginBottom:16}}>
                  <img src={scLogo} alt="App Logo" style={{height:100, marginBottom:8}} />
                </div> */}
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
  <Route path="/smartboard" element={<ClientDashboard />} />
  <Route path="/adminsmartboard" element={<AdminDashboard />} />
  <Route path="/superkidboard" element={<SuperDashboard />} />
  <Route path="/dealersmartboard" element={<DealerDashboard />} />
      </Routes>
    </Router>
  );
}
