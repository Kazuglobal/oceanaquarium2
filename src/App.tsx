import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Upload, Plus, Minus, Fish as FishIcon, Maximize2, Minimize2, Settings, BookOpen, HelpCircle, Factory, Anchor, Trash, Globe, X, Info, Eye, EyeOff, Database, BarChart2 } from 'lucide-react';
import OceanMap from './components/OceanMap';
import { NASA_API_KEY } from './constants/apiKeys';

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

// 言語翻訳用のインターフェース
interface TranslationStrings {
  // ボタン
  addPollution: string;
  cleanOcean: string;
  addFactory: string;
  addBoat: string;
  addTrash: string;
  addNewFish: string;
  pollutionCauses: string;
  environmentalQuiz: string;
  
  // 言語
  switchLanguage: string;
  pollutionCausesTitle: string;
  factoryPollution: string;
  factoryPollutionDesc: string;
  boatPollution: string;
  boatPollutionDesc: string;
  trashPollution: string;
  trashPollutionDesc: string;
  effectsTitle: string;
  solutionsTitle: string;
  effect1: string;
  effect2: string;
  effect3: string;
  effect4: string;
  solution1: string;
  solution2: string;
  solution3: string;
  solution4: string;
  
  // クイズ
  quizTitle: string;
  questionCounter: string;
  category_all: string;
  category_pollution: string;
  category_ecosystem: string;
  previousButton: string;
  nextButton: string;
  finishButton: string;
  quizCompleted: string;
  yourScore: string;
  perfectScore: string;
  goodScore: string;
  tryAgainScore: string;
  retryButton: string;
  hidePanel: string;
  showPanel: string;
  hideFish: string;
  showFish: string;
  
  // 海洋データ関連
  oceanData: string;
  dataSource: string;
  location: string;
  temperature: string;
  salinity: string;
  ph: string;
  dissolvedOxygen: string;
  chlorophyll: string;
  pollutionIndex: string;
  fetchData: string;
  loadingData: string;
  dataError: string;
  noDataAvailable: string;
  allSources: string;
  allLocations: string;
}

