import React, { useRef, useState } from 'react';
import { Upload, Plus, Minus, Cloud, Sun, Umbrella, Snowflake, Clock } from 'lucide-react';
import SkyWorld from './scenes/SkyWorld';

const AppSky: React.FC = () => {
  // アップロードされた画像の管理
  const [images, setImages] = useState<{ url: string; count: number; scale: number }[]>([]);
  // パネルの表示状態
  const [panelOpen, setPanelOpen] = useState(false);
  // 天気の状態
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy'>('sunny');
  // 時間帯
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像アップロード処理
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
      {/* 空の世界3Dシーン */}
      <SkyWorld 
        uploadedImages={images} 
        weatherType={weather}
        timeOfDay={timeOfDay}
      />
      
      {/* 画像アップロード用の非表示入力 */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      
      {/* 設定パネル開閉ボタン */}
      <button
        onClick={() => setPanelOpen(v => !v)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'rgba(100,150,255,0.7)',
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        {panelOpen ? '× 閉じる' : <><Upload size={20} /> 画像・設定</>}
      </button>
      
      {/* 設定パネル */}
      {panelOpen && (
        <div style={{ 
          position: 'fixed', 
          left: 20, 
          top: 20, 
          zIndex: 15, 
          background: 'rgba(100,150,255,0.85)', 
          borderRadius: 10, 
          padding: 16, 
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)', 
          width: 280
        }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: 'white', 
            fontSize: 18, 
            borderBottom: '1px solid rgba(255,255,255,0.3)', 
            paddingBottom: 5 
          }}>
            そらのせかい 設定
          </h3>
          
          {/* 画像アップロードボタン */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 10px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 15,
              width: '100%'
            }}
          >
            <Upload size={16} /> とりやいきものをついか
          </button>
          
          {/* 天気設定 */}
          <div style={{ marginBottom: 15 }}>
            <div style={{ color: 'white', marginBottom: 5, fontSize: 14 }}>てんきをえらぶ:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <WeatherButton 
                icon={<Sun size={16} />} 
                label="はれ" 
                selected={weather === 'sunny'}
                onClick={() => setWeather('sunny')}
              />
              <WeatherButton 
                icon={<Cloud size={16} />} 
                label="くもり" 
                selected={weather === 'cloudy'}
                onClick={() => setWeather('cloudy')}
              />
              <WeatherButton 
                icon={<Umbrella size={16} />} 
                label="あめ" 
                selected={weather === 'rainy'}
                onClick={() => setWeather('rainy')}
              />
              <WeatherButton 
                icon={<Snowflake size={16} />} 
                label="ゆき" 
                selected={weather === 'snowy'}
                onClick={() => setWeather('snowy')}
              />
            </div>
          </div>
          
          {/* 時間帯設定 */}
          <div style={{ marginBottom: 15 }}>
            <div style={{ color: 'white', marginBottom: 5, fontSize: 14 }}>じかんたいをえらぶ:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <TimeButton 
                icon={<Clock size={16} />} 
                label="あさ" 
                selected={timeOfDay === 'morning'}
                onClick={() => setTimeOfDay('morning')}
              />
              <TimeButton 
                icon={<Clock size={16} />} 
                label="ひるま" 
                selected={timeOfDay === 'day'}
                onClick={() => setTimeOfDay('day')}
              />
              <TimeButton 
                icon={<Clock size={16} />} 
                label="ゆうがた" 
                selected={timeOfDay === 'evening'}
                onClick={() => setTimeOfDay('evening')}
              />
              <TimeButton 
                icon={<Clock size={16} />} 
                label="よる" 
                selected={timeOfDay === 'night'}
                onClick={() => setTimeOfDay('night')}
              />
            </div>
          </div>
          
          {/* アップロードした画像の設定 */}
          {images.length > 0 && (
            <>
              <div style={{ color: 'white', marginBottom: 5, fontSize: 14 }}>アップロードした画像:</div>
              <div style={{ maxHeight: 150, overflowY: 'auto', paddingRight: 5 }}>
                {images.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '6px 8px', 
                    borderRadius: 6,
                    marginBottom: 5
                  }}>
                    <img 
                      src={item.url} 
                      alt='' 
                      width={32} 
                      height={32} 
                      style={{ objectFit: 'cover', borderRadius: 4 }} 
                    />
                    
                    {/* 数量調整 */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      color: '#fff',
                      background: 'rgba(0,0,0,0.1)',
                      padding: '2px 4px',
                      borderRadius: 4
                    }}>
                      <Minus 
                        size={14} 
                        onClick={() => setImages(prev => 
                          prev.map((it, i) => 
                            i === idx ? { ...it, count: Math.max(1, it.count - 1) } : it
                          )
                        )}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, minWidth: 14, textAlign: 'center' }}>{item.count}</span>
                      <Plus 
                        size={14} 
                        onClick={() => setImages(prev => 
                          prev.map((it, i) => 
                            i === idx ? { ...it, count: Math.min(10, it.count + 1) } : it
                          )
                        )}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    
                    {/* 大きさ調整 */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      color: '#fff',
                      background: 'rgba(0,0,0,0.1)',
                      padding: '2px 4px',
                      borderRadius: 4
                    }}>
                      <Minus 
                        size={14} 
                        onClick={() => setImages(prev => 
                          prev.map((it, i) => 
                            i === idx ? { ...it, scale: Math.max(0.2, parseFloat((it.scale - 0.1).toFixed(1))) } : it
                          )
                        )}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, minWidth: 24, textAlign: 'center' }}>
                        {item.scale.toFixed(1)}x
                      </span>
                      <Plus 
                        size={14} 
                        onClick={() => setImages(prev => 
                          prev.map((it, i) => 
                            i === idx ? { ...it, scale: Math.min(5, parseFloat((it.scale + 0.1).toFixed(1))) } : it
                          )
                        )}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    
                    {/* 削除ボタン */}
                    <button
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      style={{
                        marginLeft: 'auto',
                        background: 'rgba(255,100,100,0.3)',
                        border: 'none',
                        borderRadius: 4,
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: 12
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* 説明 */}
          <div style={{ 
            marginTop: 10, 
            padding: 8, 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: 6, 
            fontSize: 12, 
            color: 'white' 
          }}>
            <p style={{ margin: '0 0 5px 0' }}>💡 操作方法:</p>
            <p style={{ margin: 0 }}>• ドラッグ: カメラを回す</p>
            <p style={{ margin: 0 }}>• スクロール: ズームイン/アウト</p>
            <p style={{ margin: 0 }}>• 画像アップロード: オリジナルの鳥や生き物を追加</p>
          </div>
        </div>
      )}
    </>
  );
};

// 天気選択ボタンコンポーネント
interface WeatherButtonProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const WeatherButton: React.FC<WeatherButtonProps> = ({ icon, label, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: selected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
      border: 'none',
      borderRadius: 6,
      padding: '5px 8px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      flex: 1,
      fontSize: 11,
      transition: 'all 0.2s'
    }}
  >
    {icon}
    {label}
  </button>
);

// 時間帯選択ボタンコンポーネント
interface TimeButtonProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const TimeButton: React.FC<TimeButtonProps> = ({ icon, label, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: selected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
      border: 'none',
      borderRadius: 6,
      padding: '5px 8px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      flex: '1 0 40%',
      fontSize: 11,
      transition: 'all 0.2s'
    }}
  >
    {icon}
    {label}
  </button>
);

export default AppSky;
