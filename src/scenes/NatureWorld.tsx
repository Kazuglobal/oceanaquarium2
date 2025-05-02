import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore - OrbitControlsをany型として扱う
import OrbitControls from './OrbitControls';

interface NatureWorldProps {
  uploadedImages?: { url: string; count: number; scale: number }[];
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
}

interface Butterfly {
  mesh: THREE.Group;
  wingSpeed: number;
  wingPhase: number;
  path: THREE.Vector3[];
  pathIndex: number;
  moveSpeed: number;
}

interface Plant {
  mesh: THREE.Group;
  growthRate: number;
  maxScale: number;
  swaySpeed: number;
  swayAmount: number;
  swayPhase: number;
}

const NatureWorld: React.FC<NatureWorldProps> = ({ 
  uploadedImages = [], 
  season = 'spring',
  timeOfDay = 'day'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const plantsRef = useRef<Plant[]>([]);
  const butterfliesRef = useRef<Butterfly[]>([]);
  const groundRef = useRef<THREE.Mesh>();
  const terrainGroupRef = useRef<THREE.Group>();
  
  // 季節によって色や環境を変更
  const getSeasonalColors = () => {
    switch(season) {
      case 'spring':
        return {
          grass: 0x7ccd7c,
          leaves: 0x90ee90,
          sky: new THREE.Color(0x87ceeb),
          flowers: [0xff69b4, 0xffff00, 0xff6347]
        };
      case 'summer':
        return {
          grass: 0x228b22,
          leaves: 0x006400,
          sky: new THREE.Color(0x1e90ff),
          flowers: [0xff0000, 0xff8c00, 0x9932cc]
        };
      case 'autumn':
        return {
          grass: 0xdaa520,
          leaves: 0xd2691e,
          sky: new THREE.Color(0x87cefa),
          flowers: [0xdc143c, 0xff8c00, 0xb8860b]
        };
      case 'winter':
        return {
          grass: 0xe6e6fa,
          leaves: 0xffffff,
          sky: new THREE.Color(0xb0c4de),
          flowers: [0xf0f8ff, 0xe0ffff, 0xf0ffff]
        };
      default:
        return {
          grass: 0x7ccd7c,
          leaves: 0x90ee90,
          sky: new THREE.Color(0x87ceeb),
          flowers: [0xff69b4, 0xffff00, 0xff6347]
        };
    }
  };
  
  // 時間帯によって光の状態を変更
  const getDayLightSettings = () => {
    switch(timeOfDay) {
      case 'morning':
        return { 
          color: 0xfffacd,
          intensity: 0.8,
          position: { x: -5, y: 3, z: 5 },
          ambientIntensity: 0.4
        };
      case 'day':
        return { 
          color: 0xffffff,
          intensity: 1.0,
          position: { x: 0, y: 10, z: 0 },
          ambientIntensity: 0.6
        };
      case 'evening':
        return { 
          color: 0xffa07a,
          intensity: 0.7,
          position: { x: 5, y: 3, z: -5 },
          ambientIntensity: 0.3
        };
      case 'night':
        return { 
          color: 0x708090,
          intensity: 0.2,
          position: { x: 0, y: 5, z: 0 },
          ambientIntensity: 0.1
        };
      default:
        return { 
          color: 0xffffff,
          intensity: 1.0,
          position: { x: 0, y: 10, z: 0 },
          ambientIntensity: 0.6
        };
    }
  };

  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;

    // シーン作成
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // カメラ
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 季節の色を取得
    const seasonalColors = getSeasonalColors();
    
    // 背景空
    const skyColor = seasonalColors.sky;
    scene.background = skyColor;
    
    // フォグ効果（霞）を追加
    if (season === 'winter') {
      scene.fog = new THREE.Fog(0xf8f8ff, 10, 50);
    } else if (season === 'autumn') {
      scene.fog = new THREE.Fog(0xf0e68c, 20, 70);
    } else {
      scene.fog = new THREE.Fog(skyColor, 30, 100);
    }

    // 光源設定
    const lightSettings = getDayLightSettings();
    
    // 環境光（全体的な明るさ）
    const ambientLight = new THREE.AmbientLight(0xffffff, lightSettings.ambientIntensity);
    scene.add(ambientLight);
    
    // 主光源（太陽/月）
    const mainLight = new THREE.DirectionalLight(lightSettings.color, lightSettings.intensity);
    mainLight.position.set(
      lightSettings.position.x,
      lightSettings.position.y,
      lightSettings.position.z
    );
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    scene.add(mainLight);
    
    // 地面用の平面ジオメトリ
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 64, 64);
    
    // 起伏を作成
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // xzに応じて起伏を計算
      const x = vertices[i];
      const z = vertices[i + 2];
      
      // パーリンノイズ風の丘を作る
      vertices[i + 1] = Math.sin(x * 0.1) * Math.sin(z * 0.1) * 2
                      + Math.sin(x * 0.05 + 0.3) * Math.sin(z * 0.2) * 1.5
                      + Math.sin(x * 0.15 + 0.1) * Math.sin(z * 0.1 + 0.1) * 0.5;
    }
    
    // 頂点法線を再計算（影のため）
    groundGeometry.computeVertexNormals();
    
    // 地面のマテリアル
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: seasonalColors.grass,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    // 地面メッシュ
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // 水平に寝かせる
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;
    
    // 地形グループ（木、草、花など）
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);
    terrainGroupRef.current = terrainGroup;
    
    // 木を生成する関数
    const createDeciduousTree = (x: number, z: number, baseSize: number = 1) => {
      const treeGroup = new THREE.Group();

      // Randomize size slightly
      const size = baseSize * (0.8 + Math.random() * 0.4); // 80% to 120% of baseSize

      // --- Trunk ---
      const trunkHeight = (1.5 + Math.random() * 0.5) * size; // More height variation
      const trunkRadiusBottom = (0.2 + Math.random() * 0.1) * size; // More thickness variation
      const trunkRadiusTop = trunkRadiusBottom * (0.7 + Math.random() * 0.2); // Tapering
      const trunkGeometry = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBottom, trunkHeight, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown
        roughness: 0.9,
        metalness: 0.1
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      trunk.position.y = trunkHeight / 2; // Center the trunk geometry
      treeGroup.add(trunk);

      // --- Branches & Leaves ---
      const leavesMaterial = new THREE.MeshStandardMaterial({
        color: seasonalColors.leaves, // Use seasonal color
        roughness: 0.8,
        metalness: 0,
        side: THREE.DoubleSide // Render inside of leaves if needed
      });

      const addLeafCluster = (position: THREE.Vector3, clusterSize: number) => {
        // Use Icosahedron for slightly more complex shape than sphere
        const leavesGeometry = new THREE.IcosahedronGeometry(clusterSize, 0);
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.copy(position);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        // Random rotation for variety
        leaves.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        treeGroup.add(leaves);
      };

      // Don't add leaves in winter
      if (season !== 'winter') {
        const numBranches = Math.floor(3 + Math.random() * 3); // 3 to 5 branches
        const branchStartHeight = trunkHeight * 0.5; // Branches start halfway up
        const branchMaxHeight = trunkHeight * 0.95; // Branches end near the top

        for (let i = 0; i < numBranches; i++) {
          // --- Branch ---
          const branchLength = (0.5 + Math.random() * 0.7) * size;
          const branchRadius = trunkRadiusTop * (0.3 + Math.random() * 0.3);
          const branchGeometry = new THREE.CylinderGeometry(branchRadius * 0.7, branchRadius, branchLength, 5);
          const branch = new THREE.Mesh(branchGeometry, trunkMaterial); // Use trunk material for branches
          branch.castShadow = true;
          branch.receiveShadow = true;

          // Position and Rotation
          const angleY = (i / numBranches) * Math.PI * 2 + (Math.random() - 0.5) * 0.5; // Spread around trunk
          const angleX = Math.PI / 4 + (Math.random() - 0.5) * (Math.PI / 6); // Angle upwards
          const branchHeight = branchStartHeight + Math.random() * (branchMaxHeight - branchStartHeight);

          // Calculate attachment point on trunk surface
          const attachRadius = trunkRadiusTop + (trunkRadiusBottom - trunkRadiusTop) * (1 - (branchHeight / trunkHeight)); // Interpolate radius at height
          const attachX = Math.cos(angleY) * attachRadius;
          const attachZ = Math.sin(angleY) * attachRadius;

          // Position branch relative to trunk center, then rotate
          branch.position.set(attachX, branchHeight, attachZ); // Start at trunk surface
          branch.rotation.set(0, -angleY, angleX); // Rotate outwards and upwards
          // Offset along its local Y axis (its length) to correctly position it
          branch.translateY(branchLength / 2);

          treeGroup.add(branch);

          // --- Leaf Cluster at Branch End ---
          const clusterSize = (0.4 + Math.random() * 0.4) * size;
          // Calculate leaf position based on branch end
          const leafPosition = new THREE.Vector3(0, branchLength, 0); // End of branch in local space
          leafPosition.applyQuaternion(branch.quaternion); // Rotate to world space orientation
          leafPosition.add(branch.position); // Add branch base position

          addLeafCluster(leafPosition, clusterSize);

          // Optional: Add a cluster partway along the branch
          if (Math.random() > 0.5) {
            const midClusterSize = clusterSize * 0.7;
            const midLeafPosition = new THREE.Vector3(0, branchLength * (0.4 + Math.random() * 0.3), 0);
            midLeafPosition.applyQuaternion(branch.quaternion);
            midLeafPosition.add(branch.position);
            addLeafCluster(midLeafPosition, midClusterSize);
          }
        }

        // Add a few clusters near the top of the trunk
        const numTopClusters = Math.floor(1 + Math.random() * 3); // 1 to 3 top clusters
        for (let i = 0; i < numTopClusters; i++) {
          const topClusterSize = (0.5 + Math.random() * 0.5) * size;
          const topClusterHeight = trunkHeight * (0.8 + Math.random() * 0.2);
          const topClusterRadius = trunkRadiusTop * (0.5 + Math.random()); // Spread out horizontally
          const topAngleY = Math.random() * Math.PI * 2;
          const topPosition = new THREE.Vector3(
            Math.cos(topAngleY) * topClusterRadius,
            topClusterHeight,
            Math.sin(topAngleY) * topClusterRadius
          );
          addLeafCluster(topPosition, topClusterSize);
        }
      } // End if not winter

      // 木の位置設定 (Position the whole group)
      treeGroup.position.set(x, 0, z);

      // 地面の高さに合わせる
      const groundY = getHeightAt(x, z);
      treeGroup.position.y = groundY;

      terrainGroup.add(treeGroup);

      // 植物リストに追加（木全体を揺らす）
      plantsRef.current.push({
        mesh: treeGroup,
        growthRate: 0,
        maxScale: 1, // Use 1 since size variation is now internal
        swaySpeed: 0.2 + Math.random() * 0.2, // Slightly slower sway for bigger trees
        swayAmount: 0.005 + Math.random() * 0.005, // Less sway amount
        swayPhase: Math.random() * Math.PI * 2
      });

      return treeGroup;
    };
    
    // Add new function for Pine Trees
    const createPineTree = (x: number, z: number, baseSize: number = 1) => {
        const treeGroup = new THREE.Group();
        const size = baseSize * (0.9 + Math.random() * 0.2); // Pine size variation

        // --- Trunk ---
        const trunkHeight = (2.0 + Math.random() * 1.0) * size; // Pines are often taller
        const trunkRadiusBottom = (0.15 + Math.random() * 0.1) * size;
        const trunkRadiusTop = trunkRadiusBottom * (0.4 + Math.random() * 0.2); // Stronger taper
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBottom, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321, // Darker brown for pine
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.position.y = trunkHeight / 2;
        treeGroup.add(trunk);

        // --- Needles (Cones) ---
        const needleMaterial = new THREE.MeshStandardMaterial({
            color: season === 'winter' ? 0x3f704d : 0x2e6b50, // Darker green, slightly different in winter
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        const numLayers = 5 + Math.floor(Math.random() * 3); // Number of cone layers
        let currentHeight = trunkHeight * 0.3; // Start layers partway up
        let currentRadius = trunkRadiusTop * 3 * size; // Initial layer radius

        for (let i = 0; i < numLayers; i++) {
            const layerHeight = (trunkHeight * 0.7) / numLayers * (0.8 + Math.random() * 0.4); // Vary layer height
            const layerRadius = currentRadius * (0.8 + Math.random() * 0.3); // Vary layer radius
            if (layerRadius < 0.1 * size) continue; // Skip if too small

            const coneGeometry = new THREE.ConeGeometry(layerRadius, layerHeight, 8);
            const cone = new THREE.Mesh(coneGeometry, needleMaterial);
            cone.castShadow = true;
            cone.receiveShadow = true;
            cone.position.y = currentHeight + layerHeight / 2; // Position layer
            treeGroup.add(cone);

            // Update for next layer
            currentHeight += layerHeight * (0.7 + Math.random() * 0.2); // Move up, less than full height for overlap
            currentRadius = layerRadius * (0.7 + Math.random() * 0.1); // Reduce radius for taper
        }

        // Position the tree
        treeGroup.position.set(x, 0, z);
        const groundY = getHeightAt(x, z);
        treeGroup.position.y = groundY;
        terrainGroup.add(treeGroup);

        // Add to plantsRef for swaying
        plantsRef.current.push({
            mesh: treeGroup,
            growthRate: 0,
            maxScale: 1,
            swaySpeed: 0.15 + Math.random() * 0.15, // Slower sway for pines
            swayAmount: 0.004 + Math.random() * 0.004, // Less sway
            swayPhase: Math.random() * Math.PI * 2
        });

        return treeGroup;
    };

    // x, z位置に応じた地面の高さを取得
    const getHeightAt = (x: number, z: number) => {
      // 簡易的な方法：sinを使用
      return Math.sin(x * 0.1) * Math.sin(z * 0.1) * 2
           + Math.sin(x * 0.05 + 0.3) * Math.sin(z * 0.2) * 1.5
           + Math.sin(x * 0.15 + 0.1) * Math.sin(z * 0.1 + 0.1) * 0.5;
    };
    
    // 花を生成する関数
    const createFlower = (x: number, z: number) => {
      const flowerGroup = new THREE.Group();
      const flowerColors = [0xff0000, 0x0000ff, 0x00ff00]; // Red, Blue, Green

      // 茎
      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
      const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.8
      });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = 0.25;
      stem.castShadow = true; // Add shadow casting
      flowerGroup.add(stem);

      // 花の中心
      const centerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const centerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        roughness: 0.5,
        metalness: 0.1
      });
      const center = new THREE.Mesh(centerGeometry, centerMaterial);
      center.position.y = 0.5;
      center.castShadow = true; // Add shadow casting
      flowerGroup.add(center);

      // 花びら
      //const petalColor = seasonalColors.flowers[Math.floor(Math.random() * seasonalColors.flowers.length)];
      const petalColor = flowerColors[Math.floor(Math.random() * flowerColors.length)]; // Use Red, Blue, Green

      // 冬は花を少なくする
      if (season !== 'winter') { // Petals exist except winter
        for (let i = 0; i < 6; i++) {
          const petalGeometry = new THREE.SphereGeometry(0.07, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
          const petalMaterial = new THREE.MeshStandardMaterial({
            color: petalColor,
            roughness: 0.8,
            side: THREE.DoubleSide
          });
          const petal = new THREE.Mesh(petalGeometry, petalMaterial);
          petal.castShadow = true; // Add shadow casting

          const angle = (i / 6) * Math.PI * 2;
          petal.position.x = Math.sin(angle) * 0.1;
          petal.position.z = Math.cos(angle) * 0.1;
          petal.position.y = 0.5;

          petal.rotation.x = Math.PI / 2;
          petal.rotation.y = -angle;

          flowerGroup.add(petal);
        }
      }

      // 葉っぱを追加
      const leafGeometry = new THREE.SphereGeometry(0.1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x32cd32,
        roughness: 0.8,
        side: THREE.DoubleSide
      });

      for (let i = 0; i < 2; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.castShadow = true; // Add shadow casting
        const leafAngle = Math.PI / 4 + i * Math.PI;
        leaf.position.x = Math.sin(leafAngle) * 0.05;
        leaf.position.z = Math.cos(leafAngle) * 0.05;
        leaf.position.y = 0.1 + Math.random() * 0.1; // Vary height slightly
        leaf.rotation.x = Math.PI / 3 + (Math.random() - 0.5) * 0.2;
        leaf.rotation.y = -leafAngle + Math.PI / 2;
        flowerGroup.add(leaf);
      }

      // Position the flower
      flowerGroup.position.set(x, 0, z);
      const groundY = getHeightAt(x, z);
      // Ensure flower base is slightly above ground
      flowerGroup.position.y = groundY + 0.01;

      // Only add if on relatively flat ground and not too high, AND only in spring/summer
      if (groundY > -1 && groundY < 5 && (season === 'spring' || season === 'summer')) {
        terrainGroup.add(flowerGroup);

        // Add to plantsRef for swaying
        plantsRef.current.push({
            mesh: flowerGroup,
            growthRate: 0,
            maxScale: 1,
            swaySpeed: 0.5 + Math.random() * 0.5,
            swayAmount: 0.02 + Math.random() * 0.02,
            swayPhase: Math.random() * Math.PI * 2
        });
      }
      // Note: Function doesn't need to return group if return value isn't used
    };
    
    // 蝶の生成
    const createButterfly = (x: number, y: number, z: number, wingSize: number = 0.3, bodyColor: number = 0xffa500) => {
      const butterflyGroup = new THREE.Group();
      
      // 蝶の体
      const bodyGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.5
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.x = Math.PI / 2; // 横向きに
      butterflyGroup.add(body);
      
      // 羽 - 左
      const leftWingGeometry = new THREE.CircleGeometry(wingSize, 16, 0, Math.PI);
      const wingMaterial = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x4169e1 : 0xff69b4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial);
      leftWing.position.set(-0.05, 0, 0);
      leftWing.rotation.y = Math.PI / 2;
      butterflyGroup.add(leftWing);
      
      // 羽 - 右
      const rightWingGeometry = new THREE.CircleGeometry(wingSize, 16, 0, Math.PI);
      const rightWing = new THREE.Mesh(rightWingGeometry, wingMaterial.clone());
      rightWing.position.set(0.05, 0, 0);
      rightWing.rotation.y = -Math.PI / 2;
      butterflyGroup.add(rightWing);
      
      // バタフライの位置設定
      butterflyGroup.position.set(x, y, z);
      
      // 動きのパラメータを設定
      const butterfly: Butterfly = {
        mesh: butterflyGroup,
        wingSpeed: 0.15 + Math.random() * 0.1,
        wingPhase: Math.random() * Math.PI * 2,
        // ランダムな飛行パスを生成
        path: Array(10).fill(0).map(() => new THREE.Vector3(
          x + (Math.random() - 0.5) * 6,
          y + 0.5 + Math.random() * 3,
          z + (Math.random() - 0.5) * 6
        )),
        pathIndex: 0,
        moveSpeed: 0.005 + Math.random() * 0.005
      };
      
      scene.add(butterflyGroup);
      butterfliesRef.current.push(butterfly);
      
      return butterfly;
    };
    
    // 自然環境を生成
    const populateNature = () => {
      // 木を生成 - 40本
      for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        const size = 0.7 + Math.random() * 0.7; // サイズのバリエーション
        if (Math.random() > 0.5) {
          createDeciduousTree(x, z, size);
        } else {
          createPineTree(x, z, size);
        }
      }
      
      // 花を生成 - より多く
      const flowerCount = season === 'winter' ? 30 : (season === 'autumn' ? 80 : 150);
      for (let i = 0; i < flowerCount; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        createFlower(x, z);
      }
      
      // 蝶を生成
      const butterflyCount = season === 'winter' ? 2 : (season === 'autumn' ? 5 : 10);
      for (let i = 0; i < butterflyCount; i++) {
        const x = (Math.random() - 0.5) * 30;
        const y = 2 + Math.random() * 3;
        const z = (Math.random() - 0.5) * 30;
        createButterfly(x, y, z);
      }
    };
    
    populateNature();
    
    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current?.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // カメラコントロール
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // 地面より下には行けないように
    
    // 画面リサイズ対応
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
      // 時間変数（風の動きなどに使用）
      const time = Date.now() * 0.001;
      
      // 植物のアニメーション（風による揺れ）
      plantsRef.current.forEach((plant) => {
        if (!plant.mesh) return;
        
        // 風の強さ（時間によって変化）
        const windStrength = Math.sin(time * 0.3) * 0.2;
        
        // 植物の揺れを更新
        plant.swayPhase += plant.swaySpeed * 0.01;
        
        // X軸方向の揺れ
        const swayX = Math.sin(plant.swayPhase) * plant.swayAmount * windStrength;
        // Z軸方向の揺れ
        const swayZ = Math.cos(plant.swayPhase * 0.7) * plant.swayAmount * windStrength * 0.5;
        
        // 植物全体を少し傾ける
        plant.mesh.rotation.x = swayX;
        plant.mesh.rotation.z = swayZ;
        
        // 成長効果（成長率が0より大きい場合）
        if (plant.growthRate > 0 && plant.mesh.scale.x < plant.maxScale) {
          const newScale = Math.min(plant.mesh.scale.x + plant.growthRate * 0.001, plant.maxScale);
          plant.mesh.scale.set(newScale, newScale, newScale);
        }
      });
      
      // 蝶のアニメーション
      butterfliesRef.current.forEach((butterfly) => {
        if (!butterfly.mesh) return;
        
        // 羽ばたきアニメーション
        butterfly.wingPhase += butterfly.wingSpeed;
        const wingAngle = Math.sin(butterfly.wingPhase) * Math.PI / 4;
        
        // 左右の羽
        if (butterfly.mesh.children.length >= 3) {
          butterfly.mesh.children[1].rotation.z = wingAngle;
          butterfly.mesh.children[2].rotation.z = -wingAngle;
        }
        
        // 経路に沿って移動
        const currentTarget = butterfly.path[butterfly.pathIndex];
        
        // 現在の位置
        const currentPos = butterfly.mesh.position.clone();
        
        // 目標位置への方向ベクトル
        const direction = currentTarget.clone().sub(currentPos);
        const distance = direction.length();
        
        // 一定距離に近づいたら次の目標点へ
        if (distance < 0.2) {
          butterfly.pathIndex = (butterfly.pathIndex + 1) % butterfly.path.length;
        } else {
          // 移動
          direction.normalize();
          butterfly.mesh.position.add(direction.multiplyScalar(butterfly.moveSpeed * distance));
          
          // 向きも調整
          if (direction.length() > 0.01) {
            const lookAtPos = butterfly.mesh.position.clone().add(direction);
            butterfly.mesh.lookAt(lookAtPos);
            butterfly.mesh.rotation.y += Math.PI / 2; // 蝶の体の向きを調整
          }
        }
      });
      
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [season, timeOfDay]);
  
  // ユーザーがアップロードした画像の処理
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // アップロードされた画像を簡易的に自然に溶け込ませる
    uploadedImages.forEach(({ url, count, scale }) => {
      for (let i = 0; i < count; i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // テクスチャ
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          
          // 素材
          const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            alphaTest: 0.5
          });
          
          // スプライト
          const sprite = new THREE.Sprite(material);
          
          // 位置とサイズの設定
          const x = (Math.random() - 0.5) * 40;
          const z = (Math.random() - 0.5) * 40;
          const y = 1 + Math.random() * 2;
          
          // アップロードされた画像を適切なサイズに調整
          sprite.scale.set(scale, scale * img.height / img.width, 1);
          sprite.position.set(x, y, z);
          
          // 地面の高さに合わせる
          const getHeightAt = (x: number, z: number) => {
            return Math.sin(x * 0.1) * Math.sin(z * 0.1) * 2
                 + Math.sin(x * 0.05 + 0.3) * Math.sin(z * 0.2) * 1.5
                 + Math.sin(x * 0.15 + 0.1) * Math.sin(z * 0.1 + 0.1) * 0.5;
          };
          
          const groundY = getHeightAt(x, z);
          sprite.position.y = groundY + y;
          
          // ランダムな回転
          sprite.material.rotation = Math.random() * Math.PI * 2;
          
          sceneRef.current?.add(sprite);
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

export default NatureWorld;
