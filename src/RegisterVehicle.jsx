import React from "react";
import "./RegisterVehicle.css";

export default function RegisterVehicle() {
  return (
    <div className="register-vehicle-content">
      <h1>Vehicle Details</h1>
      <p>Enter your vehicle registration number to fetch challans</p>
      <div className="card">
        <h2><i className="ri-car-line"></i> Enter Vehicle Number</h2>
        <form className="vehicle-form">
          <div className="form-group">
            <label htmlFor="vehicleNumber">Vehicle Registration Number</label>
            <input type="text" id="vehicleNumber" name="vehicleNumber" className="form-control" placeholder="Enter the complete registration number as shown on your RC" />
          </div>
          <div className="form-row">
            <div className="form-col">
              <label htmlFor="state">Select State/Region</label>
              <select id="state" name="state" className="form-control">
                <option value="">Select State/Region</option>
                <option value="DL">Delhi</option>
                <option value="MH">Maharashtra</option>
                <option value="KA">Karnataka</option>
                {/* Add more states/regions as needed */}
              </select>
            </div>
            <div className="form-col">
              <label htmlFor="vehicleType">Vehicle Type</label>
              <select id="vehicleType" name="vehicleType" className="form-control">
                <option value="">Select Vehicle Type</option>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="truck">Truck</option>
                {/* Add more types as needed */}
              </select>
            </div>
          </div>
          <div className="button-group">
            <button type="button" className="btn btn-primary">Fetch Challans</button>
            <button type="button" className="btn btn-secondary">Add New Vehicle</button>
            <button type="button" className="btn btn-danger">Remove Vehicle</button>
          </div>
        </form>
      </div>
      <div className="vehicle-format-info">
        <h3>Vehicle Number Format in India</h3>
        <ul>
          <li>First two letters (e.g., DL) - State/UT code</li>
          <li>Next two digits (e.g., 01) - RTO district code</li>
          <li>Next two letters (e.g., AB) - Series code</li>
          <li>Last four digits (e.g., 1234) - Unique number</li>
        </ul>
        <p>Example: <strong>DL01AB1234</strong> (Delhi, Central Delhi RTO, AB series, number 1234)</p>
      </div>
    </div>
  );
}
