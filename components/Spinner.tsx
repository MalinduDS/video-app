
import React from 'react';

interface SpinnerProps {
    progress: number;
}

const Spinner: React.FC<SpinnerProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 text-white">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="35"
            cx="50"
            cy="50"
          />
          <circle
            className="text-indigo-500"
            strokeWidth="10"
            strokeDasharray="219.91"
            strokeDashoffset={219.91 - (219.91 * progress) / 100}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="35"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
            {Math.round(progress)}%
        </div>
      </div>
      <p className="mt-4 text-lg">Exporting video... Please wait.</p>
    </div>
  );
};

export default Spinner;
