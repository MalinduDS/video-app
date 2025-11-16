import React, { useState } from 'react';
import { VideoSparkIcon } from './icons';

interface VideoGeneratorProps {
  onGenerate: (prompt: string, aspectRatio: '16:9' | '9:16') => void;
  isGenerating: boolean;
  progressMessage: string;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onGenerate, isGenerating, progressMessage }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim(), aspectRatio);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <VideoSparkIcon className="w-6 h-6 text-indigo-400" />
        <span>Generate Video with AI</span>
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A neon hologram of a cat driving at top speed"
          className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          disabled={isGenerating}
        />
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-300 mr-3">Aspect Ratio:</span>
            <div className="inline-flex rounded-md shadow-sm bg-gray-700" role="group">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                disabled={isGenerating}
                className={`px-3 py-1 text-sm font-medium rounded-l-md transition ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                disabled={isGenerating}
                className={`px-3 py-1 text-sm font-medium rounded-r-md transition ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              >
                9:16
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <VideoSparkIcon className="w-5 h-5" />
            <span>Generate</span>
          </button>
        </div>
      </form>
      {isGenerating && (
        <div className="mt-3 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{progressMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
