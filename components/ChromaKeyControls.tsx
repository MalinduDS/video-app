import React, { useState, useEffect } from 'react';
import { Clip, ChromaKeySettings } from '../types';

interface ChromaKeyControlsProps {
    clips: Clip[];
    onChromaKeyChange: (clipIndex: number, newSettings: ChromaKeySettings) => void;
}

const ChromaKeyControls: React.FC<ChromaKeyControlsProps> = ({ clips, onChromaKeyChange }) => {
    const [selectedClipIndex, setSelectedClipIndex] = useState(0);
    const selectedClip = clips[selectedClipIndex];
    const settings = selectedClip?.chromaKey;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value, type, checked } = e.target;
        const newSettings = {
            ...settings,
            [name]: type === 'checkbox' ? checked : type === 'range' ? parseFloat(value) : value,
        };
        onChromaKeyChange(selectedClipIndex, newSettings);
    };

    const ClipTab: React.FC<{index: number, label: string}> = ({index, label}) => (
        <button
            onClick={() => setSelectedClipIndex(index)}
            disabled={!clips[index]}
            className={`px-3 py-1 text-sm rounded-md transition ${selectedClipIndex === index ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'} disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed`}
        >{label}</button>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-1 bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-300 px-2">Editing Clip:</span>
                <div className="flex gap-2">
                   <ClipTab index={0} label="A"/>
                   <ClipTab index={1} label="B"/>
                </div>
            </div>

            {!selectedClip && (
                <p className="text-sm text-gray-500 text-center pt-4">Select a clip to edit its chroma key settings.</p>
            )}

            {selectedClip && settings && (
                 <div className="space-y-3 pt-2">
                    <label htmlFor="enabled" className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="enabled"
                            name="enabled"
                            checked={settings.enabled}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-200">Enable Chroma Key (Green Screen)</span>
                    </label>

                    {settings.enabled && (
                        <div className="pl-6 space-y-3 border-l-2 border-gray-700 ml-2">
                            <div className="flex items-center gap-4">
                                <label htmlFor="color" className="text-sm text-gray-300">Key Color</label>
                                <input 
                                    type="color" 
                                    id="color"
                                    name="color"
                                    value={settings.color}
                                    onChange={handleChange}
                                    className="w-10 h-8 bg-gray-700 border border-gray-600 rounded-md p-1 cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">
                                    Similarity
                                    <span className="text-indigo-400 font-mono ml-2">{(settings.similarity * 100).toFixed(0)}%</span>
                                </label>
                                <input
                                    type="range"
                                    name="similarity"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={settings.similarity}
                                    onChange={handleChange}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
                                />
                            </div>
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

export default ChromaKeyControls;
