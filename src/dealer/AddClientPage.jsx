
export default function AddClientPage() {
  const INDIA_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];
  const USA_STATES = ["California", "Texas", "New York"];
  const AUS_STATES = ["New South Wales", "Victoria", "Queensland"];
  const CITIES = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Tawang", "Pasighat"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar"],
    "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamshala"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
    "Meghalaya": ["Shillong", "Tura", "Jowai"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Noida"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Karol Bagh", "Saket"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    "Ladakh": ["Leh", "Kargil"],
    // Existing non-India states
    "California": ["Los Angeles", "San Francisco", "San Diego"],
    "Texas": ["Houston", "Dallas", "Austin"],
    "New South Wales": ["Sydney", "Newcastle", "Wollongong"]
  };
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gtin: "",
    country: "",
    state: "",
    city: "",
    address: "",
    pin: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (fieldValues = form) => {
    let temp = { ...errors };
    if ("name" in fieldValues)
      temp.name = fieldValues.name ? "" : "Name is required.";
    if ("email" in fieldValues) {
      temp.email = fieldValues.email
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValues.email)
          ? ""
          : "Email is not valid."
        : "Email is required.";
    }
    if ("phone" in fieldValues) {
      temp.phone = fieldValues.phone
        ? /^\d{10}$/.test(fieldValues.phone)
          ? ""
          : "Phone must be 10 digits."
        : "Phone is required.";
    }
    if ("country" in fieldValues)
      temp.country = fieldValues.country ? "" : "Country is required.";
    if ("state" in fieldValues)
      temp.state = fieldValues.state ? "" : "State is required.";
    if ("city" in fieldValues)
      temp.city = fieldValues.city ? "" : "City is required.";
    if (form.city && "address" in fieldValues)
      temp.address = fieldValues.address ? "" : "Address is required.";
    if (form.city && "pin" in fieldValues)
      temp.pin = fieldValues.pin ? "" : "Pin is required.";
    setErrors({ ...temp });
    return Object.values(temp).every((x) => x === "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value, ...(name === "country" ? { state: "", city: "" } : {}), ...(name === "state" ? { city: "" } : {}) }));
    validate({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        alert("Client registered! (demo)");
        setForm({ name: "", email: "", phone: "", gtin: "", country: "", state: "", city: "", address: "", pin: "" });
        setErrors({});
      }, 1000);
    }
  };

  return (
    <div className="dealer-content">
      <h1 className="page-title">Register New Client</h1>
      <p className="page-subtitle">Fill the form to add a new client to your account.</p>
      <div className="modern-form-card">
        <form className="vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="name">Name<span style={{color:'red'}}>*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              required
              style={{
                borderColor: errors.name
                  ? 'red'
                  : form.name
                  ? 'green'
                  : undefined
              }}
            />
            {errors.name && <div className="form-error" style={{color:'red', fontSize:12}}>{errors.name}</div>}
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="email">Email<span style={{color:'red'}}>*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                borderColor: errors.email
                  ? 'red'
                  : form.email
                  ? 'green'
                  : undefined
              }}
            />
            {errors.email && <div className="form-error" style={{color:'red', fontSize:12}}>{errors.email}</div>}
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="phone">Phone<span style={{color:'red'}}>*</span></label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-control"
              value={form.phone}
              onChange={handleChange}
              required
              maxLength={10}
              pattern="\d{10}"
              style={{
                borderColor: errors.phone
                  ? 'red'
                  : form.phone
                  ? 'green'
                  : undefined
              }}
            />
            {errors.phone && <div className="form-error" style={{color:'red', fontSize:12}}>{errors.phone}</div>}
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="gtin">GTIN</label>
            <input type="text" id="gtin" name="gtin" className="form-control" value={form.gtin} onChange={handleChange} />
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="country">Country<span style={{color:'red'}}>*</span></label>
            <select id="country" name="country" className="form-control" value={form.country} onChange={handleChange} required>
              <option value="">Select Country</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
          {form.country && (
            <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
              <label htmlFor="state">State<span style={{color:'red'}}>*</span></label>
              <select id="state" name="state" className="form-control" value={form.state} onChange={handleChange} required>
                <option value="">Select State</option>
                {(form.country === 'India' ? INDIA_STATES : form.country === 'USA' ? USA_STATES : AUS_STATES).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          )}
          {form.state && (
            <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
              <label htmlFor="city">City<span style={{color:'red'}}>*</span></label>
              <select id="city" name="city" className="form-control" value={form.city} onChange={handleChange} required>
                <option value="">Select City</option>
                {(CITIES[form.state] || ["City1", "City2", "City3"]).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}
          {form.city && (
            <>
              <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
                <label htmlFor="address">Address<span style={{color:'red'}}>*</span></label>
                <input type="text" id="address" name="address" className="form-control" value={form.address} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
                <label htmlFor="pin">Pin<span style={{color:'red'}}>*</span></label>
                <input type="text" id="pin" name="pin" className="form-control" value={form.pin} onChange={handleChange} required />
              </div>
            </>
          )}
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Registering..." : "Register Client"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from "react";
