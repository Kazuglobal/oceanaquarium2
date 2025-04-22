import React from 'react';
import './LandingPage.css';
import { Fish, Leaf, Sun, Rocket } from 'lucide-react';

export type Environment = 'ocean' | 'nature' | 'sky' | 'space';

interface LandingPageProps {
  onSelect: (env: Environment) => void;
}

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
];

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
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

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-200 via-blue-400 to-indigo-700 overflow-hidden px-4 font-['M PLUS Rounded 1c', sans-serif]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles}
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-yellow-200 via-pink-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg text-center leading-tight">
        わくわく探検ワールド
      </h1>
      <p className="text-white/90 mt-3 mb-8 text-center text-sm md:text-base">
        好きな世界を選んで探検をはじめよう！
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[800px] w-full">
        {envs.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
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
            <span className="text-[11px] md:text-xs mt-0.5 px-2 opacity-90 leading-snug animate-slide" style={{animationDelay:`${Math.random()*0.3+0.1}s`}}>
              {e.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
