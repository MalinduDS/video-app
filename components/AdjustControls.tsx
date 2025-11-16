import React, { useState, useEffect } from 'react';
import { Clip, ColorGradingSettings } from '../types';
import { EditorState } from '../hooks/useHistory';

interface AdjustControlsProps {
    clips: Clip[];
    setEditorState: (action: (prevState: EditorState) => EditorState) => void;
}

const AdjustSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onInput: (value: number) => void;
    onCommit: () => void;
    disabled: boolean;
}> = ({ label, value, min, max, step, unit, onInput, onCommit, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300">
            {label}
            <span className="text-indigo-400 font-mono ml-2">{value.toFixed(unit === 'px' ? 1 : 0)}{unit}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onInput={(e) => onInput(parseFloat((e.target as HTMLInputElement).value))}
            onMouseUp={onCommit}
            onTouchEnd={onCommit}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed disabled:accent-gray-500 mt-1"
        />
    </div>
);


const AdjustControls: React.FC<AdjustControlsProps> = ({ clips, setEditorState }) => {
    const [selectedClipIndex, setSelectedClipIndex] = useState(0);
    const selectedClip = clips[selectedClipIndex];

    const [localBlur, setLocalBlur] = useState(0);
    const [localGrading, setLocalGrading] = useState<ColorGradingSettings>({ brightness: 100, saturation: 100, hue: 0 });

    useEffect(() => {
        if (selectedClip) {
            setLocalBlur(selectedClip.blur);
            setLocalGrading(selectedClip.colorGrading);
        }
    }, [selectedClip]);

    const handleCommit = () => {
        if (!selectedClip) return;
        if (localBlur !== selectedClip.blur || JSON.stringify(localGrading) !== JSON.stringify(selectedClip.colorGrading)) {
            setEditorState(prev => {
                const newClips = [...prev.clips];
                newClips[selectedClipIndex] = {
                    ...newClips[selectedClipIndex],
                    blur: localBlur,
                    colorGrading: localGrading,
                };
                return { ...prev, clips: newClips };
            });
        }
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
                <p className="text-sm text-gray-500 text-center pt-4">Select a clip to make adjustments.</p>
            )}

            {selectedClip && (
                <div className="space-y-3 pt-2">
                    <AdjustSlider
                        label="Blur"
                        value={localBlur}
                        min={0} max={20} step={0.1} unit="px"
                        onInput={setLocalBlur}
                        onCommit={handleCommit}
                        disabled={!selectedClip}
                    />
                     <AdjustSlider
                        label="Brightness"
                        value={localGrading.brightness}
                        min={0} max={200} step={1} unit="%"
                        onInput={(v) => setLocalGrading(g => ({...g, brightness: v}))}
                        onCommit={handleCommit}
                        disabled={!selectedClip}
                    />
                     <AdjustSlider
                        label="Saturation"
                        value={localGrading.saturation}
                        min={0} max={200} step={1} unit="%"
                        onInput={(v) => setLocalGrading(g => ({...g, saturation: v}))}
                        onCommit={handleCommit}
                        disabled={!selectedClip}
                    />
                     <AdjustSlider
                        label="Hue"
                        value={localGrading.hue}
                        min={-180} max={180} step={1} unit="deg"
                        onInput={(v) => setLocalGrading(g => ({...g, hue: v}))}
                        onCommit={handleCommit}
                        disabled={!selectedClip}
                    />
                </div>
            )}
        </div>
    );
};

export default AdjustControls;