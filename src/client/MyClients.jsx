import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function MyClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/clients`);
      const data = await res.json().catch(() => []);
      if (res.ok) setClients(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
      else setClients([]);
    } catch (e) {
      setClients([]);
      toast.error('Failed to load clients');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s) || (c.company || '').toLowerCase().includes(s);
  });

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>My Clients</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="form-control" placeholder="Search clients" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
          <button className="btn btn-outline" onClick={fetchClients} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="latest-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>{loading ? 'Loading...' : 'No clients found.'}</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id || c._id || i}>
                <td>{i + 1}</td>
                <td>{c.name || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{c.company || '-'}</td>
                <td>{c.created_at ? new Date(c.created_at).toLocaleString() : (c.createdAt ? new Date(c.createdAt).toLocaleString() : '-')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
