
import React from "react";
import VehicleTableOnly from "./VehicleTableOnly";
import "../RegisterVehicle.css";


export default function MyVehicles() {
  return <VehicleTableOnly visibleCountProp={5} />;
}