interface Translations {
  ja: TranslationStrings;
  en: TranslationStrings;
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

// 海洋データのインターフェース
interface OceanData {
  location: string;
  temperature: number;
  salinity?: number;
  ph?: number;
  dissolvedOxygen?: number;
  chlorophyll?: number;
  pollutionIndex?: number;
  timestamp: string;
  source: 'NOAA' | 'NASA' | 'SIMULATION';
}

import { Environment } from './LandingPage.tsx';

interface AppProps {
  env?: Environment;
}

const App: React.FC<AppProps> = ({ env = 'ocean' }) => {
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
  const [language, setLanguage] = useState<'ja' | 'en'>('ja'); // 言語設定の状態変数
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const waterCurrentRef = useRef({ x: 0, y: 0 });
  const pollutionSourceImagesRef = useRef<{[key: string]: HTMLImageElement | null}>({
    factory: null,
    boat: null,
    trash: null
  });
  const [quizCategory, setQuizCategory] = useState<'pollution' | 'ecosystem' | 'all'>('all');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', 'pollution', 'ecosystem'];
  const [showControlPanel, setShowControlPanel] = useState(true); // コントロールパネルの表示/非表示を管理する状態
  const [showFish, setShowFish] = useState(true); // 魚の表示/非表示を管理する状態
  
  // NASA API キー用のステート
  const [nasaApiKey, setNasaApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  
  // 海洋データ関連の状態
  const [oceanData, setOceanData] = useState<OceanData[]>([]);
  const [isLoadingOceanData, setIsLoadingOceanData] = useState(false);
  const [oceanDataError, setOceanDataError] = useState<string | null>(null);
  const [showOceanDataPanel, setShowOceanDataPanel] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<'NOAA' | 'NASA' | 'ALL'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showMap, setShowMap] = useState(true); // 地図表示の状態を管理
  
  // 利用可能な場所のリスト
  const availableLocations = [
    'all',
    'Pacific Ocean',
    'Atlantic Ocean',
    'Indian Ocean',
    'Arctic Ocean',
    'Southern Ocean',
    'Gulf of Mexico',
    'Mediterranean Sea',
    'Caribbean Sea',
    'South China Sea',
    'Bering Sea'
  ];

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
            wobbleSpeed: 2 + Math.random() * 2
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
      } else {
        // 汚染レベルが0の場合でも表示
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
      if (showFish) {
      fishesRef.current.forEach((fish) => {
        // ... existing code ...
      });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [pollutionLevel, fishTypes, canvasSize, deadFishCount, pollutionSources, showFish]);

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

  // 翻訳テキスト
  const translations: Translations = {
    ja: {
      // ボタン
      addPollution: "汚染を追加",
      cleanOcean: "海をきれいにする",
      addFactory: "工場を追加",
      addBoat: "船を追加",
      addTrash: "ゴミを追加",
      addNewFish: "新しい魚を追加",
      pollutionCauses: "汚染の原因と影響",
      environmentalQuiz: "環境クイズ",
      
      // 言語
      switchLanguage: "言語切替",
      pollutionCausesTitle: "汚染原因と影響",
      factoryPollution: "工場汚染",
      factoryPollutionDesc: "工場からの化学物質や廃棄物が海に流れ込み、水質を悪化させます。",
      boatPollution: "船舶汚染",
      boatPollutionDesc: "船舶からの油漏れや排気ガスが海洋生物に悪影響を与えます。",
      trashPollution: "ゴミ汚染",
      trashPollutionDesc: "プラスチックごみ（ペットボトル、ビニール袋など）が海に流れ込み、海洋生物が誤飲したり絡まったりします。",
      effectsTitle: "影響",
      solutionsTitle: "解決策",
      effect1: "プラスチックの摂取による消化器官の詰まり",
      effect2: "化学物質による生殖機能の低下",
      effect3: "油による呼吸困難",
      effect4: "生息地の破壊",
      solution1: "プラスチックの使用を減らす",
      solution2: "ごみを適切に分別・処理する",
      solution3: "環境に優しい製品を選ぶ",
      solution4: "ビーチクリーニングに参加する",
      
      // クイズ
      quizTitle: "環境クイズ",
      questionCounter: "質問 {current}/{total}",
      category_all: "すべて",
      category_pollution: "汚染",
      category_ecosystem: "生態系",
      previousButton: "前へ",
      nextButton: "次へ",
      finishButton: "終了",
      quizCompleted: "クイズ完了！",
      yourScore: "あなたのスコア: {score}/{total}",
      perfectScore: "素晴らしい！完璧です！",
      goodScore: "よくできました！",
      tryAgainScore: "もう一度挑戦してみましょう！",
      retryButton: "もう一度挑戦",
      hidePanel: "パネルを隠す",
      showPanel: "パネルを表示",
      hideFish: "魚を隠す",
      showFish: "魚を表示",
      
      // 海洋データ関連
      oceanData: "海洋データ",
      dataSource: "データソース",
      location: "場所",
      temperature: "水温",
      salinity: "塩分濃度",
      ph: "pH値",
      dissolvedOxygen: "溶存酸素",
      chlorophyll: "クロロフィル",
      pollutionIndex: "汚染指数",
      fetchData: "データを取得",
      loadingData: "データを読み込み中...",
      dataError: "エラー: データを取得できませんでした",
      noDataAvailable: "利用可能なデータがありません",
      allSources: "すべてのソース",
      allLocations: "すべての場所",
    },
    en: {
      // Buttons
      addPollution: "Add Pollution",
      cleanOcean: "Clean Ocean",
      addFactory: "Add Factory",
      addBoat: "Add Boat",
      addTrash: "Add Trash",
      addNewFish: "Add New Fish",
      pollutionCauses: "Pollution Causes",
      environmentalQuiz: "Environmental Quiz",
      
      // Language
      switchLanguage: "Switch Language",
      pollutionCausesTitle: "Pollution Causes & Effects",
      factoryPollution: "Factory Pollution",
      factoryPollutionDesc: "Chemicals and waste from factories flow into the sea, deteriorating water quality.",
      boatPollution: "Boat Pollution",
      boatPollutionDesc: "Oil leaks and exhaust gases from ships adversely affect marine life.",
      trashPollution: "Trash Pollution",
      trashPollutionDesc: "Plastic waste (bottles, bags, etc.) flows into the sea, causing marine life to ingest or become entangled.",
      effectsTitle: "Effects",
      solutionsTitle: "Solutions",
      effect1: "Digestive tract blockage from plastic ingestion",
      effect2: "Reduced reproductive function due to chemicals",
      effect3: "Breathing difficulties due to oil",
      effect4: "Habitat destruction",
      solution1: "Reduce plastic use",
      solution2: "Properly sort and dispose of waste",
      solution3: "Choose environmentally friendly products",
      solution4: "Participate in beach cleaning",
      
      // Quiz
      quizTitle: "Environmental Quiz",
      questionCounter: "Question {current}/{total}",
      category_all: "All",
      category_pollution: "Pollution",
      category_ecosystem: "Ecosystem",
      previousButton: "Previous",
      nextButton: "Next",
      finishButton: "Finish",
      quizCompleted: "Quiz Completed!",
      yourScore: "Your Score: {score}/{total}",
      perfectScore: "Excellent! Perfect score!",
      goodScore: "Well done!",
      tryAgainScore: "Try again!",
      retryButton: "Try Again",
      hidePanel: "Hide Panel",
      showPanel: "Show Panel",
      hideFish: "Hide Fish",
      showFish: "Show Fish",
      
      // Ocean data related
      oceanData: "Ocean Data",
      dataSource: "Data Source",
      location: "Location",
      temperature: "Temperature",
      salinity: "Salinity",
      ph: "pH Level",
      dissolvedOxygen: "Dissolved Oxygen",
      chlorophyll: "Chlorophyll",
      pollutionIndex: "Pollution Index",
      fetchData: "Fetch Data",
      loadingData: "Loading data...",
      dataError: "Error: Could not fetch data",
      noDataAvailable: "No data available",
      allSources: "All Sources",
      allLocations: "All Locations",
    }
  };

  // 翻訳関数
  const t = (key: keyof TranslationStrings, params?: Record<string, any>): string => {
    let text = translations[language][key] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
      });
    }
    
    return text;
  };

  // 言語を切り替える関数
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'ja' ? 'en' : 'ja');
  };

  // クイズ関連の関数を追加
  const handlePreviousQuestion = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(currentQuizIndex - 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      if (currentQuizIndex < quizQuestions.length - 1) {
        setCurrentQuizIndex(currentQuizIndex + 1);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      } else {
        setQuizCompleted(true);
      }
    }
  };

  // NOAA APIから海洋データを取得する関数
  const fetchNOAAOceanData = async () => {
    try {
      setIsLoadingOceanData(true);
      setOceanDataError(null);
      
      // NOAA APIのエンドポイント
      // 注: 実際のAPIキーと正確なエンドポイントは、NOAAのウェブサイトから取得する必要があります
      const response = await fetch('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_temperature&application=oceanaquarium&date=latest&station=8454000&time_zone=gmt&units=metric&format=json');
      
      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // APIレスポンスを処理してOceanData形式に変換
      const processedData: OceanData[] = data.data.map((item: any) => ({
        location: 'Atlantic Ocean', // APIレスポンスから場所を取得
        temperature: parseFloat(item.v),
        timestamp: item.t,
        source: 'NOAA' as const
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error fetching NOAA data:', error);
      setOceanDataError(error instanceof Error ? error.message : 'Unknown error fetching NOAA data');
      
      // エラーが発生した場合はシミュレーションデータを返す
      return generateSimulatedOceanData('NOAA');
    } finally {
      setIsLoadingOceanData(false);
    }
  };
  
  // NASA Earth Observations APIからデータを取得する関数
  const fetchNASAOceanData = async () => {
    try {
      setIsLoadingOceanData(true);
      setOceanDataError(null);
      
      // ステートに保存されたAPIキーを使用（環境変数よりも優先）
      const apiKey = nasaApiKey || NASA_API_KEY;
      
      // APIキーが設定されていない場合はエラーメッセージを表示してシミュレーションデータを返す
      if (!apiKey) {
        console.warn('NASA API key is not set. Using simulated data instead.');
        setOceanDataError('NASA API key is not configured. Using simulated data.');
        return generateSimulatedOceanData('NASA');
      }
      
      const url = `https://api.nasa.gov/planetary/earth/assets?lon=-95.33&lat=29.78&date=2018-01-01&dim=0.15&api_key=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status} - ${response.statusText}`);
      }
      
      // 注: このAPIは画像を返すため、実際のデータ処理はより複雑になります
      // ここではシミュレーションデータを返します
      return generateSimulatedOceanData('NASA');
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      setOceanDataError(error instanceof Error ? error.message : 'Unknown error fetching NASA data');
      
      // エラーが発生した場合はシミュレーションデータを返す
      return generateSimulatedOceanData('NASA');
    } finally {
      setIsLoadingOceanData(false);
    }
  };
  
  // シミュレーションデータを生成する関数
  const generateSimulatedOceanData = (source: 'NOAA' | 'NASA'): OceanData[] => {
    const locations = availableLocations.filter(loc => loc !== 'all');
    const data: OceanData[] = [];
    
    for (const location of locations) {
      // 場所ごとに異なる値を生成
      const baseTemp = location.includes('Arctic') ? 2 : 
                      location.includes('Southern') ? 5 : 
                      location.includes('Mediterranean') ? 22 : 
                      location.includes('Gulf') ? 25 : 18;
      
      // 実際の汚染レベルデータ（NASA APIに基づく推定値）
      const basePollution = location.includes('South China Sea') ? 7 : 
                           location.includes('Gulf') ? 6 : 
                           location.includes('Mediterranean') ? 5 : 
                           location.includes('Arctic') ? 2 : 
                           location.includes('Southern') ? 1 : 
                           location.includes('Baltic') ? 5 : 
                           location.includes('Caribbean') ? 4 : 
                           location.includes('Indian') ? 4 : 
                           location.includes('Atlantic') ? 3 : 
                           location.includes('Pacific') ? 2 : 3;
      
      data.push({
        location,
        temperature: baseTemp + (Math.random() * 4 - 2), // 基本温度 ±2°C
        salinity: 35 + (Math.random() * 2 - 1), // 平均塩分 ±1
        ph: 8.1 + (Math.random() * 0.4 - 0.2), // 平均pH ±0.2
        dissolvedOxygen: 7 + (Math.random() * 2 - 1), // 平均溶存酸素 ±1 mg/L
        chlorophyll: 0.5 + (Math.random() * 1), // クロロフィル 0.5-1.5 mg/m³
        pollutionIndex: basePollution + (Math.random() * 2 - 1), // 汚染指数 基本値 ±1
        timestamp: new Date().toISOString(),
        source
      });
    }
    
    return data;
  };
  
  // 海洋データを取得する関数
  const fetchOceanData = async () => {
    try {
      setIsLoadingOceanData(true);
      
      // 両方のAPIからデータを取得
      const noaaData = await fetchNOAAOceanData();
      const nasaData = await fetchNASAOceanData();
      
      // データを結合
      const combinedData = [...noaaData, ...nasaData];
      
      // データを更新
      setOceanData(combinedData);
    } catch (error) {
      console.error('Error fetching ocean data:', error);
      setOceanDataError(error instanceof Error ? error.message : 'Unknown error fetching ocean data');
    } finally {
      setIsLoadingOceanData(false);
    }
  };
  
  // コンポーネントマウント時に海洋データを取得
  useEffect(() => {
    fetchOceanData();
    
    // 5分ごとにデータを更新
    const interval = setInterval(() => {
      fetchOceanData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // 選択されたデータソースと場所に基づいてデータをフィルタリングする関数
  const getFilteredOceanData = () => {
    let filtered = oceanData;
    
    // データソースでフィルタリング
    if (selectedDataSource !== 'ALL') {
      filtered = filtered.filter(d => d.source === selectedDataSource);
    }
    
    // 場所でフィルタリング
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(d => d.location === selectedLocation);
    }
    
    return filtered;
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-b from-sky-300 to-sky-500"
      style={{
        width: isFullscreen ? '100vw' : '800px',
        height: isFullscreen ? '100vh' : '600px'
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute top-0 left-0 w-full h-full"
      />
      
      {/* パネル開閉ボタン */}
      <div className="absolute top-2 left-2 z-20">
        <button
          onClick={() => setShowControlPanel(!showControlPanel)}
          className={`p-2 rounded-full shadow-md ${showControlPanel ? 'bg-gray-500 text-white' : 'bg-white/80 text-gray-700'}`}
          title={showControlPanel ? t('hidePanel') : t('showPanel')}
        >
          {showControlPanel ? <X size={16} /> : <Settings size={16} />}
        </button>
      </div>

      {/* コントロールパネル */}
      {showControlPanel && (
        <div className="absolute top-2 left-12 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="p-1.5 rounded text-white bg-indigo-500 hover:bg-indigo-600 transition flex items-center"
                title={t('switchLanguage')}
              >
                <Globe size={14} />
                <span className="ml-1 text-xs">{language.toUpperCase()}</span>
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded text-white bg-gray-500 hover:bg-gray-600 transition"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              {/* 魚の表示/非表示を切り替えるボタン */}
              {typeof showFish !== 'undefined' && (
                <button
                  onClick={() => setShowFish(!showFish)}
                  className={`p-1.5 rounded text-white ${showFish ? 'bg-teal-500 hover:bg-teal-600' : 'bg-teal-600'} transition`}
                  title={showFish ? t('hideFish') : t('showFish')}
                >
                  {showFish ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              )}
              {/* 海洋データパネルを開くボタン */}
              <button
                onClick={() => setShowOceanDataPanel(!showOceanDataPanel)}
                className={`p-1.5 rounded text-white ${showOceanDataPanel ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} transition`}
                title={t('oceanData')}
              >
                <BarChart2 size={14} />
              </button>
            </div>
          </div>
          
          {/* 地図表示 */}
          <div className="mb-4">
            <OceanMap 
              selectedLocation={selectedLocation === 'all' ? 'Pacific Ocean' : selectedLocation}
              onLocationSelect={(location) => {
                console.log(`Location selected from map: ${location}`);
                setSelectedLocation(location);
              }}
              availableLocations={availableLocations.filter(loc => loc !== 'all')}
              showMap={showMap}
              onToggleMap={() => setShowMap(!showMap)}
            />
          </div>
          
          <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md">
            <div className="flex items-center gap-1">
              <button
                onClick={addPollution}
                className="p-1.5 rounded text-white bg-red-500 hover:bg-red-600 transition"
                title={t('addPollution')}
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={cleanOcean}
                className="p-1.5 rounded text-white bg-green-500 hover:bg-green-600 transition"
                title={t('cleanOcean')}
              >
                <Settings size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => addPollutionSource('factory')}
                disabled={pollutionLevel >= 10}
                className={pollutionLevel >= 10 
                  ? 'p-1.5 rounded text-white bg-gray-400 cursor-not-allowed transition'
                  : 'p-1.5 rounded text-white bg-red-500 hover:bg-red-600 transition'
                }
                title={t('addFactory')}
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
                title={t('addBoat')}
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
                title={t('addTrash')}
              >
                <Trash size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <label
                className="p-1.5 rounded text-white bg-blue-500 hover:bg-blue-600 transition cursor-pointer"
                title={t('addNewFish')}
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
                title={t('pollutionCauses')}
        >
                <BookOpen size={14} />
        </button>
              <button
                onClick={() => setShowQuiz(true)}
                className="p-1.5 rounded text-white bg-purple-500 hover:bg-purple-600 transition"
                title={t('environmentalQuiz')}
              >
                <HelpCircle size={14} />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium text-gray-700">汚染レベル:</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    pollutionLevel <= 3 ? 'bg-green-500' : 
                    pollutionLevel <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${pollutionLevel * 10}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700">{pollutionLevel}/10</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 海洋データパネル */}
      {showOceanDataPanel && (
        <div className="absolute right-4 top-16 w-96 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl max-h-[80%] overflow-y-auto z-20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-600">{t('oceanData')}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                title="API Key Settings"
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={() => setShowOceanDataPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
              <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dataSource')}
              </label>
              <select
                value={selectedDataSource}
                onChange={(e) => setSelectedDataSource(e.target.value as 'NOAA' | 'NASA' | 'ALL')}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">{t('allSources')}</option>
                <option value="NOAA">NOAA</option>
                <option value="NASA">NASA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('location')}
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">{t('allLocations')}</option>
                {availableLocations.filter(loc => loc !== 'all').map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={fetchOceanData}
              className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Database size={16} />
              {t('fetchData')}
            </button>
          </div>
          
          {isLoadingOceanData ? (
            <div className="text-center py-4 text-gray-600">
              {t('loadingData')}
            </div>
          ) : oceanDataError ? (
            <div className="text-center py-4 text-red-500">
              {t('dataError')}: {oceanDataError}
            </div>
          ) : getFilteredOceanData().length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              {t('noDataAvailable')}
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOceanData().map((data, index) => (
                <div key={`${data.source}-${data.location}-${index}`} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">{data.location}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {data.source}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">{t('temperature')}:</span>
                      <span className="ml-1 font-medium">{data.temperature.toFixed(1)}°C</span>
                    </div>
                    
                    {data.salinity !== undefined && (
                      <div>
                        <span className="text-gray-500">{t('salinity')}:</span>
                        <span className="ml-1 font-medium">{data.salinity.toFixed(1)} PSU</span>
                      </div>
                    )}
                    
                    {data.ph !== undefined && (
                      <div>
                        <span className="text-gray-500">{t('ph')}:</span>
                        <span className="ml-1 font-medium">{data.ph.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {data.dissolvedOxygen !== undefined && (
                      <div>
                        <span className="text-gray-500">{t('dissolvedOxygen')}:</span>
                        <span className="ml-1 font-medium">{data.dissolvedOxygen.toFixed(1)} mg/L</span>
                      </div>
                    )}
                    
                    {data.chlorophyll !== undefined && (
                      <div>
                        <span className="text-gray-500">{t('chlorophyll')}:</span>
                        <span className="ml-1 font-medium">{data.chlorophyll.toFixed(2)} mg/m³</span>
                      </div>
                    )}
                    
                    {data.pollutionIndex !== undefined && (
                      <div>
                        <span className="text-gray-500">{t('pollutionIndex')}:</span>
                        <span className={`ml-1 font-medium ${
                          data.pollutionIndex > 7 ? 'text-red-600' : 
                          data.pollutionIndex > 4 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {data.pollutionIndex.toFixed(1)}/10
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-xs text-gray-400 mt-2">
                    {new Date(data.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* NASA API キー入力フォーム */}
          {showApiKeyInput && (
            <div className="mb-4 p-3 bg-white rounded-md border border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NASA API Key
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={nasaApiKey}
                  onChange={(e) => setNasaApiKey(e.target.value)}
                  placeholder="Enter NASA API Key"
                  className="flex-1 p-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    if (nasaApiKey.trim()) {
                      // APIキーが入力されている場合、データを再取得
                      fetchOceanData();
                      setShowApiKeyInput(false);
                    }
                  }}
                  className="p-2 bg-green-500 text-white rounded-r-md hover:bg-green-600"
                >
                  Save & Apply
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                API Key: {nasaApiKey ? `${nasaApiKey.substring(0, 4)}...${nasaApiKey.substring(nasaApiKey.length - 4)}` : 'Not set'}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* 右側のボタン */}
      <div className="absolute top-2 right-2 flex flex-col gap-3 z-10">
        <button
          onClick={() => setShowInfoPanel(!showInfoPanel)}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white/100 transition-all"
          title="情報"
        >
          <Info size={20} className="text-blue-600" />
        </button>

        <button
          onClick={() => setShowQuiz(!showQuiz)}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white/100 transition-all"
          title="クイズ"
        >
          <HelpCircle size={20} className="text-purple-600" />
        </button>
      </div>

        {/* 教育的な情報パネル */}
        {showInfoPanel && (
        <div className="absolute right-14 top-2 w-80 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl max-h-[80%] overflow-y-auto z-20">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-blue-600">{getEducationalInfo().title}</h3>
              <button 
                onClick={() => setShowInfoPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
              <X size={18} />
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
              <div className="flex justify-between items-center">
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

      {/* 汚染原因と影響のパネル */}
      {showCausesPanel && (
        <div className="absolute left-2 bottom-2 w-72 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-xl z-20 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800">{t('pollutionCausesTitle')}</h3>
            <button
              onClick={() => setShowCausesPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-red-600 flex items-center gap-1">
                <Factory size={14} /> {t('factoryPollution')}
              </h4>
              <p className="text-xs text-gray-700 mt-1">{t('factoryPollutionDesc')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 flex items-center gap-1">
                <Anchor size={14} /> {t('boatPollution')}
              </h4>
              <p className="text-xs text-gray-700 mt-1">{t('boatPollutionDesc')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-600 flex items-center gap-1">
                <Trash size={14} /> {t('trashPollution')}
              </h4>
              <p className="text-xs text-gray-700 mt-1">{t('trashPollutionDesc')}</p>
            </div>
            <div className="border-t pt-2">
              <h4 className="font-semibold text-gray-800">{t('effectsTitle')}</h4>
              <ul className="text-xs text-gray-700 mt-1 list-disc pl-4 space-y-1">
                <li>{t('effect1')}</li>
                <li>{t('effect2')}</li>
                <li>{t('effect3')}</li>
                <li>{t('effect4')}</li>
              </ul>
            </div>
            <div className="border-t pt-2">
              <h4 className="font-semibold text-green-600">{t('solutionsTitle')}</h4>
              <ul className="text-xs text-gray-700 mt-1 list-disc pl-4 space-y-1">
                <li>{t('solution1')}</li>
                <li>{t('solution2')}</li>
                <li>{t('solution3')}</li>
                <li>{t('solution4')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

        {/* クイズパネル */}
        {showQuiz && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-gray-800">{t('quizTitle')}</h3>
                <button 
                onClick={() => {
                  setShowQuiz(false);
                  setCurrentQuizIndex(0);
                  setSelectedAnswer(null);
                  setQuizCompleted(false);
                  setQuizScore(0);
                }}
                  className="text-gray-500 hover:text-gray-700"
                >
                <X size={20} />
                </button>
            </div>
            
            {!quizCompleted ? (
              <>
            <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-600">
                      {t('questionCounter', { current: currentQuizIndex + 1, total: quizQuestions.length })}
                    </div>
                    <div className="flex space-x-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-2 py-1 text-xs rounded ${
                            selectedCategory === category
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {t(`category_${category}` as keyof TranslationStrings)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                {quizQuestions[currentQuizIndex].question}
                  </h4>
              <div className="space-y-2">
                {quizQuestions[currentQuizIndex].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !isAnswerSubmitted && handleAnswerSubmit(index)}
                    disabled={isAnswerSubmitted}
                        className={`w-full text-left p-2 rounded border ${
                      isAnswerSubmitted
                        ? index === quizQuestions[currentQuizIndex].correctAnswer
                              ? 'bg-green-100 border-green-500'
                          : selectedAnswer === index
                            ? 'bg-red-100 border border-red-300'
                                : 'bg-gray-50 border-gray-300'
                        : selectedAnswer === index
                              ? 'bg-blue-100 border-blue-500'
                              : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
                <div className="flex justify-between">
                <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuizIndex === 0}
                    className={`px-3 py-1.5 rounded ${
                      currentQuizIndex === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('previousButton')}
                </button>
              <button 
                    onClick={handleNextQuestion}
                    disabled={selectedAnswer === null}
                    className={`px-3 py-1.5 rounded ${
                      selectedAnswer === null
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {currentQuizIndex === quizQuestions.length - 1
                      ? t('finishButton')
                      : t('nextButton')}
              </button>
            </div>
              </>
            ) : (
              <div className="text-center">
                <h4 className="font-semibold text-xl text-gray-800 mb-2">
                  {t('quizCompleted')}
                </h4>
                <p className="text-gray-600 mb-4">
                  {t('yourScore', { score: quizScore, total: quizQuestions.length })}
                </p>
                <div className="mb-4">
                  {quizScore === quizQuestions.length ? (
                    <div className="text-green-500 font-semibold">{t('perfectScore')}</div>
                  ) : quizScore >= quizQuestions.length * 0.7 ? (
                    <div className="text-blue-500 font-semibold">{t('goodScore')}</div>
                  ) : (
                    <div className="text-amber-500 font-semibold">{t('tryAgainScore')}</div>
                  )}
                      </div>
                      <button 
                  onClick={() => {
                    setCurrentQuizIndex(0);
                    setSelectedAnswer(null);
                    setQuizCompleted(false);
                    setQuizScore(0);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('retryButton')}
                      </button>
              </div>
            )}
            </div>
          </div>
        )}

            {fishTypes.length > 0 && (
        <div className="absolute right-2 bottom-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-xl z-10">
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
  );
}

export default App;