import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ClientTreeDropdown from '../components/ClientTreeDropdown';

const DEFAULT_SETTINGS = {
  addVehicle: false,
  fetchRto: false,
  addClients: false,
  fetchChallans: false,
  disableClients: false,
  deleteVehicles: false,
  downloadExcel: false,
  downloadPdf: false,
  printReports: false,
  sendEmailNotification: false,
  sendSmsNotification: false,
  sendMarketingCommunication: false,
  vehicleReportEnabled: false,
  vehicleReportLimit: 0,
};

export default function ClientSettings() {
  const [networkTree, setNetworkTree] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null); // full client object
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showPermissions, setShowPermissions] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';
  const selectedClientId = selectedClient?.id || null;

  useEffect(() => {
    const getUserId = () => {
      try {
        const scUser = JSON.parse(localStorage.getItem('sc_user')) || {};
        return scUser.user?.id || scUser.user?.client_id || scUser.user?._id || null;
      } catch { return null; }
    };
    const userId = getUserId();
    if (!userId) return;
    try {
      const cached = localStorage.getItem('client_network');
      if (cached) {
        const data = JSON.parse(cached);
        setNetworkTree(Array.isArray(data) ? data : (data.clients || data.users || []));
        return;
      }
    } catch {}
    fetch(`${API_ROOT}/getclientnetwork?parent_id=${userId}`)
      .then(r => r.json())
      .then(data => setNetworkTree(Array.isArray(data) ? data : (data.clients || data.users || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setShowPermissions(false);
      setSettings(DEFAULT_SETTINGS);
      return;
    }
    setShowPermissions(false);
    // Fetch permissions for selected client
    (async () => {
      try {
        const res = await fetch(`${API_ROOT}/useroptions?user_id=${encodeURIComponent(selectedClientId)}`);
        const d = await res.json().catch(() => null);
        let opts = d && d.options ? d.options : d;
        if (res.ok && opts && typeof opts === 'object') {
          setSettings({
            addVehicle: opts.add_vehicle === '1' || opts.add_vehicle === 1,
            fetchRto: opts.fetch_rto_data === '1' || opts.fetch_rto_data === 1,
            addClients: opts.add_clients === '1' || opts.add_clients === 1,
            fetchChallans: opts.fetch_challans === '1' || opts.fetch_challans === 1,
            disableClients: opts.disable_clients === '1' || opts.disable_clients === 1,
            deleteVehicles: opts.delete_vehicles === '1' || opts.delete_vehicles === 1,
            downloadExcel: opts.download_excel === '1' || opts.download_excel === 1,
            downloadPdf: opts.download_pdf === '1' || opts.download_pdf === 1,
            printReports: opts.print_reports === '1' || opts.print_reports === 1,
            sendEmailNotification: opts.send_email_notification === '1' || opts.send_email_notification === 1,
            sendSmsNotification: opts.send_sms_notification === '1' || opts.send_sms_notification === 1,
            sendMarketingCommunication: opts.send_marketing_communication === '1' || opts.send_marketing_communication === 1,
            vehicleReportEnabled: opts.vehicle_report_enabled === '1' || opts.vehicle_report_enabled === 1,
            vehicleReportLimit: parseInt(opts.vehicle_report_limit || '0', 10) || 0,
          });
          setShowPermissions(true);
        } else {
          setSettings(DEFAULT_SETTINGS);
          setShowPermissions(true);
        }
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
        setShowPermissions(true);
      }
    })();
  }, [selectedClientId]);


  // Map UI settings to API keys
  const mapSettingsToApi = (s) => ({
    add_vehicle: s.addVehicle ? 1 : 0,
    add_clients: s.addClients ? 1 : 0,
    fetch_challans: s.fetchChallans ? 1 : 0,
    fetch_rto_data: s.fetchRto ? 1 : 0,
    disable_clients: s.disableClients ? 1 : 0,
    delete_vehicles: s.deleteVehicles ? 1 : 0,
    download_excel: s.downloadExcel ? 1 : 0,
    download_pdf: s.downloadPdf ? 1 : 0,
    print_reports: s.printReports ? 1 : 0,
    send_email_notification: s.sendEmailNotification ? 1 : 0,
    send_sms_notification: s.sendSmsNotification ? 1 : 0,
    send_marketing_communication: s.sendMarketingCommunication ? 1 : 0,
    vehicle_report_enabled: s.vehicleReportEnabled ? 1 : 0,
    vehicle_report_limit: s.vehicleReportLimit || 0,
  });

  const saveSettings = (updated) => {
    if (!selectedClientId) return;
    const payload = {
      user_id: selectedClientId,
      user_role: 'client',
      settings: mapSettingsToApi(updated),
    };
    fetch(`${API_ROOT}/useroptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async res => {
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          toast.success(d.message || 'Settings updated');
        } else {
          toast.error(d.message || 'Failed to update settings');
        }
      })
      .catch(() => toast.error('Failed to update settings'));
  };

  const handleCheckboxChange = (key) => (e) => {
    const updated = { ...settings, [key]: e.target.checked };
    setSettings(updated);
    saveSettings(updated);
  };

  return (
    <div style={{ padding: 18 }}>
      {/* <h1 className="page-title">Client Settings</h1> */}
      <p className="page-subtitle">Configure client-specific permissions and defaults for downstream services.</p>
      <div style={{ width: '100%' }}>
        <div style={{ maxWidth: 480, marginBottom: 4 }}>
          <ClientTreeDropdown
            networkTree={networkTree}
            selectedClient={selectedClient}
            onSelect={setSelectedClient}
            label="Select Client"
            placeholder="Select a client…"
            maxHeight={320}
          />
        </div>

        {showPermissions && (
          <div style={{ marginTop: 12, width: '100%' }}>
            <label style={{ fontWeight: 700 }}>Permissions</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 8, width: '100%' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.addVehicle} onChange={handleCheckboxChange('addVehicle')} />
                <span>Add Vehicle</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.addClients} onChange={handleCheckboxChange('addClients')} />
                <span>Add Clients</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.fetchChallans} onChange={handleCheckboxChange('fetchChallans')} />
                <span>Fetch Challans</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.fetchRto} onChange={handleCheckboxChange('fetchRto')} />
                <span>Fetch RTO Data</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.disableClients} onChange={handleCheckboxChange('disableClients')} />
                <span>Disable Clients</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.deleteVehicles} onChange={handleCheckboxChange('deleteVehicles')} />
                <span>Delete Vehicles</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.downloadExcel} onChange={handleCheckboxChange('downloadExcel')} />
                <span>Download Excel</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.downloadPdf} onChange={handleCheckboxChange('downloadPdf')} />
                <span>Download PDF</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.printReports} onChange={handleCheckboxChange('printReports')} />
                <span>Print Reports</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.sendEmailNotification} onChange={handleCheckboxChange('sendEmailNotification')} />
                <span>Send Email notification</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.sendSmsNotification} onChange={handleCheckboxChange('sendSmsNotification')} />
                <span>Send SMS notification</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!settings.sendMarketingCommunication} onChange={handleCheckboxChange('sendMarketingCommunication')} />
                <span>Send Marketing Communication</span>
              </label>
            </div>
          </div>
        )}

        {/* Vehicle Report Feature */}
        {showPermissions && (
          <div style={{ marginTop: 24, width: '100%', padding: '18px 20px', background: '#f0f7ff', border: '1.5px solid #bfdbfe', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <i className="ri-file-search-line" style={{ fontSize: 20, color: '#2563eb' }}></i>
              <label style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 15 }}>Vehicle Report Feature</label>
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
              Allow this client to generate detailed vehicle history reports (RTO + Challan data). Set a limit of 0 for unlimited reports.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!settings.vehicleReportEnabled}
                  onChange={handleCheckboxChange('vehicleReportEnabled')}
                />
                <span style={{ fontWeight: 600 }}>Enable Vehicle Report</span>
              </label>
              {settings.vehicleReportEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 13, color: '#334155', whiteSpace: 'nowrap' }}>Max reports (0 = unlimited):</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.vehicleReportLimit}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value || '0', 10));
                      setSettings(prev => ({ ...prev, vehicleReportLimit: val }));
                    }}
                    onBlur={(e) => {
                      const val = Math.max(0, parseInt(e.target.value || '0', 10));
                      const updated = { ...settings, vehicleReportLimit: val };
                      setSettings(updated);
                      saveSettings(updated);
                    }}
                    style={{ width: 80, padding: '5px 10px', border: '1.5px solid #93c5fd', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save button removed: saving is now automatic on checkbox change */}
      </div>
    </div>
  );
}
