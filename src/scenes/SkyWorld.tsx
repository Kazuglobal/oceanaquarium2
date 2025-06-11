import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore - OrbitControlsをany型として扱う
import OrbitControls from './OrbitControls';

interface SkyWorldProps {
  uploadedImages?: { url: string; count: number; scale: number }[];
  weatherType?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
}

interface BirdSprite {
  sprite: THREE.Sprite;
  vx: number;
  vy: number;
  flapSpeed: number;
  flapPhase: number;
  originalScale: { x: number; y: number };
}

interface RainDrop {
  mesh: THREE.Mesh;
  velocity: number;
  trail?: THREE.Line;
  length: number;
  initialY: number;
  splashTimer?: number;
  splashMesh?: THREE.Mesh;
}

interface SnowflakeSystem {
  meshes: THREE.InstancedMesh[];
  data: Array<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    rotation: THREE.Vector3;
    size: number;
    textureIndex: number;
    wobblePhase: number;
    wobbleSpeed: number;
    wobbleAmount: number;
  }>;
}

interface CloudMesh {
  mesh: THREE.Object3D;
  speed: number;
}

const SkyWorld: React.FC<SkyWorldProps> = ({ 
  uploadedImages = [], 
  weatherType = 'sunny',
  timeOfDay = 'day'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const birdGroupRef = useRef<THREE.Group>();
  const cloudsRef = useRef<CloudMesh[]>([]);
  const birdsRef = useRef<BirdSprite[]>([]);
  const rainDropsRef = useRef<RainDrop[]>([]);
  const snowflakesRef = useRef<SnowflakeSystem>();
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  // 空のグラデーションカラー
  const getSkyColors = () => {
    switch (timeOfDay) {
      case 'morning':
        return { top: new THREE.Color(0x95c6e8), bottom: new THREE.Color(0xffefd5) };
      case 'day':
        return { top: new THREE.Color(0x4a99e8), bottom: new THREE.Color(0xafd8f8) };
      case 'evening':
        return { top: new THREE.Color(0x1a2980), bottom: new THREE.Color(0xff7a8a) };
      case 'night':
        return { top: new THREE.Color(0x0a1744), bottom: new THREE.Color(0x283593) };
      default:
        return { top: new THREE.Color(0x4a99e8), bottom: new THREE.Color(0xafd8f8) };
    }
  };

  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;

    // シーン作成
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 空のグラデーション背景
    const { top, bottom } = getSkyColors();
    const skyGeo = new THREE.BoxGeometry(100, 100, 100);
    const skyMaterial = [
      new THREE.MeshBasicMaterial({ color: bottom, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: bottom, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: top, side: THREE.BackSide }), // 上
      new THREE.MeshBasicMaterial({ color: bottom, side: THREE.BackSide }), // 下
      new THREE.MeshBasicMaterial({ color: bottom, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: bottom, side: THREE.BackSide }),
    ];
    const skyBox = new THREE.Mesh(skyGeo, skyMaterial);
    scene.add(skyBox);

    // カメラ
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 20;
    camera.position.y = 5;
    cameraRef.current = camera;

    // ライト
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current?.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // コントロール
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.enablePan = false;

    // 地面（丘のような形状）
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8bc34a,
      wireframe: false,
      side: THREE.DoubleSide
    });
    
    // 地面をでこぼこに
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // y座標を変更（頂点のx,zに応じて）
      const x = vertices[i];
      const z = vertices[i + 2];
      const distance = Math.sqrt(x * x + z * z);
      vertices[i + 1] = Math.sin(distance * 0.2) * 0.5 * Math.exp(-distance * 0.1);
    }
    groundGeometry.computeVertexNormals();
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    scene.add(ground);

    // 鳥のグループ
    const birdGroup = new THREE.Group();
    scene.add(birdGroup);
    birdGroupRef.current = birdGroup;

    // デフォルトの鳥を追加
    const birdTextureLoader = new THREE.TextureLoader();
    const createBird = (textureUrl: string) => {
      birdTextureLoader.load(textureUrl, (texture) => {
        const birdMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const birdSprite = new THREE.Sprite(birdMaterial);
        const scale = 0.5 + Math.random() * 1;
        birdSprite.scale.set(scale, scale, 1);
        
        // ランダムな位置に配置
        birdSprite.position.set(
          (Math.random() - 0.5) * 30,
          Math.random() * 10 + 5,
          (Math.random() - 0.5) * 20
        );
        
        birdGroup.add(birdSprite);
        
        // 鳥の動きパラメータ
        birdsRef.current.push({
          sprite: birdSprite,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.05,
          flapSpeed: 0.1 + Math.random() * 0.1,
          flapPhase: Math.random() * Math.PI * 2,
          originalScale: { x: scale, y: scale }
        });
      });
    };
    
    // デフォルトの鳥テクスチャ
    const defaultBirdTextures = [
      '/images/bird1.png',
      '/images/bird2.png', 
      '/images/bird3.png'
    ];
    
    // バックアップ用内蔵テクスチャ（画像がない場合）
    const createDefaultBirds = () => {
      for (let i = 0; i < 10; i++) {
        // Basic colored circle as a bird
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.arc(16, 16, 8, 0, Math.PI * 2);
          
          // Random bird colors
          const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fill();
          
          // Simple wings
          ctx.beginPath();
          ctx.ellipse(8, 16, 5, 2, 0, 0, Math.PI * 2);
          ctx.ellipse(24, 16, 5, 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        const scale = 0.5 + Math.random() * 1;
        sprite.scale.set(scale, scale, 1);
        
        sprite.position.set(
          (Math.random() - 0.5) * 30,
          Math.random() * 10 + 5,
          (Math.random() - 0.5) * 20
        );
        
        birdGroup.add(sprite);
        
        birdsRef.current.push({
          sprite: sprite,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.05,
          flapSpeed: 0.1 + Math.random() * 0.1,
          flapPhase: Math.random() * Math.PI * 2,
          originalScale: { x: scale, y: scale }
        });
      }
    };
    
    // 鳥を作成
    try {
      defaultBirdTextures.forEach(texture => createBird(texture));
    } catch (e) {
      console.error('Failed to load bird textures:', e);
      createDefaultBirds();
    }

    // 雲の作成
    const createClouds = () => {
      const cloudGeometry = new THREE.SphereGeometry(1, 16, 16);
      
      for (let i = 0; i < 15; i++) {
        const cloudMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.8 + Math.random() * 0.2
        });
        
        // 雲の塊を作る
        const cloudGroup = new THREE.Group() as unknown as THREE.Mesh;
        const segments = 3 + Math.floor(Math.random() * 5);
        
        for (let j = 0; j < segments; j++) {
          const segment = new THREE.Mesh(cloudGeometry, cloudMaterial);
          const scale = 0.5 + Math.random() * 1.5;
          segment.scale.set(scale, scale * 0.6, scale);
          segment.position.set(
            j * 0.9 * Math.random(),
            Math.random() * 0.2,
            Math.random() * 0.5
          );
          cloudGroup.add(segment);
        }
        
        // 雲の位置
        cloudGroup.position.set(
          (Math.random() - 0.5) * 40,
          Math.random() * 5 + 10,
          (Math.random() - 0.5) * 40
        );
        
        const scaleFactor = 1 + Math.random() * 2;
        cloudGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        scene.add(cloudGroup);
        
        cloudsRef.current.push({
          mesh: cloudGroup,
          speed: 0.01 + Math.random() * 0.02
        });
      }
    };
    
    // 気象条件に応じて雲を作成
    if (weatherType === 'sunny') {
      // 少ない雲
      for (let i = 0; i < 5; i++) createClouds();
    } else if (weatherType === 'cloudy' || weatherType === 'rainy' || weatherType === 'snowy') {
      // たくさんの雲
      for (let i = 0; i < 20; i++) createClouds();
    }

    // 雨を作成 - よりリアルなバージョン
    const createRain = () => {
      if (weatherType !== 'rainy') return;
      
      // 雨粒のパラメータを設定
      const rainCount = 1000; // より多くの雨粒
      
      // 雨のマテリアル
      const rainMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaceff,
        transparent: true,
        opacity: 0.55
      });
      
      // 雨の大きさバリエーションを作成
      const rainSizes = [
        { radius: 0.01, length: 0.6, trailLength: 1.0 },  // 小さい雨粒
        { radius: 0.015, length: 0.8, trailLength: 1.4 },  // 中くらいの雨粒
        { radius: 0.02, length: 1.0, trailLength: 1.8 }    // 大きい雨粒
      ];
      
      // 雨滴が地面に当たった時のスプラッシュ用のジオメトリ
      const splashGeometry = new THREE.CircleGeometry(0.1, 8);
      const splashMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      
      // 雨粒を生成
      for (let i = 0; i < rainCount; i++) {
        // ランダムなサイズの雨粒タイプを選択
        const rainType = rainSizes[Math.floor(Math.random() * rainSizes.length)];
        
        // 下サイドが少し細くなる円錐形状に
        const customRainGeometry = new THREE.CylinderGeometry(
          rainType.radius * 0.5,  // 上側半径
          rainType.radius,        // 下側半径
          rainType.length,        // 長さ
          6                       // 円の分割数
        );
        
        // 雨滴のメッシュを作成
        const raindrop = new THREE.Mesh(customRainGeometry, rainMaterial);
        
        // ランダムな初期位置
        const x = (Math.random() - 0.5) * 100;
        const y = Math.random() * 50 + 10; // 高めから降らせる
        const z = (Math.random() - 0.5) * 100;
        
        raindrop.position.set(x, y, z);
        // 雨は少し傾いて落ちるように
        raindrop.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        raindrop.rotation.z = (Math.random() - 0.5) * 0.1;
        
        scene.add(raindrop);
        
        // 雨粒の速度は大きさに比例
        const velocity = 0.3 + Math.random() * 0.4 + rainType.radius * 5;
        
        // 雨粒の後ろに紋（トレイル）を作成
        if (Math.random() > 0.3) { // たまにトレイルなしの雨粒も作る
          // 紋のライン用の餘白
          const trailGeometry = new THREE.BufferGeometry();
          const trailLength = rainType.trailLength;
          const trailSegments = 8;
          const trailPositions = new Float32Array((trailSegments + 1) * 3);
          
          // 紋の初期位置を設定
          for (let j = 0; j <= trailSegments; j++) {
            const ratio = j / trailSegments;
            trailPositions[j * 3] = 0;
            trailPositions[j * 3 + 1] = ratio * trailLength;
            trailPositions[j * 3 + 2] = 0;
          }
          
          trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
          
          // 紋のグラデーション用のマテリアル
          const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.3,
            linewidth: 1
          });
          
          const trail = new THREE.Line(trailGeometry, trailMaterial);
          trail.position.copy(raindrop.position);
          trail.position.y += rainType.length / 2; // 雨粒の上部から始まるように調整
          trail.rotation.copy(raindrop.rotation);
          scene.add(trail);
          
          rainDropsRef.current.push({
            mesh: raindrop,
            velocity: velocity,
            trail: trail,
            length: rainType.length,
            initialY: y
          });
        } else {
          rainDropsRef.current.push({
            mesh: raindrop,
            velocity: velocity,
            length: rainType.length,
            initialY: y
          });
        }
      }
    };

    // 雪を作成 - よりリアルなバージョン
    const createSnow = () => {
      if (weatherType !== 'snowy') return;

      // 雪片のテクスチャを生成する関数
      const createSnowflakeTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.CanvasTexture(canvas);
        
        // 背景を透明に
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 雪片のタイプをランダムに選択
        const snowflakeType = Math.floor(Math.random() * 3);
        
        if (snowflakeType === 0) {
          // 六角形の雪の結晶
          const radius = canvas.width * 0.4;
          ctx.strokeStyle = '#ffffff';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          
          // 中心点
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2);
          ctx.fill();
          
          // 6つの主軸
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            // メインの軸
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius, 0);
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 枝を追加
            for (let j = 0; j < 4; j++) {
              const branchStart = radius * (0.3 + j * 0.15);
              const branchLength = radius * 0.2;
              const branchAngle = Math.PI / 6;
              
              ctx.beginPath();
              ctx.moveTo(branchStart, 0);
              ctx.lineTo(branchStart + branchLength * Math.cos(branchAngle), branchLength * Math.sin(branchAngle));
              ctx.lineWidth = 2;
              ctx.stroke();
              
              ctx.beginPath();
              ctx.moveTo(branchStart, 0);
              ctx.lineTo(branchStart + branchLength * Math.cos(-branchAngle), branchLength * Math.sin(-branchAngle));
              ctx.stroke();
              
              // 小さな枝をさらに追加
              if (j === 1 || j === 3) {
                const microBranchLength = radius * 0.1;
                const microBranchAngle = Math.PI / 4;
                const microX = branchStart + branchLength * Math.cos(branchAngle) * 0.7;
                const microY = branchLength * Math.sin(branchAngle) * 0.7;
                
                ctx.beginPath();
                ctx.moveTo(microX, microY);
                ctx.lineTo(
                  microX + microBranchLength * Math.cos(branchAngle + microBranchAngle),
                  microY + microBranchLength * Math.sin(branchAngle + microBranchAngle)
                );
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(microX, -microY);
                ctx.lineTo(
                  microX + microBranchLength * Math.cos(-branchAngle - microBranchAngle),
                  -microY + microBranchLength * Math.sin(-branchAngle - microBranchAngle)
                );
                ctx.stroke();
              }
            }
            
            ctx.restore();
          }
          
          // 淡い光沢効果
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.9);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(0.5, 'rgba(220, 240, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(210, 230, 255, 0)');
          
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (snowflakeType === 1) {
          // 星型の雪片
          const outerRadius = canvas.width * 0.4;
          const innerRadius = outerRadius * 0.4;
          const points = 8;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          
          for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / points) * i;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.closePath();
          ctx.fill();
          
          // 光の効果を加える
          ctx.globalCompositeOperation = 'screen';
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(180, 200, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, outerRadius * 0.8, 0, Math.PI * 2);
          ctx.fill();
          
        } else {
          // 丸い雪片（グラデーション付き）
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, canvas.width * 0.4
          );
          
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.3, 'rgba(250, 250, 255, 0.9)');
          gradient.addColorStop(0.7, 'rgba(240, 240, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(230, 240, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, canvas.width * 0.4, 0, Math.PI * 2);
          ctx.fill();
          
          // 反射効果
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(centerX - 10, centerY - 10, canvas.width * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // ほんのりぼかし効果を加える（現実の雪は完全にシャープではない）
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'blur(1px)';
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, canvas.width * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
      };
      
      // 複数種類の雪片テクスチャを作成
      const snowTextures = Array(5).fill(0).map(() => createSnowflakeTexture());
      
      // 雪片のデータ構造を初期化
      const snowflakeCount = 2000; // より多くの雪片
      type SnowflakeData = {
        position: THREE.Vector3;
        velocity: THREE.Vector3;
        rotation: THREE.Vector3;
        size: number;
        textureIndex: number;
        wobblePhase: number;
        wobbleSpeed: number;
        wobbleAmount: number;
      };
      const snowflakeData: SnowflakeData[] = [];
      
      // 雪片パラメータの初期化
      for (let i = 0; i < snowflakeCount; i++) {
        // 空間内にランダム配置
        const position = new THREE.Vector3(
          (Math.random() - 0.5) * 60,
          Math.random() * 40 + (Math.random() * 10), // 高さに変化をつける
          (Math.random() - 0.5) * 60
        );
        
        // 雪片の大きさにばらつきを持たせる（小さな雪片から大きな結晶まで）
        const size = 0.2 + Math.random() * Math.random() * 0.8;
        
        // 落下速度も雪片ごとに変化
        // 大きな雪片はやや速く、小さな雪片はゆっくり落ちる傾向に
        const fallSpeed = 0.02 + Math.random() * 0.05 + size * 0.03;
        
        // 水平方向の揺れ - 風の影響
        const horizontalDrift = (Math.random() - 0.5) * 0.02;
        
        // 速度ベクトル
        const velocity = new THREE.Vector3(
          horizontalDrift,
          -fallSpeed,
          (Math.random() - 0.5) * 0.02
        );
        
        // 回転速度 - 雪片が回転しながら落ちる
        const rotation = new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        );
        
        // 雪片データを追加
        snowflakeData.push({
          position,
          velocity,
          rotation,
          size,
          textureIndex: Math.floor(Math.random() * snowTextures.length),
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.01 + Math.random() * 0.03, // ふわふわした動きの速さ
          wobbleAmount: 0.05 + Math.random() * 0.15 * (1 - size) // 小さい雪片ほどよく揺れる
        });
      }
      
      // 平面ジオメトリを使用して雪片を表現
      const snowflakeGeometry = new THREE.PlaneGeometry(1, 1);
      const snowflakeMeshes: THREE.InstancedMesh[] = [];
      
      // テクスチャごとに異なるマテリアルとインスタンスメッシュを作成
      snowTextures.forEach((texture, textureIndex) => {
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        
        // 該当テクスチャを使用する雪片の数をカウント
        const countForTexture = snowflakeData.filter(flake => flake.textureIndex === textureIndex).length;
        
        if (countForTexture === 0) return;
        
        // インスタンス化されたメッシュを作成
        const snowInstancedMesh = new THREE.InstancedMesh(
          snowflakeGeometry,
          material,
          countForTexture
        );
        
        // 各インスタンスの位置と回転を設定
        let instanceIndex = 0;
        const dummy = new THREE.Object3D();
        
        snowflakeData.forEach(flake => {
          if (flake.textureIndex === textureIndex) {
            dummy.position.copy(flake.position);
            dummy.scale.set(flake.size, flake.size, 1);
            dummy.rotation.set(
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2
            );
            dummy.updateMatrix();
            snowInstancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
            instanceIndex++;
          }
        });
        
        snowInstancedMesh.instanceMatrix.needsUpdate = true;
        scene.add(snowInstancedMesh);
        snowflakeMeshes.push(snowInstancedMesh);
      });
      
      // 参照用にシステム情報を保存
      snowflakesRef.current = {
        meshes: snowflakeMeshes,
        data: snowflakeData
      };
    };
    
    // 気象条件に応じて作成
    createRain();
    createSnow();

    // リサイズ対応
    const handleResize = () => {
      const width = mountRef.current?.clientWidth || window.innerWidth;
      const height = mountRef.current?.clientHeight || window.innerHeight;
      
      if (camera && renderer) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);

    // アニメーション
    let frameId: number;
    const animate = () => {
      // 鳥のアニメーション
      birdsRef.current.forEach(bird => {
        if (!bird.sprite) return;
        
        // 鳥の位置更新
        bird.sprite.position.x += bird.vx;
        bird.sprite.position.y += bird.vy;
        
        // 羽ばたきアニメーション
        bird.flapPhase += bird.flapSpeed;
        const flapFactor = Math.sin(bird.flapPhase) * 0.2;
        
        bird.sprite.scale.y = bird.originalScale.y * (1 + flapFactor);
        
        // 境界チェック
        if (bird.sprite.position.x > 50) bird.sprite.position.x = -50;
        if (bird.sprite.position.x < -50) bird.sprite.position.x = 50;
        if (bird.sprite.position.y > 30) bird.vy = -Math.abs(bird.vy);
        if (bird.sprite.position.y < 2) bird.vy = Math.abs(bird.vy);
        
        // 向きをスピードに合わせる
        if (bird.vx !== 0) {
          bird.sprite.scale.x = bird.originalScale.x * (bird.vx > 0 ? -1 : 1);
        }
      });
      
      // 雲のアニメーション
      cloudsRef.current.forEach(cloud => {
        if (!cloud.mesh) return;
        cloud.mesh.position.x += cloud.speed;
        
        // 境界チェック
        if (cloud.mesh.position.x > 50) cloud.mesh.position.x = -50;
      });
      
      // 雨のアニメーション - よりリアルなバージョン
      rainDropsRef.current.forEach(drop => {
        if (!drop.mesh) return;
        
        // 雨粒の落下速度を調整 - 重力加速を再現
        const gravity = 0.003; // 微小な重力加速
        drop.velocity += gravity;
        
        // 雨粒の位置更新
        drop.mesh.position.y -= drop.velocity;
        
        // 風の影響も加える（時間とともに変化）
        const time = Date.now() * 0.001;
        const windFactor = Math.sin(time * 0.3) * 0.005;
        drop.mesh.position.x += windFactor;
        
        // 軸を少し動かして各雨粒が少し違う方向に落ちるように
        drop.mesh.rotation.z += windFactor * 10;
        
        // トレイル（紋）の更新
        if (drop.trail) {
          drop.trail.position.copy(drop.mesh.position);
          drop.trail.position.y += drop.length / 2;
          drop.trail.rotation.copy(drop.mesh.rotation);
          
          // トレイルの透明度を速度に応じて調整
          const trailOpacity = Math.min(0.5, drop.velocity * 2);
          (drop.trail.material as THREE.Material).opacity = trailOpacity;
        }
        
        // 雨粒が地面に達したらスプラッシュを表示
        if (drop.mesh.position.y < -5) {
          // 既存のスプラッシュがあれば削除
          if (drop.splashMesh) {
            scene.remove(drop.splashMesh);
          }
          
          // スプラッシュを作成
          const splashSize = 0.1 + Math.random() * 0.2;
          const splashGeometry = new THREE.CircleGeometry(splashSize, 8);
          const splashMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
          });
          
          const splash = new THREE.Mesh(splashGeometry, splashMaterial);
          splash.position.set(
            drop.mesh.position.x,
            -5.01, // 地面の少し上
            drop.mesh.position.z
          );
          splash.rotation.x = -Math.PI / 2; // 地面に水平に
          scene.add(splash);
          
          // スプラッシュのアニメーション用タイマー
          drop.splashMesh = splash;
          drop.splashTimer = 20; // フレーム数
          
          // トレイルがあれば不透明に
          if (drop.trail) {
            (drop.trail.material as THREE.Material).opacity = 0;
          }
          
          // 雨粒を上に戻す
          drop.mesh.position.y = drop.initialY;
          drop.mesh.position.x = (Math.random() - 0.5) * 80;
          drop.mesh.position.z = (Math.random() - 0.5) * 80;
          
          // 速度をリセット
          drop.velocity = 0.3 + Math.random() * 0.4;
        }
        
        // スプラッシュのアニメーション
        if (drop.splashTimer && drop.splashTimer > 0 && drop.splashMesh) {
          drop.splashTimer--;
          
          // スプラッシュのサイズを大きく
          drop.splashMesh.scale.x += 0.05;
          drop.splashMesh.scale.z += 0.05;
          
          // 透明度を下げる
          (drop.splashMesh.material as THREE.Material).opacity -= 0.02;
          
          // アニメーション終了時にスプラッシュを削除
          if (drop.splashTimer === 0) {
            scene.remove(drop.splashMesh);
            drop.splashMesh = undefined;
          }
        }
      });
      
      // 雪のアニメーション - インスタンス方式
      if (snowflakesRef.current) {
        const dummy = new THREE.Object3D();
        const { meshes, data } = snowflakesRef.current;
        
        // 風の影響を計算（時間とともに変化）
        const time = Date.now() * 0.001;
        const windStrength = Math.sin(time * 0.3) * 0.2;
        const windX = Math.sin(time * 0.5) * windStrength;
        const windZ = Math.cos(time * 0.7) * windStrength * 0.5;
        
        // 各雪片のデータを更新
        data.forEach(flake => {
          // 位置の更新
          flake.position.add(flake.velocity);
          
          // ふわふわと揺れる動き
          flake.wobblePhase += flake.wobbleSpeed;
          const wobbleX = Math.sin(flake.wobblePhase) * flake.wobbleAmount;
          const wobbleZ = Math.cos(flake.wobblePhase * 0.7) * flake.wobbleAmount;
          
          // 風の影響を加える
          flake.position.x += wobbleX + windX;
          flake.position.z += wobbleZ + windZ;
          
          // 回転も更新
          flake.rotation.x += flake.rotation.x;
          flake.rotation.y += flake.rotation.y;
          flake.rotation.z += flake.rotation.z;
          
          // 地面に達したら上に戻す
          if (flake.position.y < -5) {
            flake.position.y = 30 + Math.random() * 10;
            flake.position.x = (Math.random() - 0.5) * 60;
            flake.position.z = (Math.random() - 0.5) * 60;
            
            // 風の影響で横に流された場合も範囲内に戻す
            if (Math.abs(flake.position.x) > 100) {
              flake.position.x = (Math.random() - 0.5) * 60;
            }
            if (Math.abs(flake.position.z) > 100) {
              flake.position.z = (Math.random() - 0.5) * 60;
            }
          }
        });
        
        // 各メッシュのインスタンス行列を更新
        meshes.forEach((mesh, meshIndex) => {
          let instanceIndex = 0;
          
          data.forEach(flake => {
            if (flake.textureIndex === meshIndex) {
              dummy.position.copy(flake.position);
              dummy.scale.set(flake.size, flake.size, 1);
              dummy.rotation.set(
                flake.rotation.x * time * 10, 
                flake.rotation.y * time * 10, 
                flake.rotation.z * time * 10
              );
              dummy.updateMatrix();
              mesh.setMatrixAt(instanceIndex, dummy.matrix);
              instanceIndex++;
            }
          });
          
          mesh.instanceMatrix.needsUpdate = true;
        });
      }
      
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    
    animate();

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      
      // レンダラーをDOMから削除
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // WebGLコンテキストを解放
      renderer.dispose();
      
      // メモリの解放
      birdsRef.current = [];
      cloudsRef.current = [];
      rainDropsRef.current = [];
    };
  }, [weatherType, timeOfDay]);

  // 画像アップロード効果
  useEffect(() => {
    if (!birdGroupRef.current) return;
    
    // アップロードされた画像を鳥として追加
    uploadedImages.forEach(({ url, count, scale }) => {
      for (let i = 0; i < count; i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          
          const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
          const sprite = new THREE.Sprite(material);
          
          sprite.scale.set(scale, scale, 1);
          sprite.position.set(
            (Math.random() - 0.5) * 30,
            Math.random() * 15 + 5,
            (Math.random() - 0.5) * 20
          );
          
          birdGroupRef.current?.add(sprite);
          
          birdsRef.current.push({
            sprite,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.05,
            flapSpeed: 0.1 + Math.random() * 0.1,
            flapPhase: Math.random() * Math.PI * 2,
            originalScale: { x: scale, y: scale }
          });
        };
        img.src = url;
      }
    });
  }, [uploadedImages]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'absolute', 
        inset: 0 
      }}
    />
  );
};

export default SkyWorld;
