import React, { useState } from 'react';
import { Filter, Effect, Clip } from '../types';
import { EditorState } from '../hooks/useHistory';
import FilterStrip from './FilterStrip';
import EffectStrip from './EffectStrip';
import TransformControls from './TransformControls';
import AdjustControls from './AdjustControls';
import ChromaKeyControls from './ChromaKeyControls';

interface EditingToolsPanelProps {
  clips: Clip[];
  setEditorState: (action: (prevState: EditorState) => EditorState) => void;
  filters: Filter[];
  effects: Effect[];
  selectedFilter: Filter;
  selectedEffect: Effect;
  onSelectFilter: (filter: Filter) => void;
  onSelectEffect: (effect: Effect) => void;
}

type ActiveTab = 'filters' | 'effects' | 'transform' | 'adjust' | 'keying';

const EditingToolsPanel: React.FC<EditingToolsPanelProps> = ({
  clips,
  setEditorState,
  filters,
  effects,
  selectedFilter,
  selectedEffect,
  onSelectFilter,
  onSelectEffect,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('filters');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'filters':
        return (
          <FilterStrip
            filters={filters}
            selectedFilter={selectedFilter}
            onSelectFilter={onSelectFilter}
          />
        );
      case 'effects':
        return (
          <EffectStrip
            effects={effects}
            selectedEffect={selectedEffect}
            onSelectEffect={onSelectEffect}
          />
        );
      case 'transform':
        return (
          <TransformControls
            clips={clips}
            onTransformChange={(clipIndex, transformType, newTransform) => {
              setEditorState(prev => {
                const newClips = [...prev.clips];
                if (newClips[clipIndex]) {
                  newClips[clipIndex] = {
                    ...newClips[clipIndex],
                    [transformType]: newTransform,
                  };
                }
                return { ...prev, clips: newClips };
              });
            }}
          />
        );
       case 'adjust':
        return (
          <AdjustControls
            clips={clips}
            setEditorState={setEditorState}
          />
        );
      case 'keying':
        return (
          <ChromaKeyControls
            clips={clips}
            onChromaKeyChange={(clipIndex, newSettings) => {
                setEditorState(prev => {
                    const newClips = [...prev.clips];
                    if(newClips[clipIndex]) {
                        newClips[clipIndex] = { ...newClips[clipIndex], chromaKey: newSettings };
                    }
                    return { ...prev, clips: newClips };
                })
            }}
          />
        );
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tab: ActiveTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
        activeTab === tab
          ? 'bg-gray-700 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-800 rounded-lg flex flex-col flex-grow">
      <div className="flex border-b border-gray-700">
        <TabButton tab="filters" label="Filters" />
        <TabButton tab="effects" label="Effects" />
        <TabButton tab="transform" label="Transform" />
        <TabButton tab="adjust" label="Adjust" />
        <TabButton tab="keying" label="Keying" />
      </div>
      <div className="p-4 flex-grow overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EditingToolsPanel;