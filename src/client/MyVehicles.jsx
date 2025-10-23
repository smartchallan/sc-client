
import React from "react";
import VehicleTableOnly from "./VehicleTableOnly";


export default function MyVehicles({ searchText = '', setSearchText = null }) {
  return (
    <div className="my-vehicles-content">
      <h1 className="page-title">My Vehicles</h1>
      <p className="page-subtitle">Manage your vehicles and view criticle details like Insurance expiry, Road tax expiry, Fitness and Pollution status.</p>
      {/* Search input placed here per request; props passed from ClientDashboard when rendering MyVehicles */}
      { (setSearchText || searchText) ? (
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by Vehicle No."
            value={searchText || ''}
            onChange={e => setSearchText && setSearchText(e.target.value)}
            className="form-control"
            style={{ padding: '6px 12px', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', minWidth: 200, maxWidth: 320, textTransform: 'uppercase' }}
          />
        </div>
      ) : null}
      {/* Registered Vehicles table removed as requested */}
    </div>
  );
}
