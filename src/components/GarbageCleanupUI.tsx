import React from 'react';

interface GarbageCleanupUIProps {
  score: number;
  garbageCount: number;
  language: 'ja' | 'en';
}

const GarbageCleanupUI: React.FC<GarbageCleanupUIProps> = ({
  score,
  garbageCount,
  language
}) => {
  const translations = {
    ja: {
      cleanupScore: '清掃スコア',
      garbageRemaining: '残りのゴミ',
      clickToClean: 'ゴミをクリックして清掃しよう！'
    },
    en: {
      cleanupScore: 'Cleanup Score',
      garbageRemaining: 'Garbage Remaining',
      clickToClean: 'Click on garbage to clean it up!'
    }
  };

  const t = translations[language];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <h3 className="text-lg font-bold text-green-600 mb-3">
        🗑️ {t.cleanupScore}
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{score}</div>
          <div className="text-xs text-gray-600">{t.cleanupScore}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">{garbageCount}</div>
          <div className="text-xs text-gray-600">{t.garbageRemaining}</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        {t.clickToClean}
      </div>
      
      {/* プログレスバー */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (score / 100) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GarbageCleanupUI;
