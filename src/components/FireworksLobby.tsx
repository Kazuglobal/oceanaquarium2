import React, { useEffect, useRef } from 'react';
import { useFireworkData } from '../hooks/useFireworkData';

const FireworksLobby: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworks = useFireworkData(30); // not used for drawing yet but keeps connection alive
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = 180; // fixed lobby height
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle { x:number;y:number;vx:number;vy:number;alpha:number;hue:number;decay:number; }
    const particles: Particle[] = [];

    let lastLaunch = 0;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0,0,canvas.width,canvas.height);

      if (t - lastLaunch > 800 || particles.length === 0) {
        lastLaunch = t;
        const x = Math.random()*canvas.width*0.8 + canvas.width*0.1;
        const y = canvas.height;
        const targetY = canvas.height*0.3 + Math.random()*canvas.height*0.3;
        const hue = Math.random()*360;
        const count= 40;
        for(let i=0;i<count;i++){
          const angle = (Math.PI*2*i)/count;
          const speed = 1+Math.random()*1.5;
          particles.push({x, y:targetY, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, alpha:1, hue, decay:0.01+Math.random()*0.02});
        }
      }

      for(let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.alpha -= p.decay;
        if(p.alpha<=0) { particles.splice(i,1); continue; }
        ctx.fillStyle = `hsla(${p.hue},100%,60%,${p.alpha})`;
        ctx.fillRect(p.x, p.y, 2,2);
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/20 bg-black/60 backdrop-blur-sm">
      <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:180 }} />
    </div>
  );
};

export default FireworksLobby;
