import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { getInitials } from "../utils/getInitials";
import "./ClientProfile.css";
import CustomModal from "./CustomModal";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [passwordError, setPasswordError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  // Notification settings state
  const [emailNotification, setEmailNotification] = useState(false);
  const [smsNotification, setSmsNotification] = useState(false);
  const [marketingNotification, setMarketingNotification] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  // Theme preference state
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeDirty, setThemeDirty] = useState(false);
  const initialThemeRef = React.useRef('blue');
  const initialOptionsRef = React.useRef(null);
  const billingFetchedRef = React.useRef(false);
  const emailsFetchedRef = React.useRef(false);
  // Notification emails
  const [notificationEmails, setNotificationEmails] = useState([]);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);
  
  // Alert Preferences state
  const [alertChallan, setAlertChallan] = useState(true);
  const [alertInsurance, setAlertInsurance] = useState(true);
  const [alertInsuranceDays, setAlertInsuranceDays] = useState(15);
  const [alertRoadTax, setAlertRoadTax] = useState(true);
  const [alertRoadTaxDays, setAlertRoadTaxDays] = useState(15);
  const [alertFitness, setAlertFitness] = useState(true);
  const [alertFitnessDays, setAlertFitnessDays] = useState(15);
  const [alertPollution, setAlertPollution] = useState(true);
  const [alertPollutionDays, setAlertPollutionDays] = useState(15);
  const [alertsDirty, setAlertsDirty] = useState(false);
  const [alertsSaving, setAlertsSaving] = useState(false);
  const initialAlertsRef = React.useRef(null);
  
  // Get user info from localStorage
  const scUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("sc_user")) || {};
    } catch {
      return {};
    }
  })();
  const user = scUser.user || {};
  // Initialize notification settings from login `user_options` if present
  React.useEffect(() => {
    try {
      // Merge user_options from both locations
      const topLevelOptions = scUser.user_options || {};
      const nestedOptions = (user && user.user_options) || {};
      const opts = { ...topLevelOptions, ...nestedOptions };
      const isTrue = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'True';
      if (Object.keys(opts).length > 0) {
        setEmailNotification(isTrue(opts.receive_email_notification));
        setSmsNotification(isTrue(opts.receive_sms_notification));
        setMarketingNotification(isTrue(opts.receive_marketing_communication));
        // initialize theme preference
        const theme = opts.default_theme || 'blue';
        setSelectedTheme(theme);
        initialThemeRef.current = theme;
        // initialize notification emails if provided
        if (Array.isArray(opts.notification_emails)) {
          // normalize to objects { id, value }
          const normalized = opts.notification_emails.slice(0,5).map(e => {
            if (!e) return null;
            if (typeof e === 'string') return { id: null, value: e };
            if (typeof e === 'object') return { id: e.id || e._id || null, value: e.value || e.email || e };
            return null;
          }).filter(Boolean);
          setNotificationEmails(normalized);
        }
        
        // initialize alert preferences
        setAlertChallan(isTrue(opts.alert_challan ?? true));
        setAlertInsurance(isTrue(opts.alert_insurance ?? true));
        setAlertInsuranceDays(parseInt(opts.alert_insurance_days) || 15);
        setAlertRoadTax(isTrue(opts.alert_road_tax ?? true));
        setAlertRoadTaxDays(parseInt(opts.alert_road_tax_days) || 15);
        setAlertFitness(isTrue(opts.alert_fitness ?? true));
        setAlertFitnessDays(parseInt(opts.alert_fitness_days) || 15);
        setAlertPollution(isTrue(opts.alert_pollution ?? true));
        setAlertPollutionDays(parseInt(opts.alert_pollution_days) || 15);
        
        // store initial snapshot for dirty-checks
        initialOptionsRef.current = {
          receive_email_notification: opts.receive_email_notification,
          receive_sms_notification: opts.receive_sms_notification,
          receive_marketing_communication: opts.receive_marketing_communication
        };
        initialAlertsRef.current = {
          alert_challan: opts.alert_challan ?? 1,
          alert_insurance: opts.alert_insurance ?? 1,
          alert_insurance_days: parseInt(opts.alert_insurance_days) || 15,
          alert_road_tax: opts.alert_road_tax ?? 1,
          alert_road_tax_days: parseInt(opts.alert_road_tax_days) || 15,
          alert_fitness: opts.alert_fitness ?? 1,
          alert_fitness_days: parseInt(opts.alert_fitness_days) || 15,
          alert_pollution: opts.alert_pollution ?? 1,
          alert_pollution_days: parseInt(opts.alert_pollution_days) || 15
        };
        setSettingsDirty(false);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // fetch stored notification emails from API on load
  React.useEffect(() => {
    const fetchEmails = async () => {
      try {
        const user_id = user.id || user._id || user.client_id || null;
        if (!user_id) return;
        const token = scUser.token || '';
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/usernotificationemail?user_id=${encodeURIComponent(user_id)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data)) {
          const normalized = data.map(item => ({ id: item.id || item._id || item.notification_id || null, value: item.value || item.email || item.notification_value || '' })).filter(i => i.value);
          setNotificationEmails(normalized.slice(0,5));
        } else if (res.ok && data && Array.isArray(data.data)) {
          const normalized = data.data.map(item => ({ id: item.id || item._id || null, value: item.value || item.email || '' })).filter(i => i.value);
          setNotificationEmails(normalized.slice(0,5));
        }
      } catch (e) {
        // ignore fetch errors
      }
    };
    if (!emailsFetchedRef.current) {
      emailsFetchedRef.current = true;
      fetchEmails();
    }
  }, []);

  // mark settingsDirty when current toggles differ from initial options
  React.useEffect(() => {
    try {
      const init = initialOptionsRef.current || {};
      const toNum = v => v === true || v === '1' || v === 1 || v === 'true' ? 1 : 0;
      const dirty = (
        toNum(init.receive_email_notification) !== toNum(emailNotification) ||
        toNum(init.receive_sms_notification) !== toNum(smsNotification) ||
        toNum(init.receive_marketing_communication) !== toNum(marketingNotification)
      );
      setSettingsDirty(!!dirty);
    } catch (e) {
      setSettingsDirty(false);
    }
  }, [emailNotification, smsNotification, marketingNotification]);

  // mark themeDirty when theme changes
  React.useEffect(() => {
    setThemeDirty(selectedTheme !== initialThemeRef.current);
  }, [selectedTheme]);

  // mark alertsDirty when alert settings change
  React.useEffect(() => {
    try {
      const init = initialAlertsRef.current || {};
      const toNum = v => v === true || v === '1' || v === 1 || v === 'true' ? 1 : 0;
      const dirty = (
        toNum(init.alert_challan) !== toNum(alertChallan) ||
        toNum(init.alert_insurance) !== toNum(alertInsurance) ||
        parseInt(init.alert_insurance_days) !== parseInt(alertInsuranceDays) ||
        toNum(init.alert_road_tax) !== toNum(alertRoadTax) ||
        parseInt(init.alert_road_tax_days) !== parseInt(alertRoadTaxDays) ||
        toNum(init.alert_fitness) !== toNum(alertFitness) ||
        parseInt(init.alert_fitness_days) !== parseInt(alertFitnessDays) ||
        toNum(init.alert_pollution) !== toNum(alertPollution) ||
        parseInt(init.alert_pollution_days) !== parseInt(alertPollutionDays)
      );
      setAlertsDirty(!!dirty);
    } catch (e) {
      setAlertsDirty(false);
    }
  }, [alertChallan, alertInsurance, alertInsuranceDays, alertRoadTax, alertRoadTaxDays, alertFitness, alertFitnessDays, alertPollution, alertPollutionDays]);

  const saveNotificationSettings = async () => {
    setSettingsSaving(true);
    try {
      const user_id = user.id || user._id || user.client_id || null;
      const user_role = user.role || 'client';
      const payload = {
        user_id,
        user_role,
        settings: {
          receive_email_notification: emailNotification ? 1 : 0,
          receive_sms_notification: smsNotification ? 1 : 0,
          receive_marketing_communication: marketingNotification ? 1 : 0
        }
      };
      const token = scUser.token || '';
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/useroptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        // update localStorage sc_user.user.user_options
        try {
          const newScUser = { ...scUser };
          // Merge user_options from both locations to preserve all settings
          const topLevelOptions = newScUser.user_options || {};
          const nestedOptions = (newScUser.user && newScUser.user.user_options) || {};
          const userOptions = { ...topLevelOptions, ...nestedOptions, ...payload.settings };
          if (notificationEmails && notificationEmails.length) userOptions.notification_emails = notificationEmails.slice(0,5);
          // Update both locations to keep them in sync
          newScUser.user_options = userOptions;
          newScUser.user = { ...newScUser.user, user_options: userOptions };
          localStorage.setItem('sc_user', JSON.stringify(newScUser));
          initialOptionsRef.current = { ...payload.settings };
          setSettingsDirty(false);
          toast.success(data.message || 'Settings saved');
        } catch (e) {
          // ignore
        }
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const saveThemePreference = async () => {
    setThemeSaving(true);
    try {
      const user_id = user.id || user._id || user.client_id || null;
      const user_role = user.role || 'client';
      const payload = {
        user_id,
        user_role,
        settings: {
          default_theme: selectedTheme
        }
      };
      const token = scUser.token || '';
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/useroptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        // update localStorage sc_user.user.user_options
        try {
          const newScUser = { ...scUser };
          // Merge user_options from both locations to preserve all settings
          const topLevelOptions = newScUser.user_options || {};
          const nestedOptions = (newScUser.user && newScUser.user.user_options) || {};
          const userOptions = { ...topLevelOptions, ...nestedOptions };
          userOptions.default_theme = selectedTheme;
          // Update both locations to keep them in sync
          newScUser.user_options = userOptions;
          newScUser.user = { ...newScUser.user, user_options: userOptions };
          localStorage.setItem('sc_user', JSON.stringify(newScUser));
          initialThemeRef.current = selectedTheme;
          setThemeDirty(false);
          toast.success(data.message || 'Theme preference saved');
          // reload page to apply theme
          setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
          // ignore
        }
      } else {
        toast.error(data.message || 'Failed to save theme preference');
      }
    } catch (err) {
      toast.error('Failed to save theme preference');
    } finally {
      setThemeSaving(false);
    }
  };

  const saveAlertPreferences = async () => {
    setAlertsSaving(true);
    try {
      const user_id = user.id || user._id || user.client_id || null;
      const user_role = user.role || 'client';
      const payload = {
        user_id,
        user_role,
        settings: {
          alert_challan: alertChallan ? 1 : 0,
          alert_insurance: alertInsurance ? 1 : 0,
          alert_insurance_days: parseInt(alertInsuranceDays) || 15,
          alert_road_tax: alertRoadTax ? 1 : 0,
          alert_road_tax_days: parseInt(alertRoadTaxDays) || 15,
          alert_fitness: alertFitness ? 1 : 0,
          alert_fitness_days: parseInt(alertFitnessDays) || 15,
          alert_pollution: alertPollution ? 1 : 0,
          alert_pollution_days: parseInt(alertPollutionDays) || 15
        }
      };
      const token = scUser.token || '';
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/useroptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        // update localStorage sc_user.user.user_options
        try {
          const newScUser = { ...scUser };
          // Merge user_options from both locations to preserve all settings
          const topLevelOptions = newScUser.user_options || {};
          const nestedOptions = (newScUser.user && newScUser.user.user_options) || {};
          const userOptions = { ...topLevelOptions, ...nestedOptions, ...payload.settings };
          // Update both locations to keep them in sync
          newScUser.user_options = userOptions;
          newScUser.user = { ...newScUser.user, user_options: userOptions };
          localStorage.setItem('sc_user', JSON.stringify(newScUser));
          initialAlertsRef.current = { ...payload.settings };
          setAlertsDirty(false);
          toast.success(data.message || 'Alert preferences saved');
        } catch (e) {
          // ignore
        }
      } else {
        toast.error(data.message || 'Failed to save alert preferences');
      }
    } catch (err) {
      toast.error('Failed to save alert preferences');
    } finally {
      setAlertsSaving(false);
    }
  };

  // Email helpers
  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const addNotificationEmail = async () => {
    setEmailError('');
    const v = (newEmail || '').trim();
    if (!v) { setEmailError('Please enter an email'); return; }
    if (!isValidEmail(v)) { setEmailError('Invalid email address'); return; }
    const exists = notificationEmails.some(e => (typeof e === 'string' ? e === v : (e && e.value === v)));
    if (exists) { setEmailError('Email already added'); return; }
    if (notificationEmails.length >= 5) { setEmailError('Maximum 5 emails allowed'); return; }
    setAddingEmail(true);
    try {
      const user_id = user.id || user._id || user.client_id || null;
      const user_role = user.role || 'client';
      const payload = {
        user_id,
        user_role,
        notification_type: 'email',
        value: v
      };
      const token = scUser.token || '';
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/usernotificationemail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // attempt to get id from response
        const createdId = data.id || data._id || data.notification_id || (data.data && (data.data.id || data.data._id));
        const next = [...notificationEmails, { id: createdId || null, value: v }];
        setNotificationEmails(next.slice(0,5));
        setNewEmail('');
        setShowAddEmail(false);
        setSettingsDirty(true);
        // update localStorage snapshot
        try {
          const newScUser = { ...scUser };
          // Merge user_options from both locations to preserve all settings
          const topLevelOptions = newScUser.user_options || {};
          const nestedOptions = (newScUser.user && newScUser.user.user_options) || {};
          const prevOpts = { ...topLevelOptions, ...nestedOptions };
          prevOpts.notification_emails = (Array.isArray(prevOpts.notification_emails) ? prevOpts.notification_emails.slice(0) : []).concat(v).slice(0,5);
          // Update both locations to keep them in sync
          newScUser.user_options = prevOpts;
          newScUser.user = { ...newScUser.user, user_options: prevOpts };
          localStorage.setItem('sc_user', JSON.stringify(newScUser));
        } catch (e) {}
        toast.success(data.message || 'Email added');
      } else {
        setEmailError(data.message || 'Failed to add email');
        toast.error(data.message || 'Failed to add email');
      }
    } catch (err) {
      setEmailError('Failed to add email');
      toast.error('Failed to add email');
    } finally {
      setAddingEmail(false);
    }
  };

  const removeNotificationEmail = (email) => {
    // email may be object {id, value} or string
    const id = email && (email.id || email._id) ? (email.id || email._id) : null;
    const value = email && email.value ? email.value : (typeof email === 'string' ? email : null);
    if (id) {
      // call API to mark inactive
      (async () => {
        try {
          const token = scUser.token || '';
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/usernotificationemail/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ status: 0 })
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            const next = notificationEmails.filter(e => !( (e.id && String(e.id) === String(id)) || e.value === value ));
            setNotificationEmails(next);
            setSettingsDirty(true);
            toast.success(data.message || 'Email removed');
            // update localStorage snapshot
            try {
              const newScUser = { ...scUser };
              // Merge user_options from both locations to preserve all settings
              const topLevelOptions = newScUser.user_options || {};
              const nestedOptions = (newScUser.user && newScUser.user.user_options) || {};
              const prevOpts = { ...topLevelOptions, ...nestedOptions };
              prevOpts.notification_emails = (Array.isArray(prevOpts.notification_emails) ? prevOpts.notification_emails.filter(v => v !== value) : []);
              // Update both locations to keep them in sync
              newScUser.user_options = prevOpts;
              newScUser.user = { ...newScUser.user, user_options: prevOpts };
              localStorage.setItem('sc_user', JSON.stringify(newScUser));
            } catch (e) {}
          } else {
            toast.error(data.message || 'Failed to remove email');
          }
        } catch (err) {
          toast.error('Failed to remove email');
        }
      })();
    } else {
      const next = notificationEmails.filter(e => e.value !== value);
      setNotificationEmails(next);
      setSettingsDirty(true);
    }
  };
  // Always provide a fallback object for userMeta to avoid undefined errors
  const userMeta = (scUser.userMeta && typeof scUser.userMeta === 'object') ? scUser.userMeta : {};
  const [billing, setBilling] = useState(null);
  const clientId = user.id || user._id || 3;

  React.useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/userbillingsetting?client_id=${clientId}`);
        const data = await res.json();

        console.log('Billing data:', data);
        // Filter for active billing record using billing_plan_status (case-insensitive, trim)
  // ...existing code...
        let active = null;
  let records = Array.isArray(data.billingRecords) ? data.billingRecords : Array.isArray(data) ? data : [];
  active = records.find(b => String(b.billing_plan_status).trim().toLowerCase() === 'active');
  console.log('API response:', data);
  console.log('Active billing found:', active);
  setBilling(active || null);
        console.log('Billing response:', data);
        console.log('Active billing:', active);
      } catch (err) {
        setBilling(null);
      }
    };
    if (!billingFetchedRef.current) {
      billingFetchedRef.current = true;
      fetchBilling();
    }
  }, [clientId]);
  // ...existing code...
  const [supportModal, setSupportModal] = useState(false);
  const userName = user.name || "John Smith";
  const userEmail = user.email || "johnsmith@example.com";
  const userPhone = (userMeta.phone && userMeta.phone.trim()) ? userMeta.phone : (user.phone && String(user.phone).trim()) ? String(user.phone).trim() : "Not available";
  const address = (userMeta.address && String(userMeta.address).trim()) ? userMeta.address : (user.address && String(user.address).trim()) ? user.address : "Not available";
  const companyName = (userMeta.company_name && String(userMeta.company_name).trim()) ? userMeta.company_name : (user.company_name && String(user.company_name).trim()) ? user.company_name : (user.companyName && String(user.companyName).trim()) ? user.companyName : "Not available";
  const gtin = (userMeta.gtin && String(userMeta.gtin).trim()) ? userMeta.gtin : (user.gtin && String(user.gtin).trim()) ? user.gtin : "Not available";
  let userJoined = "June 15, 2023";
  if (user.created_at) {
    const date = new Date(user.created_at);
    if (!isNaN(date)) {
      userJoined = date.toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric'
      });
    }
  }
  // Generate initials: first letters of first two words, or first two letters
  let initials = "";
  const nameParts = userName.trim().split(/\s+/);
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else {
    initials = userName.substring(0,2).toUpperCase();
  }

  return (
    <div className="profile-content1">
      {/* ToastContainer for toast notifications */}
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <div className="content">
        <div className="profile-header-profile">
          <div className="profile-picture">{initials}</div>
          <div>
            <h2 style={{fontWeight:800, fontSize:28, marginBottom:8}}>{userName}</h2>
            <p style={{color:'#555', fontSize:16, marginBottom:2}}>{userEmail}</p>
            <p style={{color:'#888', fontSize:15}}>Member since: {userJoined}</p>
          </div>
        </div>
        <div className="profile-section">
          <div className="card-icon personal"><i className="ri-user-settings-line"></i></div>
          <h3 className="card-title" style={{marginBottom:18}}>Personal Information</h3>
          <form className="profile-form">
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" type="text" value={userName} readOnly />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control" type="email" value={userEmail} readOnly />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input className="form-control" type="text" value={userPhone ? userPhone : "Not available"} readOnly />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Address</label>
                    <input className="form-control" type="text" value={address} readOnly />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                    <input className="form-control" type="text" value={companyName} readOnly />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">GTIN</label>
                    <input className="form-control" type="text" value={gtin} readOnly />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Date Joined</label>
                  <input className="form-control" type="text" value={userJoined} readOnly />
                </div>
              </div>
            </div>
            <div style={{textAlign:"right", marginTop:'10px'}}>
              <button className="btn btn-primary" disabled>Save Changes</button>
            </div>
          </form>
        </div>

        {/* Theme Preference section */}
        <div className="profile-section">
          <h3>Theme Preference</h3>
          <div style={{margin: '12px 0'}}>
            <div className="form-row">
              <div className="form-col" style={{width:'50%'}}>
                <div className="form-group">
                  <label className="form-label">Select Theme</label>
                  <select 
                    className="form-control" 
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  >
                    <option value="blue">Blue</option>
                    <option value="metallic">Metallic</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{textAlign:"right", marginTop:'10px', display: 'flex', justifyContent: 'flex-end', gap: 8}}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{marginRight: '8px'}} 
                onClick={() => {
                  setSelectedTheme(initialThemeRef.current);
                  setThemeDirty(false);
                }}
                disabled={!themeDirty}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveThemePreference}
                disabled={!themeDirty || themeSaving}
                style={{ background: themeDirty ? undefined : '#9aa', opacity: themeDirty ? 1 : 0.7 }}
              >
                {themeSaving ? 'Saving...' : (themeDirty ? 'Confirm' : 'No Changes')}
              </button>
            </div>
          </div>
        </div>

        {/* My Tarrifs section */}
        <div className="profile-section">
          <h3>My Tarrifs</h3>
          <div style={{margin: '12px 0'}}>
            {billing ? (
              <div className="form-row">
                <div className="form-col" style={{width:'50%'}}>
                  <div className="form-group">
                    <label className="form-label">Cost Per Vehicle/Month</label>
                    <input
                      className="form-control"
                      type="text"
                      value={
                        billing.cost_per_month_per_vehicle !== undefined && billing.cost_per_month_per_vehicle !== null && String(billing.cost_per_month_per_vehicle).trim() !== ''
                          ? String(billing.cost_per_month_per_vehicle)
                          : 'N/A'
                      }
                      disabled
                    />
                  </div>
                </div>
                <div className="form-col" style={{width:'50%'}}>
                  <div className="form-group">
                    <label className="form-label">Cost Per Challan Request</label>
                    <input
                      className="form-control"
                      type="text"
                      value={
                        billing.cost_per_challan_request !== undefined && billing.cost_per_challan_request !== null && String(billing.cost_per_challan_request).trim() !== ''
                          ? String(billing.cost_per_challan_request)
                          : 'N/A'
                      }
                      disabled
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{color: '#b77'}}>No active billing record found.</div>
            )}
          </div>
        </div>
      <div className="profile-section">
        <h3>Update Password</h3>
        <form className="profile-form">
          {/* Billing fields moved to 'My Tarrifs' section below */}

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-control" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (confirmPassword && e.target.value !== confirmPassword) {
                      setPasswordError("Passwords do not match");
                    } else {
                      setPasswordError("");
                    }
                  }}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (newPassword && e.target.value !== newPassword) {
                      setPasswordError("Passwords do not match");
                    } else {
                      setPasswordError("");
                    }
                  }}
                />
                {passwordError && (
                  <div style={{ color: "#d33", fontSize: 13, marginTop: 4 }}>{passwordError}</div>
                )}
              </div>
            </div>
          </div>
          
          
          <div style={{textAlign:"right", marginTop:'10px', display: 'flex', justifyContent: 'flex-end', gap: 8}}>
            <button type="button" className="btn btn-outline" style={{marginRight: '8px'}}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!!passwordError || !currentPassword || !newPassword || !confirmPassword}
              onClick={async () => {
                if (!currentPassword) {
                  toast.info("Please enter your current password");
                  return;
                }
                if (!newPassword || !confirmPassword) {
                  toast.info("Please enter and confirm your new password");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setPasswordError("Passwords do not match");
                  toast.error("Passwords do not match");
                  return;
                }
                try {
                  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/userprofile/updatepassword/${clientId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword })
                  });
                  const result = await res.json();
                  if (res.ok) {
                    const successMsg = result && result.message ? `${result.message} Please login again with new password.` : 'Password has been reset successfully. Please login again with new password.';
                    toast.success(successMsg);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    // give toast a moment to display before navigating
                    try { await new Promise(r => setTimeout(r, 2000)); } catch (e) {}
                    try {
                      localStorage.removeItem('sc_user');
                    } catch (e) {}
                    // Redirect to login page
                    try { navigate('/', { replace: true }); } catch (e) { window.location.hash = '/'; }
                  } else {
                    toast.error(result.message || "Failed to update password");
                  }
                } catch (err) {
                  toast.error("Failed to update password");
                }
              }}
            >Update Password</button>
          </div>
          
        </form>
      </div>

      {/* Notification Settings: toggles for email/sms/marketing */}
      <div className="profile-section">
        <h3>Notification Settings</h3>
        <div style={{margin: '12px 0'}}>
          <div className="form-row">
            <div className="form-col" style={{width:'33%'}}>
              <div className="form-group">
                <label className="form-label">Email Notifications</label>
                <label className="toggle-switch">
                  <input type="checkbox" checked={emailNotification} onChange={e => setEmailNotification(e.target.checked)} />
                  <span className="toggle-slider">
                    <span className="toggle-circle"></span>
                  </span>
                </label>
              </div>
            </div>
            <div className="form-col" style={{width:'33%'}}>
              <div className="form-group">
                <label className="form-label">SMS Notifications</label>
                <label className="toggle-switch">
                  <input type="checkbox" checked={smsNotification} onChange={e => setSmsNotification(e.target.checked)} />
                  <span className="toggle-slider">
                    <span className="toggle-circle"></span>
                  </span>
                </label>
              </div>
            </div>
            <div className="form-col" style={{width:'33%'}}>
              <div className="form-group">
                <label className="form-label">Marketing Communications</label>
                <label className="toggle-switch">
                  <input type="checkbox" checked={marketingNotification} onChange={e => setMarketingNotification(e.target.checked)} />
                  <span className="toggle-slider">
                    <span className="toggle-circle"></span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div style={{textAlign:"right", marginTop:'10px', display: 'flex', justifyContent: 'flex-end', gap: 8}}>
            <button type="button" className="btn btn-outline" style={{marginRight: '8px'}} onClick={() => {
              const init = initialOptionsRef.current || {};
              setEmailNotification(!!(init.receive_email_notification === 1 || init.receive_email_notification === '1' || init.receive_email_notification === true));
              setSmsNotification(!!(init.receive_sms_notification === 1 || init.receive_sms_notification === '1' || init.receive_sms_notification === true));
              setMarketingNotification(!!(init.receive_marketing_communication === 1 || init.receive_marketing_communication === '1' || init.receive_marketing_communication === true));
              setSettingsDirty(false);
            }}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveNotificationSettings}
              disabled={!settingsDirty || settingsSaving}
              style={{ background: settingsDirty ? undefined : '#9aa', opacity: settingsDirty ? 1 : 0.7 }}
            >
              {settingsSaving ? 'Saving...' : (settingsDirty ? 'Save Notification Settings' : 'No Changes')}
            </button>
          </div>
        </div>
      </div>

      {/* Separate Notification Emails section */}
      <div className="profile-section">
        <h3>Notification Emails</h3>
        <div style={{margin: '12px 0'}}>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8}}>
            {notificationEmails.length > 0 ? notificationEmails.map((em, idx) => {
              const display = (typeof em === 'string') ? em : (em && em.value ? em.value : '');
              const key = (em && (em.id || em._id)) ? (em.id || em._id) : idx;
              return (
              <div key={key} style={{background: '#eef2ff', padding: '6px 10px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 8}}>
                <span style={{fontSize: 13, color: '#1f2937'}}>{display}</span>
                <button type="button" onClick={() => removeNotificationEmail(em)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#c53030', fontWeight:700}}>×</button>
              </div>
              );
            }) : (
              <div style={{color:'#666'}}>No notification emails added.</div>
            )}
          </div>
          {showAddEmail ? (
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input type="email" className="form-control" placeholder="Enter email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{maxWidth:360}} />
              <button type="button" className="btn btn-primary" onClick={addNotificationEmail} disabled={notificationEmails.length >= 5}>Add</button>
              <button type="button" className="btn btn-outline" onClick={() => { setShowAddEmail(false); setNewEmail(''); setEmailError(''); }}>Cancel</button>
            </div>
          ) : (
            <div>
              <button type="button" className="btn btn-primary" onClick={() => setShowAddEmail(true)} disabled={notificationEmails.length >= 5}>Add Email</button>
              <span style={{marginLeft:12, color:'#666', fontSize:13}}>You can add up to 5 emails.</span>
            </div>
          )}
          {emailError && <div style={{color:'#d33', marginTop:8}}>{emailError}</div>}
        </div>
      </div>

      {/* Alert Preferences section */}
      <div className="profile-section">
        <h3>Alert Preferences</h3>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>Configure when you want to receive alerts for different events</p>
        <div style={{margin: '12px 0'}}>
          
          {/* Challan Alert */}
          <div className="form-row" style={{ marginBottom: 16, alignItems: 'center' }}>
            <div className="form-col" style={{width:'40%'}}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Challan Detected</label>
                <p style={{ fontSize: 13, color: '#777', margin: '4px 0 0 0' }}>Notify immediately when new challan is detected</p>
              </div>
            </div>
            <div className="form-col" style={{width:'20%', textAlign: 'center'}}>
              <label className="toggle-switch">
                <input type="checkbox" checked={alertChallan} onChange={e => setAlertChallan(e.target.checked)} />
                <span className="toggle-slider">
                  <span className="toggle-circle"></span>
                </span>
              </label>
            </div>
            <div className="form-col" style={{width:'40%'}}>
              <span style={{ fontSize: 13, color: '#999' }}>Instant notification</span>
            </div>
          </div>

          {/* Insurance Alert */}
          <div className="form-row" style={{ marginBottom: 16, alignItems: 'center' }}>
            <div className="form-col" style={{width:'40%'}}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Insurance Expiry</label>
                <p style={{ fontSize: 13, color: '#777', margin: '4px 0 0 0' }}>Notify before insurance expiry</p>
              </div>
            </div>
            <div className="form-col" style={{width:'20%', textAlign: 'center'}}>
              <label className="toggle-switch">
                <input type="checkbox" checked={alertInsurance} onChange={e => setAlertInsurance(e.target.checked)} />
                <span className="toggle-slider">
                  <span className="toggle-circle"></span>
                </span>
              </label>
            </div>
            <div className="form-col" style={{width:'40%'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select 
                  className="form-control" 
                  value={alertInsuranceDays} 
                  onChange={e => setAlertInsuranceDays(parseInt(e.target.value))}
                  disabled={!alertInsurance}
                  style={{ width: 100 }}
                >
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="45">45 days</option>
                  <option value="60">60 days</option>
                </select>
                <span style={{ fontSize: 13, color: '#666' }}>before expiry</span>
              </div>
            </div>
          </div>

          {/* Road Tax Alert */}
          <div className="form-row" style={{ marginBottom: 16, alignItems: 'center' }}>
            <div className="form-col" style={{width:'40%'}}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Road Tax Expiry</label>
                <p style={{ fontSize: 13, color: '#777', margin: '4px 0 0 0' }}>Notify before road tax expiry</p>
              </div>
            </div>
            <div className="form-col" style={{width:'20%', textAlign: 'center'}}>
              <label className="toggle-switch">
                <input type="checkbox" checked={alertRoadTax} onChange={e => setAlertRoadTax(e.target.checked)} />
                <span className="toggle-slider">
                  <span className="toggle-circle"></span>
                </span>
              </label>
            </div>
            <div className="form-col" style={{width:'40%'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select 
                  className="form-control" 
                  value={alertRoadTaxDays} 
                  onChange={e => setAlertRoadTaxDays(parseInt(e.target.value))}
                  disabled={!alertRoadTax}
                  style={{ width: 100 }}
                >
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="45">45 days</option>
                  <option value="60">60 days</option>
                </select>
                <span style={{ fontSize: 13, color: '#666' }}>before expiry</span>
              </div>
            </div>
          </div>

          {/* Fitness Alert */}
          <div className="form-row" style={{ marginBottom: 16, alignItems: 'center' }}>
            <div className="form-col" style={{width:'40%'}}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Fitness Expiry</label>
                <p style={{ fontSize: 13, color: '#777', margin: '4px 0 0 0' }}>Notify before fitness certificate expiry</p>
              </div>
            </div>
            <div className="form-col" style={{width:'20%', textAlign: 'center'}}>
              <label className="toggle-switch">
                <input type="checkbox" checked={alertFitness} onChange={e => setAlertFitness(e.target.checked)} />
                <span className="toggle-slider">
                  <span className="toggle-circle"></span>
                </span>
              </label>
            </div>
            <div className="form-col" style={{width:'40%'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select 
                  className="form-control" 
                  value={alertFitnessDays} 
                  onChange={e => setAlertFitnessDays(parseInt(e.target.value))}
                  disabled={!alertFitness}
                  style={{ width: 100 }}
                >
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="45">45 days</option>
                  <option value="60">60 days</option>
                </select>
                <span style={{ fontSize: 13, color: '#666' }}>before expiry</span>
              </div>
            </div>
          </div>

          {/* Pollution Alert */}
          <div className="form-row" style={{ marginBottom: 16, alignItems: 'center' }}>
            <div className="form-col" style={{width:'40%'}}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Pollution Certificate Expiry</label>
                <p style={{ fontSize: 13, color: '#777', margin: '4px 0 0 0' }}>Notify before pollution certificate expiry</p>
              </div>
            </div>
            <div className="form-col" style={{width:'20%', textAlign: 'center'}}>
              <label className="toggle-switch">
                <input type="checkbox" checked={alertPollution} onChange={e => setAlertPollution(e.target.checked)} />
                <span className="toggle-slider">
                  <span className="toggle-circle"></span>
                </span>
              </label>
            </div>
            <div className="form-col" style={{width:'40%'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select 
                  className="form-control" 
                  value={alertPollutionDays} 
                  onChange={e => setAlertPollutionDays(parseInt(e.target.value))}
                  disabled={!alertPollution}
                  style={{ width: 100 }}
                >
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="45">45 days</option>
                  <option value="60">60 days</option>
                </select>
                <span style={{ fontSize: 13, color: '#666' }}>before expiry</span>
              </div>
            </div>
          </div>

          <div style={{textAlign:"right", marginTop:'20px', display: 'flex', justifyContent: 'flex-end', gap: 8}}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{marginRight: '8px'}} 
              onClick={() => {
                const init = initialAlertsRef.current || {};
                setAlertChallan(!!(init.alert_challan === 1 || init.alert_challan === '1' || init.alert_challan === true));
                setAlertInsurance(!!(init.alert_insurance === 1 || init.alert_insurance === '1' || init.alert_insurance === true));
                setAlertInsuranceDays(parseInt(init.alert_insurance_days) || 15);
                setAlertRoadTax(!!(init.alert_road_tax === 1 || init.alert_road_tax === '1' || init.alert_road_tax === true));
                setAlertRoadTaxDays(parseInt(init.alert_road_tax_days) || 15);
                setAlertFitness(!!(init.alert_fitness === 1 || init.alert_fitness === '1' || init.alert_fitness === true));
                setAlertFitnessDays(parseInt(init.alert_fitness_days) || 15);
                setAlertPollution(!!(init.alert_pollution === 1 || init.alert_pollution === '1' || init.alert_pollution === true));
                setAlertPollutionDays(parseInt(init.alert_pollution_days) || 15);
                setAlertsDirty(false);
              }}
              disabled={!alertsDirty}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveAlertPreferences}
              disabled={!alertsDirty || alertsSaving}
              style={{ background: alertsDirty ? undefined : '#9aa', opacity: alertsDirty ? 1 : 0.7 }}
            >
              {alertsSaving ? 'Saving...' : (alertsDirty ? 'Save Alert Preferences' : 'No Changes')}
            </button>
          </div>
        </div>
      </div>
      
      </div>
      
    </div>
  );
}
