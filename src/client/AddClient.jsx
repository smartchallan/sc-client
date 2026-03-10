import React, { useState } from 'react';
import { PiTrayArrowUpLight } from 'react-icons/pi';
import { ToastContainer, toast } from 'react-toastify';

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
    const [addClientTab, setAddClientTab] = useState('contact');

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
    } catch (e) {
      console.error('Failed to get parent_id from localStorage:', e);
    }
    
    // Prevent submission if parent_id is invalid
    if (!parentId || parentId === 0) {
      toast.error('Session error: Unable to identify parent user. Please logout and login again.');
      setSaving(false);
      return;
    }
    
    console.log('Adding client with parent_id:', parentId); // Debug log
    
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
      
      console.log('Add client response:', { status: res.status, ok: res.ok, data }); // Debug log
      
      if (res.ok) {
        toast.success(data.message || 'Client added');
        // Clear cached client network data so it's refreshed on next view
        localStorage.removeItem('client_network');
        // reset form
        setName(''); setEmail(''); setPhone(''); setPassword(''); setCompany(''); setGtin(''); setBusiness('');
        setCountry(''); setStateVal(''); setCity(''); setAddress(''); setZip('');
        setSendEmail(false);
      } else {
        // Log the error details for debugging
        console.error('Add client failed:', data);
        toast.error(data.message || 'Failed to add client');
      }
    } catch (e) {
      console.error('Add client error:', e);
      toast.error('Failed to add client');
    } finally {
      setSaving(false);
    }
  };

  const availableStates = country && GEO[country] ? Object.keys(GEO[country].states) : [];
  const availableCities = country && stateVal && GEO[country] && GEO[country].states[stateVal] ? GEO[country].states[stateVal] : [];

  const addClientTabs = [
    { key: 'contact', label: 'Contact Details', icon: 'ri-contacts-line' },
    { key: 'business', label: 'Business Info', icon: 'ri-building-line' },
    { key: 'location', label: 'Location', icon: 'ri-map-pin-line' },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />

      {/* Dashboard-style gradient banner header */}
      <div className="profile-banner">
        <div className="profile-banner-bg-circle profile-banner-bg-circle-1" />
        <div className="profile-banner-bg-circle profile-banner-bg-circle-2" />
        <div className="profile-banner-inner">
          <div className="profile-banner-left">
            <div className="profile-picture" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <i className="ri-user-add-line" style={{ fontSize: 24 }}></i>
            </div>
            <div className="profile-banner-info">
              <div className="profile-banner-name">Add New Client</div>
              <div className="profile-banner-email">Create a new client account — provide contact and location details</div>
              <div className="profile-banner-legends">
                <span><i className="ri-shield-check-line"></i> Secure Registration</span>
                <span><i className="ri-mail-send-line"></i> Email Invitation</span>
                <span><i className="ri-team-line"></i> Client Network</span>
              </div>
            </div>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="profile-tabs">
          {addClientTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`profile-tab ${addClientTab === tab.key ? 'active' : ''}`}
              onClick={() => setAddClientTab(tab.key)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Contact Details Tab */}
        {addClientTab === 'contact' && (
          <div className="profile-section">
            <h3><i className="ri-contacts-line" style={{ color: '#6366f1' }}></i> Contact Details</h3>
            <div className="form-row">
              <div className="form-col">
                <label className="form-label">Name <span style={{color:'#ef4444'}}>*</span></label>
                <input className={`form-control ${errors.name ? 'input-error' : ''}`} placeholder="Enter full name" value={name} onChange={e => { setName(e.target.value); setErrors(s => ({ ...s, name: null })); }} />
                {errors.name && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div className="form-col">
                <label className="form-label">Email <span style={{color:'#ef4444'}}>*</span></label>
                <input className={`form-control ${errors.email ? 'input-error' : ''}`} type="email" placeholder="email@example.com" value={email} onChange={e => { setEmail(e.target.value); setErrors(s => ({ ...s, email: (!/^\S+@\S+\.\S+$/.test(e.target.value) ? 'Invalid email' : null) })); }} />
                {errors.email && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label className="form-label">Phone <span style={{color:'#ef4444'}}>*</span></label>
                <input className={`form-control ${errors.phone ? 'input-error' : ''}`} placeholder="10-digit number" value={phone} onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setPhone(digits.slice(0,10)); setErrors(s => ({ ...s, phone: (!/^\d{10}$/.test(digits) ? 'Enter 10 digit phone' : null) })); }} />
                {errors.phone && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
              </div>
              <div className="form-col">
                <label className="form-label">Password <span style={{color:'#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`form-control ${errors.password ? 'input-error' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Set a password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(s => ({ ...s, password: null })); }}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      fontSize: 18,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
                {errors.password && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" className="btn btn-primary" onClick={() => setAddClientTab('business')}>
                Next: Business Info <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        )}

        {/* Business Details Tab */}
        {addClientTab === 'business' && (
          <div className="profile-section">
            <h3><i className="ri-building-line" style={{ color: '#6366f1' }}></i> Business Details</h3>
            <div className="form-row">
              <div className="form-col">
                <label className="form-label">Company</label>
                <input className="form-control" placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div className="form-col">
                <label className="form-label">GTIN</label>
                <input className="form-control" placeholder="GTIN number" value={gtin} onChange={e => setGtin(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label className="form-label">Business Category</label>
                <input className="form-control" placeholder="e.g. Transport, Logistics" value={business} onChange={e => setBusiness(e.target.value)} />
              </div>
              <div className="form-col">
                <label className="form-label">Country <span style={{color:'#ef4444'}}>*</span></label>
                <select className={`form-control ${errors.country ? 'input-error' : ''}`} value={country} onChange={e => { setCountry(e.target.value); setStateVal(''); setCity(''); setAddress(''); setZip(''); setErrors(s => ({ ...s, country: null })); }}>
                  <option value="">-- Select Country --</option>
                  {Object.keys(GEO).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.country && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.country}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
              <button type="button" className="btn btn-outline" onClick={() => setAddClientTab('contact')}>
                <i className="ri-arrow-left-line"></i> Back
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setAddClientTab('location')}>
                Next: Location <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        )}

        {/* Location Details Tab */}
        {addClientTab === 'location' && (
          <div className="profile-section">
            <h3><i className="ri-map-pin-line" style={{ color: '#6366f1' }}></i> Location Details</h3>
            {!country ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <i className="ri-map-pin-line" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}></i>
                <p style={{ fontSize: 14 }}>Please select a country in the <strong>Business Info</strong> tab first.</p>
                <button type="button" className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => setAddClientTab('business')}>
                  <i className="ri-arrow-left-line"></i> Go to Business Info
                </button>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">State <span style={{color:'#ef4444'}}>*</span></label>
                    <select className={`form-control ${errors.state ? 'input-error' : ''}`} value={stateVal} onChange={e => { setStateVal(e.target.value); setCity(''); setAddress(''); setZip(''); setErrors(s => ({ ...s, state: null })); }}>
                      <option value="">-- Select State --</option>
                      {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.state}</div>}
                  </div>
                  <div className="form-col">
                    <label className="form-label">City <span style={{color:'#ef4444'}}>*</span></label>
                    <select className={`form-control ${errors.city ? 'input-error' : ''}`} value={city} onChange={e => { setCity(e.target.value); setAddress(''); setZip(''); setErrors(s => ({ ...s, city: null })); }}>
                      <option value="">-- Select City --</option>
                      {availableCities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                    {errors.city && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.city}</div>}
                  </div>
                </div>

                {city && (
                  <div className="form-row">
                    <div className="form-col">
                      <label className="form-label">Address <span style={{color:'#ef4444'}}>*</span></label>
                      <input className={`form-control ${errors.address ? 'input-error' : ''}`} placeholder="Street address" value={address} onChange={e => { setAddress(e.target.value); setErrors(s => ({ ...s, address: null })); }} />
                      {errors.address && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.address}</div>}
                    </div>
                    <div className="form-col">
                      <label className="form-label">Zip Code <span style={{color:'#ef4444'}}>*</span></label>
                      <input className={`form-control ${errors.zip ? 'input-error' : ''}`} placeholder="Postal code" value={zip} onChange={e => { setZip(e.target.value); setErrors(s => ({ ...s, zip: null })); }} />
                      {errors.zip && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.zip}</div>}
                    </div>
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
              <button type="button" className="btn btn-outline" onClick={() => setAddClientTab('business')}>
                <i className="ri-arrow-left-line"></i> Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={e => setSendEmail(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#6366f1' }}
                  />
                  Send welcome email
                </label>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <><i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i> Adding...</>
                  ) : (
                    <><i className="ri-user-add-line"></i> Add Client</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
