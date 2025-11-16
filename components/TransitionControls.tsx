import React from 'react';
import { Transition } from '../types';

interface TransitionControlsProps {
  transition: Transition;
  onTransitionChange: (transition: Transition) => void;
  disabled: boolean;
}

const TransitionControls: React.FC<TransitionControlsProps> = ({ transition, onTransitionChange, disabled }) => {

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTransitionChange({
      ...transition,
      type: e.target.value as Transition['type'],
    });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTransitionChange({
      ...transition,
      duration: parseFloat(e.target.value),
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-bold text-white">Transition</h3>
      <div className={`transition-opacity ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <label htmlFor="transition-type" className="text-sm font-medium text-gray-300">
            Effect
          </label>
           <select
            id="transition-type"
            value={transition.type}
            onChange={handleTypeChange}
            disabled={disabled}
            className="w-1/2 bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="none">None</option>
            <option value="crossfade">Crossfade</option>
            <option value="wipe-left">Wipe Left</option>
            <option value="wipe-right">Wipe Right</option>
            <option value="wipe-up">Wipe Up</option>
            <option value="wipe-down">Wipe Down</option>
          </select>
        </div>

        {transition.type !== 'none' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-300">
                Duration
                <span className="text-indigo-400 font-mono ml-2">{transition.duration.toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={transition.duration}
              onChange={handleDurationChange}
              disabled={disabled}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed disabled:accent-gray-500 mt-1"
            />
          </div>
        )}
      </div>
       {disabled && (
        <p className="text-xs text-gray-500 italic text-center pt-2">
          Upload two clips to enable transitions.
        </p>
      )}
    </div>
  );
};

export default TransitionControls;