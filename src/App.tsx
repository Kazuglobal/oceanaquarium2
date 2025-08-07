import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Upload, Plus, Minus, Fish as FishIcon, Maximize2, Minimize2, Settings, BookOpen, HelpCircle, Factory, Anchor, Trash, Globe, X, Info, Eye, EyeOff, Database, BarChart2, RefreshCw, Loader } from 'lucide-react';
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
  color?: string; // Optional color for special bubbles
}

// パーティクルエフェクト用のインターフェース
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'sparkle' | 'splash' | 'cleanup';
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

// クリーンアップミッション用のゴミアイテムのインターフェース
interface TrashItem {
  id: string;
  type: 'bottle' | 'bag' | 'can' | 'generic';
  x: number;
  y: number;
  size: number;
  rotation: number;
  bobOffset: number;
  bobSpeed: number;
  isBeingRemoved: boolean;
  removalProgress: number;
  points: number;
  image: HTMLImageElement | null;
}

// クリーンアップミッションの状態
interface CleanupMission {
  isActive: boolean;
  targetTrashCount: number;
  removedTrashCount: number;
  score: number;
  timeRemaining: number;
  isCompleted: boolean;
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
  
  // クリーンアップミッション関連
  startCleanupMission: string;
  stopCleanupMission: string;
  cleanupMissionTitle: string;
  trashRemoved: string;
  missionScore: string;
  timeRemaining: string;
  missionCompleted: string;
  congratulations: string;
  clickTrashToRemove: string;
  missionProgress: string;
  pointsEarned: string;
  restartMission: string;
  
  // 教育的メッセージ
  trashEducation: string;
  bottleEducation: string;
  bagEducation: string;
  canEducation: string;
  genericEducation: string;
  greatJob: string;
  keepGoing: string;
  almostDone: string;
  excellentWork: string;
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
  
  // クリーンアップミッション関連の状態
  const [cleanupMission, setCleanupMission] = useState<CleanupMission>({
    isActive: false,
    targetTrashCount: 15,
    removedTrashCount: 0,
    score: 0,
    timeRemaining: 180, // 3分
    isCompleted: false
  });
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const trashImagesRef = useRef<{[key: string]: HTMLImageElement | null}>({
    bottle: null,
    bag: null,
    can: null,
    generic: null
  });
  const particlesRef = useRef<Particle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [educationalMessage, setEducationalMessage] = useState<{
    visible: boolean;
    message: string;
    encouragement: string;
  }>({ visible: false, message: '', encouragement: '' });
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
  
  // リアルタイム海洋データモード関連の状態
  const [realTimePollutionMode, setRealTimePollutionMode] = useState(false);
  
