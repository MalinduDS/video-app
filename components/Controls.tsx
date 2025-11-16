import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, TextIcon, ImageIcon, DownloadIcon, SetTrimStartIcon, SetTrimEndIcon, CropIcon, UndoIcon, RedoIcon, VolumeHighIcon, VolumeLowIcon, VolumeMuteIcon, SpeedIcon, AutoEditIcon } from './icons';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  onExportClick: () => void;
  onAutoEdit: () => void;
  onSetTrimStart: () => void;
  onSetTrimEnd: () => void;
  hasVideo: boolean;
  isCropping: boolean;
  onCropToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
}

const ControlButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string; title?: string }> = ({ onClick, disabled = false, children, className="", title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors ${className}`}
  >
    {children}
  </button>
);


const Controls: React.FC<ControlsProps> = ({ 
    isPlaying, onPlayPause, onAddText, onAddImage, onExportClick, onAutoEdit, onSetTrimStart, onSetTrimEnd, hasVideo, isCropping, onCropToggle,
    onUndo, onRedo, canUndo, canRedo,
    volume, onVolumeChange,
    playbackSpeed, onPlaybackSpeedChange
}) => {
    const [lastVolume, setLastVolume] = useState(volume);
    const [localVolume, setLocalVolume] = useState(volume);

    useEffect(() => {
        setLocalVolume(volume);
    }, [volume]);
    
    const handleMuteToggle = () => {
        if (localVolume > 0) {
            setLastVolume(localVolume);
            setLocalVolume(0);
            onVolumeChange(0);
        } else {
            const newVolume = lastVolume > 0 ? lastVolume : 1;
            setLocalVolume(newVolume);
            onVolumeChange(newVolume);
        }
    };

    const getVolumeIcon = () => {
        if (!hasVideo) {
            return <VolumeMuteIcon className="w-5 h-5 text-gray-500" />;
        }
        if (localVolume === 0) {
            return <VolumeMuteIcon className="w-5 h-5" />;
        }
        if (localVolume <= 0.5) {
            return <VolumeLowIcon className="w-5 h-5" />;
        }
        return <VolumeHighIcon className="w-5 h-5" />;
    };

  return (
    <div className="flex items-center justify-center gap-2 p-2 bg-gray-800 rounded-lg flex-wrap">
      <ControlButton onClick={onPlayPause} disabled={!hasVideo} className="bg-indigo-600 hover:bg-indigo-500 w-28 justify-center">
        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        <span>{isPlaying ? 'Pause' : 'Play'}</span>
      </ControlButton>
      
      <div className="flex items-center gap-2">
        <button onClick={handleMuteToggle} disabled={!hasVideo} className="p-2 rounded-md hover:bg-gray-700 disabled:cursor-not-allowed transition-colors">
            {getVolumeIcon()}
        </button>
        <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localVolume}
            disabled={!hasVideo}
            onInput={(e) => setLocalVolume(parseFloat(e.currentTarget.value))}
            onMouseUp={() => onVolumeChange(localVolume)}
            onTouchEnd={() => onVolumeChange(localVolume)}
            className="w-24 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed disabled:accent-gray-500"
            title={`Volume: ${Math.round(localVolume * 100)}%`}
        />
      </div>

      <div className="flex items-center gap-2 pl-2">
        <SpeedIcon className={`w-5 h-5 ${hasVideo ? '' : 'text-gray-500'}`} />
        <select 
            value={playbackSpeed} 
            onChange={(e) => onPlaybackSpeedChange(parseFloat(e.target.value))}
            disabled={!hasVideo}
            className="bg-gray-700 border-none text-white text-sm rounded-md focus:ring-indigo-500 pr-8 disabled:text-gray-500 disabled:cursor-not-allowed"
            title="Playback Speed"
        >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x (Normal)</option>
            <option value="1.2">1.2x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
        </select>
      </div>

      <div className="h-8 border-l border-gray-600"></div>
      
      <ControlButton onClick={onUndo} disabled={!canUndo} title="Undo">
        <UndoIcon className="w-5 h-5" />
      </ControlButton>
      <ControlButton onClick={onRedo} disabled={!canRedo} title="Redo">
        <RedoIcon className="w-5 h-5" />
      </ControlButton>
      
      <ControlButton onClick={onCropToggle} disabled={!hasVideo} className={isCropping ? 'bg-indigo-600 hover:bg-indigo-500' : ''}>
        <CropIcon className="w-5 h-5" />
        <span>Crop</span>
      </ControlButton>
       <ControlButton onClick={onAddImage} disabled={!hasVideo}>
        <ImageIcon className="w-5 h-5" />
        <span>Add Image</span>
      </ControlButton>
      <ControlButton onClick={onAddText} disabled={!hasVideo}>
        <TextIcon className="w-5 h-5" />
        <span>Add Text</span>
      </ControlButton>
      
      <div className="h-8 border-l border-gray-600"></div>

      <ControlButton onClick={onAutoEdit} disabled={!hasVideo} className="bg-purple-600 hover:bg-purple-500" title="Auto Edit for Reels">
        <AutoEditIcon className="w-5 h-5" />
        <span>Auto Edit</span>
      </ControlButton>

      <ControlButton onClick={onExportClick} disabled={!hasVideo} className="bg-green-600 hover:bg-green-500">
        <DownloadIcon className="w-5 h-5" />
        <span>Export</span>
      </ControlButton>
    </div>
  );
};

export default Controls;