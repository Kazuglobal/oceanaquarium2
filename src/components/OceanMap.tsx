import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map } from 'lucide-react';
import { MAPBOX_ACCESS_TOKEN } from '../constants/apiKeys';

interface OceanMapProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  availableLocations: string[];
  showMap: boolean;
  onToggleMap: () => void;
}

interface LocationCoordinate {
  lat: number;
  lon: number;
  name: string;
}

const OceanMap: React.FC<OceanMapProps> = ({ 
  selectedLocation, 
  onLocationSelect,
  availableLocations,
  showMap,
  onToggleMap
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; location: string }[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const mapInitializedRef = useRef<boolean>(false);
  
  // Mapboxアクセストークン
  const mapboxToken = MAPBOX_ACCESS_TOKEN;
  
  // 各海域の座標
  const oceanLocations: LocationCoordinate[] = [
    { name: 'Pacific Ocean', lat: 0, lon: -160 },
    { name: 'Atlantic Ocean', lat: 30, lon: -45 },
    { name: 'Indian Ocean', lat: -10, lon: 75 },
    { name: 'Southern Ocean', lat: -60, lon: 0 },
    { name: 'Arctic Ocean', lat: 80, lon: 0 },
    { name: 'Mediterranean Sea', lat: 35, lon: 18 },
    { name: 'South China Sea', lat: 15, lon: 115 },
    { name: 'Gulf of Mexico', lat: 25, lon: -90 },
    { name: 'Caribbean Sea', lat: 15, lon: -75 },
    { name: 'Baltic Sea', lat: 60, lon: 20 }
  ].filter(loc => availableLocations.includes(loc.name));
  
  // マーカーを作成する関数
  const createMarkers = (mapInstance: mapboxgl.Map) => {
    // 既存のマーカーをクリア
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];
    
    // 新しいマーカーを追加
    oceanLocations.forEach(location => {
      // マーカー要素を作成
      const el = document.createElement('div');
      el.style.backgroundColor = location.name === selectedLocation ? '#ff0000' : '#3FB1CE';
      el.style.width = '15px';
      el.style.height = '15px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      
      // マーカーを作成
      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lon, location.lat])
        .addTo(mapInstance);
      
      // マーカーのDOMノードを取得
      const markerElement = marker.getElement();
      
      // クリックイベントを追加
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation(); // イベントの伝播を停止
        console.log(`Marker clicked: ${location.name}`);
        
        // 既存のポップアップを削除
        if (popupRef.current) {
          popupRef.current.remove();
        }
        
        // 新しいポップアップを作成
        const popup = new mapboxgl.Popup({ 
          closeButton: true,
          closeOnClick: false
        })
          .setLngLat([location.lon, location.lat])
          .setHTML(`
            <div style="padding: 5px;">
              <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${location.name}</h3>
              <p style="margin: 5px 0 0; font-size: 12px;">緯度: ${location.lat.toFixed(2)}, 経度: ${location.lon.toFixed(2)}</p>
            </div>
          `)
          .addTo(mapInstance);
        
        popupRef.current = popup;
        
        // 選択した海域を更新
        onLocationSelect(location.name);
      });
      
      // マーカーを保存
      markersRef.current.push({ marker, location: location.name });
    });
  };
  
  // 地図の初期化
  useEffect(() => {
    if (!mapContainer.current || mapInitializedRef.current || !showMap) return;
    
    try {
      // アクセストークンを設定
      mapboxgl.accessToken = mapboxToken;
      
      // 地図を初期化
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [0, 20],
        zoom: 1.5
      });
      
      map.current = mapInstance;
      
      // 地図の読み込み完了時にマーカーを追加
      mapInstance.on('load', () => {
        console.log('Map loaded');
        createMarkers(mapInstance);
        
        // 選択された海域に移動
        centerMapOnSelectedLocation(selectedLocation);
        
        mapInitializedRef.current = true;
      });
      
      // クリーンアップ
      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
          mapInitializedRef.current = false;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [showMap]);
  
  // 選択された海域に地図を移動
  const centerMapOnSelectedLocation = (locationName: string) => {
    if (!map.current) return;
    
    const location = oceanLocations.find(loc => loc.name === locationName);
    if (location) {
      console.log(`Centering map on: ${locationName}`);
      map.current.flyTo({
        center: [location.lon, location.lat],
        zoom: 3,
        essential: true,
        duration: 1500
      });
    }
  };
  
  // 選択された海域が変更されたときに地図を移動し、マーカーの色を更新
  useEffect(() => {
    if (!map.current || !mapInitializedRef.current || !showMap) return;
    
    console.log(`Selected location changed to: ${selectedLocation}`);
    
    // マーカーの色を更新
    markersRef.current.forEach(({ marker, location }) => {
      const element = marker.getElement();
      element.style.backgroundColor = location === selectedLocation ? '#ff0000' : '#3FB1CE';
    });
    
    // 地図を選択された海域に移動
    centerMapOnSelectedLocation(selectedLocation);
    
  }, [selectedLocation, showMap]);
  
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">海洋マップ</h3>
        <button
          onClick={onToggleMap}
          className={`p-1.5 rounded text-white ${showMap ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} transition`}
          title={showMap ? '地図を非表示' : '地図を表示'}
        >
          <Map size={14} />
        </button>
      </div>
      
      {showMap && (
        <div style={{ width: '100%', height: '300px', marginBottom: '20px' }}>
          {mapboxToken ? (
            <div 
              ref={mapContainer} 
              style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #ccc'
              }} 
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
              Mapbox APIキーが設定されていません
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OceanMap;
