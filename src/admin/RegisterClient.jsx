import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./RegisterDealer.css";

function RegisterClient({ dealers = [] }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    userType: "client",
    dealer_id: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Country, state, city data (same as RegisterDealer)
  const countryOptions = [
    { value: "India", label: "India" },
    { value: "USA", label: "USA" },
    { value: "UK", label: "UK" },
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
    if (name === 'country') {
      setForm(f => ({ ...f, country: value, state: '', city: '', zip: '' }));
    } else if (name === 'state') {
      setForm(f => ({ ...f, state: value, city: '', zip: '' }));
    } else if (name === 'city') {
      setForm(f => ({ ...f, city: value, zip: '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, admin_id: adminId, userType: 'client' };
      if (!form.dealer_id) {
        toast.error("Please select a dealer under which to register the client.");
        setSubmitting(false);
        return;
      }
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to register client");
      toast.success("Client registered successfully!");
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        country: "",
        state: "",
        city: "",
        zip: "",
        userType: "client",
        dealer_id: ""
      });
    } catch (err) {
      toast.error(err.message || "Error registering client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-dealer-content">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <h1>Register New Client</h1>
      <p>Fill in the details below to register a new client under your admin account.</p>
      <div className="card">
        <h2><i className="ri-user-add-line"></i> Client Registration Form</h2>
        <form className="dealer-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-col" style={{width:'100%'}}>
              <label htmlFor="dealer_id">Select Dealer</label>
              <select id="dealer_id" name="dealer_id" className="form-control" value={form.dealer_id} onChange={handleChange} required>
                <option value="">Select Dealer</option>
                {dealers.length === 0 && <option disabled>No dealers found</option>}
                {dealers.map(d => (
                  <option key={d.id || d._id || d.email} value={d.id || d._id || d.email}>
                    {d.name || d.dealer_name || d.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" className="form-control" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" className="form-control" value={form.password} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="address">Address</label>
              <input type="text" id="address" name="address" className="form-control" value={form.address} onChange={handleChange} required />
            </div>
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="country">Country</label>
              <select id="country" name="country" className="form-control" value={form.country} onChange={handleChange} required>
                <option value="">Select Country</option>
                {countryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          {form.country && (
            <div className="form-row">
              <div className="form-col" style={{width:'50%'}}>
                <label htmlFor="state">State</label>
                <select id="state" name="state" className="form-control" value={form.state} onChange={handleChange} required>
                  <option value="">Select State</option>
                  {(stateOptions[form.country] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {form.state && (
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="city">City</label>
                  <select id="city" name="city" className="form-control" value={form.city} onChange={handleChange} required>
                    <option value="">Select City</option>
                    {(
                      cityOptions[form.state] && cityOptions[form.state].length > 0
                        ? cityOptions[form.state]
                        : [
                            form.state + " City 1",
                            form.state + " City 2",
                            form.state + " City 3"
                          ]
                    ).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
          {form.city && (
            <div className="form-row">
              <div className="form-col" style={{width:'50%'}}>
                <label htmlFor="zip">Zip</label>
                <input type="text" id="zip" name="zip" className="form-control" value={form.zip} onChange={handleChange} required />
              </div>
            </div>
          )}
          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Registering..." : "Register Client"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterClient;
