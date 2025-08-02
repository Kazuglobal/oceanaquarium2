import React from 'react';

interface TurtleGuideProps {
  x: number;
  y: number;
  message: string;
  emotion: 'happy' | 'concerned' | 'excited' | 'teaching';
  visible: boolean;
  animation: 'idle' | 'swimming' | 'talking';
}

const TurtleGuide: React.FC<TurtleGuideProps> = ({
  x,
  y,
  message,
  emotion,
  visible,
  animation
}) => {
  if (!visible) return null;

  const getEmotionEmoji = () => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'concerned': return '😟';
      case 'excited': return '🤩';
      case 'teaching': return '🤓';
      default: return '😊';
    }
  };

  const getAnimationClass = () => {
    switch (animation) {
      case 'swimming': return 'animate-bounce';
      case 'talking': return 'animate-pulse';
      default: return '';
    }
  };

  return (
    <div 
      className={`absolute pointer-events-none ${getAnimationClass()}`}
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {/* タートルキャラクター */}
      <div className="relative">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-2xl">{getEmotionEmoji()}</span>
        </div>
        
        {/* 博士帽子 */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gray-800 rounded-t-lg"></div>
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-600"></div>
      </div>

      {/* メッセージバブル */}
      {message && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 max-w-xs">
          <div className="bg-white rounded-lg shadow-lg p-3 border-2 border-green-300">
            <p className="text-xs text-gray-800 font-medium">{message}</p>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-300"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurtleGuide;
