import React, { useState, useEffect, useRef } from 'react';
import { ImageOverlay, AnimationInType, AnimationOutType, ChromaKeySettings } from '../types';
import { XIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface ImageOverlayEditorProps {
  overlay: ImageOverlay;
  onSave: (overlay: ImageOverlay) => void;
  onClose: () => void;
  onReorder: (direction: 'up' | 'down') => void;
  isTopLayer: boolean;
  isBottomLayer: boolean;
}

const ANIMATION_IN_OPTIONS: { value: AnimationInType, label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'fade-in', label: 'Fade In' },
    { value: 'slide-in-left', label: 'Slide In Left' },
    { value: 'slide-in-right', label: 'Slide In Right' },
    { value: 'slide-in-top', label: 'Slide In Top' },
    { value: 'slide-in-bottom', label: 'Slide In Bottom' },
    { value: 'slide-in-center', label: 'Slide In Center' },
];

const ANIMATION_OUT_OPTIONS: { value: AnimationOutType, label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'fade-out', label: 'Fade Out' },
    { value: 'slide-out-left', label: 'Slide Out Left' },
    { value: 'slide-out-right', label: 'Slide Out Right' },
    { value: 'slide-out-top', label: 'Slide Out Top' },
    { value: 'slide-out-bottom', label: 'Slide Out Bottom' },
    { value: 'slide-out-center', label: 'Slide Out Center' },
];

const Slider: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name: string, min?: number, max?: number, step?: number}> = 
({ label, name, value, onChange, min = 0, max = 100, step = 1 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label} ({value})</label>
        <input type="range" id={name} name={name} value={value} onChange={onChange} min={min} max={max} step={step}
               className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
    </div>
);

