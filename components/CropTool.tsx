import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Crop } from '../types';

interface CropToolProps {
  crop: Crop;
  onCropChange: (crop: Crop) => void;
}

type Handle = 'topLeft' | 'top' | 'topRight' | 'left' | 'right' | 'bottomLeft' | 'bottom' | 'bottomRight' | 'move';

const CropTool: React.FC<CropToolProps> = ({ crop, onCropChange }) => {
  const [activeHandle, setActiveHandle] = useState<Handle | null>(null);
  const [localCrop, setLocalCrop] = useState<Crop>(crop);
  const toolRef = useRef<HTMLDivElement>(null);
  const startCropRef = useRef<Crop | null>(null);
  const startMousePosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setLocalCrop(crop);
  }, [crop]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handle);
    startCropRef.current = localCrop;
    if (toolRef.current) {
        const rect = toolRef.current.getBoundingClientRect();
        startMousePosRef.current = {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
        };
    }
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeHandle || !toolRef.current || !startCropRef.current || !startMousePosRef.current) return;
    
    const rect = toolRef.current.getBoundingClientRect();
    const currentMousePos = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
    };

    const dx = (currentMousePos.x - startMousePosRef.current.x) * 100;
    const dy = (currentMousePos.y - startMousePosRef.current.y) * 100;

    let newCrop = { ...startCropRef.current };

    if (activeHandle === 'move') {
      newCrop.x += dx;
      newCrop.y += dy;
    } else {
        if (activeHandle.includes('Right')) {
            newCrop.width += dx;
        }
        if (activeHandle.includes('Left')) {
            newCrop.width -= dx;
            newCrop.x += dx;
        }
        if (activeHandle.includes('Bottom')) {
            newCrop.height += dy;
        }
        if (activeHandle.includes('Top')) {
            newCrop.height -= dy;
            newCrop.y += dy;
        }
    }
    
    // Constraints to keep crop box valid and within bounds
    if (newCrop.width < 5) {
        if(activeHandle.includes('Left')) newCrop.x = startCropRef.current.x + startCropRef.current.width - 5;
        newCrop.width = 5;
    }
    if (newCrop.height < 5) {
        if(activeHandle.includes('Top')) newCrop.y = startCropRef.current.y + startCropRef.current.height - 5;
        newCrop.height = 5;
    }

    newCrop.x = Math.max(0, Math.min(newCrop.x, 100 - newCrop.width));
    newCrop.y = Math.max(0, Math.min(newCrop.y, 100 - newCrop.height));
    newCrop.width = Math.min(newCrop.width, 100 - newCrop.x);
    newCrop.height = Math.min(newCrop.height, 100 - newCrop.y);

    setLocalCrop(newCrop);

  }, [activeHandle]);

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
    if (JSON.stringify(localCrop) !== JSON.stringify(crop)) {
        onCropChange(localCrop);
    }
  }, [localCrop, crop, onCropChange]);
  
  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  return (
    <div ref={toolRef} className="absolute inset-0 z-20">
      <div 
        className="absolute border-2 border-dashed border-white cursor-move"
        style={{
          left: `${localCrop.x}%`,
          top: `${localCrop.y}%`,
          width: `${localCrop.width}%`,
          height: `${localCrop.height}%`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-nwse-resize" onMouseDown={e => handleMouseDown(e, 'topLeft')}></div>
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full cursor-ns-resize" onMouseDown={e => handleMouseDown(e, 'top')}></div>
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-nesw-resize" onMouseDown={e => handleMouseDown(e, 'topRight')}></div>
        <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white rounded-full cursor-ew-resize" onMouseDown={e => handleMouseDown(e, 'left')}></div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white rounded-full cursor-ew-resize" onMouseDown={e => handleMouseDown(e, 'right')}></div>
        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-nesw-resize" onMouseDown={e => handleMouseDown(e, 'bottomLeft')}></div>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full cursor-ns-resize" onMouseDown={e => handleMouseDown(e, 'bottom')}></div>
        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-nwse-resize" onMouseDown={e => handleMouseDown(e, 'bottomRight')}></div>

        <div className="absolute top-1/3 left-0 w-full h-px bg-white/50"></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-white/50"></div>
        <div className="absolute left-1/3 top-0 h-full w-px bg-white/50"></div>
        <div className="absolute left-2/3 top-0 h-full w-px bg-white/50"></div>
      </div>
    </div>
  );
};

export default CropTool;