import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./RegisterDealer.css";

export default function RegisterClient() {
  // Regex patterns
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i;
  const phoneRegex = /^\d{10}$/;
  const passwordRegex = /^[a-zA-Z0-9@#$]{5,15}$/;
  const zipRegex = /^\d{6}$/;

  // Validation state
  const [errors, setErrors] = useState({});

  // Helper to check if a field is valid
  const isValid = (field) => {
    if (field === 'email') return form.email && emailRegex.test(form.email);
    if (field === 'name') return !!form.name.trim();
    if (field === 'phone') return phoneRegex.test(form.phone);
    if (field === 'password') return passwordRegex.test(form.password);
    if (field === 'company') return true;
    if (field === 'gtin') return true;
    if (field === 'business') return true;
    if (field === 'country') return !!form.country;
    if (field === 'state') return !!form.state;
    if (field === 'city') return !!form.city;
    if (field === 'address') return !!form.address.trim();
    if (field === 'zip') return zipRegex.test(form.zip);
    return true;
  };

  // Helper to get dynamic input class
  const getInputClass = (field) => {
    if (errors[field]) return 'form-control input-error';
    if (isValid(field)) return 'form-control input-valid';
    return 'form-control';
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    company: "",
    gtin: "",
    business: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [dealers, setDealers] = React.useState([]);
  const [dealersLoading, setDealersLoading] = React.useState(true);
  const [dealersError, setDealersError] = React.useState("");
  const [selectedDealer, setSelectedDealer] = React.useState("");

  // Fetch dealers from /admindata/<user id> on mount
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('sc_user'));
    const userId = user && user.user && (user.user.id || user.user._id);
    if (!userId) {
      setDealersError("No user id found");
      setDealersLoading(false);
      return;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    setDealersLoading(true);
    fetch(`${baseUrl}/admindata/${userId}`)
      .then(res => res.json())
      .then(data => {
        let foundDealers = [];
        if (Array.isArray(data.dealers)) foundDealers = data.dealers;
        else if (Array.isArray(data.data?.dealers)) foundDealers = data.data.dealers;
        setDealers(foundDealers);
        setDealersLoading(false);
      })
      .catch(() => {
        setDealersError("Could not load dealers");
        setDealersLoading(false);
      });
  }, []);

  // Country, state, city data
  const countryOptions = [
    { value: "India", label: "India" },
    { value: "USA", label: "USA" },
    { value: "UK", label: "UK" },
    // Add more countries as needed
  ];
  const stateOptions = {
    India: [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
    ],
    USA: ["California", "Texas", "New York", "Florida", "Illinois"],
    UK: ["England", "Scotland", "Wales", "Northern Ireland"]
  };
  const cityOptions = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangalore", "Hubli", "Belgaum"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
    "England": ["London", "Manchester", "Liverpool", "Birmingham", "Leeds"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness"],
    // Add more as needed
  };

  // Dynamic field validation on change
  const validateField = (field, value) => {
    let error = '';
    if (!value || (typeof value === 'string' && !value.trim())) {
      error = 'This field is required';
    } else {
      if (field === 'email' && !emailRegex.test(value)) {
        error = 'Invalid email address.';
      } else if (field === 'phone' && !phoneRegex.test(value)) {
        error = 'Phone must be exactly 10 digits';
      } else if (field === 'password' && !passwordRegex.test(value)) {
        error = 'Password must be 5-15 characters (letters, numbers, @, #, $)';
      } else if (field === 'zip' && !zipRegex.test(value)) {
        error = 'Zip must be exactly 6 digits';
      }
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    // Reset dependent fields
    if (name === 'country') {
      setForm(f => ({ ...f, country: value, state: '', city: '', zip: '' }));
      validateField('country', value);
      validateField('state', '');
      validateField('city', '');
      validateField('zip', '');
    } else if (name === 'state') {
      setForm(f => ({ ...f, state: value, city: '', zip: '' }));
      validateField('state', value);
      validateField('city', '');
      validateField('zip', '');
    } else if (name === 'city') {
      setForm(f => ({ ...f, city: value, zip: '' }));
      validateField('city', value);
      validateField('zip', '');
    } else {
      setForm(f => ({ ...f, [name]: value }));
      validateField(name, value);
    }
  };

  // Validate fields
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.email.trim()) newErrors.email = 'Email is required.';
    else if (!emailRegex.test(form.email)) newErrors.email = 'Invalid email address.';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required.';
    else if (!phoneRegex.test(form.phone)) newErrors.phone = 'Phone must be exactly 10 digits';
    if (!form.password.trim()) newErrors.password = 'Password is required.';
    else if (!passwordRegex.test(form.password)) newErrors.password = 'Password must be 5-15 characters (letters, numbers, @, #, $)';
    // Company, GTIN, Business are optional
    if (!form.country) newErrors.country = 'Country is required.';
    if (!form.state) newErrors.state = 'State is required.';
    if (!form.city) newErrors.city = 'City is required.';
    if (!form.address.trim()) newErrors.address = 'Address is required.';
    if (!form.zip.trim()) newErrors.zip = 'Zip is required.';
    else if (!zipRegex.test(form.zip)) newErrors.zip = 'Zip must be exactly 6 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Get admin id from localStorage
      const user = JSON.parse(localStorage.getItem('sc_user'));
      const adminId = user && user.user && (user.user.id || user.user._id);
      if (!adminId) throw new Error('No admin id found');
      if (!selectedDealer) throw new Error('No dealer selected');
      const payload = {
        ...form,
        company_name: form.company,
        business_category: form.business,
        pin: form.zip,
        admin_id: adminId,
        dealer_id: selectedDealer,
        userType: 'client',
        sendEmail: true
      };
      delete payload.company;
      delete payload.business;
      delete payload.zip;
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to register client.');
      toast.success('Client registered successfully!');
      setForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        company: '',
        gtin: '',
        business: '',
        address: '',
        country: '',
        state: '',
        city: '',
        zip: ''
      });
      setErrors({});
    } catch (err) {
      toast.error(err.message || 'Failed to register client.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-dealer-content">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="page-title">Register New Client</h1>
      <p className="page-subtitle">Fill in the details below to register a new client under your admin account.</p>
      <div className="modern-form-card">
        <form className="dealer-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="dealer">Select Dealer <span style={{color:'red'}}>*</span></label>
              {dealersLoading ? (
                <div>Loading dealers...</div>
              ) : dealersError ? (
                <div style={{color:'red'}}>{dealersError}</div>
              ) : dealers.length === 0 ? (
                <div style={{color:'red'}}>No dealers found for this admin.</div>
              ) : (
                <select id="dealer" name="dealer" className="form-control" value={selectedDealer} onChange={e => setSelectedDealer(e.target.value)} required>
                  <option value="">Select Dealer</option>
                  {dealers.map(d => <option key={d.id || d._id} value={d.id || d._id}>{d.name || d.dealerName}</option>)}
                </select>
              )}
            </div>
          </div>
          {selectedDealer && (
            <>
              <div className="form-row">
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="name">Name <span style={{color:'red'}}>*</span></label>
                  <input type="text" id="name" name="name" className={getInputClass('name')} value={form.name} onChange={handleChange} required disabled={!selectedDealer} />
                  {errors.name && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.name}</div>}
                </div>
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="email">Email <span style={{color:'red'}}>*</span></label>
                  <input type="email" id="email" name="email" className={getInputClass('email')} value={form.email} onChange={handleChange} required />
                  {errors.email && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.email}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="phone">Phone <span style={{color:'red'}}>*</span></label>
                  <input type="tel" id="phone" name="phone" className={getInputClass('phone')} value={form.phone} onChange={handleChange} required />
                  {errors.phone && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.phone}</div>}
                </div>
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="password">Password <span style={{color:'red'}}>*</span></label>
                  <input type="password" id="password" name="password" className={getInputClass('password')} value={form.password} onChange={handleChange} required />
                  {errors.password && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.password}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="company">Company</label>
                  <input type="text" id="company" name="company" className="form-control" value={form.company} onChange={handleChange} />
                </div>
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="gtin">GTIN</label>
                  <input type="text" id="gtin" name="gtin" className="form-control" value={form.gtin} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="business">Business</label>
                  <input type="text" id="business" name="business" className="form-control" value={form.business} onChange={handleChange} />
                </div>
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="country">Country <span style={{color:'red'}}>*</span></label>
                  <select id="country" name="country" className={getInputClass('country')} value={form.country} onChange={handleChange} required>
                    <option value="">Select Country</option>
                    {countryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.country && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.country}</div>}
                </div>
              </div>
              {form.country && (
                <div className="form-row">
                  <div className="form-col" style={{width:'50%'}}>
                    <label htmlFor="state">State <span style={{color:'red'}}>*</span></label>
                    <select id="state" name="state" className={getInputClass('state')} value={form.state} onChange={handleChange} required>
                      <option value="">Select State</option>
                      {(stateOptions[form.country] || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.state}</div>}
                  </div>
                  {form.state && (
                    <div className="form-col" style={{width:'50%'}}>
                      <label htmlFor="city">City <span style={{color:'red'}}>*</span></label>
                      <select id="city" name="city" className={getInputClass('city')} value={form.city} onChange={handleChange} required>
                        <option value="">Select City</option>
                        {form.state && cityOptions[form.state] && cityOptions[form.state].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.city}</div>}
                    </div>
                  )}
                </div>
              )}
              {form.city && (
                <div className="form-row">
                  <div className="form-col" style={{width:'50%'}}>
                    <label htmlFor="address">Address <span style={{color:'red'}}>*</span></label>
                    <input type="text" id="address" name="address" className={getInputClass('address')} value={form.address} onChange={handleChange} required />
                    {errors.address && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.address}</div>}
                  </div>
                  <div className="form-col" style={{width:'50%'}}>
                    <label htmlFor="zip">Zip <span style={{color:'red'}}>*</span></label>
                    <input type="text" id="zip" name="zip" className={getInputClass('zip')} value={form.zip} onChange={handleChange} required />
                    {errors.zip && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.zip}</div>}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