const NumberInput: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name: string, step?: number }> =
({ label, name, value, onChange, step=0.1 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input type="number" id={name} name={name} value={value} onChange={onChange} step={step}
               className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
)

const ImageOverlayEditor: React.FC<ImageOverlayEditorProps> = ({ overlay, onSave, onClose, onReorder, isTopLayer, isBottomLayer }) => {
  const [editedOverlay, setEditedOverlay] = useState<ImageOverlay>(overlay);
  const svgMaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedOverlay(overlay);
  }, [overlay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedOverlay(prev => ({
      ...prev,
      [name]: e.target.type === 'number' || e.target.type === 'range' ? parseFloat(value) : value,
    }));
  };

  const handleMaskChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedOverlay(prev => ({
        ...prev,
        mask: {
            ...prev.mask,
            [name]: e.target.type === 'range' ? parseFloat(value) : value,
        }
    }));
  };

  const handleChromaKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
     setEditedOverlay(prev => ({
        ...prev,
        chromaKey: {
            ...prev.chromaKey,
            [name]: type === 'checkbox' ? checked : type === 'range' ? parseFloat(value) : value,
        }
    }));
  }

   const handleSvgMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const svgContent = event.target?.result as string;
        setEditedOverlay(prev => ({
          ...prev,
          mask: { ...prev.mask, customSvg: svgContent }
        }));
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid SVG file.");
    }
  };

  const handleSave = () => {
    onSave(editedOverlay);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl shadow-xl relative flex gap-6" style={{maxHeight: '90vh'}}>
        <input type="file" accept="image/svg+xml" ref={svgMaskInputRef} onChange={handleSvgMaskUpload} className="hidden" />
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6"/>
        </button>
        <div className="w-1/3 flex-shrink-0">
          <h3 className="text-lg font-bold mb-2">Preview</h3>
          <div className="aspect-video bg-gray-900/50 rounded-md flex items-center justify-center p-2">
            <img src={editedOverlay.src} alt="Overlay preview" className="max-w-full max-h-full" />
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Edit Image Overlay</h2>
          
          <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Start Time (s)" name="startTime" value={editedOverlay.startTime} onChange={handleChange} />
              <NumberInput label="End Time (s)" name="endTime" value={editedOverlay.endTime} onChange={handleChange} />
            </div>
            
            <Slider label="Size (%)" name="width" value={editedOverlay.width} onChange={handleChange} min={1} max={100} />
            <Slider label="Position X (%)" name="left" value={editedOverlay.left} onChange={handleChange} />
            <Slider label="Position Y (%)" name="top" value={editedOverlay.top} onChange={handleChange} />
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="animationIn" className="block text-sm font-medium text-gray-300 mb-1">Animation In</label>
                    <select id="animationIn" name="animationIn" value={editedOverlay.animationIn} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {ANIMATION_IN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="animationOut" className="block text-sm font-medium text-gray-300 mb-1">Animation Out</label>
                    <select id="animationOut" name="animationOut" value={editedOverlay.animationOut} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {ANIMATION_OUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-700/50">
                <h3 className="text-md font-medium text-gray-200 mb-2">Layering (Stack Order)</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onReorder('up')} 
                        disabled={isTopLayer}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowUpIcon className="w-5 h-5"/> Bring Forward
                    </button>
                    <button 
                        onClick={() => onReorder('down')} 
                        disabled={isBottomLayer}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowDownIcon className="w-5 h-5"/> Send Backward
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-700/50">
              <h3 className="text-md font-medium text-gray-200 mb-2">Mask</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                            <label htmlFor="mask.shape" className="block text-sm font-medium text-gray-300 mb-1">Shape</label>
                            <select
                                id="mask.shape"
                                name="shape"
                                value={editedOverlay.mask?.shape || 'none'}
                                onChange={handleMaskChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="none">None</option>
                                <option value="rectangle">Rectangle</option>
                                <option value="circle">Circle</option>
                                <option value="custom-svg">Custom SVG</option>
                            </select>
                        </div>
                        {editedOverlay.mask?.shape === 'rectangle' && (
                            <div>
                                <label htmlFor="mask.cornerRadius" className="block text-sm font-medium text-gray-300 mb-1">Corner Radius ({editedOverlay.mask.cornerRadius}%)</label>
                                <input
                                type="range"
                                id="mask.cornerRadius"
                                name="cornerRadius"
                                value={editedOverlay.mask.cornerRadius}
                                onChange={handleMaskChange}
                                min="0" max="50" step="1"
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                        )}
                    </div>
                    {editedOverlay.mask?.shape !== 'none' && (
                        <div>
                            <label htmlFor="mask.feather" className="block text-sm font-medium text-gray-300 mb-1">Edge Feather ({editedOverlay.mask.feather}px)</label>
                            <input
                                type="range"
                                id="mask.feather"
                                name="feather"
                                value={editedOverlay.mask.feather}
                                onChange={handleMaskChange}
                                min="0" max="20" step="0.5"
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    )}
                    {editedOverlay.mask?.shape === 'custom-svg' && (
                        <div>
                            <button 
                                onClick={() => svgMaskInputRef.current?.click()}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                            >
                                Upload SVG Mask
                            </button>
                            <p className="text-xs text-gray-400 mt-2 text-center">Note: Custom SVG & feathered masks are for preview only and will appear as hard-edged shapes in the exported video.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="pt-4 border-t border-gray-700/50">
              <h3 className="text-md font-medium text-gray-200 mb-2">Chroma Key (Green Screen)</h3>
              <div className="space-y-3">
                <label htmlFor="chromaKey.enabled" className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="chromaKey.enabled" name="enabled" checked={editedOverlay.chromaKey.enabled} onChange={handleChromaKeyChange}
                           className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">Enable Chroma Key</span>
                </label>
                {editedOverlay.chromaKey.enabled && (
                    <>
                        <div className="flex items-center gap-4">
                            <label htmlFor="chromaKey.color" className="text-sm">Key Color</label>
                            <input type="color" id="chromaKey.color" name="color" value={editedOverlay.chromaKey.color} onChange={handleChromaKeyChange}
                                   className="w-10 h-8 bg-gray-700 border border-gray-600 rounded-md p-1 cursor-pointer" />
                        </div>
                        <div>
                            <label htmlFor="chromaKey.similarity" className="block text-sm font-medium text-gray-300 mb-1">Similarity ({(editedOverlay.chromaKey.similarity * 100).toFixed(0)}%)</label>
                            <input type="range" id="chromaKey.similarity" name="similarity" value={editedOverlay.chromaKey.similarity} onChange={handleChromaKeyChange} min="0" max="1" step="0.01"
                                   className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                        </div>
                    </>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end flex-shrink-0">
            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOverlayEditor;