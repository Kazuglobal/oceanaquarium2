import React from 'react';

interface OceanArea {
  name: string;
  jaName: string;
  characteristics: string[];
  uniqueFeatures: string[];
  backgroundColor: string;
}

interface OceanAreaSelectorProps {
  oceanAreas: Record<string, OceanArea>;
  currentArea: string;
  onAreaChange: (areaName: string) => void;
  language: 'ja' | 'en';
}

const OceanAreaSelector: React.FC<OceanAreaSelectorProps> = ({
  oceanAreas,
  currentArea,
  onAreaChange,
  language
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {Object.entries(oceanAreas).map(([key, area]) => (
        <button
          key={key}
          onClick={() => onAreaChange(key)}
          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
            currentArea === key
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
          }`}
        >
          <div className="text-left">
            <h3 className="font-medium text-sm text-gray-800">
              {language === 'ja' ? area.jaName : area.name}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {area.characteristics.slice(0, 2).join('、')}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default OceanAreaSelector;
