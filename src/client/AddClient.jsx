import React, { useState } from 'react';
import { PiTrayArrowUpLight } from 'react-icons/pi';
import { toast } from 'react-toastify';

// Country -> states -> cities dataset. India expanded.
const GEO = {
  India: {
    states: {
      'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
      'Arunachal Pradesh': ['Itanagar'],
      'Assam': ['Guwahati', 'Dibrugarh', 'Silchar'],
      'Bihar': ['Patna', 'Gaya', 'Bhagalpur'],
      'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg'],
      'Goa': ['Panaji', 'Vasco da Gama'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
      'Haryana': ['Gurgaon', 'Faridabad', 'Panipat'],
      'Himachal Pradesh': ['Shimla', 'Dharamshala'],
      'Jharkhand': ['Ranchi', 'Jamshedpur'],
      'Karnataka': ['Bengaluru', 'Mysore', 'Mangalore', 'Hubli'],
      'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode'],
      'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur'],
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
      'Manipur': ['Imphal'],
      'Meghalaya': ['Shillong'],
      'Mizoram': ['Aizawl'],
      'Nagaland': ['Kohima'],
      'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela'],
      'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar'],
      'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur'],
      'Sikkim': ['Gangtok'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
      'Telangana': ['Hyderabad', 'Warangal'],
      'Tripura': ['Agartala'],
      'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Varanasi', 'Prayagraj', 'Meerut', 'Aligarh'],
      'Uttarakhand': ['Dehradun', 'Haridwar'],
      'West Bengal': ['Kolkata', 'Howrah', 'Durgapur'],
      'Delhi': ['New Delhi'],
      'Puducherry': ['Puducherry'],
    }
  },
  USA: {
    states: {
      California: ['Los Angeles', 'San Francisco'],
      Texas: ['Houston', 'Dallas']
    }
  }
};

