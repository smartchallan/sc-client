import { useState, useEffect, useRef, useMemo } from 'react';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

// Recursively flatten tree into [{...node, depth, parentName}]
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

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function NotificationCenter() {
  const [networkTree, setNetworkTree] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sentNotifs, setSentNotifs] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const scUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('sc_user')) || {}; } catch { return {}; }
  }, []);
  const dealerId = scUser.user?.id || scUser.user?.client_id || 0;
  const dealerName = scUser.user?.name || 'Dealer';

  // Flatten full network
  const allClients = useMemo(() => flattenNetwork(networkTree), [networkTree]);

  // Fetch full network tree
  useEffect(() => {
    if (!dealerId) return;
    setLoadingClients(true);
    fetch(`${API_ROOT}/getclientnetwork?parent_id=${dealerId}`)
      .then(r => r.json())
      .then(data => {
        const tree = Array.isArray(data) ? data : (data.clients || data.users || []);
        setNetworkTree(tree);
      })
      .catch(err => console.error('[NotificationCenter] fetch clients:', err))
      .finally(() => setLoadingClients(false));
  }, [dealerId]);

  // Fetch ALL sent notifications by dealer (refresh on mount and every 30s)
  const fetchSentNotifs = () => {
    if (!dealerId) return;
    setLoadingSent(true);
    fetch(`${API_ROOT}/notifications?sender_id=${dealerId}`)
      .then(r => r.json())
      .then(data => setSentNotifs(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoadingSent(false));
  };

  useEffect(() => {
    fetchSentNotifs();
    const interval = setInterval(fetchSentNotifs, 30000);
    return () => clearInterval(interval);
  }, [dealerId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [dropdownOpen]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return allClients;
    return allClients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.user_meta?.company_name || '').toLowerCase().includes(q)
    );
  }, [allClients, clientSearch]);

  // Base list: filter by selected client if one is chosen
  const clientFilteredNotifs = useMemo(() => {
    if (!selectedClient) return sentNotifs;
    return sentNotifs.filter(n => String(n.recipient_id) === String(selectedClient.id));
  }, [sentNotifs, selectedClient]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'unread') return clientFilteredNotifs.filter(n => !n.is_read);
    if (historyFilter === 'read') return clientFilteredNotifs.filter(n => n.is_read);
    return clientFilteredNotifs;
  }, [clientFilteredNotifs, historyFilter]);

  const unreadCount = useMemo(() => clientFilteredNotifs.filter(n => !n.is_read).length, [clientFilteredNotifs]);

  // Map client id → name for "To:" labels in history
  const clientNameMap = useMemo(() => {
    const map = {};
    for (const c of allClients) map[String(c.id)] = c.name;
    return map;
  }, [allClients]);

  const handleSend = async () => {
    if (!selectedClient || !subject.trim() || !message.trim()) {
      setSendResult({ type: 'error', msg: 'Please select a client, add a subject and message.' });
      setTimeout(() => setSendResult(null), 3500);
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${API_ROOT}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: dealerId,
          sender_name: dealerName,
          recipient_id: selectedClient.id,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendResult({ type: 'success', msg: `Notification sent to ${selectedClient.name}!` });
      setSubject('');
      setMessage('');
      // Refresh all sent notifications
      fetchSentNotifs();
    } catch (err) {
      setSendResult({ type: 'error', msg: err.message });
    } finally {
      setSending(false);
      setTimeout(() => setSendResult(null), 4000);
    }
  };

  const canSend = selectedClient && subject.trim() && message.trim();

  return (
    <div style={{ padding: '4px 0', height: '100%' }}>
      <style>{`
        .nc-grid { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .nc-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Two-column layout */}
      <div className="nc-grid">

        {/* ── LEFT: Compose Panel ── */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ri-send-plane-2-fill" style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Compose Notification</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                {loadingClients ? 'Loading network…' : `${allClients.length} client${allClients.length !== 1 ? 's' : ''} in your network`}
              </div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {/* Client Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                To
              </label>
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                {/* Selected client chip or placeholder */}
                <div
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    border: `1.5px solid ${dropdownOpen ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f8fafc', transition: 'border-color 0.15s',
                    boxShadow: dropdownOpen ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
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
                        onClick={e => { e.stopPropagation(); setSelectedClient(null); }}
                        style={{ marginLeft: 'auto', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 4, lineHeight: 1 }}
                      >
                        <i className="ri-close-line" style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 14 }}>Select a client...</span>
                  )}
                  {!selectedClient && (
                    <i className={`ri-arrow-${dropdownOpen ? 'up' : 'down'}-s-line`} style={{ color: '#94a3b8', fontSize: 18, flexShrink: 0 }} />
                  )}
                </div>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
                    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
                    boxShadow: '0 12px 36px rgba(0,0,0,0.14)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  }}>
                    {/* Search */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="ri-search-line" style={{ color: '#94a3b8', fontSize: 16 }} />
                      <input
                        ref={searchInputRef}
                        placeholder="Search name, email, or company..."
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1, border: 'none', outline: 'none', fontSize: 13,
                          background: 'transparent', color: '#1e293b',
                        }}
                      />
                      {clientSearch && (
                        <button onClick={() => setClientSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>
                          <i className="ri-close-circle-fill" style={{ fontSize: 15 }} />
                        </button>
                      )}
                    </div>

                    {/* Stats bar */}
                    <div style={{ padding: '6px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 11, color: '#64748b' }}>
                      {loadingClients
                        ? 'Loading network...'
                        : clientSearch
                          ? `${filteredClients.length} of ${allClients.length} clients`
                          : `${allClients.length} clients across all levels`
                      }
                    </div>

                    {/* Client list */}
                    <div style={{ overflowY: 'auto', maxHeight: 300 }}>
                      {loadingClients ? (
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
                          onClick={() => { setSelectedClient(c); setDropdownOpen(false); setClientSearch(''); }}
                          style={{
                            padding: `10px 14px 10px ${14 + c.depth * 20}px`,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                            background: selectedClient?.id === c.id ? '#eff6ff' : 'transparent',
                            borderBottom: '1px solid #f8fafc',
                            transition: 'background 0.1s',
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
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.name}
                              </span>
                              {c.depth === 0 && (
                                <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>Direct</span>
                              )}
                              {c.depth > 0 && (
                                <span style={{ fontSize: 10, background: '#f3e8ff', color: '#7c3aed', padding: '1px 6px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>Sub</span>
                              )}
                              <span style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 600, flexShrink: 0,
                                background: c.status === 'active' ? '#dcfce7' : '#fee2e2',
                                color: c.status === 'active' ? '#166534' : '#991b1b',
                              }}>
                                {c.status}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, display: 'flex', gap: 8 }}>
                              {c.email && <span>{c.email}</span>}
                              {c.parentName && c.depth > 0 && <span style={{ color: '#94a3b8' }}>· under {c.parentName}</span>}
                            </div>
                          </div>
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

            {/* Subject */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Payment reminder, Important update..."
                maxLength={255}
                style={{
                  width: '100%', border: `1.5px solid ${subject ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: 10, padding: '10px 14px', fontSize: 14,
                  outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                  transition: 'border-color 0.15s', color: '#1e293b',
                }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = subject ? '#3b82f6' : '#e2e8f0'}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {subject.length}/255
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Message
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your message here. The client will receive this via the notification panel and email."
                rows={6}
                style={{
                  width: '100%', border: `1.5px solid ${message ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: 10, padding: '10px 14px', fontSize: 14,
                  outline: 'none', background: '#f8fafc',
                  resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'inherit', lineHeight: 1.6, color: '#1e293b',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = message ? '#3b82f6' : '#e2e8f0'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  <i className="ri-mail-line" style={{ marginRight: 4 }} />
                  Client also receives this via email
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{message.length} chars</span>
              </div>
            </div>

            {/* Result banner */}
            {sendResult && (
              <div style={{
                marginBottom: 16, padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                background: sendResult.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: sendResult.type === 'success' ? '#166534' : '#991b1b',
                border: `1.5px solid ${sendResult.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'fadeIn 0.2s ease',
              }}>
                <i className={`${sendResult.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}`}
                  style={{ fontSize: 18, flexShrink: 0 }} />
                {sendResult.msg}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || !canSend}
              style={{
                width: '100%',
                background: canSend && !sending
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : '#e2e8f0',
                color: canSend && !sending ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 10, padding: '13px 24px',
                fontSize: 15, fontWeight: 700, cursor: canSend && !sending ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s', boxShadow: canSend && !sending ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
              }}
            >
              {sending ? (
                <>
                  <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite', fontSize: 18 }} />
                  Sending...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-fill" style={{ fontSize: 18 }} />
                  Send Notification
                </>
              )}
            </button>

            {/* Quick tips */}
            {!selectedClient && !loadingClients && allClients.length > 0 && (
              <div style={{ marginTop: 20, padding: '12px 14px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0369a1', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ri-lightbulb-flash-line" />
                  Quick tip
                </div>
                <div style={{ fontSize: 12, color: '#0c4a6e', lineHeight: 1.6 }}>
                  Select a client above to start composing. Your network includes direct clients and their sub-clients.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: History Panel ── */}
        <div style={{
          background: '#fff', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
          border: '1px solid #e2e8f0', overflow: 'hidden',
          minHeight: 520,
        }}>
          {/* Panel header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ri-notification-3-line" style={{ color: '#2563eb', fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                  {selectedClient ? `Notifications · ${selectedClient.name}` : 'All Sent Notifications'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {selectedClient
                    ? `${clientFilteredNotifs.length} sent · ${unreadCount} unread by client`
                    : `${sentNotifs.length} total · ${sentNotifs.filter(n => !n.is_read).length} unread by clients`}
                </div>
              </div>
            </div>

            {clientFilteredNotifs.length > 0 && (
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                {[
                  { key: 'all', label: 'All', count: sentNotifs.length },
                  { key: 'unread', label: 'Unread', count: sentNotifs.filter(n => !n.is_read).length },
                  { key: 'read', label: 'Read', count: sentNotifs.filter(n => n.is_read).length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setHistoryFilter(tab.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                      background: historyFilter === tab.key ? '#fff' : 'transparent',
                      color: historyFilter === tab.key ? '#2563eb' : '#64748b',
                      boxShadow: historyFilter === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {tab.label} {tab.count > 0 && (
                      <span style={{
                        marginLeft: 4, background: historyFilter === tab.key ? '#dbeafe' : '#e2e8f0',
                        color: historyFilter === tab.key ? '#1d4ed8' : '#64748b',
                        borderRadius: 20, padding: '0 5px', fontSize: 10,
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* History content */}
          <div style={{ padding: '0 24px 24px' }}>
            {loadingSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ borderRadius: 12, background: '#f8fafc', padding: '16px 18px', border: '1px solid #f1f5f9' }}>
                    <div style={{ height: 14, background: '#e2e8f0', borderRadius: 4, width: '60%', marginBottom: 10 }} />
                    <div style={{ height: 10, background: '#e2e8f0', borderRadius: 4, width: '90%', marginBottom: 6 }} />
                    <div style={{ height: 10, background: '#e2e8f0', borderRadius: 4, width: '75%' }} />
                  </div>
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '50px 0', textAlign: 'center',
              }}>
                <i className="ri-inbox-line" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 15, color: '#475569', marginBottom: 6 }}>
                  {historyFilter === 'all'
                    ? (selectedClient ? `No notifications sent to ${selectedClient.name} yet` : 'No notifications sent yet')
                    : `No ${historyFilter} notifications`}
                </div>
                {historyFilter === 'all' && (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    {selectedClient
                      ? 'Compose and send a message to this client on the left.'
                      : 'Select a client on the left and send your first notification.'}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
                {filteredHistory.map(n => {
                  const isExpanded = expandedNotif === n.id;
                  return (
                    <div
                      key={n.id}
                      style={{
                        borderRadius: 12,
                        border: `1.5px solid ${n.is_read ? '#f1f5f9' : '#bfdbfe'}`,
                        background: n.is_read ? '#fafafa' : '#eff6ff',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxShadow: isExpanded ? '0 4px 16px rgba(37,99,235,0.1)' : 'none',
                      }}
                    >
                      {/* Notification header row */}
                      <div
                        onClick={() => setExpandedNotif(isExpanded ? null : n.id)}
                        style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}
                      >
                        {/* Unread dot */}
                        <div style={{ flexShrink: 0, paddingTop: 4 }}>
                          {!n.is_read
                            ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                            : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} />
                          }
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                            <span style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 14, color: '#1e293b', flex: 1 }}>
                              {n.subject}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {!n.is_read && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                  background: '#dbeafe', color: '#1d4ed8',
                                }}>
                                  UNREAD
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: '#94a3b8' }} title={formatDate(n.created_at)}>
                                {timeAgo(n.created_at)}
                              </span>
                              <i
                                className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line`}
                                style={{ color: '#94a3b8', fontSize: 16 }}
                              />
                            </div>
                          </div>
                          {!selectedClient && (
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>
                              <i className="ri-user-line" style={{ marginRight: 3 }} />
                              To: <strong>{clientNameMap[String(n.recipient_id)] || `Client #${n.recipient_id}`}</strong>
                            </div>
                          )}
                          {!isExpanded && (
                            <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {n.message}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #e2e8f0', padding: '14px 18px 18px 40px', background: n.is_read ? '#fff' : '#f0f7ff' }}>
                          <div style={{
                            fontSize: 13, color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.75,
                            marginBottom: 14,
                          }}>
                            {n.message}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                              <i className="ri-time-line" style={{ marginRight: 4 }} />
                              {formatDate(n.created_at)}
                              {!selectedClient && ` · To: ${clientNameMap[String(n.recipient_id)] || `Client #${n.recipient_id}`}`}
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                              background: n.is_read ? '#f1f5f9' : '#dbeafe',
                              color: n.is_read ? '#64748b' : '#1d4ed8',
                              border: `1px solid ${n.is_read ? '#e2e8f0' : '#bfdbfe'}`,
                            }}>
                              {n.is_read ? 'Read by client' : 'Not yet read'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
