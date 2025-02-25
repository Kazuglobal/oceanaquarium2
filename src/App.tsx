import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Upload, Plus, Minus, Fish as FishIcon, Maximize2, Minimize2, Settings, BookOpen, HelpCircle, Factory, Anchor, Trash } from 'lucide-react';

interface Fish {
  x: number;
  y: number;
  direction: number;
  targetDirection: number;
  speed: number;
  baseSpeed: number;
  yOffset: number;
  ySpeed: number;
  rotation: number;
  rotationSpeed: number;
  turnProgress: number;
  imageIndex: number;
  scale: number;
  baseScale: number;
  restTimer: number;
  isResting: boolean;
  isExcited: boolean;
  excitementTimer: number;
  isFollowing: boolean;
  targetX: number;
  targetY: number;
  flipProgress: number;
  isFlipping: boolean;
  flipDirection: number;
  targetRotation: number;
  currentRotation: number;
  speedMultiplier: number;
  targetSpeedMultiplier: number;
  speedChangeTimer: number;
  turnTimer: number;
  targetY2: number;
  yProgress: number;
  restProbability: number;
  restDuration: number;
  breathingPhase: number;
  cohesionWeight: number;
  alignmentWeight: number;
  separationWeight: number;
  neighborRadius: number;
  speciesType: 'fish' | 'crab' | 'jellyfish';
  verticalMovement: number;
  verticalSpeed: number;
  currentPhase: number;
  currentForce: { x: number; y: number };
  waterCurrentPhase: number;
  surpriseRadius: number;
  surpriseForce: { x: number; y: number };
  surpriseTimer: number;
  opacity: number;
  pollutionResistance: number;
  healthLevel: number;
  isDying: boolean;
  deathTimer: number;
}

interface FishType {
  image: HTMLImageElement | null;
  url: string;
  name: string;
  count: number;
  speedFactor: number;
  scale: number;
  speciesType: 'fish' | 'crab' | 'jellyfish';
}

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobbleOffset: number;
  wobbleSpeed: number;
}

// 汚染源のインターフェース
interface PollutionSource {
  type: 'factory' | 'boat' | 'trash';
  x: number;
  y: number;
  scale: number;
  active: boolean;
  pollutionRate: number;
  image: HTMLImageElement | null;
}

// クイズの質問と回答のインターフェース
interface QuizQuestion {
  category: 'pollution' | 'ecosystem' | 'all';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function calculateVector(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: x2 - x1,
    y: y2 - y1
  };
}

