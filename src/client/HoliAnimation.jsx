import React, { useEffect, useState } from 'react';
import './HoliAnimation.css';

const HoliAnimation = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Phase transitions for staggered effects
    const phase1 = setTimeout(() => setAnimationPhase(1), 500);
    const phase2 = setTimeout(() => setAnimationPhase(2), 1500);
    const phase3 = setTimeout(() => setAnimationPhase(3), 2500);
    
    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 800);
    }, 6000);

    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      clearTimeout(timer);
    };
  }, [onComplete]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 800);
  };

  const colors = ['#FF006E', '#8338EC', '#3A86FF', '#FFBE0B', '#FB5607', '#06FFA5', '#FF1493'];

  return (
    <div className={`holi-overlay ${!visible ? 'holi-fade-out' : ''}`}>
      <div className="holi-container">
        {/* Background color waves */}
        <div className="holi-color-wave holi-wave-1"></div>
        <div className="holi-color-wave holi-wave-2"></div>
        <div className="holi-color-wave holi-wave-3"></div>

        {/* Color powder explosions */}
        {animationPhase >= 1 && (
          <>
            <div className="holi-explosion holi-explosion-left">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="holi-explosion-particle"
                  style={{
                    '--angle': `${(i * 12)}deg`,
                    '--distance': `${100 + Math.random() * 150}px`,
                    '--size': `${8 + Math.random() * 12}px`,
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    animationDelay: `${Math.random() * 0.3}s`,
                  }}
                />
              ))}
            </div>
            
            <div className="holi-explosion holi-explosion-right">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="holi-explosion-particle"
                  style={{
                    '--angle': `${(i * 12)}deg`,
                    '--distance': `${100 + Math.random() * 150}px`,
                    '--size': `${8 + Math.random() * 12}px`,
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    animationDelay: `${Math.random() * 0.3}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Swirling color particles */}
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="holi-swirl-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            }}
          />
        ))}

        {/* Throwing hands animation */}
        {animationPhase >= 2 && (
          <>
            <div className="holi-hand-left">
              <span className="hand-emoji">👋</span>
              <div className="hand-powder">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="powder-particle"
                    style={{
                      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="holi-hand-right">
              <span className="hand-emoji">👋</span>
              <div className="hand-powder">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="powder-particle"
                    style={{
                      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Central celebration card */}
        <div className={`holi-card ${animationPhase >= 3 ? 'holi-card-visible' : ''}`}>
          <button className="holi-close-btn" onClick={handleClose} aria-label="Close">
            ✕
          </button>
          
          <div className="holi-rangoli">
            <div className="rangoli-circle"></div>
            <div className="rangoli-petal rangoli-petal-1"></div>
            <div className="rangoli-petal rangoli-petal-2"></div>
            <div className="rangoli-petal rangoli-petal-3"></div>
            <div className="rangoli-petal rangoli-petal-4"></div>
          </div>

          <h1 className="holi-title">
            <span className="title-letter" style={{ animationDelay: '0s' }}>H</span>
            <span className="title-letter" style={{ animationDelay: '0.1s' }}>a</span>
            <span className="title-letter" style={{ animationDelay: '0.2s' }}>p</span>
            <span className="title-letter" style={{ animationDelay: '0.3s' }}>p</span>
            <span className="title-letter" style={{ animationDelay: '0.4s' }}>y</span>
            <span className="title-letter" style={{ animationDelay: '0.5s' }}> </span>
            <span className="title-letter" style={{ animationDelay: '0.6s' }}>H</span>
            <span className="title-letter" style={{ animationDelay: '0.7s' }}>o</span>
            <span className="title-letter" style={{ animationDelay: '0.8s' }}>l</span>
            <span className="title-letter" style={{ animationDelay: '0.9s' }}>i</span>
            <span className="title-letter" style={{ animationDelay: '1s' }}>!</span>
          </h1>

          <div className="holi-emoji-row">
            <span className="emoji-bounce" style={{ animationDelay: '0s' }}>🎨</span>
            <span className="emoji-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
            <span className="emoji-bounce" style={{ animationDelay: '0.4s' }}>🌈</span>
            <span className="emoji-bounce" style={{ animationDelay: '0.6s' }}>💐</span>
          </div>

          <p className="holi-message">
            May your life be painted with the colors of joy, love, and happiness!
          </p>

          <div className="holi-sparkles">
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="sparkle"
                style={{
                  left: `${10 + (i * 11)}%`,
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                ✨
              </span>
            ))}
          </div>
        </div>

        {/* Confetti rain */}
        {animationPhase >= 1 && (
          <div className="holi-confetti">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HoliAnimation;
