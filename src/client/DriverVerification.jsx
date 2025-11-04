import React, { useState, useRef, useEffect } from "react";
import "../RegisterVehicle.css";

export default function DriverVerification() {
  const [drivers, setDrivers] = useState([
    { licenseNo: "DL0420150001234", dob: "1990-05-12" },
    { licenseNo: "MH1220180005678", dob: "1985-11-23" }
  ]);
  const [form, setForm] = useState({ licenseNo: "", dob: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [driverPhoto, setDriverPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState({ day: '', month: '', year: '' });
  const [openUpwards, setOpenUpwards] = useState(false);
  const datePickerRef = useRef(null);

  const handleChange = e => {
    let value = e.target.value;
    if (e.target.name === 'licenseNo') {
      // Filter to only allow alphanumeric characters and convert to uppercase
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    setForm({ ...form, [e.target.name]: value });
    setError("");
    setSaveSuccess(false);
  };

  // Check if date picker should open upwards
  const checkPosition = () => {
    if (datePickerRef.current) {
      const rect = datePickerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      const pickerHeight = 400; // Approximate height of date picker
      
      setOpenUpwards(spaceBelow < pickerHeight && spaceAbove > pickerHeight);
    }
  };

  const toggleDatePicker = () => {
    if (!loading) {
      if (!showDatePicker) {
        checkPosition();
      }
      setShowDatePicker(!showDatePicker);
    }
  };

  // Modern date picker functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (day, month, year) => {
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setForm({ ...form, dob: formattedDate });
    setSelectedDate({ day, month, year });
    setShowDatePicker(false);
    setError("");
    setSaveSuccess(false);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Select Date of Birth';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 80;
    const endYear = currentYear - 18;
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const months = [
    { num: 1, name: 'January', short: 'Jan' },
    { num: 2, name: 'February', short: 'Feb' },
    { num: 3, name: 'March', short: 'Mar' },
    { num: 4, name: 'April', short: 'Apr' },
    { num: 5, name: 'May', short: 'May' },
    { num: 6, name: 'June', short: 'Jun' },
    { num: 7, name: 'July', short: 'Jul' },
    { num: 8, name: 'August', short: 'Aug' },
    { num: 9, name: 'September', short: 'Sep' },
    { num: 10, name: 'October', short: 'Oct' },
    { num: 11, name: 'November', short: 'Nov' },
    { num: 12, name: 'December', short: 'Dec' }
  ];

  const handleSaveDriver = async () => {
    if (!driverDetails) {
      setError("No driver details to save");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/save-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
        },
        body: JSON.stringify({
          licenseNo: form.licenseNo,
          dob: form.dob,
          driverDetails: driverDetails,
          photo: driverPhoto
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save driver details');
      }

      setSaveSuccess(true);
      // Update the drivers list to mark this driver as saved
      const updatedDrivers = drivers.map(driver => 
        driver.licenseNo === form.licenseNo && driver.dob === form.dob
          ? { ...driver, saved: true }
          : driver
      );
      setDrivers(updatedDrivers);

    } catch (err) {
      setError(err.message || "Failed to save driver details");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.licenseNo || !form.dob) {
      setError("Please fill both fields.");
      return;
    }

    setLoading(true);
    setError("");
    setDriverDetails(null);
    setDriverPhoto(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/getdriverdata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
        },
        body: JSON.stringify({
          driverId: form.licenseNo,
          dob: form.dob
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch driver details');
      }

      // Parse response based on the actual API structure
      console.log('Full API Response:', data); // Debug log
      
      if (data.response && data.response[0] && data.response[0].response && data.response[0].response.dldetobj) {
        const dldetobj = data.response[0].response.dldetobj[0];
        console.log('Driver Details Object:', dldetobj); // Debug log
        setDriverDetails(dldetobj);
        
        // Extract and set biPhoto if available in bioImgObj
        if (dldetobj.bioImgObj && dldetobj.bioImgObj.biPhoto) {
          console.log('Found biPhoto in bioImgObj:', dldetobj.bioImgObj.biPhoto.substring(0, 100) + '...'); // Debug log
          setDriverPhoto(dldetobj.bioImgObj.biPhoto);
        } else {
          console.log('biPhoto not found in bioImgObj:', dldetobj.bioImgObj); // Debug log
          
          // Check if biPhoto is directly in bioObj
          if (dldetobj.bioObj && dldetobj.bioObj.biPhoto) {
            console.log('Found biPhoto in bioObj:', dldetobj.bioObj.biPhoto.substring(0, 100) + '...'); // Debug log
            setDriverPhoto(dldetobj.bioObj.biPhoto);
          } else {
            console.log('biPhoto not found in bioObj either:', dldetobj.bioObj?.biPhoto); // Debug log
          }
        }
        
        // Also add to the drivers list for display
        const newDriver = {
          licenseNo: form.licenseNo,
          dob: form.dob,
          details: dldetobj,
          photo: dldetobj.bioImgObj?.biPhoto
        };
        setDrivers([...drivers, newDriver]);
        setForm({ licenseNo: "", dob: "" });
      } else {
        console.log('Response structure not as expected:', data); // Debug log
        setError("Driver details not found in response");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch driver details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(${openUpwards ? '10px' : '-10px'}) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          .date-picker-container {
            animation: fadeInUp 0.2s ease-out;
          }
          
          .date-picker-container::-webkit-scrollbar {
            width: 6px;
          }
          
          .date-picker-container::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          
          .date-picker-container::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          
          .date-picker-container::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
      <div className="register-vehicle-content">
      <h2 style={{ marginBottom: 18 }}>Registered Drivers</h2>
      <div className="dashboard-latest">
        <table className="latest-table" style={{ width: "100%", marginBottom: 32 }}>
          <thead>
            <tr>
              <th>License No.</th>
              <th>DOB</th>
              <th>Verification</th>
              <th>Saved</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "#888", padding: "8px" }}>No drivers verified.</td>
              </tr>
            ) : (
              drivers.map((d, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #f5f5f5" }}>{d.licenseNo}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #f5f5f5" }}>{d.dob}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #f5f5f5" }}>
                    {d.details ? (
                      <span style={{ color: "#28a745", fontWeight: "500" }}>
                        <i className="ri-check-line"></i> Verified
                      </span>
                    ) : (
                      <span style={{ color: "#6c757d" }}>
                        <i className="ri-time-line"></i> Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #f5f5f5" }}>
                    {d.saved ? (
                      <span style={{ color: "#28a745", fontWeight: "500" }}>
                        <i className="ri-database-2-line"></i> Saved
                      </span>
                    ) : d.details ? (
                      <span style={{ color: "#ffc107", fontWeight: "500" }}>
                        <i className="ri-save-line"></i> Ready to Save
                      </span>
                    ) : (
                      <span style={{ color: "#6c757d" }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginBottom: 12 }}>Verify Driver License</h3>
      <div className="card">
        <form className="register-vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="licenseNo" style={{fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block'}}>License Number</label>
            <div className="number-plate-container">
              <div className="number-plate-wrapper">
                <div className="number-plate-badge">IND</div>
                <div className="tricolor-strip">
                  <div className="saffron"></div>
                  <div className="white"></div>
                  <div className="green"></div>
                </div>
                <input
                  type="text"
                  id="licenseNo"
                  name="licenseNo"
                  className="number-plate-input"
                  value={form.licenseNo}
                  onChange={handleChange}
                  placeholder="Enter driving license number"
                  disabled={loading}
                  maxLength={15}
                />
              </div>
              <div className="security-features">
                <div className="hologram"></div>
                <div className="chakra">⚙</div>
              </div>
            </div>
            <small style={{fontSize: 12, color: '#6c757d', marginTop: 4, display: 'block'}}>
              Format: GJ0420120005008 (State + Office + Year + Serial)
            </small>
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="dob" style={{fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block'}}>Date of Birth</label>
            <div style={{position: 'relative'}} ref={datePickerRef}>
              <div
                onClick={toggleDatePicker}
                style={{
                  padding: '14px 16px 14px 48px',
                  fontSize: 15,
                  border: showDatePicker ? '2px solid #667eea' : '1px solid #d1d5db',
                  borderRadius: 12,
                  width: '100%',
                  backgroundColor: loading ? '#f9fafb' : '#fff',
                  color: form.dob ? '#374151' : '#9ca3af',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: showDatePicker 
                    ? '0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1)' 
                    : '0 1px 2px rgba(0, 0, 0, 0.05)',
                  outline: 'none'
                }}
              >
                <span>{formatDisplayDate(form.dob)}</span>
                <i className={`ri-arrow-${showDatePicker ? 'up' : 'down'}-s-line`} style={{
                  color: showDatePicker ? '#667eea' : '#9ca3af',
                  fontSize: 18,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: showDatePicker ? 'rotate(180deg)' : 'rotate(0deg)'
                }}></i>
              </div>
              <i className="ri-calendar-event-line" style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: showDatePicker ? '#667eea' : '#9ca3af',
                pointerEvents: 'none',
                fontSize: 18,
                transition: 'color 0.2s ease'
              }}></i>
              
              {showDatePicker && (
                <div className="date-picker-container" style={{
                  position: 'absolute',
                  ...(openUpwards 
                    ? { bottom: '100%', marginBottom: 8 } 
                    : { top: '100%', marginTop: 8 }
                  ),
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #e0e6ed',
                  borderRadius: 16,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  backdropFilter: 'blur(20px)'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    padding: '20px 24px',
                    fontSize: 15,
                    fontWeight: 500,
                    textAlign: 'center',
                    letterSpacing: '0.5px'
                  }}>
                    📅 Select Date of Birth
                  </div>
                  
                  <div style={{ padding: '20px' }}>
                    {/* Year Selection */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: '#374151', 
                        marginBottom: 10, 
                        display: 'block',
                        letterSpacing: '0.3px'
                      }}>Birth Year</label>
                      <select
                        value={selectedDate.year}
                        onChange={(e) => setSelectedDate({...selectedDate, year: parseInt(e.target.value)})}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: 12,
                          fontSize: 14,
                          background: '#fff',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          backgroundSize: '16px'
                        }}
                      >
                        <option value="">Choose year</option>
                        {generateYears().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Month Selection */}
                    {selectedDate.year && (
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ 
                          fontSize: 13, 
                          fontWeight: 600, 
                          color: '#374151', 
                          marginBottom: 10, 
                          display: 'block',
                          letterSpacing: '0.3px'
                        }}>Birth Month</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                          {months.map(month => (
                            <button
                              key={month.num}
                              type="button"
                              onClick={() => setSelectedDate({...selectedDate, month: month.num, day: ''})}
                              style={{
                                padding: '10px 8px',
                                border: selectedDate.month === month.num ? '2px solid #667eea' : '1px solid #e5e7eb',
                                borderRadius: 10,
                                background: selectedDate.month === month.num 
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                  : '#fff',
                                color: selectedDate.month === month.num ? '#fff' : '#6b7280',
                                fontSize: 13,
                                fontWeight: selectedDate.month === month.num ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                boxShadow: selectedDate.month === month.num 
                                  ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                                  : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedDate.month !== month.num) {
                                  e.target.style.background = '#f9fafb';
                                  e.target.style.borderColor = '#d1d5db';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedDate.month !== month.num) {
                                  e.target.style.background = '#fff';
                                  e.target.style.borderColor = '#e5e7eb';
                                }
                              }}
                            >
                              {month.short}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Day Selection */}
                    {selectedDate.year && selectedDate.month && (
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ 
                          fontSize: 13, 
                          fontWeight: 600, 
                          color: '#374151', 
                          marginBottom: 10, 
                          display: 'block',
                          letterSpacing: '0.3px'
                        }}>Birth Day</label>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(7, 1fr)', 
                          gap: 6,
                          maxHeight: 240,
                          overflowY: 'auto',
                          padding: '8px',
                          background: '#f8fafc',
                          borderRadius: 12,
                          border: '1px solid #e5e7eb'
                        }}>
                          {Array.from({length: getDaysInMonth(selectedDate.month, selectedDate.year)}, (_, i) => i + 1).map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleDateSelect(day, selectedDate.month, selectedDate.year)}
                              style={{
                                padding: '10px 6px',
                                border: 'none',
                                borderRadius: 8,
                                background: '#fff',
                                color: '#374151',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: 36,
                                outline: 'none',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                e.target.style.color = '#fff';
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.color = '#374151';
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                              }}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      paddingTop: 20,
                      borderTop: '1px solid #f3f4f6',
                      gap: 12
                    }}>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          border: '1px solid #d1d5db',
                          borderRadius: 10,
                          background: '#fff',
                          color: '#6b7280',
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f9fafb';
                          e.target.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#fff';
                          e.target.style.borderColor = '#d1d5db';
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({...form, dob: ''});
                          setSelectedDate({day: '', month: '', year: ''});
                          setShowDatePicker(false);
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          border: '1px solid #f87171',
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          boxShadow: '0 2px 8px rgba(248, 113, 113, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(248, 113, 113, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(248, 113, 113, 0.2)';
                        }}
                      >
                        Clear Date
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <small style={{fontSize: 12, color: '#6c757d', marginTop: 4, display: 'block'}}>
              Click to select your date of birth • Must be 18+ years old
            </small>
          </div>
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Fetching..." : "Fetch Driver Details"}
            </button>
          </div>
          {error && <div style={{ color: "#d32f2f", marginTop: 4, width: '100%' }}>{error}</div>}
        </form>
      </div>

      {/* Debug Info */}
      {loading && <div style={{ padding: 10, background: '#f0f0f0', margin: '10px 0', fontSize: 12 }}>Loading driver data...</div>}
      {driverDetails && <div style={{ padding: 10, background: '#e8f5e8', margin: '10px 0', fontSize: 12 }}>Driver details loaded: {driverDetails.dlobj?.dlLicno || 'No license number'}</div>}
      <div style={{ padding: 10, background: '#fff3cd', margin: '10px 0', fontSize: 12 }}>
        Photo state: {driverPhoto ? `Photo loaded (${driverPhoto.length} chars)` : 'No photo loaded'}
      </div>

      {/* Driver Photo Display */}
      {driverPhoto ? (
        <div className="card" style={{ marginTop: 24, border: '2px solid #0072ff' }}>
          <h3 style={{ marginBottom: 16, color: "#0072ff" }}>
            <i className="ri-image-line" style={{ marginRight: 8 }}></i>
            Driver Photo Found! 📸
          </h3>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <img 
              src={`data:image/jpeg;base64,${driverPhoto}`}
              alt="Driver Photo"
              style={{
                maxWidth: '300px',
                maxHeight: '400px',
                border: '2px solid #0072ff',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,114,255,0.2)'
              }}
              onLoad={() => console.log('Image loaded successfully')}
              onError={(e) => {
                console.log('Image failed to load');
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{ display: 'none', color: '#e74c3c', padding: 20 }}>
              <i className="ri-error-warning-line" style={{ fontSize: 48, marginBottom: 10, display: 'block' }}></i>
              <p>Unable to load driver photo</p>
              <p style={{ fontSize: 12 }}>Base64 length: {driverPhoto.length}</p>
            </div>
          </div>
        </div>
      ) : driverDetails ? (
        <div className="card" style={{ marginTop: 24, border: '2px solid #ffc107' }}>
          <h3 style={{ marginBottom: 16, color: "#ffc107" }}>
            <i className="ri-image-off-line" style={{ marginRight: 8 }}></i>
            No Photo Available
          </h3>
          <div style={{ textAlign: 'center', padding: 20, color: '#6c757d' }}>
            <p>Driver details loaded but no photo found in the response.</p>
          </div>
        </div>
      ) : null}

      {/* Driver Details Display */}
      {driverDetails && (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#28a745" }}>
              <i className="ri-check-line" style={{ marginRight: 8 }}></i>
              Driver Details Retrieved
            </h3>
            <button
              onClick={handleSaveDriver}
              disabled={saving || saveSuccess}
              className="btn"
              style={{
                background: saveSuccess ? '#28a745' : '#0072ff',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                opacity: saving ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!saving && !saveSuccess) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 114, 255, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <i className="ri-check-line"></i>
                  Saved Successfully
                </>
              ) : (
                <>
                  <i className="ri-save-line"></i>
                  Save Driver
                </>
              )}
            </button>
          </div>
          
          {saveSuccess && (
            <div style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              padding: 12,
              borderRadius: 6,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <i className="ri-check-circle-line"></i>
              Driver details have been successfully saved to the database!
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Personal Information</h4>
              <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                <div><strong>Name:</strong> {driverDetails.bioObj?.bioFullName?.replace(/\*/g, '') || 'N/A'}</div>
                <div><strong>Father's Name:</strong> {driverDetails.bioObj?.bioSwdFullName?.replace(/\*/g, '') || 'N/A'}</div>
                <div><strong>Date of Birth:</strong> {driverDetails.bioObj?.bioDob?.replace(/\*/g, '') || 'N/A'}</div>
                <div><strong>Gender:</strong> {driverDetails.bioObj?.bioGenderDesc?.trim() || 'N/A'}</div>
                <div><strong>Blood Group:</strong> {driverDetails.bioObj?.bioBloodGroup?.trim() || 'N/A'}</div>
              </div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>License Information</h4>
              <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                <div><strong>License No:</strong> {driverDetails.dlobj?.dlLicno?.trim() || 'N/A'}</div>
                <div><strong>Issue Date:</strong> {driverDetails.dlobj?.dlIssuedt || 'N/A'}</div>
                <div><strong>Status:</strong> {driverDetails.dlobj?.dlStatus || 'N/A'}</div>
                <div><strong>NT Valid Till:</strong> {driverDetails.dlobj?.dlNtValdtoDt || 'N/A'}</div>
                <div><strong>Transport Valid Till:</strong> {driverDetails.dlobj?.dlTrValdtoDt || 'N/A'}</div>
              </div>
            </div>
            {driverDetails.dlcovs && driverDetails.dlcovs.length > 0 && (
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, gridColumn: 'span 2' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Vehicle Classes</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {driverDetails.dlcovs.map((cov, idx) => (
                    <span key={idx} style={{ 
                      background: '#0072ff', 
                      color: '#fff', 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {cov.covabbrv} - {cov.covdesc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(driverDetails.bioObj?.bioPermAdd1 || driverDetails.bioObj?.bioTempAdd1) && (
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, gridColumn: 'span 2' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Address</h4>
                <div style={{ fontSize: 14, color: '#666' }}>
                  <div><strong>Permanent:</strong> {[
                    driverDetails.bioObj?.bioPermAdd1?.replace(/\*/g, ''),
                    driverDetails.bioObj?.bioPermAdd2?.replace(/\*/g, ''),
                    driverDetails.bioObj?.bioPermAdd3?.replace(/\*/g, ''),
                    driverDetails.bioObj?.bioPermDistName?.replace(/\*/g, ''),
                    driverDetails.bioObj?.bioPermPin
                  ].filter(Boolean).join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
