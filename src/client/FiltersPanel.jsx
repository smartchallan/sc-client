import React from 'react';

export default function FiltersPanel({
  vehicleSearchText,
  onSearchChange,
  fleetChallanFilter,
  setFleetChallanFilter,
  urgentRenewalFilter,
  setUrgentRenewalFilter,
  upcomingRenewalFilter,
  setUpcomingRenewalFilter,
  upcomingRenewalRange,
  setUpcomingRenewalRange
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
      <div className="vst-search-wrap">
        <i className="ri-search-line vst-search-wrap__icon" />
        <input
          type="text"
          className="vst-search-input"
          placeholder="Search vehicle number…"
          value={vehicleSearchText}
          onChange={e => onSearchChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          style={{ textTransform: 'uppercase' }}
        />
      </div>
      <select className="form-control" value={fleetChallanFilter} onChange={e => setFleetChallanFilter(e.target.value)} style={{ minWidth: 160 }}>
        <option value="all">All Vehicles</option>
        <option value="pending">With Pending Challans</option>
        <option value="disposed">With Disposed Challans</option>
      </select>
      <select className="form-control" value={urgentRenewalFilter} onChange={e => setUrgentRenewalFilter(e.target.value)} style={{ minWidth: 160 }}>
        <option value="none">Urgent: None</option>
        <option value="insurance">Insurance</option>
        <option value="roadTax">Road Tax</option>
        <option value="fitness">Fitness</option>
        <option value="pollution">Pollution</option>
      </select>
      <select className="form-control" value={upcomingRenewalFilter} onChange={e => setUpcomingRenewalFilter(e.target.value)} style={{ minWidth: 160 }}>
        <option value="none">Upcoming: None</option>
        <option value="insurance">Insurance</option>
        <option value="roadTax">Road Tax</option>
        <option value="fitness">Fitness</option>
        <option value="pollution">Pollution</option>
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#555' }}>Upcoming Days</label>
        <input type="number" value={upcomingRenewalRange} onChange={e => setUpcomingRenewalRange(Number(e.target.value || 0))} style={{ width: 70 }} />
      </div>
    </div>
  );
}
