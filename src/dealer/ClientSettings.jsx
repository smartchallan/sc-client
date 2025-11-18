import React, { useState } from "react";
import "../shared/CommonDashboard.css";

export default function ClientSettings({ clients = [] }) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [settings, setSettings] = useState({
    canAddVehicle: false,
    canInactivateVehicle: false,
    canDeleteVehicle: false,
    canFetchVehicleData: false,
  });

  // Optionally, load client settings from API or props when client changes
  React.useEffect(() => {
    if (!selectedClientId) return;
    // Here you would fetch settings for the selected client
    // For demo, reset to defaults
    setSettings({
      canAddVehicle: false,
      canInactivateVehicle: false,
      canDeleteVehicle: false,
      canFetchVehicleData: false,
    });
  }, [selectedClientId]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Save settings for selected client (API call)
    alert("Settings saved for client " + selectedClientId);
  };

  return (
    <div className="register-vehicle-content" style={{width:'100%', maxWidth:'100%', padding:0, margin:0}}>
      <h1 className="page-title">Client Settings</h1>
      <p className="page-subtitle">Manage permissions for each client below. You can allow or restrict actions for each client.</p>
      <div className="card client-settings-form-section" style={{width:'100%', maxWidth:'100%', padding:'32px 24px', borderRadius: 16, boxShadow: '0 2px 16px #0001', margin:0}}>
        <label htmlFor="client-select" style={{fontWeight:600, fontSize:16, marginBottom:8, display:'block', textAlign:'left'}}>Select Client</label>
        <select
          id="client-select"
          className="form-control"
          style={{marginBottom: 24, minWidth:220, fontSize:15, padding: '8px 12px', textAlign:'left', maxWidth: 400}}
          value={selectedClientId}
          onChange={e => setSelectedClientId(e.target.value)}
        >
          <option value="">Choose a client...</option>
          {clients.map(c => (
            <option key={c.id || c._id || c.email} value={c.id || c._id || c.email}>
              {c.name || c.client_name || c.email}
            </option>
          ))}
        </select>

        {selectedClientId && (
          <div style={{marginTop: 8, maxWidth: 900}}>
            <h3 style={{fontSize: '1.15rem', marginBottom: 18, color:'#1976d2', textAlign:'left'}}>Client Permissions</h3>
            <div className="settings-toggle-row-group" style={{display:'flex',flexWrap:'nowrap',gap:'32px 40px',marginBottom:24,alignItems:'flex-start',justifyContent:'flex-start'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:270}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',textAlign:'left',position:'relative'}}>
                  <input type="checkbox" checked={settings.canAddVehicle} onChange={() => handleToggle('canAddVehicle')} style={{accentColor:'#43e97b',width:20,height:20}} />
                  <span style={{fontWeight:500}}>Can Add Vehicle</span>
                  <span style={{marginLeft:4, cursor:'pointer', display:'inline-block', position:'relative'}} tabIndex={0}>
                    <span style={{display:'inline-block',width:18,height:18,borderRadius:'50%',background:'#e3f0ff',color:'#1976d2',fontWeight:700,fontSize:14, textAlign:'center',lineHeight:'18px',border:'1px solid #bcd',verticalAlign:'middle'}}>?</span>
                    <span style={{visibility:'hidden',opacity:0,transition:'opacity 0.2s',position:'absolute',left:'110%',top:'50%',transform:'translateY(-50%)',background:'#222',color:'#fff',padding:'7px 14px',borderRadius:6,fontSize:13,whiteSpace:'nowrap',zIndex:10,boxShadow:'0 2px 8px #0002'}} className="tooltip-text">Allow this client to add new vehicles.</span>
                  </span>
                </label>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:270}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',textAlign:'left',position:'relative'}}>
                  <input type="checkbox" checked={settings.canInactivateVehicle} onChange={() => handleToggle('canInactivateVehicle')} style={{accentColor:'#ffa726',width:20,height:20}} />
                  <span style={{fontWeight:500}}>Can Inactivate Vehicle</span>
                  <span style={{marginLeft:4, cursor:'pointer', display:'inline-block', position:'relative'}} tabIndex={0}>
                    <span style={{display:'inline-block',width:18,height:18,borderRadius:'50%',background:'#fff3e0',color:'#ffa726',fontWeight:700,fontSize:14, textAlign:'center',lineHeight:'18px',border:'1px solid #ffd699',verticalAlign:'middle'}}>?</span>
                    <span style={{visibility:'hidden',opacity:0,transition:'opacity 0.2s',position:'absolute',left:'110%',top:'50%',transform:'translateY(-50%)',background:'#222',color:'#fff',padding:'7px 14px',borderRadius:6,fontSize:13,whiteSpace:'nowrap',zIndex:10,boxShadow:'0 2px 8px #0002'}} className="tooltip-text">Allow this client to inactivate vehicles.</span>
                  </span>
                </label>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:270}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',textAlign:'left',position:'relative'}}>
                  <input type="checkbox" checked={settings.canDeleteVehicle} onChange={() => handleToggle('canDeleteVehicle')} style={{accentColor:'#e57373',width:20,height:20}} />
                  <span style={{fontWeight:500}}>Can Delete Vehicle</span>
                  <span style={{marginLeft:4, cursor:'pointer', display:'inline-block', position:'relative'}} tabIndex={0}>
                    <span style={{display:'inline-block',width:18,height:18,borderRadius:'50%',background:'#ffebee',color:'#e57373',fontWeight:700,fontSize:14, textAlign:'center',lineHeight:'18px',border:'1px solid #ffcdd2',verticalAlign:'middle'}}>?</span>
                    <span style={{visibility:'hidden',opacity:0,transition:'opacity 0.2s',position:'absolute',left:'110%',top:'50%',transform:'translateY(-50%)',background:'#222',color:'#fff',padding:'7px 14px',borderRadius:6,fontSize:13,whiteSpace:'nowrap',zIndex:10,boxShadow:'0 2px 8px #0002'}} className="tooltip-text">Allow this client to delete vehicles.</span>
                  </span>
                </label>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:270}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',textAlign:'left',position:'relative'}}>
                  <input type="checkbox" checked={settings.canFetchVehicleData} onChange={() => handleToggle('canFetchVehicleData')} style={{accentColor:'#1976d2',width:20,height:20}} />
                  <span style={{fontWeight:500}}>Can Fetch Vehicle Data</span>
                  <span style={{marginLeft:4, cursor:'pointer', display:'inline-block', position:'relative'}} tabIndex={0}>
                    <span style={{display:'inline-block',width:18,height:18,borderRadius:'50%',background:'#e3f0ff',color:'#1976d2',fontWeight:700,fontSize:14, textAlign:'center',lineHeight:'18px',border:'1px solid #bcd',verticalAlign:'middle'}}>?</span>
                    <span style={{visibility:'hidden',opacity:0,transition:'opacity 0.2s',position:'absolute',left:'110%',top:'50%',transform:'translateY(-50%)',background:'#222',color:'#fff',padding:'7px 14px',borderRadius:6,fontSize:13,whiteSpace:'nowrap',zIndex:10,boxShadow:'0 2px 8px #0002'}} className="tooltip-text">Allow this client to fetch vehicle data from RTO.</span>
                  </span>
                </label>
      {/* Tooltip hover logic */}
      <style>{`
        .settings-toggle-row-group label span[tabindex="0"]:hover .tooltip-text,
        .settings-toggle-row-group label span[tabindex="0"]:focus .tooltip-text {
          visibility: visible !important;
          opacity: 1 !important;
        }
      `}</style>
              </div>
            </div>
            <button className="save-btn" style={{marginTop:10, background:'#1976d2',color:'#fff',fontWeight:600,padding:'10px 32px',border:'none',borderRadius:8,fontSize:16,cursor:'pointer',boxShadow:'0 2px 8px #1976d222', textAlign:'left'}} onClick={handleSave}>
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
