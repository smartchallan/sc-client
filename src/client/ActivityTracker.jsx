import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import LoadingSkeleton from './LoadingSkeleton';
import "./LatestTable.css";

const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function ActivityTracker() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientList, setClientList] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [parentId, setParentId] = useState(null);
  const recordsPerPage = 50;
  const clientDropdownRef = useRef(null);

  // Get user info from localStorage and set parentId
  useEffect(() => {
    try {
      const userObj = JSON.parse(localStorage.getItem("sc_user"));
      if (userObj && userObj.user) {
        const id = userObj.user.id || userObj.user.user_id;
        setParentId(id);
        console.log('Activity Tracker - Parent ID set to:', id);
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }, []);

  // Load clients from localStorage (same as MyFleetTable and MyChallans)
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('client_network');
      console.log('Activity Tracker - client_network from localStorage:', cachedData ? 'Found' : 'Not found');
      
      if (cachedData) {
        const data = JSON.parse(cachedData);
        console.log('Activity Tracker - Parsed client_network data:', data);
        
        const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        console.log('Activity Tracker - Raw data array:', rawData);
        
        // Flatten nested children
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
        
        console.log('Activity Tracker - Flattened client list:', flatClients.length, 'clients');
        setClientList(flatClients);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!parentId) {
        console.log('Activity Tracker - No parentId, skipping fetch');
        setActivities([]);
        setTotalRecords(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let url = '';
        if (selectedClientId) {
          // Fetch activities for specific client
          url = `${API_ROOT}/saveuseractivity?user_id=${selectedClientId}&limit=${recordsPerPage}&offset=${(currentPage - 1) * recordsPerPage}`;
        } else {
          // Fetch all activities for parent
          url = `${API_ROOT}/saveuseractivity?parent_id=${parentId}&limit=${recordsPerPage}&offset=${(currentPage - 1) * recordsPerPage}`;
        }

        console.log('Activity Tracker - Fetching from URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Activity Tracker - API Response:', {
          status: response.status,
          ok: response.ok,
          data: data,
          activities: data.activities,
          total: data.total
        });

        if (response.ok) {
          const activitiesData = data.activities || data.data || data || [];
          const totalCount = data.total || data.count || (Array.isArray(activitiesData) ? activitiesData.length : 0);
          
          console.log('Activity Tracker - Setting activities:', activitiesData.length, 'records');
          console.log('Activity Tracker - Setting total:', totalCount);
          
          setActivities(activitiesData);
          setTotalRecords(totalCount);
        } else {
          console.error('Activity Tracker - API Error:', data.message);
          toast.error(data.message || 'Failed to fetch activities');
          setActivities([]);
          setTotalRecords(0);
        }
      } catch (error) {
        console.error('Activity Tracker - Fetch error:', error);
        toast.error('Failed to load activity data');
        setActivities([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [parentId, selectedClientId, currentPage]);

  const handleClientSelect = (client) => {
    setSelectedClientId(client.id || client._id);
    setClientSearchTerm(`${client.name} (${(client.user_meta || client.userMeta)?.company_name || 'N/A'})`);
    setShowClientDropdown(false);
    setCurrentPage(1); // Reset to first page when client changes
  };

  const handleClearSearch = () => {
    setClientSearchTerm('');
    setSelectedClientId(null);
    setShowClientDropdown(false);
    setCurrentPage(1); // Reset to first page when clearing filter
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return timestamp;
    }
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const filteredClientList = clientList.filter(client => {
    const searchLower = clientSearchTerm.toLowerCase();
    const name = client.name || '';
    const email = client.email || '';
    const company = (client.user_meta || client.userMeta)?.company_name || '';
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower) ||
           company.toLowerCase().includes(searchLower);
  });

  // Debug logging
  console.log('Activity Tracker - Render state:', {
    loading,
    activitiesCount: activities.length,
    totalRecords,
    parentId,
    selectedClientId,
    currentPage,
    clientListCount: clientList.length
  });

  return (
    <div className="latest-table-container">
      <h2 className="page-title">Activity Tracker</h2>
      <p className="page-subtitle">
        View all client activity history including login, logout, and navigation. Filter by specific client to see their activities.
      </p>

      {/* Client selector dropdown */}
      <div style={{ marginBottom: 20, padding: '0 0'}}>
        <div style={{ position: 'relative', maxWidth: 650 }} ref={clientDropdownRef}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 600, 
            color: '#1565c0', 
            fontSize: 15,
            letterSpacing: '-0.2px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Filter by Client {selectedClientId ? '' : '(Showing All)'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder={selectedClientId ? clientSearchTerm : "Filter by client name, company, or email..."}
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              onFocus={() => setShowClientDropdown(true)}
              style={{
                width: '100%',
                padding: '14px 44px 14px 18px',
                border: '2px solid #2196f3',
                borderRadius: 10,
                fontSize: 15,
                outline: 'none',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.08)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = '#1976d2'}
              onMouseLeave={(e) => e.target.style.borderColor = '#2196f3'}
            />
            {clientSearchTerm && (
              <button
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#e3f2fd',
                  color: '#1565c0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1565c0';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#e3f2fd';
                  e.target.style.color = '#1565c0';
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {showClientDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              maxHeight: 360,
              overflowY: 'auto',
              background: '#fff',
              border: '2px solid #2196f3',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2), 0 2px 8px rgba(0, 0, 0, 0.08)',
              zIndex: 1000,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {filteredClientList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#78909c' }}>
                  {clientList.length === 0 ? 'No clients found. Please visit My Clients page first.' : 'No matching clients found'}
                </div>
              ) : (
                filteredClientList.map(client => (
                <div
                  key={client.id || client._id}
                  onClick={() => handleClientSelect(client)}
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e8f4fd',
                    background: (client.id || client._id) === selectedClientId ? '#e3f2fd' : '#fff',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientId ? '#bbdefb' : '#f5f9fc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientId ? '#e3f2fd' : '#fff'}
                >
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 15, 
                    color: '#1565c0',
                    marginBottom: 4
                  }}>
                    {client.name || 'Unknown'}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: '#546e7a',
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap'
                  }}>
                    {(client.user_meta || client.userMeta)?.company_name && (
                      <span>{(client.user_meta || client.userMeta).company_name}</span>
                    )}
                    {client.email && (
                      <span style={{ color: '#78909c' }}>• {client.email}</span>
                    )}
                  </div>
                </div>
              ))
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="latest-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>S.No.</th>
                  <th>Client Name</th>
                  <th style={{ width: '140px' }}>Action</th>
                  <th>Description</th>
                  <th style={{ width: '180px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}>
                      {selectedClientId 
                        ? 'No activity records found for this client'
                        : 'No activity records found'
                      }
                    </td>
                  </tr>
                ) : (
                  activities.map((activity, index) => (
                    <tr key={activity.id || index}>
                      <td>{(currentPage - 1) * recordsPerPage + index + 1}</td>
                      <td style={{ fontWeight: 500 }}>{activity.client_name || '-'}</td>
                      <td>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          display: 'inline-block',
                          backgroundColor: activity.action_type === 'login' ? '#d1f4e0' :
                                         activity.action_type === 'logout' ? '#ffe5e5' :
                                         '#e3f2fd',
                          color: activity.action_type === 'login' ? '#0d7d3a' :
                                 activity.action_type === 'logout' ? '#c92a2a' :
                                 '#1565c0',
                        }}>
                          {activity.action_type?.replace('_', ' ') || '-'}
                        </span>
                      </td>
                      <td style={{ fontSize: '14px', color: '#546e7a' }}>{activity.description || '-'}</td>
                      <td style={{ fontSize: '13px', color: '#78909c' }}>
                        {formatDateTime(activity.created_at || activity.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalRecords > recordsPerPage && (
            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ fontSize: '14px', color: '#78909c' }}>
                Showing {activities.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    color: currentPage === 1 ? '#bbb' : '#1565c0',
                    fontWeight: 500
                  }}
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    color: currentPage === 1 ? '#bbb' : '#1565c0',
                    fontWeight: 500
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '0 12px', fontSize: '14px', color: '#546e7a', fontWeight: 500 }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    color: currentPage === totalPages ? '#bbb' : '#1565c0',
                    fontWeight: 500
                  }}
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    color: currentPage === totalPages ? '#bbb' : '#1565c0',
                    fontWeight: 500
                  }}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityTracker;
