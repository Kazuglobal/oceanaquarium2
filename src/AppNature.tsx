import React, { useState, useRef } from 'react';
import NatureWorld from './scenes/NatureWorld';
import { Upload, Plus, Minus, Sun, Moon, Cloud, Leaf, Snowflake, CloudSun } from 'lucide-react';

interface ImageInfo {
  url: string;
  count: number;
  scale: number;
}

const AppNature: React.FC = () => {
  // 状態管理
  const [season, setSeason] = useState<'spring' | 'summer' | 'autumn' | 'winter'>('spring');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day');
  const [uploadedImages, setUploadedImages] = useState<ImageInfo[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像アップロード処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        const newImage: ImageInfo = {
          url: event.target.result,
          count: 1, // デフォルトは1つ
          scale: 1.0 // デフォルトスケール
        };
        setUploadedImages([...uploadedImages, newImage]);
      }
    };

    reader.readAsDataURL(file);
  };

  // 季節に対応する背景色を取得、ボタンのスタイルに使用

  // 時間帯に対応する背景色を取得
  const getTimeColor = () => {
    switch(timeOfDay) {
      case 'morning': return 'rgba(255, 250, 205, 0.3)';
      case 'day': return 'rgba(255, 255, 255, 0.3)';
      case 'evening': return 'rgba(255, 160, 122, 0.3)';
      case 'night': return 'rgba(25, 25, 112, 0.3)';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  };

  // 時間帯に対応するアイコンを取得
  const getTimeIcon = () => {
    switch(timeOfDay) {
      case 'morning': return <CloudSun size={16} />;
      case 'day': return <Sun size={16} />;
      case 'evening': return <Cloud size={16} />;
      case 'night': return <Moon size={16} />;
      default: return <Sun size={16} />;
    }
  };

  // 季節に対応するアイコンを取得
  const getSeasonIcon = () => {
    switch(season) {
      case 'spring': return <Leaf size={16} color="#90EE90" />;
      case 'summer': return <Sun size={16} color="#FFD700" />;
      case 'autumn': return <Leaf size={16} color="#D2691E" />;
      case 'winter': return <Snowflake size={16} color="#E6E6FA" />;
      default: return <Leaf size={16} />;
    }
  };

  return (
    <>
      {/* 3Dシーン */}
      <NatureWorld 
        season={season} 
        timeOfDay={timeOfDay} 
        uploadedImages={uploadedImages} 
      />
      
      {/* ファイル入力（非表示） */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      {/* 設定パネル切り替えボタン */}
      <button
        onClick={() => setShowPanel(v => !v)}
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
        {showPanel ? '× 閉じる' : 
          <>
            {getSeasonIcon()}
            {getTimeIcon()}
            <span>しぜんのせかい設定</span>
          </>
        }
      </button>
      
      {/* 設定パネル */}
      {showPanel && (
        <div style={{ 
          position: 'fixed', 
          left: 20, 
          top: 20, 
          zIndex: 15, 
          background: 'rgba(0,0,0,0.85)', 
          borderRadius: 10, 
          padding: 16, 
          boxShadow: '0 4px 24px #0008', 
          minWidth: 260,
          color: '#fff'
        }}>
          <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 18, marginBottom: 12 }}>しぜんのせかい</h3>
            
            {/* 季節選択 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, marginBottom: 4, opacity: 0.8 }}>季節:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'spring', label: '春', color: '#90EE90', icon: <Leaf size={14} /> },
                  { key: 'summer', label: '夏', color: '#32CD32', icon: <Sun size={14} /> },
                  { key: 'autumn', label: '秋', color: '#D2691E', icon: <Leaf size={14} /> },
                  { key: 'winter', label: '冬', color: '#E6E6FA', icon: <Snowflake size={14} /> }
                ].map(item => (
                  <button 
                    key={item.key}
                    onClick={() => setSeason(item.key as any)}
                    style={{
                      background: season === item.key ? `${item.color}` : 'rgba(255,255,255,0.1)',
                      color: season === item.key ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 時間帯選択 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, marginBottom: 4, opacity: 0.8 }}>時間:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'morning', label: '朝', icon: <CloudSun size={14} /> },
                  { key: 'day', label: '昼', icon: <Sun size={14} /> },
                  { key: 'evening', label: '夕', icon: <Cloud size={14} /> },
                  { key: 'night', label: '夜', icon: <Moon size={14} /> }
                ].map(item => (
                  <button 
                    key={item.key}
                    onClick={() => setTimeOfDay(item.key as any)}
                    style={{
                      background: timeOfDay === item.key ? getTimeColor() : 'rgba(255,255,255,0.1)',
                      color: timeOfDay === item.key && item.key !== 'night' ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 画像アップロード */}
          <div>
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
            
            {/* 画像制御 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uploadedImages.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  background: 'rgba(255,255,255,0.08)', 
                  padding: '4px 6px', 
                  borderRadius: 4 
                }}>
                  <img 
                    src={item.url} 
                    alt='' 
                    width={32} 
                    height={32} 
                    style={{ objectFit: 'cover', borderRadius: 4 }} 
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>数:</span>
                    <Minus 
                      size={14} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setUploadedImages(prev => prev.map((it,i) => 
                        i===idx ? { ...it, count: Math.max(1, it.count-1) } : it
                      ))}
                    />
                    <span>{item.count}</span>
                    <Plus 
                      size={14} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setUploadedImages(prev => prev.map((it,i) => 
                        i===idx ? { ...it, count: it.count+1 } : it
                      ))}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>大きさ:</span>
                    <Minus 
                      size={14} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setUploadedImages(prev => prev.map((it,i) => 
                        i===idx ? { ...it, scale: Math.max(0.2, +(it.scale-0.1).toFixed(1)) } : it
                      ))}
                    />
                    <span>{item.scale.toFixed(1)}</span>
                    <Plus 
                      size={14} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setUploadedImages(prev => prev.map((it,i) => 
                        i===idx ? { ...it, scale: +(it.scale+0.1).toFixed(1) } : it
                      ))}
                    />
                  </div>
                </div>
              ))}
              {uploadedImages.length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', padding: '10px 0' }}>
                  画像をアップロードすると自然の世界に表示されます
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppNature;