  // 背景削除のプレビューと設定
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const [backgroundRemovalSettings, setBackgroundRemovalSettings] = useState<BackgroundRemovalOptions>({
    tolerance: 35,
    multiSample: true,
    edgeProtection: true,
    morphology: true,
    antiAlias: true,
    showPreview: false,
    previewMode: 'result',
    fastMode: true, // デフォルトで高速モード
    maxSize: 800,
    detectionMode: 'auto' // 自動検出モード
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // プリセット設定
  const backgroundRemovalPresets = {
    fast: {
      tolerance: 40,
      multiSample: false,
      edgeProtection: false,
      morphology: false,
      antiAlias: false,
      fastMode: true,
      maxSize: 500,
      detectionMode: 'auto' as BackgroundDetectionMode
    },
    white: {
      tolerance: 25,
      multiSample: true,
      edgeProtection: true,
      morphology: true,
      antiAlias: true,
      fastMode: false,
      maxSize: 1000,
      detectionMode: 'white' as BackgroundDetectionMode
    },
    beige: {
      tolerance: 35,
      multiSample: true,
      edgeProtection: true,
      morphology: true,
      antiAlias: true,
      fastMode: false,
      maxSize: 1000,
      detectionMode: 'beige' as BackgroundDetectionMode
    },
    ultra: {
      tolerance: 30,
      multiSample: false,
      edgeProtection: false,
      morphology: false,
      antiAlias: false,
      fastMode: true,
      maxSize: 800,
      detectionMode: 'ultra' as BackgroundDetectionMode
    },
    complex: {
      tolerance: 50,
      multiSample: true,
      edgeProtection: true,
      morphology: true,
      antiAlias: true,
      fastMode: false,
      maxSize: 1200,
      detectionMode: 'manual' as BackgroundDetectionMode
    }
  };

  const applyPreset = (presetName: keyof typeof backgroundRemovalPresets) => {
    setBackgroundRemovalSettings(prev => ({
      ...prev,
      ...backgroundRemovalPresets[presetName]
    }));
  };
  
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
  
  // 海域名の日本語翻訳マッピング
  const oceanNameTranslations: Record<string, string> = {
    'Pacific Ocean': '太平洋',
    'Atlantic Ocean': '大西洋',
    'Indian Ocean': 'インド洋',
    'Arctic Ocean': '北極海',
    'Southern Ocean': '南極海',
    'Gulf of Mexico': 'メキシコ湾',
    'Mediterranean Sea': '地中海',
    'Caribbean Sea': 'カリブ海',
    'South China Sea': '南シナ海',
    'Bering Sea': 'ベーリング海',
    'all': 'すべて'
  };
  
  // 海域名を日本語に変換する関数
  const getOceanNameInJapanese = (name: string): string => {
    return oceanNameTranslations[name] || name;
  };

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

  // 背景削除のための型定義
  interface RGB {
    r: number;
    g: number;
    b: number;
  }

  interface Point {
    x: number;
    y: number;
  }

  interface BackgroundRemovalOptions {
    tolerance?: number;
    multiSample?: boolean;
    edgeProtection?: boolean;
    morphology?: boolean;
    antiAlias?: boolean;
    showPreview?: boolean;
    previewMode?: 'mask' | 'result';
    fastMode?: boolean; // 高速モード
    maxSize?: number;   // 最大処理サイズ
    detectionMode?: BackgroundDetectionMode; // 背景検出モード
  }

  // 高速RGB色差計算（パフォーマンス重視）
  const calculateColorDistance = (color1: RGB, color2: RGB): number => {
    const deltaR = color1.r - color2.r;
    const deltaG = color1.g - color2.g;
    const deltaB = color1.b - color2.b;
    
    // 知覚的重み付きユークリッド距離（高速版）
    const weightR = 0.3;
    const weightG = 0.59; // 人間の目は緑に敏感
    const weightB = 0.11;
    
    return Math.sqrt(
      weightR * deltaR * deltaR +
      weightG * deltaG * deltaG +
      weightB * deltaB * deltaB
    );
  };

  // HSV色空間変換
  const rgbToHsv = (rgb: RGB): { h: number; s: number; v: number } => {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    return { h, s: s * 100, v: v * 100 };
  };

  // 背景検出タイプの定義
  type BackgroundDetectionMode = 'auto' | 'white' | 'light' | 'beige' | 'manual' | 'ultra';

  // 革新的アルゴリズム用の型定義
  interface GridCell {
    x: number;
    y: number;
    width: number;
    height: number;
    avgColor: RGB;
    variance: number;
    fishProbability: number;
    backgroundProbability: number;
  }

  interface FishFeatures {
    centerX: number;
    centerY: number;
    area: number;
    aspectRatio: number;
    compactness: number;
    colorUniformity: number;
  }

  // 包括的な明るい背景検出
  const isLightBackground = (color: RGB, mode: BackgroundDetectionMode = 'auto', tolerance: number = 30): boolean => {
    const avgBrightness = (color.r + color.g + color.b) / 3;
    const hsv = rgbToHsv(color);
    
    switch (mode) {
      case 'white':
        // 純白背景：高輝度 + 低彩度
        return avgBrightness >= 220 && hsv.s <= 15;
        
      case 'light':
        // 明るい背景：中高輝度 + 低彩度
        return avgBrightness >= 170 && hsv.s <= 25;
        
      case 'beige':
        // ベージュ/クリーム背景：中輝度 + 低彩度 + 暖色系
        return avgBrightness >= 160 && hsv.s <= 40 && 
               (hsv.h >= 20 && hsv.h <= 60); // 黄～オレンジ系
        
      case 'auto':
        // 自動判定：複数の条件を組み合わせ
        if (avgBrightness >= 220 && hsv.s <= 15) return true; // 純白
        if (avgBrightness >= 180 && hsv.s <= 20) return true; // 明るいグレー
        if (avgBrightness >= 160 && hsv.s <= 35 && hsv.h >= 20 && hsv.h <= 60) return true; // ベージュ
        if (avgBrightness >= 200 && hsv.s <= 30) return true; // その他明るい色
        return false;
        
      case 'manual':
        // 手動モード：より緩い条件
        return avgBrightness >= 150 && hsv.s <= 50;
        
      case 'ultra':
        // Ultraモード：Ultra-Algorithmが処理するため、常にfalse
        return false;
        
      default:
        return false;
    }
  };

  // 従来の白背景検出は互換性のため残す
  const isWhiteBackground = (color: RGB, tolerance: number = 30): boolean => {
    return isLightBackground(color, 'white', tolerance);
  };

  // 🚀 Ultra-Algorithm: インテリジェント・グリッド分析
  const analyzeImageGrid = (imageData: ImageData, gridSize: number = 12): GridCell[] => {
    const { width, height, data } = imageData;
    const cellWidth = Math.floor(width / gridSize);
    const cellHeight = Math.floor(height / gridSize);
    const cells: GridCell[] = [];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellX = col * cellWidth;
        const cellY = row * cellHeight;
        const actualWidth = Math.min(cellWidth, width - cellX);
        const actualHeight = Math.min(cellHeight, height - cellY);

        // セル内の色データを分析
        const colors: RGB[] = [];
        for (let y = cellY; y < cellY + actualHeight; y += 2) { // サンプリング間隔を2に
          for (let x = cellX; x < cellX + actualWidth; x += 2) {
            const idx = (y * width + x) * 4;
            colors.push({
              r: data[idx],
              g: data[idx + 1],
              b: data[idx + 2]
            });
          }
        }

        if (colors.length === 0) continue;

        // 平均色計算
        const avgColor = {
          r: colors.reduce((sum, c) => sum + c.r, 0) / colors.length,
          g: colors.reduce((sum, c) => sum + c.g, 0) / colors.length,
          b: colors.reduce((sum, c) => sum + c.b, 0) / colors.length
        };

        // 色分散計算
        const variance = colors.reduce((sum, c) => {
          return sum + Math.pow(c.r - avgColor.r, 2) + 
                     Math.pow(c.g - avgColor.g, 2) + 
                     Math.pow(c.b - avgColor.b, 2);
        }, 0) / colors.length;

        // 魚の存在確率計算（位置ベース + 色特徴ベース）
        const centerX = cellX + actualWidth / 2;
        const centerY = cellY + actualHeight / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2)
        ) / Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
        
        // 位置による確率（中央ほど高い）
        const positionProb = Math.max(0, 1 - distanceFromCenter * 1.2);
        
        // 色の複雑さによる確率（魚は複雑な色パターンを持つ）
        const complexityProb = Math.min(1, variance / 2000);
        
        // 明度による調整（極端に明るいまたは暗い部分は背景の可能性が高い）
        const brightness = (avgColor.r + avgColor.g + avgColor.b) / 3;
        const brightnessProb = brightness > 240 || brightness < 40 ? 0.2 : 1.0;

        const fishProbability = (positionProb * 0.4 + complexityProb * 0.4 + brightnessProb * 0.2);
        const backgroundProbability = 1 - fishProbability;

        cells.push({
          x: cellX,
          y: cellY,
          width: actualWidth,
          height: actualHeight,
          avgColor,
          variance,
          fishProbability,
          backgroundProbability
        });
      }
    }

    return cells;
  };

  // 🧠 Ultra-Algorithm: 確率的マスキングシステム
  const generateProbabilisticMask = (
    imageData: ImageData, 
    gridCells: GridCell[]
  ): number[][] => {
    const { width, height, data } = imageData;
    const mask = Array(height).fill(null).map(() => Array(width).fill(0));

    // 各ピクセルの背景確率を計算
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixelColor = {
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2]
        };

        // 所属するグリッドセルを特定
        const cell = gridCells.find(c => 
          x >= c.x && x < c.x + c.width && 
          y >= c.y && y < c.y + c.height
        );

        if (!cell) {
          mask[y][x] = 1; // デフォルトで背景とする
          continue;
        }

        // 複数の要素から確率を計算
        let backgroundProb = 0;

        // 1. セルの背景確率
        backgroundProb += cell.backgroundProbability * 0.3;

        // 2. 色差による確率
        const colorDistance = calculateColorDistance(pixelColor, cell.avgColor);
        const colorProb = Math.min(1, colorDistance / 100);
        backgroundProb += colorProb * 0.2;

        // 3. 端からの距離による確率
        const edgeDistance = Math.min(
          x, y, width - x - 1, height - y - 1
        ) / Math.min(width, height);
        const edgeProb = Math.max(0, 1 - edgeDistance * 3);
        backgroundProb += edgeProb * 0.2;

        // 4. 水族館環境特有の判定
        const hsv = rgbToHsv(pixelColor);
        let aquariumProb = 0;
        
        // 水の特徴（青系、高明度、低彩度）
        if (hsv.h >= 180 && hsv.h <= 240 && hsv.v > 50) {
          aquariumProb += 0.7;
        }
        
        // 砂・岩の特徴（茶系、低彩度）
        if ((hsv.h >= 20 && hsv.h <= 60) && hsv.s < 50) {
          aquariumProb += 0.6;
        }
        
        // 極端に明るい部分（照明、気泡）
        if (hsv.v > 90 && hsv.s < 20) {
          aquariumProb += 0.8;
        }

        backgroundProb += aquariumProb * 0.3;

        // 確率を0-1の範囲に正規化
        mask[y][x] = Math.max(0, Math.min(1, backgroundProb));
      }
    }

    return mask;
  };

  // 明るい背景領域の検出（拡張版）
  const detectLightBackgroundAreas = (imageData: ImageData, mode: BackgroundDetectionMode = 'auto'): RGB[] => {
    const { width, height, data } = imageData;
    const lightColors: RGB[] = [];
    
    // エッジ部分の明るい領域を優先的にサンプリング
    const edgePoints: Point[] = [];
    
    // 上下のエッジ（密度を上げて精度向上）
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 30))) {
      edgePoints.push({ x, y: 0 });
      edgePoints.push({ x, y: height - 1 });
    }
    
    // 左右のエッジ
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 30))) {
      edgePoints.push({ x: 0, y });
      edgePoints.push({ x: width - 1, y });
    }
    
    // 四隅の詳細サンプリング
    const cornerSize = Math.min(50, Math.floor(Math.min(width, height) / 10));
    for (let x = 0; x < cornerSize; x += 5) {
      for (let y = 0; y < cornerSize; y += 5) {
        edgePoints.push({ x, y }); // 左上
        edgePoints.push({ x: width - 1 - x, y }); // 右上
        edgePoints.push({ x, y: height - 1 - y }); // 左下
        edgePoints.push({ x: width - 1 - x, y: height - 1 - y }); // 右下
      }
    }
    
    edgePoints.forEach(({ x, y }) => {
      const idx = (y * width + x) * 4;
      const color = {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2]
      };
      
      if (isLightBackground(color, mode)) {
        lightColors.push(color);
      }
    });
    
    return lightColors;
  };

  // 従来の白背景検出（互換性のため）
  const detectWhiteBackgroundAreas = (imageData: ImageData): RGB[] => {
    return detectLightBackgroundAreas(imageData, 'white');
  };

  // 改良された背景色検出（検出モード対応）
  const detectBackgroundColors = (imageData: ImageData, mode: BackgroundDetectionMode = 'auto'): RGB[] => {
    // 1. 明るい背景領域を優先検出
    const lightColors = detectLightBackgroundAreas(imageData, mode);
    if (lightColors.length > 0) {
      return lightColors;
    }
    
    // 2. 従来の角・辺サンプリング（フォールバック）
    const { width, height, data } = imageData;
    const samples: Point[] = [
      { x: 0, y: 0 }, // 左上
      { x: width - 1, y: 0 }, // 右上
      { x: 0, y: height - 1 }, // 左下
      { x: width - 1, y: height - 1 }, // 右下
      { x: Math.floor(width / 2), y: 0 }, // 上中央
      { x: Math.floor(width / 2), y: height - 1 }, // 下中央
      { x: 0, y: Math.floor(height / 2) }, // 左中央
      { x: width - 1, y: Math.floor(height / 2) } // 右中央
    ];

    return samples.map(({ x, y }) => {
      const idx = (y * width + x) * 4;
      return {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2]
      };
    });
  };

  // 背景色かどうかを判定（検出モード対応）
  const isBackgroundColor = (
    pixel: RGB, 
    backgroundColors: RGB[], 
    tolerance: number, 
    mode: BackgroundDetectionMode = 'auto'
  ): boolean => {
    // 1. 明るい背景かどうかを最初に高速チェック
    if (isLightBackground(pixel, mode, tolerance * 0.8)) {
      return true;
    }
    
    // 2. 通常の色差計算
    return backgroundColors.some(bgColor => 
      calculateColorDistance(pixel, bgColor) <= tolerance
    );
  };

  // Flood Fill アルゴリズムによる連結領域の検出
  const floodFillBackground = (
    imageData: ImageData, 
    startPoints: Point[], 
    tolerance: number,
    mode: BackgroundDetectionMode = 'auto'
  ): boolean[][] => {
    const { width, height, data } = imageData;
    const mask = Array(height).fill(null).map(() => Array(width).fill(false));
    
    const getPixelColor = (x: number, y: number): RGB => {
      const idx = (y * width + x) * 4;
      return {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2]
      };
    };

    const isValid = (x: number, y: number): boolean => {
      return x >= 0 && x < width && y >= 0 && y < height;
    };

    // 8方向の隣接点
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    startPoints.forEach(start => {
      if (mask[start.y][start.x]) return;

      const queue: Point[] = [start];
      const targetColor = getPixelColor(start.x, start.y);

      while (queue.length > 0) {
        const current = queue.shift()!;
        
        if (mask[current.y][current.x]) continue;

        const currentColor = getPixelColor(current.x, current.y);
        if (isLightBackground(currentColor, mode, tolerance) || 
            calculateColorDistance(currentColor, targetColor) <= tolerance) {
          mask[current.y][current.x] = true;

          // 隣接ピクセルをキューに追加
          directions.forEach(([dx, dy]) => {
            const nx = current.x + dx;
            const ny = current.y + dy;
            if (isValid(nx, ny) && !mask[ny][nx]) {
              queue.push({ x: nx, y: ny });
            }
          });
        }
      }
    });

    return mask;
  };

  // モルフォロジー演算（クロージング：小さな穴を埋める）
  const morphologyClosing = (mask: boolean[][], kernelSize: number = 3): boolean[][] => {
    const height = mask.length;
    const width = mask[0].length;
    const result = mask.map(row => [...row]);
    
    const offset = Math.floor(kernelSize / 2);

    // Dilation（膨張）
    for (let y = offset; y < height - offset; y++) {
      for (let x = offset; x < width - offset; x++) {
        if (!mask[y][x]) {
          let hasNeighbor = false;
          for (let ky = -offset; ky <= offset; ky++) {
            for (let kx = -offset; kx <= offset; kx++) {
              if (mask[y + ky][x + kx]) {
                hasNeighbor = true;
                break;
              }
            }
            if (hasNeighbor) break;
          }
          if (hasNeighbor) result[y][x] = true;
        }
      }
    }

    // Erosion（収縮）
    const temp = result.map(row => [...row]);
    for (let y = offset; y < height - offset; y++) {
      for (let x = offset; x < width - offset; x++) {
        if (temp[y][x]) {
          let allNeighbors = true;
          for (let ky = -offset; ky <= offset; ky++) {
            for (let kx = -offset; kx <= offset; kx++) {
              if (!temp[y + ky][x + kx]) {
                allNeighbors = false;
                break;
              }
            }
            if (!allNeighbors) break;
          }
          if (!allNeighbors) result[y][x] = false;
        }
      }
    }

    return result;
  };

  // ガウシアンブラーによるエッジスムージング
  const applyGaussianBlur = (mask: boolean[][], radius: number = 1): number[][] => {
    const height = mask.length;
    const width = mask[0].length;
    const result = Array(height).fill(null).map(() => Array(width).fill(0));

    // ガウシアンカーネルの生成
    const sigma = radius / 3;
    const size = radius * 2 + 1;
    const kernel: number[] = [];
    let sum = 0;

    for (let i = 0; i < size; i++) {
      const x = i - radius;
      const value = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[i] = value;
      sum += value;
    }

    // 正規化
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }

    // 水平方向のブラー
    const temp = Array(height).fill(null).map(() => Array(width).fill(0));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let blurValue = 0;
        for (let k = 0; k < size; k++) {
          const sx = x + k - radius;
          if (sx >= 0 && sx < width) {
            blurValue += (mask[y][sx] ? 1 : 0) * kernel[k];
          }
        }
        temp[y][x] = blurValue;
      }
    }

    // 垂直方向のブラー
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let blurValue = 0;
        for (let k = 0; k < size; k++) {
          const sy = y + k - radius;
          if (sy >= 0 && sy < height) {
            blurValue += temp[sy][x] * kernel[k];
          }
        }
        result[y][x] = blurValue;
      }
    }

    return result;
  };

  const cleanOcean = () => {
    setPollutionLevel(prev => {
      const newLevel = Math.max(0, prev - 1);
      
      // 泡を減らす
      if (newLevel < prev) {
        // 汚染レベルが下がるごとに泡の30%を削除
        bubblesRef.current = bubblesRef.current.filter(() => Math.random() > 0.3);
      }
      
      // 完全にきれいになったら全ての泡を消す
      if (newLevel === 0) {
        bubblesRef.current = [];
      }
      
      // 魚の復活処理
      if (newLevel <= 3) { // 汚染レベルが3以下になったら復活開始
        let revivedCount = 0;
        fishesRef.current.forEach(fish => {
          if (fish.opacity <= 0.01) { // 死んでいる魚
            // 復活させる
            fish.opacity = 1;
            fish.healthLevel = 1;
            fish.isDying = false;
            fish.deathTimer = 0;
            revivedCount++;
            
            // 復活エフェクト用の泡を追加
            for (let i = 0; i < 10; i++) {
              bubblesRef.current.push({
                x: fish.x + (Math.random() - 0.5) * 40,
                y: fish.y + fish.yOffset,
                size: 3 + Math.random() * 5,
                speed: 2 + Math.random() * 2,
                wobbleSpeed: 0.05,
                wobbleOffset: Math.random() * Math.PI * 2,
                color: 'rgba(100, 255, 100, 0.8)' // 緑色の復活泡
              });
            }
          }
        });
        
        // 死んだ魚カウントを更新
        if (revivedCount > 0) {
          setDeadFishCount(prev => Math.max(0, prev - revivedCount));
        }
      }
      
      return newLevel;
    });
  };

  // 画像のリサイズ（高速処理用）
  const resizeImageForProcessing = (img: HTMLImageElement, maxSize: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const { width, height } = img;
    const aspectRatio = width / height;
    
    if (width <= maxSize && height <= maxSize) {
      canvas.width = width;
      canvas.height = height;
    } else if (width > height) {
      canvas.width = maxSize;
      canvas.height = maxSize / aspectRatio;
    } else {
      canvas.height = maxSize;
      canvas.width = maxSize * aspectRatio;
    }
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  // 高速背景削除（明るい背景対応）
  const fastLightBackgroundRemoval = (
    imageData: ImageData, 
    tolerance: number = 30, 
    mode: BackgroundDetectionMode = 'auto'
  ): ImageData => {
    // ultraモードの場合は専用アルゴリズムを使用
    if (mode === 'ultra') {
      return ultraBackgroundRemoval(imageData, tolerance);
    }
    
    const { width, height, data } = imageData;
    const resultData = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (isLightBackground({ r, g, b }, mode, tolerance)) {
        resultData[i + 3] = 0; // アルファ値を0にして透明化
      }
    }
    
    return new ImageData(resultData, width, height);
  };

  // 従来の白背景削除（互換性のため）
  const fastWhiteBackgroundRemoval = (imageData: ImageData, tolerance: number = 30): ImageData => {
    return fastLightBackgroundRemoval(imageData, tolerance, 'white');
  };

  // 🌟 Ultra-Algorithm: 革新的背景削除システム
  const ultraBackgroundRemoval = (imageData: ImageData, tolerance: number = 30): ImageData => {
    const { width, height, data } = imageData;
    
    console.log('🚀 Ultra-Algorithm starting...');
    
    // Step 1: グリッド分析
    const gridCells = analyzeImageGrid(imageData, 12);
    console.log('📊 Grid analysis completed:', gridCells.length, 'cells');
    
    // Step 2: 確率的マスク生成
    const probabilisticMask = generateProbabilisticMask(imageData, gridCells);
    console.log('🧠 Probabilistic mask generated');
    
    // Step 3: マスクの平滑化（ノイズ除去）
    const smoothMask = Array(height).fill(null).map(() => Array(width).fill(0));
    const kernelSize = 3;
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let y = kernelRadius; y < height - kernelRadius; y++) {
      for (let x = kernelRadius; x < width - kernelRadius; x++) {
        let sum = 0;
        let count = 0;
        
        for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
          for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
            sum += probabilisticMask[y + ky][x + kx];
            count++;
          }
        }
        
        smoothMask[y][x] = sum / count;
      }
    }
    
    // Step 4: 最終マスク適用
    const resultData = new Uint8ClampedArray(data);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const maskValue = smoothMask[y] ? smoothMask[y][x] : probabilisticMask[y][x];
        
        // 確率が閾値を超える場合は背景として削除
        if (maskValue > 0.6) {
          resultData[idx + 3] = 0; // 完全透明
        } else if (maskValue > 0.3) {
          // 半透明化でソフトエッジ
          resultData[idx + 3] = Math.round((1 - maskValue) * 255);
        }
        // それ以外は前景として保持
      }
    }
    
    console.log('✨ Ultra-Algorithm completed successfully');
    return new ImageData(resultData, width, height);
  };

  // 高度な背景削除関数（段階的処理対応）
  const removeBackground = (img: HTMLImageElement, options: BackgroundRemovalOptions = {}): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      // デフォルトオプション
      const opts = {
        tolerance: 35,
        multiSample: true,
        edgeProtection: true,
        morphology: true,
        antiAlias: true,
        fastMode: false,
        maxSize: 1000,
        detectionMode: 'auto' as BackgroundDetectionMode,
        ...options
      };

      // 高速モードまたは大きな画像の場合は縮小処理
      let processCanvas: HTMLCanvasElement;
      let scale = 1;
      
      if (opts.fastMode || img.width > opts.maxSize || img.height > opts.maxSize) {
        processCanvas = resizeImageForProcessing(img, opts.maxSize);
        scale = Math.min(opts.maxSize / img.width, opts.maxSize / img.height, 1);
      } else {
        processCanvas = document.createElement('canvas');
        processCanvas.width = img.width;
        processCanvas.height = img.height;
        const ctx = processCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
      }

      const ctx = processCanvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, processCanvas.width, processCanvas.height);

      let resultImageData: ImageData;

      // 高速モードまたはultraモード：明るい背景対応の簡単処理
      if (opts.fastMode || opts.detectionMode === 'ultra') {
        resultImageData = fastLightBackgroundRemoval(imageData, opts.tolerance, opts.detectionMode);
      } else {
        // 通常モード：高品質処理
        const { width, height, data } = imageData;

        // 1. 背景色検出（検出モード対応）
        const backgroundColors = detectBackgroundColors(imageData, opts.detectionMode);
        
        // 2. 背景色の統合
        const uniqueBackgroundColors: RGB[] = [];
        backgroundColors.forEach(color => {
          const exists = uniqueBackgroundColors.some(existing => 
            calculateColorDistance(color, existing) < 15
          );
          if (!exists) {
            uniqueBackgroundColors.push(color);
          }
        });

        // 3. 適応的閾値計算
        let adaptiveTolerance = opts.tolerance;
        if (opts.multiSample) {
          const colorVariance = calculateColorVariance(backgroundColors);
          const imageComplexity = calculateImageComplexity(imageData);
          const lighting = calculateLightingConditions(backgroundColors);
          
          const varianceAdjustment = colorVariance * 0.25;
          const complexityAdjustment = imageComplexity * 15;
          const lightingAdjustment = lighting.contrast < 0.3 ? 10 : lighting.contrast > 0.7 ? -5 : 0;
          
          adaptiveTolerance = Math.max(15, Math.min(80, 
            opts.tolerance + varianceAdjustment + complexityAdjustment + lightingAdjustment
          ));
        }

        // 4. Flood Fill処理
        const cornerPoints: Point[] = [
          { x: 0, y: 0 },
          { x: width - 1, y: 0 },
          { x: 0, y: height - 1 },
          { x: width - 1, y: height - 1 }
        ];

        let backgroundMask = floodFillBackground(imageData, cornerPoints, adaptiveTolerance, opts.detectionMode);

        // 5. エッジ保護
        if (opts.edgeProtection) {
          backgroundMask = protectEdges(imageData, backgroundMask, adaptiveTolerance * 0.6);
        }

        // 6. モルフォロジー演算
        if (opts.morphology) {
          backgroundMask = morphologyClosing(backgroundMask, 3);
        }

        // 7. アンチエイリアス
        let alphaMask: number[][];
        if (opts.antiAlias) {
          alphaMask = applyGaussianBlur(backgroundMask, 1);
        } else {
          alphaMask = backgroundMask.map(row => row.map(val => val ? 0 : 1));
        }

        // 8. 結果適用
        const resultData = new Uint8ClampedArray(data);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const alpha = alphaMask[y][x];
            resultData[idx + 3] = Math.round(alpha * 255);
          }
        }

        resultImageData = new ImageData(resultData, width, height);
      }

      // 結果をオリジナルサイズに拡大（必要な場合）
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = img.width;
      finalCanvas.height = img.height;
      const finalCtx = finalCanvas.getContext('2d')!;
      
      // 処理した画像を描画
      ctx.putImageData(resultImageData, 0, 0);
      finalCtx.drawImage(processCanvas, 0, 0, img.width, img.height);
      
      const newImg = new Image();
      newImg.onload = () => resolve(newImg);
      newImg.src = finalCanvas.toDataURL('image/png');
    });
  };

  // 画像の複雑度を計算（エッジ密度とテクスチャ分析）
  const calculateImageComplexity = (imageData: ImageData): number => {
    const { width, height, data } = imageData;
    let edgeCount = 0;
    let totalPixels = 0;
    
    // Sobelエッジ検出による複雑度計算
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // 周囲のピクセルとの差を計算
        const neighbors = [
          ((y-1) * width + (x-1)) * 4,
          ((y-1) * width + x) * 4,
          ((y-1) * width + (x+1)) * 4,
          (y * width + (x-1)) * 4,
          (y * width + (x+1)) * 4,
          ((y+1) * width + (x-1)) * 4,
          ((y+1) * width + x) * 4,
          ((y+1) * width + (x+1)) * 4
        ];
        
        let maxDiff = 0;
        neighbors.forEach(nIdx => {
          const neighbor = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
          maxDiff = Math.max(maxDiff, Math.abs(current - neighbor));
        });
        
        if (maxDiff > 20) edgeCount++;
        totalPixels++;
      }
    }
    
    return totalPixels > 0 ? edgeCount / totalPixels : 0;
  };

  // 照明条件を分析（明度とコントラスト）
  const calculateLightingConditions = (colors: RGB[]): { brightness: number; contrast: number } => {
    if (colors.length === 0) return { brightness: 0.5, contrast: 0.5 };
    
    // 明度計算（YUV色空間の輝度成分）
    const brightness = colors.map(color => 
      0.299 * color.r + 0.587 * color.g + 0.114 * color.b
    );
    
    const avgBrightness = brightness.reduce((sum, val) => sum + val, 0) / brightness.length;
    const brightnessBrightness = avgBrightness / 255;
    
    // コントラスト計算（標準偏差ベース）
    const variance = brightness.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / brightness.length;
    const contrastValue = Math.sqrt(variance) / 128; // 正規化
    
    return {
      brightness: brightnessBrightness,
      contrast: Math.min(1, contrastValue)
    };
  };

  // 色分散を計算（背景色の多様性を測定）
  const calculateColorVariance = (colors: RGB[]): number => {
    if (colors.length < 2) return 0;

    const mean = colors.reduce((acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b
    }), { r: 0, g: 0, b: 0 });

    mean.r /= colors.length;
    mean.g /= colors.length;
    mean.b /= colors.length;

    const variance = colors.reduce((acc, color) => {
      return acc + calculateColorDistance(color, mean);
    }, 0) / colors.length;

    return variance;
  };

  // エッジ保護機能（前景オブジェクトの境界を保護）
  const protectEdges = (
    imageData: ImageData, 
    mask: boolean[][], 
    tolerance: number
  ): boolean[][] => {
    const { width, height, data } = imageData;
    const result = mask.map(row => [...row]);

    // Sobelオペレーターによるエッジ検出
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (!mask[y][x]) continue; // 既に前景として判定済みの場合はスキップ

        // 周囲のピクセルの色を取得
        const neighbors: RGB[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            const idx = (ny * width + nx) * 4;
            neighbors.push({
              r: data[idx],
              g: data[idx + 1],
              b: data[idx + 2]
            });
          }
        }

        // 現在のピクセルの色
        const currentIdx = (y * width + x) * 4;
        const currentColor = {
          r: data[currentIdx],
          g: data[currentIdx + 1],
          b: data[currentIdx + 2]
        };

        // エッジ強度を計算
        const maxColorDiff = Math.max(...neighbors.map(neighbor => 
          calculateColorDistance(currentColor, neighbor)
        ));

        // エッジが強い場合は前景として保護
        if (maxColorDiff > tolerance) {
          result[y][x] = false;
        }
      }
    }

    return result;
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
        
        // プレビューモードの場合、設定パネルを表示してプレビュー画像を設定
        if (backgroundRemovalSettings.showPreview) {
          setPreviewImage(e.target?.result as string);
          setShowBackgroundSettings(true);
          return;
        }
        
        // 通常の処理（背景削除して魚を追加）
        setIsProcessing(true);
        try {
          const processedImg = await removeBackground(img, backgroundRemovalSettings);
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
          
          // プレビュー画像をクリア
          setPreviewImage(null);
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // プレビュー画像の背景削除処理（自動更新対応）
  const handlePreviewBackgroundRemoval = async (originalImageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        // プレビューでは高速モードを強制
        const previewSettings = {
          ...backgroundRemovalSettings,
          fastMode: true,
          maxSize: 400
        };
        const processedImg = await removeBackground(img, previewSettings);
        resolve(processedImg.src);
      };
      img.src = originalImageSrc;
    });
  };

  // プレビューの自動更新
  const updatePreview = async () => {
    if (!previewImage) return;
    
    try {
      const processed = await handlePreviewBackgroundRemoval(previewImage);
      setProcessedPreview(processed);
    } catch (error) {
      console.error('Preview update failed:', error);
    }
  };

  // プレビューを確定して魚を追加
  const confirmPreview = async () => {
    if (!previewImage) return;
    
    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const processedImg = await removeBackground(img, backgroundRemovalSettings);
          const name = `Fish_${Date.now()}`;
          const speciesType = 'fish'; // デフォルト
          
          setFishTypes(prev => [...prev, {
            image: processedImg,
            url: previewImage,
            name,
            count: 1,
            speedFactor: 1,
            scale: 1,
            speciesType
          }]);
          
          // プレビューモードを終了
          setShowBackgroundSettings(false);
          setPreviewImage(null);
          setProcessedPreview(null);
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = previewImage;
    } catch (error) {
      setIsProcessing(false);
    }
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

    // クリーンアップミッション中はゴミのクリック判定を行う
    if (cleanupMission.isActive) {
      checkTrashClick(x, y);
      return; // ゴミクリック時は魚への影響は行わない
    }

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

  // マウスクリック用のハンドラー
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cleanupMission.isActive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    checkTrashClick(x, y);
  };

  // ゴミアイテムとの衝突判定
  const checkTrashClick = (x: number, y: number) => {
    if (!cleanupMission.isActive) return;

    for (let i = 0; i < trashItems.length; i++) {
      const trash = trashItems[i];
      if (trash.isBeingRemoved) continue;

      const distance = Math.sqrt(
        Math.pow(x - trash.x, 2) + Math.pow(y - trash.y, 2)
      );

      if (distance <= trash.size / 2 + 10) { // 10px のクリック許容範囲
        // ゴミを削除処理開始
        removeTrashItem(i);
        break; // 一度に一つのゴミだけ削除
      }
    }
  };

  // 教育的メッセージを表示する関数
  const showEducationalMessage = (trashType: string, removedCount: number, targetCount: number) => {
    const educationKeys = {
      bottle: 'bottleEducation',
      bag: 'bagEducation', 
      can: 'canEducation',
      generic: 'genericEducation'
    };
    
    const progressRatio = removedCount / targetCount;
    let encouragementKey;
    
    if (progressRatio < 0.25) {
      encouragementKey = 'keepGoing';
    } else if (progressRatio < 0.75) {
      encouragementKey = 'greatJob';
    } else if (progressRatio < 1) {
      encouragementKey = 'almostDone';
    } else {
      encouragementKey = 'excellentWork';
    }
    
    const educationKey = educationKeys[trashType as keyof typeof educationKeys] || 'genericEducation';
    
    setEducationalMessage({
      visible: true,
      message: t(educationKey as keyof TranslationStrings),
      encouragement: t(encouragementKey as keyof TranslationStrings)
    });
    
    // 3秒後に自動で閉じる
    setTimeout(() => {
      setEducationalMessage(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // パーティクルエフェクトを生成する関数
  const createTrashRemovalEffect = (x: number, y: number, trashType: string) => {
    const colors = {
      bottle: ['#4A90E2', '#7ED321', '#F5A623'],
      bag: ['#D0021B', '#F5A623', '#BD10E0'],
      can: ['#B8E986', '#50E3C2', '#4A90E2'],
      generic: ['#9013FE', '#F5A623', '#7ED321']
    };
    
    const particleColors = colors[trashType as keyof typeof colors] || colors.generic;
    
    // クリーンアップパーティクル（上向きに散らばる）
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // 少し上向きに
        size: 2 + Math.random() * 3,
        life: 60,
        maxLife: 60,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        type: 'cleanup'
      });
    }
    
    // スプラッシュエフェクト
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 1 + Math.random() * 2;
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 2,
        life: 40,
        maxLife: 40,
        color: 'rgba(135, 206, 235, 0.8)', // 水色
        type: 'splash'
      });
    }
  };

  // 水質改善時のキラキラエフェクト
  const createWaterQualityImprovement = () => {
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    
    // ランダムな位置にキラキラパーティクルを生成
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 0.5, // ゆっくり上に
        size: 1 + Math.random() * 2,
        life: 120,
        maxLife: 120,
        color: 'rgba(255, 255, 255, 0.9)',
        type: 'sparkle'
      });
    }
  };

  // ミッション完了時の祝福エフェクト
  const createCelebrationEffect = () => {
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    // 大量のお祝いパーティクルを生成
    for (let i = 0; i < 100; i++) {
      particlesRef.current.push({
        x: Math.random() * canvasWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 2 + 1,
        size: 3 + Math.random() * 6,
        life: 180 + Math.random() * 120,
        maxLife: 180 + Math.random() * 120,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'cleanup'
      });
    }
    
    // 特別なキラキラエフェクト
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        particlesRef.current.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random(),
          size: 2 + Math.random() * 4,
          life: 240,
          maxLife: 240,
          color: 'rgba(255, 215, 0, 0.9)',
          type: 'sparkle'
        });
      }, i * 50);
    }
  };

  // ゴミアイテムを削除する関数
  const removeTrashItem = (index: number) => {
    const newTrashItems = [...trashItems];
    const removedTrash = newTrashItems[index];
    
    // パーティクルエフェクトを生成
    createTrashRemovalEffect(removedTrash.x, removedTrash.y, removedTrash.type);
    
    // 削除アニメーション開始
    newTrashItems[index] = {
      ...removedTrash,
      isBeingRemoved: true,
      removalProgress: 0
    };

    // アニメーション処理
    const animateRemoval = () => {
      const currentTrash = newTrashItems[index];
      if (currentTrash.removalProgress < 1) {
        currentTrash.removalProgress += 0.1;
        setTrashItems([...newTrashItems]);
        requestAnimationFrame(animateRemoval);
      } else {
        // 完全に削除
        const finalTrashItems = newTrashItems.filter((_, i) => i !== index);
        setTrashItems(finalTrashItems);
        
        // ミッション進捗更新
        setCleanupMission(prev => {
          const newState = {
            ...prev,
            removedTrashCount: prev.removedTrashCount + 1,
            score: prev.score + removedTrash.points
          };
          
          // 教育的メッセージを表示
          showEducationalMessage(removedTrash.type, newState.removedTrashCount, newState.targetTrashCount);
          
          // ミッション完了チェック
          if (newState.removedTrashCount >= newState.targetTrashCount) {
            newState.isCompleted = true;
            createCelebrationEffect();
          }
          
          return newState;
        });

        // 汚染レベルを減らし、魚の健康を改善
        setPollutionLevel(prev => {
          const newPollutionLevel = Math.max(0, prev - 0.3);
          
          // 汚染レベルが下がった場合、魚の健康を改善
          if (newPollutionLevel < prev) {
            improveMarineLife();
            createWaterQualityImprovement();
          }
          
          return newPollutionLevel;
        });
      }
    };

    setTrashItems(newTrashItems);
    animateRemoval();
  };

  // 海洋生物の健康を改善する関数（ゴミ除去時）
  const improveMarineLife = () => {
    const fishes = fishesRef.current;
    
    fishes.forEach(fish => {
      // 死にかけの魚を蘇生させる
      if (fish.isDying && fish.healthLevel > 0.2) {
        fish.isDying = false;
        fish.deathTimer = 0;
        fish.healthLevel = Math.min(1, fish.healthLevel + 0.3);
        fish.opacity = fish.healthLevel;
        
        // 蘇生エフェクトとして泡を発生
        for (let i = 0; i < 8; i++) {
          bubblesRef.current.push({
            x: fish.x + (Math.random() - 0.5) * 15,
            y: fish.y + fish.yOffset,
            size: 2 + Math.random() * 3,
            speed: 1 + Math.random() * 1.5,
            wobbleOffset: Math.random() * Math.PI * 2,
            wobbleSpeed: 1.5 + Math.random(),
            color: 'rgba(0, 255, 100, 0.6)' // 緑色の回復泡
          });
        }
      } else if (!fish.isDying) {
        // 健康な魚はさらに元気になる
        fish.healthLevel = Math.min(1, fish.healthLevel + 0.1);
        fish.opacity = fish.healthLevel;
        fish.speedMultiplier = Math.min(1.5, fish.speedMultiplier + 0.1);
        
        // 元気になったら興奮状態にする
        fish.isExcited = true;
        fish.excitementTimer = 60;
      }
    });
  };

  // クリーンアップミッションを開始する関数
  const startCleanupMission = () => {
    setCleanupMission({
      isActive: true,
      targetTrashCount: 15,
      removedTrashCount: 0,
      score: 0,
      timeRemaining: 180,
      isCompleted: false
    });
    spawnTrashItems();
  };

  // クリーンアップミッションを停止する関数
  const stopCleanupMission = () => {
    setCleanupMission(prev => ({
      ...prev,
      isActive: false,
      isCompleted: false
    }));
    setTrashItems([]);
  };

  // ミッションタイマーの処理
  useEffect(() => {
    if (!cleanupMission.isActive || cleanupMission.isCompleted) return;

    const timer = setInterval(() => {
      setCleanupMission(prev => {
        if (prev.timeRemaining <= 1) {
          // 時間切れ
          return {
            ...prev,
            timeRemaining: 0,
            isActive: false
          };
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cleanupMission.isActive, cleanupMission.isCompleted]);

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

  // --- Dynamic Ocean Backgrounds ---
  const [oceanBgList, setOceanBgList] = useState<string[]>([]);
  const [currentBgIdx, setCurrentBgIdx] = useState(0);
  const defaultOceanBg = 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?auto=format&fit=crop&w=1920&h=1080&q=80';

  useEffect(() => {
    // Load ocean background list
    fetch('/images/ocean-bg-list.json')
      .then(res => res.json())
      .then((list: string[]) => {
        // Ensure the original background is included
        let merged = list.includes(defaultOceanBg) ? list : [defaultOceanBg, ...list];
        setOceanBgList(merged);
      })
      .catch(() => {
        setOceanBgList([defaultOceanBg]);
      });
  }, []);

  // Set up interval for background switching
  useEffect(() => {
    if (oceanBgList.length === 0) return;
    let idx = 0;
    // Set initial background
    const setBg = (i: number) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = oceanBgList[i];
      img.onload = () => {
        backgroundRef.current = img;
        setCurrentBgIdx(i);
      };
    };
    setBg(0);
    const interval = setInterval(() => {
      idx = (idx + 1) % oceanBgList.length;
      setBg(idx);
    }, 30000);
    return () => clearInterval(interval);
  }, [oceanBgList]);

  useEffect(() => {
    // Fallback: if dynamic backgrounds not loaded, ensure at least one bg
    if (!backgroundRef.current) {
      const backgroundImage = new Image();
      backgroundImage.crossOrigin = 'anonymous';
      backgroundImage.src = defaultOceanBg;
      backgroundImage.onload = () => {
        backgroundRef.current = backgroundImage;
      };
    }
    // Bubbles
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
        
        if (bubble.color) {
          // Use custom color for special bubbles
          const colorMatch = bubble.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
          if (colorMatch) {
            const [_, r, g, b, a = '0.8'] = colorMatch;
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${parseFloat(a) * 0.375})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          } else {
            // Fallback to default
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          }
        } else {
          // Default white bubbles
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

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

      // 水面の波効果（汚染レベルに応じて変化）
      ctx.save();
      const waveOpacity = pollutionLevel > 5 ? 0.05 : 0.1; // 汚染が酷いと波が見えにくくなる
      ctx.globalAlpha = waveOpacity;
      for (let i = 0; i < 3; i++) {
        const x = Math.sin(time * 0.5 + i * Math.PI * 2 / 3) * 50;
        const y = Math.cos(time * 0.5 + i * Math.PI * 2 / 3) * 50;
        // 汚染レベルに応じて波の色も変化
        if (pollutionLevel <= 3) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // 綺麗な水の波
        } else if (pollutionLevel <= 6) {
          ctx.fillStyle = 'rgba(200, 180, 150, 0.5)'; // 濁った水の波
        } else {
          ctx.fillStyle = 'rgba(150, 120, 80, 0.5)'; // 汚染された水の波
        }
        ctx.fillRect(x, y, canvas.width, canvas.height);
      }
      ctx.restore();

      if (pollutionLevel > 0) {
        // 汚染レベルに応じた段階的な視覚効果
        ctx.save();
        
        // レベル1-2: 薄い緑色（藻類の増殖）
        if (pollutionLevel <= 2) {
          const opacity = pollutionLevel * 0.08; // 0.08-0.16
          ctx.fillStyle = `rgba(40, 80, 40, ${opacity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // レベル3-5: 茶色がかった濁り
        else if (pollutionLevel <= 5) {
          const opacity = 0.15 + (pollutionLevel - 2) * 0.08; // 0.23-0.39
          ctx.fillStyle = `rgba(100, 70, 30, ${opacity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 水の濁りエフェクト
          const turbidityGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
          );
          turbidityGradient.addColorStop(0, `rgba(80, 60, 40, ${opacity * 0.5})`);
          turbidityGradient.addColorStop(1, `rgba(60, 40, 20, ${opacity * 0.3})`);
          ctx.fillStyle = turbidityGradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // レベル6-8: 重度の汚染
        else if (pollutionLevel <= 8) {
          const opacity = 0.4 + (pollutionLevel - 5) * 0.1; // 0.5-0.7
          ctx.fillStyle = `rgba(80, 40, 10, ${opacity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 油膜効果
          for (let i = 0; i < 3; i++) {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, `rgba(50, 20, 0, ${(pollutionLevel - 5) * 0.08})`);
            gradient.addColorStop(0.5, `rgba(100, 40, 10, ${(pollutionLevel - 5) * 0.06})`);
            gradient.addColorStop(1, `rgba(70, 30, 5, ${(pollutionLevel - 5) * 0.07})`);
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(
              Math.sin(time * 0.2 + i) * 30, 
              Math.cos(time * 0.3 + i) * 30, 
              canvas.width, 
              canvas.height
            );
          }
        }
        // レベル9-10: 極度の汚染
        else {
          const opacity = 0.7 + (pollutionLevel - 8) * 0.15; // 0.85-1.0
          ctx.fillStyle = `rgba(40, 20, 5, ${opacity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 重い油膜と浮遊ゴミ効果
          const heavyPollutionGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          heavyPollutionGradient.addColorStop(0, `rgba(20, 10, 0, ${opacity * 0.8})`);
          heavyPollutionGradient.addColorStop(0.3, `rgba(40, 20, 5, ${opacity * 0.6})`);
          heavyPollutionGradient.addColorStop(1, `rgba(30, 15, 5, ${opacity * 0.7})`);
          ctx.fillStyle = heavyPollutionGradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 浮遊ゴミの表現
          ctx.globalAlpha = 0.6;
          for (let i = 0; i < 5; i++) {
            const x = (Math.sin(time * 0.1 + i * 2) + 1) * canvas.width / 2;
            const y = (Math.cos(time * 0.15 + i * 3) + 1) * canvas.height / 2;
            ctx.fillStyle = `rgba(60, 40, 20, 0.8)`;
            ctx.fillRect(x, y, 20 + i * 5, 15 + i * 3);
          }
        }
        
        ctx.restore();
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
        
        // クリーンアップミッション情報表示
        if (cleanupMission.isActive) {
          ctx.fillText(`ゴミ回収: ${cleanupMission.removedTrashCount}/${cleanupMission.targetTrashCount}`, 10, 60);
          ctx.fillText(`スコア: ${cleanupMission.score}`, 10, 80);
        }
      } else {
        // 汚染レベルが0の場合でも表示
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.fillText(`汚染レベル: ${pollutionLevel}/10`, 10, 20);
        ctx.fillText(`死んだ魚: ${deadFishCount} 匹`, 10, 40);
        
        // クリーンアップミッション情報表示
        if (cleanupMission.isActive) {
          ctx.fillText(`ゴミ回収: ${cleanupMission.removedTrashCount}/${cleanupMission.targetTrashCount}`, 10, 60);
          ctx.fillText(`スコア: ${cleanupMission.score}`, 10, 80);
        }
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

      // クリーンアップミッション中のゴミアイテムを描画
      if (cleanupMission.isActive) {
        trashItems.forEach((trash, index) => {
          if (trash.image && !trash.isBeingRemoved) {
            ctx.save();
            
            // ゴミの浮遊アニメーション
            const bobY = Math.sin(Date.now() * trash.bobSpeed + trash.bobOffset) * 3;
            
            ctx.translate(trash.x, trash.y + bobY);
            ctx.rotate(trash.rotation);
            ctx.globalAlpha = 1 - trash.removalProgress;
            
            const size = trash.size * (1 - trash.removalProgress * 0.5);
            ctx.drawImage(
              trash.image,
              -size / 2,
              -size / 2,
              size,
              size
            );
            
            ctx.restore();
          }
        });
      }

      // パーティクルエフェクトを描画
      particlesRef.current.forEach((particle, index) => {
        // パーティクルの更新
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        // 重力効果（splash と cleanup タイプ）
        if (particle.type === 'splash' || particle.type === 'cleanup') {
          particle.vy += 0.1; // 重力
        }
        
        // パーティクルの描画
        if (particle.life > 0) {
          ctx.save();
          
          const alpha = particle.life / particle.maxLife;
          const size = particle.size * (particle.type === 'sparkle' ? 
            (0.5 + 0.5 * Math.sin(Date.now() * 0.01 + index)) : // キラキラ効果
            alpha); // フェードアウト
          
          if (particle.type === 'sparkle') {
            // キラキラエフェクト（星型）
            ctx.fillStyle = particle.color.replace(/[\d\.]+\)$/g, `${alpha})`);
            ctx.translate(particle.x, particle.y);
            ctx.rotate(Date.now() * 0.001 + index);
            
            // 星型の描画
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * Math.PI * 2) / 5;
              const radius = size;
              if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
              else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            // 通常の丸いパーティクル
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
        }
      });
      
      // 期限切れのパーティクルを削除
      particlesRef.current = particlesRef.current.filter(particle => particle.life > 0);

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

  // クリーンアップミッション用のゴミ画像を読み込む
  useEffect(() => {
    const loadTrashImage = (src: string, key: string) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        trashImagesRef.current[key] = img;
      };
    };

    // ゴミの種類別に画像を読み込む
    loadTrashImage('https://cdn-icons-png.flaticon.com/512/3389/3389081.png', 'bottle'); // ペットボトル
    loadTrashImage('https://cdn-icons-png.flaticon.com/512/2942/2942909.png', 'bag'); // ビニール袋
    loadTrashImage('https://cdn-icons-png.flaticon.com/512/2942/2942854.png', 'can'); // 缶
    loadTrashImage('https://cdn-icons-png.flaticon.com/512/3141/3141684.png', 'generic'); // 一般ごみ
  }, []);

  // ゴミアイテムを生成する関数
  const spawnTrashItems = () => {
    const newTrashItems: TrashItem[] = [];
    const trashTypes: Array<'bottle' | 'bag' | 'can' | 'generic'> = ['bottle', 'bag', 'can', 'generic'];
    const points = { bottle: 10, bag: 15, can: 8, generic: 5 };

    for (let i = 0; i < cleanupMission.targetTrashCount; i++) {
      const type = trashTypes[Math.floor(Math.random() * trashTypes.length)];
      newTrashItems.push({
        id: `trash-${i}-${Date.now()}`,
        type,
        x: Math.random() * (canvasSize.width - 60) + 30,
        y: Math.random() * (canvasSize.height - 100) + 50,
        size: 20 + Math.random() * 15,
        rotation: Math.random() * Math.PI * 2,
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: 0.02 + Math.random() * 0.02,
        isBeingRemoved: false,
        removalProgress: 0,
        points: points[type],
        image: trashImagesRef.current[type]
      });
    }

    setTrashItems(newTrashItems);
  };

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
      
      // クリーンアップミッション関連
      startCleanupMission: "クリーンアップミッション開始",
      stopCleanupMission: "ミッション終了",
      cleanupMissionTitle: "海のクリーンアップミッション",
      trashRemoved: "回収したゴミ",
      missionScore: "スコア",
      timeRemaining: "残り時間",
      missionCompleted: "ミッション完了！",
      congratulations: "おめでとうございます！",
      clickTrashToRemove: "ゴミをクリックして回収してください",
      missionProgress: "進捗",
      pointsEarned: "獲得ポイント",
      restartMission: "ミッション再開始",
      
      // 教育的メッセージ
      trashEducation: "海洋汚染について学ぼう！",
      bottleEducation: "プラスチックボトルは海で分解されるのに450年かかります！リサイクルしましょう。",
      bagEducation: "ビニール袋は海洋生物が誤飲しやすく危険です。エコバッグを使いましょう。",
      canEducation: "アルミ缶はリサイクル率が高い素材です。必ず分別しましょう。",
      genericEducation: "どんな小さなゴミでも海の生態系に影響します。ポイ捨てはやめましょう。",
      greatJob: "よくできました！",
      keepGoing: "その調子で頑張って！",
      almostDone: "もう少しです！",
      excellentWork: "素晴らしい働きです！",
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
      oceanData: "海洋データ",
      dataSource: "データソース",
      location: "場所",
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
      
      // クリーンアップミッション関連
      startCleanupMission: "Start Cleanup Mission",
      stopCleanupMission: "Stop Mission",
      cleanupMissionTitle: "Ocean Cleanup Mission",
      trashRemoved: "Trash Removed",
      missionScore: "Score",
      timeRemaining: "Time Remaining",
      missionCompleted: "Mission Completed!",
      congratulations: "Congratulations!",
      clickTrashToRemove: "Click on trash to remove it",
      missionProgress: "Progress",
      pointsEarned: "Points Earned",
      restartMission: "Restart Mission",
      
      // 教育的メッセージ
      trashEducation: "Learn about Ocean Pollution!",
      bottleEducation: "Plastic bottles take 450 years to decompose in the ocean! Please recycle.",
      bagEducation: "Plastic bags are dangerous for marine life who mistake them for food. Use eco-bags!",
      canEducation: "Aluminum cans have high recycling rates. Always separate them properly!",
      genericEducation: "Even small trash affects marine ecosystems. Don't litter!",
      greatJob: "Great job!",
      keepGoing: "Keep going!",
      almostDone: "Almost done!",
      excellentWork: "Excellent work!",
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

  // NOAA CO-OPS APIから海洋データを取得する関数（2025年最新版）
  const fetchNOAAOceanData = async () => {
    try {
      setIsLoadingOceanData(true);
      setOceanDataError(null);
      
      // NOAA CO-OPS API endpoints - 複数の観測所からデータを取得
      const noaaStations: Record<string, string> = {
        'Atlantic Ocean': '8454000',     // Providence, RI
        'Pacific Ocean': '9414290',       // San Francisco, CA
        'Gulf of Mexico': '8729108',      // Panama City, FL
        'Caribbean Sea': '9751639',       // San Juan, PR
        'Bering Sea': '9468756',          // Nome, AK
        'Arctic Ocean': '9497645',        // Prudhoe Bay, AK
      };
      
      const selectedStation = noaaStations[selectedLocation] || '8454000';
      
      // 複数の水質パラメータを取得
      const products = ['water_temperature', 'water_level', 'salinity', 'dissolved_oxygen'];
      const promises = products.map(product => 
        fetch(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=${product}&application=oceanaquarium&date=latest&station=${selectedStation}&time_zone=gmt&units=metric&format=json`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );
      
      const responses = await Promise.all(promises);
      
      // データを統合
      const oceanData: OceanData = {
        location: selectedLocation,
        temperature: responses[0]?.data?.[0]?.v ? parseFloat(responses[0].data[0].v) : 20,
        salinity: responses[2]?.data?.[0]?.v ? parseFloat(responses[2].data[0].v) : 35,
        dissolvedOxygen: responses[3]?.data?.[0]?.v ? parseFloat(responses[3].data[0].v) : 7,
        ph: 8.1 + (Math.random() * 0.2 - 0.1), // NOAAから直接取得できないため推定値
        chlorophyll: 0.5 + Math.random(), // NOAAから直接取得できないため推定値
        pollutionIndex: responses[1]?.data ? calculatePollutionFromNOAAData(responses) : 3,
        timestamp: new Date().toISOString(),
        source: 'NOAA' as const
      };
      
      return [oceanData];
    } catch (error) {
      console.error('Error fetching NOAA data:', error);
      setOceanDataError(error instanceof Error ? error.message : 'Unknown error fetching NOAA data');
      
      // エラーが発生した場合はシミュレーションデータを返す
      return generateSimulatedOceanData('NOAA');
    } finally {
      setIsLoadingOceanData(false);
    }
  };
  
  // NASA Earthdata CMR APIから海洋データを取得する関数
  // Using NASA's Common Metadata Repository to search for ocean quality datasets
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
      
      // NASA CMR API endpoints
      const cmrSearchUrl = 'https://cmr.earthdata.nasa.gov/search/collections.json';
      const cmrGranulesUrl = 'https://cmr.earthdata.nasa.gov/search/granules.json';
      
      // Search for ocean water quality and pollution datasets - 2025年最新データセット対応
      const oceanDatasets = [
        'PACE_OCI_L3M_CHL_V3',           // PACE OCI V3 クロロフィル（2025年最新）
        'MODIS_AQUA_L3_CHLA_DAILY_4KM',  // Chlorophyll concentration (ocean health indicator)
        'MODIS_AQUA_L3_SST_DAILY_4KM',   // Sea surface temperature
        'VIIRS_L3_OC_DAILY',              // Ocean color (water quality indicator)
        'VIIRS_NOAA21_L3_OC',             // NOAA-21 VIIRS Ocean Color (2025年7月30日データ含む)
        'PACE_OCI_L3_BGC',                // PACE Ocean Biogeochemistry
      ];
      
      // Get location coordinates - ここを修正
      const locationCoords = getLocationCoordinates(selectedLocation); // selectedOceanLocation → selectedLocation
      
      // Search for ocean quality data collections
      const collectionsParams = new URLSearchParams({
        keyword: 'ocean water quality chlorophyll pollution',
        spatial_keyword: 'ocean',
        has_granules: 'true',
        page_size: '10'
      });
      
      const collectionsResponse = await fetch(`${cmrSearchUrl}?${collectionsParams.toString()}`);
      
      if (!collectionsResponse.ok) {
        throw new Error(`CMR API error: ${collectionsResponse.status}`);
      }
      
      const collectionsData = await collectionsResponse.json();
      
      // For demonstration, we'll process the data and return ocean quality metrics
      const oceanQualityData = await processOceanQualityData(collectionsData, locationCoords);
      
      // Return processed ocean data
      return oceanQualityData;
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      setOceanDataError(error instanceof Error ? error.message : 'Unknown error fetching NASA data');
      
      // エラーが発生した場合はシミュレーションデータを返す
      return generateSimulatedOceanData('NASA');
    } finally {
      setIsLoadingOceanData(false);
    }
  };
  
  // NOAAデータから汚染指数を計算
  const calculatePollutionFromNOAAData = (responses: any[]): number => {
    let pollutionScore = 0;
    
    // 水温異常（通常範囲から外れている場合）
    const temp = responses[0]?.data?.[0]?.v ? parseFloat(responses[0].data[0].v) : 20;
    if (temp > 25 || temp < 10) pollutionScore += 2;
    
    // 溶存酸素が低い場合
    const oxygen = responses[3]?.data?.[0]?.v ? parseFloat(responses[3].data[0].v) : 7;
    if (oxygen < 6) pollutionScore += 3;
    if (oxygen < 4) pollutionScore += 2;
    
    // 塩分濃度の異常
    const salinity = responses[2]?.data?.[0]?.v ? parseFloat(responses[2].data[0].v) : 35;
    if (salinity < 30 || salinity > 38) pollutionScore += 1;
    
    return Math.min(10, Math.max(0, pollutionScore));
  };

  // Get coordinates for selected ocean location
  const getLocationCoordinates = (location: string): { lat: number; lon: number } => {
    const coordinates: Record<string, { lat: number; lon: number }> = {
      'Pacific Ocean': { lat: 0, lon: -160 },
      'Atlantic Ocean': { lat: 0, lon: -30 },
      'Indian Ocean': { lat: -20, lon: 80 },
      'Arctic Ocean': { lat: 80, lon: 0 },
      'Southern Ocean': { lat: -60, lon: 0 },
      'Mediterranean Sea': { lat: 35, lon: 18 },
      'Caribbean Sea': { lat: 15, lon: -75 },
      'Gulf of Mexico': { lat: 25, lon: -90 },
      'Baltic Sea': { lat: 58, lon: 20 },
      'South China Sea': { lat: 12, lon: 115 },
      'Bering Sea': { lat: 58, lon: -175 }
    };
    
    return coordinates[location] || { lat: 0, lon: 0 };
  };
  
  // Process ocean quality data from NASA CMR
  const processOceanQualityData = async (
    collectionsData: any,
    locationCoords: { lat: number; lon: number }
  ): Promise<OceanData[]> => {
    const locations = availableLocations.filter(loc => loc !== 'all');
    const processedData: OceanData[] = [];
    
    // For each location, calculate ocean quality metrics based on available data
    for (const location of locations) {
      const coords = getLocationCoordinates(location);
      
      // Calculate pollution index based on chlorophyll concentration and other factors
      // High chlorophyll in certain areas can indicate eutrophication (pollution)
      // Low chlorophyll in others might indicate poor ocean health
      const chlorophyllBase = location.includes('Gulf') ? 2.5 : 
                            location.includes('Baltic') ? 2.0 :
                            location.includes('Mediterranean') ? 0.5 :
                            location.includes('Pacific') ? 0.8 :
                            location.includes('Southern') ? 0.3 : 1.0;
      
      // Ocean cleanliness score (inverse of pollution)
      const cleanlinessScore = location.includes('Southern') ? 9 :
                              location.includes('Arctic') ? 8 :
                              location.includes('Pacific') ? 7 :
                              location.includes('Atlantic') ? 6 :
                              location.includes('Indian') ? 5 :
                              location.includes('Caribbean') ? 5 :
                              location.includes('Mediterranean') ? 4 :
                              location.includes('Gulf') ? 3 :
                              location.includes('Baltic') ? 3 :
                              location.includes('South China Sea') ? 2 : 5;
      
      processedData.push({
        location,
        temperature: getOceanTemperature(location),
        salinity: getOceanSalinity(location),
        ph: getOceanPH(location),
        dissolvedOxygen: 7 + (cleanlinessScore / 10) * 3, // Higher cleanliness = more oxygen
        chlorophyll: chlorophyllBase + (Math.random() * 0.5 - 0.25),
        pollutionIndex: 10 - cleanlinessScore + (Math.random() * 0.5 - 0.25),
        timestamp: new Date().toISOString(),
        source: 'NASA'
      });
    }
    
    return processedData;
  };
  
  // Helper functions for ocean metrics
  const getOceanTemperature = (location: string): number => {
    const baseTemp = location.includes('Arctic') ? 2 : 
                    location.includes('Southern') ? 5 : 
                    location.includes('Mediterranean') ? 22 : 
                    location.includes('Gulf') ? 25 : 
                    location.includes('Caribbean') ? 27 :
                    location.includes('Indian') ? 26 :
                    location.includes('Baltic') ? 10 : 18;
    return baseTemp + (Math.random() * 2 - 1);
  };
  
  const getOceanSalinity = (location: string): number => {
    const baseSalinity = location.includes('Baltic') ? 10 : // Baltic Sea has low salinity
                        location.includes('Mediterranean') ? 38 : // Mediterranean has high salinity
                        location.includes('Arctic') ? 32 : 35;
    return baseSalinity + (Math.random() * 1 - 0.5);
  };
  
  const getOceanPH = (location: string): number => {
    // Ocean acidification affects different regions differently
    const basePH = location.includes('Arctic') ? 7.9 : // Arctic more affected by acidification
                  location.includes('Southern') ? 8.0 :
                  location.includes('Gulf') ? 8.0 : 8.1;
    return basePH + (Math.random() * 0.1 - 0.05);
  };
  
  // 海洋データの複合健康指標を計算する関数
  const calculateOceanHealth = (data: OceanData): number => {
    let healthScore = 10;
    
    // 汚染指数の影響を強化 (0-10, 10が最悪)
    if (data.pollutionIndex !== undefined) {
      healthScore -= data.pollutionIndex * 1.2; // 影響を1.2倍に強化
    }
    
    // 溶存酸素の影響 (7+ が良好)
    if (data.dissolvedOxygen !== undefined) {
      healthScore += Math.max(0, (data.dissolvedOxygen - 7) * 2);
    }
    
    // 水温の影響（極端な温度は悪影響）
    const idealTemp = 18;
    const tempDeviation = Math.abs(data.temperature - idealTemp);
    healthScore -= tempDeviation * 0.2;
    
    // pH値の影響（8.1付近が理想的）
    if (data.ph !== undefined) {
      const phDeviation = Math.abs(data.ph - 8.1);
      healthScore -= phDeviation * 2;
    }
    
    // クロロフィル濃度の影響（適度な値が良好）
    if (data.chlorophyll !== undefined) {
      const optimalChlorophyll = 1.0;
      const chlorophyllDeviation = Math.abs(data.chlorophyll - optimalChlorophyll);
      healthScore -= chlorophyllDeviation * 0.5;
    }
    
    // 特定の汚染海域に追加ペナルティ
    if (data.location.includes('South China Sea')) {
      healthScore -= 2; // 南シナ海は追加で-2
    } else if (data.location.includes('Gulf of Mexico')) {
      healthScore -= 1.5; // メキシコ湾は追加で-1.5
    }
    
    return Math.max(0, Math.min(10, healthScore));
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
                      location.includes('Gulf') ? 25 : 
                      location.includes('Bering') ? 4 : 18;
      
      // 実際の汚染レベルデータ（NASA/NOAA APIに基づく推定値）
      const basePollution = location.includes('South China Sea') ? 8 :  // 重度の汚染（工業廃水、プラスチック）
                           location.includes('Gulf of Mexico') ? 7 :     // 中重度の汚染（石油、農薬流出）
                           location.includes('Mediterranean') ? 5 : 
                           location.includes('Baltic') ? 5 : 
                           location.includes('Caribbean') ? 4 : 
                           location.includes('Indian') ? 4 : 
                           location.includes('Atlantic') ? 3 : 
                           location.includes('Bering') ? 3 : 
                           location.includes('Arctic') ? 2 : 
                           location.includes('Pacific') ? 2 : 
                           location.includes('Southern') ? 1 : 3;
      
      // 特定の汚染海域の水質パラメータを悪化させる
      let dissolvedOxygen = 7 + (Math.random() * 2 - 1); // デフォルト値
      let ph = 8.1 + (Math.random() * 0.4 - 0.2); // デフォルト値
      let chlorophyll = 0.5 + (Math.random() * 1); // デフォルト値
      
      // 南シナ海とメキシコ湾の水質を悪化
      if (location.includes('South China Sea')) {
        dissolvedOxygen = 4 + Math.random(); // 4-5 mg/L（低酸素）
        ph = 7.8 + (Math.random() * 0.2); // 7.8-8.0（酸性化）
        chlorophyll = 2 + Math.random(); // 2-3 mg/m³（富栄養化）
      } else if (location.includes('Gulf of Mexico')) {
        dissolvedOxygen = 4.5 + Math.random(); // 4.5-5.5 mg/L（低酸素）
        ph = 7.9 + (Math.random() * 0.2); // 7.9-8.1（軽度の酸性化）
        chlorophyll = 1.8 + Math.random() * 0.7; // 1.8-2.5 mg/m³（富栄養化）
      }
      
      data.push({
        location,
        temperature: baseTemp + (Math.random() * 4 - 2), // 基本温度 ±2°C
        salinity: 35 + (Math.random() * 2 - 1), // 平均塩分 ±1
        ph,
        dissolvedOxygen,
        chlorophyll,
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
  
  // 海洋データの健康度を内部汚染レベルに反映する関数
  const updatePollutionFromOceanData = () => {
    if (!realTimePollutionMode) return;
    
    // selectedLocationが'all'の場合はデフォルトで'Pacific Ocean'を使用
    const targetLocation = selectedLocation === 'all' ? 'Pacific Ocean' : selectedLocation;
    const currentLocationData = getFilteredOceanData().find(
      data => data.location === targetLocation
    );
    
    if (currentLocationData) {
      // 海洋健康度を計算（0-10、10が最も健康）
      const oceanHealth = calculateOceanHealth(currentLocationData);
      
      // 健康度を汚染レベルに反転変換
      // 健康度10 = 汚染0、健康度0 = 汚染10
      const newPollutionLevel = Math.round(Math.max(0, Math.min(10, 10 - oceanHealth)));
      
      console.log(`[Ocean Data] 健康度: ${oceanHealth.toFixed(1)}/10 → 汚染レベル: ${newPollutionLevel}/10`);
      setPollutionLevel(newPollutionLevel);
    }
  };
  
  // 海洋健康度に基づく魚の数調整機能
  const adjustFishPopulationBasedOnOceanHealth = () => {
    if (!realTimePollutionMode) return;
    
    // selectedLocationが'all'の場合はデフォルトで'Pacific Ocean'を使用
    const targetLocation = selectedLocation === 'all' ? 'Pacific Ocean' : selectedLocation;
    const currentLocationData = getFilteredOceanData().find(
      data => data.location === targetLocation
    );
    
    if (currentLocationData) {
      const oceanHealth = calculateOceanHealth(currentLocationData);
      const healthRatio = oceanHealth / 10;
      const targetFishCount = Math.floor(healthRatio * 20); // 最大20匹
      
      // 現在の生きている魚の数
      const aliveFishCount = fishesRef.current.filter(fish => fish.opacity > 0.1).length;
      
      if (aliveFishCount < targetFishCount) {
        // 魚を復活または追加
        addFishBasedOnHealth(targetFishCount - aliveFishCount, oceanHealth);
      } else if (aliveFishCount > targetFishCount && oceanHealth < 5) {
        // 海洋健康度が低い場合のみ、魚を段階的に弱らせる
        weakenExcessFish(aliveFishCount - targetFishCount, oceanHealth);
      }
    }
  };
  
  // 海洋健康度に基づいて魚を追加する関数
  const addFishBasedOnHealth = (count: number, oceanHealth: number) => {
    const fishes = fishesRef.current;
    const deadFish = fishes.filter(fish => fish.opacity <= 0.1);
    
    // 死んだ魚を優先的に復活させる
    const fishToRevive = Math.min(count, deadFish.length);
    for (let i = 0; i < fishToRevive; i++) {
      const fish = deadFish[i];
      fish.opacity = 1;
      fish.healthLevel = Math.min(1, oceanHealth / 10);
      fish.isDying = false;
      fish.deathTimer = 0;
      
      // 復活エフェクト
      for (let j = 0; j < 8; j++) {
        bubblesRef.current.push({
          x: fish.x + (Math.random() - 0.5) * 40,
          y: fish.y + fish.yOffset,
          size: 3 + Math.random() * 4,
          speed: 2 + Math.random() * 2,
          wobbleSpeed: 0.05,
          wobbleOffset: Math.random() * Math.PI * 2,
          color: 'rgba(100, 255, 100, 0.8)' // 緑色の復活泡
        });
      }
    }
    
    // 死んだ魚カウントを更新
    setDeadFishCount(prev => Math.max(0, prev - fishToRevive));
  };
  
  // 過剰な魚を弱らせる関数
  const weakenExcessFish = (excessCount: number, oceanHealth: number) => {
    const aliveFish = fishesRef.current.filter(fish => fish.opacity > 0.1 && !fish.isDying);
    const fishToWeaken = Math.min(excessCount, aliveFish.length);
    
    for (let i = 0; i < fishToWeaken; i++) {
      const fish = aliveFish[i];
      if (oceanHealth < 3) {
        // 非常に悪い環境では急速に弱らせる
        fish.healthLevel = Math.max(0, fish.healthLevel - 0.3);
        if (fish.healthLevel < 0.5) {
          fish.isDying = true;
          fish.deathTimer = 30 + Math.floor(Math.random() * 50);
        }
      } else {
        // やや悪い環境では徐々に弱らせる
        fish.healthLevel = Math.max(0, fish.healthLevel - 0.1);
      }
    }
  };
  
  // コンポーネントマウント時に海洋データを取得
  useEffect(() => {
    fetchOceanData();
    
    // 5分ごとにデータを更新（リアルタイムデータ取得の改善）
    const interval = setInterval(() => {
      console.log('[Ocean Data] Auto-refreshing ocean data...');
      fetchOceanData();
    }, 5 * 60 * 1000); // 300秒 = 5分
    
    return () => clearInterval(interval);
  }, []);
  
  // リアルタイムモードでの海洋データと魚の状態同期
  useEffect(() => {
    if (realTimePollutionMode) {
      updatePollutionFromOceanData();
      adjustFishPopulationBasedOnOceanHealth();
    }
  }, [oceanData, realTimePollutionMode, selectedLocation]);
  
  // リアルタイムモード時の定期更新
  useEffect(() => {
    if (!realTimePollutionMode) return;
    
    const interval = setInterval(() => {
      fetchOceanData().then(() => {
        updatePollutionFromOceanData();
        adjustFishPopulationBasedOnOceanHealth();
      });
    }, 60000); // 1分ごと
    
    return () => clearInterval(interval);
  }, [realTimePollutionMode, selectedLocation]);
  
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
        onClick={handleCanvasClick}
        className="absolute top-0 left-0 w-full h-full"
      />
      
      {/* 海洋綺麗度インジケーター */}
      {realTimePollutionMode && (() => {
        // selectedLocationが'all'の場合はデフォルトで'Pacific Ocean'を使用
        const targetLocation = selectedLocation === 'all' ? 'Pacific Ocean' : selectedLocation;
        const currentData = getFilteredOceanData().find(
          data => data.location === targetLocation
        );
        
        if (!currentData) return null;
        
        const health = calculateOceanHealth(currentData);
        
        const handleRefresh = async () => {
          setIsLoadingOceanData(true);
          await fetchOceanData();
          setTimeout(() => {
            updatePollutionFromOceanData();
            adjustFishPopulationBasedOnOceanHealth();
            setIsLoadingOceanData(false);
          }, 500);
        };
        
        return (
          <div 
            className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-10 min-w-[280px] cursor-pointer hover:bg-white/100 transition-all hover:shadow-xl"
            onClick={handleRefresh}
            title="クリックでデータを更新"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-blue-800">
                {targetLocation}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Source: {currentData.source})
                </span>
              </h4>
              <button 
                className={`p-1 rounded hover:bg-gray-100 transition ${isLoadingOceanData ? 'animate-spin' : ''}`}
                disabled={isLoadingOceanData}
              >
                {isLoadingOceanData ? <Loader size={14} /> : <RefreshCw size={14} />}
              </button>
            </div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-medium text-gray-600">海の綺麗度:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    health > 7 ? 'bg-blue-500' : 
                    health > 4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${health * 10}%` }}
                />
              </div>
              <span className="text-xs font-bold">{health.toFixed(1)}/10</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">汚染指数:</span>
                <span className={`font-medium ${
                  (currentData.pollutionIndex || 0) > 7 ? 'text-red-600' : 
                  (currentData.pollutionIndex || 0) > 4 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {currentData.pollutionIndex?.toFixed(1) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">水温:</span>
                <span className="font-medium">{currentData.temperature.toFixed(1)}°C</span>
              </div>
              {currentData.dissolvedOxygen && (
                <div className="flex justify-between">
                  <span className="text-gray-600">溶存酸素:</span>
                  <span className="font-medium">{currentData.dissolvedOxygen.toFixed(1)} mg/L</span>
                </div>
              )}
              {currentData.ph && (
                <div className="flex justify-between">
                  <span className="text-gray-600">pH:</span>
                  <span className="font-medium">{currentData.ph.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                health > 7 ? 'bg-blue-100 text-blue-800' :
                health > 4 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {health > 7 ? '綺麗' : health > 4 ? 'やや汚い' : '汚い'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(currentData.timestamp).toLocaleTimeString('ja-JP')}
              </span>
            </div>
          </div>
        );
      })()}
      
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
            </div>
          </div>
          
          {/* 地図表示 */}
          <div className="mb-4">
            <OceanMap 
              selectedLocation={selectedLocation === 'all' ? 'Pacific Ocean' : selectedLocation}
              onLocationSelect={(location) => {
                console.log(`Location selected from map: ${location}`);
                setSelectedLocation(location);
                
                // リアルタイムモードがONの場合、即座にデータを更新
                if (realTimePollutionMode) {
                  setTimeout(() => {
                    updatePollutionFromOceanData();
                    adjustFishPopulationBasedOnOceanHealth();
                  }, 100);
                }
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
            
            {/* クリーンアップミッションボタン */}
            <div className="flex items-center gap-1">
              {!cleanupMission.isActive ? (
                <button
                  onClick={startCleanupMission}
                  className="p-1.5 rounded text-white bg-green-500 hover:bg-green-600 transition"
                  title={t('startCleanupMission')}
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <button
                  onClick={stopCleanupMission}
                  className="p-1.5 rounded text-white bg-red-500 hover:bg-red-600 transition"
                  title={t('stopCleanupMission')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <label
                className={`p-1.5 rounded text-white transition cursor-pointer ${
                  isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                title={isProcessing ? '処理中...' : t('addNewFish')}
              >
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
              <button
                onClick={() => setShowBackgroundSettings(true)}
                className="p-1.5 rounded text-white bg-purple-500 hover:bg-purple-600 transition"
                title="背景削除設定"
              >
                <Settings size={14} />
              </button>
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
        <div className="absolute right-4 bottom-4 w-96 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl max-h-[60%] overflow-y-auto z-20">
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
          
          {/* リアルタイム海洋データモード制御 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-center space-x-2 mb-3">
              <input 
                type="checkbox" 
                checked={realTimePollutionMode}
                onChange={(e) => setRealTimePollutionMode(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm font-medium text-blue-800">リアルタイム海洋データモード</span>
            </label>
            
            {realTimePollutionMode && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  監視対象海域 (MAP連携)
                </label>
                <select 
                  value={selectedLocation === 'all' ? 'Pacific Ocean' : selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    // 選択変更時に即座にデータを更新
                    setTimeout(() => {
                      updatePollutionFromOceanData();
                      adjustFishPopulationBasedOnOceanHealth();
                    }, 100);
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  {availableLocations.filter(loc => loc !== 'all').map(location => (
                    <option key={location} value={location}>{getOceanNameInJapanese(location)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  下の地図をクリックまたは上記で選択して海域を変更できます
                </p>
              </div>
            )}
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
                  <option key={location} value={location}>{getOceanNameInJapanese(location)}</option>
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
          onClick={() => setShowOceanDataPanel(!showOceanDataPanel)}
          className={`p-2 rounded-full shadow-xl transition-all ${
            showOceanDataPanel 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-white/90 backdrop-blur-sm hover:bg-white/100 text-blue-600'
          }`}
          title={t('oceanData')}
        >
          <BarChart2 size={20} />
        </button>

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

        {/* クリーンアップミッション状態表示 */}
        {cleanupMission.isActive && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-xl z-20">
            <div className="text-center">
              <h3 className="font-bold text-green-600 mb-2">{t('cleanupMissionTitle')}</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('trashRemoved')}:</span>
                  <div className="font-bold text-green-600">
                    {cleanupMission.removedTrashCount}/{cleanupMission.targetTrashCount}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-600">{t('missionScore')}:</span>
                  <div className="font-bold text-blue-600">{cleanupMission.score}</div>
                </div>
              </div>
              
              <div className="mt-2">
                <span className="text-gray-600">{t('timeRemaining')}:</span>
                <div className="font-bold text-red-600">
                  {Math.floor(cleanupMission.timeRemaining / 60)}:{(cleanupMission.timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(cleanupMission.removedTrashCount / cleanupMission.targetTrashCount) * 100}%` }}
                ></div>
              </div>
              
              <div className="mt-2 text-xs text-gray-600">
                {t('clickTrashToRemove')}
              </div>
            </div>
          </div>
        )}

        {/* ミッション完了通知 */}
        {cleanupMission.isCompleted && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-green-400 to-blue-500 text-white p-8 rounded-2xl shadow-2xl z-30 text-center max-w-lg animate-pulse">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                🎉 {t('missionCompleted')} 🎉
              </h2>
              
              <div className="text-xl mb-4 font-semibold">
                {t('excellentWork')}
              </div>
              
              <div className="bg-white/20 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div>
                    <div className="font-bold text-yellow-200">🗑️ {t('trashRemoved')}</div>
                    <div className="text-2xl font-black">{cleanupMission.removedTrashCount}</div>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-200">⭐ {t('pointsEarned')}</div>
                    <div className="text-2xl font-black">{cleanupMission.score}</div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm mb-6 leading-relaxed bg-white/10 rounded-lg p-3">
                🌊 あなたの頑張りで海がきれいになり、魚たちが元気に泳げるようになりました！<br/>
                🐟 海洋保護は小さな行動から始まります。ありがとうございます！
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={startCleanupMission}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition font-bold shadow-lg"
                >
                  🔄 {t('restartMission')}
                </button>
                <button
                  onClick={stopCleanupMission}
                  className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition font-bold shadow-lg"
                >
                  ❌ {t('stopCleanupMission')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 教育的メッセージ表示 */}
        {educationalMessage.visible && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-lg shadow-2xl z-40 max-w-md animate-bounce">
            <div className="text-center">
              <h4 className="font-bold text-lg mb-2">{educationalMessage.encouragement}</h4>
              <p className="text-sm leading-relaxed">{educationalMessage.message}</p>
              <div className="mt-2 text-xs opacity-75">{t('trashEducation')}</div>
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

      {/* 背景削除設定パネル */}
      {showBackgroundSettings && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-gray-800">背景削除設定</h3>
              <button 
                onClick={() => {
                  setShowBackgroundSettings(false);
                  setPreviewImage(null);
                  setProcessedPreview(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* プレビュー表示 */}
            {previewImage && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">プレビュー</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-1">元画像</h5>
                    <img 
                      src={previewImage} 
                      alt="Original" 
                      className="w-full h-48 object-contain border rounded"
                    />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-1">処理後</h5>
                    {processedPreview ? (
                      <img 
                        src={processedPreview} 
                        alt="Processed" 
                        className="w-full h-48 object-contain border rounded bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-48 border rounded bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {isProcessing ? '処理中...' : 'プレビュー更新ボタンをクリック'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* プリセット選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プリセット設定
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => applyPreset('fast')}
                  className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  高速モード
                </button>
                <button
                  onClick={() => applyPreset('ultra')}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded text-sm hover:from-purple-700 hover:to-pink-700 font-bold"
                >
                  🚀 ULTRA
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => applyPreset('white')}
                  className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  白背景用
                </button>
                <button
                  onClick={() => applyPreset('beige')}
                  className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  ベージュ背景用
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => applyPreset('complex')}
                  className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                >
                  複雑背景用
                </button>
              </div>
            </div>

            {/* 背景検出モード選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                背景検出モード
              </label>
              <select
                value={backgroundRemovalSettings.detectionMode}
                onChange={(e) => setBackgroundRemovalSettings(prev => ({
                  ...prev,
                  detectionMode: e.target.value as BackgroundDetectionMode
                }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="auto">自動検出（推奨）</option>
                <option value="ultra">🚀 Ultra-Algorithm（水族館特化）</option>
                <option value="white">純白背景</option>
                <option value="light">明るい背景</option>
                <option value="beige">ベージュ/クリーム</option>
                <option value="manual">手動調整</option>
              </select>
            </div>

            {/* 設定項目 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  許容値 (Tolerance): {backgroundRemovalSettings.tolerance}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={backgroundRemovalSettings.tolerance}
                  onChange={(e) => setBackgroundRemovalSettings(prev => ({
                    ...prev,
                    tolerance: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>厳密</span>
                  <span>緩い</span>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input 
                    type="checkbox" 
                    checked={backgroundRemovalSettings.fastMode}
                    onChange={(e) => setBackgroundRemovalSettings(prev => ({
                      ...prev,
                      fastMode: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-green-600">高速モード（推奨）</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={backgroundRemovalSettings.multiSample}
                    onChange={(e) => setBackgroundRemovalSettings(prev => ({
                      ...prev,
                      multiSample: e.target.checked
                    }))}
                    className="rounded"
                    disabled={backgroundRemovalSettings.fastMode}
                  />
                  <span className={`text-sm ${backgroundRemovalSettings.fastMode ? 'text-gray-400' : ''}`}>
                    多点サンプリング
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={backgroundRemovalSettings.edgeProtection}
                    onChange={(e) => setBackgroundRemovalSettings(prev => ({
                      ...prev,
                      edgeProtection: e.target.checked
                    }))}
                    className="rounded"
                    disabled={backgroundRemovalSettings.fastMode}
                  />
                  <span className={`text-sm ${backgroundRemovalSettings.fastMode ? 'text-gray-400' : ''}`}>
                    エッジ保護
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={backgroundRemovalSettings.morphology}
                    onChange={(e) => setBackgroundRemovalSettings(prev => ({
                      ...prev,
                      morphology: e.target.checked
                    }))}
                    className="rounded"
                    disabled={backgroundRemovalSettings.fastMode}
                  />
                  <span className={`text-sm ${backgroundRemovalSettings.fastMode ? 'text-gray-400' : ''}`}>
                    ノイズ除去
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={backgroundRemovalSettings.antiAlias}
                    onChange={(e) => setBackgroundRemovalSettings(prev => ({
                      ...prev,
                      antiAlias: e.target.checked
                    }))}
                    className="rounded"
                    disabled={backgroundRemovalSettings.fastMode}
                  />
                  <span className={`text-sm ${backgroundRemovalSettings.fastMode ? 'text-gray-400' : ''}`}>
                    アンチエイリアス
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={backgroundRemovalSettings.showPreview}
                    onChange={(e) => setBackgroundRemovalSettings(prev => ({
                      ...prev,
                      showPreview: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">アップロード時に自動でプレビュー表示</span>
                </label>
              </div>
            </div>

            {/* プレビューボタンと確定ボタン */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <div className="space-x-2">
                {previewImage && (
                  <button
                    onClick={updatePreview}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded ${
                      isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                  >
                    {isProcessing ? '処理中...' : 'プレビュー更新'}
                  </button>
                )}
              </div>
              
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setShowBackgroundSettings(false);
                    setPreviewImage(null);
                    setProcessedPreview(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
                
                {previewImage && (
                  <button
                    onClick={confirmPreview}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded ${
                      isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {isProcessing ? '処理中...' : '確定して追加'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;