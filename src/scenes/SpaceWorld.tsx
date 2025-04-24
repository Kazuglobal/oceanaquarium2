import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import OrbitControls from './OrbitControls';

interface SpaceWorldProps {
  uploadedImages?: { url: string; count: number; scale: number }[];
}

const PLANETS = [
  { name: '木星', size: 2.2, x: -4, y: 0, color: 0xc2b280 },
  { name: '金星', size: 1.5, x: -1, y: 0, color: 0xf3e2a9 },
  { name: '月', size: 0.8, x: 1.5, y: 0, color: 0xcfcfcf },
  { name: '地球', size: 1, x: 4, y: 0, color: 0x8b7b6b },
];

interface MovingSprite {
  sprite: THREE.Sprite;
  vx: number;
  vy: number;
}

const SpaceWorld: React.FC<SpaceWorldProps> = ({ uploadedImages = [] }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const imageGroupRef = useRef<THREE.Group>();
  const movingSpritesRef = useRef<MovingSprite[]>([]);

  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    // 背景画像を10秒ごとに自動切替
    const bgList = [
      '/images/space1.jpg',
      '/images/space2.jpg',
      '/images/space3.jpg',
      '/images/space4.jpg',
      '/images/space5.jpg',
    ];
    let bgIdx = 0;
    const loader = new THREE.TextureLoader();
    let bgTimeout: number;
    const setBg = (idx: number) => {
      loader.load(bgList[idx], (texture) => {
        scene.background = texture;
      });
    };
    setBg(bgIdx);
    function scheduleNextBg() {
      bgTimeout = window.setTimeout(() => {
        bgIdx = (bgIdx + 1) % bgList.length;
        setBg(bgIdx);
        scheduleNextBg();
      }, 30000); // 30秒ごと
    }
    scheduleNextBg();

    // カメラ
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 10;

    // ライト
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // 惑星
    const planetMeshes: THREE.Mesh[] = [];
    PLANETS.forEach((planet, i) => {
      const geometry = new THREE.SphereGeometry(planet.size, 48, 48);
      const material = new THREE.MeshStandardMaterial({ color: planet.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(planet.x, planet.y, 0);
      mesh.userData = { name: planet.name };
      scene.add(mesh);
      planetMeshes.push(mesh);
    });

    // 星のパーティクル
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 400;
    const starVertices = [];
    for (let i = 0; i < starCount; i++) {
      starVertices.push(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -Math.random() * 10
      );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ---------------- 流れ星 ----------------
    interface ShootingStar {
      head: THREE.Sprite;
      tail: THREE.Line;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
    }

    const shootingStars: ShootingStar[] = [];

    const tailInitPositions = new Float32Array(20 * 3); // 20 points tail
    const tailGeometryTemplate = new THREE.BufferGeometry();
    tailGeometryTemplate.setAttribute('position', new THREE.BufferAttribute(tailInitPositions, 3));
    const tailMaterialTemplate = new THREE.LineBasicMaterial({ color: 0xfffbe6, transparent: true, linewidth: 1 });

    const spriteMaterial = new THREE.SpriteMaterial({ color: 0xffffff });

    function spawnShootingStar() {
      // ランダム開始位置
      const x = (Math.random() - 0.5) * 25;
      const y = Math.random() * 10 + 6;
      const z = -Math.random() * 5 - 2;
      // 方向
      const angle = Math.random() > 0.5 ? -Math.PI / 4 : -3 * Math.PI / 4;
      const vx = Math.cos(angle) * (Math.random() * 0.35 + 0.25);
      const vy = Math.sin(angle) * (Math.random() * 0.22 + 0.12);

      // head sprite
      const head = new THREE.Sprite(spriteMaterial.clone());
      head.scale.set(0.5, 0.5, 0.5);
      head.position.set(x, y, z);

      // tail line
      const tailGeo = tailGeometryTemplate.clone();
      const tailMat = tailMaterialTemplate.clone();
      tailMat.opacity = 0.9;
      const tail = new THREE.Line(tailGeo, tailMat);

      scene.add(head);
      scene.add(tail);

      shootingStars.push({ head, tail, vx, vy, life: 0, maxLife: Math.random() * 1.2 + 1 });
    }

    let shootingTimer = 0;
    let shootingInterval = Math.random() * 2.5 + 1.5; // 次の生成まで

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current?.appendChild(renderer.domElement);

    // Group for uploaded images
    const imgGroup = new THREE.Group();
    scene.add(imgGroup);
    imageGroupRef.current = imgGroup;

    // カメラ操作: OrbitControls
    // @ts-ignore
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    // --- 惑星ドラッグ＆スケール ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selected: THREE.Mesh | null = null;
    let isDragging = false;

    // --- Tooltip DOM ---
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '6px 10px';
    tooltip.style.background = 'rgba(0,0,0,0.8)';
    tooltip.style.color = '#fff';
    tooltip.style.borderRadius = '6px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.fontSize = '13px';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.18s';
    tooltip.style.whiteSpace = 'pre-line';
    mountRef.current?.appendChild(tooltip);

    const toNDC = (event: MouseEvent | PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      toNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes);
      if (intersects.length > 0 && !isDragging) {
        const obj = intersects[0].object as THREE.Mesh;
        const { name, fact } = obj.userData as { name: string; fact?: string };
        tooltip.innerText = `${name}${fact ? `\n${fact}` : ''}`;
        tooltip.style.left = `${e.clientX + 14}px`;
        tooltip.style.top = `${e.clientY + 12}px`;
        tooltip.style.opacity = '1';
      } else {
        tooltip.style.opacity = '0';
      }
      // ドラッグ中は移動
      if (isDragging && selected) {
        raycaster.setFromCamera(mouse, camera);
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const pos = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, pos);
        selected.position.copy(pos);
        tooltip.style.opacity = '0'; // ドラッグ中は非表示
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      toNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes);
      if (intersects.length > 0) {
        selected = intersects[0].object as THREE.Mesh;
        isDragging = true;
        controls.enabled = false;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      selected = null;
      controls.enabled = true;
    };

    const onWheel = (e: WheelEvent) => {
      toNDC(e as unknown as MouseEvent);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes);
      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh;
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        obj.scale.multiplyScalar(delta);
      }
    };

    const handleSpriteTouch = (e: PointerEvent) => {
      toNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const sprites = imageGroupRef.current?.children || [];
      const hits = raycaster.intersectObjects(sprites);
      if (hits.length) {
        const obj = hits[0].object as THREE.Sprite;
        const entry = movingSpritesRef.current.find(it => it.sprite === obj);
        if (entry) {
          const speed = Math.hypot(entry.vx, entry.vy);
          const angle = Math.random() * Math.PI * 2;
          entry.vx = Math.cos(angle) * speed;
          entry.vy = Math.sin(angle) * speed;
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerdown', handleSpriteTouch);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // リサイズ対応
    const handleResize = () => {
      const w = mountRef.current?.clientWidth || window.innerWidth;
      const h = mountRef.current?.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 惑星回転アニメーション
    let frameId: number;
    const animate = () => {
      controls.update();
      planetMeshes.forEach((mesh, i) => {
        mesh.rotation.y += 0.003 + i * 0.001;
      });
      stars.rotation.z += 0.0007;

      // 流れ星の出現管理
      shootingTimer += 1 / 60;
      if (shootingTimer > shootingInterval) {
        shootingTimer = 0;
        shootingInterval = Math.random() * 2.5 + 1.5;
        spawnShootingStar();
      }
      // 流れ星のアニメーション
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        // move head
        s.head.position.x += s.vx;
        s.head.position.y += s.vy;
        // update tail positions (shift existing)
        const posAttr = s.tail.geometry.getAttribute('position') as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        // shift by 3 (x,y,z)
        for (let j = array.length - 3; j >= 3; j -= 3) {
          array[j] = array[j - 3];
          array[j + 1] = array[j - 2];
          array[j + 2] = array[j - 1];
        }
        array[0] = s.head.position.x;
        array[1] = s.head.position.y;
        array[2] = s.head.position.z;
        posAttr.needsUpdate = true;

        // fade tail opacity over life
        const p = s.life / s.maxLife;
        (s.tail.material as THREE.LineBasicMaterial).opacity = (1 - p) * 0.9;
        s.head.material.opacity = (1 - p) * 0.9;

        // update life
        s.life += 1 / 60;
        if (s.life > s.maxLife) {
          scene.remove(s.head);
          scene.remove(s.tail);
          shootingStars.splice(i, 1);
        }
      }

      // --- Move uploaded sprites with bounce ---
      movingSpritesRef.current.forEach((obj) => {
        const boundX = 12;
        const boundY = 8;
        let nextX = obj.sprite.position.x + obj.vx;
        let nextY = obj.sprite.position.y + obj.vy;
        if (nextX > boundX || nextX < -boundX) {
          obj.vx *= -1;
          nextX = obj.sprite.position.x + obj.vx;
        }
        if (nextY > boundY || nextY < -boundY) {
          obj.vy *= -1;
          nextY = obj.sprite.position.y + obj.vy;
        }
        obj.sprite.position.x = nextX;
        obj.sprite.position.y = nextY;
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // クリーンアップ: イベント削除、キャンバス削除、コンテキスト解放
    return () => {
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerdown', handleSpriteTouch);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', handleSpriteTouch);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (bgTimeout) clearTimeout(bgTimeout);
      // キャンバスをDOMから削除
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // WebGLコンテキストを強制解放
      if ((renderer as any).forceContextLoss) {
        (renderer as any).forceContextLoss();
      }
      renderer.dispose();
    };
  }, []);

  // 更新：アップロード画像が変わったらスプライトを再生成
  useEffect(() => {
    if (!imageGroupRef.current) return;
    const group = imageGroupRef.current;
    group.clear();
    const removeBgToTexture = (img: HTMLImageElement): THREE.Texture => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture(img);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const bgR = data[0], bgG = data[1], bgB = data[2];
      const threshold = 30;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (
          Math.abs(r - bgR) < threshold &&
          Math.abs(g - bgG) < threshold &&
          Math.abs(b - bgB) < threshold
        ) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    };

    // Generate sprites based on count and scale settings
    uploadedImages.forEach(({ url, count, scale }) => {
      for (let i = 0; i < count; i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const tex = removeBgToTexture(img);
          const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
          const sprite = new THREE.Sprite(mat);
          sprite.scale.set(scale, scale, scale);
          sprite.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 6,
            -Math.random() * 4
          );
          group.add(sprite);
          const speed = 0.01 + Math.random() * 0.02;
          const angle = Math.random() * Math.PI * 2;
          movingSpritesRef.current.push({
            sprite,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          });
        };
        img.src = url;
      }
    });
  }, [uploadedImages]);

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}>
      {/* 惑星名の表示など追加可能 */}
    </div>
  );
};

export default SpaceWorld;
