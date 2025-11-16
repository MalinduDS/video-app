import React, { useState, useEffect } from 'react';
import { Clip, Transform } from '../types';

interface TransformControlsProps {
    clips: Clip[];
    onTransformChange: (clipIndex: number, transformType: 'startTransform' | 'endTransform', newTransform: Transform) => void;
}

const TransformSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onInput: (value: number) => void;
    onCommit: () => void;
    disabled: boolean;
}> = ({ label, value, min, max, step, onInput, onCommit, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300">
            {label}
            <span className="text-indigo-400 font-mono ml-2">{value.toFixed(2)}</span>
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

const TransformControls: React.FC<TransformControlsProps> = ({ clips, onTransformChange }) => {
    const [selectedClipIndex, setSelectedClipIndex] = useState(0);
    const [transformType, setTransformType] = useState<'startTransform' | 'endTransform'>('startTransform');
    const [localTransform, setLocalTransform] = useState<Transform | undefined>(undefined);

    const selectedClip = clips[selectedClipIndex];
    const activeTransform = selectedClip?.[transformType];

    useEffect(() => {
        setLocalTransform(activeTransform);
    }, [activeTransform]);

    const handleValueChange = (key: 'scale' | 'x' | 'y', value: number) => {
        if (localTransform) {
            const newTransform = { ...localTransform, [key]: value };
            setLocalTransform(newTransform);
        }
    };

    const commitValueChange = () => {
        if (localTransform && selectedClip) {
            if (JSON.stringify(localTransform) !== JSON.stringify(activeTransform)) {
                onTransformChange(selectedClipIndex, transformType, localTransform);
            }
        }
    };

    const handleReset = () => {
         if (selectedClip) {
            const defaultTransform = { scale: 1, x: 0, y: 0 };
            setLocalTransform(defaultTransform);
            onTransformChange(selectedClipIndex, transformType, defaultTransform);
        }
    }

    const ClipTab: React.FC<{index: number, label: string}> = ({index, label}) => (
        <button
            onClick={() => setSelectedClipIndex(index)}
            disabled={!clips[index]}
            className={`px-3 py-1 text-sm rounded-md transition ${selectedClipIndex === index ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'} disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed`}
        >{label}</button>
    );

    const TypeButton: React.FC<{type: 'startTransform' | 'endTransform', label: string}> = ({type, label}) => (
        <button
            onClick={() => setTransformType(type)}
            className={`px-4 py-2 text-sm font-medium w-full rounded-md transition ${transformType === type ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >{label}</button>
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-1 bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-300 px-2">Editing Clip:</span>
                <div className="flex gap-2">
                   <ClipTab index={0} label="A"/>
                   <ClipTab index={1} label="B"/>
                </div>
            </div>
            
             <div className="flex items-center gap-2 p-1 bg-gray-700 rounded-lg">
                <TypeButton type="startTransform" label="Start"/>
                <TypeButton type="endTransform" label="End"/>
            </div>

            <div className="space-y-3 pt-2">
                <TransformSlider 
                    label="Zoom (Scale)"
                    value={localTransform?.scale ?? 1}
                    min={1} max={3} step={0.01}
                    onInput={(v) => handleValueChange('scale', v)}
                    onCommit={commitValueChange}
                    disabled={!selectedClip}
                />
                 <TransformSlider 
                    label="Pan X"
                    value={localTransform?.x ?? 0}
                    min={-50} max={50} step={0.5}
                    onInput={(v) => handleValueChange('x', v)}
                    onCommit={commitValueChange}
                    disabled={!selectedClip}
                />
                 <TransformSlider 
                    label="Pan Y"
                    value={localTransform?.y ?? 0}
                    min={-50} max={50} step={0.5}
                    onInput={(v) => handleValueChange('y', v)}
                    onCommit={commitValueChange}
                    disabled={!selectedClip}
                />
            </div>
             <button
                onClick={handleReset}
                disabled={!selectedClip}
                className="w-full mt-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                Reset {transformType === 'startTransform' ? 'Start' : 'End'} Transform
            </button>
        </div>
    );
};

export default TransformControls;