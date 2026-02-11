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
  const [selectedClient, setSelectedClient] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${API_ROOT}/clients`);
        const d = await res.json().catch(() => []);
        const list = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []);
        setClients(list);
        if (list.length > 0) setSelectedClient(list[0].id || list[0]._id || list[0]);
      } catch (e) {
        setClients([]);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    // Ideally fetch settings for client; for now try GET /clientsettings/:id
    (async () => {
      try {
        const res = await fetch(`${API_ROOT}/clientsettings/${encodeURIComponent(selectedClient)}`);
        const d = await res.json().catch(() => null);
        if (res.ok && d) {
          setSettings({
            addVehicle: !!d.addVehicle,
            fetchRto: !!d.fetchRto,
            addClients: !!d.addClients,
            fetchChallans: !!d.fetchChallans,
            disableClients: !!d.disableClients,
            deleteVehicles: !!d.deleteVehicles,
            downloadExcel: !!d.downloadExcel,
            downloadPdf: !!d.downloadPdf,
            printReports: !!d.printReports,
            sendEmailNotification: !!d.sendEmailNotification,
            sendSmsNotification: !!d.sendSmsNotification,
            sendMarketingCommunication: !!d.sendMarketingCommunication,
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    })();
  }, [selectedClient]);

  const handleSave = async () => {
    if (!selectedClient) return toast.error('Select a client');
    setLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/clientsettings/${encodeURIComponent(selectedClient)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) toast.success(d.message || 'Settings saved');
      else toast.error(d.message || 'Failed to save settings');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 18 }}>
      <h1 className="page-title">Client Settings</h1>
      <p className="page-subtitle">Configure client-specific permissions and defaults for downstream services.</p>
      <div style={{ width: '100%' }}>
        <div className="form-group" style={{ width: '50%' }}>
          <label className="form-label">Select Client</label>
          <select className="form-control" style={{ width: '100%' }} value={selectedClient || ''} onChange={e => setSelectedClient(e.target.value)}>
            <option value="">-- Select client --</option>
            {clients.map(c => <option key={c.id || c._id || c.email} value={c.id || c._id || c}>{c.name || c.email || c}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 12, width: '100%' }}>
          <label style={{ fontWeight: 700 }}>Permissions</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 8, width: '100%' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.addVehicle} onChange={e => setSettings(s => ({ ...s, addVehicle: e.target.checked }))} />
              <span>Add Vehicle</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.addClients} onChange={e => setSettings(s => ({ ...s, addClients: e.target.checked }))} />
              <span>Add Clients</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.fetchChallans} onChange={e => setSettings(s => ({ ...s, fetchChallans: e.target.checked }))} />
              <span>Fetch Challans</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.fetchRto} onChange={e => setSettings(s => ({ ...s, fetchRto: e.target.checked }))} />
              <span>Fetch RTO Data</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.disableClients} onChange={e => setSettings(s => ({ ...s, disableClients: e.target.checked }))} />
              <span>Disable Clients</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.deleteVehicles} onChange={e => setSettings(s => ({ ...s, deleteVehicles: e.target.checked }))} />
              <span>Delete Vehicles</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.downloadExcel} onChange={e => setSettings(s => ({ ...s, downloadExcel: e.target.checked }))} />
              <span>Download Excel</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.downloadPdf} onChange={e => setSettings(s => ({ ...s, downloadPdf: e.target.checked }))} />
              <span>Download PDF</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.printReports} onChange={e => setSettings(s => ({ ...s, printReports: e.target.checked }))} />
              <span>Print Reports</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.sendEmailNotification} onChange={e => setSettings(s => ({ ...s, sendEmailNotification: e.target.checked }))} />
              <span>Send Email notification</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.sendSmsNotification} onChange={e => setSettings(s => ({ ...s, sendSmsNotification: e.target.checked }))} />
              <span>Send SMS notification</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.sendMarketingCommunication} onChange={e => setSettings(s => ({ ...s, sendMarketingCommunication: e.target.checked }))} />
              <span>Send Marketing Communication</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </div>
    </div>
  );
}
