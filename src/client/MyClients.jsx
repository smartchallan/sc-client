import React, { useEffect, useState, useMemo } from 'react';
// (removed duplicate imports)
import { toast } from 'react-toastify';
import CustomModal from './CustomModal';
import RightSidebar from './RightSidebar';

export default function MyClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [changePasswordModal, setChangePasswordModal] = useState({ open: false, client: null });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, client: null, action: '' });
  const [selectedClient, setSelectedClient] = useState(null);
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

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const userId = changePasswordModal.client.id || changePasswordModal.client._id;
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
        setChangePasswordModal({ open: false, client: null });
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
      const res = await fetch(`${API_ROOT}/updateclientstatus`, {
        method: 'POST',
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
      <p className="page-subtitle">Manage your complete client network. View all clients and their dealers in a hierarchical structure.</p>
      <div className="dashboard-latest" style={{
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 2px 12px 0 rgba(30,136,229,0.07)',
        border: '1.5px solid #e3eaf1',
        padding: '0 0 18px 0',
        marginBottom: 0,
        minHeight: 340,
        transition: 'box-shadow 0.2s'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, padding: '0 24px 0 0', minHeight: 54 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 4, height: 32, background: '#42a5f5', borderRadius: 3, marginRight: 14 }} />
            <h2 style={{ margin: 0, fontSize: 19, color: '#1565c0', letterSpacing: '0.01em', fontFamily: 'Segoe UI, Arial, sans-serif', lineHeight: 1.2, fontWeight: 700 }}>My Clients Network</h2>
          </div>
          <div style={{ color: '#1565c0', fontSize: 14, background: '#f5f8fa', border: '1.5px solid #2196f3', borderRadius: 6, padding: '4px 12px', fontWeight: 700, display: 'inline-block', marginLeft: 0, boxShadow: '0 1px 4px #21cbf322' }}>
            Showing {filtered.length} of {clients.length} clients
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
          marginTop: 0,
          flexWrap: 'wrap',
          background: '#f5f8fa',
          borderRadius: 8,
          padding: '16px 18px 10px 18px',
          border: '1.5px solid #e3eaf1',
          boxShadow: '0 1px 4px #21cbf322',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
            <input 
              className="form-control" 
              placeholder="Search clients..." 
              value={search} 
              onChange={e => {
                // Debug: log any programmatic value changes
                if (e.nativeEvent && e.nativeEvent.inputType !== 'insertText') {
                  console.log('Search input changed programmatically:', e.target.value, e.nativeEvent);
                }
                setSearch(e.target.value);
              }} 
              style={{ 
                width: 240,
                padding: '10px 14px', 
                borderRadius: 6, 
                border: '1.5px solid #cdd',
                fontSize: 14
              }} 
              autoComplete="off"
            />
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: '1.5px solid #cdd',
                fontSize: 14,
                background: '#fff',
                cursor: 'pointer',
                minWidth: 120
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={stateFilter}
              onChange={e => {
                setStateFilter(e.target.value);
                setCityFilter('all');
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: '1.5px solid #cdd',
                fontSize: 14,
                background: '#fff',
                cursor: 'pointer',
                minWidth: 140
              }}
            >
              <option value="all">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: '1.5px solid #cdd',
                fontSize: 14,
                background: '#fff',
                cursor: 'pointer',
                minWidth: 140
              }}
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            
            {(search || statusFilter !== 'all' || stateFilter !== 'all' || cityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setStateFilter('all');
                  setCityFilter('all');
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  background: '#fff',
                  border: '1.5px solid #cdd',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                Reset
              </button>
            )}
            
            <button 
              onClick={() => fetchClients(true)} 
              disabled={loading}
              style={{ 
                padding: '10px 20px', 
                borderRadius: 6,
                background: loading ? '#e0e0e0' : '#e3f2fd',
                border: '1.5px solid #bbdefb',
                color: loading ? '#999' : '#1565c0',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginLeft: 'auto'
              }}
            >
              <i className={loading ? 'ri-loader-4-line' : 'ri-refresh-line'} style={{ fontSize: 16 }}></i>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Table Container with horizontal scroll only */}
        <div style={{ overflowX: 'auto', padding: '0 18px' }}>
          <table className="latest-table vehicle-summary-table" style={{ width: '100%', marginTop: 8 }}>
            <thead>
              <tr>
                <th>#</th>
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
                  <td colSpan={10} style={{ textAlign: 'center', color: '#666', padding: 20 }}>
                    {loading ? 'Loading...' : 'No clients found.'}
                  </td>
                </tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id || c._id || i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{c.name || '-'}</td>
                  <td>{c.dealerName || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{(c.user_meta || c.userMeta)?.phone || (c.user_meta || c.userMeta)?.mobile || '-'}</td>
                  <td style={{ maxWidth: 200, whiteSpace: 'normal' }}>{formatAddress(c)}</td>
                  <td>{formatDate(c.created_at || c.createdAt || c.registered_at)}</td>
                  <td>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: (c.status === 'active' || !c.status) ? '#e8f5e9' : '#ffebee',
                      color: (c.status === 'active' || !c.status) ? '#2e7d32' : '#c62828'
                    }}>
                      {c.status === 'active' || !c.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(c.last_login_at || c.last_login || c.lastLogin)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
                      <button
                        className="action-btn flat-btn"
                        onClick={() => setSelectedClient(c)}
                        title="View Details"
                        style={{
                          fontSize: 16,
                          padding: '6px 10px',
                          borderRadius: 5,
                          background: '#e3f2fd',
                          color: '#1565c0',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button
                        className="action-btn flat-btn"
                        onClick={() => setStatusModal({ 
                          open: true, 
                          client: c, 
                          action: (c.status === 'active' || !c.status) ? 'disable' : 'enable' 
                        })}
                        title={(c.status === 'active' || !c.status) ? 'Disable Client' : 'Enable Client'}
                        style={{
                          fontSize: 16,
                          padding: '6px 10px',
                          borderRadius: 5,
                          background: (c.status === 'active' || !c.status) ? '#ffebee' : '#e8f5e9',
                          color: (c.status === 'active' || !c.status) ? '#c62828' : '#2e7d32',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className={(c.status === 'active' || !c.status) ? 'ri-close-circle-line' : 'ri-checkbox-circle-line'}></i>
                      </button>
                      <button
                        className="action-btn flat-btn"
                        onClick={() => {
                          // Strict: never set search box to client email or any value when opening modal
                          setChangePasswordModal({ open: true, client: c });
                        }}
                        title="Change Password"
                        style={{
                          fontSize: 16,
                          padding: '6px 10px',
                          borderRadius: 5,
                          background: '#fff3e0',
                          color: '#e65100',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
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
      </div>

      {/* Change Password Modal */}
      <CustomModal
        open={changePasswordModal.open}
        title="Change Password"
        description={`Change password for ${changePasswordModal.client?.name || 'client'}`}
        confirmText="Change Password"
        cancelText="Cancel"
        onConfirm={handleChangePassword}
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
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: '#1565c0', borderBottom: '2px solid #e3f2fd', paddingBottom: 8 }}>Basic Information</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Name</label>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedClient.name || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Dealer</label>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedClient.dealerName || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Email</label>
                  <div style={{ fontSize: 14 }}>{selectedClient.email || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Phone</label>
                  <div style={{ fontSize: 14 }}>{(selectedClient.user_meta || selectedClient.userMeta)?.phone || (selectedClient.user_meta || selectedClient.userMeta)?.mobile || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Status</label>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    background: (selectedClient.status === 'active' || !selectedClient.status) ? '#e8f5e9' : '#ffebee',
                    color: (selectedClient.status === 'active' || !selectedClient.status) ? '#2e7d32' : '#c62828',
                    display: 'inline-block'
                  }}>
                    {selectedClient.status === 'active' || !selectedClient.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: '#1565c0', borderBottom: '2px solid #e3f2fd', paddingBottom: 8 }}>Company Details</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Company Name</label>
                  <div style={{ fontSize: 14 }}>{(selectedClient.user_meta || selectedClient.userMeta)?.company || (selectedClient.user_meta || selectedClient.userMeta)?.company_name || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>GTIN</label>
                  <div style={{ fontSize: 14 }}>{(selectedClient.user_meta || selectedClient.userMeta)?.gtin || (selectedClient.user_meta || selectedClient.userMeta)?.gstin || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Address</label>
                  <div style={{ fontSize: 14 }}>{formatAddress(selectedClient)}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: '#1565c0', borderBottom: '2px solid #e3f2fd', paddingBottom: 8 }}>Account Information</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Registered On</label>
                  <div style={{ fontSize: 14 }}>{formatDate(selectedClient.created_at || selectedClient.createdAt || selectedClient.registered_at)}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Last Login</label>
                  <div style={{ fontSize: 14 }}>{formatDate(selectedClient.last_login_at || selectedClient.last_login || selectedClient.lastLogin)}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Client ID</label>
                  <div style={{ fontSize: 14, fontFamily: 'monospace' }}>{selectedClient.id || selectedClient._id || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </RightSidebar>
      )}
    </>
  );
}
