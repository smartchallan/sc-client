import React, { useEffect, useState } from 'react';

// Dynamic wrapper: try to load react-apexcharts at runtime. If it's not installed,
// show a lightweight textual fallback and an install hint so the app doesn't crash
// during bundling when the package is absent.
export default function StatApexChart({ type = 'donut', series = [], options = {}, height = 160 }) {
  const [ApexComp, setApexComp] = useState(undefined);
  useEffect(() => {
    let mounted = true;
    // dynamic import so bundler won't fail if package missing
    import('react-apexcharts')
      .then(mod => {
        if (mounted) setApexComp(() => mod.default || mod);
      })
      .catch(err => {
        // mark as null to indicate not available
        if (mounted) setApexComp(null);
        console.warn('react-apexcharts not available. Run `npm install apexcharts react-apexcharts` to enable modern charts.');
      });
    return () => { mounted = false; };
  }, []);

  // Provide sensible type-specific defaults to make radialBar / radar / polarArea look modern
  const base = {
    chart: { toolbar: { show: false }, animations: { enabled: true } },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light' }
  };

  let typeDefaults = {};
  const labels = options && options.labels ? options.labels : [];
  if (type === 'radialBar') {
    typeDefaults = {
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: -135,
          endAngle: 225,
          hollow: { size: '40%' },
          dataLabels: {
            name: { show: true },
            value: { show: true, fontSize: '14px', formatter: (v) => Number(v).toLocaleString() }
          }
        }
      },
      labels: labels
    };
  } else if (type === 'radar') {
    typeDefaults = {
      stroke: { width: 2 },
      markers: { size: 4 },
      fill: { opacity: 0.4 },
      xaxis: { categories: labels },
      yaxis: { tickAmount: 4 }
    };
  } else if (type === 'polarArea') {
    typeDefaults = {
      stroke: { color: '#fff', width: 1 },
      legend: { position: 'bottom' },
      labels: labels
    };
  }

  const opts = { ...base, ...typeDefaults, ...(options || {}) };

  if (ApexComp === undefined) {
    return <div style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading chart...</div>;
  }

  if (ApexComp === null) {
    // Fallback: render a compact textual summary when apexcharts isn't installed
    const total = Array.isArray(series) ? series.reduce((s, v) => s + (Number(v) || 0), 0) : 0;
    return (
      <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>{total}</div>
        <div style={{ color: '#666', fontSize: 12 }}>Install ApexCharts for interactive charts</div>
      </div>
    );
  }

  const ReactApexChart = ApexComp;
  return (
    <div style={{ width: '100%', height }}>
      <ReactApexChart options={opts} series={series} type={type} height={height} />
    </div>
  );
}
