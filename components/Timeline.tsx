import React, { useRef } from 'react';
import { TextOverlay, Clip, Transition, ImageOverlay } from '../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  clips: Clip[];
  transition: Transition;
  textOverlays: TextOverlay[];
  imageOverlays: ImageOverlay[];
  onTimeChange: (time: number) => void;
}

const OverlayBar: React.FC<{ overlay: TextOverlay | ImageOverlay, duration: number, className: string }> = ({ overlay, duration, className }) => {
    const left = duration > 0 ? (overlay.startTime / duration) * 100 : 0;
    const width = duration > 0 ? ((overlay.endTime - overlay.startTime) / duration) * 100 : 0;
    return (
        <div 
            className={`absolute h-3 rounded flex items-center justify-center ${className}`} 
            style={{ left: `${left}%`, width: `${width}%`}}
            title={`Layer ${overlay.zIndex}`}
        >
            <span className="text-white text-[8px] font-bold opacity-70">{overlay.zIndex}</span>
        </div>
    )
}


const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  clips,
  transition,
  textOverlays,
  imageOverlays,
  onTimeChange,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    onTimeChange(duration * percentage);
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  const clipA = clips[0];
  const clipB = clips[1];
  const durationA = clipA ? clipA.trimEnd - clipA.trimStart : 0;
  const transitionDuration = transition.type !== 'none' && clipA && clipB ? transition.duration : 0;

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div
        ref={timelineRef}
        className="w-full h-20 bg-gray-800 rounded-lg cursor-pointer relative"
        onClick={handleTimelineClick}
      >
        <div className="absolute top-0 left-0 h-full w-full p-1">
            <div className="relative w-full h-full">
                {/* Clip A */}
                {clipA && (
                    <div 
                        className="absolute top-0 h-8 bg-indigo-500/50 rounded-l-md"
                        style={{
                            left: 0,
                            width: duration > 0 ? `${(durationA / duration) * 100}%` : '0%'
                        }}
                    ></div>
                )}
                {/* Clip B */}
                {clipB && clipA && (
                     <div 
                        className="absolute top-0 h-8 bg-purple-500/50 rounded-r-md"
                        style={{
                            left: duration > 0 ? `${(durationA - transitionDuration) / duration * 100}%` : '0%',
                            right: 0
                        }}
                    ></div>
                )}
                {/* Transition */}
                {transition.type !== 'none' && clipA && clipB && (
                     <div 
                        className="absolute top-0 h-8 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 opacity-70"
                        style={{
                            left: duration > 0 ? `${(durationA - transition.duration) / duration * 100}%` : '0%',
                            width: duration > 0 ? `${(transition.duration / duration) * 100}%` : '0%'
                        }}
                    ></div>
                )}
                
                {/* Image Overlays */}
                {imageOverlays.map(overlay => (
                   <OverlayBar key={overlay.id} overlay={overlay} duration={duration} className="bottom-6 bg-yellow-500/70" />
                ))}

                 {/* Text Overlays */}
                {textOverlays.map(overlay => (
                    <OverlayBar key={overlay.id} overlay={overlay} duration={duration} className="bottom-1 bg-pink-500/70" />
                ))}
            </div>
        </div>


        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500 z-10 pointer-events-none"
          style={{ left: `${playheadPosition}%` }}
        >
          <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-red-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;