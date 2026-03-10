import React, { useState, useEffect, useRef } from "react";


export default function UserChallan() {
  const [statusFilter, setStatusFilter] = useState('All');
  const didSetFromStorage = useRef(false);
  useEffect(() => {
    // Read filter from localStorage and clear it after use
    if (didSetFromStorage.current) return;
    const filter = localStorage.getItem('sc_challan_filter');
    if (filter === 'pending') {
      setStatusFilter('Active');
      localStorage.removeItem('sc_challan_filter');
      didSetFromStorage.current = true;
    } else if (filter === 'disposed') {
      setStatusFilter('Paid');
      localStorage.removeItem('sc_challan_filter');
      didSetFromStorage.current = true;
    }
  }, []);

  // No need for extra sync effect, statusFilter is now the single source of truth
  useEffect(() => {
    // Read filter from localStorage and clear it after use
    const filter = localStorage.getItem('sc_challan_filter');
    if (filter === 'pending' || filter === 'disposed') {
      setInitialFilter(filter);
      localStorage.removeItem('sc_challan_filter');
    }
  }, []);
  return (
    <div className="user-challan-content">
      {/* Filters */}
      <div className="filters-row">
        <div className="filter-group">
          <span className="filter-label">Status</span>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Paid</option>
            <option>Overdue</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">From Date</span>
          <input type="date" className="filter-input" />
        </div>
        <div className="filter-group">
          <span className="filter-label">To Date</span>
          <input type="date" className="filter-input" />
        </div>
        <div className="filter-group">
          <span className="filter-label">Amount Range</span>
          <input type="text" className="filter-input" placeholder="Min" style={{ width: '60px' }} />
          <input type="text" className="filter-input" placeholder="Max" style={{ width: '60px', marginRight: '12px' }} />
        </div>
        <div className="filter-group">
          <span>Type</span>
          <select className="filter-select">
            <option>All</option>
            <option>Speeding</option>
            <option>Parking</option>
            <option>Signal Jumping</option>
            <option>No Helmet</option>
            <option>License</option>
          </select>
        </div>
        <button className="action-btn" style={{ marginLeft: '16px' }}><i className="ri-search-line"></i> Filter</button>
      </div>

          <h2>Vehicle Challans</h2>
      <div className="dashboard-latest">
        <div className="latest-header">
          <h2>Vehicle Challans</h2>
        </div>
        <div className="vst-show-more">
          <span className="vst-show-more__label">Show more records:</span>
          <div className="show-more-control">
            <select
              className="show-more-select"
              value={0}
              onChange={e => {
                const val = e.target.value;
                if (val === 'all') setPendingToShow(pendingChallans.length);
                else setPendingToShow(prev => Math.min(prev + Number(val), pendingChallans.length));
              }}
            >
              <option value={0} disabled>Load more…</option>
              <option value={2}>2 more</option>
              <option value={4}>4 more</option>
              <option value={10}>10 more</option>
              <option value="all">All records</option>
            </select>
          </div>
        </div>
        <table className="latest-table">
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            {/* ...existing code... */}
          </tr>
        </thead>
          <tbody>
            {(() => {
              let filtered = pendingChallans;
              if (statusFilter === 'Active') filtered = pendingChallans.filter(c => c.status === 'Active');
              else if (statusFilter === 'Paid') filtered = pendingChallans.filter(c => c.status === 'Paid');
              else if (statusFilter === 'Overdue') filtered = pendingChallans.filter(c => c.status === 'Overdue');
              // 'All' shows all
              if (filtered.length === 0) {
                return <tr><td colSpan={6}>No vehicle challans found.</td></tr>;
              }
              return filtered.slice(0, pendingToShow).map((c, idx) => (
                <tr key={c.no}>
                  <td>{c.no}</td>
                  <td>{c.date}</td>
                  <td>₹{c.amount.toLocaleString()}</td>
                  <td>{c.desc}</td>
                  <td><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td>
                    <button className="action-btn"><i className="ri-eye-line"></i> View</button>
                    {c.status === 'Active' || c.status === 'Overdue' ? <button className="action-btn"><i className="ri-wallet-3-line"></i> Pay</button> : null}
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Disposed Challans Table */}
      <div className="dashboard-latest">
        <div className="latest-header">
          {/* <h2>Disposed Challans</h2> */}
        </div>
        <div className="vst-show-more">
          <span className="vst-show-more__label">Show more records:</span>
          <div className="show-more-control">
            <select
              className="show-more-select"
              value={0}
              onChange={e => {
                const val = e.target.value;
                if (val === 'all') setDisposedToShow(disposedChallans.length);
                else setDisposedToShow(prev => Math.min(prev + Number(val), disposedChallans.length));
              }}
            >
              <option value={0} disabled>Load more…</option>
              <option value={2}>2 more</option>
              <option value={4}>4 more</option>
              <option value={10}>10 more</option>
              <option value="all">All records</option>
            </select>
          </div>
        </div>
        <table className="latest-table">
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disposedChallans.length === 0 ? (
              <tr><td colSpan={6}>No disposed challans found.</td></tr>
            ) : (
              disposedChallans.slice(0, disposedToShow).map((c, idx) => (
                <tr key={c.no}>
                  <td>{c.no}</td>
                  <td>{c.date}</td>
                  <td>₹{c.amount.toLocaleString()}</td>
                  <td>{c.desc}</td>
                  <td><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td>
                    <button className="action-btn"><i className="ri-eye-line"></i> View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>



      {/* Challans Due */}
      <div className="dashboard-due">
        <h2>Challans Due Today</h2>
        <div className="due-list">
          <div className="due-item">
            <div className="due-date">18 JUN</div>
            <div className="due-info">Speeding Violation <span>MH02AB1234</span> <span>₹1,000</span></div>
          </div>
          <div className="due-item">
            <div className="due-date">18 JUN</div>
            <div className="due-info">No Parking Zone <span>MH02CD5678</span> <span>₹500</span></div>
          </div>
        </div>
        <h2>Upcoming Due Dates</h2>
        <div className="due-list">
          <div className="due-item">
            <div className="due-date">22 JUN</div>
            <div className="due-info">Red Light Violation <span>MH02AB1234</span> <span>₹1,500</span></div>
          </div>
          <div className="due-item">
            <div className="due-date">25 JUN</div>
            <div className="due-info">Improper Parking <span>MH02CD5678</span> <span>₹750</span></div>
          </div>
          <div className="due-item">
            <div className="due-date">30 JUN</div>
            <div className="due-info">No Helmet <span>MH02AB1234</span> <span>₹500</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
