
import PayChallans from "./PayChallans";
import ChallanRequests from "./ChallanRequests";
import { FaFilePdf } from "react-icons/fa";
// import { FaFilePdf } from "react-icons/fa"; 
import { FaFileExcel } from "react-icons/fa";
import { RiArrowDownSLine } from "react-icons/ri";
import { RiCheckDoubleLine } from "react-icons/ri";
import { RiFileList2Line } from "react-icons/ri";
import { RiPrinterLine } from "react-icons/ri";
import { RiDownload2Line } from "react-icons/ri";
import { RiArrowRightSLine } from "react-icons/ri";
import { RiCarLine } from "react-icons/ri";
import { FaPrint } from "react-icons/fa";
import { jsPDF } from "jspdf";
import scLogo from "../assets/sc-logo.png";
// ...existing code...
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
// Auto-logout on inactivity
function useAutoLogout() {
  const logoutTimeoutRef = useRef();
  const AUTO_LOGOUT_SECONDS = Number(import.meta.env.VITE_AUTO_LOGOUT_SECONDS) || 300;
  useEffect(() => {
    function resetLogoutTimer() {
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = setTimeout(() => {
        localStorage.clear();
        window.location.href = '/';
      }, AUTO_LOGOUT_SECONDS * 1000);
    }
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetLogoutTimer));
    resetLogoutTimer();
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetLogoutTimer));
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    };
  }, []);
}


import { FaDownload } from "react-icons/fa";
// ...existing code...
import "react-toastify/dist/ReactToastify.css";
import "./LatestTable.css";
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
import "./RightSidebar.css";
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...

// ...existing code...

// Helper to prettify keys for display
function prettifyKey(key) {
  const map = {
    rc_regn_no: 'Registration No',
    rc_owner_name: 'Owner Name',
    rc_regn_dt: 'Registration Date',
    rc_insurance_upto: 'Insurance Expiry',
    rc_tax_upto: 'Road Tax Expiry',
    rc_fit_upto: 'Fitness Expiry',
    rc_pucc_upto: 'Pollution Expiry',
    rc_chasi_no: 'Chassis No',
    rc_eng_no: 'Engine No',
    rc_vh_class_desc: 'Vehicle Class',
    rc_fuel_desc: 'Fuel Type',
    rc_maker_desc: 'Maker',
    rc_maker_model: 'Model',
    rc_off_cd: 'RTO',
    rc_state_cd: 'State',
    rc_mobile_no: 'Mobile No',
    rc_present_address: 'Address',
    challan_no: 'Challan No',
    challan_date_time: 'Date/Time',
    challan_place: 'Location',
    offence_details: 'Offence Details',
    fine_imposed: 'Fine Imposed',
    received_amount: 'Received Amount',
    challan_status: 'Status',
    department: 'Department',
    driver_name: 'Driver Name',
    owner_name: 'Owner Name',
    remark: 'Remark',
    court_name: 'Court Name',
    court_address: 'Court Address',
    state_code: 'State Code',
    rto_distric_name: 'RTO District',
    document_impounded: 'Document Impounded',
    sent_to_court_on: 'Sent to Court On',
    sent_to_reg_court: 'Sent to Reg Court',
    sent_to_virtual_court: 'Sent to Virtual Court',
    date_of_proceeding: 'Date of Proceeding',
    dl_no: 'DL No',
    amount_of_fine_imposed: 'Amount of Fine Imposed',
    receipt_no: 'Receipt No',
    name_of_violator: 'Name of Violator',
    rto_cd: 'RTO Code',
    rc_color: 'Color',
    rc_gvw: 'Gross Vehicle Weight',
    rc_no_cyl: 'No. of Cylinders',
    rc_status: 'RC Status',
    rc_fuel_cd: 'Fuel Code',
    rc_non_use: 'Non Use',
    rc_pucc_no: 'PUCC No',
    rc_unld_wt: 'Unladen Weight',
    rc_vh_type: 'Vehicle Type',
    rc_financer: 'Financer',
    rc_maker_cd: 'Maker Code',
    rc_model_cd: 'Model Code',
    rc_norms_cd: 'Norms Code',
    rc_owner_sr: 'Owner Serial',
    rc_sale_amt: 'Sale Amount',
    rc_seat_cap: 'Seating Capacity',
    rc_tax_mode: 'Tax Mode',
    rc_vch_catg: 'Vehicle Category',
    rc_vh_class: 'Vehicle Class',
    rc_cubic_cap: 'Cubic Capacity',
    rc_goods_tax: 'Goods Tax',
    rc_stand_cap: 'Standing Capacity',
    rc_wheelbase: 'Wheelbase',
    rc_norms_desc: 'Norms',
    rc_owner_cd_desc: 'Owner Category',
    rc_passenger_tax: 'Passenger Tax',
    rc_registered_at: 'Registered At',
    rc_vch_catg_desc: 'Vehicle Category',
    rc_body_type_desc: 'Body Type',
    rc_insurance_comp: 'Insurance Company',
    rc_insurance_policy_no: 'Insurance Policy No',
    rc_blacklist_status: 'Blacklist Status',
    rc_permanent_address: 'Permanent Address',
    rc_vehicle_surrendered_to_dealer: 'Vehicle Surrendered to Dealer',
    // Add more as needed
  };
  if (map[key]) return map[key];
  // Fallback: prettify snake_case or camelCase
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
}
// ...existing code...


