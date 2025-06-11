import React, { useEffect, useRef, useState } from 'react';

interface Firework {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  hue: number;
  exploded: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: number;
  decay: number;
}

interface DrawPoint {
  x: number;
  y: number;
}

const FireworksWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>();
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingActive = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([]);

  const launchFirework = (width: number, height: number) => {
    const x = Math.random() * width;
    const y = height;
    const targetY = height * (0.2 + Math.random() * 0.5);
    const speed = 4 + Math.random() * 2;
    const hue = Math.random() * 360;
    fireworksRef.current.push({ x, y, targetY, speed, hue, exploded: false });
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (!drawRef.current) return;
    if (!isDrawing) return;
    const rect = drawRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setDrawPoints([{ x: startX, y: startY }]);
    drawCtxRef.current?.beginPath();
    drawCtxRef.current?.moveTo(startX, startY);
    drawingActive.current = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawCanvas = drawRef.current;
    if (!drawCanvas) return;
    const drawCtx = drawCanvas.getContext('2d');
    if (!drawCtx) return;
    drawCtxRef.current = drawCtx;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawCanvas.width = window.innerWidth;
      drawCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = 0;
    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      rafRef.current = requestAnimationFrame(loop);

      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Launch new fireworks periodically
      if (Math.random() < 0.02) launchFirework(canvas.width, canvas.height);

      // Update fireworks
      fireworksRef.current.forEach((fw) => {
        if (!fw.exploded) {
          fw.y -= fw.speed;
          fw.speed *= 0.98;
          // trail
          ctx.beginPath();
          ctx.fillStyle = `hsl(${fw.hue},100%,50%)`;
          ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
          ctx.fill();
          if (fw.y <= fw.targetY) {
            fw.exploded = true;
            // spawn particles
            const count = 60;
            for (let i = 0; i < count; i++) {
              const angle = (Math.PI * 2 * i) / count;
              const speed = 2 + Math.random() * 2;
              particlesRef.current.push({
                x: fw.x,
                y: fw.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                hue: fw.hue,
                decay: 0.015 + Math.random() * 0.015,
              });
            }
          }
        }
      });
      // remove exploded fireworks
      fireworksRef.current = fireworksRef.current.filter((fw) => !fw.exploded);

      // Update particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // gravity
        p.alpha -= p.decay;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue},100%,50%,${p.alpha})`;
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      // remove dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // Draw UI overlay
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      if (drawPoints.length > 0) {
        drawCtx.strokeStyle = 'black';
        drawCtx.lineWidth = 2;
        drawCtx.beginPath();
        drawCtx.moveTo(drawPoints[0].x, drawPoints[0].y);
        for (let i = 1; i < drawPoints.length; i++) {
          drawCtx.lineTo(drawPoints[i].x, drawPoints[i].y);
        }
        drawCtx.stroke();
      }

      // keep transparent overlay, no white tint
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0 }} />
      <canvas
        ref={drawRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
        onPointerDown={handlePointerDown}
      />
    </div>
  );
};

export default FireworksWorld;
