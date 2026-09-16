import React, { useState, useEffect, useRef } from 'react';

const GLOW_COLORS = [
  '#ff3366',
  '#33ff99',
  '#3399ff',
  '#ffcc00',
  '#cc33ff',
  '#ff6600',
  '#00f5d4',
  '#7b2cbf'
];

export default function App() {
  const [glowColor, setGlowColor] = useState(GLOW_COLORS[0]);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Physics animation state
  const stateRef = useRef({
    x: 0,
    y: 0,
    vx: 3.5,
    vy: 2.8,
    width: 260,
    height: 260,
    colorIndex: 0
  });

  useEffect(() => {
    let animId;

    // Center image initially
    const initPos = () => {
      const imgWidth = Math.min(300, Math.max(180, window.innerWidth * 0.35));
      const imgHeight = imgWidth; // square aspect ratio
      stateRef.current.width = imgWidth;
      stateRef.current.height = imgHeight;
      stateRef.current.x = (window.innerWidth - imgWidth) / 2;
      stateRef.current.y = (window.innerHeight - imgHeight) / 2;

      // Random initial direction
      stateRef.current.vx = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 1.5);
      stateRef.current.vy = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 1.5);
    };

    initPos();

    const handleResize = () => {
      const imgWidth = Math.min(300, Math.max(180, window.innerWidth * 0.35));
      stateRef.current.width = imgWidth;
      stateRef.current.height = imgWidth;
      stateRef.current.x = Math.min(stateRef.current.x, window.innerWidth - imgWidth);
      stateRef.current.y = Math.min(stateRef.current.y, window.innerHeight - imgWidth);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    const update = () => {
      const state = stateRef.current;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      state.x += state.vx;
      state.y += state.vy;

      let bounced = false;

      // Bounce Left / Right
      if (state.x <= 0) {
        state.x = 0;
        state.vx = Math.abs(state.vx);
        bounced = true;
      } else if (state.x + state.width >= screenW) {
        state.x = screenW - state.width;
        state.vx = -Math.abs(state.vx);
        bounced = true;
      }

      // Bounce Top / Bottom
      if (state.y <= 0) {
        state.y = 0;
        state.vy = Math.abs(state.vy);
        bounced = true;
      } else if (state.y + state.height >= screenH) {
        state.y = screenH - state.height;
        state.vy = -Math.abs(state.vy);
        bounced = true;
      }

      // Change glow color on bounce
      if (bounced) {
        state.colorIndex = (state.colorIndex + 1) % GLOW_COLORS.length;
        setGlowColor(GLOW_COLORS[state.colorIndex]);
      }

      // Direct DOM update for smooth 60fps performance
      if (imageRef.current) {
        imageRef.current.style.transform = `translate3d(${state.x}px, ${state.y}px, 0px)`;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTap = () => {
    // Pulse animation on tap
    setScale(1.2);
    setTimeout(() => setScale(1), 250);

    // Speed boost on tap
    stateRef.current.vx *= 1.3;
    stateRef.current.vy *= 1.3;

    // Cap max speed
    if (Math.abs(stateRef.current.vx) > 12) stateRef.current.vx *= 0.6;
    if (Math.abs(stateRef.current.vy) > 12) stateRef.current.vy *= 0.6;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#05070d',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        cursor: 'pointer',
        userSelect: 'none'
      }}
      onClick={handleTap}
    >
      <div
        ref={imageRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '260px',
          height: '260px',
          willChange: 'transform',
          transition: 'scale 0.15s ease-out'
        }}
      >
        <img
          src="/brahmanandam.png"
          alt="Brahmanandam Telugu Meme"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 25px ${glowColor}) drop-shadow(0 0 45px ${glowColor})`,
            transform: `scale(${scale})`,
            transition: 'filter 0.3s ease, transform 0.15s ease'
          }}
        />
      </div>
    </div>
  );
}
