import React, { useCallback, useState, DragEvent } from 'react';
import { UploadCloudIcon, XIcon, ReverseIcon } from './icons';
import { Clip } from '../types';

interface ClipManagerProps {
  clipA?: Clip;
  clipB?: Clip;
  onAddClip: (file: File, index: 0 | 1) => void;
  onRemoveClip: (index: 0 | 1) => void;
  onSwapClips: () => void;
  onToggleReverse: (index: 0 | 1) => void;
}

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const ClipSlot: React.FC<{
    clip?: Clip;
    onFileChange: (file: File) => void;
    onRemove: () => void;
    onToggleReverse: () => void;
    label: string;
    isBeingDragged: boolean;
    isDraggedOver: boolean;
    onDragStart: () => void;
    onDragEnter: () => void;
    onDragLeave: () => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: () => void;
    onDragEnd: () => void;
}> = ({ clip, onFileChange, onRemove, onToggleReverse, label, isBeingDragged, isDraggedOver, ...dragProps }) => {
    const [isInputDragging, setIsInputDragging] = useState(false);

    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('video/')) {
                onFileChange(file);
            } else {
                alert('Please select a valid video file.');
            }
        }
    };
    
    const onInputDragEnter = useCallback((e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsInputDragging(true); }, []);
    const onInputDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsInputDragging(false); }, []);
    const onInputDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
    const onInputDrop = useCallback((e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsInputDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [onFileChange]);

    if (clip) {
        return (
            <div 
                draggable={!!clip}
                onDragStart={dragProps.onDragStart}
                onDragEnter={dragProps.onDragEnter}
                onDragLeave={dragProps.onDragLeave}
                onDragOver={dragProps.onDragOver}
                onDrop={dragProps.onDrop}
                onDragEnd={dragProps.onDragEnd}
                className={`bg-gray-700 p-2 rounded-lg flex items-center gap-3 cursor-grab transition-all duration-300
                    ${isBeingDragged ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}
                    ${isDraggedOver ? 'ring-2 ring-indigo-500 ring-inset' : ''}
                `}
            >
                <img 
                    src={clip.thumbnailUrl} 
                    alt={clip.file.name} 
                    className="w-20 h-12 object-cover rounded-md bg-gray-900 pointer-events-none" 
                />
                <div className="flex-grow overflow-hidden pointer-events-none">
                    <p className="text-sm font-medium truncate" title={clip.file.name}>{clip.file.name}</p>
                    <p className="text-xs text-gray-400">Duration: {formatDuration(clip.duration)}</p>
                </div>
                 <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={onToggleReverse} title="Reverse Clip" className={`p-1 rounded-full hover:bg-gray-600 transition-colors ${clip.isReversed ? 'bg-indigo-600 text-white' : ''}`}>
                        <ReverseIcon className="w-4 h-4" />
                    </button>
                    <button onClick={onRemove} title="Remove Clip" className="p-1 rounded-full hover:bg-gray-600 transition-colors">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
         <label
            htmlFor={`file-upload-${label}`}
            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isInputDragging ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
            } ${isDraggedOver ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
            onDragEnter={onInputDragEnter}
            onDragLeave={onInputDragLeave}
            onDragOver={onInputDragOver}
            onDrop={onInputDrop}
            onDragEnd={dragProps.onDragEnd}
        >
            <div
              onDragEnter={dragProps.onDragEnter}
              onDragLeave={dragProps.onDragLeave}
              onDrop={dragProps.onDrop}
              className="w-full h-full flex flex-col items-center justify-center"
            >
                <UploadCloudIcon className="w-8 h-8 mb-1 text-gray-400" />
                <p className="text-xs text-gray-400">
                    <span className="font-semibold">Upload Clip {label}</span>
                </p>
            </div>
            <input
                id={`file-upload-${label}`}
                type="file"
                className="hidden"
                accept="video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
            />
        </label>
    )
}

const ClipManager: React.FC<ClipManagerProps> = ({ clipA, clipB, onAddClip, onRemoveClip, onSwapClips, onToggleReverse }) => {
  const [draggedIndex, setDraggedIndex] = useState<0 | 1 | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<0 | 1 | null>(null);

  const handleDragStart = (index: 0 | 1) => setDraggedIndex(index);
  
  const handleDragEnter = (index: 0 | 1) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDraggedOverIndex(index);
    }
  };

  const handleDragLeave = () => setDraggedOverIndex(null);

  const handleDrop = (targetIndex: 0 | 1) => {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onSwapClips();
    }
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-bold text-white mb-2">Clip Manager</h3>
        <ClipSlot 
            label="A"
            clip={clipA}
            onFileChange={(file) => onAddClip(file, 0)}
            onRemove={() => onRemoveClip(0)}
            onToggleReverse={() => onToggleReverse(0)}
            isBeingDragged={draggedIndex === 0}
            isDraggedOver={draggedOverIndex === 0}
            onDragStart={() => handleDragStart(0)}
            onDragEnter={() => handleDragEnter(0)}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(0)}
            onDragEnd={handleDragEnd}
        />
        <ClipSlot 
            label="B"
            clip={clipB}
            onFileChange={(file) => onAddClip(file, 1)}
            onRemove={() => onRemoveClip(1)}
            onToggleReverse={() => onToggleReverse(1)}
            isBeingDragged={draggedIndex === 1}
            isDraggedOver={draggedOverIndex === 1}
            onDragStart={() => handleDragStart(1)}
            onDragEnter={() => handleDragEnter(1)}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(1)}
            onDragEnd={handleDragEnd}
        />
    </div>
  );
};

export default ClipManager;