/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface InteractiveBackgroundProps {
  type: 'none' | 'waves' | 'particles' | 'matrix' | 'bubbles' | 'vortex';
  primaryColor: string; // The selected theme hex color
}

export default function InteractiveBackground({ type, primaryColor }: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  useEffect(() => {
    if (type === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track resizing properly
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isHovering = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Setup helper to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) || 79;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 70;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 229;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // --- Entity Initializations based on Background Type ---
    
    // 1. Standard Particles & Vortex Orbiters
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      angle?: number;
      orbitSpeed?: number;
      distance?: number;
    }
    const particles: Particle[] = [];

    if (type === 'particles') {
      const particleCount = 45;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
    } else if (type === 'vortex') {
      const orbiterCount = 50;
      for (let i = 0; i < orbiterCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
          radius: Math.random() * 2.5 + 1,
          alpha: Math.random() * 0.5 + 0.1,
          angle: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() * 0.006 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
          distance: Math.random() * 200 + 40,
        });
      }
    }

    // 2. Bubbles
    interface Bubble {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      alpha: number;
      growFactor: number;
    }
    const bubbles: Bubble[] = [];
    if (type === 'bubbles') {
      const bubbleCount = 25;
      for (let i = 0; i < bubbleCount; i++) {
        bubbles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 14 + 4,
          speedY: -(Math.random() * 0.4 + 0.1),
          speedX: (Math.random() - 0.5) * 0.2,
          alpha: Math.random() * 0.2 + 0.05,
          growFactor: Math.random() * 0.02,
        });
      }
    }

    // 3. Matrix grid coordinates and blueprint symbols
    interface BlueprintSymbol {
      x: number;
      y: number;
      char: string;
      alpha: number;
      fadeSpeed: number;
    }
    const blueprints: BlueprintSymbol[] = [];
    const maxBlueprints = 15;
    const chars = ['+', '×', '⊞', '■', '▫', '▱', '⛶', '📐'];

    // Waves phase state
    let phase = 0;

    // Smooth mouse interpolation
    const updateMouse = () => {
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;
    };

    // Main render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      updateMouse();

      const mouse = mouseRef.current;

      // ---------------- TYPE: WAVES ----------------
      if (type === 'waves') {
        phase += 0.003;
        ctx.lineWidth = 1.5;

        // Wave 1 - Deep background wave
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(primaryColor, 0.05);
        for (let x = 0; x < width; x += 10) {
          const mouseEffect = mouse.isHovering ? (mouse.y - height / 2) * 0.15 * Math.sin(x / 400) : 0;
          const y = height * 0.85 + Math.sin(x * 0.002 + phase) * 60 + Math.cos(x * 0.005 - phase * 0.5) * 20 + mouseEffect;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Wave 2 - Medium wave
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(primaryColor, 0.08);
        for (let x = 0; x < width; x += 10) {
          const mouseEffect = mouse.isHovering ? (mouse.x - width / 2) * 0.08 * Math.cos(x / 300) : 0;
          const y = height * 0.88 + Math.sin(x * 0.003 - phase * 1.2) * 45 + Math.sin(x * 0.001 + phase) * 15 + mouseEffect;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Wave 3 - Foreground wave
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(primaryColor, 0.12);
        for (let x = 0; x < width; x += 10) {
          const y = height * 0.91 + Math.sin(x * 0.0015 + phase * 0.8) * 35 + Math.cos(x * 0.003 + phase * 1.5) * 10;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Subtle glowing aura under mouse
        if (mouse.isHovering) {
          const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
          gradient.addColorStop(0, hexToRgba(primaryColor, 0.04));
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2);
          ctx.fill();
        }

      // ---------------- TYPE: PARTICLES ----------------
      } else if (type === 'particles') {
        particles.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          if (mouse.isHovering) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 250) {
              p.x += (dx / dist) * 0.15;
              p.y += (dy / dist) * 0.15;
            }
          }

          ctx.beginPath();
          ctx.fillStyle = hexToRgba(primaryColor, p.alpha);
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
              const lineAlpha = (1 - dist / 120) * 0.07;
              ctx.beginPath();
              ctx.strokeStyle = hexToRgba(primaryColor, lineAlpha);
              ctx.lineWidth = 0.5;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }

          if (mouse.isHovering) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              const lineAlpha = (1 - dist / 180) * 0.12;
              ctx.beginPath();
              ctx.strokeStyle = hexToRgba(primaryColor, lineAlpha);
              ctx.lineWidth = 0.8;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }
        });

      // ---------------- TYPE: BUBBLES ----------------
      } else if (type === 'bubbles') {
        bubbles.forEach((b) => {
          b.y += b.speedY;
          b.x += b.speedX + Math.sin(b.y * 0.01) * 0.05;

          // Wrap top
          if (b.y < -30) {
            b.y = height + 30;
            b.x = Math.random() * width;
          }

          // Push away from mouse
          if (mouse.isHovering) {
            const dx = b.x - mouse.x;
            const dy = b.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              const force = (150 - dist) / 150;
              b.x += (dx / dist) * force * 1.5;
              b.y += (dy / dist) * force * 1.5;
            }
          }

          ctx.beginPath();
          ctx.strokeStyle = hexToRgba(primaryColor, b.alpha);
          ctx.lineWidth = 1.2;
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Subtle reflection shine
          ctx.beginPath();
          ctx.fillStyle = hexToRgba(primaryColor, b.alpha * 0.4);
          ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        });

      // ---------------- TYPE: MATRIX GRID ----------------
      } else if (type === 'matrix') {
        const gridSpacing = 60;
        ctx.fillStyle = hexToRgba(primaryColor, 0.08);

        // Draw structural engineering blueprint dots
        for (let x = gridSpacing; x < width; x += gridSpacing) {
          for (let y = gridSpacing; y < height; y += gridSpacing) {
            let size = 1.2;
            let alpha = 0.05;

            if (mouse.isHovering) {
              const dx = mouse.x - x;
              const dy = mouse.y - y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 180) {
                const ratio = 1 - dist / 180;
                size += ratio * 2;
                alpha += ratio * 0.15;

                // Draw delicate crosshair lines for the closest ones
                if (dist < 80) {
                  ctx.beginPath();
                  ctx.strokeStyle = hexToRgba(primaryColor, ratio * 0.03);
                  ctx.lineWidth = 0.5;
                  ctx.moveTo(x - 10, y);
                  ctx.lineTo(x + 10, y);
                  ctx.moveTo(x, y - 10);
                  ctx.lineTo(x, y + 10);
                  ctx.stroke();
                }
              }
            }

            ctx.beginPath();
            ctx.fillStyle = hexToRgba(primaryColor, alpha);
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Periodically spawn blueprint symbols
        if (Math.random() < 0.02 && blueprints.length < maxBlueprints) {
          blueprints.push({
            x: Math.random() * (width - 80) + 40,
            y: Math.random() * (height - 80) + 40,
            char: chars[Math.floor(Math.random() * chars.length)],
            alpha: 0.01,
            fadeSpeed: Math.random() * 0.003 + 0.002,
          });
        }

        // Render and update symbols
        for (let i = blueprints.length - 1; i >= 0; i--) {
          const sym = blueprints[i];
          sym.alpha += sym.fadeSpeed;
          if (sym.alpha > 0.15) {
            sym.fadeSpeed = -Math.abs(sym.fadeSpeed);
          }

          if (sym.alpha <= 0) {
            blueprints.splice(i, 1);
            continue;
          }

          ctx.font = '10px monospace';
          ctx.fillStyle = hexToRgba(primaryColor, sym.alpha);
          ctx.fillText(sym.char, sym.x, sym.y);
        }

      // ---------------- TYPE: VORTEX ORBITS ----------------
      } else if (type === 'vortex') {
        const center = mouse.isHovering ? mouse : { x: width / 2, y: height / 2 };

        particles.forEach((p) => {
          if (p.angle !== undefined && p.distance !== undefined && p.orbitSpeed !== undefined) {
            p.angle += p.orbitSpeed;
            
            // Orbit calculation
            const targetX = center.x + Math.cos(p.angle) * p.distance;
            const targetY = center.y + Math.sin(p.angle) * p.distance;

            // Ease position towards orbit point
            p.x += (targetX - p.x) * 0.05;
            p.y += (targetY - p.y) * 0.05;

            ctx.beginPath();
            ctx.fillStyle = hexToRgba(primaryColor, p.alpha);
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Connect lines back to the gravity center
            const dx = center.x - p.x;
            const dy = center.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 220) {
              ctx.beginPath();
              ctx.strokeStyle = hexToRgba(primaryColor, (1 - dist / 220) * 0.03);
              ctx.lineWidth = 0.4;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(center.x, center.y);
              ctx.stroke();
            }
          }
        });
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    // Clean up properly
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [type, primaryColor]);

  if (type === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
