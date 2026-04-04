import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import LoadingSkeleton from './LoadingSkeleton';
import ClientTreeDropdown from '../components/ClientTreeDropdown';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function ActivityTracker() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkTree, setNetworkTree] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [parentId, setParentId] = useState(null);
  const recordsPerPage = 30;
  
  // New filter states
  const [actionFilter, setActionFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  // Load client network tree
  useEffect(() => {
    if (!parentId) return;
    try {
      const cached = localStorage.getItem('client_network');
      if (cached) {
        const data = JSON.parse(cached);
        setNetworkTree(Array.isArray(data) ? data : (data.clients || data.users || []));
        return;
      }
    } catch {}
    fetch(`${API_ROOT}/getclientnetwork?parent_id=${parentId}`)
      .then(r => r.json())
      .then(data => setNetworkTree(Array.isArray(data) ? data : (data.clients || data.users || [])))
      .catch(() => {});
  }, [parentId]);

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
        if (selectedClient?.id) {
          // Fetch all activities for specific client (no limit)
          url = `${API_ROOT}/saveuseractivity?user_id=${selectedClient.id}`;
        } else {
          // Fetch all activities for parent (no limit)
          url = `${API_ROOT}/saveuseractivity?parent_id=${parentId}`;
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
          const totalCount = Array.isArray(activitiesData) ? activitiesData.length : 0;
          
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
  }, [parentId, selectedClient]);

  const handleClientChange = (client) => {
    setSelectedClient(client);
    setCurrentPage(1);
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

  // Extract location from description
  const extractLocation = (desc) => {
    if (!desc) return '-';
    // Pattern: "from web portal 192.168.1.1 and New York, NY, United States"
    const match = desc.match(/and\s+(.+)$/);
    return match ? match[1].trim() : '-';
  };

  // Remove location from description
  const cleanDescription = (desc) => {
    if (!desc) return '-';
    return desc.replace(/\s+and\s+[^]+$/, '').trim();
  };

  // Filter activities based on filters (client-side filtering)
  const filteredActivities = activities.filter(activity => {
    // Action filter
    if (actionFilter !== 'all' && activity.action_type !== actionFilter) {
      return false;
    }
    
    // Location filter
    if (locationFilter && locationFilter.trim() !== '') {
      const location = extractLocation(activity.description).toLowerCase();
      if (!location.includes(locationFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      const activityDate = new Date(activity.created_at || activity.timestamp);
      if (dateFrom && activityDate < new Date(dateFrom)) {
        return false;
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // End of the day
        if (activityDate > endDate) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Client-side pagination
  const totalFilteredRecords = filteredActivities.length;
  const totalPages = Math.ceil(totalFilteredRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  // Get unique action types for filter dropdown
  const uniqueActionTypes = [...new Set(activities.map(a => a.action_type).filter(Boolean))];

  // Reset to first page when filters change (but note: filters only apply to current page data)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [actionFilter, locationFilter, dateFrom, dateTo]);


  return (
    <div className="latest-table-container">
      {/* <h2 className="page-title">Activity Tracker</h2> */}
      <p className="page-subtitle">
        View all client activity history including login, logout, and navigation. Filter by specific client to see their activities.
      </p>

      {/* Client selector dropdown */}
      <div style={{ marginBottom: 20, maxWidth: 480 }}>
        <ClientTreeDropdown
          networkTree={networkTree}
          selectedClient={selectedClient}
          onSelect={handleClientChange}
          label="Filter by Client"
          placeholder="Select a client to filter…"
          maxHeight={320}
        />
      </div>

      {/* Filters Section */}
      <div style={{ marginBottom: 24, padding: '0 0' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '10px 18px',
            background: '#2196f3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            marginBottom: showFilters ? 16 : 0
          }}
          onMouseEnter={(e) => e.target.style.background = '#1976d2'}
          onMouseLeave={(e) => e.target.style.background = '#2196f3'}
        >
          <i className={`ri-filter-${showFilters ? 'off' : '3'}-line`}></i>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div style={{
            background: '#f5f9fc',
            borderRadius: 10,
            padding: 20,
            border: '2px solid #e3f2fd',
            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.08)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16
            }}>
              {/* Action Filter */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 6,
                  fontWeight: 600,
                  color: '#1565c0',
                  fontSize: 14
                }}>
                  Action Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #2196f3',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Actions</option>
                  {uniqueActionTypes.map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 6,
                  fontWeight: 600,
                  color: '#1565c0',
                  fontSize: 14
                }}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #2196f3',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff'
                  }}
                />
              </div>

              {/* Date From Filter */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 6,
                  fontWeight: 600,
                  color: '#1565c0',
                  fontSize: 14
                }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #2196f3',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 6,
                  fontWeight: 600,
                  color: '#1565c0',
                  fontSize: 14
                }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #2196f3',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(actionFilter !== 'all' || locationFilter || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setActionFilter('all');
                  setLocationFilter('');
                  setDateFrom('');
                  setDateTo('');
                }}
                style={{
                  marginTop: 16,
                  padding: '8px 16px',
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
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
                  <th style={{ width: '200px' }}>Location</th>
                  <th style={{ width: '180px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}>
                      {selectedClient
                        ? 'No activity records found for this client'
                        : actionFilter !== 'all' || locationFilter || dateFrom || dateTo
                          ? 'No activity records match the selected filters'
                          : 'No activity records found'
                      }
                    </td>
                  </tr>
                ) : (
                  paginatedActivities.map((activity, index) => (
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
                      <td style={{ fontSize: '14px', color: '#546e7a' }}>
                        {cleanDescription(activity.description)}
                      </td>
                      <td style={{ fontSize: '13px', color: '#78909c' }}>
                        {extractLocation(activity.description)}
                      </td>
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
          {totalFilteredRecords > 0 && (
            <div style={{ 
              marginTop: '20px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '16px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#546e7a', fontWeight: 500 }}>
                Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredRecords)} of {totalFilteredRecords} records
                {totalFilteredRecords !== totalRecords && (
                  <span style={{ color: '#2196f3', marginLeft: 8 }}>
                    (filtered from {totalRecords} total)
                  </span>
                )}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 14px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: currentPage === 1 ? '#e9ecef' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      color: currentPage === 1 ? '#adb5bd' : '#1565c0',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 14px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: currentPage === 1 ? '#e9ecef' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      color: currentPage === 1 ? '#adb5bd' : '#1565c0',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0 12px', fontSize: '14px', color: '#495057', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 14px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: currentPage === totalPages ? '#e9ecef' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      color: currentPage === totalPages ? '#adb5bd' : '#1565c0',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 14px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: currentPage === totalPages ? '#e9ecef' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      color: currentPage === totalPages ? '#adb5bd' : '#1565c0',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    Last
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityTracker;
