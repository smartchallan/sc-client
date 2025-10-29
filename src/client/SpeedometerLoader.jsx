import React from 'react';
import './SpeedometerLoader.css';

export default function MusicBarsLoader({ size = 80 }) {
  const barWidth = size / 10; // Slightly thinner bars
  const barGap = barWidth * 0.6;
  const maxBarHeight = size * 0.6; // Reduced max height to fit better
  
  // Create 5 bars with different colors and animation delays
  const bars = [
    { color: '#e91e63', delay: '0s', height: 0.8 },
    { color: '#9c27b0', delay: '0.2s', height: 0.6 },
    { color: '#3f51b5', delay: '0.4s', height: 1.0 },
    { color: '#2196f3', delay: '0.6s', height: 0.7 },
    { color: '#00bcd4', delay: '0.8s', height: 0.9 }
  ];
  
  return (
    <div className="music-bars-loader" style={{ 
      width: size, 
      height: size, 
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: `${barGap}px`,
      margin: '0 auto'
    }}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className="music-bar"
          style={{
            width: `${barWidth}px`,
            minHeight: `${barWidth}px`,
            maxHeight: `${maxBarHeight}px`,
            background: `linear-gradient(180deg, ${bar.color}22, ${bar.color})`,
            borderRadius: `${barWidth / 2}px`,
            animationDelay: bar.delay,
            '--bar-height': `${maxBarHeight * bar.height}px`,
            '--min-height': `${barWidth}px`
          }}
        />
      ))}
      
      {/* Loading text below bars */}
      <div className="loading-text" style={{
        position: 'absolute',
        bottom: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: '#666',
        fontWeight: '500',
        whiteSpace: 'nowrap'
      }}>
        Loading...
      </div>
    </div>
  );
}