// --- SidebarVehicleReport component ---
function SidebarVehicleReport({ vehicleChallanData }) {
  const [rtoOpen, setRtoOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [downloadDialog, setDownloadDialog] = useState({ open: false, section: null, data: null });
  // errorModal declared only once
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });
  if (!vehicleChallanData || typeof vehicleChallanData !== 'object') {
    return <div style={{color:'#e74c3c',fontWeight:600}}>No data found for this vehicle.</div>;
  }
  // Support both {data: {...}} and flat object
  const data = vehicleChallanData.data || vehicleChallanData;
  const { rto_data, pending_data, disposed_data, ...rest } = data;
  // RTO details: flatten if nested under VehicleDetails
  const rtoDetails = rto_data && rto_data.VehicleDetails ? rto_data.VehicleDetails : rto_data;
  // Custom error modal state
  // (removed duplicate declaration)
  // Helper for toast or modal
  const showToast = (msg) => {
    if (window.toast) window.toast.info(msg);
    else if (window.ReactToastify && window.ReactToastify.toast) window.ReactToastify.toast.info(msg);
    else setErrorModal({ open: true, message: msg });
  };

  // Download/Print handlers
  const handleDownload = (section, data) => {
    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
      showToast('Sorry no details available to download or print');
      return;
    }
    setDownloadDialog({ open: true, section, data });
  };
  const handlePrint = (section, data) => {
    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
      showToast('Sorry no details available to download or print');
      return;
    }
    // Print logic
    let printContent = '';
    if (section === 'rto') {
      // Try to get vehicle number from data
      const vehicleNumber = data.vehicle_number || data.rc_regn_no || data.regn_no || data.registration_no || '';
      printContent = `<h2>RTO Details${vehicleNumber ? ` - ${vehicleNumber}` : ''}</h2><table style='width:100%;font-size:14px;'>` +
        Object.entries(data).map(([k,v]) => `<tr><td style='font-weight:600;width:40%'>${prettifyKey(k)}</td><td>${typeof v === 'object' ? JSON.stringify(v) : v}</td></tr>`).join('') + '</table>';
    } else if (section === 'pending' || section === 'disposed') {
      // Each challan on a separate page, visually distinct
      printContent = data.map((challan, idx) => `
        <div style='page-break-after: always; padding: 32px 0 24px 0; width: 90%; margin: 0 auto;'>
          <div style='background: linear-gradient(90deg, #f5f8fa 60%, #e3eaf1 100%); border-radius: 16px; box-shadow: 0 2px 12px #0001; padding: 32px 40px 28px 40px; margin-bottom: 24px; border: 2px solid #1976d2;'>
            <div style='display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;'>
              <h2 style='margin: 0; color: #1976d2; font-size: 2em;'>${section === 'pending' ? 'Pending' : 'Disposed'} Challan</h2>
              <span style='font-size: 1.1em; color: #888;'>#${idx + 1}</span>
            </div>
            <table style='width:100%;font-size:15px; border-collapse: collapse;'>
              <tbody>
                ${Object.entries(challan).map(([k,v]) => `
                  <tr>
                    <td style='font-weight:600; width:38%; padding: 7px 12px; background: #f0f4fa; border-bottom: 1px solid #e3eaf1;'>${prettifyKey(k)}</td>
                    <td style='padding: 7px 12px; border-bottom: 1px solid #e3eaf1;'>${Array.isArray(v) ? v.map((item,i) => typeof item === 'object' ? JSON.stringify(item) : item).join(', ') : (typeof v === 'object' ? JSON.stringify(v) : v)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('');
    }

    const brandingHtml = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:4px;height:28px;background:linear-gradient(135deg,#2196f3 0%,#21cbf3 100%);border-radius:3px;"></div>
        <div style="display:flex;flex-direction:column;">
          <div style="font-size:18px;font-weight:700;color:#1565c0;">Smart Challan</div>
          <div style="font-size:11px;color:#555;">${section === 'rto' ? 'RTO Details' : (section === 'pending' ? 'Vehicle Challans' : '')} Summary</div>
        </div>
      </div>
    `;

    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print</title>');
    win.document.write('<style>body{font-family:Segoe UI, Arial, sans-serif;font-size:13px;color:#333;} table{border-collapse:collapse;width:100%;} td,th{padding:6px 8px;border-bottom:1px solid #e3eaf1;} h2{margin:0 0 8px 0;} @media print { div[style*="page-break-after"] { page-break-after: always !important; } }</style>');
    win.document.write('</head><body>' + brandingHtml + printContent + '</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  // Download as Excel
  const downloadExcel = (section, data) => {
    let rows = [];
    if (section === 'rto') {
      rows = [data];
    } else if (section === 'pending' || section === 'disposed') {
      rows = data;
    }
    if (!rows.length) { showToast('Sorry no details available to download or print'); return; }
    // Use XLSX if available, else fallback to CSV
    if (window.XLSX) {
      const ws = window.XLSX.utils.json_to_sheet(rows);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, section);
      window.XLSX.writeFile(wb, `${section}-details.xlsx`);
    } else {
      // Fallback: CSV
      const headers = Object.keys(rows[0]);
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${section}-details.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setDownloadDialog({ open: false, section: null, data: null });
  };

  // Download as PDF
  const downloadPDF = (section, data) => {
    try {
      const doc = new jsPDF();

      // ---- Logo + title header (top strip) ----
      const pageWidth = doc.internal.pageSize.getWidth();
      const headerHeight = 22; // reserve space at top

      // Light background bar
      doc.setFillColor(245, 248, 250);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');

      // Logo on the left
      try {
        // jsPDF supports HTMLImageElement; use scLogo URL
        const img = new Image();
        img.src = scLogo;
        // Note: addImage is sync once the image is cached. To
        // keep this simple and robust, we draw the image at a
        // fixed size; if it fails, we silently skip it.
        doc.addImage(img, 'PNG', 8, 4, 30, 14);
      } catch (_) {
        // ignore logo errors, keep text header
      }

      // Title + subtitle next to logo
      doc.setFontSize(12);
      doc.setTextColor(21, 101, 192);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Challan', 42, 10);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const subtitle = section === 'rto'
        ? 'RTO Details'
        : section === 'pending'
          ? 'Vehicle Challans'
          : '';
      doc.text(subtitle, 42, 15);

      // Start content a bit below the header
      let y = headerHeight + 6;

      if (section === 'rto') {
        // Professional color palette
        const accent = [44, 62, 80]; // dark blue-gray
        const labelColor = [60, 60, 60];
        const valueColor = [30, 30, 30];
        const bgColor = [255, 255, 255];
        const borderColor = [220, 220, 220];
        // Section heading under header
        doc.setFillColor(...accent);
        doc.roundedRect(8, y - 8, 194, 14, 3, 3, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255,255,255);
        doc.setFont('times', 'bold');
        doc.text('Vehicle Details', 14, y + 1);
        y += 14;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        // Single-column layout: each key/value in its own card row
        const entries = Object.entries(data);
        const cardX = 18, cardW = 175, cardPad = 3, rowHeight = 16;
        for (let i = 0; i < entries.length; i++) {
          const [k, v] = entries[i];
          // Paginate if near bottom
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          // Card row background
          doc.setFillColor(245, 248, 250);
          doc.roundedRect(cardX, y-6, cardW, rowHeight, 3, 3, 'F');
          // Border
          doc.setDrawColor(...borderColor);
          doc.setLineWidth(0.3);
          doc.roundedRect(cardX, y-6, cardW, rowHeight, 3, 3);
          // Label
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...labelColor);
          doc.text(`${prettifyKey(k)}`, cardX + cardPad, y);
          // Value
          doc.setFont('times', 'normal');
          doc.setTextColor(...valueColor);
          let value = typeof v === 'object' ? JSON.stringify(v) : v;
          const splitValue = doc.splitTextToSize(value, cardW - 60);
          doc.text(splitValue, cardX + 60, y);
          y += rowHeight + 2;
        }
        y += 8;
      } else if (section === 'pending' || section === 'disposed') {
        const mainColor = section === 'pending' ? [231, 76, 60] : [67, 160, 71];
        // Section title row under header
        doc.setFontSize(14);
        doc.setTextColor(...mainColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`${section === 'pending' ? 'Pending' : 'Disposed'} Challans`, 10, y);
        y += 8;
        data.forEach((challan, idx) => {
          if (idx > 0) {
            doc.addPage();
            y = 15;
          }
          // Section header for each challan
          doc.setFillColor(...mainColor);
          doc.roundedRect(8, y-7, 194, 12, 3, 3, 'F');
          doc.setTextColor(255,255,255);
          doc.setFontSize(15);
          doc.text(`Challan #${idx+1}`, 14, y+2);
          y += 12;
          doc.setTextColor(33,33,33);
          doc.setFontSize(12);
          Object.entries(challan).forEach(([k,v]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${prettifyKey(k)}:`, 12, y);
            doc.setFont('helvetica', 'normal');
            let value = Array.isArray(v) ? v.map((item,i) => typeof item === 'object' ? JSON.stringify(item) : item).join(', ') : (typeof v === 'object' ? JSON.stringify(v) : v);
            // Wrap text if too long
            const splitValue = doc.splitTextToSize(value, 120);
            doc.text(splitValue, 70, y);
            y += Math.max(7, splitValue.length * 6);
          });
          y += 4;
        });
      }
      doc.save(`${section}-details.pdf`);
    } catch (e) {
      showToast('PDF download failed. Please try again.');
    }
    setDownloadDialog({ open: false, section: null, data: null });
  };

  return (
    <div style={{padding:8}}>
      {/* RTO Section */}
      <div
        style={{
          marginBottom:14,
          borderBottom:'1px solid #e3eaf1',
          padding:'16px 18px',
          display:'flex',
          alignItems:'center',
          background:'#f5f8fa',
          borderRadius:10,
          boxShadow:'0 2px 8px #1976d210',
          transition:'background 0.2s',
        }}
        onMouseOver={e=>e.currentTarget.style.background='#e3eaf1'}
        onMouseOut={e=>e.currentTarget.style.background='#f5f8fa'}
      >
        <span style={{marginRight:10}}><RiCarLine size={22} color="#1976d2" /></span>
        <span style={{fontWeight:700, fontSize:16, color:'#1976d2', flex:1, cursor:'pointer', display:'flex', alignItems:'center'}} onClick={()=>setRtoOpen(o=>!o)}>
          RTO Details
          <span style={{marginLeft:8}}>{rtoOpen ? <RiArrowDownSLine size={22} /> : <RiArrowRightSLine size={22} />}</span>
        </span>
        <span style={{marginLeft:8, display:'flex', gap:8}}>
          <RiDownload2Line style={{cursor:'pointer'}} size={22} title="Download" onClick={()=>handleDownload('rto', rtoDetails)} />
          <RiPrinterLine style={{cursor:'pointer'}} size={22} title="Print" onClick={()=>handlePrint('rto', rtoDetails)} />
        </span>
      </div>
      {rtoOpen && rtoDetails && (
        <div style={{
          marginBottom:18,
          background:'linear-gradient(120deg, #f5f8fa 60%, #e3eaf1 100%)',
          borderRadius:14,
          boxShadow:'0 4px 24px #1976d220',
          padding:'24px 24px 18px 24px',
          border:'1.5px solid #1976d2',
          maxWidth:480,
          marginLeft:'auto',
          marginRight:'auto',
        }}>
          <div style={{display:'flex',alignItems:'center',marginBottom:18}}>
            <RiCarLine size={28} color="#1976d2" style={{marginRight:10}} />
            <span style={{fontWeight:700,fontSize:20,color:'#1976d2',letterSpacing:0.5}}>RTO Details</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 18px'}}>
            {Object.entries(rtoDetails).map(([k,v]) => (
              <React.Fragment key={k}>
                <div style={{fontWeight:600,color:'#1976d2',fontSize:15,background:'#e3eaf1',borderRadius:6,padding:'7px 10px'}}>{prettifyKey(k)}</div>
                <div style={{color:'#333',fontSize:15,background:'#fff',borderRadius:6,padding:'7px 10px',wordBreak:'break-word',boxShadow:'0 1px 4px #1976d210'}}>{typeof v === 'object' ? JSON.stringify(v) : v}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {/* Vehicle Challans Section (includes disposed) */}
      <div
        style={{
          marginBottom:14,
          borderBottom:'1px solid #e3eaf1',
          padding:'16px 18px',
          display:'flex',
          alignItems:'center',
          background:'#fff5f5',
          borderRadius:10,
          boxShadow:'0 2px 8px #e74c3c10',
          transition:'background 0.2s',
        }}
        onMouseOver={e=>e.currentTarget.style.background='#ffeaea'}
        onMouseOut={e=>e.currentTarget.style.background='#fff5f5'}
      >
        <span style={{marginRight:10}}><RiFileList2Line size={22} color="#e74c3c" /></span>
        <span style={{fontWeight:700, color:'#e74c3c', fontSize:15, flex:1, cursor:'pointer', display:'flex', alignItems:'center'}} onClick={()=>setPendingOpen(o=>!o)}>
          Vehicle Challans ({Array.isArray(pending_data) ? pending_data.length : 0}{Array.isArray(disposed_data) && disposed_data.length > 0 ? ` + ${disposed_data.length}` : ''})
          <span style={{marginLeft:8}}>{pendingOpen ? <RiArrowDownSLine size={22} /> : <RiArrowRightSLine size={22} />}</span>
        </span>
        <span style={{marginLeft:8, display:'flex', gap:8}}>
          <RiDownload2Line style={{cursor:'pointer'}} size={22} title="Download" onClick={()=>handleDownload('pending', pending_data)} />
          <RiPrinterLine style={{cursor:'pointer'}} size={22} title="Print" onClick={()=>handlePrint('pending', pending_data)} />
        </span>
      </div>
      {pendingOpen && (
        <div style={{marginBottom:18, background:'#fff', borderRadius:8, boxShadow:'0 1px 6px #e74c3c10', padding:'8px 0'}}>
          {Array.isArray(pending_data) && pending_data.length > 0 && (
            <>
              <div style={{fontWeight:600, color:'#e74c3c', margin:'8px 0 4px 12px'}}>Pending Challans</div>
              {pending_data.map((challan, idx) => (
                <ChallanCard key={challan.challan_no || idx} challan={challan} color="#e74c3c" />
              ))}
            </>
          )}
          {Array.isArray(disposed_data) && disposed_data.length > 0 && (
            <>
              <div style={{fontWeight:600, color:'#43a047', margin:'16px 0 4px 12px'}}>Disposed Challans</div>
              {disposed_data.map((challan, idx) => (
                <ChallanCard key={challan.challan_no || idx} challan={challan} color="#43a047" />
              ))}
            </>
          )}
        </div>
      )}

      {/* Enhanced Download dialog for format selection */}
      {downloadDialog.open && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0006',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,minWidth:320,boxShadow:'0 4px 32px #0003',textAlign:'center',maxWidth:400}}>
            <div style={{fontWeight:700,fontSize:20,marginBottom:8,color:'#1976d2',letterSpacing:0.5}}>Export Vehicle Data</div>
            <div style={{fontSize:15,color:'#555',marginBottom:18}}>
              Choose a format to download your data. <br />
              <span style={{color:'#888',fontSize:13}}>PDF is best for printing and sharing, Excel for analysis and editing.</span>
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:32,marginBottom:18}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',padding:12,borderRadius:10,transition:'box-shadow 0.2s',boxShadow:'0 2px 8px #1976d220'}}
                   title="Download as Excel (XLSX)"
                   onClick={()=>downloadExcel(downloadDialog.section, downloadDialog.data)}
                   onMouseOver={e=>e.currentTarget.style.boxShadow='0 2px 16px #2e7d3233'}
                   onMouseOut={e=>e.currentTarget.style.boxShadow='0 2px 8px #1976d220'}>
                <FaFileExcel size={40} style={{color:'#2e7d32',marginBottom:6}} />
                <span style={{fontWeight:600,color:'#2e7d32',fontSize:15}}>Excel</span>
                <span style={{fontSize:12,color:'#888'}}>Edit & Analyze</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',padding:12,borderRadius:10,transition:'box-shadow 0.2s',boxShadow:'0 2px 8px #1976d220'}}
                   title="Download as PDF (for printing)"
                   onClick={()=>downloadPDF(downloadDialog.section, downloadDialog.data)}
                   onMouseOver={e=>e.currentTarget.style.boxShadow='0 2px 16px #c6282833'}
                   onMouseOut={e=>e.currentTarget.style.boxShadow='0 2px 8px #1976d220'}>
                <FaFilePdf size={40} style={{color:'#c62828',marginBottom:6}} />
                <span style={{fontWeight:600,color:'#c62828',fontSize:15}}>PDF</span>
                <span style={{fontSize:12,color:'#888'}}>Print & Share</span>
              </div>
            </div>
            <button style={{marginTop:8,padding:'8px 24px',borderRadius:8,border:'1.5px solid #1976d2',background:'#fff',color:'#1976d2',fontWeight:700,cursor:'pointer',fontSize:15,boxShadow:'0 1px 4px #1976d220'}} onClick={()=>setDownloadDialog({open:false,section:null,data:null})}>Cancel</button>
          </div>
        </div>
      )}

      {/* Custom error modal */}
      {errorModal.open && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0007',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:28,borderRadius:14,minWidth:260,boxShadow:'0 2px 16px #0002',textAlign:'center',maxWidth:340}}>
            <div style={{fontWeight:700,fontSize:18,marginBottom:12,color:'#c62828'}}>Error</div>
            <div style={{fontSize:15,color:'#555',marginBottom:18}}>{errorModal.message}</div>
            <button style={{padding:'8px 24px',borderRadius:8,border:'1.5px solid #c62828',background:'#fff',color:'#c62828',fontWeight:700,cursor:'pointer',fontSize:15,boxShadow:'0 1px 4px #c6282820'}} onClick={()=>setErrorModal({open:false,message:''})}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ChallanCard component ---
function ChallanCard({ challan, color }) {
  const [open, setOpen] = useState(false);
  // Key fields to show in summary
  const summaryFields = [
    'challan_no', 'challan_date_time', 'challan_place', 'offence_details', 'fine_imposed', 'received_amount', 'challan_status', 'department', 'driver_name', 'owner_name', 'remark'
  ];
  return (
    <div style={{border:`1px solid ${color}33`,borderRadius:8,marginBottom:12,padding:8,background:'#fff', boxShadow:open?'0 2px 8px #0001':'none'}}>
      <div style={{display:'flex', alignItems:'center', cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontWeight:600, color, flex:1}}>{challan.challan_no || 'Challan'}</span>
        <span style={{fontSize:15, marginLeft:8}}>{open ? '▼' : '▶'}</span>
      </div>
      <table style={{width:'100%',fontSize:14, marginTop:open?8:0, display:open?'table':'none'}}>
        <tbody>
          {Object.entries(challan).map(([k,v]) => (
            <tr key={k}>
              <td style={{fontWeight:600, width:'40%'}}>{prettifyKey(k)}</td>
              <td>{Array.isArray(v)
                ? v.map((item, i) => typeof item === 'object' ? <div key={i}>{Object.entries(item).map(([ik,iv]) => <span key={ik}><b>{prettifyKey(ik)}:</b> {iv} </span>)}</div> : <span key={i}>{item}</span>)
                : (typeof v === 'object' ? JSON.stringify(v) : v)
              }</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!open && (
        <table style={{width:'100%',fontSize:14, marginTop:8}}>
          <tbody>
            {summaryFields.filter(f=>challan[f]).map(f => (
              <tr key={f}>
                <td style={{fontWeight:600, width:'40%'}}>{prettifyKey(f)}</td>
                <td>{f === 'offence_details' && Array.isArray(challan[f])
                  ? challan[f].map((o,i) => <span key={i}>{o.name} ({o.act})</span>)
                  : challan[f]
                }</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LatestTable.css";
// ...existing imports...
// ...other imports...
import LatestChallansTable from "./LatestChallansTable";
import TrafficLightLoader from "../assets/TrafficLightLoader";
import QuickActions from "./QuickActions";
import VehicleRTOdataTable from "./VehicleRTOdata";
import VehicleSummaryTable from "./VehicleSummaryTable";
import MyFleetTable from "./MyFleetTable";
import RegisterVehicle from "../RegisterVehicle";
import * as XLSX from "xlsx";
import ClientSidebar from "./ClientSidebar";
import ClientProfile from "./ClientProfile";
// ...existing code...
// Move these inside the ClientDashboard function component
// Move these inside the ClientDashboard function component
import LatestRTOTable from "./LatestRTOTable";
import MyChallans from "./MyChallans";
// const ChallanSettlement = React.lazy(() => import("./ChallanSettlement"));
import MyBilling from "./MyBilling";
import UserSettings from "./UserSettings";
import CustomModal from "./CustomModal";
import RightSidebar from "./RightSidebar";
import "./RightSidebar.css";

// NOTE: do not read `sc_user` at module load time (causes stale user after login)
// ClientDashboard will read `sc_user` from localStorage when the component mounts.

const DriverVerification = lazy(() => import("./DriverVerification"));
const LazyVehicleFastag = lazy(() => import("./VehicleFastag"));

function ClientDashboard() {
    useAutoLogout();
  // Feature flag for Pay Challans / Challan Settlement
  const challanSettlementLive = import.meta.env.VITE_CHALLAN_SETTLEMENT_LIVE === 'true';

  // Track if navigation to My Fleet was triggered by a specific renewal stat card or challan filter
  const [goToFleetRenewal, setGoToFleetRenewal] = useState(null); // null | 'insurance' | 'roadTax' | 'fitness' | 'pollution'
  const [goToFleetChallanFilter, setGoToFleetChallanFilter] = useState(null); // null | 'pending' | 'disposed'
  // --- Refresh confirmation modal state ---
  // For vehicle refresh confirmation
  const [refreshModal, setRefreshModal] = useState({ open: false, vehicle: null });
  const [upcomingRenewalRange, setUpcomingRenewalRange] = useState(15);
  // Keep window.upcomingRenewalRange in sync for MyFleetTable highlighting
  useEffect(() => {
    window.upcomingRenewalRange = upcomingRenewalRange;
  }, [upcomingRenewalRange]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleReport, setSelectedVehicleReport] = useState(null);
  // const [vehicleChallanData, setVehicleChallanData] = useState(null);
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  // Print filteredFleet table
  const handlePrintTable = () => {
    const printContents = document.getElementById('my-fleet-table-print-area')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=600,width=900');
    printWindow.document.write('<html><head><title>Print My Fleet</title>');
    printWindow.document.write('<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;} th{background:#f5f8fa;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };
  // Download filteredFleet as Excel
  const handleDownloadExcel = () => {
    if (!filteredFleet || filteredFleet.length === 0) return;
    // Prepare data: remove _raw if present, flatten if needed
    const exportData = filteredFleet.map(({ _raw, ...row }) => row);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MyFleet");
    XLSX.writeFile(workbook, "my_fleet.xlsx");
  };
  const [vehicleSearchText, setVehicleSearchText] = useState('');
  const [vehicleSummary, setVehicleSummary] = useState([]);
  const [loadingVehicleSummary, setLoadingVehicleSummary] = useState(false);
  const [fleetLimit, setFleetLimit] = useState(50);
  const [fleetOffset, setFleetOffset] = useState(0);
  const [fleetAll, setFleetAll] = useState(false);
  // Read current logged-in user from localStorage when component mounts.
  // State for challan filter in My Fleet
  const [fleetChallanFilter, setFleetChallanFilter] = useState('all');
  // Removed registration search and sort for My Fleet
  const [urgentRenewalFilter, setUrgentRenewalFilter] = useState('none');
  const [upcomingRenewalFilter, setUpcomingRenewalFilter] = useState('none');
  const filteredFleet = React.useMemo(() => {
    let filtered = vehicleSummary.filter(row => {
      const matchesVehicle = vehicleSearchText.trim() === '' || (row.vehicle_number || '').toLowerCase().includes(vehicleSearchText.trim().toLowerCase());
      let matchesFilter = true;
      if (fleetChallanFilter === 'pending') matchesFilter = (row.pending_challan_count ?? 0) > 0;
      else if (fleetChallanFilter === 'disposed') matchesFilter = (row.disposed_challan_count ?? 0) > 0;
      // Urgent Renewals logic
      if (urgentRenewalFilter !== 'none') {
        const now = new Date();
        const isExpired = (field) => {
          let dateStr = '';
          if (field && typeof field === 'object' && field.value) dateStr = field.value;
          else dateStr = field;
          if (!dateStr || dateStr === '-') return false;
          let d;
          if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) d = new Date(dateStr.replace(/-/g, ' '));
          else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
            const [day, month, year] = dateStr.split('-');
            d = new Date(`${year}-${month}-${day}`);
          } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) d = new Date(dateStr);
          else d = new Date(dateStr);
          if (!d || isNaN(d.getTime())) return false;
          return d < now;
        };
        if (urgentRenewalFilter === 'insurance' && !isExpired(row.rc_insurance_upto || row.insurance_exp)) return false;
        if (urgentRenewalFilter === 'roadTax' && !isExpired(row.rc_tax_upto || row.road_tax_exp)) return false;
        if (urgentRenewalFilter === 'fitness' && !isExpired(row.rc_fit_upto || row.fitness_exp)) return false;
        if (urgentRenewalFilter === 'pollution' && !isExpired(row.rc_pucc_upto || row.pollution_exp)) return false;
      }
      // Upcoming Renewals logic
      if (upcomingRenewalFilter !== 'none') {
        const now = new Date();
        const isUpcoming = (field) => {
          let dateStr = '';
          if (field && typeof field === 'object' && field.value) dateStr = field.value;
          else dateStr = field;
          if (!dateStr || dateStr === '-') return false;
          let d;
          if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) d = new Date(dateStr.replace(/-/g, ' '));
          else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
            const [day, month, year] = dateStr.split('-');
            d = new Date(`${year}-${month}-${day}`);
          } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) d = new Date(dateStr);
          else d = new Date(dateStr);
          if (!d || isNaN(d.getTime())) return false;
          const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= upcomingRenewalRange;
        };
        if (upcomingRenewalFilter === 'insurance' && !isUpcoming(row.rc_insurance_upto || row.insurance_exp)) return false;
        if (upcomingRenewalFilter === 'roadTax' && !isUpcoming(row.rc_tax_upto || row.road_tax_exp)) return false;
        if (upcomingRenewalFilter === 'fitness' && !isUpcoming(row.rc_fit_upto || row.fitness_exp)) return false;
        if (upcomingRenewalFilter === 'pollution' && !isUpcoming(row.rc_pucc_upto || row.pollution_exp)) return false;
      }
      return matchesVehicle && matchesFilter;
    });
    return filtered;
  }, [vehicleSummary, vehicleSearchText, fleetChallanFilter, urgentRenewalFilter, upcomingRenewalFilter, upcomingRenewalRange]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user')) || {};
    } catch {
      return {};
    }
  });

  // Keep `user` in sync if other tabs update localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'sc_user') {
        try { setUser(JSON.parse(e.newValue) || {}); } catch { setUser({}); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Fetch vehicle summary whenever the user object changes (e.g., after login)
  // Fetch fleet data (pagination-aware)
  useEffect(() => {
    const role = user?.user?.role;
    const clientId = user?.user?.client_id || user?.user?.id;
    if (!clientId || !(role === 'client' || role === 'customer')) return;
    setVehicleSummary([]);
    setLoadingVehicleSummary(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    // Always fetch all data: very high limit, offset 0
    fetch(`${baseUrl}/vehiclesummary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, limit: 1000000, offset: 0 })
    })
      .then(res => res.json())
      .then(data => {
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.data)) arr = data.data;
        else if (data && Array.isArray(data.rows)) arr = data.rows;
        else if (data && Array.isArray(data.result)) arr = data.result;
        else if (data && data.data && Array.isArray(data.data.rows)) arr = data.data.rows;
        else if (data && data.data && Array.isArray(data.data.items)) arr = data.data.items;
        else if (data && Array.isArray(data.vehicles)) arr = data.vehicles;
        else if (data && typeof data === 'object') {
          for (const k of Object.keys(data)) {
            if (Array.isArray(data[k])) { arr = data[k]; break; }
          }
        }
        const normalized = (arr || []).map(r => ({
          vehicle_id: r.vehicle_id || r.id || r._id || r.vehicleId || null,
          vehicle_number: r.vehicle_number || r.rc_regn_no || r.regn_no || r.vehicle_no || r.registration_number || r.vh_regn_no || r.reg_no || r.regn || '-',
          rc_regn_dt: r.rc_regn_dt || r.registration_date || r.registered_at || '-',
          pending_challan_count: r.pending_challan_count ?? r.pending_count ?? r.pending_challans ?? r.pending ?? 0,
          disposed_challan_count: r.disposed_challan_count ?? r.disposed_count ?? r.disposed_challans ?? r.disposed ?? 0,
          insurance_exp: r.insurance_exp || r.insuranceUpto || r.rc_insurance_upto || r.insurance_expiry || r.insuranceExpiry || r.rc_insurance_upto || '-',
          road_tax_exp: r.road_tax_exp || r.roadTaxExp || r.rc_tax_upto || r.road_tax || '-',
          fitness_exp: r.fitness_exp || r.fitnessUpto || r.rc_fit_upto || '-',
          pollution_exp: r.pollution_exp || r.pollutionUpto || r.rc_pucc_upto || '-',
          registered_at: r.registered_at || r.registeredAt || r.registration_date || r.created_at || r.createdAt || null,
          _raw: r
        }));
        if (fleetAll || fleetOffset === 0) {
          setVehicleSummary(normalized);
        } else {
          setVehicleSummary(prev => [...prev, ...normalized]);
        }
        setLoadingVehicleSummary(false);
      })
      .catch(() => {
        setVehicleSummary([]);
        setLoadingVehicleSummary(false);
      });
  }, [user, fleetLimit, fleetOffset, fleetAll]);
  // Handler for 'View All' in Latest Challans Table
  React.useEffect(() => {
    window.handleViewAllChallans = () => setActiveMenu('Vehicle Challans');
    // Also provide a handler for Vehicle RTO Data view all from VehicleDataTable
    window.handleViewAllRtoData = () => setActiveMenu('Vehicle RTO Data');
    // Handler for Vehicle Summary Table (My Fleet)
    window.handleViewAllMyFleet = () => setActiveMenu('My Fleet');
    return () => {
      delete window.handleViewAllChallans;
      delete window.handleViewAllRtoData;
      delete window.handleViewAllMyFleet;
    };
  }, []);
  // User role for sidebar
  const userRole = 'client';
  // Per-row loader state for RTO/Challan API calls
  const [rtoLoadingId, setRtoLoadingId] = useState(null);
  const [challanLoadingId, setChallanLoadingId] = useState(null);
  // Modal state for confirmation
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
  const [infoModal, setInfoModal] = useState({ open: false, message: '' });
  const [supportModal, setSupportModal] = useState(false);
  const [reportsModal, setReportsModal] = useState({ open: false });
  // Chart refs
  const chartRefTotal = useRef(null);
  const chartRefActive = useRef(null);
  const chartRefPaid = useRef(null);
  const chartRefAmount = useRef(null);
  // Chart loading states
  const [chartLoading, setChartLoading] = useState({
    total: true,
    active: true, 
    paid: true,
    amount: true
  });
  const [chartErrors, setChartErrors] = useState({
    total: false,
    active: false,
    paid: false,
    amount: false
  });
  const [retryTrigger, setRetryTrigger] = useState(0);
  // Client data
  const [clientData, setClientData] = useState(null);
  // Banner state for expiring subscription (fix path)
  const showExpiryBanner = !!(user && user.user && user.user.user_options && user.user.user_options.show_expiry_banner);
  // Dismissible expiry banner
  const [expiryBannerDismissed, setExpiryBannerDismissed] = useState(false);
  const [selectedVehicleStatus, setSelectedVehicleStatus] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  // Vehicle Challans
  const [vehicleChallanData, setVehicleChallanData] = useState([]);
  const [loadingVehicleChallan, setLoadingVehicleChallan] = useState(false);
  const [vehicleChallanError, setVehicleChallanError] = useState("");
  // Vehicle RTO data for expiry tracking
  const [vehicleRtoData, setVehicleRtoData] = useState([]);
  const [loadingVehicleRto, setLoadingVehicleRto] = useState(false);
  // Loader state
  const [showLoader, setShowLoader] = useState(false);
  // Active menu
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [selectedRtoData, setSelectedRtoData] = useState(null);
  // Sidebar: closed on very small screens (< 600px), open otherwise
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 600 : true));
  // Initial filter state for Vehicle RTO Data
  const [vehicleRtoInitialFilter, setVehicleRtoInitialFilter] = useState(null);

  // Modal confirmation logic for RTO/Challan requests
  const handleModalConfirm = async () => {
    if (modal.action === 'info') {
      setModal({ open: false, action: null, vehicle: null });
      return;
    }
    if (!modal.vehicle) return setModal({ open: false, action: null, vehicle: null });
    setModal({ open: false, action: null, vehicle: null });
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    // RTO/Challan loader
    if (modal.action === 'getRTO') {
      setRtoLoadingId(modal.vehicle.id || modal.vehicle._id);
      return;
    }
    if (modal.action === 'getChallan') {
      setChallanLoadingId(modal.vehicle.id || modal.vehicle._id);
      return;
    }
    // Vehicle status update API
    if (["activate", "inactivate", "delete"].includes(modal.action)) {
      // setShowLoader(true); // Page loader disabled
      try {
        const statusValue = modal.action === "activate" ? "active" : modal.action === "inactivate" ? "inactive" : "deleted";
        const res = await fetch(`${baseUrl}/updatevehiclestatus`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle_id: modal.vehicle.id || modal.vehicle._id,
            status: statusValue
          })
        });
        const data = await res.json();
        // Success detection: check for success, status, or updated vehicle
        const isSuccess = data && (data.success === true || data.status === "success" || data.updated_vehicle || data.vehicle);
        if (isSuccess) {
          toast.success(data && data.message ? data.message : "Vehicle status updated successfully.");
          // Use updated vehicle from response if available, else update locally
          setClientData(prev => {
            if (!prev || !Array.isArray(prev.vehicles)) return prev;
            const updatedVehicles = prev.vehicles.map(v => {
              if ((v.id || v._id) === (modal.vehicle.id || modal.vehicle._id)) {
                // Prefer API response for updated vehicle
                if (data.updated_vehicle) return { ...v, ...data.updated_vehicle };
                if (data.vehicle) return { ...v, ...data.vehicle };
                return { ...v, status: statusValue.toUpperCase() };
              }
              return v;
            });
            return { ...prev, vehicles: updatedVehicles };
          });
        } else {
          toast.error(data && data.message ? data.message : "Failed to update vehicle status.");
        }
      } catch (err) {
        toast.error("Error updating vehicle status.");
      } finally {
        // setShowLoader(false); // Page loader disabled
      }
    }
  };

  // Track last dashboard data update time
  const [lastDashboardUpdate, setLastDashboardUpdate] = useState(null);

  // Fetch client data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingClient(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const clientId = user && user.user && (user.user.id || user.user._id || user.user.client_id);
      if (!clientId) {
        setClientData(null);
        setLoadingClient(false);
        return;
      }
      const url = `${baseUrl}/clientdata/${clientId}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setClientData(data);
        setLastDashboardUpdate(new Date());
      } catch {
        setClientData(null);
      } finally {
        setLoadingClient(false);
      }
    };
    fetchData();
  }, [user]);

  // Fetch vehicle RTO data for expiry tracking
  useEffect(() => {
    const fetchVehicleRtoData = async () => {
      const clientId = user && user.user && (user.user.id || user.user._id || user.user.client_id);
      if (!clientId) return;

      setLoadingVehicleRto(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      
      try {
        const res = await fetch(`${baseUrl}/getvehiclertodata?clientId=${clientId}`);
        const data = await res.json();
        let rtoData = [];
        if (Array.isArray(data)) {
          rtoData = data.map(item => item.rto_data && item.rto_data.VehicleDetails ? item.rto_data.VehicleDetails : null).filter(Boolean);
        } else if (Array.isArray(data.vehicleDetails)) {
          rtoData = data.vehicleDetails;
        }
        setVehicleRtoData(rtoData);
      } catch (error) {
        console.error("Failed to fetch vehicle RTO data:", error);
        setVehicleRtoData([]);
      } finally {
        setLoadingVehicleRto(false);
      }
    };
    
    fetchVehicleRtoData();
  }, [user]);

  // Calculate expiry statistics with color-based categorization (matching VehicleDataTable logic)
  const calculateExpiryStats = () => {
    if (!Array.isArray(vehicleRtoData)) return { 
      red: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      orange: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      green: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      total: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 }
    };
    
    const now = new Date();
    
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      
      // Handle different date formats
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) {
        return new Date(dateStr.replace(/-/g, ' '));
      } else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return new Date(`${year}-${month}-${day}`);
      } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr);
      }
      return new Date(dateStr);
    };
    
    const getExpiryCategory = (dateStr) => {
      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) return null;
      const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'red'; // Date has passed
      else if (diffDays <= 30) return 'orange'; // Within 30 days
      else return 'green'; // More than 30 days
    };
    
    let stats = {
      red: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      orange: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      green: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      total: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 }
    };
    
    vehicleRtoData.forEach(vehicle => {
      // Pollution expiry
      const pollutionCategory = getExpiryCategory(vehicle.pollution_exp);
      if (pollutionCategory) {
        stats[pollutionCategory].pollution++;
        stats.total.pollution++;
      }
      
      // Insurance expiry
      const insuranceCategory = getExpiryCategory(vehicle.insurance_exp);
      if (insuranceCategory) {
        stats[insuranceCategory].insurance++;
        stats.total.insurance++;
      }
      
      // Road tax expiry
      const roadTaxCategory = getExpiryCategory(vehicle.road_tax_exp);
      if (roadTaxCategory) {
        stats[roadTaxCategory].roadTax++;
        stats.total.roadTax++;
      }
      
      // Fitness expiry
      const fitnessCategory = getExpiryCategory(vehicle.fitness_exp);
      if (fitnessCategory) {
        stats[fitnessCategory].fitness++;
        stats.total.fitness++;
      }
    });
    
    // Calculate totals for each category
    Object.keys(stats).forEach(category => {
      if (category !== 'total') {
        stats[category].total = stats[category].pollution + stats[category].insurance + 
                               stats[category].roadTax + stats[category].fitness;
      }
    });
    
    stats.total.total = stats.total.pollution + stats.total.insurance + 
                       stats.total.roadTax + stats.total.fitness;
    
    return stats;
  };

  // Draw charts for stat cards
  useEffect(() => {
    if (activeMenu !== "Dashboard") return;
    // Check if required data is available and not still loading
    const hasRequiredData = clientData && vehicleChallanData && vehicleRtoData;
    const isStillLoading = loadingVehicleChallan || loadingVehicleRto;
    if (!hasRequiredData || isStillLoading) {
      setChartLoading({ total: true, active: true, paid: true, amount: true });
      setChartErrors({ total: false, active: false, paid: false, amount: false });
      return;
    }
    setChartLoading({ total: true, active: true, paid: true, amount: true });
    setChartErrors({ total: false, active: false, paid: false, amount: false });
    const loadingStartTime = Date.now();
    const minDisplayTime = 4000;
    const clearLoadingWithDelay = (chartType) => {
      const elapsed = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      setTimeout(() => {
        setChartLoading(prev => ({ ...prev, [chartType]: false }));
        setChartErrors(prev => ({ ...prev, [chartType]: false }));
      }, remainingTime);
    };
    const timeout = setTimeout(() => {
      let retryCount = 0;
      const maxRetries = 20;
      const checkCanvasRefsAndCreateCharts = async () => {
        if (!chartRefTotal.current || !chartRefActive.current || !chartRefPaid.current || !chartRefAmount.current) {
          retryCount++;
          if (retryCount >= maxRetries) {
            setChartErrors({ total: true, active: true, paid: true, amount: true });
            setChartLoading({ total: false, active: false, paid: false, amount: false });
            return;
          }
          setTimeout(checkCanvasRefsAndCreateCharts, 100);
          return;
        }
        try {
          const chartjs = await import('chart.js');
          const { Chart, PieController, ArcElement, Tooltip, Legend } = chartjs;
          Chart.register(PieController, ArcElement, Tooltip, Legend);
          // Registered Vehicles (doughnut) - compute counts and draw interactive chart
        let active = 0, inactive = 0, deleted = 0;
        if (clientData && Array.isArray(clientData.vehicles)) {
          clientData.vehicles.forEach(v => {
            const status = (v.status || '').toLowerCase();
            if (status === 'active') active++;
            else if (status === 'inactive') inactive++;
            else if (status === 'deleted') deleted++;
          });
        }
        const ctxTotal = chartRefTotal.current.getContext('2d');
        if (window._clientTotalChart) window._clientTotalChart.destroy();
        const totalData = [active, inactive, deleted];
        // Create a purple radial gradient for the 'active' slice
        let purpleGradient = ctxTotal.createRadialGradient(60, 60, 10, 60, 60, 90);
        purpleGradient.addColorStop(0, '#ede9fe'); // light purple
        purpleGradient.addColorStop(1, '#a78bfa'); // soft purple
        // Teal for 'inactive'
        let tealGradient = ctxTotal.createRadialGradient(60, 60, 10, 60, 60, 90);
        tealGradient.addColorStop(0, '#ccfbf1');
        tealGradient.addColorStop(1, '#2dd4bf');
        // Amber for 'deleted'
        let amberGradient = ctxTotal.createRadialGradient(60, 60, 10, 60, 60, 90);
        amberGradient.addColorStop(0, '#fef3c7');
        amberGradient.addColorStop(1, '#fbbf24');
        window._clientTotalChart = new Chart(ctxTotal, {
          type: 'pie',
          data: {
            labels: ['Active', 'Inactive', 'Deleted'],
            datasets: [{
              data: totalData,
              backgroundColor: [purpleGradient, tealGradient, amberGradient],
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            // Make Registered Vehicles chart non-interactive
            onClick: null
          }
        });
        clearLoadingWithDelay('total');
        console.log('Total vehicles chart created successfully');
        
        // Active Challans (pending vs disposed)
        const ctxActive = chartRefActive.current.getContext('2d');
        if (window._clientActiveChart) window._clientActiveChart.destroy();
        let activePendingCount = 0, activeDisposedCount = 0;
        if (Array.isArray(vehicleChallanData)) {
          vehicleChallanData.forEach(item => {
            activePendingCount += Array.isArray(item.pending_data) ? item.pending_data.length : 0;
            activeDisposedCount += Array.isArray(item.disposed_data) ? item.disposed_data.length : 0;
          });
        }
        const totalChallans = activePendingCount + activeDisposedCount;
        window._clientActiveChart = new Chart(ctxActive, {
          type: 'pie',
          data: {
            labels: ['Pending', 'Disposed'],
            datasets: [{
              label: 'Active Challans',
              data: [activePendingCount, activeDisposedCount],
              backgroundColor: ['#e74c3c', '#66bb6a'],
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '20%'
          }
        });
        clearLoadingWithDelay('active');
        
    // Vehicle Expiry Statistics (horizontal bar showing counts per expiry type)
    const ctxPaid = chartRefPaid.current && chartRefPaid.current.getContext('2d');
    if (ctxPaid) {
      // Use a polar area chart for clearer proportion view of expiry counts
      if (window._clientPaidChart) window._clientPaidChart.destroy();
      const paidData = [
        (expiryCounts.insurance || 0),
        (expiryCounts.roadTax || 0),
        (expiryCounts.fitness || 0),
        (expiryCounts.pollution || 0)
      ];
      window._clientPaidChart = new Chart(ctxPaid, {
        type: 'pie',
        data: {
          labels: ['Insurance', 'Road Tax', 'Fitness', 'Pollution'],
          datasets: [{
            data: paidData,
            backgroundColor: ['#ff5252', '#ff8a65', '#f4b400', '#42a5f5'],
            borderColor: '#ffffff',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }
    clearLoadingWithDelay('paid');
        
        // Amount Due (bar) - red: pending, green: paid
        let pendingFine = 0, disposedFine = 0;
        if (Array.isArray(vehicleChallanData)) {
          vehicleChallanData.forEach(item => {
            if (Array.isArray(item.pending_data)) {
              pendingFine += item.pending_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
            }
            if (Array.isArray(item.disposed_data)) {
              disposedFine += item.disposed_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
            }
          });
        }
        const ctxAmount = chartRefAmount.current.getContext('2d');
        if (window._clientAmountChart) window._clientAmountChart.destroy();
        // Create gentle vertical gradients for Pending and Paid slices with moderately lighter colors
        const pendingGradient = ctxAmount.createLinearGradient(0, 0, 0, 160);
        pendingGradient.addColorStop(0, '#ff9a9e');
        pendingGradient.addColorStop(1, '#ff6b6b');
        const paidGradient = ctxAmount.createLinearGradient(0, 0, 0, 160);
        paidGradient.addColorStop(0, '#90caf9');
        paidGradient.addColorStop(1, '#4caf50');

        window._clientAmountChart = new Chart(ctxAmount, {
          type: 'pie',
          data: {
            labels: ['Pending', 'Paid'],
            datasets: [{
              data: [pendingFine, disposedFine],
              backgroundColor: [pendingGradient, paidGradient],
              borderColor: '#ffffff',
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = Number(context.raw || 0);
                    return `${label}: ₹${value.toLocaleString()}`;
                  }
                }
              }
            }
          }
        }); // <-- close Chart constructor
        clearLoadingWithDelay('amount');
        console.log('All charts created successfully!');
      } catch (error) {
        console.error('Chart creation failed or import failed:', error);
        setChartErrors({ total: true, active: true, paid: true, amount: true });
        setChartLoading({ total: false, active: false, paid: false, amount: false });
      }
    };
    
    // Start checking for canvas refs
    checkCanvasRefsAndCreateCharts();
  }, 100); // 100ms delay to ensure DOM is ready
    return () => {
      clearTimeout(timeout);
      // Destroy existing charts to prevent memory leaks
      if (window._clientTotalChart) {
        window._clientTotalChart.destroy();
        window._clientTotalChart = null;
      }
      if (window._clientActiveChart) {
        window._clientActiveChart.destroy();
        window._clientActiveChart = null;
      }
      if (window._clientPaidChart) {
        window._clientPaidChart.destroy();
        window._clientPaidChart = null;
      }
      if (window._clientAmountChart) {
        window._clientAmountChart.destroy();
        window._clientAmountChart = null;
      }
    };
  }, [clientData, vehicleChallanData, vehicleRtoData, activeMenu, retryTrigger, loadingVehicleChallan, loadingVehicleRto]);
  
  // Function to format numbers in brief format (1k, 1M, etc.)
  const formatBriefAmount = (amount) => {
    if (!amount || isNaN(amount)) return '0';
    
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 10000000) { // 1 crore
      return (amount / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
    } else if (absAmount >= 100000) { // 1 lakh
      return (amount / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    } else if (absAmount >= 1000) { // 1 thousand
      return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      return amount.toString();
    }
  };

  // Function to retry chart loading
  const retryCharts = () => {
    // Reset states
    setChartLoading({ total: true, active: true, paid: true, amount: true });
    setChartErrors({ total: false, active: false, paid: false, amount: false });
    
    // Trigger useEffect to run again
    setRetryTrigger(prev => prev + 1);
  };
  const [settlementComingSoonModal, setSettlementComingSoonModal] = useState(false);

  // Sidebar / menu click handler
  const handleMenuClick = (label) => {
    // Gate Pay Challans behind feature flag
    if (label === 'Pay Challans' && !challanSettlementLive) {
      setSettlementComingSoonModal(true);
      if (window.innerWidth <= 900) setSidebarOpen(false);
      return;
    }

    setActiveMenu(label);
    // on small screens, close sidebar after selecting a menu
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  useEffect(() => {
    const handleGoPayChallans = () => {
      handleMenuClick('Pay Challans');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('client-go-pay-challans', handleGoPayChallans);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('client-go-pay-challans', handleGoPayChallans);
      }
    };
  }, [challanSettlementLive]);

  const toggleSidebar = () => setSidebarOpen(s => !s);

  // Header hamburger: toggle sidebar open/closed on all screen sizes.
  // Also clear any right-side detail panels so they don't appear unexpectedly.
  const handleHeaderMenuToggle = () => {
    setSelectedVehicle(null);
    setSelectedVehicleReport(null);
    setSelectedChallan(null);
    setSelectedRtoData(null);
    setSidebarOpen(s => !s);
  };

  // Get initials for header (first two letters from first two words, or first two letters)
  let headerInitials = "";
  if (user && user.user && user.user.name) {
    const nameParts = user.user.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      headerInitials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else {
      headerInitials = user.user.name.substring(0,2).toUpperCase();
    }
  }

  useEffect(() => {
    if (activeMenu !== "Dashboard") return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const clientId = user && user.user && (user.user.id || user.user._id || user.user.client_id);
    if (!clientId) return;
    setLoadingVehicleChallan(true);
    setVehicleChallanError("");
    fetch(`${baseUrl}/getvehicleechallandata?clientId=${clientId}`)
      .then(res => res.json())
      .then(data => {
        // Helper to parse various date formats and return epoch time
        const parse = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
        const sortByCreatedDesc = (arr) => {
          if (!Array.isArray(arr)) return arr || [];
          return arr.slice().sort((a, b) => {
            const aT = parse(a.created_at || a.createdAt || a.challan_date_time);
            const bT = parse(b.created_at || b.createdAt || b.challan_date_time);
            return (bT || 0) - (aT || 0);
          });
        };

        if (Array.isArray(data)) {
          // For each vehicle, sort its pending and disposed arrays by newest first
          const processed = data.map(vehicle => ({
            ...vehicle,
            pending_data: sortByCreatedDesc(vehicle.pending_data),
            disposed_data: sortByCreatedDesc(vehicle.disposed_data)
          }));
          setVehicleChallanData(processed);
        } else if (Array.isArray(data.challans)) {
          const processed = data.challans.map(vehicle => ({
            ...vehicle,
            pending_data: sortByCreatedDesc(vehicle.pending_data),
            disposed_data: sortByCreatedDesc(vehicle.disposed_data)
          }));
          setVehicleChallanData(processed);
        } else setVehicleChallanData([]);
      })
      .catch(() => setVehicleChallanData([]))
      .finally(() => setLoadingVehicleChallan(false));
  }, [activeMenu]);

  // Calculate latestChallanRows for LatestChallansTable
  let latestChallanRows = [];
  let totalChallans = 0;

  const formatRegCourtValue = (v) => {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return '-';
      if (s.toLowerCase() === 'yes' || s.toLowerCase() === 'no') return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      // If it's a date-like string, shorten to YYYY-MM-DD or first 10 chars
      if (/\d{4}-\d{2}-\d{2}/.test(s) || /\d{2}-\d{2}-\d{4}/.test(s) || /\d{2}-[A-Za-z]{3}-\d{4}/.test(s)) return s.length > 10 ? s.slice(0, 10) : s;
      return s;
    }
    return String(v);
  };
  if (Array.isArray(vehicleChallanData)) {
    let allChallans = [];
    vehicleChallanData.forEach(item => {
      if (Array.isArray(item.pending_data)) {
        item.pending_data.forEach(c => {
          allChallans.push({ ...c, vehicle_number: item.vehicle_number, statusType: 'Pending' });
        });
      }
      if (Array.isArray(item.disposed_data)) {
        item.disposed_data.forEach(c => {
          allChallans.push({ ...c, vehicle_number: item.vehicle_number, statusType: 'Disposed' });
        });
      }
    });
    totalChallans = allChallans.length;
    // Sort by newest first using the same parsing logic as MyChallans
    // Prefer `created_at`, then `createdAt`, then fallback to `challan_date_time`.
    const parseDate = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
    allChallans.sort((a, b) => {
      const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
      const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
      return (bTime || 0) - (aTime || 0);
    });
  // Take only 10 latest
  const latestChallans = allChallans.slice(0, 10);
    if (latestChallans.length === 0) {
      latestChallanRows = [<tr key="no-challans"><td colSpan={11} style={{textAlign:'center',color:'#888'}}>No challans found.</td></tr>];
    } else {
      latestChallanRows = latestChallans.map((c, idx) => (
        <tr key={`${c.statusType}-${c.vehicle_number}-${c.challan_no}-${idx}`}>
          <td>{idx + 1}</td>
          <td>{c.vehicle_number}</td>
          <td>
            <span title={c.challan_date_time} style={{cursor:'pointer'}}>
              {(() => {
                if (!c.challan_date_time) return '';
                const dt = c.challan_date_time;
                const match = dt.match(/\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\d{2}-[A-Za-z]{3}-\d{4}/);
                return match ? match[0] : dt.slice(0,10);
              })()}
            </span>
          </td>
          <td style={{ textAlign: 'center' }}>
            {(() => {
              const reg = c.sent_to_reg_court;
              const virt = c.sent_to_virtual_court;
              if (reg === 'Yes') return 'Reg Court';
              if (virt === 'Yes') return 'Virtual Court';
              return 'Online';
            })()}
          </td>
          <td style={{ textAlign: "center"}}>{c.fine_imposed}</td>
          <td><span className={c.challan_status === 'Pending' ? 'status pending' : c.challan_status === 'Disposed' ? 'status paid' : ''}>{c.challan_status}</span></td>
          <td>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {Array.isArray(c.offence_details) && c.offence_details.map((o, j) => (
                <li key={j} className="cell-ellipsis" title={o.name}>{o.name}</li>
              ))}
            </ul>
          </td>
          <td style={{ textAlign: "center"}}>
            <button
              className="action-btn flat-btn"
              style={{ fontSize: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                setSelectedChallan(c);
              }}
              title="View Challan"
            >
              <i className="ri-eye-line" style={{ fontSize: '1.2em' }} />
            </button>
          </td>
        </tr>
      ));
    }
  }

  // Counts for dashboard stat card: pending and disposed
  let dashboardPendingCount = 0, dashboardDisposedCount = 0;
  if (Array.isArray(vehicleChallanData)) {
    vehicleChallanData.forEach(item => {
      dashboardPendingCount += Array.isArray(item.pending_data) ? item.pending_data.length : 0;
      dashboardDisposedCount += Array.isArray(item.disposed_data) ? item.disposed_data.length : 0;
    });
  }
  const dashboardTotalChallans = dashboardPendingCount + dashboardDisposedCount;

  // Vehicle RTO expiry counts (expiring soon) - compute from vehicleRtoData
  const expiryThresholdDays = parseInt(import.meta.env.VITE_EXPIRY_PERIOD_DAYS || '30', 10) || 60;
  console.log(`Expiry threshold set to ${expiryThresholdDays} days`);
  const expiryCounts = { insurance: 0, roadTax: 0, fitness: 0, pollution: 0, nationalPermit: 0, permitValid: 0 };
  if (Array.isArray(vehicleRtoData)) {
    const now = new Date();
    const parseDateStr = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) return new Date(dateStr.replace(/-/g, ' '));
      if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [d, m, y] = dateStr.split('-');
        return new Date(`${y}-${m}-${d}`);
      }
      if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
      return new Date(dateStr);
    };
    // Only count expired (date in the past)
    const isExpired = (dateStr) => {
      const d = parseDateStr(dateStr);
      if (!d || isNaN(d.getTime())) return false;
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      return diffDays < 0;
    };
    vehicleRtoData.forEach(v => {
      if (isExpired(v.insurance_exp || v.insuranceUpto || v.rc_insurance_upto)) expiryCounts.insurance++;
      if (isExpired(v.road_tax_exp || v.roadTaxExp || v.rc_tax_upto)) expiryCounts.roadTax++;
      if (isExpired(v.fitness_exp || v.fitnessUpto || v.rc_fit_upto)) expiryCounts.fitness++;
      if (isExpired(v.pollution_exp || v.pollutionUpto || v.rc_pucc_upto)) expiryCounts.pollution++;
      if (isExpired(v.rc_np_upto)) expiryCounts.nationalPermit++;
      if (isExpired(v.rc_permit_valid_upto || (v.temp_permit && v.temp_permit.rc_permit_valid_upto))) expiryCounts.permitValid++;
    });
  }

  // Total renewals count (sum of categories) for display in stat card
  const vehicleRenewalsTotal = (expiryCounts.insurance || 0) + (expiryCounts.roadTax || 0) + (expiryCounts.fitness || 0) + (expiryCounts.pollution || 0) + (expiryCounts.nationalPermit || 0) + (expiryCounts.permitValid || 0);

  // Compute challan amount totals (pending and disposed) so we can show total at card title
  let pendingFineTotal = 0, disposedFineTotal = 0;
  if (Array.isArray(vehicleChallanData)) {
    vehicleChallanData.forEach(item => {
      if (Array.isArray(item.pending_data)) {
        pendingFineTotal += item.pending_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
      }
      if (Array.isArray(item.disposed_data)) {
        disposedFineTotal += item.disposed_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
      }
    });
  }
  const totalFineAmount = pendingFineTotal + disposedFineTotal;

    // Helper: convert array of objects to CSV string
      const arrayToCsv = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        const headers = Array.from(arr.reduce((set, item) => { Object.keys(item || {}).forEach(k => set.add(k)); return set; }, new Set()));
        const rows = arr.map(obj => headers.map(h => {
          let val = obj[h] == null ? '' : obj[h];
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          if (/[,"\n]/.test(val)) val = `"${val}"`;
          return val;
        }).join(','));
        return [headers.join(','), ...rows].join('\n');
      };

      // Helper: create CSV with deterministic header order and friendly labels
      const arrayToCsvWithOrder = (arr, preferredOrder = [], labelMap = {}) => {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        // Collect all keys present in the data
        const keySet = arr.reduce((set, item) => { Object.keys(item || {}).forEach(k => set.add(k)); return set; }, new Set());
        const remaining = Array.from(keySet);
        // Start with preferredOrder keys that actually exist
        const headers = [];
        preferredOrder.forEach(k => {
          if (remaining.includes(k)) {
            headers.push(k);
            const idx = remaining.indexOf(k);
            if (idx >= 0) remaining.splice(idx, 1);
          }
        });
        // Append any remaining keys in stable alphabetical order
        remaining.sort();
        headers.push(...remaining);

        // Build CSV header row using friendly labels when available
        const headerLabels = headers.map(h => labelMap[h] || h);
        const rows = arr.map(obj => headers.map(h => {
          let val = obj[h] == null ? '' : obj[h];
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          if (/[,"\n]/.test(val)) val = `"${val}"`;
          return val;
        }).join(','));

        return [headerLabels.join(','), ...rows].join('\n');
      };

      // Exporting state for showing spinner/disabled
      const [exporting, setExporting] = useState({ rto: false, challan: false });

    const downloadCsv = (csv, filename) => {
      if (!csv) { toast.info('No data available for export'); return; }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report download started');
      setReportsModal({ open: false });
    };

    const generateRtoReport = () => {
      if (!Array.isArray(vehicleRtoData) || vehicleRtoData.length === 0) { toast.info('No RTO data available to export'); return; }
      // Wrap in async IIFE so we can set exporting state and ensure it resets
      (async () => {
        try {
          setExporting(e => ({ ...e, rto: true }));
          const rows = vehicleRtoData.map((r, idx) => {
            // Prefer rc_regn_no as the canonical vehicle number for RTO exports
            const vnum = r.rc_regn_no || r.vehicle_number || r.vehicle_no || r.registration_no || r.regn_no || r.reg_no || r.regNo || r.vehicleNo || '';
            // create a shallow copy and remove noisy/internal fields we don't want in the CSV
            const r2 = { ...r };
            // remove API response message column (column C) if present
            if (r2.api_response_message) delete r2.api_response_message;
            // also remove the original rc_regn_no field so it doesn't appear twice
            if (r2.rc_regn_no) delete r2.rc_regn_no;
            return ({ "S. No.": idx + 1, vehicle_number: vnum, ...r2 });
          });
          // Preferred column order and friendly labels for RTO exports
          const preferredOrder = ["S. No.", "vehicle_number", "owner_name", "engine_no", "chassis_no", "registration_no", "regn_no", "rc_no", "insurance_exp", "road_tax_exp", "fitness_exp", "pollution_exp", "created_at", "createdAt"];
          const labelMap = {
            "S. No.": "S. No.",
            vehicle_number: "Vehicle Number",
            owner_name: "Owner Name",
            engine_no: "Engine Number",
            chassis_no: "Chassis Number",
            registration_no: "Registration No",
            regn_no: "Registration No",
            rc_no: "RC No",
            insurance_exp: "Insurance Upto",
            road_tax_exp: "Road Tax Upto",
            fitness_exp: "Fitness Upto",
            pollution_exp: "Pollution Upto",
            created_at: "Created At",
            createdAt: "Created At"
          };
          const csv = arrayToCsvWithOrder(rows, preferredOrder, labelMap);
          const name = `rto-data-report-${new Date().toISOString().slice(0,10)}.csv`;
          downloadCsv(csv, name);
        } finally {
          setExporting(e => ({ ...e, rto: false }));
        }
      })();
    }

    const generateChallanReport = () => {
      let rows = [];
      if (Array.isArray(vehicleChallanData)) {
        vehicleChallanData.forEach(item => {
          const vnum = item.vehicle_number || item.vehicle_no || item.registration_no || '';
          if (Array.isArray(item.pending_data)) item.pending_data.forEach(c => rows.push({ ...c, vehicle_number: vnum, statusType: 'Pending' }));
          if (Array.isArray(item.disposed_data)) item.disposed_data.forEach(c => rows.push({ ...c, vehicle_number: vnum, statusType: 'Disposed' }));
        });
      }
      if (rows.length === 0) { toast.info('No challan data available to export'); return; }
      (async () => {
        try {
          setExporting(e => ({ ...e, challan: true }));
          const numbered = rows.map((r, idx) => ({ "S. No.": idx + 1, vehicle_number: r.vehicle_number || '', ...r }));
          const preferredOrder = [
            "S. No.",
            "vehicle_number",
            "challan_no",
            "challan_date_time",
            "created_at",
            "createdAt",
            "challan_status",
            "fine_imposed",
            "received_amount",
            "receipt_no",
            "owner_name",
            "driver_name",
            "department",
            "rto_distric_name",
            "state_code",
            "offence_details_pretty",
            "statusType"
          ];
          const labelMap = {
            "S. No.": "S. No.",
            vehicle_number: "Vehicle Number",
            challan_no: "Challan No",
            challan_date_time: "Challan Date/Time",
            created_at: "Created At",
            createdAt: "Created At",
            challan_status: "Status",
            fine_imposed: "Fine Imposed",
            received_amount: "Received Amount",
            receipt_no: "Receipt No",
            owner_name: "Owner Name",
            driver_name: "Driver Name",
            department: "Department",
            rto_distric_name: "RTO District",
            state_code: "State Code",
            offence_details_pretty: "Offence Details",
            statusType: "Status Type"
          };
          // Derive a readable offence details column so full text is included in export
          const enriched = numbered.map(r => ({
            ...r,
            offence_details_pretty: Array.isArray(r.offence_details)
              ? r.offence_details.map(o => o && o.name ? o.name : '').filter(Boolean).join('; ')
              : ''
          }));
          const csv = arrayToCsvWithOrder(enriched, preferredOrder, labelMap);
          const name = `challan-data-report-${new Date().toISOString().slice(0,10)}.csv`;
          downloadCsv(csv, name);
        } finally {
          setExporting(e => ({ ...e, challan: false }));
        }
      })();
    };

    return (
    <>
    <ToastContainer position="top-right" autoClose={2000} />
  <div className={`dashboard-layout ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      {/* Page loader commented out - only using graph loaders now */}
      {/* {showLoader && (
        <div className="page-loader-overlay">
          <TrafficLightLoader />
        </div>
      )} */}
      {sidebarOpen && window.innerWidth <= 900 && (
        <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />
      )}
      {sidebarOpen && (
        <ClientSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      )}
      <main className="main-content admin-home-content" style={{flex: 1, minHeight: '100vh', transition: 'all 0.35s cubic-bezier(.4,1.3,.5,1)', WebkitTransition: 'all 0.35s cubic-bezier(.4,1.3,.5,1)'}}>
          {/* DEBUG: Show showExpiryBanner and user?.user_options?.show_expiry_banner */}
          {/* ...existing code... */}
          {/* Expiry Banner - fixed, dismissible, modern style */}
          {showExpiryBanner && !expiryBannerDismissed && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 1200,
              pointerEvents: 'none',
            }}>
              <div style={{
                background: '#fffbe6',
                color: '#ad6800',
                border: '1.5px solid #ffe58f',
                borderRadius: 12,
                padding: '14px 32px 14px 20px',
                margin: '14px 0',
                fontWeight: 600,
                fontSize: 16,
                boxShadow: '0 4px 18px 0 rgba(251, 191, 36, 0.13)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                maxWidth: 540,
                width: 'calc(100vw - 32px)',
                pointerEvents: 'auto',
                position: 'relative',
              }}>
                <i className="ri-error-warning-line" style={{ fontSize: 24, color: '#faad14', flexShrink: 0 }}></i>
                <span style={{ flex: 1 }}>{import.meta.env.VITE_EXPIRY_BANNER_MSG || 'Your subscription is expiring soon. Please contact sales team to continue with our Smart services.'}</span>
                <button
                  onClick={() => setExpiryBannerDismissed(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ad6800',
                    fontSize: 22,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginLeft: 8,
                    lineHeight: 1,
                    borderRadius: 4,
                    padding: '2px 8px',
                    transition: 'background 0.15s',
                  }}
                  aria-label="Dismiss banner"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {/* Add margin to main content if banner is visible */}
          <style>{`
            body { overscroll-behavior-y: none; }
            @media (max-width: 600px) {
              .main-content.admin-home-content { margin-top: ${showExpiryBanner && !expiryBannerDismissed ? '70px' : '0'} !important; }
            }
            @media (min-width: 601px) {
              .main-content.admin-home-content { margin-top: ${showExpiryBanner && !expiryBannerDismissed ? '60px' : '0'} !important; }
            }
          `}</style>
  <style>{`
    .sidebar,
    .main-content,
    .main-content.admin-home-content {
      transition: all 0.35s cubic-bezier(.4,1.3,.5,1) !important;
    }
  `}</style>
        <div className="header" style={{marginBottom: 24}}>
            <div className="header-left" style={{display:'flex',alignItems:'center',gap:16}}>
            <div className="menu-toggle" style={{fontSize:22,cursor:'pointer'}} onClick={handleHeaderMenuToggle}>
              <i className="ri-menu-line"></i>
            </div>
            <div className="header-title" style={{fontWeight:600}}>
              {activeMenu === 'Dashboard' ? 'Dashboard'
                : activeMenu === 'Profile' ? 'Profile'
                : activeMenu === 'Registered Vehicles' ? 'Registered Vehicles'
                : activeMenu === 'Challans' ? 'Vehicle Challans'
                : activeMenu === 'Billing' ? 'My Billing'
                : activeMenu === 'Settings' ? 'Settings'
                : activeMenu}
            </div>
          </div>
          <div className="header-right" style={{display:'flex',alignItems:'center',gap:18,cursor:'pointer'}} onClick={() => setActiveMenu('Profile')} role="button" aria-label="Open profile">
            <button className="header-more" title="Hide / Show sidebar" onClick={(e)=>{ e.stopPropagation(); setSidebarOpen(s => !s); }} style={{background:'transparent',border:'none',cursor:'pointer',color:'#333',fontSize:20}}>
              <i className="ri-more-2-fill" />
            </button>
            <div className="header-profile" style={{marginLeft:8}} onClick={(e)=>{ e.stopPropagation(); setActiveMenu('Profile'); }} role="button">
              <div className="header-avatar" style={{background:'#0072ff',color:'#fff',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:16}}>{headerInitials || 'JS'}</div>
            </div>
          </div>
        </div>
        {activeMenu === "Dashboard" && (
          <>
            <div className="dashboard-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative'}}>
              <div>
                <h1 className="dashboard-title">Welcome back{user.user && user.user.name ? `, ${user.user.name}` : '123'}!</h1>
                <p>Here's an overview of your Fleet status</p>
              </div>
              {lastDashboardUpdate && (
                <span style={{
                  background: '#e3f7d6',
                  color: '#222',
                  border: '1.5px solid #4caf50',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontWeight: 600,
                  fontSize: 14,
                  marginLeft: 16,
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-start',
                  marginTop: 8
                }}>
                  Last updated: {lastDashboardUpdate.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="dashboard-stats">
              <div className="stat-card" style={{background: 'linear-gradient(120deg, #93c5fd 60%, #dbeafe 100%)', borderRadius: 18, boxShadow: '0 6px 24px rgba(59, 130, 246, 0.10)', border: '1.5px solid #dbeafe'}}>
                <div className="stat-card-content">
                  <i className="ri-car-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Registered Vehicles</div>
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingClient ? '...' : (clientData && Array.isArray(clientData.vehicles) ? clientData.vehicles.length : 0)}
                    </div>
                  </div>
                  {/* Show active/inactive/deleted counts as badges */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 8 }}>
                    {(() => {
                      const counts = { active: 0, inactive: 0, deleted: 0 };
                      if (clientData && Array.isArray(clientData.vehicles)) {
                        clientData.vehicles.forEach(v => {
                          const s = (v.status || '').toLowerCase();
                          if (s === 'active') counts.active++;
                          else if (s === 'inactive') counts.inactive++;
                          else if (s === 'deleted') counts.deleted++;
                        });
                      }
                      return [
                        <div
                          key="act"
                          className={`status-badge`}
                          style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                          title="View active registered vehicles"
                          onClick={() => {
                            setActiveMenu('Register Vehicle');
                            setTimeout(() => {
                              try {
                                const section = document.getElementById('registered-vehicles-section');
                                if (section) {
                                  const rect = section.getBoundingClientRect();
                                  const offset = rect.top + window.scrollY - 80; // account for header spacing
                                  window.scrollTo({ top: offset < 0 ? 0 : offset, behavior: 'smooth' });
                                }
                                const select = document.querySelector('#registered-vehicles-section select.form-control');
                                if (select) {
                                  select.value = 'ACTIVE';
                                  select.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                              } catch (e) {}
                            }, 300);
                          }}
                        >
                          <div style={{ color: '#42a5f5', fontWeight: 700 }}>{counts.active}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>Active</div>
                        </div>,
                        <div
                          key="inact"
                          className={`status-badge`}
                          style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                          title="View inactive registered vehicles"
                          onClick={() => {
                            setActiveMenu('Register Vehicle');
                            setTimeout(() => {
                              try {
                                const section = document.getElementById('registered-vehicles-section');
                                if (section) {
                                  const rect = section.getBoundingClientRect();
                                  const offset = rect.top + window.scrollY - 80;
                                  window.scrollTo({ top: offset < 0 ? 0 : offset, behavior: 'smooth' });
                                }
                                const select = document.querySelector('#registered-vehicles-section select.form-control');
                                if (select) {
                                  select.value = 'INACTIVE';
                                  select.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                              } catch (e) {}
                            }, 300);
                          }}
                        >
                          <div style={{ color: '#ffa726', fontWeight: 700 }}>{counts.inactive}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>Inactive</div>
                        </div>,
                        <div
                          key="del"
                          className={`status-badge`}
                          style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                          title="View deleted vehicles"
                          onClick={() => {
                            setActiveMenu('Register Vehicle');
                            let tries = 0;
                            const maxTries = 10;
                            const attemptScroll = () => {
                              try {
                                const section = document.getElementById('deleted-vehicles-section');
                                if (section) {
                                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  return;
                                }
                              } catch (e) {}
                              if (tries < maxTries) {
                                tries += 1;
                                setTimeout(attemptScroll, 120);
                              }
                            };
                            setTimeout(attemptScroll, 300);
                          }}
                        >
                          <div style={{ color: '#e15759', fontWeight: 700 }}>{counts.deleted}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>Deleted</div>
                        </div>
                      ];
                    })()}
                  </div>
                </div>
                <div className="stat-chart-container">
                  <canvas ref={chartRefTotal} style={{display: chartLoading.total || chartErrors.total ? 'none' : 'block'}} />
                    {chartLoading.total ? (
                      <div className="default-loader" style={{ zIndex: 10 }}>
                        <div className="loader-spinner"></div>
                      </div>
                    ) : chartErrors.total ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                        <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              <div className="stat-card" style={{background: 'linear-gradient(120deg, #6ee7b7 60%, #d1fae5 100%)', borderRadius: 18, boxShadow: '0 6px 24px rgba(16, 185, 129, 0.10)', border: '1.5px solid #d1fae5'}}>
                <div className="stat-card-content">
                  <i className="ri-error-warning-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Challans Fetched</div>
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingVehicleChallan ? '...' : dashboardTotalChallans}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 8 }}>
                    <div key="pending" className={`status-badge`} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      title="View pending challans"
                      onClick={() => {
                        localStorage.setItem('sc_challan_filter', 'pending');
                        setActiveMenu('Vehicle Challans');
                      }}>
                      <div style={{ color: '#e74c3c', fontWeight: 700 }}>{loadingVehicleChallan ? '...' : dashboardPendingCount}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Pending</div>
                    </div>
                    <div key="disposed" className={`status-badge`} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      title="View disposed challans"
                      onClick={() => {
                        localStorage.setItem('sc_challan_filter', 'disposed');
                        setActiveMenu('Vehicle Challans');
                      }}>
                      <div style={{ color: '#66bb6a', fontWeight: 700 }}>{loadingVehicleChallan ? '...' : dashboardDisposedCount}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Disposed</div>
                    </div>
                  </div>
                </div>
                <div className="stat-chart-container">
                  <canvas ref={chartRefActive} style={{display: chartLoading.active || chartErrors.active ? 'none' : 'block'}} />
                  {chartLoading.active ? (
                    <div className="default-loader" style={{ zIndex: 10 }}>
                      <div className="loader-spinner"></div>
                    </div>
                  ) : chartErrors.active ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                      <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="stat-card" style={{background: 'linear-gradient(120deg, #f9a8d4 60%, #fce7f3 100%)', borderRadius: 18, boxShadow: '0 6px 24px rgba(236, 72, 153, 0.10)', border: '1.5px solid #fce7f3'}}>
                <div className="stat-card-content">
                  <i className="ri-alarm-warning-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Vehicle Renewals</div>
                    {/* <span style={{ color: '#666', fontSize: 12, float: 'left' }}>Expired</span> */}
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingVehicleRto ? '...' : vehicleRenewalsTotal}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-start', marginTop: 10 }}>
                    <div
                      className={`status-badge`}
                      style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      title="Show vehicles with expired insurance"
                      onClick={() => {
                        setGoToFleetRenewal('insurance');
                        setActiveMenu('My Fleet');
                      }}
                    >
                      <div style={{ color: '#ff5252', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.insurance}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Insurance</div>
                    </div>
                    <div
                      className={`status-badge`}
                      style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      title="Show vehicles with expired road tax"
                      onClick={() => {
                        setGoToFleetRenewal('roadTax');
                        setActiveMenu('My Fleet');
                      }}
                    >
                      <div style={{ color: '#ff8a65', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.roadTax}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Road Tax</div>
                    </div>
                    <div
                      className={`status-badge`}
                      style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      title="Show vehicles with expired fitness certificate"
                      onClick={() => {
                        setGoToFleetRenewal('fitness');
                        setActiveMenu('My Fleet');
                      }}
                    >
                      <div style={{ color: '#f4b400', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.fitness}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Fitness</div>
                    </div>
                    <div
                      className={`status-badge`}
                      style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      title="Show vehicles with expired pollution certificate"
                      onClick={() => {
                        setGoToFleetRenewal('pollution');
                        setActiveMenu('My Fleet');
                      }}
                    >
                      <div style={{ color: '#42a5f5', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.pollution}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Pollution</div>
                    </div>
                  </div>
                </div>
                {/* Info line (threshold) intentionally hidden to save vertical space */}
                <div className="stat-chart-container">
                  <canvas ref={chartRefPaid} style={{display: chartLoading.paid || chartErrors.paid ? 'none' : 'block'}} />
                  {chartLoading.paid ? (
                    <div className="default-loader" style={{ zIndex: 10 }}>
                      <div className="loader-spinner"></div>
                    </div>
                  ) : chartErrors.paid ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                      <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="stat-card" style={{background: 'linear-gradient(120deg, #fdba74 60%, #fef3c7 100%)', borderRadius: 18, boxShadow: '0 6px 24px rgba(251, 191, 36, 0.10)', border: '1.5px solid #fef3c7'}}>
                <div className="stat-card-content">
                  <i className="ri-money-rupee-circle-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Challan Amount</div>
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingVehicleChallan ? '...' : `₹${formatBriefAmount(totalFineAmount)}`}
                    </div>
                  </div>
                  <div className="stat-value" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                    {loadingVehicleChallan
                      ? '...'
                      : <>
                          <span style={{color: '#e74c3c', fontWeight: 600, fontSize: '0.75em', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}
                            title="Show pending challans"
                            onClick={() => { setActiveMenu('Vehicle Challans'); }}>
                            Pending: ₹{formatBriefAmount(pendingFineTotal)}
                          </span>
                          <span style={{color: '#4caf50', fontWeight: 600, fontSize: '0.65em', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}
                            title="Show paid challans"
                            onClick={() => { setActiveMenu('Vehicle Challans'); }}>
                            Paid: ₹{formatBriefAmount(disposedFineTotal)}
                          </span>
                        </>
                    }
                  </div>
                </div>
                <div className="stat-chart-container">
                  <canvas ref={chartRefAmount} style={{display: chartLoading.amount || chartErrors.amount ? 'none' : 'block'}} />
  
                  {chartLoading.amount ? (
                    <div className="default-loader" style={{ zIndex: 10 }}>
                      <div className="loader-spinner"></div>
                    </div>
                  ) : chartErrors.amount ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                      <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div style={{marginBottom:24}}>
              <VehicleSummaryTable
                data={vehicleSummary}
                loading={loadingVehicleSummary}
                onRefresh={row => {
                  setRefreshModal({ open: true, vehicle: row });
                }}
                onView={async row => {
                  setSelectedVehicle(row);
                  setSelectedVehicleReport(null);
                  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
                  const clientID = row.client_id || row.clientID || user?.user?.client_id || user?.user?.id;
                  const vehicleNumber = row.vehicle_number || row.vehicleNumber;
                  setTimeout(async () => {
                    try {
                      const res = await fetch(`${baseUrl}/getvehiclereport`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clientID, vehicleNumber })
                      });
                      const data = await res.json();
                      setSelectedVehicleReport(data);
                    } catch (e) {
                      setSelectedVehicleReport({ error: 'Failed to fetch vehicle report.' });
                    }
                  }, 0);
                }}
              />
            </div>

            <div className="dashboard-two-column-row">
              <div className="dashboard-two-column-card">
                <LatestChallansTable
                  latestChallanRows={latestChallanRows.slice(0, 5)}
                  loadingVehicleChallan={loadingVehicleChallan}
                  vehicleChallanError={vehicleChallanError}
                  totalCount={totalChallans}
                  limit={5}
                />
              </div>
              <div className="dashboard-two-column-card">
                <LatestRTOTable
                  vehicleData={vehicleRtoData.slice(0, 5)}
                  loading={loadingVehicleRto}
                  error={vehicleRtoData && vehicleRtoData.error}
                  setSelectedRtoData={setSelectedRtoData}
                  totalCount={vehicleRtoData.length}
                />
              </div>
            </div>

            {selectedVehicle && activeMenu === "Dashboard" && (
              <RightSidebar
                open
                onClose={() => {
                  setSelectedVehicle(null);
                  setSelectedVehicleReport(null);
                }}
                title={`Vehicle #${selectedVehicle.vehicle_number} Report`}
              >
                {selectedVehicleReport === null ? (
                  <div style={{padding:24, textAlign:'center'}}>
                    <span className="loader-spinner" style={{display:'inline-block',marginBottom:8}}></span>
                    <div>Loading vehicle report...</div>
                  </div>
                ) : (
                  <SidebarVehicleReport vehicleChallanData={selectedVehicleReport} />
                )}
              </RightSidebar>
            )}
            {/* Registered vehicles table removed from dashboard as requested */}
            {/* QuickActions moved to a shared component rendered below so it's available on every page */}
            {/* Removed dashboard 'due' data section as requested */}
          </>
        )}
        {activeMenu === "Profile" && (
          <div className="client-profile-section-isolated">
            <ClientProfile />
          </div>
        )}
            {activeMenu === "Register Vehicle" && <RegisterVehicle />}
        {activeMenu === "My Fleet" && (
          <div style={{marginBottom:24}}>

            <div id="my-fleet-table-print-area">
              <MyFleetTable
                data={vehicleSummary}
                loading={loadingVehicleSummary}
                onRefresh={row => {}}
                onView={async row => {
                  setSelectedVehicle(row);
                  setSelectedVehicleReport(null);
                  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
                  const clientID = row.client_id || row.clientID || user?.user?.client_id || user?.user?.id;
                  const vehicleNumber = row.vehicle_number || row.vehicleNumber;
                  setTimeout(async () => {
                    try {
                      const res = await fetch(`${baseUrl}/getvehiclereport`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clientID, vehicleNumber })
                      });
                      const data = await res.json();
                      setSelectedVehicleReport(data);
                    } catch (e) {
                      setSelectedVehicleReport({ error: 'Failed to fetch vehicle report.' });
                    }
                  }, 0);
                }}
                totalCount={typeof vehicleSummary === 'object' && vehicleSummary._totalCount ? vehicleSummary._totalCount : (Array.isArray(vehicleSummary) && vehicleSummary.totalCount ? vehicleSummary.totalCount : (typeof window !== 'undefined' && window.fleetTotalCount ? window.fleetTotalCount : undefined))}
                upcomingRenewalRange={upcomingRenewalRange}
                goToFleetRenewal={goToFleetRenewal}
                onConsumeFleetRenewal={() => setGoToFleetRenewal(null)}
                onShowMoreRecords={val => {
                  if (val === 'all') {
                    setFleetAll(true);
                  } else {
                    setFleetAll(false);
                    setFleetLimit(prev => prev + Number(val));
                    setFleetOffset(prev => prev + Number(val));
                  }
                }}
                onResetRecords={() => {
                  setFleetAll(false);
                  setFleetLimit(50);
                  setFleetOffset(0);
                }}
                filteredFleet={filteredFleet}
              />
              {selectedVehicle && activeMenu === "My Fleet" && (
                <RightSidebar
                  open
                  onClose={() => {
                    setSelectedVehicle(null);
                    setSelectedVehicleReport(null);
                  }}
                  title={`Vehicle #${selectedVehicle.vehicle_number} Report`}
                >
                  {selectedVehicleReport === null ? (
                    <div style={{padding:24, textAlign:'center'}}>
                      <span className="loader-spinner" style={{display:'inline-block',marginBottom:8}}></span>
                      <div>Loading vehicle report...</div>
                    </div>
                  ) : (
                    <SidebarVehicleReport vehicleChallanData={selectedVehicleReport} />
                  )}
                </RightSidebar>
              )}
            </div>
          </div>
        )}
        {activeMenu === "RTO Details" && (
          <VehicleRTOdataTable
            clientId={user.user && (user.user.client_id || user.user.id || user.user._id)}
            selectedRtoData={selectedRtoData}
            setSelectedRtoData={setSelectedRtoData}
            searchText={vehicleSearchText}
            initialExpiryFilter={vehicleRtoInitialFilter?.expiryFilter}
            initialTab={vehicleRtoInitialFilter?.tab}
            onViewAll={() => setActiveMenu('RTO Details')}
          />
        )}
    {activeMenu === "Vehicle Challans" && <MyChallans />}
      {activeMenu === "Pay Challans" && challanSettlementLive && <PayChallans />}
      {activeMenu === "Challan Requests" && <ChallanRequests />}
        {activeMenu === "Challans" && <UserChallan />}
        {activeMenu === "My Billing" && <MyBilling clientId={user.user && (user.user.id || user.user._id)} />}
        {activeMenu === "Settings" && <UserSettings users={[]} />}
        {activeMenu === "DL Details" && (
          <Suspense fallback={<div>Loading...</div>}>
            <DriverVerification />
          </Suspense>
        )}
        {activeMenu === "Fastag Details" && (
          <Suspense fallback={<div>Loading...</div>}>
            <LazyVehicleFastag />
          </Suspense>
        )}
      {/* Shared quick actions bar available on every page except Vehicle Challans */}
      {!(selectedChallan || selectedRtoData) && activeMenu !== "Vehicle Challans" && (
        <div className="main-quick-actions-wrapper" style={{ padding: '0 30px 30px 30px' }}>
          <QuickActions
            title="Quick Actions"
            sticky={true}
            onAddVehicle={() => setActiveMenu('Register Vehicle')}
            onBulkUpload={() => {
              setActiveMenu('Register Vehicle');
              setTimeout(() => {
                try {
                  const el = document.querySelector('input[type=file][accept*=".xlsx"]');
                  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); try { el.focus(); } catch(e){} }
                } catch (e) {}
                try {
                  const card = document.querySelector('.upload-card');
                  if (card) {
                    card.classList.remove('highlight-upload');
                    void card.offsetWidth;
                    card.classList.add('highlight-upload');
                    setTimeout(() => card.classList.remove('highlight-upload'), 2600);
                  }
                } catch (e) {}
              }, 300);
            }}
            onPay={() => handleMenuClick('Pay Challans')}
            onReports={() => setReportsModal({ open: true })}
            onContact={() => setSupportModal(true)}
          />
        </div>
      )}
      <CustomModal
        open={settlementComingSoonModal}
        title="Coming soon"
        description="We are rolling out this feature very soon. Contact sales for more details."
        icon="ri-information-line"
        onConfirm={() => setSettlementComingSoonModal(false)}
        onCancel={() => setSettlementComingSoonModal(false)}
        confirmText="OK"
        cancelText={null}
      >
        {(() => {
          const email = import.meta.env.VITE_SUPPORT_EMAIL || 'support@smartchallan.com';
          const phone = import.meta.env.VITE_SUPPORT_PHONE || '+91-1234-567-890';
          return (
            <div style={{ lineHeight: 1.7, fontSize: 15, marginTop: 4 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'linear-gradient(120deg,#e3f2fd,#bbdefb)',
                  color: '#0d47a1',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#ffffffcc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
                  }}
                >
                  <i className="ri-rocket-line" style={{ fontSize: 20 }} />
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Challan settlement is almost here!</div>
                  <div style={{ fontSize: 13 }}>Be among the first to get access by talking to our team.</div>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#fff7e6',
                  border: '1px solid #ffe0b2',
                  color: '#e65100',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <i className="ri-mail-line" style={{ fontSize: 18 }} />
                  <span>
                    <b>Email:</b>{' '}
                    <a href={`mailto:${email}`} style={{ color: '#e65100', textDecoration: 'underline' }}>
                      {email}
                    </a>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-phone-line" style={{ fontSize: 18 }} />
                  <span>
                    <b>Phone:</b>{' '}
                    <a href={`tel:${phone}`} style={{ color: '#e65100', textDecoration: 'underline' }}>
                      {phone}
                    </a>
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </CustomModal>
      </main>
      <CustomModal
        open={infoModal.open}
        title={infoModal.message}
        onConfirm={() => setInfoModal({ open: false, message: '' })}
        onCancel={() => setInfoModal({ open: false, message: '' })}
        confirmText="OK"
        cancelText={null}
      />
      <CustomModal
        open={supportModal}
        title="Contact Support"
        onConfirm={() => setSupportModal(false)}
        onCancel={() => setSupportModal(false)}
        confirmText="OK"
        cancelText={null}
      >
        {(() => {
          const email = import.meta.env.VITE_SUPPORT_EMAIL || 'support@smartchallan.com';
          const phone = import.meta.env.VITE_SUPPORT_PHONE || '+91-1234-567-890';
          return (
            <div style={{lineHeight: 1.7, fontSize: 15}}>
              <div><b>Email:</b> <a href={`mailto:${email}`}>{email}</a></div>
              <div><b>Phone:</b> <a href={`tel:${phone}`}>{phone}</a></div>
              <div style={{marginTop: 10}}><b>Support Hours:</b> Mon - Sat, 9 AM to 6 PM</div>
              <div style={{color: '#b77', marginTop: 4}}>Public holidays: Team is not available. Next working day we will contact you.</div>
            </div>
          );
        })()}
      </CustomModal>
      <CustomModal
        open={reportsModal.open}
        title="Generate Reports"
        description="Choose which report you want to generate and download as CSV."
        onConfirm={() => setReportsModal({ open: false })}
        onCancel={() => setReportsModal({ open: false })}

        confirmText="Close"
        cancelText={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#333' }}>Select a report to generate and download:</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="action-btn" onClick={generateRtoReport} title="Generate RTO Data Report" disabled={exporting.rto}>
              {exporting.rto ? 'Generating RTO...' : 'Generate RTO Data Report'}
            </button>
            <button className="action-btn" onClick={generateChallanReport} title="Generate Challan Data Report" disabled={exporting.challan}>
              {exporting.challan ? 'Generating Challans...' : 'Generate Challan Data Report'}
            </button>
          </div>
          <div style={{ fontSize: 13, color: '#666' }}>Files will download as CSV. If your browser blocks downloads, allow downloads for this site.</div>
        </div>
      </CustomModal>
      {selectedChallan && (
        <RightSidebar
          open
          onClose={() => {
            setTimeout(() => setSelectedChallan(null), 300);
          }}
          title={`Challan Details: ${selectedChallan.challan_no}`}
        >
          <table className="latest-table" style={{ width: '100%', fontSize: 15 }}>
            <tbody>
              <tr><td><b>Status</b></td><td>{selectedChallan.challan_status}</td></tr>
              <tr><td><b>Vehicle Number</b></td><td>{selectedChallan.vehicle_number}</td></tr>
              <tr><td><b>Challan No</b></td><td>{selectedChallan.challan_no}</td></tr>
              <tr><td><b>Date/Time</b></td><td>{selectedChallan.challan_date_time}</td></tr>
              <tr><td><b>Location</b></td><td>{selectedChallan.challan_place || selectedChallan.location || selectedChallan.challan_location}</td></tr>
              <tr><td><b>Owner Name</b></td><td>{selectedChallan.owner_name}</td></tr>
              <tr><td><b>Driver Name</b></td><td>{selectedChallan.driver_name}</td></tr>
              <tr><td><b>Name of Violator</b></td><td>{selectedChallan.name_of_violator}</td></tr>
              <tr><td><b>Department</b></td><td>{selectedChallan.department}</td></tr>
              <tr><td><b>State Code</b></td><td>{selectedChallan.state_code}</td></tr>
              <tr><td><b>RTO District Name</b></td><td>{selectedChallan.rto_distric_name}</td></tr>
              <tr><td><b>Remark</b></td><td>{selectedChallan.remark}</td></tr>
              <tr><td><b>Document Impounded</b></td><td>{selectedChallan.document_impounded}</td></tr>
              <tr><td><b>Sent to Court On</b></td><td>{selectedChallan.sent_to_court_on}</td></tr>
              <tr><td><b>Sent to Reg Court</b></td><td>{selectedChallan.sent_to_reg_court}</td></tr>
              <tr><td><b>Sent to Virtual Court</b></td><td>{selectedChallan.sent_to_virtual_court}</td></tr>
              <tr><td><b>Court Name</b></td><td>{selectedChallan.court_name}</td></tr>
              <tr><td><b>Court Address</b></td><td>{selectedChallan.court_address}</td></tr>
              <tr><td><b>Date of Proceeding</b></td><td>{selectedChallan.date_of_proceeding}</td></tr>
              <tr><td><b>DL No</b></td><td>{selectedChallan.dl_no}</td></tr>
              {selectedChallan.challan_status === 'Disposed' && (
                <>
                  <tr><td><b>Receipt No</b></td><td>{selectedChallan.receipt_no}</td></tr>
                  <tr><td><b>Received Amount</b></td><td>{selectedChallan.received_amount}</td></tr>
                </>
              )}
              <tr><td><b>Fine Imposed</b></td><td>{selectedChallan.fine_imposed}</td></tr>
              <tr><td><b>Amount of Fine Imposed</b></td><td>{selectedChallan.amount_of_fine_imposed}</td></tr>
              <tr><td><b>Act</b></td><td>{Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.length > 0 ? selectedChallan.offence_details[0].act : ''}</td></tr>
              <tr><td><b>Offence Details</b></td><td><ul style={{margin:0,paddingLeft:18}}>{Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.map((o, j) => (<li key={j} className="cell-ellipsis" title={o.name}>{o.name}</li>))}</ul></td></tr>
            </tbody>
          </table>
        </RightSidebar>
      )}

      {selectedRtoData && (
        <RightSidebar
          open
          onClose={() => {
            setTimeout(() => setSelectedRtoData(null), 300);
          }}
          title={`RTO Data: ${selectedRtoData.rc_regn_no}`}
        >
          <table className="latest-table" style={{ width: '100%', fontSize: 15 }}>
            <tbody>
              <tr><td><b>Vehicle Number</b></td><td>{selectedRtoData.rc_regn_no || selectedRtoData.vehicle_number || '-'}</td></tr>
              <tr><td><b>Owner Name</b></td><td>{selectedRtoData.rc_owner_name || selectedRtoData.owner_name || '-'}</td></tr>
              <tr><td><b>Registration Date</b></td><td>{selectedRtoData.rc_regn_dt || '-'}</td></tr>
              <tr><td><b>Insurance Expiry</b></td><td>{selectedRtoData.insurance_exp || selectedRtoData.rc_insurance_upto || '-'}</td></tr>
              <tr><td><b>Road Tax Expiry</b></td><td>{selectedRtoData.road_tax_exp || selectedRtoData.rc_tax_upto || '-'}</td></tr>
              <tr><td><b>Fitness Expiry</b></td><td>{selectedRtoData.fitness_exp || selectedRtoData.rc_fit_upto || '-'}</td></tr>
              <tr><td><b>Pollution Expiry</b></td><td>{selectedRtoData.pollution_exp || selectedRtoData.rc_pucc_upto || '-'}</td></tr>
              <tr><td><b>Chassis No</b></td><td>{selectedRtoData.rc_chasi_no || '-'}</td></tr>
              <tr><td><b>Engine No</b></td><td>{selectedRtoData.rc_engine_no || '-'}</td></tr>
              <tr><td><b>Vehicle Class</b></td><td>{selectedRtoData.rc_vh_class_desc || '-'}</td></tr>
              <tr><td><b>Fuel Type</b></td><td>{selectedRtoData.rc_fuel_desc || '-'}</td></tr>
              <tr><td><b>Maker</b></td><td>{selectedRtoData.rc_maker_desc || '-'}</td></tr>
              <tr><td><b>Model</b></td><td>{selectedRtoData.rc_maker_model || '-'}</td></tr>
              <tr><td><b>RTO</b></td><td>{selectedRtoData.rc_off_cd || '-'}</td></tr>
              <tr><td><b>State</b></td><td>{selectedRtoData.rc_state_cd || '-'}</td></tr>
              <tr><td><b>Mobile No</b></td><td>{selectedRtoData.rc_mobile_no || '-'}</td></tr>
              <tr><td><b>Address</b></td><td>{selectedRtoData.rc_present_address || '-'}</td></tr>
            </tbody>
          </table>
        </RightSidebar>
      )}
    </div>
    </>
  );
}

export default ClientDashboard;