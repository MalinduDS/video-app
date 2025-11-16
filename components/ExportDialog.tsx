import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { ExportQuality } from '../types';

interface ExportDialogProps {
  onExport: (format: 'webm' | 'mp4', quality: ExportQuality) => void;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ onExport, onClose }) => {
  const [format, setFormat] = useState<'webm' | 'mp4'>('webm');
  const [quality, setQuality] = useState<ExportQuality>('high');
  const [isMp4Supported, setIsMp4Supported] = useState(false);

  useEffect(() => {
    // Check for MP4 support and default to it if available
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      setIsMp4Supported(true);
      setFormat('mp4');
    }
  }, []);

  const handleExport = () => {
    onExport(format, quality);
  };

  const RadioLabel: React.FC<{
    htmlFor: string;
    children: React.ReactNode;
    disabled?: boolean;
  }> = ({ htmlFor, children, disabled }) => (
    <label
        htmlFor={htmlFor}
        className={`flex items-center p-3 w-full bg-gray-700 rounded-md transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-600'
        }`}
    >
        {children}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4">Export Video</h2>
        
        <div className="space-y-6">
          <fieldset>
            <legend className="text-base font-medium text-white mb-2">Export Format</legend>
            <div className="space-y-3">
              <RadioLabel htmlFor="format-webm">
                <input
                  type="radio"
                  id="format-webm"
                  name="format"
                  value="webm"
                  checked={format === 'webm'}
                  onChange={() => setFormat('webm')}
                  className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500"
                />
                <span className="ml-3 block text-sm font-medium text-white">
                  WebM (.webm)
                  <span className="block text-xs text-gray-400">High quality, great for web use. Recommended.</span>
                </span>
              </RadioLabel>

              <RadioLabel htmlFor="format-mp4" disabled={!isMp4Supported}>
                <input
                  type="radio"
                  id="format-mp4"
                  name="format"
                  value="mp4"
                  checked={format === 'mp4'}
                  onChange={() => setFormat('mp4')}
                  disabled={!isMp4Supported}
                  className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500"
                />
                <span className="ml-3 block text-sm font-medium text-white">
                  MP4 (.mp4)
                  <span className="block text-xs text-gray-400">
                    Best compatibility for devices.
                    {!isMp4Supported && " (Not supported by your browser)"}
                  </span>
                </span>
              </RadioLabel>
            </div>
          </fieldset>

           <fieldset>
            <legend className="text-base font-medium text-white mb-2">Export Quality</legend>
            <div className="space-y-3">
              <RadioLabel htmlFor="quality-low">
                <input
                  type="radio"
                  id="quality-low"
                  name="quality"
                  value="low"
                  checked={quality === 'low'}
                  onChange={() => setQuality('low')}
                  className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500"
                />
                <span className="ml-3 block text-sm font-medium text-white">
                  Low
                  <span className="block text-xs text-gray-400">Faster export, smaller file.</span>
                </span>
              </RadioLabel>
              
              <RadioLabel htmlFor="quality-high">
                <input
                  type="radio"
                  id="quality-high"
                  name="quality"
                  value="high"
                  checked={quality === 'high'}
                  onChange={() => setQuality('high')}
                  className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500"
                />
                <span className="ml-3 block text-sm font-medium text-white">
                  High (Default)
                  <span className="block text-xs text-gray-400">Higher quality, larger file.</span>
                </span>
              </RadioLabel>

            </div>
          </fieldset>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Start Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;