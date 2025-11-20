import React, { useState, useEffect } from "react";

function ClientVehiclesPage({ clients, initialClientId }) {
  // Scroll to top on mount or when initialClientId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialClientId]);
  const [selectedClient, setSelectedClient] = useState(initialClientId || "");
  // Sync selectedClient with initialClientId prop changes
  useEffect(() => {
    if (initialClientId && initialClientId !== selectedClient) {
      setSelectedClient(initialClientId);
      setVehiclesLimit(10);
      setSidebarVehicle(null);
    }
  }, [initialClientId]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [vehiclesLimit, setVehiclesLimit] = useState(10);
  const [sidebarVehicle, setSidebarVehicle] = useState(null);

  useEffect(() => {
    if (!selectedClient) {
      setVehicles([]);
      return;
    }
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/uservehicle?client_id=${selectedClient}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehicles(data);
        else if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
        else setVehicles([]);
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, [selectedClient]);

  // Filter, search, sort
  const filtered = vehicles.filter(v => {
    const status = (v.status || '').toUpperCase();
    if (statusFilter && status !== statusFilter.toUpperCase()) return false;
    if (search) {
      const s = search.trim().toUpperCase();
      return (
        (v.vehicle_number && v.vehicle_number.toUpperCase().includes(s)) ||
        (v.engine_number && v.engine_number.toUpperCase().includes(s)) ||
        (v.chasis_number && v.chasis_number.toUpperCase().includes(s))
      );
    }
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.registered_at ? new Date(a.registered_at) : new Date(0);
    const dateB = b.registered_at ? new Date(b.registered_at) : new Date(0);
    return sortDesc ? dateB - dateA : dateA - dateB;
  });
  const displayed = sorted.slice(0, vehiclesLimit);

  return (
    <>
      {/* Page Heading OUTSIDE card, matches other pages */}
  <div className="page-title">Client Vehicles</div>
  <div className="page-subtitle">
        Please select your client to view his fleet data
      </div>
      <div style={{display:'flex',width:'100%',gap:24,alignItems:'flex-start',boxSizing:'border-box'}}>
        <div className="modern-form-card client-vehicles-fullwidth" style={{marginTop:0, width:'100%', maxWidth:'none', boxSizing:'border-box', padding:'24px 2vw'}}>
        <div style={{
          display:'flex',
          gap:16,
          alignItems:'center',
          flexWrap:'wrap',
          marginBottom:16,
          width:'100%',
          justifyContent:'flex-start',
          rowGap:12
        }}>
          <select
            className="form-control"
            style={{ minWidth:180, flex:'1 1 220px', maxWidth:320 }}
            value={selectedClient}
            onChange={e => { setSelectedClient(e.target.value); setVehiclesLimit(10); setSidebarVehicle(null); }}
          >
            <option value="">Select Client</option>
            {clients.map(c => (
              <option key={c.id || c._id || c.email} value={c.id || c._id || c.email}>
                {c.name || c.client_name || c.email}
              </option>
            ))}
          </select>
          <input
            className="form-control"
            style={{minWidth:140,flex:'1 1 180px',maxWidth:260}}
            type="text"
            placeholder="Search by Vehicle/Engine/Chasis"
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
            disabled={!selectedClient}
          />
          <select
            className="form-control"
            style={{minWidth:100,flex:'1 1 120px',maxWidth:180}}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            disabled={!selectedClient}
          >
            <option value="">Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            className="action-btn sort-btn"
            style={{marginLeft:8,flex:'0 0 auto',minWidth:120}}
            onClick={e => { e.preventDefault(); setSortDesc(s => !s); }}
            disabled={!selectedClient}
          >
            Sort Reg Date {sortDesc ? '▼' : '▲'}
          </button>
        </div>
        {selectedClient && (
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
              Showing {Math.min(displayed.length, sorted.length)} of {sorted.length} vehicles
            </div>
          </div>
        )}
        <div className="table-container" style={{width:'100%',overflowX:'auto'}}>
          <table className="latest-table" style={{ width: '100%', marginTop: 8, fontSize:'clamp(0.95rem,1vw,1.08rem)' }}>
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Vehicle Number</th>
                <th>Engine Number</th>
                <th>Chasis Number</th>
                <th>Status</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>Loading vehicles...</td></tr>
              ) : !selectedClient ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>Select a client to view vehicles.</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>No vehicles found.</td></tr>
              ) : (
                displayed.map((v, idx) => {
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
                      <td>{v.chasis_number || 'Not Available'}</td>
                      <td style={{ color: statusColor, fontWeight: 600, letterSpacing: 1 }}>{status}</td>
                      <td>{v.registered_at ? new Date(v.registered_at).toLocaleString() : 'Not Available'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {selectedClient && sorted.length > vehiclesLimit && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button 
                className="load-more-btn"
                onClick={() => setVehiclesLimit(prev => prev + 10)}
              >
                Load More Vehicles ({sorted.length - vehiclesLimit} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Right Sidebar for Vehicle Details */}
      {sidebarVehicle && (
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
                               <td style={{padding:'4px 8px',border:'1px solid #b3e5fc'}}> {
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
    </>
  );
}

export default ClientVehiclesPage;
