import React, { useState, useRef, useEffect } from "react";
import * as XLSX from 'xlsx';

export default function DriverVerification() {
  // Show/hide bulk DL verification form
  const [showBulkDL, setShowBulkDL] = useState(false);

  // Registered drivers state
  const [drivers, setDrivers] = useState([]);

  // Bulk DL verification state
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkAlert, setBulkAlert] = useState(null);

  // Bulk DL verification handler
  const handleBulkFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setBulkAlert({ type: 'error', msg: 'Please upload a valid Excel file (.xlsx or .xls)' });
      return;
    }
    setBulkAlert(null);
    setBulkLoading(true);
    setBulkProgress(0);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rows.length < 2) throw new Error('No data found in file');
      // Remove header row, validate columns
      const [header, ...records] = rows;
      if (header.length < 3 || !/s.?no/i.test(header[0]) || !/dl.?no/i.test(header[1]) || !/dob/i.test(header[2])) {
        throw new Error('Excel must have columns: S. No., DL No., DOB (in order)');
      }
      if (records.length > 100) throw new Error('File cannot have more than 100 records');
      // Validate and prepare records
      const validRecords = records.filter(r => r[1] && r[2]);
      if (validRecords.length === 0) throw new Error('No valid DL records found');
      // Get API base and token
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('sc_token');
      let successCount = 0, failCount = 0;
      for (let i = 0; i < validRecords.length; i++) {
        setBulkProgress(Math.round((i / validRecords.length) * 100));
        const dlNo = String(validRecords[i][1]).trim();
        const dob = String(validRecords[i][2]).trim();
        try {
          const resp = await fetch(`${apiBaseUrl}/getdriverdata`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ driverId: dlNo, dob })
          });
          if (!resp.ok) failCount++;
          else successCount++;
        } catch {
          failCount++;
        }
      }
      setBulkProgress(100);
      // Fetch all drivers after bulk
      try {
        let client_id = '';
        const scUser = JSON.parse(localStorage.getItem('sc_user'));
        if (scUser && scUser.user) {
          client_id = scUser.user.client_id || scUser.user.id || scUser.user._id || '';
        }
        if (client_id) {
          const res = await fetch(`${apiBaseUrl}/fetchdriver?client_id=${encodeURIComponent(client_id)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.drivers)) setDrivers(data.drivers);
            else if (Array.isArray(data.data)) setDrivers(data.data);
            else if (Array.isArray(data)) setDrivers(data);
          }
        }
      } catch {}
      setBulkAlert({ type: 'success', msg: `Bulk verification complete. Success: ${successCount}, Failed: ${failCount}` });
    } catch (err) {
      setBulkAlert({ type: 'error', msg: err.message || 'Bulk verification failed' });
    } finally {
      setBulkLoading(false);
      setBulkProgress(0);
    }
  };
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
  const [fetchingDrivers, setFetchingDrivers] = useState(true);

  // Fetch drivers on component mount
  useEffect(() => {
    const fetchDriversOnLoad = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        let client_id = '';
        try {
          const scUser = JSON.parse(localStorage.getItem('sc_user'));
          if (scUser && scUser.user) {
            client_id = scUser.user.client_id || scUser.user.id || scUser.user._id || '';
          }
        } catch {}
        
        if (client_id) {
          const res = await fetch(`${apiBaseUrl}/fetchdriver?client_id=${encodeURIComponent(client_id)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.drivers)) setDrivers(data.drivers);
            else if (Array.isArray(data.data)) setDrivers(data.data);
            else if (Array.isArray(data)) setDrivers(data);
          }
        }
      } catch (err) {
        console.error('Error fetching drivers on load:', err);
      } finally {
        setFetchingDrivers(false);
      }
    };

    fetchDriversOnLoad();
  }, []);

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
      let client_id = '';
      try {
        const scUser = JSON.parse(localStorage.getItem('sc_user'));
        if (scUser && scUser.user) {
          client_id = scUser.user.client_id || scUser.user.id || scUser.user._id || '';
        }
      } catch {}

      const payload = {
        client_id,
        licenseNo: driverDetails.dlobj?.dlLicno?.trim() || form.licenseNo,
        dob: driverDetails.bioObj?.bioDob || form.dob,
        details: {
          name: driverDetails.bioObj?.bioFullName || '',
          fatherName: driverDetails.bioObj?.bioSwdFullName || '',
          gender: driverDetails.bioObj?.bioGenderDesc || '',
          status: driverDetails.dlobj?.dlStatus || '',
          issueDate: driverDetails.dlobj?.dlIssuedt || '',
          address: {
            permanent: [
              driverDetails.bioObj?.bioPermAdd1,
              driverDetails.bioObj?.bioPermAdd2,
              driverDetails.bioObj?.bioPermAdd3,
              driverDetails.bioObj?.bioPermDistName,
              driverDetails.bioObj?.bioPermPin
            ].filter(Boolean).join(', '),
            temporary: [
              driverDetails.bioObj?.bioTempAdd1,
              driverDetails.bioObj?.bioTempAdd2,
              driverDetails.bioObj?.bioTempAdd3,
              driverDetails.bioObj?.bioTempDistName,
              driverDetails.bioObj?.bioTempPin
            ].filter(Boolean).join(', ')
          },
          rawDetails: driverDetails
        }
      };

      const saveResponse = await fetch(`${apiBaseUrl}/savedrivedata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
        },
        body: JSON.stringify(payload)
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveData.message || 'Failed to save driver details');
      }

      setSaveSuccess(true);
      const updatedDrivers = drivers.map(driver =>
        (driver.licenseNo === form.licenseNo && driver.dob === form.dob) ||
        (driver.details?.dlobj?.dlLicno === driverDetails.dlobj?.dlLicno)
          ? { ...driver, saved: true }
          : driver
      );
      setDrivers(updatedDrivers);

    } catch (err) {
      console.error('Save driver error:', err);
      setError(err.message || 'Failed to save driver details');
      setSaveSuccess(false);
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

          // Save driver details to DB
          try {
            // Get client_id from sc_user in localStorage (id, _id, or client_id)
            let client_id = '';
            try {
              const scUser = JSON.parse(localStorage.getItem('sc_user'));
              if (scUser && scUser.user) {
                client_id = scUser.user.client_id || scUser.user.id || scUser.user._id || '';
              }
            } catch {}
            // Prepare payload: licenseNo, dob, client_id as top-level; rest as details JSON
            const payload = {
              client_id,
              licenseNo: dldetobj.dlobj?.dlLicno?.trim() || form.licenseNo,
              dob: dldetobj.bioObj?.bioDob || form.dob,
              details: {
                name: dldetobj.bioObj?.bioFullName?.replace(/\*/g, '') || '',
                fatherName: dldetobj.bioObj?.bioSwdFullName?.replace(/\*/g, '') || '',
                gender: dldetobj.bioObj?.bioGenderDesc?.trim() || '',
                bloodGroup: dldetobj.bioObj?.bioBloodGroup?.trim() || '',
                issueDate: dldetobj.dlobj?.dlIssuedt || '',
                status: dldetobj.dlobj?.dlStatus || '',
                ntValidTill: dldetobj.dlobj?.dlNtValdtoDt || '',
                trValidTill: dldetobj.dlobj?.dlTrValdtoDt || '',
                vehicleClasses: dldetobj.dlcovs || [],
                photo: dldetobj.bioImgObj?.biPhoto || dldetobj.bioObj?.biPhoto || '',
                address: {
                  permanent: [
                    dldetobj.bioObj?.bioPermAdd1?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioPermAdd2?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioPermAdd3?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioPermDistName?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioPermPin
                  ].filter(Boolean).join(', '),
                  temporary: [
                    dldetobj.bioObj?.bioTempAdd1?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioTempAdd2?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioTempAdd3?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioTempDistName?.replace(/\*/g, ''),
                    dldetobj.bioObj?.bioTempPin
                  ].filter(Boolean).join(', ')
                },
                rawDetails: dldetobj // for full reference
              }
            };
            const saveResponse = await fetch(`${apiBaseUrl}/savedrivedata`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
              },
              body: JSON.stringify(payload)
            });
            const saveData = await saveResponse.json();
            if (!saveResponse.ok) {
              console.error('Failed to save driver data:', saveData.message || saveData);
            } else {
              console.log('Driver data saved successfully:', saveData);
            }
          } catch (saveErr) {
            console.error('Error saving driver data:', saveErr);
          }
        
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
      <style>{`
        @keyframes dl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dl-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(${openUpwards ? '10px' : '-10px'}) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .date-picker-container { animation: fadeInUp 0.2s ease-out; }
        .dl-result-card { animation: dl-fadeIn 0.3s ease; }
        .dl-info-field { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .dl-info-field:last-child { border-bottom: none; }
        .dl-info-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .dl-info-value { font-size: 14px; font-weight: 500; color: #1e293b; }
      `}</style>

      <div className="register-vehicle-content">
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ri-id-card-line" style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>DL Details</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Verify and track driving license information</p>
          </div>
        </div>

        {/* Top section: form + result side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: driverDetails ? '1fr 1.6fr' : '1fr', gap: 20, marginBottom: 24, alignItems: 'start' }}>

          {/* ── Verify Form Card ── */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(37,99,235,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="ri-search-eye-line" style={{ color: '#fff', fontSize: 20 }} />
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Verify Driver License</div>
            </div>
            <div style={{ padding: 24 }}>
              <form onSubmit={handleSubmit} autoComplete="off">
                {/* License Number */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    License Number
                  </label>
                  <input
                    type="text"
                    name="licenseNo"
                    className="simple-search-input"
                    value={form.licenseNo}
                    onChange={handleChange}
                    placeholder="e.g. GJ0420120005008"
                    disabled={loading}
                    maxLength={15}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Format: State + Office + Year + Serial</div>
                </div>

                {/* Date of Birth picker */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Date of Birth
                  </label>
                  <div style={{ position: 'relative' }} ref={datePickerRef}>
                    <div
                      onClick={toggleDatePicker}
                      style={{
                        padding: '10px 14px 10px 42px', fontSize: 14,
                        width: '100%', boxSizing: 'border-box',
                        background: loading ? '#f8fafc' : '#f8fafc',
                        color: form.dob ? '#1e293b' : '#94a3b8',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: `1.5px solid ${showDatePicker ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: 10,
                        boxShadow: showDatePicker ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                      tabIndex={0}
                    >
                      <span>{formatDisplayDate(form.dob)}</span>
                      <i className={`ri-arrow-${showDatePicker ? 'up' : 'down'}-s-line`} style={{ color: '#94a3b8', fontSize: 18 }} />
                    </div>
                    <i className="ri-calendar-event-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: showDatePicker ? '#3b82f6' : '#94a3b8', fontSize: 16, pointerEvents: 'none' }} />

                    {showDatePicker && (
                      <div className="date-picker-container" style={{
                        position: 'absolute',
                        ...(openUpwards ? { bottom: '100%', marginBottom: 8 } : { top: '100%', marginTop: 8 }),
                        left: 0, right: 0, zIndex: 200,
                        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
                        boxShadow: '0 12px 36px rgba(0,0,0,0.12)', overflow: 'hidden',
                      }}>
                        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', padding: '14px 18px', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                          Select Date of Birth
                        </div>
                        <div style={{ padding: 16 }}>
                          {/* Year */}
                          <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Year</label>
                            <select className="form-control" value={selectedDate.year} onChange={e => setSelectedDate({ ...selectedDate, year: parseInt(e.target.value) })}>
                              <option value="">Select year</option>
                              {generateYears().map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          {/* Month */}
                          {selectedDate.year && (
                            <div style={{ marginBottom: 14 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Month</label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                {months.map(m => (
                                  <button key={m.num} type="button"
                                    onClick={() => setSelectedDate({ ...selectedDate, month: m.num, day: '' })}
                                    style={{
                                      padding: '8px 4px', border: `1.5px solid ${selectedDate.month === m.num ? '#3b82f6' : '#e2e8f0'}`,
                                      borderRadius: 8, background: selectedDate.month === m.num ? '#3b82f6' : '#fff',
                                      color: selectedDate.month === m.num ? '#fff' : '#475569',
                                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    }}>
                                    {m.short}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Day */}
                          {selectedDate.year && selectedDate.month && (
                            <div style={{ marginBottom: 14 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Day</label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, maxHeight: 160, overflowY: 'auto', background: '#f8fafc', borderRadius: 8, padding: 8 }}>
                                {Array.from({ length: getDaysInMonth(selectedDate.month, selectedDate.year) }, (_, i) => i + 1).map(day => (
                                  <button key={day} type="button"
                                    onClick={() => handleDateSelect(day, selectedDate.month, selectedDate.year)}
                                    style={{
                                      padding: '8px 4px', border: 'none', borderRadius: 6,
                                      background: '#fff', color: '#1e293b', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1e293b'; }}>
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={() => setShowDatePicker(false)}
                              style={{ flex: 1, padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                              Cancel
                            </button>
                            <button type="button" onClick={() => { setForm({ ...form, dob: '' }); setSelectedDate({ day: '', month: '', year: '' }); setShowDatePicker(false); }}
                              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Click to select • Must be 18+ years old</div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading || !form.licenseNo || !form.dob}
                  style={{
                    width: '100%', padding: '12px 20px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    background: (!loading && form.licenseNo && form.dob) ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e2e8f0',
                    color: (!loading && form.licenseNo && form.dob) ? '#fff' : '#94a3b8', cursor: (!loading && form.licenseNo && form.dob) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: (!loading && form.licenseNo && form.dob) ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  <i className={loading ? 'ri-loader-4-line' : 'ri-search-line'} style={{ animation: loading ? 'dl-spin 1s linear infinite' : 'none' }} />
                  {loading ? 'Fetching Details...' : 'Verify License'}
                </button>

                {error && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <i className="ri-error-warning-line" style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}
              </form>

              {/* Bulk DL Verification */}
              <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: showBulkDL ? 14 : 0 }}>
                  <input type="checkbox" id="bulkDLCheckbox" checked={bulkLoading || !!showBulkDL} onChange={e => setShowBulkDL(e.target.checked)} disabled={bulkLoading} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                  <label htmlFor="bulkDLCheckbox" style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#1e293b' }}>
                    <i className="ri-upload-2-line" style={{ marginRight: 6, color: '#2563eb' }} />
                    Bulk DL Verification
                  </label>
                </div>
                {showBulkDL && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 8, display: 'block' }}>Upload Excel file (max 100 records):</label>
                    <input type="file" accept=".xlsx,.xls" onChange={handleBulkFile} disabled={bulkLoading}
                      style={{ padding: 8, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, marginBottom: 8, width: '100%', boxSizing: 'border-box' }} />
                    {bulkLoading && (
                      <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="ri-loader-4-line" style={{ color: '#2563eb', animation: 'dl-spin 1s linear infinite' }} />
                        <span style={{ color: '#2563eb', fontSize: 13, fontWeight: 500 }}>Processing... {bulkProgress}%</span>
                      </div>
                    )}
                    {bulkAlert && (
                      <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: bulkAlert.type === 'error' ? '#fef2f2' : '#f0fdf4', color: bulkAlert.type === 'error' ? '#dc2626' : '#16a34a', border: `1px solid ${bulkAlert.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                        {bulkAlert.msg}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                      Required columns: <strong>S. No.</strong>, <strong>DL No.</strong>, <strong>DOB</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Driver Result Card ── */}
          {driverDetails && (
            <div className="dl-result-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(37,99,235,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {/* Result header */}
              <div style={{ background: 'linear-gradient(135deg, #065f46, #059669)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <i className="ri-check-double-line" style={{ color: '#fff', fontSize: 22 }} />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>License Verified</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{driverDetails.dlobj?.dlLicno?.trim()}</div>
                  </div>
                </div>
                <button onClick={handleSaveDriver} disabled={saving || saveSuccess}
                  style={{
                    padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    background: saveSuccess ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(10px)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!saving && !saveSuccess) e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = saveSuccess ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)'; }}>
                  {saving ? <><i className="ri-loader-4-line" style={{ animation: 'dl-spin 1s linear infinite' }} /> Saving...</>
                    : saveSuccess ? <><i className="ri-check-line" /> Saved</>
                    : <><i className="ri-save-3-line" /> Save Driver</>}
                </button>
              </div>

              <div style={{ padding: 24 }}>
                {saveSuccess && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <i className="ri-checkbox-circle-line" /> Driver saved to your records.
                  </div>
                )}

                {/* Profile row */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
                  {/* Photo */}
                  <div style={{ flexShrink: 0 }}>
                    {driverPhoto ? (
                      <img src={`data:image/jpeg;base64,${driverPhoto}`} alt="Driver"
                        style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: 10, border: '2px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    ) : (
                      <div style={{ width: 90, height: 110, borderRadius: 10, background: '#f1f5f9', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                        <i className="ri-user-line" style={{ fontSize: 28, color: '#cbd5e1' }} />
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>No Photo</span>
                      </div>
                    )}
                  </div>
                  {/* Name and status */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                      {driverDetails.bioObj?.bioFullName?.replace(/\*/g, '') || 'N/A'}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                      {driverDetails.bioObj?.bioSwdFullName ? `S/O ${driverDetails.bioObj.bioSwdFullName.replace(/\*/g, '')}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: driverDetails.dlobj?.dlStatus?.toUpperCase() === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                        color: driverDetails.dlobj?.dlStatus?.toUpperCase() === 'ACTIVE' ? '#15803d' : '#dc2626',
                      }}>{driverDetails.dlobj?.dlStatus || 'Unknown'}</span>
                      {driverDetails.bioObj?.bioGenderDesc && (
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
                          {driverDetails.bioObj.bioGenderDesc.trim()}
                        </span>
                      )}
                      {driverDetails.bioObj?.bioBloodGroup && (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#fef2f2', color: '#dc2626' }}>
                          {driverDetails.bioObj.bioBloodGroup.trim()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {[
                    { label: 'License No', value: driverDetails.dlobj?.dlLicno?.trim() },
                    { label: 'Date of Birth', value: driverDetails.bioObj?.bioDob?.replace(/\*/g, '') },
                    { label: 'Issue Date', value: driverDetails.dlobj?.dlIssuedt },
                    { label: 'NT Valid Till', value: driverDetails.dlobj?.dlNtValdtoDt },
                    { label: 'Transport Valid Till', value: driverDetails.dlobj?.dlTrValdtoDt },
                  ].map(({ label, value }) => (
                    <div key={label} className="dl-info-field">
                      <span className="dl-info-label">{label}</span>
                      <span className="dl-info-value">{value || 'N/A'}</span>
                    </div>
                  ))}
                </div>

                {/* Vehicle classes */}
                {driverDetails.dlcovs && driverDetails.dlcovs.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Vehicle Classes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {driverDetails.dlcovs.map((cov, idx) => (
                        <span key={idx} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid #dbeafe' }}>
                          {cov.covabbrv} {cov.covdesc && `— ${cov.covdesc}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Address */}
                {(driverDetails.bioObj?.bioPermAdd1 || driverDetails.bioObj?.bioTempAdd1) && (
                  <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Address</div>
                    {driverDetails.bioObj?.bioPermAdd1 && (
                      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                        <strong style={{ color: '#1e293b' }}>Permanent: </strong>
                        {[driverDetails.bioObj?.bioPermAdd1, driverDetails.bioObj?.bioPermAdd2, driverDetails.bioObj?.bioPermAdd3, driverDetails.bioObj?.bioPermDistName, driverDetails.bioObj?.bioPermPin].map(v => v?.replace(/\*/g, '')).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Registered Drivers Table ── */}
        <div className="vst-card">
          <div className="vst-header">
            <div className="vst-header__left">
              <span className="vst-header__icon-box" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                <i className="ri-id-card-line" />
              </span>
              <div>
                <h2 className="vst-header__title">Registered Drivers</h2>
                <span className="vst-header__count">{Array.isArray(drivers) ? drivers.length : 0} drivers</span>
              </div>
            </div>
            <span className="vst-record-badge">Showing {Array.isArray(drivers) ? drivers.length : 0} drivers</span>
          </div>

          {fetchingDrivers ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              <i className="ri-loader-4-line" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'dl-spin 1s linear infinite' }} />
              Loading drivers...
            </div>
          ) : !Array.isArray(drivers) || drivers.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <i className="ri-id-card-line" style={{ fontSize: 40, color: '#cbd5e1', display: 'block', marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>No drivers registered yet</div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>Use the form above to verify and save driver licenses.</div>
            </div>
          ) : (
            <div className="vst-table-wrap">
              <table className="vst-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>License No.</th>
                    <th>Name</th>
                    <th>DOB</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Address</th>
                    <th>Saved On</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d, idx) => {
                    const status = d.details?.status || d.details?.dlobj?.dlStatus || '';
                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{d.license_no || d.licenseNo || '-'}</td>
                        <td style={{ fontWeight: 500 }}>{d.details?.name || d.details?.bioObj?.bioFullName || '-'}</td>
                        <td>{d.dob || '-'}</td>
                        <td>{d.details?.gender || d.details?.bioObj?.bioGenderDesc || '-'}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: status?.toUpperCase() === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                            color: status?.toUpperCase() === 'ACTIVE' ? '#15803d' : '#64748b',
                          }}>
                            {status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#64748b', maxWidth: 200 }}>
                          {d.details?.address?.permanent || '-'}
                        </td>
                        <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}