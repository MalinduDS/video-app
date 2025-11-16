import React from 'react';
import { Effect } from '../types';

interface EffectStripProps {
  effects: Effect[];
  selectedEffect: Effect;
  onSelectEffect: (effect: Effect) => void;
}

const EffectStrip: React.FC<EffectStripProps> = ({ effects, selectedEffect, onSelectEffect }) => {
  const placeholderImageUrl = "https://picsum.photos/id/1062/100/100"; // A nice landscape for effect preview

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {effects.map(effect => (
        <div
          key={effect.name}
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => onSelectEffect(effect)}
        >
          <div
            className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
              selectedEffect.name === effect.name ? 'border-indigo-500' : 'border-transparent'
            } transition-all`}
          >
            <img
              src={placeholderImageUrl}
              alt={effect.name}
              className="w-full h-full object-cover"
              style={{ filter: effect.value }}
            />
          </div>
          <span className={`text-xs text-center w-20 break-words ${selectedEffect.name === effect.name ? 'text-indigo-400' : 'text-gray-400'}`}>
            {effect.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default EffectStrip;
