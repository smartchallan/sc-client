import React from "react";
import { RiCheckboxCircleFill } from "react-icons/ri";

export default function BlueTickIcon({ size = 18, style = {} }) {
  return <RiCheckboxCircleFill size={size} color="#2196f3" style={{ verticalAlign: 'middle', marginLeft: 6, ...style }} title="All documents fit" />;
}
