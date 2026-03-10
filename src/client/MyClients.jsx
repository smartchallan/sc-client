import React, { useEffect, useState, useMemo } from 'react';
// (removed duplicate imports)
import { toast } from 'react-toastify';
import CustomModal from './CustomModal';
import RightSidebar from './RightSidebar';
import ClientSettingsSidebar from './ClientSettingsSidebar';

export default function MyClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [dealerFilter, setDealerFilter] = useState('all');
  const [changePasswordConfirmModal, setChangePasswordConfirmModal] = useState({ open: false, client: null });
  const [changePasswordModal, setChangePasswordModal] = useState({ open: false, client: null });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, client: null, action: '' });
  const [selectedClient, setSelectedClient] = useState(null);
  const [settingsClient, setSettingsClient] = useState(null);
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

  // Strict: Clear search box when change password modal is opened (prevents autofill or indirect state sync)
  useEffect(() => {
    if (changePasswordModal.open) {
      setSearch('');
    }
  }, [changePasswordModal.open]);

  // Get user_id from localStorage
  const getUserId = () => {
    try {
      const scUser = JSON.parse(localStorage.getItem('sc_user')) || {};
      return scUser.user?.id || scUser.user?.client_id || scUser.user?._id || null;
    } catch {
      return null;
    }
  };

  const fetchClients = async (forceRefresh = false) => {
    setLoading(true);
    const userId = getUserId();
    if (!userId) {
      toast.error('User ID not found');
      setLoading(false);
      return;
    }
    
    // Check if data already exists in localStorage (from login) unless forcing refresh
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem('client_network');
        if (cachedData) {
          const data = JSON.parse(cachedData);
          const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          
          // Recursively flatten all nested children
          const flattenChildren = (node, dealerName = null) => {
            const result = [];
            // Add current node
            result.push({ ...node, dealerName, isParent: !dealerName });
            // Recursively add all children at any depth
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
          setLoading(false);
          return;
        }
      } catch (e) {
        // If cached data is invalid, continue to fetch from API
      }
    }
    
    try {
      const res = await fetch(`${API_ROOT}/getclientnetwork?parent_id=${userId}`);
      const data = await res.json().catch(() => []);
      const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      
      // Store in localStorage for future use
      localStorage.setItem('client_network', JSON.stringify(data));
      
      // Recursively flatten all nested children
      const flattenChildren = (node, dealerName = null) => {
        const result = [];
        // Add current node
        result.push({ ...node, dealerName, isParent: !dealerName });
        // Recursively add all children at any depth
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
      
      if (res.ok) setClients(flatClients);
      else setClients([]);
    } catch (e) {
      setClients([]);
      toast.error('Failed to load client network');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  // Get unique states and cities for filters
  const uniqueStates = useMemo(() => {
    const states = new Set();
    clients.forEach(c => {
      const state = (c.user_meta || c.userMeta)?.state;
      if (state) states.add(state);
    });
    return Array.from(states).sort();
  }, [clients]);

  const uniqueCities = useMemo(() => {
    const cities = new Set();
    clients.forEach(c => {
      const city = (c.user_meta || c.userMeta)?.city;
      if (city) cities.add(city);
    });
    return Array.from(cities).sort();
  }, [clients]);

  const uniqueDealers = useMemo(() => {
    const dealers = new Set();
    clients.forEach(c => {
      if (c.dealerName) dealers.add(c.dealerName);
    });
    return Array.from(dealers).sort();
  }, [clients]);
  const filtered = clients.filter(c => {
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      const matches = (c.name || '').toLowerCase().includes(s) || 
             (c.email || '').toLowerCase().includes(s) || 
             ((c.user_meta || c.userMeta)?.company || '').toLowerCase().includes(s) ||
             ((c.user_meta || c.userMeta)?.phone || '').toLowerCase().includes(s) ||
             (c.dealerName || '').toLowerCase().includes(s);
      if (!matches) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = c.status === 'active' || !c.status;
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'inactive' && isActive) return false;
    }
    
    // State filter
    if (stateFilter !== 'all') {
      const state = (c.user_meta || c.userMeta)?.state;
      if (state !== stateFilter) return false;
    }
    
    // City filter
    if (cityFilter !== 'all') {
      const city = (c.user_meta || c.userMeta)?.city;
      if (city !== cityFilter) return false;
    }
    
    // Dealer filter
    if (dealerFilter !== 'all') {
      if (c.dealerName !== dealerFilter) return false;
    }
    
    return true;
  });

  const formatAddress = (client) => {
    const meta = client.user_meta || client.userMeta || {};
    const parts = [
      meta.address,
      meta.city,
      meta.state,
      meta.zip
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      }).replace(/ /g, '-');
    } catch {
      return dateStr;
    }
  };

  const handleChangePasswordClick = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    // Close password modal and open confirmation modal
    const client = changePasswordModal.client;
    setChangePasswordModal({ open: false, client: null });
    setChangePasswordConfirmModal({ open: true, client });
  };

  const handleChangePassword = async () => {
    try {
      const userId = changePasswordConfirmModal.client.id || changePasswordConfirmModal.client._id;
      const res = await fetch(`${API_ROOT}/userprofile/updatepassword/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: newPassword,
          currentPasswordReq: false
        })
      });
      if (res.ok) {
        toast.success('Password changed successfully');
        setChangePasswordConfirmModal({ open: false, client: null });
        setNewPassword('');
        setShowPassword(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to change password');
      }
    } catch (e) {
      toast.error('Failed to change password');
    }
  };

  const handleToggleStatus = async () => {
    const { client, action } = statusModal;
    try {
      const res = await fetch(`${API_ROOT}/userprofile/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: client.id || client._id,
          status: action === 'enable' ? 'active' : 'inactive'
        })
      });
      if (res.ok) {
        toast.success(`Client ${action}d successfully`);
        setStatusModal({ open: false, client: null, action: '' });
        fetchClients(true);
      } else {
        toast.error(`Failed to ${action} client`);
      }
    } catch (e) {
      toast.error(`Failed to ${action} client`);
    }
  };

  return (
    <>
      {/* Dashboard-style gradient banner header */}
      <div className="profile-banner">
        <div className="profile-banner-bg-circle profile-banner-bg-circle-1" />
        <div className="profile-banner-bg-circle profile-banner-bg-circle-2" />
        <div className="profile-banner-inner">
          <div className="profile-banner-left">
            <div className="profile-picture" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <i className="ri-team-line" style={{ fontSize: 24 }}></i>
            </div>
            <div className="profile-banner-info">
              <div className="profile-banner-name">My Clients Network</div>
              <div className="profile-banner-email">Manage your complete client network — view, search and filter all clients</div>
              <div className="profile-banner-legends">
                <span><i className="ri-group-line"></i> {clients.length} Total Clients</span>
                <span><i className="ri-checkbox-circle-line"></i> {clients.filter(c => c.status === 'active' || !c.status).length} Active</span>
                <span><i className="ri-close-circle-line"></i> {clients.filter(c => c.status === 'inactive').length} Inactive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar — search, filters, actions (matching My Fleet style) */}
      <div className="vst-toolbar">
        <div className="vst-toolbar__left">
          <div style={{ position: 'relative', width: 220, flexShrink: 0 }}>
            <i className="ri-search-line" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15, pointerEvents: 'none' }}></i>
            <input
              className="vst-filter-trigger"
              style={{ width: '100%', paddingLeft: 32, paddingRight: search ? 28 : 14, border: '1.5px solid #e0e7ff', background: '#fff' }}
              placeholder="Search clients..."
              value={search}
              onChange={e => {
                if (e.nativeEvent && e.nativeEvent.inputType !== 'insertText') {
                  console.log('Search input changed programmatically:', e.target.value, e.nativeEvent);
                }
                setSearch(e.target.value);
              }}
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0, lineHeight: 1 }}
                title="Clear search"
              >
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>

          <select className="vst-filter-trigger" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 120, flexShrink: 0 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select className="vst-filter-trigger" value={stateFilter} onChange={e => { setStateFilter(e.target.value); setCityFilter('all'); }} style={{ width: 140, flexShrink: 0 }}>
            <option value="all">All States</option>
            {uniqueStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select className="vst-filter-trigger" value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ width: 140, flexShrink: 0 }}>
            <option value="all">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select className="vst-filter-trigger" value={dealerFilter} onChange={e => setDealerFilter(e.target.value)} style={{ width: 150, flexShrink: 0 }}>
            <option value="all">All Dealers</option>
            {uniqueDealers.map(dealer => (
              <option key={dealer} value={dealer}>{dealer}</option>
            ))}
          </select>

          {(search || statusFilter !== 'all' || stateFilter !== 'all' || cityFilter !== 'all' || dealerFilter !== 'all') && (
            <button
              className="vst-filter-trigger"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setStateFilter('all');
                setCityFilter('all');
                setDealerFilter('all');
              }}
              style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
            >
              <i className="ri-filter-off-line"></i> Reset
            </button>
          )}
        </div>
        <div className="vst-toolbar__right">
          <span className="vst-record-badge">Showing {filtered.length} of {clients.length}</span>
          <button
            className="vst-action-btn vst-action-btn--download"
            onClick={() => fetchClients(true)}
            disabled={loading}
            title="Refresh"
          >
            <i className={loading ? 'ri-loader-4-line' : 'ri-refresh-line'} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Table — using vst-table classes matching My Fleet */}
      <div className="vst-table-wrap">
        <table className="vst-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th className="vst-th--num">#</th>
              <th>Name</th>
              <th>Dealer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Registered On</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px' }}>
                  {loading ? (
                    <span><i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite', marginRight: 8 }}></i> Loading clients...</span>
                  ) : (
                    <span><i className="ri-inbox-line" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i> No clients found.</span>
                  )}
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id || c._id || i} className="vst-row">
                <td className="vst-td--num">{i + 1}</td>
                <td style={{ fontWeight: 600, color: '#1e293b', maxWidth: 350, whiteSpace: 'normal', wordBreak: 'break-word' }}>{c.name || '-'}</td>
                <td>{c.dealerName || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{(c.user_meta || c.userMeta)?.phone || (c.user_meta || c.userMeta)?.mobile || '-'}</td>
                <td style={{ maxWidth: 150, whiteSpace: 'normal' }}>{formatAddress(c)}</td>
                <td>{formatDate(c.created_at || c.createdAt || c.registered_at)}</td>
                <td>
                  <span className={`client-status-pill ${(c.status === 'active' || !c.status) ? 'active' : 'inactive'}`}>
                    {c.status === 'active' || !c.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(c.last_login_at || c.last_login || c.lastLogin)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                    <button
                      className="client-action-btn view"
                      onClick={() => setSelectedClient(c)}
                      title="View Details"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    <button
                      className="client-action-btn settings"
                      onClick={() => setSettingsClient(c)}
                      title="Client Settings"
                    >
                      <i className="ri-settings-3-line"></i>
                    </button>
                    <button
                      className={`client-action-btn ${(c.status === 'active' || !c.status) ? 'toggle-disable' : 'toggle-enable'}`}
                      onClick={() => setStatusModal({
                        open: true,
                        client: c,
                        action: (c.status === 'active' || !c.status) ? 'disable' : 'enable'
                      })}
                      title={(c.status === 'active' || !c.status) ? 'Disable Client' : 'Enable Client'}
                    >
                      <i className={(c.status === 'active' || !c.status) ? 'ri-close-circle-line' : 'ri-checkbox-circle-line'}></i>
                    </button>
                    <button
                      className="client-action-btn password"
                      onClick={() => setChangePasswordModal({ open: true, client: c })}
                      title="Change Password"
                    >
                      <i className="ri-lock-password-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Change Password Confirmation Modal */}
      <CustomModal
        open={changePasswordConfirmModal.open}
        title="Confirm Change Password"
        description={`Are you sure you want to change the password for ${changePasswordConfirmModal.client?.name || 'this client'}?`}
        confirmText="Yes, Change Password"
        cancelText="Cancel"
        onConfirm={handleChangePassword}
        onCancel={() => {
          setChangePasswordConfirmModal({ open: false, client: null });
          setNewPassword('');
          setShowPassword(false);
        }}
      />

      {/* Change Password Modal */}
      <CustomModal
        open={changePasswordModal.open}
        title="Change Password"
        description={`Change password for ${changePasswordModal.client?.name || 'client'}`}
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={handleChangePasswordClick}
        onCancel={() => {
          setChangePasswordModal({ open: false, client: null });
          setNewPassword('');
          setShowPassword(false);
          // Defensive: ensure closing modal does not affect search state
        }}
      >
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 40px 8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                fontSize: 18
              }}
            >
              <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Status Toggle Modal */}
      <CustomModal
        open={statusModal.open}
        title={`${statusModal.action === 'enable' ? 'Enable' : 'Disable'} Client`}
        description={`Are you sure you want to ${statusModal.action} ${statusModal.client?.name || 'this client'}?`}
        confirmText={statusModal.action === 'enable' ? 'Enable' : 'Disable'}
        cancelText="Cancel"
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusModal({ open: false, client: null, action: '' })}
      />

      {/* Client Details Sidebar */}
      {selectedClient && (
        <RightSidebar
          open={true}
          onClose={() => setSelectedClient(null)}
          title={`Client: ${selectedClient.name || 'Details'}`}
        >
          <div className="sidebar-detail-content">
            <div className="sidebar-detail-section">
              <h3 className="sidebar-section-title">Basic Information</h3>
              <div className="sidebar-detail-grid">
                <div className="sidebar-detail-item">
                  <label>Name</label>
                  <div className="value">{selectedClient.name || '-'}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>Dealer</label>
                  <div className="value">{selectedClient.dealerName || '-'}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>Email</label>
                  <div>{selectedClient.email || '-'}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>Phone</label>
                  <div>{(selectedClient.user_meta || selectedClient.userMeta)?.phone || (selectedClient.user_meta || selectedClient.userMeta)?.mobile || '-'}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>Status</label>
                  <span className={`client-status-pill ${(selectedClient.status === 'active' || !selectedClient.status) ? 'active' : 'inactive'}`}>
                    {selectedClient.status === 'active' || !selectedClient.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="sidebar-detail-section">
              <h3 className="sidebar-section-title">Company Details</h3>
              <div className="sidebar-detail-grid">
                <div className="sidebar-detail-item">
                  <label>Company Name</label>
                  <div>{(selectedClient.user_meta || selectedClient.userMeta)?.company || (selectedClient.user_meta || selectedClient.userMeta)?.company_name || '-'}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>GTIN</label>
                  <div>{(selectedClient.user_meta || selectedClient.userMeta)?.gtin || (selectedClient.user_meta || selectedClient.userMeta)?.gstin || '-'}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>Address</label>
                  <div>{formatAddress(selectedClient)}</div>
                </div>
              </div>
            </div>

            <div className="sidebar-detail-section">
              <h3 className="sidebar-section-title">Account Information</h3>
              <div className="sidebar-detail-grid">
                <div className="sidebar-detail-item">
                  <label>Registered On</label>
                  <div>{formatDate(selectedClient.created_at || selectedClient.createdAt || selectedClient.registered_at)}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>Last Login</label>
                  <div>{formatDate(selectedClient.last_login_at || selectedClient.last_login || selectedClient.lastLogin)}</div>
                </div>
                <div className="sidebar-detail-item">
                  <label>Client ID</label>
                  <div style={{ fontFamily: 'monospace' }}>{selectedClient.id || selectedClient._id || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </RightSidebar>
      )}

      {/* Client Settings Sidebar */}
      <ClientSettingsSidebar
        open={!!settingsClient}
        onClose={() => setSettingsClient(null)}
        client={settingsClient}
      />
    </>
  );
}