export default function AddClient() {
    // Password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

    // Ensure form is blank on mount
    React.useEffect(() => {
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setCompany('');
      setGtin('');
      setBusiness('');
      setCountry('');
      setStateVal('');
      setCity('');
      setAddress('');
      setZip('');
      setSendEmail(false);
      setErrors({});
    }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [gtin, setGtin] = useState('');
  const [business, setBusiness] = useState('');
  const [errors, setErrors] = useState({});

  const [country, setCountry] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [zip, setZip] = useState('');

  const [saving, setSaving] = useState(false);

  const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    // inline validation for required fields
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!password) newErrors.password = 'Password is required';
    if (!country) newErrors.country = 'Country is required';
    if (!stateVal) newErrors.state = 'State is required';
    if (!city) newErrors.city = 'City is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!zip.trim()) newErrors.zip = 'Zip code is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      toast.error('Please fix the errors in the form');
      return;
    }
    setSaving(true);
    // Get logged-in user id for parent_id
    let parentId = 0;
    try {
      const scUser = JSON.parse(localStorage.getItem('sc_user')) || {};
      parentId = scUser.user?.id || scUser.user?.client_id || scUser.user?._id || 0;
    } catch {}
    // Build payload as per sample
    const payload = {
      name,
      email,
      phone,
      password,
      gtin,
      address,
      country,
      state: stateVal,
      city,
      company_name: company,
      business_category: business,
      pin: zip,
      parent_id: parentId,
      sendEmail
    };

    try {
      const res = await fetch(`${API_ROOT}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || 'Client added');
        // Clear cached client network data so it's refreshed on next view
        localStorage.removeItem('client_network');
        // reset form
        setName(''); setEmail(''); setPhone(''); setPassword(''); setCompany(''); setGtin(''); setBusiness('');
        setCountry(''); setStateVal(''); setCity(''); setAddress(''); setZip('');
        setSendEmail(false);
      } else {
        toast.error(data.message || 'Failed to add client');
      }
    } catch (e) {
      toast.error('Failed to add client');
    } finally {
      setSaving(false);
    }
  };

  const availableStates = country && GEO[country] ? Object.keys(GEO[country].states) : [];
  const availableCities = country && stateVal && GEO[country] && GEO[country].states[stateVal] ? GEO[country].states[stateVal] : [];

  return (
    <div style={{ padding: 18 }}>
      {/* <h1 className="page-title">Add Client</h1> */}
      <p className="page-subtitle">Create a new client account — provide contact and location details.</p>

      <div className="modern-form-card" style={{ width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Name <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
              <input className={`form-control ${errors.name ? 'input-error' : ''}`} value={name} onChange={e => { setName(e.target.value); setErrors(s => ({ ...s, name: null })); }} />
              {errors.name && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.name}</div>}
            </div>
            <div className="form-col">
              <label className="form-label">Email <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
              <input className={`form-control ${errors.email ? 'input-error' : ''}`} type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(s => ({ ...s, email: (!/^\S+@\S+\.\S+$/.test(e.target.value) ? 'Invalid email' : null) })); }} />
              {errors.email && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.email}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Phone <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
              <input className={`form-control ${errors.phone ? 'input-error' : ''}`} value={phone} onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setPhone(digits.slice(0,10)); setErrors(s => ({ ...s, phone: (!/^\d{10}$/.test(digits) ? 'Enter 10 digit phone' : null) })); }} />
              {errors.phone && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.phone}</div>}
            </div>
            <div className="form-col">
              <label className="form-label">Password <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className={`form-control ${errors.password ? 'input-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(s => ({ ...s, password: null })); }}
                  style={{ paddingRight: 36 }}
                />
                <span
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#777',
                    fontSize: 18
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.29-3.14-11-8 1.21-3.06 3.6-5.5 6.58-6.71"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.47-.09-.92-.26-1.33"/></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </span>
              </div>
              {errors.password && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.password}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Company</label>
              <input className="form-control" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            <div className="form-col">
              <label className="form-label">GTIN</label>
              <input className="form-control" value={gtin} onChange={e => setGtin(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Business</label>
              <input className="form-control" value={business} onChange={e => setBusiness(e.target.value)} />
            </div>
            <div className="form-col">
              <label className="form-label">Country <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
              <select className={`form-control ${errors.country ? 'input-error' : ''}`} value={country} onChange={e => { setCountry(e.target.value); setStateVal(''); setCity(''); setAddress(''); setZip(''); setErrors(s => ({ ...s, country: null })); }}>
                <option value="">-- Select Country --</option>
                {Object.keys(GEO).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.country}</div>}
            </div>
          </div>

          {country && (
            <div className="form-row">
              <div className="form-col">
                <label className="form-label">State <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
                <select className={`form-control ${errors.state ? 'input-error' : ''}`} value={stateVal} onChange={e => { setStateVal(e.target.value); setCity(''); setAddress(''); setZip(''); setErrors(s => ({ ...s, state: null })); }}>
                  <option value="">-- Select State --</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.state}</div>}
              </div>
              <div className="form-col">
                <label className="form-label">City <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
                <select className={`form-control ${errors.city ? 'input-error' : ''}`} value={city} onChange={e => { setCity(e.target.value); setAddress(''); setZip(''); setErrors(s => ({ ...s, city: null })); }}>
                  <option value="">-- Select City --</option>
                  {availableCities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
                {errors.city && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.city}</div>}
              </div>
            </div>
          )}

          {city && (
            <div className="form-row">
              <div className="form-col">
                <label className="form-label">Address</label>
                <input className="form-control" value={address} onChange={e => { setAddress(e.target.value); setErrors(s => ({ ...s, address: null })); }} />
              </div>
              <div className="form-col">
                <label className="form-label">Zip Code <span style={{color:'#e74c3c', marginLeft:6}}>*</span></label>
                <input className={`form-control ${errors.zip ? 'input-error' : ''}`} value={zip} onChange={e => { setZip(e.target.value); setErrors(s => ({ ...s, zip: null })); }} />
                {errors.zip && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 6 }}>{errors.zip}</div>}
              </div>
            </div>
          )}

          <div className="form-row" style={{ marginTop: 12 }}>
            <div className="form-col">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Send email to client
              </label>
            </div>
            <div className="form-col">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Client'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
