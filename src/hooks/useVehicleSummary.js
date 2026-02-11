import { useState, useEffect } from 'react';

export default function useVehicleSummary(clientId, opts = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    setLoading(true);
    fetch(`${baseUrl}/vehiclesummary`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, limit: opts.limit || 1000000, offset: opts.offset || 0 })
    })
      .then(r => r.json())
      .then(json => { if (!cancelled) {
        let arr = [];
        if (Array.isArray(json)) arr = json;
        else if (Array.isArray(json.data)) arr = json.data;
        else if (json && Array.isArray(json.rows)) arr = json.rows;
        else if (json && Array.isArray(json.result)) arr = json.result;
        else if (json && typeof json === 'object') {
          for (const k of Object.keys(json)) { if (Array.isArray(json[k])) { arr = json[k]; break; } }
        }
        setData(arr);
        setLoading(false);
      }}).catch(err => { if (!cancelled) { setError(err); setLoading(false); } });

    return () => { cancelled = true; };
  }, [clientId, opts.limit, opts.offset]);

  return { data, loading, error };
}
