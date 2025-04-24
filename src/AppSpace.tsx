import React, { useRef, useState } from 'react';
import { Upload, Plus, Minus } from 'lucide-react';
import SpaceWorld from './scenes/SpaceWorld';

const AppSpace: React.FC = () => {
  // Uploaded images with count and scale controls
  const [images, setImages] = useState<{ url: string; count: number; scale: number }[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setImages((prev) => [...prev, { url, count: 1, scale: 1 }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <SpaceWorld uploadedImages={images} />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <button
        onClick={() => setPanelOpen(v => !v)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'rgba(0,0,0,0.7)',
          border: 'none',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 20,
          fontWeight: 'bold',
        }}
      >
        {panelOpen ? '× 閉じる' : <><Upload size={20} /> 画像追加・設定</>}
      </button>
      {panelOpen && (
        <div style={{ position: 'fixed', left: 20, top: 20, zIndex: 15, background: 'rgba(0,0,0,0.85)', borderRadius: 10, padding: 16, boxShadow: '0 4px 24px #0008', minWidth: 260 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 10px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
              width: '100%'
            }}
          >
            <Upload size={16} /> 画像追加
          </button>
          {/* Controls for count and scale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {images.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: 4 }}>
                <img src={item.url} alt='' width={32} height={32} style={{ objectFit: 'cover', borderRadius: 4 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
                  <Minus size={14} onClick={() => setImages(prev => prev.map((it,i) => i===idx ? { ...it, count: Math.max(1, it.count-1) } : it))} />
                  <span>{item.count}</span>
                  <Plus size={14} onClick={() => setImages(prev => prev.map((it,i) => i===idx ? { ...it, count: it.count+1 } : it))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
                  <Minus size={14} onClick={() => setImages(prev => prev.map((it,i) => i===idx ? { ...it, scale: Math.max(0.2, +(it.scale-0.1).toFixed(1)) } : it))} />
                  <span>{item.scale.toFixed(1)}</span>
                  <Plus size={14} onClick={() => setImages(prev => prev.map((it,i) => i===idx ? { ...it, scale: +(it.scale+0.1).toFixed(1) } : it))} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AppSpace;
