import { useState, useEffect, useRef, useMemo } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function flattenNetwork(nodes, depth = 0, parentName = null) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, depth, parentName });
    if (node.children && node.children.length > 0) {
      result.push(...flattenNetwork(node.children, depth + 1, node.name));
    }
  }
  return result;
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * ClientTreeDropdown — a reusable parent/child client selector.
 *
 * Props:
 *   networkTree   {Array}    Tree of client nodes (each may have `children`).
 *   loading       {boolean}  Show loading state inside the dropdown.
 *   selectedClient {object|null}  Currently selected node.
 *   onSelect      {function} Called with the selected node object.
 *   label         {string}   Optional label above the selector (default "Select Client").
 *   placeholder   {string}   Placeholder text (default "Select a client…").
 *   maxHeight     {number}   Max height of the list in px (default 300).
 */
export default function ClientTreeDropdown({
  networkTree = [],
  loading = false,
  selectedClient = null,
  onSelect,
  label = 'Select Client',
  placeholder = 'Select a client…',
  maxHeight = 300,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const allClients = useMemo(() => flattenNetwork(networkTree), [networkTree]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return allClients;
    return allClients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.user_meta?.company_name || '').toLowerCase().includes(q)
    );
  }, [allClients, clientSearch]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [dropdownOpen]);

  const handleSelect = (client) => {
    if (typeof onSelect === 'function') onSelect(client);
    setDropdownOpen(false);
    setClientSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (typeof onSelect === 'function') onSelect(null);
    setClientSearch('');
  };

  return (
    <div>
      {label && (
        <label style={{
          fontSize: 12, fontWeight: 700, color: '#475569',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          display: 'block', marginBottom: 8,
        }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }} ref={dropdownRef}>
        {/* Trigger */}
        <div
          onClick={() => setDropdownOpen(o => !o)}
          style={{
            border: `1.5px solid ${dropdownOpen ? '#3b82f6' : '#e2e8f0'}`,
            borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8fafc', transition: 'border-color 0.15s',
            boxShadow: dropdownOpen ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
            minHeight: 44,
          }}
        >
          {selectedClient ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: avatarColor(selectedClient.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 13,
              }}>
                {getInitials(selectedClient.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedClient.name}
                </div>
                {selectedClient.email && (
                  <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedClient.email}
                  </div>
                )}
              </div>
              <button
                onClick={handleClear}
                style={{ marginLeft: 'auto', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 4, lineHeight: 1 }}
              >
                <i className="ri-close-line" style={{ fontSize: 16 }} />
              </button>
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{placeholder}</span>
          )}
          {!selectedClient && (
            <i className={`ri-arrow-${dropdownOpen ? 'up' : 'down'}-s-line`} style={{ color: '#94a3b8', fontSize: 18, flexShrink: 0 }} />
          )}
        </div>

        {/* Dropdown panel */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
            background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
            boxShadow: '0 12px 36px rgba(0,0,0,0.14)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Search bar */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-search-line" style={{ color: '#94a3b8', fontSize: 16 }} />
              <input
                ref={searchInputRef}
                placeholder="Search name, email, or company..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#1e293b' }}
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}
                >
                  <i className="ri-close-circle-fill" style={{ fontSize: 15 }} />
                </button>
              )}
            </div>

            {/* Stats */}
            <div style={{ padding: '6px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 11, color: '#64748b' }}>
              {loading
                ? 'Loading network...'
                : clientSearch
                  ? `${filteredClients.length} of ${allClients.length} clients`
                  : `${allClients.length} client${allClients.length !== 1 ? 's' : ''} across all levels`
              }
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', maxHeight }}>
              {loading ? (
                <div style={{ padding: '20px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <i className="ri-loader-4-line" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} />
                  Loading your client network...
                </div>
              ) : filteredClients.length === 0 ? (
                <div style={{ padding: '20px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No clients match your search
                </div>
              ) : filteredClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  style={{
                    padding: `10px 14px 10px ${14 + c.depth * 20}px`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    background: selectedClient?.id === c.id ? '#eff6ff' : 'transparent',
                    borderBottom: '1px solid #f8fafc', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (selectedClient?.id !== c.id) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedClient?.id === c.id ? '#eff6ff' : 'transparent'; }}
                >
                  {/* Depth indicator */}
                  {c.depth > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      {Array.from({ length: c.depth }).map((_, i) => (
                        <span key={i} style={{ width: 1, height: 24, background: '#e2e8f0', display: 'block' }} />
                      ))}
                      <i className="ri-corner-down-right-line" style={{ color: '#cbd5e1', fontSize: 13, marginLeft: 2 }} />
                    </div>
                  )}
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: avatarColor(c.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 12,
                  }}>
                    {getInitials(c.name)}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name}
                      </span>
                      {c.depth === 0 && (
                        <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                          Direct
                        </span>
                      )}
                      {c.depth > 0 && (
                        <span style={{ fontSize: 10, background: '#f3e8ff', color: '#7c3aed', padding: '1px 6px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                          Sub
                        </span>
                      )}
                      {c.status && (
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 600, flexShrink: 0,
                          background: c.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: c.status === 'active' ? '#166534' : '#991b1b',
                        }}>
                          {c.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, display: 'flex', gap: 8 }}>
                      {c.email && <span>{c.email}</span>}
                      {c.parentName && c.depth > 0 && <span style={{ color: '#94a3b8' }}>· under {c.parentName}</span>}
                    </div>
                  </div>
                  {/* Check mark for selected */}
                  {selectedClient?.id === c.id && (
                    <i className="ri-check-line" style={{ color: '#2563eb', fontSize: 18, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
