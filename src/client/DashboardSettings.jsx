import React, { useState } from 'react';

function hexAdjust(hex, delta) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + delta));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + delta));
  const b = Math.max(0, Math.min(255, (n & 0xff) + delta));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function gradientBg(hex) {
  return `linear-gradient(135deg, ${hexAdjust(hex, 45)} 0%, ${hex} 55%, ${hexAdjust(hex, -35)} 100%)`;
}

const CARD_DEFS = [
  { key: 'registeredVehicles', label: 'Registered Vehicles', icon: 'ri-car-line',               stat: '24' },
  { key: 'challansFetched',    label: 'Challans Fetched',    icon: 'ri-error-warning-line',      stat: '8'  },
  { key: 'vehicleRenewals',    label: 'Vehicle Renewals',    icon: 'ri-alarm-warning-line',      stat: '5'  },
  { key: 'challanAmount',      label: 'Challan Amount',      icon: 'ri-money-rupee-circle-line', stat: '₹2,800' },
];

export default function DashboardSettings({ cardColors, defaultColors, onSave }) {
  const [local, setLocal]     = useState({ ...cardColors });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const handleChange = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setLocal({ ...defaultColors });
    setSaved(false);
  };

  return (
    <div className="register-vehicle-content" style={{ padding: '24px 28px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Dashboard Settings</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Customize the color of each stat card. Changes are saved to your account and persist across sessions.
        </p>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {CARD_DEFS.map(({ key, label, icon, stat }) => (
          <div key={key} className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Live preview tile */}
            <div style={{ background: gradientBg(local[key]), padding: '20px 20px 18px', position: 'relative', overflow: 'hidden' }}>
              {/* Glossy sheen */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff',
                }}>
                  <i className={icon} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', position: 'relative', zIndex: 1, textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
                {stat}
              </div>
            </div>

            {/* Color picker */}
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Card Color</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={local[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  style={{ width: 38, height: 38, borderRadius: 8, border: '1.5px solid #d1d5db', cursor: 'pointer', padding: 2, background: 'none' }}
                />
                <input
                  type="text"
                  value={local[key]}
                  onChange={e => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) handleChange(key, v);
                  }}
                  maxLength={7}
                  style={{
                    width: 90, fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                    border: '1.5px solid #d1d5db', borderRadius: 8, padding: '6px 10px',
                    color: '#374151', outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 28px', borderRadius: 8, border: 'none', cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #4f8ef7 0%, #2563eb 100%)',
            color: '#fff', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px', borderRadius: 8, border: '1.5px solid #d1d5db',
            background: '#fff', color: '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Reset Defaults
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>
            Colors saved to your account.
          </span>
        )}
      </div>
    </div>
  );
}
