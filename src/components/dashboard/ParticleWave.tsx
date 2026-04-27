"use client";

import React, { useEffect, useRef } from "react";

export function ParticleWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: { x: number; y: number; z: number; originalZ: number; hue: number }[] = [];
    const numX = 60;
    const numZ = 30;
    const spacingX = width / numX;
    const spacingZ = 15;
    
    // Create grid of particles
    for (let z = 0; z < numZ; z++) {
      for (let x = 0; x < numX; x++) {
        particles.push({
          x: (x - numX / 2) * spacingX * 1.5,
          y: 0,
          z: z * spacingZ,
          originalZ: z * spacingZ,
          hue: 160 + (x / numX) * 100, // Emerald to Cyan to Purple
        });
      }
    }

    let time = 0;
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(7, 7, 15, 0.0)");
      gradient.addColorStop(1, "rgba(7, 7, 15, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Camera position
      const cx = 0;
      const cy = -120;
      const cz = -200;
      const fov = 350;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Complex wave math combining multiple sine waves
        const wave1 = Math.sin(p.x * 0.01 + time * 0.02) * 50;
        const wave2 = Math.cos(p.z * 0.05 + time * 0.03) * 30;
        const wave3 = Math.sin((p.x + p.z) * 0.02 - time * 0.015) * 40;
        p.y = wave1 + wave2 + wave3;

        // 3D to 2D Projection
        const dz = p.z - cz;
        if (dz <= 0) continue;

        const scale = fov / dz;
        const screenX = (p.x - cx) * scale + width / 2;
        const screenY = (p.y - cy) * scale + height / 2;

        // Draw particle
        const size = Math.max(0.1, 1.8 * scale);
        const alpha = Math.max(0, Math.min(1, 1 - p.z / (numZ * spacingZ)));

        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        
        // HSL glow effect: Emerald (160), Cyan (190), Purple (260)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`;
        ctx.fill();

        // Connect adjacent points for the "mesh" look
        if (i > 0 && i % numX !== 0) {
          const prev = particles[i - 1];
          const prevDz = prev.z - cz;
          if (prevDz > 0) {
            const prevScale = fov / prevDz;
            const prevScreenX = (prev.x - cx) * prevScale + width / 2;
            const prevScreenY = (prev.y - cy) * prevScale + height / 2;
            
            const dist = Math.hypot(screenX - prevScreenX, screenY - prevScreenY);
            if (dist < 40) {
              ctx.beginPath();
              ctx.moveTo(screenX, screenY);
              ctx.lineTo(prevScreenX, prevScreenY);
              ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${alpha * 0.15})`;
              ctx.lineWidth = 0.5 * scale;
              ctx.stroke();
            }
          }
        }
      }

      time += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-[400px] md:h-[500px] pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
