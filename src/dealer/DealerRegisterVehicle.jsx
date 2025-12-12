import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomModal from "../client/CustomModal";
import "./DealerRegisterVehicle.css";

const FIELD_OPTIONS = [
  { value: "vehicle_number", label: "Vehicle Number" },
  { value: "engine_number", label: "Engine Number", disabled: true },
  { value: "chassis_number", label: "chassis Number", disabled: true },
];

export default function DealerRegisterVehicle({ clients: propClients }) {
  const [selectedClient, setSelectedClient] = useState("");
  const [clients, setClients] = useState(propClients || []);
  const [selectedField, setSelectedField] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLimit, setVehiclesLimit] = useState(10);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
  const [sidebarVehicle, setSidebarVehicle] = useState(null);

  const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const REGISTER_ENDPOINT = "/uservehicle/register";

  // Helper to get dealer id
  const getDealerId = () => {
    try {
      const userObj = JSON.parse(localStorage.getItem("sc_user"));
      return userObj && userObj.user && userObj.user.id ? userObj.user.id : null;
    } catch {
      return null;
    }
  };

  // Keep clients in sync with prop
  useEffect(() => {
    setClients(propClients || []);
  }, [propClients]);

  // Fetch vehicles for selected client
  useEffect(() => {
    if (!selectedClient) {
      setVehicles([]);
      return;
    }
    setFetchingVehicles(true);
    fetch(`${API_ROOT}/uservehicle?client_id=${selectedClient}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehicles(data);
        else if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
        else setVehicles([]);
      })
      .catch(() => setVehicles([]))
      .finally(() => setFetchingVehicles(false));
  }, [selectedClient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error("Please select a client.");
      return;
    }
    if (!selectedField || !fieldValue) {
      toast.error("Please select a field and enter a value.");
      return;
    }
    setLoading(true);
    try {
      const userObj = JSON.parse(localStorage.getItem("sc_user"));
      const dealerId = userObj && userObj.user && userObj.user.id ? userObj.user.id : null;
      const adminId = userObj && userObj.user && (userObj.user.admin_id || userObj.user.adminId) ? (userObj.user.admin_id || userObj.user.adminId) : null;
      const payload = {
        dealer_id: dealerId,
        admin_id: adminId,
        client_id: selectedClient,
        vehicle_number: selectedField === "vehicle_number" ? fieldValue : undefined,
        engine_number: selectedField === "engine_number" ? fieldValue : undefined,
        chassis_number: selectedField === "chassis_number" ? fieldValue : undefined,
      };
      const res = await fetch(API_ROOT + REGISTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to register vehicle");
      } else {
        toast.success("Vehicle registered successfully!");
        setFieldValue("");
        setSelectedField("");
        // Fetch vehicles after successful registration
        if (selectedClient) {
          setFetchingVehicles(true);
          fetch(`${API_ROOT}/uservehicle?client_id=${selectedClient}`)
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) setVehicles(data);
              else if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
              else setVehicles([]);
            })
            .catch(() => setVehicles([]))
            .finally(() => setFetchingVehicles(false));
        }
      }
    } catch (err) {
      toast.error("Error registering vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-vehicle-content">
      <ToastContainer position="top-right" autoClose={2000} />
      <h1 className="page-title">Register New Vehicle</h1>
      <p className="page-subtitle">
        As dealer, please select a <b>Client</b> under you, then register the vehicle using <b>any one</b> of the following details: <b>Vehicle Number</b>, <b>Engine Number</b>, or <b>chassis Number</b>.
      </p>
      <div className="modern-form-card">
        <form className="vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="select_client">Select Client</label>
            <select
              id="select_client"
              className="form-control"
              value={selectedClient}
              onChange={e => {
                setSelectedClient(e.target.value);
                setSidebarVehicle(null);
              }}
              required
            >
              <option value="">Select Client</option>
              {clients.length === 0 && <option disabled>No clients found</option>}
              {clients.map(c => (
                <option key={c.id || c._id || c.email} value={c.id || c._id || c.email}>
                  {c.name || c.email}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="select_field">Select Field to Register By</label>
            <select
              id="select_field"
              className="form-control"
              value={selectedField}
              onChange={e => {
                setSelectedField(e.target.value);
                setFieldValue("");
                setRegisterError("");
              }}
              required
              disabled={!selectedClient}
            >
              <option value="">Select Field</option>
              {FIELD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
              ))}
            </select>
          </div>
          {selectedField && (
            <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
              <label htmlFor="field_value">{FIELD_OPTIONS.find(f => f.value === selectedField)?.label}</label>
              {selectedField === 'vehicle_number' ? (
                <div className="number-plate-container">
                  <div className={"number-plate-wrapper" + (registerError ? ' input-invalid' : (fieldValue.length >= 5 ? ' input-valid' : ''))}>
                    <div className="number-plate-badge">IND</div>
                    <div className="tricolor-strip">
                      <div className="saffron"></div>
                      <div className="white"></div>
                      <div className="green"></div>
                    </div>
                    <input
                      type="text"
                      id="field_value"
                      name="field_value"
                      className={"number-plate-input" + (registerError ? ' input-invalid' : (fieldValue.length >= 5 ? ' input-valid' : ''))}
                      value={fieldValue}
                      onChange={e => {
                        const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        setFieldValue(v);
                        // validate vehicle number format
                        if (v.length > 11) {
                          setRegisterError('Vehicle number cannot exceed 11 characters.');
                        } else if (v.length > 0 && v.length < 5) {
                          setRegisterError('Vehicle number must be at least 5 characters long.');
                        } else {
                          setRegisterError('');
                        }
                      }}
                      placeholder="Enter vehicle number"
                      maxLength={11}
                      required
                      disabled={!selectedClient || !selectedField}
                    />
                  </div>
                  <div className="security-features">
                    <div className="hologram"></div>
                    <div className="chakra">⚙</div>
                  </div>
                  {registerError && (
                    <div style={{color: 'red', marginTop: 6, fontSize: 13}}>{registerError}</div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  id="field_value"
                  name="field_value"
                  className="form-control"
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value.toUpperCase())}
                  style={{textTransform: 'uppercase'}}
                  placeholder={`Enter ${FIELD_OPTIONS.find(f => f.value === selectedField)?.label?.toLowerCase()}`}
                  required
                  disabled={!selectedClient || !selectedField}
                />
              )}
            </div>
          )}
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Adding..." : "Add New Vehicle"}</button>
          </div>
        </form>
      </div>
      {/* Vehicle table and right sidebar (copied/adapted from ClientVehiclesPage) */}
      <div className="dashboard-latest" style={{display:'flex',width:'100%',gap:24,alignItems:'flex-start',boxSizing:'border-box'}}>
        <div className="modern-form-card client-vehicles-fullwidth" style={{marginTop:0, width:'100%', maxWidth:'none', boxSizing:'border-box', padding:'24px 2vw'}}>
          <div className="table-caption-row" style={{width:'100%'}}>
            <div />
            <div
              style={{
                marginBottom: 8,
                color: '#222',
                fontSize: 'clamp(1rem,1.2vw,1.1rem)',
                background: '#e3f7d6',
                border: '1.5px solid #4caf50',
                borderRadius: 6,
                padding: '4px 12px',
                fontWeight: 600,
                display: 'inline-block',
                maxWidth:'100%'
              }}
            >
              Showing {Math.min(vehicles.length, vehiclesLimit)} of {vehicles.length} vehicles
            </div>
          </div>
          <div className="table-container" style={{width:'100%',overflowX:'auto'}}>
            <table className="latest-table" style={{ width: '100%', marginTop: 8, fontSize:'clamp(0.95rem,1vw,1.08rem)' }}>
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Vehicle Number</th>
                  <th>Engine Number</th>
                  <th>chassis Number</th>
                  <th>Status</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {fetchingVehicles ? (
                  <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>Loading vehicles...</td></tr>
                ) : vehicles.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>No vehicles registered yet.</td></tr>
                ) : (
                  vehicles.slice(0, vehiclesLimit).map((v, idx) => {
                    let status = (v.status || 'Not Available').toUpperCase();
                    let statusColor = '#888';
                    if (status === 'ACTIVE') statusColor = 'green';
                    else if (status === 'INACTIVE') statusColor = 'orange';
                    else if (status === 'DELETED') statusColor = 'red';
                    return (
                      <tr key={v.id || v._id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: 'linear-gradient(90deg, #ffe082 0%, #f8b500 100%)',
                              color: '#7c5700',
                              padding: '3px 14px',
                              borderRadius: '18px',
                              fontSize: '1.08em',
                              boxShadow: '0 2px 8px #f8b50022',
                              border: '1.5px solid #ffe082',
                              letterSpacing: 0.5,
                              transition: 'box-shadow 0.2s, background 0.2s, color 0.2s',
                              display: 'inline-block',
                              textShadow: '0 1px 0 #fff, 0 2px 8px #f8b50022',
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background='linear-gradient(90deg, #ffe082 0%, #ffd54f 100%)';
                              e.currentTarget.style.color='#a67c00';
                              e.currentTarget.style.boxShadow='0 4px 16px #f8b50033';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background='linear-gradient(90deg, #ffe082 0%, #f8b500 100%)';
                              e.currentTarget.style.color='#7c5700';
                              e.currentTarget.style.boxShadow='0 2px 8px #f8b50022';
                            }}
                            onClick={() => setSidebarVehicle(v)}
                            title="View vehicle details"
                          >
                            {v.vehicle_number || 'Not Available'}
                          </span>
                        </td>
                        <td>{v.engine_number || 'Not Available'}</td>
                        <td>{v.chassis_number || 'Not Available'}</td>
                        <td style={{ color: statusColor, fontWeight: 600, letterSpacing: 1 }}>{status}</td>
                        <td>{v.registered_at ? new Date(v.registered_at).toLocaleString() : 'Not Available'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {vehicles.length > vehiclesLimit && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button 
                  className="load-more-btn"
                  onClick={() => setVehiclesLimit(prev => prev + 10)}
                >
                  Load More Vehicles ({vehicles.length - vehiclesLimit} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Right Sidebar for Vehicle Details */}
        {typeof window !== 'undefined' && window.innerWidth > 600 && sidebarVehicle && (
          <div style={{width:'370px',minWidth:260,maxWidth:'90vw',marginTop:24,background:'#f8fafc',border:'1.5px solid #e3e8ee',borderRadius:10,boxShadow:'0 2px 12px #0001',padding:'18px 18px 12px 18px',position:'sticky',top:24,alignSelf:'flex-start',zIndex:2}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontWeight:700,fontSize:'1.1rem',color:'#1976d2'}}>Vehicle Details</span>
              <button onClick={()=>setSidebarVehicle(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888',fontWeight:700}} title="Close">×</button>
            </div>
            {/* RTO Data Card */}
            <div style={{
              marginBottom:18,
              background:'#fff',
              border:'1.5px solid #b3e5fc',
              borderRadius:8,
              padding:'12px 12px 8px 12px',
              boxShadow:'0 1px 6px #00bcd41a',
              position:'relative',
              display:'inline-block',
              maxWidth:'100%'
            }}>
              {(sidebarVehicle.showRTO !== false) && (
                <div>
                  {typeof sidebarVehicle.rto_data === 'string' ? (
                    <div>{sidebarVehicle.rto_data}</div>
                  ) : sidebarVehicle.rto_data && typeof sidebarVehicle.rto_data === 'object' ? (
                    sidebarVehicle.rto_data.VehicleDetails ? (
                      (() => {
                        let details = sidebarVehicle.rto_data.VehicleDetails;
                        if (typeof details === 'string') {
                          try {
                            details = JSON.parse(details);
                          } catch {
                            return <div>Invalid VehicleDetails data</div>;
                          }
                        }
                        if (typeof details === 'object' && details !== null) {
                          // Only show the specified fields in the requested order
                          const showFields = [
                            "rc_pucc_no",
                            "rc_regn_dt",
                            "rc_regn_no",
                            "rc_financer",
                            "rc_fit_upto",
                            "rc_tax_upto",
                            "rc_fuel_desc",
                            "rc_pucc_upto",
                            "rc_regn_upto",
                            "rc_status_as_on",
                            "rc_vch_catg_desc",
                            "rc_vh_class_desc",
                            "rc_insurance_upto"
                          ];
                          const fieldLabels = {
                            rc_pucc_no: "PUCC No",
                            rc_regn_dt: "Registration Date",
                            rc_regn_no: "Registration No",
                            rc_financer: "Financer",
                            rc_fit_upto: "Fitness Upto",
                            rc_tax_upto: "Tax Upto",
                            rc_fuel_desc: "Fuel Type",
                            rc_pucc_upto: "PUCC Upto",
                            rc_regn_upto: "Registration Upto",
                            rc_status_as_on: "Status As On",
                            rc_vch_catg_desc: "Vehicle Category",
                            rc_vh_class_desc: "Vehicle Class",
                            rc_insurance_upto: "Insurance Upto"
                          };
                          // Move rc_regn_no to the top if present
                          const rcRegnNoIdx = showFields.indexOf("rc_regn_no");
                          let orderedFields = [...showFields];
                          if (rcRegnNoIdx > 0) {
                            orderedFields.splice(rcRegnNoIdx, 1);
                            orderedFields = ["rc_regn_no", ...orderedFields];
                          }
                          return (
                            <div style={{maxWidth:'100%',overflowX:'auto'}}>
                              <table style={{fontSize:13, background:'#f4faff', borderCollapse:'collapse', margin:'8px 0', tableLayout:'fixed', width:'100%', minWidth:0, maxWidth:'100%'}}>
                                <tbody>
                                  {orderedFields.map(key => (
                                    details[key] !== undefined && details[key] !== null && details[key] !== "" ? (
                                      <tr key={key}>
                                        <td style={{fontWeight:600,padding:'4px 8px',border:'1px solid #b3e5fc',textTransform:'capitalize',whiteSpace:'nowrap',background:'#e3f7fd',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis'}}>{fieldLabels[key] || key.replace(/_/g,' ')}</td>
                                        <td style={{padding:'4px 8px',border:'1px solid #b3e5fc',background:'#fff',wordBreak:'break-word',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{String(details[key])}</td>
                                      </tr>
                                    ) : null
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        } else {
                          return <div>No VehicleDetails found</div>;
                        }
                      })()
                    ) : (
                      <table style={{width:'100%',fontSize:13,background:'#f4faff',borderCollapse:'collapse',margin:'8px 0'}}>
                        <tbody>
                          {Object.entries(sidebarVehicle.rto_data).map(([key, value]) => (
                            <tr key={key}>
                              <td style={{fontWeight:600,padding:'4px 8px',border:'1px solid #b3e5fc',textTransform:'capitalize',width:'40%'}}>{key.replace(/_/g,' ')}</td>
                              <td style={{padding:'4px 8px',border:'1px solid #b3e5fc'}}>{
                                typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
                              }</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    <div>Data not available</div>
                  )}
                </div>
              )}
            </div>
            {/* Challan Data Card */}
            <div style={{marginBottom:0,background:'#fff',border:'1.5px solid #ffe082',borderRadius:8,padding:'12px 12px 8px 12px',boxShadow:'0 1px 6px #ffb3001a',position:'relative'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontWeight:600,fontSize:15,color:'#ff9800'}}>Vehicle Challan Data</div>
                <button onClick={()=>setSidebarVehicle(s => s ? {...s, showChallan:false} : s)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#888',fontWeight:700}} title="Close">×</button>
              </div>
              {(sidebarVehicle.showChallan !== false) && (
                <div>
                  {typeof sidebarVehicle.challan_data === 'string' ? (
                    <div>{sidebarVehicle.challan_data}</div>
                  ) : sidebarVehicle.challan_data && typeof sidebarVehicle.challan_data === 'object' ? (
                    <>
                      <div style={{marginBottom:8}}>
                        <b>Pending Challans:</b>
                        {Array.isArray(sidebarVehicle.challan_data.pending_data) && sidebarVehicle.challan_data.pending_data.length > 0 ? (
                          sidebarVehicle.challan_data.pending_data.map((challan, idx) => (
                            <div key={idx} style={{border:'1px solid #ffe082',borderRadius:4,padding:6,margin:'6px 0',background:'#fffde7'}}>
                              <div><b>Challan No:</b> {challan.challan_no}</div>
                              <div><b>Status:</b> {challan.challan_status}</div>
                              <div><b>Date:</b> {challan.challan_date_time}</div>
                              <div><b>Amount:</b> {challan.amount_of_fine_imposed || challan.fine_imposed || '-'}</div>
                              <div><b>Offence(s):</b> {challan.offence_details && Array.isArray(challan.offence_details) ? challan.offence_details.map((o, i) => o.name).join(', ') : '-'}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{color:'#888'}}>No pending challans.</div>
                        )}
                      </div>
                      <div>
                        <b>Disposed Challans:</b>
                        {Array.isArray(sidebarVehicle.challan_data.disposed_data) && sidebarVehicle.challan_data.disposed_data.length > 0 ? (
                          sidebarVehicle.challan_data.disposed_data.map((challan, idx) => (
                            <div key={idx} style={{border:'1px solid #ffe082',borderRadius:4,padding:6,margin:'6px 0',background:'#f9fbe7'}}>
                              <div><b>Challan No:</b> {challan.challan_no}</div>
                              <div><b>Status:</b> {challan.challan_status}</div>
                              <div><b>Date:</b> {challan.challan_date_time}</div>
                              <div><b>Amount:</b> {challan.amount_of_fine_imposed || challan.fine_imposed || challan.received_amount || '-'}</div>
                              <div><b>Offence(s):</b> {challan.offence_details && Array.isArray(challan.offence_details) ? challan.offence_details.map((o, i) => o.name).join(', ') : '-'}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{color:'#888'}}>No disposed challans.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>Data not available</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
