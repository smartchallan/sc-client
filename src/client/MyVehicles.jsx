
import React from "react";
import VehicleTableOnly from "./VehicleTableOnly";
import "../RegisterVehicle.css";


export default function MyVehicles({ searchText = '', setSearchText = null }) {
  return (
    <div className="my-vehicles-content">
      <h1 className="page-title">My Vehicles</h1>
      <p className="page-subtitle">Manage your vehicles and view criticle details like Insurance expiry, Road tax expiry, Fitness and Pollution status.</p>
      {/* Search input placed here per request; props passed from ClientDashboard when rendering MyVehicles */}
      { (setSearchText || searchText) ? (
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <div className="number-plate-container" style={{ minWidth: 200, maxWidth: 330 }}>
            <div className="number-plate-wrapper">
              <div className="number-plate-badge">IND</div>
              <div className="tricolor-strip">
                <div className="saffron"></div>
                <div className="white"></div>
                <div className="green"></div>
              </div>
              <input
                type="text"
                placeholder="Search by Vehicle No."
                value={searchText || ''}
                onChange={e => setSearchText && setSearchText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="number-plate-input"
                maxLength={12}
              />
            </div>
            <div className="security-features">
              <div className="hologram"></div>
              <div className="chakra">⚙</div>
            </div>
          </div>
        </div>
      ) : null}
  <VehicleTableOnly />
    </div>
  );
}
