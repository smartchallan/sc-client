
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
            onChange={e => setSearchText && setSearchText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            className="simple-search-input"
            maxLength={12}
            style={{ minWidth: 200, maxWidth: 330 }}
          />
        </div>
      ) : null}
  <VehicleTableOnly />
    </div>
  );
}
