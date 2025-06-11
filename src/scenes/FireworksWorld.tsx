import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Firework {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  hue: number;
  exploded: boolean;
  shape?: DrawPoint[]; // optional custom shape
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: number;
  decay: number;
  static?: boolean;
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
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<{x:number;y:number}>({x:0,y:0});
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([]);

  const launchFirework = (width: number, height: number) => {
    const x = Math.random() * width;
    const y = height;
    const targetY = height * (0.2 + Math.random() * 0.5);
    const speed = 4 + Math.random() * 2;
    const hue = Math.random() * 360;
    fireworksRef.current.push({ x, y, targetY, speed, hue, exploded: false });
  };

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (!isDrawMode || !drawRef.current) return;
    const rect = drawRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawPoints([{ x, y }]);
    drawCtxRef.current?.beginPath();
    drawCtxRef.current?.moveTo(x, y);
    drawingActive.current = true;
    startTimeRef.current = performance.now();
    startPosRef.current = {x, y};
  };

  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (!drawingActive.current || !drawRef.current) return;
    const rect = drawRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawPoints((pts) => [...pts, { x, y }]);
    drawCtxRef.current?.lineTo(x, y);
    drawCtxRef.current?.stroke();
  };

  const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (!drawingActive.current || !drawRef.current) return;
    drawingActive.current = false;
    const timeDelta = performance.now() - startTimeRef.current;
    const rect = drawRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const dy = startPosRef.current.y - endY; // upward positive
    const speed = dy / timeDelta; // px per ms
    if (dy > 30 && speed > 0.3) {
      // launch custom firework based on flick strength
      const canvas = canvasRef.current;
      if (canvas) {
        const targetY = Math.max(endY - dy * 2, canvas.height * 0.2);
        const hue = Math.random()*360;
        fireworksRef.current.push({x:endX, y:canvas.height, targetY, speed:Math.min(10, dy/20), hue, exploded:false});
        // save to Supabase
        const pathStr = JSON.stringify(drawPoints);
        supabase.from('fireworks').insert({ path: pathStr, user: null }).then(({ error })=>{
          if(error) console.error('Supabase insert error', error.message);
        });
      }
    }
    // clear drawing
    setDrawPoints([]);
    drawCtxRef.current?.clearRect(0,0,drawRef.current.width, drawRef.current.height);
  };

  const textToPoints = (text:string): DrawPoint[] => {
    const off = document.createElement('canvas');
    off.width = 300; off.height = 120;
    const ctx = off.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 100px sans-serif';
    ctx.textBaseline = 'top';
    ctx.clearRect(0,0,off.width, off.height);
    ctx.fillText(text, 0, 0);
    const img = ctx.getImageData(0,0,off.width, off.height).data;
    const pts: DrawPoint[] = [];
    for(let y=0;y<off.height;y+=4){
      for(let x=0;x<off.width;x+=4){
        const idx = (y*off.width + x)*4 + 3;
        if(img[idx]>128) pts.push({x, y});
      }
    }
    // normalize around center
    const cx = off.width/2, cy = off.height/2;
    return pts.map(p=>({x:p.x-cx, y:p.y-cy}));
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
            if (fw.shape) {
              const scale = 0.7;
              fw.shape.forEach(pt=>{
                const xPos = fw.x + pt.x*scale;
                const yPos = fw.y + pt.y*scale;
                const vx = 0;
                const vy = 0;
                particlesRef.current.push({x:xPos, y:yPos, vx, vy, alpha:1, hue:fw.hue, decay:0.001, static:true});
              });
            } else {
              const count = 50;
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
        }
      });
      // remove exploded fireworks
      fireworksRef.current = fireworksRef.current.filter((fw) => !fw.exploded);

      // Update particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if(!p.static) p.vy += 0.02; // gravity
        if(p.static) p.alpha -= p.decay*0.2; else p.alpha -= p.decay;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue},100%,50%,${p.alpha})`;
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      // remove dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // Draw UI overlay path when in draw mode
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      if (isDrawMode && drawPoints.length > 1) {
        drawCtx.strokeStyle = 'white';
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
      <button
        className="absolute top-4 left-4 z-20 bg-white/20 hover:bg-white/40 text-white rounded-md px-4 py-2 backdrop-blur-md"
        onClick={() => setIsDrawMode((m) => !m)}
      >
        {isDrawMode ? '完了' : '描く'}
      </button>
      <button
        className="absolute top-4 left-20 z-20 bg-white/20 hover:bg-white/40 text-white rounded-md px-4 py-2 backdrop-blur-md"
        onClick={()=>{
          const txt = prompt('花火にするメッセージを入力');
          if(!txt) return;
          const shape = textToPoints(txt.slice(0,6)); // limit length
          const canvas = canvasRef.current;
          if(canvas){
            const x = canvas.width/2;
            const y = canvas.height;
            const targetY = canvas.height*0.3;
            const hue = Math.random()*360;
            fireworksRef.current.push({x, y, targetY, speed:6, hue, exploded:false, shape});
            supabase.from('fireworks').insert({path:JSON.stringify(shape), user:null}).then(({error})=>{if(error)console.error(error.message)});
          }
        }}
      >
        文字花火
      </button>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0 }} />
      <canvas
        ref={drawRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: isDrawMode ? 'auto' : 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};

export default FireworksWorld;
