import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Palette, Brush, Eraser, Upload, RotateCcw, Sparkles, Camera, Image } from 'lucide-react';

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
  color?: string;
  size?: number;
}

interface ColoredPoint extends DrawPoint {
  hue: number;
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
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const drawHistoryRef = useRef<DrawPoint[][]>([]);
  const historyIndexRef = useRef(-1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const newPoint = { x, y, color: selectedColor, size: brushSize };
    setDrawPoints([newPoint]);
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
    const newPoint = { x, y, color: selectedColor, size: brushSize };
    setDrawPoints((pts) => [...pts, newPoint]);
    
    if (drawCtxRef.current) {
      drawCtxRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
      drawCtxRef.current.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : selectedColor;
      drawCtxRef.current.lineWidth = brushSize;
      drawCtxRef.current.lineTo(x, y);
      drawCtxRef.current.stroke();
    }
  };

  const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (!drawingActive.current || !drawRef.current) return;
    drawingActive.current = false;
    
    // Save to history for undo/redo
    if (drawPoints.length > 0) {
      drawHistoryRef.current = drawHistoryRef.current.slice(0, historyIndexRef.current + 1);
      drawHistoryRef.current.push([...drawPoints]);
      historyIndexRef.current++;
    }
    
    const timeDelta = performance.now() - startTimeRef.current;
    const rect = drawRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const dy = startPosRef.current.y - endY; // upward positive
    const speed = dy / timeDelta; // px per ms
    if (dy > 30 && speed > 0.3) {
      launchCustomFirework(endX, endY, dy);
    }
  };

  const launchCustomFirework = (x: number, y: number, strength: number, customShape?: ColoredPoint[]) => {
    const canvas = canvasRef.current;
    if (canvas && (drawPoints.length > 0 || customShape)) {
      const targetY = Math.max(y - strength * 2, canvas.height * 0.2);
      const colorHue = customShape ? customShape[0]?.hue || 0 : hexToHue(selectedColor);
      const shape = customShape || normalizeDrawPoints(drawPoints);
      fireworksRef.current.push({
        x, 
        y: canvas.height, 
        targetY, 
        speed: Math.min(10, strength/20), 
        hue: colorHue, 
        exploded: false,
        shape
      });
      // save to Supabase
      const pathStr = JSON.stringify(shape);
      supabase.from('fireworks').insert({ path: pathStr, user: null }).then(({ error })=>{
        if(error) console.error('Supabase insert error', error.message);
      });
    }
  };

  const hexToHue = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: hue = ((b - r) / d + 2) / 6; break;
        case b: hue = ((r - g) / d + 4) / 6; break;
      }
    }
    return hue * 360;
  };

  const normalizeDrawPoints = (points: DrawPoint[]): DrawPoint[] => {
    if (points.length === 0) return [];
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scale = 100 / Math.max(maxX - minX, maxY - minY, 1);
    return points.map(p => ({
      x: (p.x - centerX) * scale,
      y: (p.y - centerY) * scale
    }));
  };

  const clearDrawing = () => {
    setDrawPoints([]);
    if (drawCtxRef.current && drawRef.current) {
      drawCtxRef.current.clearRect(0, 0, drawRef.current.width, drawRef.current.height);
    }
  };

  const undoDrawing = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prevPoints = drawHistoryRef.current[historyIndexRef.current];
      setDrawPoints(prevPoints || []);
      redrawCanvas(prevPoints || []);
    }
  };

  const redoDrawing = () => {
    if (historyIndexRef.current < drawHistoryRef.current.length - 1) {
      historyIndexRef.current++;
      const nextPoints = drawHistoryRef.current[historyIndexRef.current];
      setDrawPoints(nextPoints || []);
      redrawCanvas(nextPoints || []);
    }
  };

  const redrawCanvas = (points: DrawPoint[]) => {
    if (!drawCtxRef.current || !drawRef.current) return;
    drawCtxRef.current.clearRect(0, 0, drawRef.current.width, drawRef.current.height);
    if (points.length > 0) {
      drawCtxRef.current.beginPath();
      drawCtxRef.current.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        drawCtxRef.current.strokeStyle = points[i].color || '#ffffff';
        drawCtxRef.current.lineWidth = points[i].size || 3;
        drawCtxRef.current.lineTo(points[i].x, points[i].y);
        drawCtxRef.current.stroke();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }
    
    setIsProcessingImage(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const points = imageToPoints(img as HTMLImageElement);
        if (points.length > 0) {
          const canvas = canvasRef.current;
          if (canvas) {
            // 複数の花火として打ち上げ
            const groupedPoints = groupPointsByColor(points);
            let delay = 0;
            
            groupedPoints.forEach((group) => {
              setTimeout(() => {
                const x = canvas.width * (0.3 + Math.random() * 0.4);
                launchCustomFirework(x, canvas.height / 2, 150, group);
              }, delay);
              delay += 200;
            });
          }
        }
        setIsProcessingImage(false);
        setUploadedImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };
  
  const imageToPoints = (img: HTMLImageElement): ColoredPoint[] => {
    const canvas = document.createElement('canvas');
    const maxSize = 100;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const points: ColoredPoint[] = [];
    
    // サンプリング間隔
    const step = 2;
    
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const idx = (y * canvas.width + x) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const a = imageData.data[idx + 3];
        
        // 透明度が低いピクセルは無視
        if (a > 128) {
          const hue = rgbToHue(r, g, b);
          points.push({
            x: (x - canvas.width / 2) * 2,
            y: (y - canvas.height / 2) * 2,
            hue
          });
        }
      }
    }
    
    return points;
  };
  
  const rgbToHue = (r: number, g: number, b: number): number => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    
    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: hue = ((b - r) / d + 2) / 6; break;
        case b: hue = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return hue * 360;
  };
  
  const groupPointsByColor = (points: ColoredPoint[]): ColoredPoint[][] => {
    const groups: Map<number, ColoredPoint[]> = new Map();
    
    points.forEach(point => {
      // 色相を30度ごとにグループ化
      const hueGroup = Math.floor(point.hue / 30) * 30;
      if (!groups.has(hueGroup)) {
        groups.set(hueGroup, []);
      }
      groups.get(hueGroup)?.push(point);
    });
    
    // 各グループから最大200ポイントを抽出
    return Array.from(groups.values()).map(group => {
      if (group.length > 200) {
        const step = Math.floor(group.length / 200);
        return group.filter((_, i) => i % step === 0).slice(0, 200);
      }
      return group;
    });
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
                const vx = (Math.random() - 0.5) * 0.5;
                const vy = (Math.random() - 0.5) * 0.5;
                const pointHue = (pt as ColoredPoint).hue || fw.hue;
                particlesRef.current.push({x:xPos, y:yPos, vx, vy, alpha:1, hue:pointHue, decay:0.008, static:true});
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
      if (isDrawMode && !drawingActive.current) {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        if (drawPoints.length > 1) {
          for (let i = 1; i < drawPoints.length; i++) {
            drawCtx.strokeStyle = drawPoints[i].color || 'white';
            drawCtx.lineWidth = drawPoints[i].size || 2;
            drawCtx.beginPath();
            drawCtx.moveTo(drawPoints[i-1].x, drawPoints[i-1].y);
            drawCtx.lineTo(drawPoints[i].x, drawPoints[i].y);
            drawCtx.stroke();
          }
        }
      }

      // keep transparent overlay, no white tint
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const predefinedColors = [
    '#ff0000', '#ff8800', '#ffff00', '#00ff00', 
    '#00ffff', '#0088ff', '#0000ff', '#ff00ff',
    '#ffffff', '#ffaaaa', '#aaffaa', '#aaaaff'
  ];

  return (
    <div>
      {/* メインツールバー */}
      <div className="absolute top-4 left-4 z-20 flex gap-2 items-center">
        <button
          className={`bg-white/20 hover:bg-white/40 text-white rounded-md px-4 py-2 backdrop-blur-md transition ${
            isDrawMode ? 'ring-2 ring-white' : ''
          }`}
          onClick={() => {
            setIsDrawMode((m) => !m);
            if (!isDrawMode) {
              setShowColorPicker(true);
            } else {
              setShowColorPicker(false);
            }
          }}
        >
          {isDrawMode ? '完了' : '描く'}
        </button>
        
        {isDrawMode && (
          <>
            {/* ツールボタン */}
            <button
              className={`p-2 rounded-md backdrop-blur-md transition ${
                !isEraser ? 'bg-white/40 text-white' : 'bg-white/20 text-white/60'
              }`}
              onClick={() => setIsEraser(false)}
            >
              <Brush size={20} />
            </button>
            
            <button
              className={`p-2 rounded-md backdrop-blur-md transition ${
                isEraser ? 'bg-white/40 text-white' : 'bg-white/20 text-white/60'
              }`}
              onClick={() => setIsEraser(true)}
            >
              <Eraser size={20} />
            </button>
            
            {/* ブラシサイズ */}
            <div className="flex gap-1 bg-white/20 rounded-md p-1 backdrop-blur-md">
              {[2, 5, 10].map((size) => (
                <button
                  key={size}
                  className={`w-8 h-8 rounded flex items-center justify-center transition ${
                    brushSize === size ? 'bg-white/40' : 'hover:bg-white/20'
                  }`}
                  onClick={() => setBrushSize(size)}
                >
                  <div 
                    className="bg-white rounded-full"
                    style={{ width: size * 2, height: size * 2 }}
                  />
                </button>
              ))}
            </div>
            
            {/* カラーピッカー */}
            <button
              className="p-2 bg-white/20 hover:bg-white/40 rounded-md backdrop-blur-md transition"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette size={20} style={{ color: selectedColor }} />
            </button>
            
            {/* Undo/Redo/Clear */}
            <button
              className="p-2 bg-white/20 hover:bg-white/40 rounded-md backdrop-blur-md transition"
              onClick={undoDrawing}
              disabled={historyIndexRef.current <= 0}
            >
              <RotateCcw size={20} className="text-white" style={{ transform: 'scaleX(-1)' }} />
            </button>
            
            <button
              className="p-2 bg-white/20 hover:bg-white/40 rounded-md backdrop-blur-md transition"
              onClick={redoDrawing}
              disabled={historyIndexRef.current >= drawHistoryRef.current.length - 1}
            >
              <RotateCcw size={20} className="text-white" />
            </button>
            
            <button
              className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-md backdrop-blur-md transition"
              onClick={clearDrawing}
            >
              クリア
            </button>
            
            {/* 打ち上げボタン */}
            <button
              className="px-4 py-2 bg-gradient-to-r from-purple-500/50 to-pink-500/50 hover:from-purple-500/70 hover:to-pink-500/70 rounded-md backdrop-blur-md transition flex items-center gap-2"
              onClick={() => {
                if (drawPoints.length > 0) {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    launchCustomFirework(canvas.width / 2, canvas.height / 2, 100);
                    clearDrawing();
                  }
                }
              }}
              disabled={drawPoints.length === 0}
            >
              <Upload size={20} />
              打ち上げる
            </button>
          </>
        )}
        
        {/* 文字花火ボタン */}
        <button
          className="bg-white/20 hover:bg-white/40 text-white rounded-md px-4 py-2 backdrop-blur-md transition flex items-center gap-2"
          onClick={()=>{
            const txt = prompt('花火にするメッセージを入力（6文字まで）');
            if(!txt) return;
            const shape = textToPoints(txt.slice(0,6));
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
          <Sparkles size={20} />
          文字花火
        </button>
        
        {/* 画像アップロードボタン */}
        <button
          className="bg-gradient-to-r from-blue-500/50 to-purple-500/50 hover:from-blue-500/70 hover:to-purple-500/70 text-white rounded-md px-4 py-2 backdrop-blur-md transition flex items-center gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessingImage}
        >
          {isProcessingImage ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              処理中...
            </>
          ) : (
            <>
              <Camera size={20} />
              画像花火
            </>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
      
      {/* アップロード画像のプレビュー */}
      {uploadedImage && (
        <div className="absolute top-20 right-4 z-20 bg-black/50 rounded-lg p-2 backdrop-blur-md">
          <div className="text-white text-xs mb-1">アップロード画像</div>
          <img 
            src={uploadedImage} 
            alt="Uploaded" 
            className="w-32 h-32 object-contain rounded border border-white/20"
          />
          <button
            className="mt-2 w-full bg-purple-500/50 hover:bg-purple-500/70 text-white text-xs py-1 rounded transition"
            onClick={() => {
              const img = document.createElement('img');
              img.onload = () => {
                const points = imageToPoints(img as HTMLImageElement);
                if (points.length > 0 && canvasRef.current) {
                  const canvas = canvasRef.current;
                  const groupedPoints = groupPointsByColor(points);
                  let delay = 0;
                  
                  groupedPoints.forEach((group) => {
                    setTimeout(() => {
                      const x = canvas.width * (0.3 + Math.random() * 0.4);
                      launchCustomFirework(x, canvas.height / 2, 150, group);
                    }, delay);
                    delay += 200;
                  });
                }
              };
              img.src = uploadedImage;
            }}
          >
            もう一度打ち上げる
          </button>
        </div>
      )}
      
      {/* カラーパレット */}
      {showColorPicker && isDrawMode && (
        <div className="absolute top-20 left-4 z-20 bg-black/50 rounded-lg p-3 backdrop-blur-md">
          <div className="grid grid-cols-4 gap-2">
            {predefinedColors.map((color) => (
              <button
                key={color}
                className={`w-10 h-10 rounded-lg border-2 transition ${
                  selectedColor === color ? 'border-white scale-110' : 'border-transparent hover:border-white/50'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* ヒント表示 */}
      {isDrawMode && drawPoints.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center pointer-events-none">
          <div className="text-2xl mb-2">✨ 花火を描いてみよう！ ✨</div>
          <div className="text-sm opacity-75">
            画面に絵を描いて、上にフリックするか「打ち上げる」ボタンを押すと花火になります
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0 }} />
      <canvas
        ref={drawRef}
        style={{ 
          position: 'fixed', 
          inset: 0, 
          pointerEvents: isDrawMode ? 'auto' : 'none',
          cursor: isDrawMode ? (isEraser ? 'crosshair' : 'crosshair') : 'default'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};

export default FireworksWorld;
