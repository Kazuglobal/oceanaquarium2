import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import { Fish, Leaf, Sun, Rocket, Sparkles, Menu, X, ChevronDown, Star, Users, Shield, Heart, Play } from 'lucide-react';
import FireworksLobby from './components/FireworksLobby';

export type Environment = 'ocean' | 'nature' | 'sky' | 'space' | 'fireworks';

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
  {
    id: 'fireworks',
    title: '花火のせかい',
    sub: 'みんなで夜空を彩ろう！',
    bg: 'from-indigo-600 via-purple-700 to-black',
    icon: <Sparkles size={48} className="drop-shadow-md" />,
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bubbles = Array.from({ length: 15 }).map((_, i) => {
    const size = 20 + Math.random() * 30;
    const left = Math.random() * 100;
    const duration = 4 + Math.random() * 6;
    const delay = Math.random() * 4;

    return (
      <span
        key={i}
        className="absolute block bg-white/30 rounded-full"
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-x-hidden font-['M PLUS Rounded 1c', sans-serif]">
      {/* Modern Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Fish className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-gray-800">Ocean Adventure</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#worlds" className="text-gray-700 hover:text-blue-600 transition-colors">ワールド</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">特徴</a>
              <a href="/ocean-adventure-complete-guide.html" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600 transition-colors">使い方ガイド</a>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all transform hover:scale-105">
                今すぐ体験
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t">
            <div className="px-4 py-2 space-y-2">
              <a href="#worlds" className="block py-2 text-gray-700 hover:text-blue-600">ワールド</a>
              <a href="#features" className="block py-2 text-gray-700 hover:text-blue-600">特徴</a>
              <a href="/ocean-adventure-complete-guide.html" target="_blank" rel="noopener noreferrer" className="block py-2 text-gray-700 hover:text-blue-600">使い方ガイド</a>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all">
                今すぐ体験
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20 animate-gradient-shift" />
          {bubbles}
        </div>
        
        <div className="container mx-auto px-4 z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-text">
                わくわく探検ワールド
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              5つの魔法の世界で、忘れられない冒険を体験しよう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => document.getElementById('worlds')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105"
              >
                ワールドを探検する
              </button>
              <button className="px-8 py-4 bg-white text-gray-800 rounded-full text-lg font-semibold hover:shadow-xl transition-all border border-gray-200">
                詳しく見る
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5</div>
                <div className="text-gray-600">魔法のワールド</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">100+</div>
                <div className="text-gray-600">インタラクティブ体験</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">4.9★</div>
                <div className="text-gray-600">ユーザー評価</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">安全</div>
                <div className="text-gray-600">お子様に最適</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown size={32} className="text-gray-600" />
        </div>
      </section>

      {/* Demo Video Section - Multiple Tutorials */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              機能別チュートリアル動画
            </span>
          </h2>
          <p className="text-center text-gray-600 mb-8 text-lg">
            Ocean Adventureの主要機能を動画で学ぼう！
          </p>
          
          {/* 動画が再生できない場合の案内 */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>動画が再生できない場合：</strong> MOV形式の動画はSafariブラウザで最適に再生されます。
                    <a href="/video-instructions.html" target="_blank" className="ml-2 underline font-semibold hover:text-yellow-900">
                      動画ページで詳細を確認 →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* 魚を追加 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
              <div className="relative">
                <video 
                  className="w-full h-auto"
                  controls
                  poster="/api/placeholder/640/360"
                  preload="metadata"
                >
                  <source src="/videos/addfish.mov" type="video/quicktime" />
                  <source src="/videos/addfish.mp4" type="video/mp4" />
                  お使いのブラウザは動画タグをサポートしていません。
                </video>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">🐠 魚を追加する方法</h3>
                <p className="text-gray-600 text-sm mb-3">新しい魚を追加ボタンから、カラフルな魚を海に追加する手順を解説</p>
                <a href="/videos/addfish.mov" download className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  ダウンロード
                </a>
              </div>
            </div>
            
            {/* 海をきれいに */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
              <div className="relative">
                <video 
                  className="w-full h-auto"
                  controls
                  poster="/api/placeholder/640/360"
                  preload="metadata"
                >
                  <source src="/videos/crean-ocean.mov" type="video/quicktime" />
                  <source src="/videos/crean-ocean.mp4" type="video/mp4" />
                  お使いのブラウザは動画タグをサポートしていません。
                </video>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">🌊 海をきれいにする</h3>
                <p className="text-gray-600 text-sm mb-3">環境問題を楽しく学びながら、海をきれいにする方法</p>
                <a href="/videos/crean-ocean.mov" download className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  ダウンロード
                </a>
              </div>
            </div>
            
            {/* リアルタイムデータ */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
              <div className="relative">
                <video 
                  className="w-full h-auto"
                  controls
                  poster="/api/placeholder/640/360"
                  preload="metadata"
                >
                  <source src="/videos/realtime-data.mov" type="video/quicktime" />
                  <source src="/videos/realtime-data.mp4" type="video/mp4" />
                  お使いのブラウザは動画タグをサポートしていません。
                </video>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">📊 リアルタイムデータ</h3>
                <p className="text-gray-600 text-sm mb-3">実際の海洋データをリアルタイムで表示する機能の使い方</p>
                <a href="/videos/realtime-data.mov" download className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  ダウンロード
                </a>
              </div>
            </div>
            
            {/* 宇宙のせかい */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
              <div className="relative">
                <video 
                  className="w-full h-auto"
                  controls
                  poster="/api/placeholder/640/360"
                  preload="metadata"
                >
                  <source src="/videos/space.mov" type="video/quicktime" />
                  <source src="/videos/space.mp4" type="video/mp4" />
                  お使いのブラウザは動画タグをサポートしていません。
                </video>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">🚀 宇宙のせかい</h3>
                <p className="text-gray-600 text-sm mb-3">宇宙船を飛ばして、惑星を探検する宇宙ワールドの楽しみ方</p>
                <a href="/videos/space.mov" download className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  ダウンロード
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Worlds Section */}
      <section id="worlds" className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              5つの魔法のワールド
            </span>
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            お子様の想像力を育む、インタラクティブな冒険の世界
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {envs.map((e, index) => (
              <div
                key={e.id}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`h-64 bg-gradient-to-br ${e.bg} p-8 flex flex-col justify-between`}>
                  <div className="flex justify-between items-start">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      {e.icon}
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-yellow-300 text-yellow-300" />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{e.title}</h3>
                    <p className="text-white/90">{e.sub}</p>
                  </div>
                </div>
                
                <div className="bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">対象年齢: 3歳〜12歳</span>
                    <span className="text-sm font-semibold text-blue-600">人気No.{index + 1}</span>
                  </div>
                  
                  <button
                    onClick={() => onSelect(e.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    このワールドで遊ぶ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ocean Adventureの特徴
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Shield className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">安全第一</h3>
              <p className="text-gray-600">お子様が安心して遊べる環境を提供</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Users className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">マルチプレイ対応</h3>
              <p className="text-gray-600">友達や家族と一緒に楽しめる</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-orange-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Heart className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">教育的コンテンツ</h3>
              <p className="text-gray-600">遊びながら学べる要素が満載</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Sparkles className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">定期アップデート</h3>
              <p className="text-gray-600">新しいコンテンツを追加</p>
            </div>
          </div>
        </div>
      </section>





      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Fish className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold">Ocean Adventure</span>
          </div>
          <p className="text-gray-400 text-center mb-4">子供たちの想像力を育む、魔法のような体験を提供します。</p>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 Ocean Adventure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
