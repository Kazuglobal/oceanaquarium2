import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import OrbitControls from './OrbitControls';

const PLANETS = [
  { name: '木星', size: 2.2, x: -4, y: 0, color: 0xc2b280 },
  { name: '金星', size: 1.5, x: -1, y: 0, color: 0xf3e2a9 },
  { name: '月', size: 0.8, x: 1.5, y: 0, color: 0xcfcfcf },
  { name: '地球', size: 1, x: 4, y: 0, color: 0x8b7b6b },
];

const SpaceWorld: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    // 背景画像を設定
    const loader = new THREE.TextureLoader();
    loader.load('/images/space-planets.jpg', (texture) => {
      scene.background = texture;
    });

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

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
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

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      mountRef.current?.removeChild(tooltip);
      shootingStars.forEach((s) => {
        scene.remove(s.head);
        scene.remove(s.tail);
      });
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}>
      {/* 惑星名の表示など追加可能 */}
      <div style={{position:'absolute',top:20,left:0,right:0,textAlign:'center',color:'#fff',fontWeight:'bold',fontSize:'2rem',textShadow:'0 2px 10px #000'}}>うちゅうのせかい</div>
    </div>
  );
};

export default SpaceWorld;
