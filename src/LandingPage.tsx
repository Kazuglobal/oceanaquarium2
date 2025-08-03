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

      {/* Demo Video Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              実際のゲーム体験をご覧ください
            </span>
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Ocean Adventureの魅力的な世界を動画でチェック
          </p>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
              <video 
                ref={videoRef}
                className="w-full h-auto"
                controls
                poster="/api/placeholder/1280/720"
                preload="metadata"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
              >
                <source src="/videos/demo-video.mp4" type="video/mp4" />
                お使いのブラウザは動画タグをサポートしていません。
              </video>
              
              {/* Play button overlay - only show when video is not playing */}
              {!isVideoPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 cursor-pointer hover:bg-black/30"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.play();
                    }
                  }}
                >
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110">
                    <Play className="w-10 h-10 text-purple-600 ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Video Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Fish className="text-white" size={32} />
                </div>
                <h3 className="font-semibold mb-1">海の生き物たち</h3>
                <p className="text-sm text-gray-600">カラフルな魚との楽しい冒険</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-white" size={32} />
                </div>
                <h3 className="font-semibold mb-1">インタラクティブ体験</h3>
                <p className="text-sm text-gray-600">タッチで反応する楽しい仕掛け</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-pink-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Heart className="text-white" size={32} />
                </div>
                <h3 className="font-semibold mb-1">教育的コンテンツ</h3>
                <p className="text-sm text-gray-600">遊びながら学べる仕組み</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Fish className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold">Ocean Adventure</span>
              </div>
              <p className="text-gray-400">子供たちの想像力を育む、魔法のような体験を提供します。</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">リンク</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">会社概要</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">採用情報</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">プレスリリース</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">サポート</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">よくある質問</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">利用規約</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">プライバシーポリシー</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">返金ポリシー</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">お問い合わせ</h4>
              <p className="text-gray-400 mb-2">TEL: 03-1234-5678</p>
              <p className="text-gray-400 mb-2">Email: info@ocean-adventure.jp</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 Ocean Adventure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
