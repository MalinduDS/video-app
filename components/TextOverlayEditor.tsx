import React, { useState, useEffect, useRef } from 'react';
import { TextOverlay, AnimationInType, AnimationOutType } from '../types';
import { XIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface TextOverlayEditorProps {
  overlay: TextOverlay;
  onSave: (overlay: TextOverlay) => void;
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


const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({ overlay, onSave, onClose, onReorder, isTopLayer, isBottomLayer }) => {
  const [editedOverlay, setEditedOverlay] = useState<TextOverlay>(overlay);
  const svgMaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedOverlay(overlay);
  }, [overlay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedOverlay(prev => ({
      ...prev,
      [name]: name === 'fontSize' ? parseInt(value, 10) : value,
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
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <input type="file" accept="image/svg+xml" ref={svgMaskInputRef} onChange={handleSvgMaskUpload} className="hidden" />
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6"/>
        </button>
        <h2 className="text-2xl font-bold mb-4">Edit Text Overlay</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-300 mb-1">Text</label>
            <input
              type="text"
              id="text"
              name="text"
              value={editedOverlay.text}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="fontSize" className="block text-sm font-medium text-gray-300 mb-1">Font Size</label>
              <input
                type="number"
                id="fontSize"
                name="fontSize"
                value={editedOverlay.fontSize}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-1">Color</label>
              <input
                type="color"
                id="color"
                name="color"
                value={editedOverlay.color}
                onChange={handleChange}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md p-1 cursor-pointer"
              />
            </div>
          </div>
           <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="animationIn" className="block text-sm font-medium text-gray-300 mb-1">Animation In</label>
              <select
                id="animationIn"
                name="animationIn"
                value={editedOverlay.animationIn}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ANIMATION_IN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="animationOut" className="block text-sm font-medium text-gray-300 mb-1">Animation Out</label>
              <select
                id="animationOut"
                name="animationOut"
                value={editedOverlay.animationOut}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ANIMATION_OUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Layering (Stack Order)</h3>
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

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Mask</h3>
             <div className="space-y-3">
                <div className="flex gap-4 items-center">
                    <div className="flex-1">
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
                        <div className="flex-1">
                            <label htmlFor="mask.cornerRadius" className="block text-sm font-medium text-gray-300 mb-1">Corner Radius ({editedOverlay.mask.cornerRadius}%)</label>
                            <input
                              type="range"
                              id="mask.cornerRadius"
                              name="cornerRadius"
                              value={editedOverlay.mask.cornerRadius}
                              onChange={handleMaskChange}
                              min="0"
                              max="50"
                              step="1"
                              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2.5"
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

        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextOverlayEditor;