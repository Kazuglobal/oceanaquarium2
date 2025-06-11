import React, { useEffect, useState } from 'react';
import './LandingPage.css';
import { Fish, Leaf, Sun, Rocket, Heart, Info, Sparkles } from 'lucide-react';
import Mascot from './components/Mascot';
import { Environment } from './LandingPage';

interface KidsLandingPageProps {
  onSelect: (env: Environment) => void;
}

const environmentInfo = {
  ocean: {
    title: '海のせかい',
    description: 'カラフルな魚たちがいっぱい！深海の生き物もいるよ。音を出したり、エサをあげたりして遊べるよ！',
    features: ['カラフルな魚がたくさん', '音が出るよ', 'エサをあげられるよ'],
    mascotMessage: 'おさかなさんと友だちになれるよ！どんな音がするかな？'
  },
  nature: {
    title: 'しぜんのせかい',
    description: '木や花、虫などの生き物がいるよ。季節によって景色が変わるよ！木を植えたり、動物を探したりできるよ！',
    features: ['花や虫がいっぱい', '季節が変わるよ', '生き物を育てられるよ'],
    mascotMessage: 'みどりがいっぱい！いろんな虫や花をさがしてみよう！'
  },
  sky: {
    title: 'そらのせかい',
    description: '空を飛ぶ鳥や昆虫、気球などがあるよ。雲を作ったり、雨を降らせたりして遊べるよ！',
    features: ['鳥がとんでいるよ', '雲を作れるよ', '天気を変えられるよ'],
    mascotMessage: 'お空はどこまでも広いね！鳥さんといっしょに飛んでみる？'
  },
  space: {
    title: 'うちゅうのせかい',
    description: '星や惑星、宇宙船などがあるよ。星座を見つけたり、ロケットを飛ばしたりして遊べるよ！',
    features: ['星がきらきらするよ', 'UFOがでるかも', 'ロケットに乗れるよ'],
    mascotMessage: 'うちゅうはふしぎがいっぱい！きらきら星をあつめよう！'
  },
  fireworks: {
    title: '花火のせかい',
    description: '夜空にオリジナル花火を打ち上げよう！みんなの作品が共有されるよ。',
    features: ['自分の花火を描ける', 'フリックで発射', 'みんなの花火が並ぶよ'],
    mascotMessage: 'きみだけの花火を打ちあげてみてね！'
  }
};

