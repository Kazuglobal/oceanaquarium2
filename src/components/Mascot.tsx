import React from 'react';

interface MascotProps {
  message?: string;
  position?: 'left' | 'right';
  emotion?: 'happy' | 'excited' | 'curious';
}

const Mascot: React.FC<MascotProps> = ({ 
  message = 'ようこそ！好きな世界をえらんでね！', 
  position = 'left',
  emotion = 'happy'
}) => {
  // キャラクターの表情を設定
  const getEmotion = () => {
    switch(emotion) {
      case 'excited': return '🤩';
      case 'curious': return '🧐';
      default: return '😊';
    }
  };
  
  return (
    <div className={`flex items-end gap-2 ${position === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="relative">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-sky-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
          <div className="absolute w-5 h-5 bg-white rounded-full top-4 left-3 opacity-80"></div>
          <div className="absolute w-3 h-3 bg-white rounded-full top-3 left-6 opacity-60"></div>
          <span className="text-3xl md:text-4xl">{getEmotion()}</span>
        </div>
        <div className="absolute -bottom-1 w-full h-4 bg-gradient-to-t from-black/20 to-transparent rounded-full blur-sm"></div>
      </div>
      
      {message && (
        <div className={`
          relative max-w-[200px] md:max-w-xs p-3 bg-white rounded-xl shadow-md
          ${position === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'}
          animate-fade-in-up
        `}>
          <div className={`
            absolute bottom-0 ${position === 'right' ? 'right-0 -translate-x-1' : 'left-0 translate-x-1'} 
            translate-y-1/2 rotate-45 w-4 h-4 bg-white
          `}></div>
          <p className="text-xs md:text-sm text-gray-700 font-medium">{message}</p>
        </div>
      )}
    </div>
  );
};

export default Mascot;
