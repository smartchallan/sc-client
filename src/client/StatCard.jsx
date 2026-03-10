import React from 'react';

const StatCard = ({ title, value, icon, color = '#3b82f6', change, onClick, children }) => {
  return (
    <div 
      className="ds-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="ds-card__top" style={{ background: color }}>
        <div className="ds-card__icon-wrap">
          <span>{icon}</span>
        </div>
        <div className="ds-card__num">
          {value !== undefined && value !== null ? value : '—'}
        </div>
        <div className="ds-card__label">{title}</div>
        {change !== undefined && (
          <div className="ds-card__change">{change}</div>
        )}
      </div>
      {children && <div className="ds-card__bottom">{children}</div>}
    </div>
  );
};

export default StatCard;