function calculateDistance(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalizeVector(vector: { x: number; y: number }) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return length > 0 ? { x: vector.x / length, y: vector.y / length } : { x: 0, y: 0 };
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const fishesRef = useRef<Fish[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const [pollutionLevel, setPollutionLevel] = useState(0);
  const [deadFishCount, setDeadFishCount] = useState(0);
  const [fishTypes, setFishTypes] = useState<FishType[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showCausesPanel, setShowCausesPanel] = useState(false);
  const [pollutionSources, setPollutionSources] = useState<PollutionSource[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const waterCurrentRef = useRef({ x: 0, y: 0 });
  const pollutionSourceImagesRef = useRef<{[key: string]: HTMLImageElement | null}>({
    factory: null,
    boat: null,
    trash: null
  });
  const [quizCategory, setQuizCategory] = useState<'pollution' | 'ecosystem' | 'all'>('all');
  const [quizCompleted, setQuizCompleted] = useState(false);

  // クイズの質問リスト
  const allQuizQuestions: QuizQuestion[] = [
    // 汚染に関する質問
    {
      category: 'pollution',
      question: "海洋汚染の主な原因は何ですか？",
      options: [
        "宇宙からの隕石",
        "陸地からの人間活動",
        "海底火山の噴火",
        "魚の排泄物"
      ],
      correctAnswer: 1,
      explanation: "海洋汚染の約80%は陸地からの人間活動によるものです。プラスチックごみ、化学物質、農業からの流出物などが主な原因です。"
    },
    {
      category: 'pollution',
      question: "プラスチックが海で完全に分解されるのにかかる時間はどれくらいですか？",
      options: [
        "約1年",
        "約10年",
        "約100年",
        "約450年以上"
      ],
      correctAnswer: 3,
      explanation: "多くのプラスチック製品は海で完全に分解されるのに450年以上かかります。その間、小さな破片になって海洋生物に害を与え続けます。"
    },
    {
      category: 'pollution',
      question: "海の生物にとって最も危険な汚染物質は何ですか？",
      options: [
        "プラスチック",
        "油",
        "農薬",
        "すべて危険"
      ],
      correctAnswer: 3,
      explanation: "これらすべての汚染物質は海洋生物に深刻な害を与えます。プラスチックは窒息や消化器官の詰まりを、油は呼吸困難や体温調節の問題を、農薬は神経系や生殖系の障害を引き起こします。"
    },
    {
      category: 'pollution',
      question: "海は地球の酸素をどれくらい生成していますか？",
      options: [
        "約10%",
        "約30%",
        "約50%以上",
        "約5%"
      ],
      correctAnswer: 2,
      explanation: "海の植物プランクトンと海藻は、地球の酸素の50%以上を生成しています。これは森林よりも多い量です。"
    },
    {
      category: 'pollution',
      question: "子どもが海洋環境を守るためにできることは何ですか？",
      options: [
        "プラスチックの使用を減らす",
        "ビーチクリーニングに参加する",
        "水を節約する",
        "すべて正解"
      ],
      correctAnswer: 3,
      explanation: "これらすべての行動が海洋環境を守るのに役立ちます。小さな行動の積み重ねが大きな変化をもたらします。"
    },
    
    // 魚の生態系に関する質問
    {
      category: 'ecosystem',
      question: "魚の群れ（スクーリング）が形成される主な理由は何ですか？",
      options: [
        "水温調節のため",
        "捕食者からの保護と餌の効率的な探索のため",
        "繁殖のためだけ",
        "水流に逆らって泳ぐため"
      ],
      correctAnswer: 1,
      explanation: "魚は主に捕食者からの保護と餌の効率的な探索のために群れを形成します。群れの中にいると、捕食者に見つかりにくく、また多くの目で餌を見つけやすくなります。"
    },
    {
      category: 'ecosystem',
      question: "サンゴ礁が魚の生態系にとって重要な理由は何ですか？",
      options: [
        "単に美しいから",
        "魚の餌になるから",
        "多くの魚の住処、産卵場所、保護区になるから",
        "水温を下げるから"
      ],
      correctAnswer: 2,
      explanation: "サンゴ礁は海の熱帯雨林とも呼ばれ、多くの魚の住処、産卵場所、保護区となっています。世界の海洋生物の約25%がサンゴ礁に依存しています。"
    },
    {
      category: 'ecosystem',
      question: "クラゲは魚ですか？",
      options: [
        "はい、特殊な魚の一種です",
        "いいえ、クラゲは刺胞動物門に属します",
        "はい、ただし成熟した段階のみ",
        "いいえ、クラゲは軟体動物です"
      ],
      correctAnswer: 1,
      explanation: "クラゲは魚ではなく、刺胞動物門に属します。魚は脊椎動物ですが、クラゲは脊椎を持たない無脊椎動物です。"
    },
    {
      category: 'ecosystem',
      question: "海洋酸性化が魚に与える影響は何ですか？",
      options: [
        "影響はない",
        "魚の骨格と貝殻の形成に問題を引き起こす",
        "魚の色が明るくなる",
        "魚の寿命が長くなる"
      ],
      correctAnswer: 1,
      explanation: "海洋酸性化は二酸化炭素の増加によって起こり、魚の骨格形成や貝殻を持つ生物の殻の形成に深刻な問題を引き起こします。また、魚の行動や生理機能にも影響を与えます。"
    },
    {
      category: 'ecosystem',
      question: "深海魚が浅い海に上がってこられない理由は何ですか？",
      options: [
        "光が怖いから",
        "水温が高すぎるから",
        "水圧の変化に適応できないから",
        "餌がないから"
      ],
      correctAnswer: 2,
      explanation: "深海魚は高水圧環境に適応しており、急激な水圧の低下に対応できません。浅い海に上がると体内のガスが膨張し、組織が損傷する可能性があります。"
    }
  ];

  // 選択されたカテゴリーに基づいてクイズ質問をフィルタリング
  const quizQuestions = quizCategory === 'all' 
    ? allQuizQuestions 
    : allQuizQuestions.filter(q => q.category === quizCategory);

  // クイズの回答を処理する関数
  const handleAnswerSubmit = (selectedIndex: number) => {
    setSelectedAnswer(selectedIndex);
    setIsAnswerSubmitted(true);
    
    if (selectedIndex === quizQuestions[currentQuizIndex].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  // 次のクイズに進む関数
  const goToNextQuiz = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // クイズ終了時の処理
      // 高得点の場合、汚染を少し減らす報酬を与える
      const passScore = Math.ceil(quizQuestions.length * 0.6); // 60%以上で合格
      if (quizScore >= passScore) {
        setPollutionLevel(prev => Math.max(0, prev - 1));
        // 新しい魚を追加する報酬
        if (fishTypes.length > 0) {
          const randomTypeIndex = Math.floor(Math.random() * fishTypes.length);
          updateFishCount(randomTypeIndex, 1);
        }
        setQuizCompleted(true);
      }
      // クイズをリセット
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    }
  };

  // クイズを閉じる関数
  const closeQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizCompleted(false);
    setShowQuiz(false);
  };

  // クイズカテゴリーを変更する関数
  const changeQuizCategory = (category: 'pollution' | 'ecosystem' | 'all') => {
    setQuizCategory(category);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizCompleted(false);
  };

  const addPollution = () => {
    setPollutionLevel(prev => {
      const newLevel = Math.min(10, prev + 1);
      // 汚染レベルが上がったときに泡エフェクトを追加
      if (newLevel > prev) {
        // 汚染物質が水中に広がる視覚効果
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * canvasSize.width;
          const y = Math.random() * 50; // 水面付近
          bubblesRef.current.push({
            x: x,
            y: canvasSize.height - y,
            size: 2 + Math.random() * 4,
            speed: 0.2 + Math.random() * 0.5, // ゆっくり上昇
            wobbleOffset: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.3 + Math.random() * 0.5
          });
        }
      }
      return newLevel;
    });
  };

  const cleanOcean = () => {
    setPollutionLevel(prev => Math.max(0, prev - 1));
  };

  const removeBackground = (img: HTMLImageElement): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];
      const threshold = 30;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (
          Math.abs(r - bgR) < threshold &&
          Math.abs(g - bgG) < threshold &&
          Math.abs(b - bgB) < threshold
        ) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const newImg = new Image();
      newImg.onload = () => resolve(newImg);
      newImg.src = canvas.toDataURL('image/png');
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const name = file.name.split('.')[0];
        const processedImg = await removeBackground(img);
        const speciesType = name.toLowerCase().includes('crab') ? 'crab' :
                          name.toLowerCase().includes('jellyfish') ? 'jellyfish' : 'fish';
        setFishTypes(prev => [...prev, {
          image: processedImg,
          url: e.target?.result as string,
          name,
          count: 1,
          speedFactor: 1,
          scale: 1,
          speciesType
        }]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const updateFishCount = (index: number, change: number) => {
    setFishTypes(prev => prev.map((type, i) => 
      i === index 
        ? { ...type, count: Math.max(0, Math.min(10, type.count + change)) }
        : type
    ));
  };

  const updateFishScale = (index: number, change: number) => {
    setFishTypes(prev => prev.map((type, i) => 
      i === index 
        ? { ...type, scale: Math.max(0.5, Math.min(5.0, type.scale + change * 0.1)) }
        : type
    ));
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    touchStartRef.current = { x, y };

    // Create ripple effect with bubbles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      bubblesRef.current.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        size: 2 + Math.random() * 4,
        speed: 1 + Math.random() * 2,
        wobbleOffset: angle,
        wobbleSpeed: 1 + Math.random() * 2
      });
    }

    // Surprise nearby fish
    for (const fish of fishesRef.current) {
      const dx = fish.x - x;
      const dy = (fish.y + fish.yOffset) - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const surpriseRadius = fish.surpriseRadius || 150;

      if (distance < surpriseRadius) {
        // Calculate surprise force (away from touch point)
        const force = (1 - distance / surpriseRadius) * 10;
        const angle = Math.atan2(dy, dx);
        fish.surpriseForce = {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force
        };
        fish.surpriseTimer = 60;
        fish.isExcited = true;
        fish.excitementTimer = 60;
        fish.speedMultiplier = 2.5;
        fish.scale = fish.baseScale * 1.2;

        // Create panic bubbles
        for (let i = 0; i < 5; i++) {
          bubblesRef.current.push({
            x: fish.x + (Math.random() - 0.5) * 20,
            y: fish.y + fish.yOffset,
            size: 1 + Math.random() * 3,
            speed: 2 + Math.random() * 2,
            wobbleOffset: Math.random() * Math.PI * 2,
            wobbleSpeed: 2 + Math.random()
          });
        }
      }
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    // Continue to affect nearby fish
    for (const fish of fishesRef.current) {
      const dx = fish.x - x;
      const dy = (fish.y + fish.yOffset) - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const surpriseRadius = fish.surpriseRadius || 100;

      if (distance < surpriseRadius) {
        const force = (1 - distance / surpriseRadius) * 5;
        const angle = Math.atan2(dy, dx);
        fish.surpriseForce = {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force
        };
        fish.surpriseTimer = 30;
        fish.isExcited = true;
        fish.excitementTimer = 30;
      }
    }
  };

  const handleTouchEnd = () => {
    for (const fish of fishesRef.current) {
      fish.surpriseTimer = Math.max(0, fish.surpriseTimer - 10);
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        setCanvasSize({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  useEffect(() => {
    const backgroundImage = new Image();
    backgroundImage.crossOrigin = 'anonymous';
    backgroundImage.src = 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?auto=format&fit=crop&w=1920&h=1080&q=80';
    backgroundImage.onload = () => {
      backgroundRef.current = backgroundImage;
    };

    bubblesRef.current = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvasSize.width,
      y: canvasSize.height + Math.random() * 200,
      size: 2 + Math.random() * 6,
      speed: 0.5 + Math.random() * 1.5,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 2
    }));
  }, [canvasSize]);

  useEffect(() => {
    fishesRef.current = [];

    fishTypes.forEach((type, typeIndex) => {
      for (let i = 0; i < type.count; i++) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const baseSpeed = 1 + Math.random() * 0.5;
        const baseScale = type.scale * (0.8 + Math.random() * 0.4);
        // 汚染耐性を下げる（より早く影響を受けるように）
        const pollutionResistance = type.speciesType === 'jellyfish' ? 0.5 :
                                  type.speciesType === 'crab' ? 0.3 : 0.2;
        
        fishesRef.current.push({
          x: Math.random() * canvasSize.width,
          y: 100 + Math.random() * (canvasSize.height - 200),
          direction: direction,
          targetDirection: direction,
          speed: baseSpeed * type.speedFactor,
          baseSpeed: baseSpeed,
          yOffset: 0,
          ySpeed: 0.5 + Math.random() * 0.5,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          turnProgress: 0,
          imageIndex: typeIndex,
          scale: baseScale,
          baseScale: baseScale,
          restTimer: Math.random() * 200,
          isResting: false,
          isExcited: false,
          excitementTimer: 0,
          isFollowing: false,
          targetX: 0,
          targetY: 0,
          flipProgress: 0,
          isFlipping: false,
          flipDirection: direction,
          targetRotation: direction > 0 ? 0 : Math.PI,
          currentRotation: direction > 0 ? 0 : Math.PI,
          speedMultiplier: 1,
          targetSpeedMultiplier: 1,
          speedChangeTimer: Math.random() * 200,
          turnTimer: Math.random() * 300,
          targetY2: 100 + Math.random() * (canvasSize.height - 200),
          yProgress: Math.random(),
          restProbability: 0.002 + Math.random() * 0.003,
          restDuration: 120 + Math.random() * 180,
          breathingPhase: Math.random() * Math.PI * 2,
          cohesionWeight: type.speciesType === 'fish' ? 0.02 : 0.005,
          alignmentWeight: type.speciesType === 'fish' ? 0.05 : 0.01,
          separationWeight: type.speciesType === 'fish' ? 0.03 : 0.02,
          neighborRadius: type.speciesType === 'fish' ? 100 : 50,
          speciesType: type.speciesType,
          verticalMovement: 0,
          verticalSpeed: type.speciesType === 'jellyfish' ? 0.5 + Math.random() * 0.5 : 0.2,
          currentPhase: Math.random() * Math.PI * 2,
          currentForce: { x: 0, y: 0 },
          waterCurrentPhase: Math.random() * Math.PI * 2,
          surpriseRadius: type.speciesType === 'fish' ? 150 : 100,
          surpriseForce: { x: 0, y: 0 },
          surpriseTimer: 0,
          opacity: 1,
          pollutionResistance: pollutionResistance,
          healthLevel: 1,
          isDying: false,
          deathTimer: 0
        });
      }
    });
  }, [fishTypes, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const updateWaterCurrent = () => {
      const frequency = 0.0005;
      const amplitude = 2;
      waterCurrentRef.current = {
        x: Math.cos(time * frequency) * amplitude,
        y: Math.sin(time * frequency * 1.5) * amplitude * 0.5
      };
    };

    const calculateSchoolingForces = (fish: Fish) => {
      const neighbors = fishesRef.current.filter(other => 
        other !== fish &&
        other.speciesType === fish.speciesType &&
        calculateDistance(fish.x, fish.y, other.x, other.y) < fish.neighborRadius
      );

      if (neighbors.length === 0) return { x: 0, y: 0 };

      // Cohesion
      const centerOfMass = neighbors.reduce(
        (acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }),
        { x: 0, y: 0 }
      );
      const cohesion = {
        x: (centerOfMass.x / neighbors.length - fish.x) * fish.cohesionWeight,
        y: (centerOfMass.y / neighbors.length - fish.y) * fish.cohesionWeight
      };

      // Alignment
      const averageVelocity = neighbors.reduce(
        (acc, curr) => ({
          x: acc.x + Math.cos(curr.currentRotation) * curr.speed,
          y: acc.y + Math.sin(curr.currentRotation) * curr.speed
        }),
        { x: 0, y: 0 }
      );
      const alignment = {
        x: (averageVelocity.x / neighbors.length) * fish.alignmentWeight,
        y: (averageVelocity.y / neighbors.length) * fish.alignmentWeight
      };

      // Separation
      const separation = neighbors.reduce(
        (acc, curr) => {
          const distance = calculateDistance(fish.x, fish.y, curr.x, curr.y);
          const force = fish.separationWeight / (distance * distance);
          return {
            x: acc.x + (fish.x - curr.x) * force,
            y: acc.y + (fish.y - curr.y) * force
          };
        },
        { x: 0, y: 0 }
      );

      return {
        x: cohesion.x + alignment.x + separation.x,
        y: cohesion.y + alignment.y + separation.y
      };
    };

    const drawBubbles = () => {
      ctx.save();
      const bubbles = bubblesRef.current;
      for (const bubble of bubbles) {
        bubble.y -= bubble.speed;
        bubble.x += Math.sin((time + bubble.wobbleOffset) * bubble.wobbleSpeed) * 0.5;

        if (bubble.y < -20) {
          bubble.y = canvasSize.height + Math.random() * 100;
          bubble.x = Math.random() * canvasSize.width;
        }

        const gradient = ctx.createRadialGradient(
          bubble.x, bubble.y, 0,
          bubble.x, bubble.y, bubble.size
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (backgroundRef.current) {
        ctx.drawImage(backgroundRef.current, 0, 0, canvas.width, canvas.height);
      }

      ctx.save();
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 3; i++) {
        const x = Math.sin(time * 0.5 + i * Math.PI * 2 / 3) * 50;
        const y = Math.cos(time * 0.5 + i * Math.PI * 2 / 3) * 50;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(x, y, canvas.width, canvas.height);
      }
      ctx.restore();

      if (pollutionLevel > 0) {
        // 汚染の視覚効果を強化
        ctx.fillStyle = `rgba(120, 60, 20, ${pollutionLevel * 0.15})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 汚染レベルが高いときは水面に油膜のような効果を追加
        if (pollutionLevel > 5) {
          ctx.save();
          for (let i = 0; i < 3; i++) {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, `rgba(50, 20, 0, ${(pollutionLevel - 5) * 0.05})`);
            gradient.addColorStop(0.5, `rgba(100, 40, 10, ${(pollutionLevel - 5) * 0.03})`);
            gradient.addColorStop(1, `rgba(70, 30, 5, ${(pollutionLevel - 5) * 0.04})`);
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(
              Math.sin(time * 0.2 + i) * 20, 
              Math.cos(time * 0.3 + i) * 20, 
              canvas.width, 
              canvas.height
            );
          }
          ctx.restore();
        }
      }

      drawBubbles();
      updateWaterCurrent();

      const pollutionSpeedMultiplier = 1 - 0.5 * (pollutionLevel / 10);
      const fishes = fishesRef.current;
      let deadCount = 0;

      for (const fish of fishes) {
        // 汚染による魚の健康状態の更新
        const pollutionEffect = pollutionLevel / 10;
        const pollutionDamage = Math.max(0, pollutionEffect - fish.pollutionResistance);
        
        // 健康状態の更新（汚染が魚の抵抗力を超えると健康が徐々に低下）
        if (pollutionDamage > 0) {
          // 汚染ダメージの係数を0.001から0.005に増加（5倍速く減少）
          fish.healthLevel = Math.max(0, fish.healthLevel - pollutionDamage * 0.005);
        } else if (pollutionLevel < 5) {
          // 汚染レベルが低い場合、徐々に回復
          fish.healthLevel = Math.min(1, fish.healthLevel + 0.0005);
        }
        
        // 健康状態に基づく透明度の設定
        fish.opacity = fish.healthLevel;
        
        // 健康状態が危険レベルになると死にかけ状態に（閾値を0.3から0.5に上げる）
        if (fish.healthLevel < 0.5 && !fish.isDying) {
          fish.isDying = true;
          // 死亡までの時間を短縮（より早く死ぬように）
          fish.deathTimer = 50 + Math.floor(Math.random() * 100);
        }
        
        // 死にかけ状態の処理
        if (fish.isDying) {
          // 死亡カウントダウンを速める
          fish.deathTimer -= 2;
          
          // 死にかけの魚は不規則に動く（より激しく）
          fish.rotation += (Math.random() - 0.5) * 0.2;
          
          // 泡を出す確率を上げる（苦しんでいる表現を強化）
          if (Math.random() < 0.2) {
            bubblesRef.current.push({
              x: fish.x + (Math.random() - 0.5) * 10,
              y: fish.y + fish.yOffset,
              size: 1 + Math.random() * 2,
              speed: 0.5 + Math.random(),
              wobbleOffset: Math.random() * Math.PI * 2,
              wobbleSpeed: 1 + Math.random()
            });
          }
          
          // 死亡処理
          if (fish.deathTimer <= 0) {
            fish.opacity = 0;
            deadCount++;
            
            // 死んだ魚の位置に泡を多く発生させる
            for (let i = 0; i < 15; i++) {
              bubblesRef.current.push({
                x: fish.x + (Math.random() - 0.5) * 20,
                y: fish.y + fish.yOffset,
                size: 1 + Math.random() * 3,
                speed: 1 + Math.random() * 2,
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 1 + Math.random() * 2
              });
            }
          }
        }

        if (fish.opacity <= 0.01) continue;

        // Update water current effect
        fish.waterCurrentPhase += 0.02;
        const currentEffect = {
          x: waterCurrentRef.current.x * Math.sin(fish.waterCurrentPhase),
          y: waterCurrentRef.current.y * Math.cos(fish.waterCurrentPhase)
        };

        // Update surprise effect
        if (fish.surpriseTimer > 0) {
          fish.surpriseTimer--;
          fish.x += fish.surpriseForce.x;
          fish.y += fish.surpriseForce.y;
          fish.surpriseForce.x *= 0.9;
          fish.surpriseForce.y *= 0.9;
        }

        if (!fish.isResting && !fish.isFollowing && !fish.isExcited && Math.random() < fish.restProbability) {
          fish.isResting = true;
          fish.restTimer = fish.restDuration;
          for (let i = 0; i < 3; i++) {
            bubblesRef.current.push({
              x: fish.x + (Math.random() - 0.5) * 20,
              y: fish.y + fish.yOffset,
              size: 1 + Math.random() * 3,
              speed: 0.5 + Math.random(),
              wobbleOffset: Math.random() * Math.PI * 2,
              wobbleSpeed: 0.5 + Math.random()
            });
          }
        }

        fish.speedChangeTimer--;
        if (fish.speedChangeTimer <= 0) {
          fish.targetSpeedMultiplier = 0.5 + Math.random() * 1.5;
          fish.speedChangeTimer = 100 + Math.random() * 200;
        }

        fish.turnTimer--;
        if (fish.turnTimer <= 0 && !fish.isFollowing && !fish.isResting) {
          fish.turnTimer = 200 + Math.random() * 300;
          if (Math.random() < 0.3) {
            fish.targetDirection *= -1;
          }
          fish.targetY2 = 100 + Math.random() * (canvasSize.height - 200);
          fish.yProgress = 0;
        }

        const speedDiff = fish.targetSpeedMultiplier - fish.speedMultiplier;
        fish.speedMultiplier += speedDiff * 0.05;

        if (fish.isExcited) {
          fish.excitementTimer--;
          if (fish.excitementTimer <= 0) {
            fish.isExcited = false;
            fish.speed = fish.baseSpeed;
            fish.scale = fish.baseScale;
          }
        }

        const currentSpeed = fish.speed * fish.speedMultiplier * pollutionSpeedMultiplier;

        // Species-specific behavior
        switch (fish.speciesType) {
          case 'crab':
            fish.verticalMovement = Math.sin(time * fish.verticalSpeed) * 20;
            fish.yOffset = fish.verticalMovement;
            break;
          
          case 'jellyfish':
            fish.currentPhase += 0.05;
            fish.verticalMovement = Math.sin(fish.currentPhase) * 30;
            fish.yOffset = fish.verticalMovement;
            fish.scale = fish.baseScale * (1 + Math.sin(fish.currentPhase * 0.5) * 0.2);
            break;
          
          case 'fish':
            const schoolingForces = calculateSchoolingForces(fish);
            fish.currentForce = {
              x: schoolingForces.x + currentEffect.x,
              y: schoolingForces.y + currentEffect.y
            };
            break;
        }

        if (fish.isResting) {
          fish.breathingPhase += 0.05;
          fish.yOffset = Math.sin(time * fish.ySpeed * 0.5) * 3 +
                        Math.sin(fish.breathingPhase) * 2;
          
          if (Math.random() < 0.05) {
            bubblesRef.current.push({
              x: fish.x + (Math.random() - 0.5) * 10,
              y: fish.y + fish.yOffset,
              size: 1 + Math.random() * 2,
              speed: 0.3 + Math.random() * 0.5,
              wobbleOffset: Math.random() * Math.PI * 2,
              wobbleSpeed: 0.3 + Math.random() * 0.5
            });
          }

          fish.restTimer--;
          if (fish.restTimer <= 0) {
            fish.isResting = false;
            fish.restTimer = 200 + Math.random() * 300;
            if (Math.random() < 0.7) {
              fish.targetDirection *= -1;
            }
            fish.speedMultiplier = 1.5;
            fish.targetSpeedMultiplier = 1;
          }
        } else if (fish.isFollowing) {
          const dx = fish.targetX - fish.x;
          const dy = fish.targetY - (fish.y + fish.yOffset);
          const targetAngle = Math.atan2(dy, dx);
          
          const angleDiff = normalizeAngle(targetAngle - fish.currentRotation);
          fish.currentRotation += angleDiff * 0.1;
          fish.currentRotation = normalizeAngle(fish.currentRotation);
          
          fish.x += Math.cos(fish.currentRotation) * currentSpeed * 2;
          fish.y += Math.sin(fish.currentRotation) * currentSpeed * 2;
          
          const newDirection = Math.cos(fish.currentRotation) > 0 ? 1 : -1;
          if (newDirection !== fish.direction) {
            fish.direction = newDirection;
            fish.targetDirection = newDirection;
          }
        } else {
          if (fish.direction !== fish.targetDirection) {
            const turnSpeed = 0.1;
            fish.direction += (fish.targetDirection - fish.direction) * turnSpeed;
          }

          // Apply species-specific and schooling movement
          if (fish.speciesType === 'fish') {
            fish.x += currentSpeed * fish.direction + fish.currentForce.x;
            fish.y += fish.currentForce.y;
          } else {
            fish.x += currentSpeed * fish.direction + currentEffect.x;
            fish.y += currentEffect.y;
          }
          
          if (fish.speciesType !== 'jellyfish' && fish.speciesType !== 'crab') {
            fish.yProgress += 0.005;
            const targetY = fish.y + (fish.targetY2 - fish.y) * Math.min(1, fish.yProgress);
            fish.y += (targetY - fish.y) * 0.02;
            fish.yOffset = Math.sin(time * fish.ySpeed * 2) * 15;
          }

          // Boundary avoidance
          const margin = 50;
          if (fish.x <= margin) {
            fish.targetDirection = 1;
          } else if (fish.x >= canvas.width - margin) {
            fish.targetDirection = -1;
          }

          if (fish.y <= margin) {
            fish.targetY2 = Math.min(fish.targetY2, canvas.height - margin);
          } else if (fish.y >= canvas.height - margin) {
            fish.targetY2 = Math.max(fish.targetY2, margin);
          }
        }

        // Enforce boundaries
        if (fish.x <= 0) {
          fish.x = 0;
          fish.direction = 1;
          fish.targetDirection = 1;
        } else if (fish.x >= canvas.width) {
          fish.x = canvas.width;
          fish.direction = -1;
          fish.targetDirection = -1;
        }

        if (fish.y <= 0) {
          fish.y = 0;
        } else if (fish.y >= canvas.height) {
          fish.y = canvas.height;
        }

        const fishImage = fishTypes[ fish.imageIndex]?.image;
        if (!fishImage) continue;

        ctx.save();
        ctx.translate(fish.x, fish.y + fish.yOffset);
        ctx.globalAlpha = fish.opacity;

        let rotation = 0;
        if (fish.speciesType === 'crab') {
          rotation = fish.verticalMovement * 0.02;
        } else if (fish.speciesType === 'jellyfish') {
          rotation = Math.sin(fish.currentPhase) * 0.1;
        }
        ctx.rotate(rotation);

        const breathingScale = fish.isResting 
          ? 1 + Math.sin(fish.breathingPhase) * 0.05
          : 1 + (fish.speedMultiplier - 1) * 0.2;
        
        const verticalStretch = fish.speciesType === 'jellyfish'
          ? 1 + Math.sin(fish.currentPhase) * 0.3
          : 1;
        
        ctx.scale(
          fish.scale * breathingScale * fish.direction,
          fish.scale * breathingScale * verticalStretch
        );

        ctx.drawImage(fishImage, -25, -15, 50, 30);
        ctx.restore();
      }
      
      // 死んだ魚の数を更新
      if (deadCount !== deadFishCount) {
        setDeadFishCount(deadCount);
      }

      if (pollutionLevel > 0) {
        for (let i = 0; i < pollutionLevel; i++) {
          const x = (canvas.width / 11) * (i + 1);
          ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
          ctx.fillRect(x - 10, canvas.height - 30, 20, 30);
        }
        
        // 汚染レベルと死んだ魚の数を表示
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.fillText(`汚染レベル: ${pollutionLevel}/10`, 10, 20);
        ctx.fillText(`死んだ魚: ${deadFishCount} 匹`, 10, 40);
      }

      // 泡を描画
      bubblesRef.current.forEach((bubble, index) => {
        // ... existing code ...
      });

      // 汚染源を描画
      pollutionSources.forEach(source => {
        if (source.image) {
          const width = source.type === 'factory' ? 80 : source.type === 'boat' ? 60 : 40;
          const height = source.type === 'factory' ? 80 : source.type === 'boat' ? 40 : 40;
          
          ctx.save();
          ctx.globalAlpha = source.active ? 1 : 0.5;
          ctx.drawImage(
            source.image,
            source.x - width * source.scale / 2,
            source.y - height * source.scale / 2,
            width * source.scale,
            height * source.scale
          );
          
          // 汚染源が活性化している場合、汚染の視覚効果を追加
          if (source.active) {
            // 工場からの煙や排水
            if (source.type === 'factory') {
              ctx.globalAlpha = 0.3;
              const gradient = ctx.createRadialGradient(
                source.x, source.y + 20, 5,
                source.x, source.y + 20, 50
              );
              gradient.addColorStop(0, 'rgba(100, 50, 20, 0.8)');
              gradient.addColorStop(1, 'rgba(100, 50, 20, 0)');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(source.x, source.y + 20, 50, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // ボートからの油漏れ
            if (source.type === 'boat') {
              ctx.globalAlpha = 0.2;
              const gradient = ctx.createRadialGradient(
                source.x, source.y + 10, 2,
                source.x, source.y + 10, 30
              );
              gradient.addColorStop(0, 'rgba(50, 50, 50, 0.8)');
              gradient.addColorStop(1, 'rgba(50, 50, 50, 0)');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(source.x, source.y + 10, 30, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // ゴミからの汚染
            if (source.type === 'trash') {
              ctx.globalAlpha = 0.15;
              const gradient = ctx.createRadialGradient(
                source.x, source.y, 2,
                source.x, source.y, 20
              );
              gradient.addColorStop(0, 'rgba(150, 100, 50, 0.6)');
              gradient.addColorStop(1, 'rgba(150, 100, 50, 0)');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(source.x, source.y, 20, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          ctx.restore();
        }
      });

      // 魚を描画
      fishesRef.current.forEach((fish) => {
        // ... existing code ...
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [pollutionLevel, fishTypes, canvasSize, deadFishCount, pollutionSources]);

  // 汚染源を追加する関数
  const addPollutionSource = (type: 'factory' | 'boat' | 'trash') => {
    const newSource: PollutionSource = {
      type,
      x: type === 'factory' ? 50 + Math.random() * 100 : Math.random() * canvasSize.width,
      y: type === 'factory' ? 50 : type === 'boat' ? 50 : canvasSize.height - 50,
      scale: type === 'factory' ? 0.8 : type === 'boat' ? 0.6 : 0.4,
      active: true,
      pollutionRate: type === 'factory' ? 0.05 : type === 'boat' ? 0.03 : 0.01,
      image: pollutionSourceImagesRef.current[type]
    };
    
    setPollutionSources(prev => [...prev, newSource]);
    
    // 汚染源が追加されたときに汚染レベルを上げる
    setPollutionLevel(prev => Math.min(10, prev + (type === 'factory' ? 2 : type === 'boat' ? 1 : 0.5)));
  };

  // 汚染源を削除する関数
  const removePollutionSource = (index: number) => {
    setPollutionSources(prev => {
      const newSources = [...prev];
      const removedSource = newSources[index];
      newSources.splice(index, 1);
      
      // 汚染源が削除されたときに汚染レベルを下げる
      setPollutionLevel(prev => Math.max(0, prev - (removedSource.type === 'factory' ? 1 : removedSource.type === 'boat' ? 0.5 : 0.2)));
      
      return newSources;
    });
  };

  // 汚染源の画像を読み込む
  useEffect(() => {
    const loadImage = (src: string, key: string) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        pollutionSourceImagesRef.current[key] = img;
      };
    };

    // 相対パスを使用して画像を読み込む
    loadImage('/images/factory.png', 'factory');
    loadImage('/images/boat.png', 'boat');
    loadImage('/images/trash.png', 'trash');
    
    // フォールバックとして、CDNからの読み込みも試みる
    setTimeout(() => {
      // 画像が読み込めなかった場合は、CDNから読み込む
      if (!pollutionSourceImagesRef.current.factory) {
        loadImage('https://cdn-icons-png.flaticon.com/512/1598/1598196.png', 'factory');
      }
      if (!pollutionSourceImagesRef.current.boat) {
        loadImage('https://cdn-icons-png.flaticon.com/512/2942/2942076.png', 'boat');
      }
      if (!pollutionSourceImagesRef.current.trash) {
        loadImage('https://cdn-icons-png.flaticon.com/512/3141/3141684.png', 'trash');
      }
    }, 1000);
  }, []);

  // 汚染源からの汚染効果を処理
  useEffect(() => {
    if (pollutionSources.length === 0) return;
    
    const interval = setInterval(() => {
      let totalPollution = 0;
      
      pollutionSources.forEach(source => {
        if (source.active) {
          totalPollution += source.pollutionRate;
          
          // 汚染源から泡/汚染物質を発生させる
          if (Math.random() < source.pollutionRate * 2) {
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = source.type === 'factory' ? 20 + Math.random() * 10 : 0;
            
            bubblesRef.current.push({
              x: source.x + offsetX,
              y: source.y + offsetY,
              size: 2 + Math.random() * 3,
              speed: 0.2 + Math.random() * 0.3,
              wobbleOffset: Math.random() * Math.PI * 2,
              wobbleSpeed: 0.3 + Math.random() * 0.5
            });
          }
        }
      });
      
      // 汚染レベルを徐々に上げる（アクティブな汚染源がある場合）
      if (totalPollution > 0) {
        setPollutionLevel(prev => Math.min(10, prev + totalPollution / 10));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pollutionSources]);

  // 汚染レベルに応じた教育的な情報を取得する関数
  const getEducationalInfo = () => {
    if (pollutionLevel === 0) {
      return {
        title: "きれいな海",
        description: "汚染のない海では、魚たちが健康に泳いでいます。海の生態系が正常に機能しています。",
        facts: [
          "地球の表面の約71%は海で覆われています",
          "海は地球上の酸素の50%以上を生成しています",
          "海には100万種以上の生物が生息しています"
        ],
        tips: [
          "ビーチに行ったらゴミを持ち帰りましょう",
          "プラスチック製品の使用を減らしましょう",
          "水を大切に使いましょう"
        ]
      };
    } else if (pollutionLevel <= 3) {
      return {
        title: "軽度の汚染",
        description: "少しの汚染でも、敏感な魚たちは影響を受け始めます。汚染物質は食物連鎖を通じて蓄積されていきます。",
        facts: [
          "海洋汚染の約80%は陸地からの活動によるものです",
          "プラスチックは海で分解されるのに数百年かかります",
          "小さな魚は大きな魚より早く汚染の影響を受けます"
        ],
        tips: [
          "使い捨てプラスチックを避けましょう",
          "環境に優しい洗剤を使いましょう",
          "地域の清掃活動に参加しましょう"
        ]
      };
    } else if (pollutionLevel <= 6) {
      return {
        title: "中度の汚染",
        description: "汚染が進むと、多くの魚が病気になったり、死んだりします。海の色や匂いも変わり始めます。",
        facts: [
          "海洋生物は毎年約100万羽/匹が海洋汚染で死んでいます",
          "油流出事故1回で数千の海洋生物が死ぬことがあります",
          "汚染された水は人間の健康にも悪影響を与えます"
        ],
        tips: [
          "節水を心がけましょう",
          "環境保護団体をサポートしましょう",
          "リサイクルを積極的に行いましょう"
        ]
      };
    } else {
      return {
        title: "深刻な汚染",
        description: "汚染が深刻になると、ほとんどの魚が生きられなくなります。これを「デッドゾーン」と呼びます。回復には長い時間がかかります。",
        facts: [
          "世界中に約400以上の海洋デッドゾーンがあります",
          "深海の生物からもマイクロプラスチックが見つかっています",
          "一部の汚染物質は何世代にもわたって影響を与えます"
        ],
        tips: [
          "政治家に環境保護の法律を支持するよう手紙を書きましょう",
          "環境に関する知識を友達や家族と共有しましょう",
          "持続可能な製品を選びましょう"
        ]
      };
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center">
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: isFullscreen ? '100vw' : '800px',
          height: isFullscreen ? '100vh' : '600px'
        }}
      >
        <canvas
          ref={canvasRef}
          className="bg-blue-100 rounded-lg cursor-pointer touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute left-4 bottom-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white/100 transition-all"
        >
          <Settings size={20} className="text-gray-700" />
        </button>

        {/* 情報パネルを表示するボタン */}
        <button
          onClick={() => setShowInfoPanel(!showInfoPanel)}
          className="absolute right-4 top-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white/100 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>

        {/* クイズボタン */}
        <button
          onClick={() => setShowQuiz(!showQuiz)}
          className="absolute right-4 top-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white/100 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
            <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path>
          </svg>
        </button>

        {/* 汚染源パネルを表示するボタン */}
        <button
          onClick={() => setShowCausesPanel(!showCausesPanel)}
          className="absolute right-4 top-36 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white/100 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        </button>

        {/* 教育的な情報パネル */}
        {showInfoPanel && (
          <div className="absolute right-4 top-16 w-80 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl max-h-[80%] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-blue-600">{getEducationalInfo().title}</h3>
              <button 
                onClick={() => setShowInfoPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700">{getEducationalInfo().description}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold text-blue-600 mb-1">知っていますか？</h4>
              <ul className="text-xs text-gray-700 list-disc pl-4 space-y-1">
                {getEducationalInfo().facts.map((fact, index) => (
                  <li key={index}>{fact}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-1">できること</h4>
              <ul className="text-xs text-gray-700 list-disc pl-4 space-y-1">
                {getEducationalInfo().tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">汚染レベル:</span>
                <div className="w-3/4 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      pollutionLevel <= 3 ? 'bg-green-500' : 
                      pollutionLevel <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${pollutionLevel * 10}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">死んだ魚:</span>
                <span className="text-xs font-medium text-red-500">{deadFishCount} 匹</span>
              </div>
            </div>
          </div>
        )}

        {/* クイズパネル */}
        {showQuiz && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white/95 backdrop-blur-sm p-5 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-purple-600">海の環境クイズ</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  {currentQuizIndex + 1}/{quizQuestions.length}
                </span>
                <button 
                  onClick={closeQuiz}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* カテゴリー選択 */}
            {!isAnswerSubmitted && currentQuizIndex === 0 && !quizCompleted && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">カテゴリーを選択:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => changeQuizCategory('all')}
                    className={`px-2 py-1 text-xs rounded-full ${
                      quizCategory === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    onClick={() => changeQuizCategory('pollution')}
                    className={`px-2 py-1 text-xs rounded-full ${
                      quizCategory === 'pollution'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    海洋汚染
                  </button>
                  <button
                    onClick={() => changeQuizCategory('ecosystem')}
                    className={`px-2 py-1 text-xs rounded-full ${
                      quizCategory === 'ecosystem'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    魚の生態系
                  </button>
                </div>
              </div>
            )}
            
            {quizCompleted ? (
              <div className="text-center py-6">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  クイズ完了！
                </div>
                <div className="text-lg mb-4">
                  あなたのスコア: <span className="font-bold">{quizScore}/{quizQuestions.length}</span>
                </div>
                <div className="mb-6">
                  {quizScore >= Math.ceil(quizQuestions.length * 0.6) ? (
                    <div className="p-3 bg-green-50 rounded-md border border-green-100">
                      <p className="text-sm text-green-800">
                        おめでとうございます！高得点を獲得したため、海の汚染レベルが下がり、新しい魚が追加されました！
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 rounded-md border border-yellow-100">
                      <p className="text-sm text-yellow-800">
                        もう少し頑張りましょう！60%以上の正解で特別な報酬がもらえます。
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setQuizCompleted(false);
                      setCurrentQuizIndex(0);
                      setQuizScore(0);
                      setSelectedAnswer(null);
                      setIsAnswerSubmitted(false);
                    }}
                    className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                  >
                    もう一度挑戦
                  </button>
                  <button
                    onClick={closeQuiz}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    {quizQuestions[currentQuizIndex].question}
                  </p>
                  
                  <div className="space-y-2">
                    {quizQuestions[currentQuizIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => !isAnswerSubmitted && handleAnswerSubmit(index)}
                        disabled={isAnswerSubmitted}
                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                          isAnswerSubmitted
                            ? index === quizQuestions[currentQuizIndex].correctAnswer
                              ? 'bg-green-100 border border-green-300'
                              : selectedAnswer === index
                                ? 'bg-red-100 border border-red-300'
                                : 'bg-gray-100 border border-gray-200'
                            : selectedAnswer === index
                              ? 'bg-purple-100 border border-purple-300'
                              : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                
                {isAnswerSubmitted && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <p className="text-xs text-blue-800">
                      {quizQuestions[currentQuizIndex].explanation}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    スコア: <span className="font-medium text-purple-600">{quizScore}</span>
                  </div>
                  
                  {isAnswerSubmitted && (
                    <button
                      onClick={goToNextQuiz}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                    >
                      {currentQuizIndex < quizQuestions.length - 1 ? '次の問題' : 'クイズ終了'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 汚染源パネル */}
        {showCausesPanel && (
          <div className="absolute right-4 top-20 w-80 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl max-h-[80%] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-amber-600">海洋汚染と生態系</h3>
              <button 
                onClick={() => setShowCausesPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-amber-700 mb-1">海洋汚染の主な原因</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>プラスチックごみ（ペットボトル、ビニール袋など）</li>
                  <li>工場からの化学物質の排出</li>
                  <li>船舶からの油漏れ</li>
                  <li>農業からの肥料や農薬の流出</li>
                  <li>不適切に処理された下水</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-amber-700 mb-1">魚への影響</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>プラスチックの摂取による消化器官の詰まり</li>
                  <li>化学物質による生殖機能の低下</li>
                  <li>油による呼吸困難</li>
                  <li>生息地の破壊</li>
                  <li>食物連鎖の崩壊</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-amber-700 mb-1">海洋生態系の重要性</h4>
                <p className="text-gray-700">
                  海洋生態系は地球の酸素の50%以上を生成し、気候調節に重要な役割を果たしています。また、世界中の何十億もの人々の食料源であり、多様な生物の生息地です。
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-amber-700 mb-1">私たちにできること</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>プラスチックの使用を減らす</li>
                  <li>ごみを適切に分別・処理する</li>
                  <li>環境に優しい製品を選ぶ</li>
                  <li>ビーチクリーニングに参加する</li>
                  <li>環境保護団体をサポートする</li>
                </ul>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowCausesPanel(false);
                    setShowQuiz(true);
                  }}
                  className="w-full py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                >
                  環境クイズに挑戦する
                </button>
              </div>
            </div>
          </div>
        )}

        {showControls && (
          <div className="absolute left-16 bottom-4 flex gap-2 max-w-[calc(100%-5rem)]">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-xl">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded text-white bg-indigo-500 hover:bg-indigo-600 transition"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={addPollution}
                  disabled={pollutionLevel >= 10}
                  className={pollutionLevel >= 10 
                    ? 'p-1.5 rounded text-white bg-gray-400 cursor-not-allowed transition'
                    : 'p-1.5 rounded text-white bg-red-500 hover:bg-red-600 transition'
                  }
                  title="Add Pollution"
                >
                  <Trash2 size={14} />
                </button>
                
                {/* 汚染源を追加するボタン */}
                <div className="flex flex-col gap-1 ml-1 border-l pl-1">
                  <button
                    onClick={() => addPollutionSource('factory')}
                    disabled={pollutionLevel >= 10}
                    className={pollutionLevel >= 10 
                      ? 'p-1.5 rounded text-white bg-gray-400 cursor-not-allowed transition'
                      : 'p-1.5 rounded text-white bg-orange-500 hover:bg-orange-600 transition'
                    }
                    title="Add Factory Pollution"
                  >
                    <Factory size={14} />
                  </button>
                  <button
                    onClick={() => addPollutionSource('boat')}
                    disabled={pollutionLevel >= 10}
                    className={pollutionLevel >= 10 
                      ? 'p-1.5 rounded text-white bg-gray-400 cursor-not-allowed transition'
                      : 'p-1.5 rounded text-white bg-blue-500 hover:bg-blue-600 transition'
                    }
                    title="Add Boat Pollution"
                  >
                    <Anchor size={14} />
                  </button>
                  <button
                    onClick={() => addPollutionSource('trash')}
                    disabled={pollutionLevel >= 10}
                    className={pollutionLevel >= 10 
                      ? 'p-1.5 rounded text-white bg-gray-400 cursor-not-allowed transition'
                      : 'p-1.5 rounded text-white bg-yellow-500 hover:bg-yellow-600 transition'
                    }
                    title="Add Trash Pollution"
                  >
                    <Trash size={14} />
                  </button>
                </div>
                
                <label
                  className="p-1.5 rounded text-white bg-blue-500 hover:bg-blue-600 transition cursor-pointer"
                  title="Add New Fish"
                >
                  <Upload size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowCausesPanel(!showCausesPanel)}
                  className="p-1.5 rounded text-white bg-amber-500 hover:bg-amber-600 transition"
                  title="汚染の原因と影響"
                >
                  <BookOpen size={14} />
                </button>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="p-1.5 rounded text-white bg-purple-500 hover:bg-purple-600 transition"
                  title="環境クイズに挑戦"
                >
                  <HelpCircle size={14} />
                </button>
                <div className="text-xs text-gray-700 ml-1">
                  {pollutionLevel}/10
                </div>
              </div>
            </div>

            {fishTypes.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-xl">
                <div className="flex items-center gap-2 overflow-x-auto max-w-[400px] scrollbar-thin">
                  {fishTypes.map((type, index) => (
                    <div key={index} className="flex-shrink-0 flex items-center gap-1 bg-gray-100 rounded px-1.5 py-1">
                      <FishIcon size={14} className="text-blue-500" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateFishCount(index, -1)}
                            className="p-0.5 rounded-full hover:bg-gray-200"
                            disabled={type.count <= 0}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs w-4 text-center">{type.count}</span>
                          <button
                            onClick={() => updateFishCount(index, 1)}
                            className="p-0.5 rounded-full hover:bg-gray-200"
                            disabled={type.count >= 10}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateFishScale(index, -1)}
                            className="p-0.5 rounded-full hover:bg-gray-200"
                            disabled={type.scale <= 0.5}
                          >
                            <Minimize2 size={12} />
                          </button>
                          <span className="text-[10px] w-8 text-center">
                            {(type.scale * 100).toFixed(0)}%
                          </span>
                          <button
                            onClick={() => updateFishScale(index, 1)}
                            className="p-0.5 rounded-full hover:bg-gray-200"
                            disabled={type.scale >= 5.0}
                          >
                            <Maximize2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;