import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import RightSidebar from './RightSidebar';

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

const SETTING_CATEGORIES = {
  'Fleet Management': [
    { key: 'addVehicle', label: 'Add Vehicle', icon: 'ri-car-line' },
    { key: 'deleteVehicles', label: 'Delete Vehicles', icon: 'ri-delete-bin-line' },
    { key: 'fetchRto', label: 'Fetch RTO Data', icon: 'ri-database-2-line' },
  ],
  'Challan Management': [
    { key: 'fetchChallans', label: 'Fetch Challans', icon: 'ri-file-list-3-line' },
  ],
  'Client Management': [
    { key: 'addClients', label: 'Add Clients', icon: 'ri-user-add-line' },
    { key: 'disableClients', label: 'Disable Clients', icon: 'ri-user-forbid-line' },
  ],
  'Reports & Export': [
    { key: 'downloadExcel', label: 'Download Excel', icon: 'ri-file-excel-2-line' },
    { key: 'downloadPdf', label: 'Download PDF', icon: 'ri-file-pdf-line' },
    { key: 'printReports', label: 'Print Reports', icon: 'ri-printer-line' },
  ],
  'Notifications': [
    { key: 'sendEmailNotification', label: 'Send Email Notifications', icon: 'ri-mail-line' },
    { key: 'sendSmsNotification', label: 'Send SMS Notifications', icon: 'ri-message-2-line' },
    { key: 'sendMarketingCommunication', label: 'Send Marketing Communication', icon: 'ri-advertisement-line' },
  ],
};

export default function ClientSettingsSidebar({ open, onClose, client }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    if (!client || !open) {
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    // Fetch permissions for selected client
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const clientId = client.id || client._id;
        const res = await fetch(`${API_ROOT}/useroptions?user_id=${encodeURIComponent(clientId)}`);
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
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [client, open, API_ROOT]);

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

  // Call /useroptions POST on toggle change
  const handleToggle = async (key) => {
    if (!client) return;

    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);

    const clientId = client.id || client._id;
    const payload = {
      user_id: clientId,
      user_role: 'client',
      settings: mapSettingsToApi(updated)
    };

    try {
      const res = await fetch(`${API_ROOT}/useroptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await res.json().catch(() => ({}));
      
      if (res.ok) {
        toast.success(d.message || 'Settings updated successfully');
      } else {
        // Revert on failure
        setSettings(settings);
        toast.error(d.message || 'Failed to update settings');
      }
    } catch (err) {
      // Revert on failure
      setSettings(settings);
      toast.error('Failed to update settings');
    }
  };

  if (!open || !client) return null;

  return (
    <RightSidebar
      open={open}
      onClose={onClose}
      title={`Settings: ${client.name || 'Client'}`}
    >
      <div style={{ padding: 20 }}>
        {/* Client Info Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          color: '#fff',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {client.name || 'Client'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {client.email || '-'}
          </div>
          {client.dealerName && (
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              Dealer: {client.dealerName}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40,
            color: '#666' 
          }}>
            <i className="ri-loader-4-line" style={{ fontSize: 32, display: 'block', marginBottom: 12 }}></i>
            Loading settings...
          </div>
        ) : (
          <div>
            <div style={{ 
              fontSize: 13, 
              color: '#666', 
              marginBottom: 20,
              padding: 12,
              background: '#f5f8fa',
              borderRadius: 8,
              border: '1px solid #e3eaf1'
            }}>
              <i className="ri-information-line" style={{ marginRight: 6 }}></i>
              Configure permissions and features for this client. Changes are saved automatically.
            </div>

            {Object.entries(SETTING_CATEGORIES).map(([category, settingsList]) => (
              <div key={category} style={{ marginBottom: 28 }}>
                <h3 style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#1565c0',
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '2px solid #e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {settingsList.map(({ key, label, icon }) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: settings[key] ? '#e8f5e9' : '#fff',
                        border: `1.5px solid ${settings[key] ? '#66bb6a' : '#e0e0e0'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: settings[key] ? '0 2px 8px rgba(102, 187, 106, 0.2)' : 'none'
                      }}
                      onClick={() => handleToggle(key)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i 
                          className={icon} 
                          style={{ 
                            fontSize: 18, 
                            color: settings[key] ? '#2e7d32' : '#666'
                          }}
                        ></i>
                        <span style={{
                          fontSize: 14,
                          fontWeight: settings[key] ? 600 : 500,
                          color: settings[key] ? '#2e7d32' : '#333'
                        }}>
                          {label}
                        </span>
                      </div>
                      <div
                        style={{
                          position: 'relative',
                          width: 44,
                          height: 24,
                          background: settings[key] ? '#4caf50' : '#ccc',
                          borderRadius: 12,
                          transition: 'background 0.3s',
                          cursor: 'pointer'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: settings[key] ? 22 : 2,
                            width: 20,
                            height: 20,
                            background: '#fff',
                            borderRadius: '50%',
                            transition: 'left 0.3s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RightSidebar>
  );
}
