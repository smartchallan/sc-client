import { jsPDF } from 'jspdf';
import scLogo from '../assets/sc-logo.png';
import { resolvePerHostEnv, getWhitelabelHosts } from './whitelabel';

const WHITELABEL_HOSTS = getWhitelabelHosts();
const CURRENT_HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
const DEFAULT_HOST = 'app.smartchallan.com';
const IS_DEFAULT_DOMAIN = CURRENT_HOSTNAME === DEFAULT_HOST;
const IS_WHITELABEL = WHITELABEL_HOSTS.includes(CURRENT_HOSTNAME) && !IS_DEFAULT_DOMAIN;
const BRAND_LOGO = (IS_WHITELABEL && resolvePerHostEnv(CURRENT_HOSTNAME, 'LOGO_URL')) || import.meta.env.VITE_CUSTOM_LOGO_URL || scLogo;

function prettifyKey(key) {
  const map = {
    rc_regn_no: 'Registration No',
    rc_owner_name: 'Owner Name',
    rc_regn_dt: 'Registration Date',
    rc_insurance_upto: 'Insurance Expiry',
    rc_tax_upto: 'Road Tax Expiry',
    rc_fit_upto: 'Fitness Expiry',
    rc_pucc_upto: 'Pollution Expiry',
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
  };
  if (map[key]) return map[key];
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
}

export function exportToPdf(section, data, filename) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 22;

    doc.setFillColor(245, 248, 250);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    try {
      const img = new Image();
      img.src = BRAND_LOGO;
      doc.addImage(img, 'PNG', 8, 4, 30, 14);
    } catch (_) {}

    doc.setFontSize(12);
    doc.setTextColor(21, 101, 192);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Challan', 42, 10);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const subtitle = section === 'rto' ? 'RTO Details' : section === 'pending' ? 'Vehicle Challans' : '';
    doc.text(subtitle, 42, 15);

    let y = headerHeight + 6;

    if (section === 'rto') {
      const accent = [44, 62, 80];
      const labelColor = [60, 60, 60];
      const valueColor = [30, 30, 30];
      const borderColor = [220, 220, 220];
      doc.setFillColor(...accent);
      doc.roundedRect(8, y - 8, 194, 14, 3, 3, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255,255,255);
      doc.setFont('times', 'bold');
      doc.text('Vehicle Details', 14, y + 1);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const entries = Object.entries(data || {});
      const cardX = 18, cardW = 175, cardPad = 3, rowHeight = 16;
      for (let i = 0; i < entries.length; i++) {
        const [k, v] = entries[i];
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFillColor(245, 248, 250);
        doc.roundedRect(cardX, y-6, cardW, rowHeight, 3, 3, 'F');
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, y-6, cardW, rowHeight, 3, 3);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...labelColor);
        doc.text(`${prettifyKey(k)}`, cardX + cardPad, y);
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
      doc.setFontSize(14);
      doc.setTextColor(...mainColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${section === 'pending' ? 'Pending' : 'Disposed'} Challans`, 10, y);
      y += 8;
      (data || []).forEach((challan, idx) => {
        if (idx > 0) { doc.addPage(); y = 15; }
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
          let value = Array.isArray(v) ? v.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join(', ') : (typeof v === 'object' ? JSON.stringify(v) : v);
          const splitValue = doc.splitTextToSize(value, 120);
          doc.text(splitValue, 70, y);
          y += Math.max(7, splitValue.length * 6);
        });
        y += 4;
      });
    }

    const outName = filename || `${section || 'export'}-details.pdf`;
    doc.save(outName);
    return true;
  } catch (e) {
    console.error('exportToPdf error', e);
    return false;
  }
}

export default exportToPdf;
