
import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./RegisterDealer.css";

export default function RegisterDealer() {
  // Email regex
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i;

  // Validation state
  const [errors, setErrors] = useState({});
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
    zip: "",
    userType: "dealer"
  });
  const [submitting, setSubmitting] = useState(false);

  function validateField(field, value) {
    const requiredFields = ['name', 'email', 'phone', 'password', 'address', 'country', 'state', 'city', 'zip'];
    setErrors(prev => {
      const newErrors = { ...prev };
      if (requiredFields.includes(field)) {
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field] = 'This field is required';
        } else {
          delete newErrors[field];
        }
      }
      return newErrors;
    });
  }
  function validate(form) {
    const requiredFields = ['name', 'email', 'phone', 'password', 'country', 'state', 'city', 'address', 'zip'];
    const newErrors = {};
    requiredFields.forEach(field => {
      if (!form[field] || (typeof form[field] === 'string' && !form[field].trim())) {
        newErrors[field] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Helper to check if a field is valid
  const isValid = (field) => {
    if (field === 'email') return form.email && emailRegex.test(form.email);
    if (field === 'name') return !!form.name.trim();
    if (field === 'phone') return !!form.phone.trim();
    if (field === 'password') return !!form.password.trim();
    if (field === 'country') return !!form.country;
    if (field === 'state') return !!form.state;
    if (field === 'city') return !!form.city;
    if (field === 'address') return !!form.address.trim();
    if (field === 'zip') return !!form.zip.trim();
    return true;
  };

  // Helper to get dynamic input class
  const getInputClass = (field) => {
    if (errors[field]) return 'form-control input-error';
    if (isValid(field)) return 'form-control input-valid';
    return 'form-control';
  };

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

  // Get logged-in admin id from localStorage
  const adminId = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('sc_user'));
      return user && user.user && user.user.id ? user.user.id : null;
    } catch {
      return null;
    }
  })();


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


  const handleSubmit = async e => {
    e.preventDefault();
  if (!validate(form)) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        company_name: form.company,
        business_category: form.business,
        pin: form.zip,
        admin_id: adminId,
        userType: 'dealer',
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
      if (!res.ok) throw new Error("Failed to register dealer");
      toast.success("Dealer registered successfully!");
      setForm({
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
        zip: "",
        userType: "dealer"
      });
      setErrors({});
    } catch (err) {
      toast.error(err.message || "Error registering dealer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-dealer-content">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="page-title">Register New Dealer</h1>
      <p className="page-subtitle">Fill in the details below to register a new dealer under your admin account.</p>
      <div className="modern-form-card">
        <form className="dealer-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="name">Name <span style={{color:'red'}}>*</span></label>
              <input type="text" id="name" name="name" className={getInputClass('name')} value={form.name} onChange={handleChange} required />
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
              <div className="form-col" style={{width:'50%'}}>
                {form.state && (
                  <>
                    <label htmlFor="city">City <span style={{color:'red'}}>*</span></label>
                    <select id="city" name="city" className={getInputClass('city')} value={form.city} onChange={handleChange} required>
                      <option value="">Select City</option>
                      {form.state && cityOptions[form.state] && cityOptions[form.state].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.city && <div style={{color:'red',fontSize:13,marginTop:2}}>{errors.city}</div>}
                  </>
                )}
              </div>
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
          <div style={{textAlign:'right', marginTop:16}}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Registering..." : "Register Dealer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
