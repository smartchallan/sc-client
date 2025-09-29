import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./RegisterDealer.css";

function RegisterClient({ dealers = [] }) {
  // Get logged in admin id
  const getAdminId = () => {
    try {
      const userObj = JSON.parse(localStorage.getItem("sc_user"));
      return userObj && userObj.user && (userObj.user.id || userObj.user._id);
    } catch {
      return null;
    }
  };
  // Add cityOptions for state/city dropdowns
  const cityOptions = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangalore", "Hubli", "Belgaum"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
    "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton"],
    // Add more states/provinces as needed
  };
  // Add stateOptions for country/state dropdowns
  const stateOptions = {
    IN: ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"],
    US: ["California", "Texas", "New York", "Florida", "Illinois"],
    CA: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba"]
  };
  const [submitting, setSubmitting] = useState(false);
  const countryOptions = [
    { value: "IN", label: "India" },
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" }
    // Add more countries as needed
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const REGISTER_ENDPOINT = "/auth/register";
      const payload = { ...form, admin_id: getAdminId() };
      const res = await fetch(API_ROOT + REGISTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Client registered successfully");
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
          dealer_id: "",
          billingType: "postpaid",
          prepaidAmount: "",
          costPerVehicle: "",
          costPerChallan: ""
        });
      } else {
        toast.error(result.message || "Failed to register client");
      }
    } catch (err) {
      toast.error("Error registering client");
    } finally {
      setSubmitting(false);
    }
  };
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
    dealer_id: "",
    billingType: "postpaid",
    prepaidAmount: "",
    costPerVehicle: "",
    costPerChallan: ""
  });

  // ...existing code...
  return (
    <div className="register-dealer-content">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <h1>Register New Client</h1>
      <p>Fill in the details below to register a new client under your admin account.</p>
      <div className="card">
        <h2><i className="ri-user-add-line"></i> Client Registration Form</h2>
        <form className="dealer-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="dealer_id">Select Dealer</label>
              <select id="dealer_id" name="dealer_id" className="form-control" style={{width:'100%'}} value={form.dealer_id} onChange={handleChange} required>
                <option value="">Select Dealer</option>
                {dealers.length === 0 && <option disabled>No dealers found</option>}
                {dealers.map(d => (
                  <option key={d.id || d._id || d.email} value={d.id || d._id || d.email}>
                    {d.name || d.dealer_name || d.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" className="form-control" style={{width:'100%'}} value={form.name} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" className="form-control" style={{width:'100%'}} value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" className="form-control" style={{width:'100%'}} value={form.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" className="form-control" style={{width:'100%'}} value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="address">Address</label>
              <input type="text" id="address" name="address" className="form-control" style={{width:'100%'}} value={form.address} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-row">
            
            <div className="form-col" style={{width:'50%'}}>
              <label htmlFor="country">Country</label>
              <select id="country" name="country" className="form-control" style={{width:'100%'}} value={form.country} onChange={handleChange} required>
                <option value="">Select Country</option>
                {countryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          {form.country && (
            <div className="form-row">
              <div className="form-col" style={{width:'50%'}}>
                <label htmlFor="state">State</label>
                <select id="state" name="state" className="form-control" style={{width:'100%'}} value={form.state} onChange={handleChange} required>
                  <option value="">Select State</option>
                  {(stateOptions[form.country] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {form.state && (
                <div className="form-col" style={{width:'50%'}}>
                  <label htmlFor="city">City</label>
                  <select id="city" name="city" className="form-control" style={{width:'100%'}} value={form.city} onChange={handleChange} required>
                    <option value="">Select City</option>
                    {(cityOptions[form.state] && cityOptions[form.state].length > 0
                      ? cityOptions[form.state]
                      : [
                          form.state + " City 1",
                          form.state + " City 2",
                          form.state + " City 3"
                        ]
                    ).map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              )}
            </div>
          )}
          {form.city && (
            <div className="form-row">
              <div className="form-col" style={{width:'50%'}}>
                <label htmlFor="zip">Zip</label>
                <input type="text" id="zip" name="zip" className="form-control" style={{width:'100%'}} value={form.zip} onChange={handleChange} required />
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
