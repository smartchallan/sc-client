import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

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
};

export default function ClientSettings() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showPermissions, setShowPermissions] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    // Get user_id from localStorage
    const getUserId = () => {
      try {
        const scUser = JSON.parse(localStorage.getItem('sc_user')) || {};
        return scUser.user?.id || scUser.user?.client_id || scUser.user?._id || null;
      } catch {
        return null;
      }
    };
    const fetchClients = async () => {
      const userId = getUserId();
      if (!userId) {
        setClients([]);
        return;
      }
      
      // Check if data already exists in localStorage (from login)
      try {
        const cachedData = localStorage.getItem('client_network');
        if (cachedData) {
          const data = JSON.parse(cachedData);
          const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          // Recursively flatten all nested children (from MyClients)
          const flattenChildren = (node, dealerName = null) => {
            const result = [];
            result.push({ ...node, dealerName, isParent: !dealerName });
            if (Array.isArray(node.children) && node.children.length > 0) {
              node.children.forEach(child => {
                result.push(...flattenChildren(child, node.name));
              });
            }
            return result;
          };
          const flatClients = [];
          rawData.forEach(parent => {
            flatClients.push(...flattenChildren(parent));
          });
          setClients(flatClients);
          if (flatClients.length > 0) setSelectedClient(flatClients[0].id || flatClients[0]._id || flatClients[0]);
          return;
        }
      } catch (e) {
        // If cached data is invalid, continue to fetch from API
      }
      
      try {
        const res = await fetch(`${API_ROOT}/getclientnetwork?parent_id=${userId}`);
        const data = await res.json().catch(() => []);
        const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        
        // Store in localStorage for future use
        localStorage.setItem('client_network', JSON.stringify(data));
        
        // Recursively flatten all nested children (from MyClients)
        const flattenChildren = (node, dealerName = null) => {
          const result = [];
          result.push({ ...node, dealerName, isParent: !dealerName });
          if (Array.isArray(node.children) && node.children.length > 0) {
            node.children.forEach(child => {
              result.push(...flattenChildren(child, node.name));
            });
          }
          return result;
        };
        const flatClients = [];
        rawData.forEach(parent => {
          flatClients.push(...flattenChildren(parent));
        });
        setClients(flatClients);
        if (flatClients.length > 0) setSelectedClient(flatClients[0].id || flatClients[0]._id || flatClients[0]);
      } catch (e) {
        setClients([]);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      setShowPermissions(false);
      setSettings(DEFAULT_SETTINGS);
      return;
    }
    setShowPermissions(false);
    // Fetch permissions for selected client
    (async () => {
      try {
        const res = await fetch(`${API_ROOT}/useroptions?user_id=${encodeURIComponent(selectedClient)}`);
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
  }, [selectedClient]);


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
  });

  // Call /useroptions POST on checkbox change
  const handleCheckboxChange = (key) => (e) => {
    const updated = { ...settings, [key]: e.target.checked };
    setSettings(updated);
    if (!selectedClient) return;
    const payload = {
      user_id: selectedClient,
      user_role: 'client',
      settings: mapSettingsToApi(updated)
    };
    fetch(`${API_ROOT}/useroptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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

  return (
    <div style={{ padding: 18 }}>
      {/* <h1 className="page-title">Client Settings</h1> */}
      <p className="page-subtitle">Configure client-specific permissions and defaults for downstream services.</p>
      <div style={{ width: '100%' }}>
        <div className="form-group" style={{ width: '50%' }}>
          <label className="form-label">Select Client</label>
          <select className="form-control" style={{ width: '100%' }} value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
            <option value="">Select client</option>
            {clients.map(c => (
              <option key={c.id || c._id || c.email}
                value={c.id || c._id || c}
              >
                {c.name || c.email || c}
                {c.dealerName ? ` (${c.dealerName})` : ''}
              </option>
            ))}
          </select>
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

        {/* Save button removed: saving is now automatic on checkbox change */}
      </div>
    </div>
  );
}