const KidsLandingPage: React.FC<KidsLandingPageProps> = ({ onSelect }) => {
  const [activeEnv, setActiveEnv] = useState<Environment | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  // キラキラエフェクト用の状態
  const [sparkles, setSparkles] = useState<{id: number; x: number; y: number; size: number}[]>([]);
  
  // マウス移動でキラキラエフェクトを追加
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.9) { // 確率でスパークルを発生
        setSparkles(prev => [
          ...prev.slice(-15), // 最大15個まで表示
          {
            id: Date.now(),
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 8 + 4
          }
        ]);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // スパークルが消えるエフェクト
  useEffect(() => {
    if (sparkles.length > 0) {
      const timer = setTimeout(() => {
        setSparkles(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sparkles]);

  const envs: {
    id: Environment;
    title: string;
    sub: string;
    bg: string;
    icon: JSX.Element;
  }[] = [
    {
      id: 'ocean',
      title: '海のせかい',
      sub: 'カラフルな魚たちとあそぼう！',
      bg: 'from-cyan-400 via-sky-500 to-blue-800',
      icon: <Fish size={48} className="drop-shadow-md" />,
    },
    {
      id: 'nature',
      title: 'しぜんのせかい',
      sub: '森のどうぶつをかんさつしよう！',
      bg: 'from-green-400 via-lime-500 to-emerald-700',
      icon: <Leaf size={48} className="drop-shadow-md" />,
    },
    {
      id: 'sky',
      title: 'そらのせかい',
      sub: 'とりといっしょに大空をとびまわろう！',
      bg: 'from-blue-300 via-indigo-400 to-purple-600',
      icon: <Sun size={48} className="drop-shadow-md" />,
    },
    {
      id: 'space',
      title: 'うちゅうのせかい',
      sub: 'キラキラ星と惑星たんけん！',
      bg: 'from-purple-700 via-fuchsia-700 to-black',
      icon: <Rocket size={48} className="drop-shadow-md" />,
    },
    {
      id: 'fireworks',
      title: '花火のせかい',
      sub: 'みんなで夜空を彩ろう！',
      bg: 'from-indigo-600 via-purple-700 to-black',
      icon: <Sparkles size={48} className="drop-shadow-md" />,
    },
  ];

  // 泡エフェクト
  const bubbles = Array.from({ length: 20 }).map((_, i) => {
    const size = 20 + Math.random() * 30;
    const left = Math.random() * 100;
    const duration = 4 + Math.random() * 6;
    const delay = Math.random() * 4;

    return (
      <span
        key={i}
        className="absolute block bg-white/50 rounded-full"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          bottom: `-${size}px`,
          animation: `bubbleRise ${duration}s linear ${delay}s infinite`,
        }}
      />
    );
  });
  
  // 環境の詳細表示
  const renderEnvironmentDetails = () => {
    if (!activeEnv) return null;
    
    const info = environmentInfo[activeEnv];
    
    return (
      <div className="relative z-10 max-w-md mx-auto mt-6 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xl border-2 border-white/50 animate-fade-in-up">
        <button 
          onClick={() => setActiveEnv(null)}
          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          ×
        </button>
        
        <h3 className="text-xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {info.title}について
        </h3>
        
        <p className="mt-2 text-sm text-gray-700">
          {info.description}
        </p>
        
        <ul className="mt-3 space-y-1">
          {info.features.map((feature, i) => (
            <li key={i} className="flex items-center text-sm text-gray-700">
              <Heart size={14} className="text-pink-500 mr-1" />
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => onSelect(activeEnv)}
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-bold shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all animate-wiggle"
          >
            このせかいであそぶ！
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-200 via-blue-400 to-indigo-700 overflow-hidden px-4 font-['M PLUS Rounded 1c', sans-serif]">
      {/* 背景要素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles}
      </div>
      
      {/* キラキラエフェクト */}
      {sparkles.map(sparkle => (
        <span 
          key={sparkle.id}
          className="sparkle absolute z-10"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size
          }}
        />
      ))}
      
      {/* マスコット */}
      <div className="absolute top-8 left-8 z-20 hidden md:block">
        <Mascot 
          message={activeEnv ? environmentInfo[activeEnv].mascotMessage : "ようこそ！すきなせかいをえらんでね！"} 
          emotion={activeEnv ? "excited" : "happy"}
        />
      </div>
      
      {/* ヘッダー */}
      <div className="relative z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-yellow-200 via-pink-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg text-center leading-tight">
          わくわく探検ワールド
        </h1>
        <p className="text-white/90 mt-3 mb-2 text-center text-sm md:text-base">
          すきな世界をえらんで たんけんしよう！
        </p>
        
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-1 px-3 py-1 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-full text-xs text-white shadow transition-colors"
          >
            <Info size={14} />
            {showInfo ? "とじる" : "このアプリについて"}
          </button>
        </div>
        
        {showInfo && (
          <div className="max-w-md mx-auto p-3 bg-white/70 backdrop-blur-sm rounded-lg text-xs text-gray-700 mb-6 animate-fade-in-up">
            <p className="mb-2">
              <strong>「わくわく探検ワールド」</strong>は、お子さまが楽しく遊びながら学べる3Dインタラクティブアプリです。
            </p>
            <p>
              海、自然、空、宇宙の4つの世界があり、それぞれに特徴的な生き物や現象を観察したり、触れ合ったりすることができます。
              音や動きで楽しめるように作られているので、小さなお子さまでも直感的に操作できます。
            </p>
          </div>
        )}
      </div>
      
      {/* 環境選択グリッド */}
      {!activeEnv ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[800px] w-full relative z-10">
          {envs.map((e) => (
            <button
              key={e.id}
              onClick={() => setActiveEnv(e.id)}
              className={`group relative overflow-hidden flex flex-col items-center justify-center aspect-square rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm bg-white/5 text-white text-center bg-gradient-to-br ${e.bg} hover:shadow-2xl transform-gpu transition-all duration-300 hover:-translate-y-1 hover:rotate-[0.5deg]`}
            >
              {/* Glow overlay */}
              <span className="absolute -inset-1 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition" />

              <div className="animate-float mb-1">
                {e.icon}
              </div>
              <span className="mt-0 text-xl md:text-2xl font-bold drop-shadow-lg">
                {e.title}
              </span>
              <span className="text-[11px] md:text-xs mt-0.5 px-2 opacity-90 leading-snug animate-slide" style={{animationDelay: `${Math.random()*0.3+0.1}s`}}>
                {e.sub}
              </span>
            </button>
          ))}
        </div>
      ) : (
        renderEnvironmentDetails()
      )}
      
      {/* フッター */}
      <div className="absolute bottom-4 text-center text-white/70 text-xs">
        © 2025 わくわく探検ワールド | ご家族でお楽しみください
      </div>
    </div>
  );
};

export default KidsLandingPage;
